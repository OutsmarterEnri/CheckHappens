import { describe, it, expect } from "vitest";
import { createGame, dispatch } from "../src/domain/turnResolver";
import { makeDeck, shuffled, risk, parseDeck } from "../src/domain/cards";
import {
  assertInvariants,
  canEnd,
  movesAllowed,
  reset,
  resurrect,
  availableResurrections,
  evolutionChoices,
} from "../src/domain/rules";
import { engine, attacked, eliminate } from "../src/engine/implementation";
import { fixture, testPiece as p, demo } from "../src/domain/fixtures";
import { checkpoint, replay } from "../src/domain/events";
import {
  square as sq,
  type State,
  type Card,
  type Command,
} from "../src/domain/types";
const card = (
  kind: Card["kind"] = "number",
  color: Card["color"] = "blue",
  value = 1,
): Card => ({ id: `${kind}-${color}-${value}`, kind, color, value });
const tail = () => [
  card("number", "blue", 1),
  card("number", "blue", 1),
  card("number", "blue", 1),
];
const start = (s: State) => act(s, { type: "StartGame" });
const act = (s: State, c: Command, now = s.clock.lastAt): State => {
  const r = dispatch(s, c, now);
  expect(r.ok, r.ok ? "" : r.error.message).toBe(true);
  return r.state;
};
const move = (
  s: State,
  from: string,
  to: string,
  promotion?: "q" | "r" | "b" | "n",
) => act(s, { type: "SubmitMove", from: sq(from), to: sq(to), promotion });
const bare = (pieces: State["pieces"], deck = [card(), ...tail()]) =>
  fixture([p("wk", "w", "k", "a1"), p("bk", "b", "k", "h8"), ...pieces], deck);
function playing(
  pieces: State["pieces"],
  index = 0,
  budget = 1,
  color: State["color"] = "blue",
): State {
  const s = bare(pieces);
  s.phase = "RESOLVE_MOVES";
  s.turn = 1;
  s.moveIndex = index;
  s.budget = budget;
  s.color = color;
  s.current = card("number", color, budget);
  s.deckIndex = 1;
  return s;
}

