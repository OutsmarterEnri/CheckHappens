import { computerCommand } from "../src/domain/computer";
import { demo } from "../src/domain/fixtures";
import { describe, it, expect } from "vitest";
import { RoomStore, RoomError } from "../server/rooms";
import { createGame } from "../src/domain/turnResolver";
import { verifyMatch, exportMatch } from "../src/domain/audit";
import { isOnlineCommand } from "../src/online/protocol";
import type { Card } from "../src/domain/types";
const cards: Card[] = [
  { id: "one", kind: "number", color: "blue", value: 2 },
  { id: "two", kind: "number", color: "blue", value: 1 },
  { id: "three", kind: "number", color: "blue", value: 1 },
];
function setup(side: "white" | "black" = "white") {
  const time = { mono: 0, wall: 100000 };
  const clock = { mono: () => time.mono, wall: () => time.wall };
  const store = new RoomStore(clock);
  const host = store.create(7, side),
    guest = store.join(host.roomId, host.invite);
  store.get(host.roomId).state = createGame(
    42,
    0,
    cards,
    7,
    side === "white" ? "w" : "b",
  );
  const advance = (ms: number) => {
    time.mono += ms;
    time.wall += ms;
    store.tick();
  };
  return { store, host, guest, time, clock, advance };
}
const request = (
  command: unknown,
  expectedRevision: number,
  commandId = "test-command-0001",
) => ({ command, expectedRevision, commandId });
describe("authoritative private rooms", () => {
  it("starts only after a second player joins and counts down without clock charge", () => {
    const { store, host, advance } = setup();
    expect(store.view(host.roomId, host.token).state.phase).toBe("READY");
    advance(2999);
    expect(store.get(host.roomId).state.clock.remaining.P1).toBe(420000);
    advance(1);
    expect(store.get(host.roomId).state.phase).toBe("RESOLVE_MOVES");
    expect(store.get(host.roomId).state.clock.remaining.P1).toBe(420000);
  });
  it("keeps White first when the host selects Black", () => {
    const { store, host, advance } = setup("black");
    advance(3000);
    const state = store.view(host.roomId, host.token).state;
    expect(state.active).toBe("P2");
    expect(state.control).toEqual({ P1: "b", P2: "w" });
  });
  it("checks tokens and consumes an invitation for exactly one guest", () => {
    const { store, host } = setup();
    expect(() => store.view(host.roomId, "wrong")).toThrow(
      "INVALID_ROOM_TOKEN",
    );
    expect(() => store.join(host.roomId, "wrong")).toThrow("INVALID_INVITE");
    expect(() => store.join(host.roomId, host.invite)).toThrow("ROOM_FULL");
    expect(JSON.stringify(store.save())).not.toContain(host.token);
    expect(JSON.stringify(store.save())).not.toContain(host.invite);
  });
  it("rejects wrong turns, client clock/start commands and malformed moves", () => {
    const { store, host, guest, advance } = setup();
    advance(3000);
    const revision = store.view(host.roomId, host.token).actionRevision;
    expect(() =>
      store.command(
        host.roomId,
        guest.token,
        request({ type: "SubmitMove", from: 48, to: 40 }, revision),
      ),
    ).toThrow("NOT_YOUR_TURN");
    for (const command of [
      { type: "AdvanceTime" },
      { type: "StartGame" },
      { type: "SubmitMove", from: -1, to: 99 },
      { type: "ChooseResurrections", pieceIds: null },
    ])
      expect(() =>
        store.command(host.roomId, host.token, request(command, revision)),
      ).toThrow("INVALID_COMMAND");
  });
  it("applies a repeated delivery exactly once and rejects stale or reused IDs", () => {
    const { store, host, advance } = setup();
    advance(3000);
    const revision = store.view(host.roomId, host.token).actionRevision;
    const body = request({ type: "SubmitMove", from: 8, to: 16 }, revision);
    const first = store.command(host.roomId, host.token, body),
      again = store.command(host.roomId, host.token, body);
    expect(again.state.moveIndex).toBe(first.state.moveIndex);
    expect(again.actionRevision).toBe(first.actionRevision);
    expect(() =>
      store.command(
        host.roomId,
        host.token,
        request(
          { type: "SubmitMove", from: 9, to: 17 },
          revision,
          "test-command-0002",
        ),
      ),
    ).toThrow("STALE_REVISION");
    expect(() =>
      store.command(
        host.roomId,
        host.token,
        request({ type: "SubmitMove", from: 9, to: 17 }, revision),
      ),
    ).toThrow("COMMAND_ID_REUSED");
    expect(verifyMatch(exportMatch(store.get(host.roomId).state)).valid).toBe(
      true,
    );
  });
  it("does not reject an otherwise current action when only the server clock ticks", () => {
    const { store, host, advance } = setup();
    advance(3000);
    const before = store.view(host.roomId, host.token);
    advance(800);
    expect(
      store.command(
        host.roomId,
        host.token,
        request({ type: "SubmitMove", from: 8, to: 16 }, before.actionRevision),
      ).state.moveIndex,
    ).toBe(1);
  });
  it("redacts future cards, RNG, seed, roll values, checkpoints and journals", () => {
    const { store, host, advance } = setup();
    advance(3000);
    const room = store.get(host.roomId);
    room.state.events.push({
      seq: room.state.events.length,
      type: "RiskResolved",
      text: "risk",
      data: { roll: 0.123, probability: 0.2, destroyed: false, pieceId: "w-8" },
    });
    const view = store.view(host.roomId, host.token);
    expect(view.state.seed).toBe(0);
    expect(view.state.rng).toBe(0);
    expect(view.state.journal).toBeUndefined();
    expect(view.state.deck.every((c) => c.id === "redacted")).toBe(true);
    expect(view.state.events.some((e) => e.type === "Checkpoint")).toBe(false);
    expect(view.state.events.at(-1)?.data.roll).toBeUndefined();
    expect(() => store.log(host.roomId, host.token)).toThrow(
      "LOG_AVAILABLE_AFTER_MATCH",
    );
  });
  it("keeps clocks running without clients and exports a verified complete log at the end", () => {
    const { store, host, advance } = setup();
    advance(3000);
    advance(420000);
    expect(store.get(host.roomId).state.outcome?.winner).toBe("P2");
    expect(verifyMatch(store.log(host.roomId, host.token)).valid).toBe(true);
  });
  it("restores credentials, accepted IDs and elapsed time after a server restart", () => {
    const { store, host, advance, time } = setup();
    advance(3000);
    const rev = store.view(host.roomId, host.token).actionRevision;
    const body = request({ type: "SubmitMove", from: 8, to: 16 }, rev);
    store.command(host.roomId, host.token, body);
    const saved = JSON.parse(JSON.stringify(store.save()));
    time.wall += 5000;
    time.mono = 100;
    const restarted = new RoomStore({
      mono: () => time.mono,
      wall: () => time.wall,
    });
    restarted.restore(saved);
    const view = restarted.command(host.roomId, host.token, body);
    expect(view.state.moveIndex).toBe(1);
    expect(view.state.clock.remaining.P1).toBe(415000);
    expect(
      verifyMatch(exportMatch(restarted.get(host.roomId).state)).valid,
    ).toBe(true);
  });
  it("charges elapsed playing time if the server restarts during countdown", () => {
    const { store, host, time } = setup();
    const saved = store.save();
    time.wall += 7000;
    time.mono = 100;
    const restarted = new RoomStore({
      mono: () => time.mono,
      wall: () => time.wall,
    });
    restarted.restore(saved);
    expect(
      restarted.view(host.roomId, host.token).state.clock.remaining.P1,
    ).toBe(416000);
    expect(
      verifyMatch(exportMatch(restarted.get(host.roomId).state)).valid,
    ).toBe(true);
  });
  it("limits capacity, validates settings, and expires old rooms", () => {
    let now = 10000;
    const store = new RoomStore({ mono: () => now, wall: () => now }, 1, 1000);
    expect(() => store.create(20, "white")).toThrow("INVALID_SETTINGS");
    const host = store.create(4, "random");
    expect(() => store.create(4, "white")).toThrow("ROOM_CAPACITY");
    now += 1001;
    expect(() => store.view(host.roomId, host.token)).toThrow("ROOM_NOT_FOUND");
  });
  it("accepts only the public move/effect protocol", () => {
    expect(
      isOnlineCommand({ type: "SubmitMove", from: 8, to: 16, promotion: "q" }),
    ).toBe(true);
    expect(
      isOnlineCommand({ type: "SubmitMove", from: 8, to: 16, now: 99 }),
    ).toBe(false);
    expect(isOnlineCommand({ type: "ChooseUnoColor", color: "pink" })).toBe(
      false,
    );
  });
});

