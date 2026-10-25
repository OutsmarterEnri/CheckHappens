import { describe, it, expect } from "vitest";
import {
  chessLessons,
  variantLessons,
  type TutorialLesson,
} from "../src/domain/tutorial";
import { beginPractice } from "../src/domain/practice";
import { dispatch } from "../src/domain/turnResolver";
import { square, type Command } from "../src/domain/types";
import { verifyMatch, exportMatch } from "../src/domain/audit";
const move = (from: string, to: string, promotion?: "q"): Command => ({
  type: "SubmitMove",
  from: square(from),
  to: square(to),
  ...(promotion ? { promotion } : {}),
});
export const lessonSolutions: Record<string, Command[]> = {
  board: [move("a2", "a3")],
  pawn: [move("d2", "e3")],
  rook: [move("d4", "d6")],
  bishop: [move("c1", "f4")],
  knight: [move("e4", "g5")],
  queen: [move("d1", "g4")],
  king: [move("e1", "d1")],
  "chess-check": [move("e1", "d1")],
  "chess-mate": [move("g6", "g7")],
  castle: [move("e1", "g1")],
  "en-passant": [move("e5", "d6")],
  promotion: [move("a7", "a8", "q")],
  stalemate: [move("g5", "g6")],
  number: [move("a2", "a3"), move("b2", "b3")],
  clocks: [move("a2", "a3")],
  risk: [{ type: "EndOptionalMoves" }],
  blue: [move("a2", "a3")],
  yellow: [move("b1", "b3"), move("e3", "f5")],
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
  reverse: [],
  reset: [],
  defense: [move("e1", "d1")],
  emergency: [],
  last: [move("a2", "a3"), move("b2", "b3")],
};
export function solveLesson(lesson: TutorialLesson) {
  let state = beginPractice(lesson.create(), lesson.startAtRisk);
  for (const command of lessonSolutions[lesson.id]) {
    const r = dispatch(state, command, 0, "human");
    expect(r.ok, lesson.id + " " + command.type).toBe(true);
    state = r.state;
  }
  return state;
}
describe("academy lessons use real chess and variant rules", () => {
  it.each([...chessLessons, ...variantLessons].map((l) => [l.id, l] as const))(
    "%s is solvable, not pre-completed, and replays exactly",
    (_, lesson) => {
      expect(lesson.complete(lesson.create())).toBe(false);
      const s = solveLesson(lesson);
      expect(lesson.complete(s)).toBe(true);
      expect(verifyMatch(exportMatch(s))).toMatchObject({ valid: true });
    },
  );
  it("keeps foundation lessons classical, with no drawn cards or color bonuses", () => {
    for (const l of chessLessons) {
      const s = solveLesson(l);
      expect(s.mode).toBe("classical");
      expect(s.events.some((e) => e.type === "CardDrawn")).toBe(false);
      expect(s.clock.remaining).toEqual({ P1: 420000, P2: 420000 });
    }
  });
  it("a legal but different pawn move does not satisfy the capture goal", () => {
    const l = chessLessons.find((l) => l.id === "pawn")!,
      s = beginPractice(l.create());
    const next = dispatch(s, move("d2", "d3"), 0);
    expect(next.ok).toBe(true);
    expect(l.complete(next.state)).toBe(false);
  });
});
