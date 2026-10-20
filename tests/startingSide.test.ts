import { describe, it, expect } from "vitest";
import { createGame, dispatch } from "../src/domain/turnResolver";
import { startingArmy } from "../src/domain/match";
import { computerCommand } from "../src/domain/computer";
import { exportMatch, verifyMatch } from "../src/domain/audit";
import type { Card } from "../src/domain/types";
const deck: Card[] = [
  { id: "first", kind: "number", color: "blue", value: 1 },
  { id: "second", kind: "number", color: "blue", value: 1 },
];
describe("starting side and player identity", () => {
  it("resolves white/black and both random outcomes deterministically", () => {
    expect(startingArmy("white", 1)).toBe("w");
    expect(startingArmy("black", 2)).toBe("b");
    expect(startingArmy("random", 1)).toBe("b");
    expect(startingArmy("random", 2)).toBe("w");
  });
  for (const army of ["w", "b"] as const)
    it(`starts White with P1 controlling ${army} and no countdown clock charge`, () => {
      const initial = createGame(42, 0, deck, 7, army);
      expect(initial.control.P1).toBe(army);
      expect(initial.orientation).toBe(army);
      const result = dispatch(initial, { type: "StartGame" }, 3000, "system");
      expect(result.ok).toBe(true);
      expect(result.state.control[result.state.active]).toBe("w");
      expect(result.state.clock.remaining).toEqual({ P1: 420000, P2: 420000 });
      expect(verifyMatch(exportMatch(result.state)).valid).toBe(true);
    });
  it("lets the bot open as White while the human remains P1 with Black", () => {
    const initial = createGame(42, 0, deck, 7, "b");
    const started = dispatch(
      initial,
      { type: "StartGame" },
      3000,
      "system",
    ).state;
    expect(started.active).toBe("P2");
    const command = computerCommand(started, 17, "easy");
    expect(command?.type).toBe("SubmitMove");
    const moved = dispatch(started, command!, 3500, "computer");
    expect(moved.ok).toBe(true);
    expect(moved.state.active).toBe("P1");
    expect(moved.state.control.P1).toBe("b");
    expect(verifyMatch(exportMatch(moved.state)).valid).toBe(true);
  });
  it("keeps Reverse swapping armies, clocks and orientation after a Black selection", () => {
    const initial = createGame(
      42,
      0,
      [{ id: "reverse", kind: "reverse", color: "blue" }, ...deck],
      7,
      "b",
    );
    initial.clock.remaining.P1 = 300000;
    const started = dispatch(
      initial,
      { type: "StartGame" },
      3000,
      "system",
    ).state;
    expect(started.active).toBe("P2");
    expect(started.control).toEqual({ P1: "w", P2: "b" });
    expect(started.orientation).toBe("w");
    expect(started.clock.remaining).toEqual({ P1: 420000, P2: 300000 });
    expect(verifyMatch(exportMatch(started)).valid).toBe(true);
  });
});
