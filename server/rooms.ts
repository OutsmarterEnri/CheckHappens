import {
  randomBytes,
  randomInt,
  createHash,
  timingSafeEqual,
} from "node:crypto";
import { makeDeck } from "../src/domain/cards";
import { createGame, dispatch } from "../src/domain/turnResolver";
import {
  startingArmy,
  type SidePreference,
  type Minutes,
} from "../src/domain/match";
import { exportMatch, stateFromLog, type MatchLog } from "../src/domain/audit";
import { isOnlineCommand, type RoomView } from "../src/online/protocol";
import type { Player, State } from "../src/domain/types";
export class RoomError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
interface Room {
  id: string;
  inviteHash: string;
  tokens: Partial<Record<Player, string>>;
  state: State;
  revision: number;
  actionRevision: number;
  startsAt: number | null;
  startMono: number | null;
  createdAt: number;
  seen: Partial<Record<Player, number>>;
  accepted: Map<string, string>;
}
export interface SavedRoom {
  id: string;
  inviteHash: string;
  tokens: Room["tokens"];
  log: MatchLog;
  revision: number;
  actionRevision: number;
  startsAt: number | null;
  createdAt: number;
  savedAt: number;
  accepted: [string, string][];
}
const hash = (text: string) => createHash("sha256").update(text).digest("hex");
const equal = (a: string, b: string) =>
  a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const secret = () => randomBytes(32).toString("base64url");