describe("mixed private-room play", () => {
  it("replays both seats through color choices, resurrection, evolution and moves", () => {
    const { store, host, guest, advance } = setup();
    store.get(host.roomId).state = demo("resurrection", 0);
    advance(3000);
    const seen = new Set<string>();
    for (
      let step = 0;
      step < 120 && !store.get(host.roomId).state.outcome;
      step++
    ) {
      const state = store.get(host.roomId).state,
        token = state.active === "P1" ? host.token : guest.token;
      const command = computerCommand(state, step + 17, "easy");
      expect(command).not.toBeNull();
      seen.add(command!.type);
      store.command(
        host.roomId,
        token,
        request(
          command,
          store.view(host.roomId, token).actionRevision,
          `mixed-command-${step}`,
        ),
      );
      advance(50);
    }
    for (const kind of [
      "ChooseUnoColor",
      "ChooseResurrections",
      "ChooseEvolution",
      "SubmitMove",
    ])
      expect(seen.has(kind)).toBe(true);
    expect(verifyMatch(exportMatch(store.get(host.roomId).state)).valid).toBe(
      true,
    );
  });
  it("uses monotonic time for the live countdown even if the wall clock changes", () => {
    const { store, host, time } = setup();
    time.wall -= 5000;
    time.mono += 3000;
    store.tick();
    expect(store.get(host.roomId).state.phase).not.toBe("READY");
    expect(store.get(host.roomId).state.clock.remaining.P1).toBe(420000);
  });
});
