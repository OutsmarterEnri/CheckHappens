import { describe, it, expect } from "vitest";
import {
  chessLessons,
  variantLessons,
  tutorialCardView,
  validLearningProgress,
} from "../src/domain/tutorial";
import { beginPractice } from "../src/domain/practice";
import { dispatch } from "../src/domain/turnResolver";
import { movesAllowed } from "../src/domain/rules";
describe("academy teaching consistency", () => {
  it("derives every card preview from actual state, hiding the undrawn defense card", () => {
    for (const lesson of variantLessons) {
      const s = lesson.create();
      expect(tutorialCardView(s, lesson.id === "defense").card).toEqual(
        lesson.id === "defense" ? null : s.deck[0],
      );
    }
    for (const l of chessLessons)
      expect(tutorialCardView(l.create()).card).toBeNull();
  });
  it("uses the old color on defense and preserves all new card actions", () => {
    const l = variantLessons.find((l) => l.id === "defense")!;
    let s = beginPractice(l.create());
    expect(s.deckIndex).toBe(0);
    const enemy = s.clock.remaining.P2;
    s = dispatch(s, { type: "SubmitMove", from: 4, to: 3 }, 0).state;
    expect(s.clock.remaining.P2).toBe(enemy - 3000);
    expect(s.budget).toBe(4);
    expect(s.moveIndex).toBe(0);
    expect(s.color).toBe("green");
    expect(movesAllowed(s).some((m) => m.pieceId === "wk")).toBe(false);
  });
  it("demonstrates risk with four genuine safe actions and an unavailable king", () => {
    const l = variantLessons.find((l) => l.id === "blue")!,
      s = beginPractice(l.create(), l.startAtRisk);
    expect(s.used).toHaveLength(4);
    expect(s.moveIndex).toBe(4);
    expect(s.budget).toBe(3);
    expect(
      movesAllowed(s).some(
        (m) => s.pieces.find((p) => p.id === m.pieceId)?.type === "k",
      ),
    ).toBe(false);
  });
  it("offers the pawn's first double step but does not offer an unsafe king step", () => {
    const pawn = beginPractice(
      chessLessons.find((l) => l.id === "pawn")!.create(),
    );
    expect(movesAllowed(pawn).some((m) => m.from === 11 && m.to === 27)).toBe(
      true,
    );
    const king = beginPractice(
      chessLessons.find((l) => l.id === "king")!.create(),
    );
    expect(movesAllowed(king).some((m) => m.to === 12)).toBe(false);
  });
  it("only accepts known, distinct lesson IDs as progress", () => {
    expect(validLearningProgress(null)).toEqual([]);
    expect(validLearningProgress({ pawn: true })).toEqual([]);
    expect(
      validLearningProgress(["pawn", "pawn", "unknown", 9, "number"]),
    ).toEqual(["pawn", "number"]);
  });
});
