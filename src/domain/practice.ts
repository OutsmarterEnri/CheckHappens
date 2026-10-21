import { createGame, dispatch } from "./turnResolver";
import { demo, fixture, testPiece } from "./fixtures";
import { engine } from "../engine/implementation";
import type { Card, Piece, State, UnoColor } from "./types";
export function practiceCard(index: number, color: UnoColor): Card {
  const kinds = [
    "number",
    "number",
    "draw2",
    "draw4",
    "wild",
    "skip",
    "reverse",
    "reset",
  ] as const;
  const kind = kinds[index] ?? "number";
  return {
    id: "practice-card",
    kind,
    color: kind === "wild" || kind === "draw4" ? null : color,
    ...(kind === "number"
      ? { value: index === 1 ? 7 : 2 }
      : kind === "reset"
        ? { value: 0 }
        : {}),
  };
}
export function practiceSetup(
  index = 0,
  color: UnoColor = "green",
  scenario = "card",
): State {
  if (scenario === "check")
    return fixture(
      [
        testPiece("wk", "w", "k", "a1"),
        testPiece("wr", "w", "r", "b1"),
        testPiece("bk", "b", "k", "h8"),
      ],
      [practiceCard(0, color), practiceCard(0, "red")],
    );
  if (["defense", "emergency", "yellow", "last"].includes(scenario)) {
    const prepared = demo(scenario, 0);
    if (scenario === "yellow") prepared.deck[1] = practiceCard(0, "green");
    return prepared;
  }
  const s = createGame(42, 0, [
    practiceCard(index, color),
    { id: "practice-next", kind: "number", color: "green", value: 2 },
    { id: "practice-last", kind: "number", color: "red", value: 2 },
  ]);
  s.clock.remaining = { P1: 420000, P2: 300000 };
  if (index === 2 || index === 3)
    for (const p of s.pieces)
      if (["w-0", "w-1", "w-2", "w-8"].includes(p.id)) {
        p.square = null;
        p.death = "capture";
      }
  if (index === 7) s.pieces.find((p) => p.id === "w-0")!.square = 24;
  return s;
}
export function beginPractice(input: State, risky = false): State {
  const result = dispatch(
    structuredClone(input),
    { type: "StartGame" },
    0,
    "human",
  );
  if (!result.ok) return result.state;
  const s = result.state;
  if (risky && s.phase === "RESOLVE_MOVES" && s.current?.kind === "number") {
    // Stage the lesson through actual safe moves, preserving used pieces,
    // board positions, color effects and the resolver journal.
    let prepared = s;
    for (const from of [9, 10, 11, 12]) {
      const step = dispatch(
        prepared,
        { type: "SubmitMove", from, to: from + 8 },
        0,
        "human",
      );
      if (!step.ok) throw new Error("Invalid risk lesson setup");
      prepared = step.state;
    }
    return prepared;
  }
  return s;
}
export function positionError(pieces: Piece[]): string | null {
  if (pieces.length > 32) return "Use at most 32 pieces.";
  for (const army of ["w", "b"])
    if (
      pieces.filter(
        (p) => p.army === army && p.type === "k" && p.square !== null,
      ).length !== 1
    )
      return "Place exactly one king for each army.";
  if (
    pieces.some(
      (p) =>
        p.type === "p" && p.square !== null && (p.square < 8 || p.square >= 56),
    )
  )
    return "Pawns cannot start on the first or last rank.";
  const kings = pieces.filter((p) => p.type === "k" && p.square !== null);
  if (
    Math.abs((kings[0].square! % 8) - (kings[1].square! % 8)) <= 1 &&
    Math.abs(
      Math.floor(kings[0].square! / 8) - Math.floor(kings[1].square! / 8),
    ) <= 1
  )
    return "Keep the kings apart.";
  const s = practiceSetup();
  s.pieces = pieces;
  if (engine.inCheck(s, "b"))
    return "Black cannot already be in check when White starts.";
  return null;
}