describe("mazzo e casualità", () => {
  it("108 carte, frequenze classiche", () => {
    const d = makeDeck();
    expect(d).toHaveLength(108);
    expect(new Set(d.map((c) => c.id)).size).toBe(108);
    for (const color of ["red", "green", "blue", "yellow"]) {
      expect(d.filter((c) => c.color === color)).toHaveLength(25);
      expect(
        d.filter((c) => c.color === color && c.kind === "reset"),
      ).toHaveLength(1);
      for (let n = 1; n <= 9; n++)
        expect(
          d.filter(
            (c) => c.color === color && c.kind === "number" && c.value === n,
          ),
        ).toHaveLength(2);
      for (const kind of ["skip", "reverse", "draw2"])
        expect(
          d.filter((c) => c.color === color && c.kind === kind),
        ).toHaveLength(2);
    }
    expect(d.filter((c) => c.kind === "wild")).toHaveLength(4);
    expect(d.filter((c) => c.kind === "draw4")).toHaveLength(4);
  });
  it("seed riproducibile", () => {
    expect(shuffled(23)).toEqual(shuffled(23));
    expect(shuffled(23)).not.toEqual(shuffled(24));
  });
  it("tabella rischio e blu", () => {
    expect(
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20].map((i) =>
        Math.round(risk(i, "red") * 100),
      ),
    ).toEqual([0, 0, 0, 0, 20, 40, 60, 80, 99, 99, 99]);
    expect(risk(5, "blue")).toBe(0.1);
    expect(risk(6, "blue")).toBe(0.2);
    expect(risk(7, "blue")).toBeCloseTo(0.6);
  });
});
describe("mosse e budget", () => {
  for (let n = 1; n <= 4; n++)
    it(`carta ${n}, budget distinto`, () => {
      let s = start(createGame(7, 0, [card("number", "green", n), ...tail()]));
      expect(s.budget).toBe(n);
      for (let i = 0; i < n; i++) s = move(s, `${"abcd"[i]}2`, `${"abcd"[i]}3`);
      expect(s.active).toBe("P2");
      expect(s.deckIndex).toBe(2);
    });
  it("prime quattro obbligatorie e passaggio dalla quinta", () => {
    let s = start(createGame(7, 0, [card("number", "blue", 9), ...tail()]));
    expect(canEnd(s)).toBe(false);
    expect(dispatch(s, { type: "EndOptionalMoves" }, 0).ok).toBe(false);
    for (const f of "abcd") s = move(s, `${f}2`, `${f}3`);
    expect(s.moveIndex).toBe(4);
    expect(canEnd(s)).toBe(true);
    s = act(s, { type: "EndOptionalMoves" });
    expect(s.active).toBe("P2");
  });
  it("non riutilizza un pezzo", () => {
    let s = start(createGame(7, 0, [card("number", "blue", 4), ...tail()]));
    s = move(s, "a2", "a3");
    expect(movesAllowed(s).some((m) => m.from === sq("a3"))).toBe(false);
    expect(
      dispatch(s, { type: "SubmitMove", from: sq("a3"), to: sq("a4") }, 0).ok,
    ).toBe(false);
  });
  it("solo pezzi disponibili, fine senza penalità", () => {
    let s = playing([p("wr", "w", "r", "b1")], 0, 4);
    s.used = ["wk"];
    s = move(s, "b1", "b2");
    expect(s.active).toBe("P2");
    expect(s.outcome).toBeNull();
  });
  it("re vietato dalla quinta", () => {
    const s = playing([p("wr", "w", "r", "b1")], 4, 1);
    expect(movesAllowed(s).some((m) => m.pieceId === "wk")).toBe(false);
  });
  it("immuta input e rifiuta fuori fase", () => {
    const s = createGame(7);
    const copy = structuredClone(s);
    expect(dispatch(s, { type: "ChooseUnoColor", color: "red" }, 0).ok).toBe(
      false,
    );
    expect(s).toEqual(copy);
  });
  it("scacco termina il turno prima di mosse residue", () => {
    let s = playing([p("wr", "w", "r", "b1")], 0, 4);
    s = move(s, "b1", "b8");
    expect(s.active).toBe("P2");
    expect(s.phase).toBe("PRE_DRAW_DEFENSE");
    expect(s.deckIndex).toBe(1);
  });
});
describe("rischio e colori", () => {
  it("cattura, poi distruzione; rosso applicato e turno finito", () => {
    let s = playing(
      [p("wr", "w", "r", "b1"), p("bp", "b", "p", "b3")],
      4,
      4,
      "red",
    );
    s.rng = 1;
    s = move(s, "b1", "b3");
    expect(s.pieces.find((p) => p.id === "bp")!.square).toBeNull();
    expect(s.pieces.find((p) => p.id === "wr")!.square).toBeNull();
    expect(s.clock.remaining.P2).toBe(417000);
    expect(s.active).toBe("P2");
    expect(
      s.events.some(
        (e) => e.type === "RiskResolved" && e.data.destroyed === true,
      ),
    ).toBe(true);
  });
  it("verde anche dopo distruzione", () => {
    let s = playing([p("wr", "w", "r", "b1")], 4, 1, "green");
    s.rng = 1;
    s = move(s, "b1", "b2");
    expect(s.clock.remaining.P1).toBe(423000);
  });
  it("zero prima del verde: niente bonus o mossa", () => {
    let s = playing([p("wr", "w", "r", "b1")], 0, 1, "green");
    s.clock.remaining.P1 = 100;
    s = act(s, { type: "SubmitMove", from: sq("b1"), to: sq("b2") }, 101);
    expect(s.outcome?.winner).toBe(null);
    expect(s.clock.remaining.P1).toBe(0);
    expect(s.pieces.find((p) => p.id === "wr")!.square).toBe(sq("b1"));
  });
  it("rosso azzera il clock e blocca ogni azione", () => {
    let s = playing([p("wr", "w", "r", "b1")], 0, 1, "red");
    s.clock.remaining.P2 = 1000;
    s = move(s, "b1", "b2");
    expect(s.outcome?.winner).toBe("P1");
    expect(dispatch(s, { type: "AdvanceTime" }, 100).ok).toBe(false);
  });
  it("distruzione espone il re, sconfitta senza emergenza", () => {
    let s = playing(
      [p("wr", "w", "r", "a2"), p("br", "b", "r", "a8")],
      4,
      1,
      "blue",
    );
    s.rng = 1;
    s = move(s, "a2", "a3");
    expect(s.outcome?.winner).toBe("P2");
    expect(s.deckIndex).toBe(1);
  });
  it("catture gialle obbligatorie, pezzi distinti", () => {
    let s = playing(
      [
        p("wr", "w", "r", "b1"),
        p("wn", "w", "n", "e3"),
        p("bp", "b", "p", "b3"),
        p("bp2", "b", "p", "d5"),
      ],
      0,
      1,
      "yellow",
    );
    s = move(s, "b1", "b3");
    expect(s.yellow).toBe(1);
    expect(canEnd(s)).toBe(false);
    s = move(s, "e3", "d5");
    expect(s.yellow).toBe(1);
    expect(s.used).toContain("wn");
    expect(movesAllowed(s).some((m) => m.pieceId === "wr")).toBe(false);
  });
  it("giallo oltre nove: 99%, nessun limite di indice", () => {
    const s = playing([p("wr", "w", "r", "b1")], 10, 0, "yellow");
    s.yellow = 1;
    expect(movesAllowed(s).some((m) => m.pieceId === "wr")).toBe(true);
    expect(risk(s.moveIndex + 1, s.color)).toBe(0.99);
    expect(canEnd(s)).toBe(false);
  });
  it("giallo con solo re rimasto termina senza penalità", () => {
    let s = playing(
      [p("wr", "w", "r", "b1"), p("bp", "b", "p", "b3")],
      3,
      1,
      "yellow",
    );
    s = move(s, "b1", "b3");
    expect(s.active).toBe("P2");
    expect(s.outcome).toBeNull();
  });
  it("cattura gialla distrutta perde il bonus", () => {
    let s = playing(
      [p("wr", "w", "r", "b1"), p("bp", "b", "p", "b3")],
      4,
      1,
      "yellow",
    );
    s.rng = 1;
    s = move(s, "b1", "b3");
    expect(s.active).toBe("P2");
    expect(s.events.some((e) => e.type === "YellowBonusGranted")).toBe(false);
  });
});
describe("difesa ed emergenza", () => {
  it("difesa prima della pesca, colore precedente, budget numerico intatto", () => {
    let s = start(demo("defense", 0));
    expect(s.phase).toBe("PRE_DRAW_DEFENSE");
    expect(s.deckIndex).toBe(0);
    expect(s.color).toBe("red");
    s = move(s, "e1", "f1");
    expect(s.clock.remaining.P2).toBe(417000);
    expect(s.deckIndex).toBe(1);
    expect(s.color).toBe("green");
    expect(s.budget).toBe(4);
    expect(s.moveIndex).toBe(0);
    expect(s.used).toContain("wk");
  });
  it("difesa consuma mossa Skip, effetto ancora disponibile", () => {
    let s = demo("defense", 0);
    s.deck = [card("skip", "green"), ...tail()];
    s = start(s);
    s = move(s, "e1", "f1");
    expect(s.phase).toBe("CHOOSE_TARGETS");
    s = act(s, { type: "ChooseSkipTarget", pieceId: "br" });
    expect(s.active).toBe("P2");
    expect(s.pieces.find((p) => p.id === "br")!.blocked).toBe(true);
  });
  it("difesa consuma fallback inutilizzabile", () => {
    let s = demo("defense", 0);
    s.deck = [card("draw2", "blue"), ...tail()];
    s = start(s);
    s = move(s, "e1", "f1");
    expect(s.active).toBe("P2");
    expect(s.events.filter((e) => e.type === "MoveCompleted")).toHaveLength(1);
  });
  it("contro-scacco difensivo interrompe prima della pesca", () => {
    let s = fixture(
      [
        p("wk", "w", "k", "e1"),
        p("wr", "w", "r", "a1"),
        p("bk", "b", "k", "h1"),
        p("br", "b", "r", "e8"),
      ],
      [card(), ...tail()],
    );
    s = start(s);
    s = move(s, "e1", "f2");
    expect(s.active).toBe("P2");
    expect(s.phase).toBe("PRE_DRAW_DEFENSE");
    expect(s.deckIndex).toBe(0);
  });
  it("matto pesca una sola carta numerica e perde", () => {
    let s = demo("emergency", 0);
    s.deck = [card("number", "green", 9), ...tail()];
    s = start(s);
    expect(s.outcome?.winner).toBe("P2");
    expect(s.deckIndex).toBe(1);
    expect(s.events.filter((e) => e.type === "CardDrawn")).toHaveLength(1);
  });
  it("Reset salva dal matto, completa turno senza seconda pesca", () => {
    let s = start(demo("emergency", 0));
    expect(s.outcome).toBeNull();
    expect(s.deckIndex).toBe(1);
    expect(s.rescue).toBe("mate");
    expect(s.phase).toBe("RESOLVE_MOVES");
    s = act(s, { type: "EndOptionalMoves" });
    expect(s.active).toBe("P2");
    expect(s.deckIndex).toBe(2);
  });
  it("matto a mazzo vuoto è definitivo", () => {
    const s = start({ ...demo("emergency", 0), deck: [] });
    expect(s.outcome?.winner).toBe("P2");
    expect(s.deckIndex).toBe(0);
  });
  it("ultima carta salvataggio si completa prima della fase classica", () => {
    let s = demo("emergency", 0);
    s.deck = [card("reset", "green")];
    s = start(s);
    expect(s.mode).toBe("uno");
    expect(s.transitionPending).toBe(true);
    s = move(s, "e1", "e2");
    expect(s.mode).toBe("classical");
    expect(s.active).toBe("P2");
    expect(s.color).toBeNull();
  });
});
describe("Skip e Reverse", () => {
  it("Skip non rimuove attacchi e vieta movimenti", () => {
    const s = bare([p("br", "b", "r", "a8")]);
    const rook = s.pieces.find((p) => p.id === "br")!;
    rook.blocked = true;
    expect(attacked(s, sq("a1"), "b")).toBe(true);
    expect(engine.legalMoves(s, "b").some((m) => m.pieceId === "br")).toBe(
      false,
    );
  });
  it("re immune, rinnovo non cumulativo e scadenza dopo turno", () => {
    let s = start(createGame(7, 0, [card("skip", "blue"), ...tail()]));
    expect(
      dispatch(s, { type: "ChooseSkipTarget", pieceId: "b-60" }, 0).ok,
    ).toBe(false);
    s = act(s, { type: "ChooseSkipTarget", pieceId: "b-48" });
    s = act(s, { type: "EndOptionalMoves" });
    expect(s.pieces.find((p) => p.id === "b-48")!.blocked).toBe(true);
    s = move(s, "b7", "b6");
    expect(s.pieces.find((p) => p.id === "b-48")!.blocked).toBe(false);
  });
  it("Reverse scambia tempi, eserciti, orientamento, poi alterna identità", () => {
    let s = createGame(7, 0, [card("reverse", "yellow"), ...tail()]);
    s.clock.remaining = { P1: 100000, P2: 200000 };
    s = start(s);
    expect(s.control).toEqual({ P1: "b", P2: "w" });
    expect(s.clock.remaining).toEqual({ P1: 200000, P2: 100000 });
    expect(s.orientation).toBe("b");
    expect(s.color).toBe("yellow");
    s = move(s, "a7", "a6");
    expect(s.active).toBe("P2");
    expect(s.control.P2).toBe("w");
  });
  it("Reverse contabilizza tempo prima dello scambio e prosegue col ricevuto", () => {
    let s = createGame(7, 0, [card("reverse", "green"), ...tail()]);
    s.clock.remaining = { P1: 100000, P2: 200000 };
    s = start(s);
    s = act(s, { type: "AdvanceTime" }, 1234);
    expect(s.clock.remaining.P1).toBe(198766);
    expect(s.clock.remaining.P2).toBe(100000);
  });
  it("Reverse mantiene diritti e blocchi del pezzo", () => {
    let s = createGame(7, 0, [card("reverse", "blue"), ...tail()]);
    s.pieces.find((p) => p.id === "b-56")!.blocked = true;
    s.pieces.find((p) => p.id === "b-56")!.blockedAtTurn = 0;
    s = start(s);
    expect(s.pieces.find((p) => p.id === "b-56")!.blocked).toBe(true);
    expect(s.pieces.find((p) => p.id === "b-60")!.moved).toBe(false);
    expect(s.used).toEqual([]);
  });
  it("Reverse trasferisce all’avversario il re sotto scacco, senza pesca doppia", () => {
    let s = demo("defense", 0);
    s.phase = "CHOOSE_COLOR";
    s.current = card("reverse", null);
    s.turn = 1;
    s = startReverse(s);
    expect(s.active).toBe("P2");
    expect(s.phase).toBe("PRE_DRAW_DEFENSE");
    expect(s.deckIndex).toBe(0);
    expect(s.color).toBe("blue");
  });
});
function startReverse(s: State) {
  return act(s, { type: "ChooseUnoColor", color: "blue" });
}