export class RoomStore {
  readonly rooms = new Map<string, Room>();
  constructor(
    readonly clock = { mono: () => performance.now(), wall: () => Date.now() },
    readonly maxRooms = 32,
    readonly lifetime = 6 * 60 * 60 * 1000,
  ) {}
  create(minutes: unknown, side: unknown) {
    this.expire();
    if (this.rooms.size >= this.maxRooms)
      throw new RoomError(503, "ROOM_CAPACITY");
    if (
      ![4, 7, 10].includes(Number(minutes)) ||
      typeof minutes !== "number" ||
      !["white", "black", "random"].includes(String(side))
    )
      throw new RoomError(400, "INVALID_SETTINGS");
    const token = secret(),
      invite = secret(),
      id = randomBytes(12).toString("hex"),
      seed = randomBytes(4).readUInt32LE(0) || 1;
    const deck = makeDeck();
    for (let i = deck.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    const room: Room = {
      id,
      inviteHash: hash(invite),
      tokens: { P1: hash(token) },
      state: createGame(
        seed,
        this.clock.mono(),
        deck,
        minutes as Minutes,
        startingArmy(side as SidePreference, seed),
      ),
      revision: 0,
      actionRevision: 0,
      startsAt: null,
      startMono: null,
      createdAt: this.clock.wall(),
      seen: { P1: this.clock.wall() },
      accepted: new Map(),
    };
    this.rooms.set(id, room);
    return { roomId: id, token, invite, player: "P1" as const };
  }
  get(id: string) {
    this.expire();
    const room = this.rooms.get(id);
    if (!room) throw new RoomError(404, "ROOM_NOT_FOUND");
    return room;
  }
  authenticate(id: string, token: string) {
    const room = this.get(id),
      value = hash(token);
    for (const player of ["P1", "P2"] as const)
      if (room.tokens[player] && equal(room.tokens[player]!, value))
        return { room, player };
    throw new RoomError(401, "INVALID_ROOM_TOKEN");
  }
  join(id: string, invite: unknown) {
    const room = this.get(id);
    if (typeof invite !== "string" || !equal(room.inviteHash, hash(invite)))
      throw new RoomError(403, "INVALID_INVITE");
    if (room.tokens.P2) throw new RoomError(409, "ROOM_FULL");
    const token = secret();
    room.tokens.P2 = hash(token);
    room.seen.P2 = this.clock.wall();
    room.startsAt = this.clock.wall() + 3000;
    room.startMono = this.clock.mono() + 3000;
    room.revision++;
    return { roomId: id, token, player: "P2" as const };
  }
  tickRoom(room: Room) {
    const now = this.clock.mono();
    if (
      room.state.phase === "READY" &&
      room.startMono !== null &&
      now >= room.startMono
    ) {
      const start = room.startMono;
      room.state.clock.lastAt = Math.min(room.state.clock.lastAt, start);
      room.state = dispatch(
        room.state,
        { type: "StartGame" },
        start,
        "system",
      ).state;
      room.revision++;
      room.actionRevision++;
    }
    if (
      room.state.phase !== "READY" &&
      !room.state.outcome &&
      now > room.state.clock.lastAt
    ) {
      room.state = dispatch(
        room.state,
        { type: "AdvanceTime" },
        now,
        "clock",
      ).state;
      room.revision++;
    }
  }
  tick() {
    this.expire();
    for (const room of this.rooms.values()) this.tickRoom(room);
  }
  view(id: string, token: string): RoomView {
    const { room, player } = this.authenticate(id, token);
    this.tickRoom(room);
    room.seen[player] = this.clock.wall();
    const { journal: _journal, events, deck, ...body } = room.state;
    const state: State = {
      ...structuredClone(body),
      seed: 0,
      rng: 0,
      deck: deck.map(() => ({
        id: "redacted",
        kind: "number",
        color: null,
        value: 1,
      })),
      events: structuredClone(
        events
          .filter((e) => !["Checkpoint", "ClockAdvanced"].includes(e.type))
          .slice(-60)
          .map((e) =>
            e.type === "RiskResolved"
              ? {
                  ...e,
                  data: {
                    probability: e.data.probability,
                    destroyed: e.data.destroyed,
                    pieceId: e.data.pieceId,
                  },
                }
              : e,
          ),
      ),
    };
    return {
      roomId: id,
      revision: room.revision,
      actionRevision: room.actionRevision,
      state,
      joined: !!room.tokens.P2,
      startsAt: room.startsAt,
      serverNow: this.clock.wall(),
      totalMoves: room.state.events.filter((e) => e.type === "MoveCompleted")
        .length,
      opponentOnline:
        this.clock.wall() - (room.seen[player === "P1" ? "P2" : "P1"] ?? 0) <
        8000,
    };
  }
  command(id: string, token: string, body: unknown) {
    const { room, player } = this.authenticate(id, token);
    if (!body || typeof body !== "object")
      throw new RoomError(400, "INVALID_COMMAND");
    const { command, commandId, expectedRevision } = body as Record<
      string,
      unknown
    >;
    if (
      !isOnlineCommand(command) ||
      typeof commandId !== "string" ||
      !/^[-a-zA-Z0-9_]{12,100}$/.test(commandId) ||
      !Number.isSafeInteger(expectedRevision)
    )
      throw new RoomError(400, "INVALID_COMMAND");
    const key = player + ":" + commandId,
      signature = hash(JSON.stringify({ command, expectedRevision }));
    if (room.accepted.has(key)) {
      if (room.accepted.get(key) !== signature)
        throw new RoomError(409, "COMMAND_ID_REUSED");
      return this.view(id, token);
    }
    this.tickRoom(room);
    if (!room.tokens.P2 || room.state.phase === "READY")
      throw new RoomError(409, "MATCH_NOT_STARTED");
    if (room.state.outcome) throw new RoomError(409, "MATCH_FINISHED");
    if (room.state.active !== player) throw new RoomError(403, "NOT_YOUR_TURN");
    if (expectedRevision !== room.actionRevision)
      throw new RoomError(409, "STALE_REVISION");
    const result = dispatch(room.state, command, this.clock.mono(), "human");
    room.state = result.state;
    room.revision++;
    if (!result.ok) throw new RoomError(422, result.error.code);
    room.actionRevision++;
    room.accepted.set(key, signature);
    if (room.accepted.size > 512)
      room.accepted.delete(room.accepted.keys().next().value!);
    return this.view(id, token);
  }
  log(id: string, token: string) {
    const { room } = this.authenticate(id, token);
    this.tickRoom(room);
    if (!room.state.outcome)
      throw new RoomError(409, "LOG_AVAILABLE_AFTER_MATCH");
    return exportMatch(room.state);
  }
  expire() {
    for (const [id, r] of this.rooms)
      if (this.clock.wall() - r.createdAt > this.lifetime)
        this.rooms.delete(id);
  }
  save(): SavedRoom[] {
    return [...this.rooms.values()].map((r) => ({
      id: r.id,
      inviteHash: r.inviteHash,
      tokens: r.tokens,
      log: exportMatch(r.state),
      revision: r.revision,
      actionRevision: r.actionRevision,
      startsAt: r.startsAt,
      createdAt: r.createdAt,
      savedAt: this.clock.wall(),
      accepted: [...r.accepted],
    }));
  }
  restore(saved: SavedRoom[]) {
    for (const item of saved) {
      if (
        !/^[a-f0-9]{24}$/.test(item.id) ||
        this.clock.wall() - item.createdAt > this.lifetime
      )
        continue;
      const state = stateFromLog(item.log);
      state.clock.lastAt =
        this.clock.mono() -
        (state.phase === "READY"
          ? 0
          : Math.max(0, this.clock.wall() - item.savedAt));
      this.rooms.set(item.id, {
        id: item.id,
        inviteHash: item.inviteHash,
        tokens: item.tokens,
        state,
        revision: item.revision + 1,
        actionRevision: item.actionRevision,
        startsAt: item.startsAt,
        startMono:
          item.startsAt === null
            ? null
            : this.clock.mono() + (item.startsAt - this.clock.wall()),
        createdAt: item.createdAt,
        seen: {},
        accepted: new Map(item.accepted),
      });
    }
    this.tick();
  }
}
