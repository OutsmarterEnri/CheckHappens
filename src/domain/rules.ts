import type { Move, Piece, State } from "./types";
import { engine, eliminate } from "../engine/implementation";
import { emit } from "./events";
export const availableResurrections = (s: State) =>
  s.pieces.filter(
    (p) =>
      p.army === s.control[s.active] &&
      p.square === null &&
      p.original !== "k" &&
      !s.pieces.some((q) => q.square === p.home),
  );
export const resurrectionCount = (s: State) =>
  Math.min(
    s.current?.kind === "draw4" ? 4 : 2,
    availableResurrections(s).length,
  );
export function movesAllowed(s: State): Move[] {
  if (!["PRE_DRAW_DEFENSE", "RESOLVE_MOVES"].includes(s.phase) || s.outcome)
    return [];
  let moves = engine.legalMoves(s, s.control[s.active]);
  if (s.mode === "classical") return moves;
  if (s.phase === "PRE_DRAW_DEFENSE") return moves;
  return moves.filter(
    (m) =>
      !s.used.includes(m.pieceId) &&
      (!m.castleRook || !s.used.includes(m.castleRook)) &&
      (s.moveIndex < 4 ||
        s.pieces.find((p) => p.id === m.pieceId)!.type !== "k") &&
      (!m.castleRook || (s.budget + s.yellow >= 2 && s.moveIndex + 2 <= 4)) &&
      (s.budget > 0 || s.yellow > 0 || s.optionalSpecial),
  );
}
export function canEnd(s: State): boolean {
  return (
    s.phase === "RESOLVE_MOVES" &&
    !s.outcome &&
    !engine.inCheck(s, s.control[s.active]) &&
    s.yellow === 0 &&
    (s.optionalSpecial || (s.moveIndex >= 4 && s.budget > 0))
  );
}
export function reset(s: State): void {
  const moving = s.pieces.filter((p) => p.square !== null && p.type !== "p");
  for (const p of moving) p.square = null;
  for (const p of moving) {
    const occupant = s.pieces.find((q) => q.square === p.home);
    if (occupant) {
      if (occupant.type === "k") {
        eliminate(s, p.id, "reset");
        continue;
      }
      eliminate(s, occupant.id, "reset");
      if (p.original === "p" && p.type !== "p") {
        eliminate(s, p.id, "reset");
        continue;
      }
    }
    p.square = p.home;
    p.moved = false;
  }
  s.ep = [];
  emit(s, "ResetApplied", "Reset: pieces home, pawns stay");
}
export function resurrect(s: State, ids: string[]): void {
  for (const id of ids) {
    const p = s.pieces.find((q) => q.id === id)!;
    p.square = p.home;
    p.type = p.original;
    p.moved = false;
    p.blocked = false;
    delete p.blockedAtTurn;
    delete p.death;
    emit(s, "PieceResurrected", `Resurrection ${p.id}`, {
      pieceId: id,
      square: p.home,
    });
  }
}
export function evolutionChoices(
  s: State,
): { pieceId: string; pieceType: "r" | "b" | "n" }[] {
  const choices: { pieceId: string; pieceType: "r" | "b" | "n" }[] = [];
  for (const p of s.pieces.filter(
    (p) =>
      p.army === s.control[s.active] && p.type === "p" && p.square !== null,
  )) {
    for (const type of ["r", "b", "n"] as const) {
      const copy = structuredClone(s);
      copy.pieces.find((q) => q.id === p.id)!.type = type;
      if (!engine.inCheck(copy, copy.control[copy.active]))
        choices.push({ pieceId: p.id, pieceType: type });
      else if (!s.specialConsumed || s.yellow > 0) {
        copy.phase = "RESOLVE_MOVES";
        copy.optionalSpecial = !s.specialConsumed;
        if (movesAllowed(copy).length)
          choices.push({ pieceId: p.id, pieceType: type });
      }
    }
  }
  return choices;
}
export function assertInvariants(s: State): void {
  const phases = [
    "READY",
    "TURN_START",
    "PRE_DRAW_DEFENSE",
    "DRAW",
    "CHOOSE_COLOR",
    "RESOLVE_EFFECT",
    "CHOOSE_TARGETS",
    "RESOLVE_MOVES",
    "EMERGENCY_DRAW",
    "STALEMATE_RESCUE",
    "TURN_END",
    "GAME_OVER",
  ];
  if (
    !s ||
    s.version !== 1 ||
    !phases.includes(s.phase) ||
    !["P1", "P2"].includes(s.active) ||
    !["w", "b"].includes(s.orientation) ||
    !["uno", "classical"].includes(s.mode)
  )
    throw new Error("Invalid match state");
  if (
    !Array.isArray(s.pieces) ||
    s.pieces.length > 32 ||
    !Array.isArray(s.events)
  )
    throw new Error("Invalid pieces or events");
  const sq = (n: number) => Number.isInteger(n) && n >= 0 && n < 64;
  if (
    s.pieces.some(
      (p) =>
        !p ||
        typeof p.id !== "string" ||
        !["w", "b"].includes(p.army) ||
        !["p", "n", "b", "r", "q", "k"].includes(p.type) ||
        !["p", "n", "b", "r", "q", "k"].includes(p.original) ||
        !sq(p.home) ||
        (p.square !== null && !sq(p.square)),
    )
  )
    throw new Error("Invalid piece");
  if (
    ![s.clock?.lastAt, s.clock?.remaining?.P1, s.clock?.remaining?.P2].every(
      Number.isFinite,
    )
  )
    throw new Error("Invalid clock");
  if (
    ![s.turn, s.budget, s.moveIndex, s.yellow, s.deckIndex, s.halfmoves].every(
      (n) => Number.isInteger(n) && n >= 0,
    )
  )
    throw new Error("Invalid counters");
  if (
    !Array.isArray(s.deck) ||
    s.deckIndex > s.deck.length ||
    !Number.isFinite(s.rng) ||
    !Number.isFinite(s.seed)
  )
    throw new Error("Invalid deck or random state");
  for (const c of s.deck) {
    if (
      !c ||
      typeof c.id !== "string" ||
      ![
        "number",
        "reset",
        "skip",
        "reverse",
        "draw2",
        "wild",
        "draw4",
      ].includes(c.kind) ||
      (c.color !== null &&
        !["red", "green", "blue", "yellow"].includes(c.color)) ||
      (c.kind === "number" &&
        (!Number.isInteger(c.value) || c.value! < 1 || c.value! > 9))
    )
      throw new Error("Invalid card");
  }
  if (
    !["w", "b"].includes(s.control?.P1) ||
    !["w", "b"].includes(s.control?.P2) ||
    (s.color !== null && !["red", "green", "blue", "yellow"].includes(s.color))
  )
    throw new Error("Invalid control or color");
  if (
    (s.phase === "GAME_OVER") !== !!s.outcome ||
    (s.outcome && ![null, "P1", "P2"].includes(s.outcome.winner))
  )
    throw new Error("Invalid outcome");

  const live = s.pieces.filter((p) => p.square !== null);
  if (new Set(live.map((p) => p.square)).size !== live.length)
    throw new Error("Two pieces occupy one square");
  if (new Set(s.pieces.map((p) => p.id)).size !== s.pieces.length)
    throw new Error("Duplicate piece IDs");
  for (const a of ["w", "b"])
    if (
      s.pieces.filter(
        (p) => p.army === a && p.type === "k" && p.square !== null,
      ).length !== 1
    )
      throw new Error("Missing king");
  if (Object.values(s.clock.remaining).some((n) => n < 0))
    throw new Error("Negative clock");
  if (s.control.P1 === s.control.P2) throw new Error("Invalid army control");
  if (new Set(s.used).size !== s.used.length)
    throw new Error("Piece used twice");
}
export function clearBlock(p: Piece) {
  p.blocked = false;
  delete p.blockedAtTurn;
}