describe("resurrezione, evoluzione, Reset", () => {
  it("massimo obbligatorio, no duplicati, ritorno al tipo originale", () => {
    let s = createGame(1, 0, [card("draw2", "green"), ...tail()]);
    for (const id of ["w-0", "w-1", "w-8"]) {
      const p = s.pieces.find((p) => p.id === id)!;
      p.square = null;
      p.death = "risk";
    }
    s.pieces.find((p) => p.id === "w-8")!.type = "q";
    s = start(s);
    expect(availableResurrections(s)).toHaveLength(3);
    expect(
      dispatch(s, { type: "ChooseResurrections", pieceIds: ["w-8"] }, 0).ok,
    ).toBe(false);
    expect(
      dispatch(s, { type: "ChooseResurrections", pieceIds: ["w-8", "w-8"] }, 0)
        .ok,
    ).toBe(false);
    s = act(s, { type: "ChooseResurrections", pieceIds: ["w-8", "w-0"] });
    expect(s.pieces.find((p) => p.id === "w-8")!.type).toBe("p");
    expect(s.pieces.find((p) => p.id === "w-8")!.moved).toBe(false);
    expect(s.pieces.find((p) => p.id === "w-0")!.moved).toBe(false);
    expect(
      movesAllowed(s).some((m) => m.pieceId === "w-8" && m.to === sq("a4")),
    ).toBe(true);
  });
  it("casella occupata impedisce resurrezione", () => {
    const s = createGame();
    s.pieces.find((p) => p.id === "w-0")!.square = null;
    s.pieces.find((p) => p.id === "w-8")!.square = 0;
    expect(availableResurrections(s).some((p) => p.id === "w-0")).toBe(false);
  });
  it("nessun pezzo da resuscitare: fallback disponibile anche +4", () => {
    let s = start(createGame(1, 0, [card("draw4", null), ...tail()]));
    s = act(s, { type: "ChooseUnoColor", color: "yellow" });
    expect(s.phase).toBe("RESOLVE_MOVES");
    expect(s.optionalSpecial).toBe(true);
    expect(canEnd(s)).toBe(true);
  });
  it("pezzo eliminato perde blocco definitivamente", () => {
    const s = createGame();
    const p = s.pieces.find((p) => p.id === "w-8")!;
    p.blocked = true;
    eliminate(s, p.id, "risk");
    resurrect(s, [p.id]);
    expect(p.blocked).toBe(false);
  });
  it("evoluzione bloccata mantiene blocco e identità", () => {
    let s = createGame(1, 0, [card("wild", null), ...tail()]);
    s.pieces.find((p) => p.id === "w-8")!.blocked = true;
    s = start(s);
    s = act(s, { type: "ChooseUnoColor", color: "blue" });
    s = act(s, { type: "ChooseEvolution", pieceId: "w-8", pieceType: "n" });
    const p = s.pieces.find((p) => p.id === "w-8")!;
    expect(p.type).toBe("n");
    expect(p.home).toBe(sq("a2"));
    expect(p.blocked).toBe(true);
    expect(movesAllowed(s).some((m) => m.pieceId === p.id)).toBe(false);
  });
  it("senza pedoni, Wild fallback", () => {
    let s = bare([p("wr", "w", "r", "b1")], [card("wild", null), ...tail()]);
    s = start(s);
    s = act(s, { type: "ChooseUnoColor", color: "red" });
    expect(s.phase).toBe("RESOLVE_MOVES");
    expect(s.optionalSpecial).toBe(true);
  });
  it("Reset simultaneo non distrugge occupanti che stanno tornando a casa", () => {
    const s = createGame();
    const a = s.pieces.find((p) => p.id === "w-0")!,
      b = s.pieces.find((p) => p.id === "w-1")!;
    a.square = 1;
    b.square = 0;
    reset(s);
    expect(a.square).toBe(0);
    expect(b.square).toBe(1);
    assertInvariants(s);
  });
  it("Reset lascia pedoni, mantiene promozioni e blocchi, ripristina arrocco", () => {
    const s = createGame();
    const pawn = s.pieces.find((p) => p.id === "w-8")!,
      king = s.pieces.find((p) => p.id === "w-4")!,
      rook = s.pieces.find((p) => p.id === "w-0")!;
    pawn.type = "q";
    pawn.square = sq("a4");
    pawn.blocked = true;
    king.square = sq("e3");
    king.moved = true;
    rook.square = sq("a3");
    rook.moved = true;
    reset(s);
    expect(pawn.square).toBe(8);
    expect(pawn.type).toBe("q");
    expect(pawn.blocked).toBe(true);
    expect(king.moved).toBe(false);
    expect(rook.moved).toBe(false);
  });
  it("Reset collisione pedone promosso distrugge entrambi", () => {
    const s = createGame();
    const promoted = s.pieces.find((p) => p.id === "w-8")!,
      occupant = s.pieces.find((p) => p.id === "w-9")!;
    promoted.square = sq("a4");
    promoted.type = "q";
    occupant.square = 8;
    reset(s);
    expect(promoted.square).toBeNull();
    expect(occupant.square).toBeNull();
  });
  it("Reset non resuscita eliminati e non distrugge re", () => {
    const s = createGame();
    s.pieces.find((p) => p.id === "w-0")!.square = null;
    reset(s);
    expect(s.pieces.find((p) => p.id === "w-0")!.square).toBeNull();
    assertInvariants(s);
  });
});
describe("scacchi adattati", () => {
  it("arrocco costo 2, entrambi utilizzati, niente arrocco con una sola azione", () => {
    let s = playing([p("wr", "w", "r", "h1"), p("wn", "w", "n", "b1")], 0, 2);
    const k = s.pieces.find((p) => p.id === "wk")!;
    k.square = sq("e1");
    k.home = sq("e1");
    k.moved = false;
    const r = s.pieces.find((p) => p.id === "wr")!;
    r.home = sq("h1");
    r.moved = false;
    const castle = movesAllowed(s).find((m) => m.castleRook);
    expect(castle?.cost).toBe(2);
    s.budget = 1;
    expect(movesAllowed(s).some((m) => m.castleRook)).toBe(false);
    s.budget = 3;
    s = move(s, "e1", "g1");
    expect(s.used).toEqual(["wk", "wr"]);
    expect(s.moveIndex).toBe(2);
    expect(s.budget).toBe(1);
    expect(s.pieces.find((p) => p.id === "wr")!.square).toBe(sq("f1"));
  });
  it("torre bloccata impedisce arrocco; attacco sul passaggio impedisce arrocco", () => {
    const s = playing([p("wr", "w", "r", "h1"), p("br", "b", "r", "f8")], 0, 2);
    const k = s.pieces.find((p) => p.id === "wk")!;
    k.square = sq("e1");
    k.home = sq("e1");
    k.moved = false;
    const r = s.pieces.find((p) => p.id === "wr")!;
    r.moved = false;
    r.blocked = true;
    expect(movesAllowed(s).some((m) => m.castleRook)).toBe(false);
    r.blocked = false;
    expect(movesAllowed(s).some((m) => m.castleRook)).toBe(false);
  });
  it("en passant resta dopo altre mosse stesso turno", () => {
    let s = playing(
      [
        p("wp", "w", "p", "e2"),
        p("wn", "w", "n", "b1"),
        p("bp", "b", "p", "d4"),
      ],
      0,
      2,
    );
    s.pieces.find((p) => p.id === "wp")!.moved = false;
    s = move(s, "e2", "e4");
    s = move(s, "b1", "c3");
    expect(s.active).toBe("P2");
    expect(
      movesAllowed(s).some(
        (m) => m.from === sq("d4") && m.to === sq("e3") && m.captureId === "wp",
      ),
    ).toBe(true);
    s = move(s, "d4", "e3");
    expect(s.pieces.find((p) => p.id === "wp")!.square).toBeNull();
  });
  it("en passant attiva bonus giallo", () => {
    let s = playing(
      [
        p("wp", "w", "p", "e5"),
        p("bp", "b", "p", "d5"),
        p("wn", "w", "n", "b1"),
      ],
      0,
      1,
      "yellow",
    );
    s.ep = [
      {
        pawnId: "bp",
        target: sq("d6"),
        eligibleArmy: "w",
        expiresAfterTurn: 1,
      },
    ];
    s = move(s, "e5", "d6");
    expect(s.yellow).toBe(1);
  });
  it("promozione con cattura mantiene identità e genera giallo", () => {
    let s = playing(
      [
        p("wp", "w", "p", "b7"),
        p("br", "b", "r", "c8"),
        p("wn", "w", "n", "b1"),
      ],
      0,
      1,
      "yellow",
    );
    s = move(s, "b7", "c8", "n");
    expect(s.pieces.find((p) => p.id === "wp")!.type).toBe("n");
    expect(s.used).toContain("wp");
    expect(s.yellow).toBe(1);
  });
  it("normale mossa non lascia re sotto scacco", () => {
    const s = bare([p("wr", "w", "r", "a2"), p("br", "b", "r", "a8")]);
    expect(
      engine
        .legalMoves(s, "w")
        .some((m) => m.from === sq("a2") && m.to === sq("b2")),
    ).toBe(false);
  });
});
describe("fase classica, clock e replay", () => {
  it("ultima carta si completa, poi annulla temporanei ma conserva eserciti e posizione", () => {
    let s = createGame(1, 0, [card("number", "green", 2)]);
    s.pieces.find((p) => p.id === "b-48")!.blocked = true;
    s = start(s);
    s = move(s, "a2", "a3");
    expect(s.mode).toBe("uno");
    expect(s.color).toBe("green");
    s = move(s, "b2", "b3");
    expect(s.mode).toBe("classical");
    expect(s.halfmoves).toBe(0);
    expect(s.pieces.every((p) => !p.blocked)).toBe(true);
    expect(s.clock.remaining.P1).toBe(426000);
    expect(s.pieces.find((p) => p.id === "w-8")!.square).toBe(sq("a3"));
    expect(Object.values(s.repetitions)).toEqual([1]);
  });
  it("ultima carta che dà matto non permette altre emergenze", () => {
    let s = fixture(
      [
        p("wk", "w", "k", "c3"),
        p("wq", "w", "q", "b3"),
        p("bk", "b", "k", "a1"),
      ],
      [card("number", "blue", 1)],
    );
    s = start(s);
    s = move(s, "b3", "b2");
    expect(s.outcome?.winner).toBe("P1");
    expect(s.deckIndex).toBe(1);
  });
  it("clock monotono da timestamp e rifiuto tempo retrogrado", () => {
    let s = start(createGame(7));
    s = act(s, { type: "AdvanceTime" }, 1000);
    s = act(s, { type: "AdvanceTime" }, 1250);
    expect(s.clock.remaining.P1).toBe(418750);
    expect(dispatch(s, { type: "AdvanceTime" }, 1000).ok).toBe(false);
  });
  it("clock corre durante scelte Wild e salvataggio", () => {
    let s = start(createGame(7, 0, [card("wild", null), ...tail()]));
    s = act(s, { type: "AdvanceTime" }, 1500);
    expect(s.clock.remaining.P1).toBe(418500);
    s = act(s, { type: "ChooseUnoColor", color: "green" }, 2000);
    expect(s.clock.remaining.P1).toBe(418000);
  });
  it("replay deterministico completo, nessun risorteggio", () => {
    let s = playing([p("wr", "w", "r", "b1")], 4, 1, "green");
    s.rng = 1;
    s = move(s, "b1", "b2");
    checkpoint(s);
    expect(replay(JSON.parse(JSON.stringify(s.events)))).toEqual(
      (({ journal: _journal, ...body }) => body)(s),
    );
  });
  it("triplice ripetizione soltanto classica", () => {
    let s = createGame(1, 0, []);
    s = start(s);
    for (let i = 0; i < 2; i++) {
      s = move(s, "g1", "f3");
      s = move(s, "g8", "f6");
      s = move(s, "f3", "g1");
      s = move(s, "f6", "g8");
    }
    expect(s.outcome?.winner).toBeNull();
    expect(s.outcome?.reason).toBe("Threefold repetition");
  });
  it("stallo con carta numerica senza soluzione: patta dopo una pesca", () => {
    let s = fixture(
      [
        p("wk", "w", "k", "a1"),
        p("bk", "b", "k", "c2"),
        p("bq", "b", "q", "b3"),
      ],
      [card(), ...tail()],
    );
    s = start(s);
    expect(s.outcome?.reason).toContain("Stalemate");
    expect(s.deckIndex).toBe(1);
  });
  it("invarianti dopo 120 azioni deterministiche", () => {
    let s = start(createGame(2026));
    for (let i = 0; i < 120 && !s.outcome; i++) {
      assertInvariants(s);
      if (s.phase === "CHOOSE_COLOR")
        s = act(s, { type: "ChooseUnoColor", color: "blue" });
      else if (s.phase === "CHOOSE_TARGETS") {
        if (s.current?.kind === "skip") {
          const t = s.pieces.find(
            (p) =>
              p.army !== s.control[s.active] &&
              p.square !== null &&
              p.type !== "k",
          )!;
          s = act(s, { type: "ChooseSkipTarget", pieceId: t.id });
        } else if (s.current?.kind === "wild") {
          s = act(s, { type: "ChooseEvolution", ...evolutionChoices(s)[0] });
        } else {
          const limit = s.current?.kind === "draw4" ? 4 : 2;
          s = act(s, {
            type: "ChooseResurrections",
            pieceIds: availableResurrections(s)
              .slice(0, limit)
              .map((p) => p.id),
          });
        }
      } else if (canEnd(s)) s = act(s, { type: "EndOptionalMoves" });
      else {
        const m = movesAllowed(s)[i % movesAllowed(s).length];
        expect(m).toBeDefined();
        s = act(s, {
          type: "SubmitMove",
          from: m.from,
          to: m.to,
          promotion: m.promotion,
        });
      }
    }
    assertInvariants(s);
  });
});
describe("regressioni e casi limite", () => {
  it("engine: perft iniziale 20, 400, 8902", () => {
    const initial = createGame();
    initial.mode = "classical";
    function count(s: State, army: "w" | "b", depth: number): number {
      if (depth === 0) return 1;
      let n = 0;
      for (const m of engine.legalMoves(s, army)) {
        const next = {
          ...s,
          pieces: structuredClone(s.pieces),
          ep: structuredClone(s.ep),
        };
        engine.apply(next, m);
        next.turn++;
        n += count(next, army === "w" ? "b" : "w", depth - 1);
      }
      return n;
    }
    expect(count(initial, "w", 1)).toBe(20);
    expect(count(initial, "w", 2)).toBe(400);
    expect(count(initial, "w", 3)).toBe(8902);
  });
  it("resurrezione che lascia matto perde senza seconda pesca", () => {
    let s = demo("emergency", 0);
    const dead = p("wr", "w", "r", "h1");
    dead.square = null;
    s.pieces.push(dead);
    s.deck = [card("draw2", "blue"), ...tail()];
    s = start(s);
    expect(s.phase).toBe("CHOOSE_TARGETS");
    s = act(s, { type: "ChooseResurrections", pieceIds: ["wr"] });
    expect(s.outcome?.winner).toBe("P2");
    expect(s.deckIndex).toBe(1);
  });
  it("Wild choices stay identical with recorded history and do not mutate the match", () => {
    const s = createGame(42, 0);
    s.phase = "CHOOSE_TARGETS";
    s.current = card("wild", null);
    const expected = s.pieces
      .filter((piece) => piece.army === "w" && piece.type === "p")
      .flatMap((piece) =>
        (["r", "b", "n"] as const).map((pieceType) => ({
          pieceId: piece.id,
          pieceType,
        })),
      );
    expect(evolutionChoices(s)).toEqual(expected);
    for (let i = 0; i < 100; i++) checkpoint(s);
    const before = structuredClone(s);
    expect(evolutionChoices(s)).toEqual(expected);
    expect(s).toEqual(before);
  });
  it("evoluzione di salvataggio senza difesa è vietata", () => {
    const s = demo("emergency", 0);
    s.pieces.push(p("wp", "w", "p", "h2"));
    s.phase = "CHOOSE_TARGETS";
    s.current = card("wild", null);
    s.optionalSpecial = true;
    expect(evolutionChoices(s).some((c) => c.pieceType === "n")).toBe(false);
    expect(
      dispatch(s, { type: "ChooseEvolution", pieceId: "wp", pieceType: "n" }, 0)
        .ok,
    ).toBe(false);
  });
  it("resurrezione che dà scacco termina senza mossa facoltativa", () => {
    let s = bare([], [card("draw2", "blue"), ...tail()]);
    const dead = p("wr", "w", "r", "h1");
    dead.square = null;
    s.pieces.push(dead);
    s = start(s);
    s = act(s, { type: "ChooseResurrections", pieceIds: ["wr"] });
    expect(s.active).toBe("P2");
    expect(s.phase).toBe("PRE_DRAW_DEFENSE");
    expect(s.events.filter((e) => e.type === "MoveCompleted")).toHaveLength(0);
  });
  it("trasformazione che dà scacco termina senza mossa", () => {
    let s = bare([p("wp", "w", "p", "h2")], [card("wild", null), ...tail()]);
    s = start(s);
    s = act(s, { type: "ChooseUnoColor", color: "green" });
    s = act(s, { type: "ChooseEvolution", pieceId: "wp", pieceType: "r" });
    expect(s.active).toBe("P2");
    expect(s.phase).toBe("PRE_DRAW_DEFENSE");
  });
  it("Reverse assegna matto al giocatore attivo e usa una emergenza", () => {
    let s = fixture(
      [
        p("wk", "w", "k", "c3", "e1"),
        p("wq", "w", "q", "b2", "d1"),
        p("bk", "b", "k", "a1", "e8"),
      ],
      [card("reverse", "blue"), card("reset", "green"), ...tail()],
    );
    s = start(s);
    expect(s.control.P1).toBe("b");
    expect(s.deckIndex).toBe(2);
    expect(s.outcome).toBeNull();
    expect(s.rescue).toBe("mate");
    expect(s.current?.kind).toBe("reset");
  });
  it("Reverse trasferisce matto all’avversario e pesca una sola emergenza", () => {
    let s = demo("emergency", 0);
    s.phase = "CHOOSE_COLOR";
    s.current = card("reverse", null);
    s.turn = 1;
    s.deck = [card("reset", "green"), ...tail()];
    s = startReverse(s);
    expect(s.active).toBe("P2");
    expect(s.control.P2).toBe("w");
    expect(s.rescue).toBe("mate");
    expect(s.deckIndex).toBe(1);
    expect(s.current?.kind).toBe("reset");
  });
  it("Skip rinnova la durata senza accumularla", () => {
    let s = createGame(7, 0, [card("skip", "blue"), ...tail()]);
    const target = s.pieces.find((p) => p.id === "b-48")!;
    target.blocked = true;
    target.blockedAtTurn = -100;
    s = start(s);
    s = act(s, { type: "ChooseSkipTarget", pieceId: target.id });
    expect(s.pieces.find((p) => p.id === target.id)!.blockedAtTurn).toBe(
      s.turn,
    );
    s = act(s, { type: "EndOptionalMoves" });
    s = move(s, "b7", "b6");
    expect(s.pieces.find((p) => p.id === target.id)!.blocked).toBe(false);
  });
  it("blocchi mantengono attacchi anche dopo evoluzione", () => {
    let s = createGame(7, 0, [card("wild", null), ...tail()]);
    const target = s.pieces.find((p) => p.id === "w-8")!;
    target.blocked = true;
    s = start(s);
    s = act(s, { type: "ChooseUnoColor", color: "blue" });
    s = act(s, { type: "ChooseEvolution", pieceId: target.id, pieceType: "n" });
    expect(attacked(s, sq("b4"), "w")).toBe(true);
  });
  it("più opportunità en passant durano per il turno avversario", () => {
    let s = playing(
      [
        p("wp", "w", "p", "c2"),
        p("wp2", "w", "p", "e2"),
        p("bp", "b", "p", "d4"),
      ],
      0,
      2,
    );
    s.pieces
      .filter((p) => p.type === "p" && p.army === "w")
      .forEach((p) => (p.moved = false));
    s = move(s, "c2", "c4");
    s = move(s, "e2", "e4");
    expect(s.ep).toHaveLength(2);
    expect(
      movesAllowed(s).filter((m) => m.from === sq("d4") && m.captureId),
    ).toHaveLength(2);
  });
  it("arrocco classico costa una mossa", () => {
    let s = bare([p("wr", "w", "r", "h1")], []);
    const k = s.pieces.find((p) => p.id === "wk")!;
    k.square = sq("e1");
    k.home = sq("e1");
    k.moved = false;
    const r = s.pieces.find((p) => p.id === "wr")!;
    r.moved = false;
    s = start(s);
    expect(movesAllowed(s).find((m) => m.castleRook)?.cost).toBe(1);
    s = move(s, "e1", "g1");
    expect(s.active).toBe("P2");
  });
  it("conteggio 50 mosse classico, disabilitato UNO", () => {
    let s = start(createGame(7, 0, []));
    s.halfmoves = 99;
    s = move(s, "g1", "f3");
    expect(s.outcome?.reason).toBe("50-move rule");
    let u = playing([p("wr", "w", "r", "b1")]);
    u.halfmoves = 99;
    u = move(u, "b1", "b2");
    expect(u.outcome).toBeNull();
  });
  it("replay include anche il tempo trascorso dopo l’ultima mossa", () => {
    let s = start(createGame());
    s = act(s, { type: "AdvanceTime" }, 1234);
    expect(replay(s.events)).toEqual(
      (({ journal: _journal, ...body }) => body)(s),
    );
  });
  it("Skip senza bersagli applica fallback prima dello stallo", () => {
    let s = bare([p("wr", "w", "r", "b1")], [card("skip", "red"), ...tail()]);
    s = start(s);
    expect(s.phase).toBe("RESOLVE_MOVES");
    expect(s.optionalSpecial).toBe(true);
    s = move(s, "b1", "b2");
    expect(s.clock.remaining.P2).toBe(417000);
  });
  it("matto successivo offre un nuovo tentativo finché ci sono carte", () => {
    let s = start(demo("emergency", 0));
    s = act(s, { type: "EndOptionalMoves" });
    s.pieces = [
      p("wk", "w", "k", "c3", "e1"),
      p("wq", "w", "q", "b3", "d1"),
      p("bk", "b", "k", "a1", "e8"),
    ];
    s.active = "P1";
    s.phase = "RESOLVE_MOVES";
    s.budget = 1;
    s.optionalSpecial = false;
    s.current = card();
    s.used = [];
    s.deckIndex = 0;
    s.transitionPending = false;
    s.mode = "uno";
    s.deck = [card("reset", "green"), ...tail()];
    s = move(s, "b3", "b2");
    expect(s.active).toBe("P2");
    expect(s.rescue).toBe("mate");
    expect(s.deckIndex).toBe(1);
    expect(s.outcome).toBeNull();
  });
  it("stallo sbloccato da Reset concede il resto del turno", () => {
    let s = fixture(
      [
        p("wk", "w", "k", "a1", "e1"),
        p("bk", "b", "k", "c2", "e8"),
        p("bq", "b", "q", "b3", "d8"),
      ],
      [card("reset", "green"), ...tail()],
    );
    s = start(s);
    expect(s.rescue).toBe("stalemate");
    expect(s.phase).toBe("RESOLVE_MOVES");
    expect(s.outcome).toBeNull();
  });
  it("difesa sotto giallo accoda bonus dopo pesca con nuovo colore", () => {
    let s = fixture(
      [
        p("wk", "w", "k", "e1"),
        p("wr", "w", "r", "a2"),
        p("bk", "b", "k", "h8"),
        p("br", "b", "r", "e2"),
      ],
      [card("number", "green", 1), ...tail()],
    );
    s.color = "yellow";
    s = start(s);
    s = move(s, "a2", "e2");
    expect(s.yellow).toBe(1);
    expect(s.color).toBe("green");
    expect(s.budget).toBe(1);
    expect(s.moveIndex).toBe(0);
  });
});

describe("laboratorio", () => {
  it("legge un mazzo ordinato con identità uniche", () => {
    const d = parseDeck("R4 VSkip BReverse G+2 J +4 R0 R4");
    expect(d.map((c) => c.kind)).toEqual([
      "number",
      "skip",
      "reverse",
      "draw2",
      "wild",
      "draw4",
      "reset",
      "number",
    ]);
    expect(new Set(d.map((c) => c.id)).size).toBe(8);
    expect(() => parseDeck("R11")).toThrow();
    expect(() => parseDeck("")).toThrow();
  });
});
describe("diritti e chiavi di ripetizione", () => {
  it("idoneità torre irrilevante se il re ha già perso arrocco", () => {
    const s = createGame();
    s.mode = "classical";
    s.pieces.find((p) => p.id === "w-4")!.moved = true;
    const key = engine.positionKey(s);
    s.pieces.find((p) => p.id === "w-0")!.moved = true;
    expect(engine.positionKey(s)).toBe(key);
  });
});
