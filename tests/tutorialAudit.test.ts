import { describe, it, expect } from "vitest";
import { practiceSetup, beginPractice } from "../src/domain/practice";
import { tutorialMissions, tutorialCardView } from "../src/domain/tutorial";
import { dispatch } from "../src/domain/turnResolver";
import { movesAllowed } from "../src/domain/rules";
import { exportMatch, verifyMatch } from "../src/domain/audit";
const play = (
  s: ReturnType<typeof practiceSetup>,
  from: number,
  to: number,
) => {
  const r = dispatch(s, { type: "SubmitMove", from, to }, 0);
  expect(r.ok).toBe(true);
  return r.state;
};
describe("tutorial/engine consistency audit", () => {
  it("derives every preview from the real lesson deck and hides an undrawn defense card", () => {
    for (const m of tutorialMissions) {
      const s = practiceSetup(m.card, m.color, m.scenario);
      const v = tutorialCardView(s, m.scenario === "defense");
      expect(v.card).toEqual(m.scenario === "defense" ? null : s.deck[0]);
    }
    const yellow = tutorialMissions.find((m) => m.id === "yellow")!;
    expect(
      tutorialCardView(
        practiceSetup(yellow.card, yellow.color, yellow.scenario),
      ).card?.value,
    ).toBe(1);
    let s = beginPractice(practiceSetup(0, "red", "defense"));
    expect(s.deckIndex).toBe(0);
    expect(tutorialCardView(s, true).card).toBeNull();
    s = play(s, 4, 3);
    expect(tutorialCardView(s, true).card).toMatchObject({
      value: 4,
      color: "green",
    });
  });
  it("prepares four genuine safe moves with used pieces, color effects and an exactly replayable journal", () => {
    const s = beginPractice(practiceSetup(1, "red"), true);
    expect(s.events.filter((e) => e.type === "MoveCompleted")).toHaveLength(4);
    expect(s.used).toHaveLength(4);
    expect(s.budget).toBe(3);
    expect(s.moveIndex).toBe(4);
    expect(s.clock.remaining.P2).toBe(288000);
    for (const from of [9, 10, 11, 12])
      expect(s.pieces.find((p) => p.home === from)?.square).toBe(from + 8);
    expect(movesAllowed(s).every((m) => !s.used.includes(m.pieceId))).toBe(
      true,
    );
    expect(
      movesAllowed(s).some(
        (m) => s.pieces.find((p) => p.id === m.pieceId)?.type === "k",
      ),
    ).toBe(false);
    expect(s.events.filter((e) => e.type === "RiskResolved")).toHaveLength(0);
    expect(verifyMatch(exportMatch(s)).valid).toBe(true);
  });
  it("keeps free practice at move one of a 7, without silently spending four actions", () => {
    const input = practiceSetup(1, "blue");
    input.pieces = input.pieces.filter((p) => p.type === "k" || p.id === "w-8");
    const s = beginPractice(input);
    expect(s.moveIndex).toBe(0);
    expect(s.budget).toBe(7);
    expect(s.used).toEqual([]);
    expect(
      movesAllowed(s).some(
        (m) => s.pieces.find((p) => p.id === m.pieceId)?.type === "k",
      ),
    ).toBe(true);
  });
  it("does not complete Yellow after a second capture leaves another mandatory bonus", () => {
    const m = tutorialMissions.find((m) => m.id === "yellow")!;
    let s = beginPractice(practiceSetup(m.card, m.color, m.scenario));
    s = play(s, 1, 17);
    s = play(s, 2, 11);
    expect(s.yellow).toBe(1);
    expect(s.events.filter((e) => e.type === "MoveCompleted")).toHaveLength(2);
    expect(m.complete(s)).toBe(false);
    s = play(s, 20, 37);
    expect(m.complete(s)).toBe(true);
    expect(s.events.some((e) => e.type === "ArmiesSwapped")).toBe(false);
  });
  it("applies the old Red to defense, preserves the new four-move budget and does not reuse the defending piece", () => {
    let s = beginPractice(practiceSetup(0, "red", "defense"));
    const clocks = { ...s.clock.remaining };
    s = play(s, 4, 3);
    expect(s.clock.remaining.P1).toBe(clocks.P1);
    expect(s.clock.remaining.P2).toBe(clocks.P2 - 3000);
    expect(s.color).toBe("green");
    expect(s.budget).toBe(4);
    expect(s.moveIndex).toBe(0);
    expect(movesAllowed(s).some((m) => m.pieceId === "wk")).toBe(false);
  });
});
