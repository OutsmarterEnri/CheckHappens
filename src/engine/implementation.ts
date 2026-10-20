import type { Army, Move, Piece, State } from "../domain/types";
import { otherArmy } from "../domain/types";
import type { ChessEngineAdapter } from "./ChessEngineAdapter";
const file = (s: number) => s % 8,
  rank = (s: number) => Math.floor(s / 8);
const inside = (x: number, y: number) => x >= 0 && x < 8 && y >= 0 && y < 8;
const at = (s: State, sq: number) => s.pieces.find((p) => p.square === sq);
const knight = [
  [1, 2],
  [2, 1],
  [2, -1],
  [1, -2],
  [-1, -2],
  [-2, -1],
  [-2, 1],
  [-1, 2],
];
const diagonal = [
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];
const straight = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];
export function attacked(s: State, target: number, by: Army): boolean {
  for (const p of s.pieces) {
    if (p.army !== by || p.square === null) continue;
    const dx = file(target) - file(p.square),
      dy = rank(target) - rank(p.square);
    if (p.type === "p") {
      if (Math.abs(dx) === 1 && dy === (by === "w" ? 1 : -1)) return true;
      continue;
    }
    if (p.type === "n") {
      if (Math.abs(dx) * Math.abs(dy) === 2) return true;
      continue;
    }
    if (p.type === "k") {
      if (Math.max(Math.abs(dx), Math.abs(dy)) === 1) return true;
      continue;
    }
    const diag = Math.abs(dx) === Math.abs(dy) && dx !== 0;
    const line = (dx === 0) !== (dy === 0);
    if (!(
      (p.type === "b" && diag) ||
      (p.type === "r" && line) ||
      (p.type === "q" && (diag || line))
    ))
      continue;
    let x = file(p.square) + Math.sign(dx),
      y = rank(p.square) + Math.sign(dy),
      clear = true;
    while (x !== file(target) || y !== rank(target)) {
      if (at(s, y * 8 + x)) {
        clear = false;
        break;
      }
      x += Math.sign(dx);
      y += Math.sign(dy);
    }
    if (clear) return true;
  }
  return false;
}
export function inCheck(s: State, a: Army): boolean {
  const king = s.pieces.find(
    (p) => p.army === a && p.type === "k" && p.square !== null,
  );
  return !king || attacked(s, king.square!, otherArmy(a));
}
function pseudo(s: State, p: Piece): Move[] {
  if (p.square === null || p.blocked) return [];
  const origin = p.square,
    x = file(origin),
    y = rank(origin),
    moves: Move[] = [];
  const add = (to: number, captureId?: string) => {
    if (at(s, to)?.type === "k") return;
    const base: Move = { from: origin, to, pieceId: p.id, captureId, cost: 1 };
    if (p.type === "p" && (rank(to) === 0 || rank(to) === 7)) {
      for (const promotion of ["q", "r", "b", "n"] as const)
        moves.push({ ...base, promotion });
    } else moves.push(base);
  };
  if (p.type === "p") {
    const d = p.army === "w" ? 1 : -1,
      one = origin + d * 8;
    if (inside(x, y + d) && !at(s, one)) {
      add(one);
      const two = origin + d * 16;
      if (y === (p.army === "w" ? 1 : 6) && !p.moved && !at(s, two)) add(two);
    }
    for (const dx of [-1, 1]) {
      if (!inside(x + dx, y + d)) continue;
      const to = (y + d) * 8 + x + dx,
        enemy = at(s, to);
      if (enemy && enemy.army !== p.army) add(to, enemy.id);
      if (!enemy)
        for (const ep of s.ep) {
          const victim = s.pieces.find((q) => q.id === ep.pawnId);
          if (
            ep.target === to &&
            ep.eligibleArmy === p.army &&
            ep.expiresAfterTurn >= s.turn &&
            victim?.square === y * 8 + x + dx &&
            victim.type === "p"
          )
            add(to, victim.id);
        }
    }
    return moves;
  }
  const dirs =
    p.type === "n"
      ? knight
      : p.type === "b"
        ? diagonal
        : p.type === "r"
          ? straight
          : [...diagonal, ...straight];
  for (const [dx, dy] of dirs) {
    for (let n = 1; n <= 7; n++) {
      const nx = x + dx * n,
        ny = y + dy * n;
      if (!inside(nx, ny)) break;
      const to = ny * 8 + nx,
        q = at(s, to);
      if (q?.army === p.army) break;
      add(to, q?.id);
      if (q || p.type === "n" || p.type === "k") break;
    }
  }
  if (p.type === "k" && !p.moved && origin === p.home && !inCheck(s, p.army)) {
    for (const side of [-1, 1]) {
      const home = rank(origin) * 8 + (side === 1 ? 7 : 0);
      const rook = s.pieces.find(
        (q) =>
          q.army === p.army &&
          q.type === "r" &&
          q.original === "r" &&
          q.home === home &&
          q.square === home &&
          !q.moved &&
          !q.blocked,
      );
      if (!rook) continue;
      let clear = true;
      for (let f = x + side; f !== (side === 1 ? 7 : 0); f += side)
        if (at(s, y * 8 + f)) clear = false;
      if (clear) {
        const mid = origin + side,
          to = origin + side * 2;
        const temp = {
          ...s,
          pieces: structuredClone(s.pieces),
          ep: structuredClone(s.ep),
        };
        temp.pieces.find((q) => q.id === p.id)!.square = mid;
        if (!inCheck(temp, p.army)) {
          temp.pieces.find((q) => q.id === p.id)!.square = to;
          if (!inCheck(temp, p.army))
            moves.push({
              from: origin,
              to,
              pieceId: p.id,
              castleRook: rook.id,
              rookTo: origin + side,
              cost: s.mode === "uno" ? 2 : 1,
            });
        }
      }
    }
  }
  return moves;
}
export function eliminate(s: State, id: string, cause: Piece["death"]): void {
  const p = s.pieces.find((q) => q.id === id)!;
  p.square = null;
  p.blocked = false;
  p.death = cause;
  s.ep = s.ep.filter((e) => e.pawnId !== id);
}
export function apply(s: State, m: Move): void {
  const p = s.pieces.find((q) => q.id === m.pieceId)!;
  if (m.captureId) eliminate(s, m.captureId, "capture");
  p.square = m.to;
  p.moved = true;
  if (m.promotion) p.type = m.promotion;
  if (m.castleRook) {
    const rook = s.pieces.find((q) => q.id === m.castleRook)!;
    rook.square = m.rookTo!;
    rook.moved = true;
  }
  s.ep = s.ep.filter((e) => e.pawnId !== p.id);
  if (p.type === "p" && Math.abs(m.to - m.from) === 16)
    s.ep.push({
      pawnId: p.id,
      target: (m.from + m.to) / 2,
      eligibleArmy: otherArmy(p.army),
      expiresAfterTurn: s.turn + 1,
    });
}
export function legalMoves(s: State, a: Army): Move[] {
  const moves: Move[] = [];
  for (const p of s.pieces) {
    if (p.army !== a) continue;
    for (const m of pseudo(s, p)) {
      const temp = {
        ...s,
        pieces: structuredClone(s.pieces),
        ep: structuredClone(s.ep),
      };
      apply(temp, m);
      if (!inCheck(temp, a)) moves.push(m);
    }
  }
  return moves;
}
export function initialPieces(): Piece[] {
  const pieces: Piece[] = [];
  const back: Piece["type"][] = ["r", "n", "b", "q", "k", "b", "n", "r"];
  for (const army of ["w", "b"] as const)
    for (let f = 0; f < 8; f++) {
      for (const [r, type] of [
        [army === "w" ? 0 : 7, back[f]],
        [army === "w" ? 1 : 6, "p"],
      ] as [number, Piece["type"]][]) {
        const home = r * 8 + f;
        pieces.push({
          id: `${army}-${home}`,
          army,
          original: type,
          type,
          home,
          square: home,
          moved: false,
          blocked: false,
        });
      }
    }
  return pieces;
}
function deadPosition(s: State): boolean {
  const non = s.pieces.filter((p) => p.square !== null && p.type !== "k");
  if (!non.length) return true;
  if (non.length === 1 && ["b", "n"].includes(non[0].type)) return true;
  return (
    non.every((p) => p.type === "b") &&
    new Set(non.map((p) => (file(p.square!) + rank(p.square!)) % 2)).size === 1
  );
}
function canPossiblyMate(s: State, a: Army): boolean {
  const own = s.pieces.filter(
    (p) => p.square !== null && p.army === a && p.type !== "k",
  );
  if (!own.length) return false;
  if (deadPosition(s)) return false;
  return true;
}
function castlingRights(s: State): string[] {
  const rights: string[] = [];
  for (const army of ["w", "b"] as const) {
    const rank = army === "w" ? 0 : 7;
    const king = s.pieces.find(
      (p) =>
        p.army === army &&
        p.type === "k" &&
        p.square === rank * 8 + 4 &&
        !p.moved,
    );
    if (!king) continue;
    for (const file of [0, 7])
      if (
        s.pieces.some(
          (p) =>
            p.army === army &&
            p.original === "r" &&
            p.type === "r" &&
            p.square === rank * 8 + file &&
            p.home === rank * 8 + file &&
            !p.moved,
        )
      )
        rights.push(`${army}-${file}`);
  }
  return rights;
}
export function positionKey(s: State): string {
  return JSON.stringify({
    board: s.pieces
      .filter((p) => p.square !== null)
      .map((p) => [p.army, p.type, p.square])
      .sort((a, b) => Number(a[2]) - Number(b[2])),
    army: s.control[s.active],
    castle: castlingRights(s),
    ep: s.ep
      .filter(
        (e) =>
          e.eligibleArmy === s.control[s.active] && legalMovesWithoutKey(s, e),
      )
      .map((e) => e.target)
      .sort(),
  });
}
function legalMovesWithoutKey(s: State, e: State["ep"][number]): boolean {
  return legalMoves(s, e.eligibleArmy).some(
    (m) => m.to === e.target && m.captureId === e.pawnId,
  );
}
export const engine: ChessEngineAdapter = {
  legalMoves,
  inCheck,
  apply,
  positionKey,
  canPossiblyMate,
  deadPosition,
};
