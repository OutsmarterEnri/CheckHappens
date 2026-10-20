import { describe, it, expect } from "vitest";
import { computerCommand } from "../src/domain/computer";
import { createGame, dispatch } from "../src/domain/turnResolver";
import { assertInvariants } from "../src/domain/rules";
import { demo } from "../src/domain/fixtures";
describe("computer principiante", () => {
  it("non agisce prima di iniziare o dopo la fine", () => {
    const s = createGame();
    expect(computerCommand(s, 1)).toBeNull();
    s.outcome = { winner: "P1", reason: "test" };
    expect(computerCommand(s, 1)).toBeNull();
  });
  it("sceglie un colore e tutte le resurrezioni necessarie", () => {
    let s = dispatch(demo("resurrection", 0), { type: "StartGame" }, 0).state;
    const color = computerCommand(s, 42)!;
    expect(color.type).toBe("ChooseUnoColor");
    s = dispatch(s, color, 0).state;
    const resurrection = computerCommand(s, 42)!;
    expect(resurrection.type).toBe("ChooseResurrections");
    if (resurrection.type === "ChooseResurrections")
      expect(resurrection.pieceIds).toHaveLength(4);
    expect(dispatch(s, resurrection, 0).ok).toBe(true);
  });
  it("comandi sempre legali per 180 azioni, anche nelle fasi speciali", () => {
    let s = dispatch(createGame(171), { type: "StartGame" }, 0).state;
    for (let i = 0; i < 180 && !s.outcome; i++) {
      const c = computerCommand(s, s.events.length * 7919 + 171)!;
      expect(c, `fase ${s.phase}`).not.toBeNull();
      const r = dispatch(s, c, 0);
      expect(r.ok).toBe(true);
      s = r.state;
      assertInvariants(s);
    }
  });
  it("sotto scacco difende prima di pescare", () => {
    let s = dispatch(demo("defense", 0), { type: "StartGame" }, 0).state;
    expect(s.deckIndex).toBe(0);
    const c = computerCommand(s, 2)!;
    expect(c.type).toBe("SubmitMove");
    s = dispatch(s, c, 0).state;
    expect(s.preDefense || s.active === "P2").toBe(true);
  });
});
