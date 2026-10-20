import { describe, it, expect } from "vitest";
import { translate } from "../src/ui/locale";
describe("English/Italian presentation", () => {
  it("keeps English and unknown diagnostics unchanged", () => {
    expect(translate("Pass →", "en")).toBe("Pass →");
    expect(translate("Unknown command #42", "it")).toBe("Unknown command #42");
  });
  it("translates dynamic move budgets, turn labels and accessible pieces", () => {
    expect(translate("1 move left", "it")).toBe("1 mossa rimasta");
    expect(translate("6 moves left", "it")).toBe("6 mosse rimaste");
    expect(translate("PLAYER 2’S TURN", "it")).toBe("TURNO DEL GIOCATORE 2");
    expect(translate("a2, Pawn white, legal destination", "it")).toBe(
      "a2, Pedone bianco, destinazione valida",
    );
    expect(translate("Reverse · Blue", "it")).toBe("Inverti · Blu");
  });
  it("preserves whitespace around adjacent JSX values", () => {
    expect(translate(" cards", "it")).toBe(" carte");
    expect(translate("  ", "it")).toBe("  ");
    expect(translate("White · Your move", "it")).toBe("Bianco · Tocca a te");
  });
});
