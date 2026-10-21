import { describe, it, expect } from "vitest";
import { tutorialMissions } from "../src/domain/tutorial";
import { practiceSetup, beginPractice } from "../src/domain/practice";
import { dispatch } from "../src/domain/turnResolver";
import type { Command, State } from "../src/domain/types";
const move = (from: number, to: number): Command => ({
  type: "SubmitMove",
  from,
  to,
});
export function solveMission(index: number): State {
  const m = tutorialMissions[index];
  let s = beginPractice(
    practiceSetup(m.card, m.color, m.scenario ?? "card"),
    m.card === 1,
  );
  const actions: Record<string, Command[]> = {
    turn: [move(8, 16), move(9, 17)],
    green: [move(8, 16)],
    red: [move(8, 16)],
    pass: [{ type: "EndOptionalMoves" }],
    blue: [move(8, 16)],
    yellow: [move(1, 17), move(2, 11)],
    skip: [{ type: "ChooseSkipTarget", pieceId: "b-48" }],
    revive2: [{ type: "ChooseResurrections", pieceIds: ["w-0", "w-1"] }],
    revive4: [
      { type: "ChooseUnoColor", color: "blue" },
      { type: "ChooseResurrections", pieceIds: ["w-0", "w-1", "w-2", "w-8"] },
    ],
    wild: [
      { type: "ChooseUnoColor", color: "green" },
      { type: "ChooseEvolution", pieceId: "w-8", pieceType: "r" },
    ],
    defense: [move(4, 3)],
    check: [move(1, 57)],
    classic: [move(8, 16), move(9, 17)],
  };
  for (const cmd of actions[m.id] ?? []) {
    const r = dispatch(s, cmd, 0);
    expect(r.ok, `${m.id}: ${cmd.type}`).toBe(true);
    s = r.state;
  }
  return s;
}
describe("new tutorial missions", () => {
  it.each(tutorialMissions.map((m, i) => [m.id, i] as const))(
    "%s requires the real effect and can be solved",
    (_, index) => {
      const m = tutorialMissions[index],
        initial = practiceSetup(m.card, m.color, m.scenario ?? "card");
      expect(m.complete(initial)).toBe(false);
      expect(m.complete(solveMission(index))).toBe(true);
    },
  );
  it("does not confuse drawing with performing a required move", () => {
    for (const i of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 14, 15]) {
      const m = tutorialMissions[i];
      expect(
        m.complete(
          beginPractice(
            practiceSetup(m.card, m.color, m.scenario ?? "card"),
            m.card === 1,
          ),
        ),
      ).toBe(false);
    }
  });
});
