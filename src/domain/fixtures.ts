import { createGame } from "./turnResolver";
import { square, type Card, type Piece, type State } from "./types";
export function testPiece(
  id: string,
  army: Piece["army"],
  type: Piece["type"],
  at: string,
  home = at,
): Piece {
  return {
    id,
    army,
    type,
    original: type,
    home: square(home),
    square: square(at),
    moved: true,
    blocked: false,
  };
}
export function fixture(pieces: Piece[], deck: Card[], now = 0): State {
  const s = createGame(42, now, deck);
  s.pieces = pieces;
  return s;
}
const c = (
  kind: Card["kind"],
  color: Card["color"] = "green",
  value?: number,
): Card => ({
  id: `fixture-${kind}-${color}-${value ?? ""}`,
  kind,
  color,
  value,
});
export function demo(name: string, now: number): State {
  if (name === "breakage") {
    const s = fixture(
      [
        testPiece("wk", "w", "k", "a1"),
        testPiece("wr", "w", "r", "b1"),
        testPiece("wn", "w", "n", "d2"),
        testPiece("bk", "b", "k", "h8"),
        testPiece("bp", "b", "p", "b3"),
      ],
      [c("number", "red", 9), c("number", "blue", 2)],
      now,
    );
    s.phase = "RESOLVE_MOVES";
    s.turn = 1;
    s.current = s.deck[0];
    s.deckIndex = 1;
    s.color = "red";
    s.budget = 5;
    s.moveIndex = 4;
    s.rng = 1;
    return s;
  }
  if (name === "win" || name === "lose" || name === "draw") {
    const s = createGame(42, now, []);
    s.phase = "GAME_OVER";
    s.outcome = {
      winner: name === "draw" ? null : name === "win" ? "P1" : "P2",
      reason: name === "draw" ? "Stalemate" : "Checkmate",
    };
    return s;
  }
  if (name === "resurrection2") {
    const s = demo("resurrection", now);
    s.deck = [
      c("draw2", "red"),
      c("number", "blue", 2),
      c("reverse", "yellow"),
    ];
    return s;
  }
  if (name === "defense") {
    const s = fixture(
      [
        testPiece("wk", "w", "k", "e1"),
        testPiece("wr", "w", "r", "a1"),
        testPiece("wn", "w", "n", "b1"),
        testPiece("wp", "w", "p", "d2"),
        testPiece("bk", "b", "k", "h8"),
        testPiece("br", "b", "r", "e8"),
      ],
      [c("number", "green", 4), c("skip", "blue"), c("number", "red", 2)],
      now,
    );
    s.color = "red";
    return s;
  }
  if (name === "resurrection") {
    const s = createGame(42, now, [
      c("draw4", null),
      c("wild", null),
      c("reverse", "yellow"),
      c("number", "blue", 9),
    ]);
    for (const p of s.pieces)
      if (["w-0", "w-1", "w-2", "w-8"].includes(p.id)) {
        p.square = null;
        p.death = "capture";
      }
    return s;
  }
  if (name === "risk")
    return createGame(42, now, [
      c("number", "blue", 9),
      c("number", "yellow", 9),
      c("reverse", "red"),
    ]);
  if (name === "emergency")
    return fixture(
      [
        testPiece("wk", "w", "k", "a1", "e1"),
        testPiece("bk", "b", "k", "c3", "e8"),
        testPiece("bq", "b", "q", "b2", "d8"),
      ],
      [c("reset", "green"), c("number", "red", 3)],
      now,
    );
  if (name === "last") return createGame(42, now, [c("number", "green", 2)]);
  if (name === "yellow")
    return fixture(
      [
        testPiece("wk", "w", "k", "a1"),
        testPiece("wr", "w", "r", "b1"),
        testPiece("wb", "w", "b", "c1"),
        testPiece("wn", "w", "n", "e3"),
        testPiece("bk", "b", "k", "h8"),
        testPiece("bp", "b", "p", "b3"),
        testPiece("bp2", "b", "p", "d2"),
      ],
      [c("number", "yellow", 1), c("reverse", "blue")],
      now,
    );
  return createGame(2026, now);
}
