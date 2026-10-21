import { describe, it, expect } from "vitest";
import {
  practiceSetup,
  beginPractice,
  positionError,
} from "../src/domain/practice";
import { dispatch } from "../src/domain/turnResolver";
import {
  movesAllowed,
  availableResurrections,
  assertInvariants,
} from "../src/domain/rules";
import { risk } from "../src/domain/cards";
describe("isolated real-engine practice", () => {
  it("starts every example without changing input", () => {
    for (let i = 0; i < 8; i++) {
      const input = practiceSetup(i),
        copy = JSON.stringify(input),
        s = beginPractice(input, i === 1);
      assertInvariants(s);
      expect(JSON.stringify(input)).toBe(copy);
      expect(s.phase).not.toBe("READY");
    }
  });
  it("starts risky practice at fifth move, excluding king and retaining Blue risk", () => {
    const s = beginPractice(practiceSetup(1, "blue"), true);
    expect(s.moveIndex).toBe(4);
    expect(s.budget).toBe(3);
    expect(risk(5, s.color)).toBe(0.1);
    expect(
      movesAllowed(s).every(
        (m) => s.pieces.find((p) => p.id === m.pieceId)!.type !== "k",
      ),
    ).toBe(true);
  });
  it("applies red and green through real moves without ticking practice clocks", () => {
    for (const color of ["red", "green"] as const) {
      const s = beginPractice(practiceSetup(0, color));
      const move = movesAllowed(s)[0],
        next = dispatch(
          s,
          { type: "SubmitMove", from: move.from, to: move.to },
          0,
        );
      expect(next.ok).toBe(true);
      expect(
        next.state.clock.remaining[color === "red" ? "P2" : "P1"] -
          s.clock.remaining[color === "red" ? "P2" : "P1"],
      ).toBe(color === "red" ? -3000 : 3000);
    }
  });
  it("resurrects eligible pieces and chains an enemy using real commands", () => {
    const s = beginPractice(practiceSetup(2));
    const ids = availableResurrections(s)
      .slice(0, 2)
      .map((p) => p.id);
    const r = dispatch(s, { type: "ChooseResurrections", pieceIds: ids }, 0);
    expect(r.ok).toBe(true);
    expect(
      ids.every(
        (id) => r.state.pieces.find((p) => p.id === id)!.square !== null,
      ),
    ).toBe(true);
    const skip = beginPractice(practiceSetup(5)),
      p = skip.pieces.find((p) => p.army === "b" && p.type === "p")!;
    expect(
      dispatch(
        skip,
        { type: "ChooseSkipTarget", pieceId: p.id },
        0,
      ).state.pieces.find((q) => q.id === p.id)?.blocked,
    ).toBe(true);
  });
  it("validates sandbox kings, pawns and initial side", () => {
    const s = practiceSetup();
    expect(positionError(s.pieces)).toBeNull();
    expect(positionError(s.pieces.filter((p) => p.type !== "k"))).toMatch(
      /king/,
    );
    const pawns = structuredClone(s.pieces);
    pawns.find((p) => p.type === "p")!.square = 0;
    expect(positionError(pawns)).toMatch(/Pawns/);
  });
  it("uses actual defense and emergency rules", () => {
    const s = beginPractice(practiceSetup(0, "red", "defense"));
    expect(s.phase).toBe("PRE_DRAW_DEFENSE");
    expect(s.color).toBe("red");
    const r = dispatch(s, { type: "SubmitMove", from: 4, to: 3 }, 0);
    expect(r.ok).toBe(true);
    expect(r.state.color).toBe("green");
    expect(r.state.budget).toBe(4);
    const e = beginPractice(practiceSetup(7, "green", "emergency"));
    expect(e.events.some((ev) => ev.type === "ResetApplied")).toBe(true);
    expect(e.outcome).toBeNull();
  });
});
