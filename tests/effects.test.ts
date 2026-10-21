import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MatchFinale } from "../src/ui/MatchFinale";
import { describe, it, expect } from "vitest";
import { crackStage } from "../src/ui/PieceEffects";
import { risk } from "../src/domain/cards";
import { validTheme, themes } from "../src/ui/themes";
describe("2.5 visual feedback", () => {
  it("grows cracks with effective break probability including Blue", () => {
    expect([0, 10, 20, 40, 60, 80, 99].map(crackStage)).toEqual([
      0, 1, 1, 2, 3, 4, 5,
    ]);
    expect(crackStage(risk(5, "red") * 100)).toBe(1);
    expect(crackStage(risk(6, "blue") * 100)).toBe(1);
    expect(crackStage(risk(9, "blue") * 100)).toBe(5);
  });
  it("keeps known themes and safely falls back for old or corrupted preferences", () => {
    expect(themes).toHaveLength(5);
    expect(validTheme("mint")).toBe("mint");
    expect(validTheme("unknown")).toBe("candy");
    expect(validTheme(null)).toBe("candy");
  });
});

describe("private guest finale", () => {
  for (const winner of ["P1", "P2"] as const)
    it(`shows the correct result to P2 when ${winner} wins`, () => {
      const html = renderToStaticMarkup(
        createElement(MatchFinale, {
          outcome: { winner, reason: "Checkmate" },
          computer: true,
          viewerPlayer: "P2",
          winnerName: "Player",
          moves: 12,
          onAgain: () => {},
          onReview: () => {},
          onExport: () => {},
        }),
      );
      expect(html).toContain(winner === "P2" ? "YOU WIN!" : "YOU LOSE!");
    });
});
