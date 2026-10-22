import { describe, it, expect } from "vitest";
import { createGame } from "../src/domain/turnResolver";
import { exportMatch, verifyMatch } from "../src/domain/audit";
import { isOnlineCommand } from "../src/online/protocol";
import { newerRoomView, viewRoom } from "../src/online/client";
import type { RoomView, RoomCredentials } from "../src/online/protocol";
import { vi, afterEach } from "vitest";

describe("review: malformed trust-boundary data", () => {
  it.each([
    ["used", "w-8"],
    ["ep", {}],
    ["discards", null],
    ["events", [null]],
    ["preDefense", "false"],
    ["repetitions", []],
    ["current", { id: "bad", kind: "number", color: "pink", value: 99 }],
  ])(
    "rejects an unusable %s in a snapshot before it reaches play",
    (key, value) => {
      const state = createGame();
      Object.assign(state, { [key as string]: value });
      const log = exportMatch(state);
      expect(verifyMatch(log).valid).toBe(false);
    },
  );
  it.each([
    { type: "ChooseUnoColor", color: ["red"] },
    { type: "SubmitMove", from: 8, to: 16, promotion: ["q"] },
    { type: "ChooseEvolution", pieceId: "w-8", pieceType: ["r"] },
  ])("does not coerce malformed command enums: $type", (command) => {
    expect(isOnlineCommand(command)).toBe(false);
  });
  it("rejects malformed en passant entries before engine evaluation", () => {
    const state = createGame();
    state.ep = [
      { pawnId: "w-8", target: -1, eligibleArmy: "w", expiresAfterTurn: 1 },
    ];
    expect(verifyMatch(exportMatch(state)).valid).toBe(false);
  });
});

describe("review: room responses", () => {
  afterEach(() => vi.unstubAllGlobals());
  const room = (revision: number): RoomView => ({
    roomId: "a".repeat(24),
    revision,
    actionRevision: 0,
    state: createGame(),
    joined: true,
    startsAt: null,
    serverNow: 0,
    opponentOnline: true,
    totalMoves: 0,
  });
  const credentials: RoomCredentials = {
    server: "https://room.example",
    roomId: "a".repeat(24),
    token: "seat",
    player: "P1",
  };
  it("a late poll cannot undo an acknowledged move, and a later poll advances it", () => {
    const moved = room(3),
      stalePoll = room(2),
      next = room(4);
    expect(newerRoomView(moved, stalePoll)).toBe(moved);
    expect(newerRoomView(moved, next)).toBe(next);
    expect(newerRoomView(null, next)).toBe(next);
  });
  it.each([
    { roomId: "b".repeat(24) },
    { revision: -1 },
    { actionRevision: 9 },
    { totalMoves: -1 },
    { opponentOnline: "yes" },
  ])("rejects mismatched or incomplete room metadata %j", async (patch) => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ ...room(1), ...patch }),
      })),
    );
    await expect(viewRoom(credentials)).rejects.toThrow(
      "INVALID_SERVER_RESPONSE",
    );
  });
});
