import { describe, it, expect } from "vitest";
import { createGame, dispatch } from "../src/domain/turnResolver";
import { restoreSnapshot } from "../src/ui/persistence";
describe("Pocket: sette minuti e ripresa", () => {
  it("parte con 7 minuti per entrambi", () => {
    const s = createGame();
    expect(s.clock.remaining).toEqual({ P1: 420000, P2: 420000 });
  });
  it("non consuma tempo prima di iniziare", () => {
    const s = restoreSnapshot(createGame(), 1000, 90000, 200);
    expect(s.phase).toBe("READY");
    expect(s.clock.remaining.P1).toBe(420000);
  });
  it("riaprire dopo 25 seconds conserva la posizione e sottrae tempo", () => {
    const s = dispatch(createGame(42), { type: "StartGame" }, 0).state;
    const next = restoreSnapshot(s, 1000, 26000, 100);
    expect(next.clock.remaining.P1).toBe(395000);
    expect(next.pieces).toEqual(s.pieces);
    expect(next.current).toEqual(s.current);
    expect(next.deckIndex).toBe(s.deckIndex);
    expect(s.clock.remaining.P1).toBe(420000);
  });
  it("il tempo può scadere mentre l’app è chiusa", () => {
    const s = dispatch(createGame(), { type: "StartGame" }, 0).state;
    const next = restoreSnapshot(s, 1000, 701000, 100);
    expect(next.outcome?.winner).toBe("P2");
    expect(next.phase).toBe("GAME_OVER");
  });
  it("un orologio di sistema arretrato non aggiunge seconds", () => {
    const s = dispatch(createGame(), { type: "StartGame" }, 0).state;
    expect(restoreSnapshot(s, 2000, 1000, 100).clock.remaining.P1).toBe(420000);
  });
});
