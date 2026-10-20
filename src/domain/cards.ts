import { policies } from "./policies";
import type { Card, UnoColor } from "./types";
export const colors: UnoColor[] = ["red", "green", "blue", "yellow"];
export function random(seed: number): [number, number] {
  let n = seed >>> 0;
  n ^= n << 13;
  n ^= n >>> 17;
  n ^= n << 5;
  return [(n >>> 0) / 4294967296, n >>> 0];
}
export function makeDeck(): Card[] {
  const cards: Card[] = [];
  const add = (c: Omit<Card, "id">) =>
    cards.push({ ...c, id: `card-${cards.length}` });
  for (const color of colors) {
    add({ kind: "reset", color, value: 0 });
    for (let n = 1; n <= 9; n++)
      for (let j = 0; j < 2; j++) add({ kind: "number", color, value: n });
    for (const kind of ["skip", "reverse", "draw2"] as const)
      for (let j = 0; j < 2; j++) add({ kind, color });
  }
  for (let i = 0; i < 4; i++) {
    add({ kind: "wild", color: null });
    add({ kind: "draw4", color: null });
  }
  return cards;
}
export function shuffled(seed: number): { deck: Card[]; rng: number } {
  const deck = makeDeck();
  let rng = seed || 1;
  for (let i = deck.length - 1; i > 0; i--) {
    let r;
    [r, rng] = random(rng);
    const j = Math.floor(r * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return { deck, rng };
}
export function risk(index: number, color: UnoColor | null): number {
  const r = policies.riskByMove[index - 1] ?? policies.riskAfterNinth;
  return color === "blue" ? r * (policies.blueRiskMultiplier[index] ?? 1) : r;
}
export function cardLabel(c: Card | null): string {
  if (!c) return "Waiting";
  return c.kind === "number"
    ? String(c.value)
    : {
        reset: "0",
        skip: "Skip",
        reverse: "Reverse",
        draw2: "+2",
        wild: "Wild",
        draw4: "+4",
      }[c.kind];
}
export function cardDescription(c: Card | null): string {
  if (!c) return "The first card appears when you start.";
  if (c.kind === "number")
    return `${c.value} moves with different pieces. The first ${Math.min(4, c.value!)} are required.`;
  return {
    reset: "Return surviving pieces home. Pawns stay put.",
    skip: "Freeze an enemy piece for its next turn.",
    reverse: "Swap armies and clocks. Play the other side.",
    draw2: "Bring back up to 2 lost pieces.",
    wild: "Evolve a pawn into a rook, bishop or knight.",
    draw4: "Pick a color and bring back up to 4 lost pieces.",
  }[c.kind];
}
/** Mazzo ordinato per il laboratorio: R4 VSkip BReverse G+2 J +4. */
export function parseDeck(text: string): Card[] {
  const tokens = text
    .trim()
    .split(/[\s,;]+/)
    .filter(Boolean);
  if (!tokens.length || tokens.length > 108)
    throw new Error("Enter 1 to 108 cards.");
  const map: Record<string, UnoColor> = {
    R: "red",
    V: "green",
    B: "blue",
    G: "yellow",
  };
  return tokens.map((raw, i) => {
    const token = raw.toUpperCase(),
      id = `custom-${i}`;
    if (token === "J") return { id, kind: "wild", color: null };
    if (token === "+4") return { id, kind: "draw4", color: null };
    const color = map[token[0]],
      symbol = token.slice(1);
    if (!color) throw new Error(`Unknown card: ${raw}`);
    if (/^[0-9]$/.test(symbol))
      return {
        id,
        kind: symbol === "0" ? "reset" : "number",
        color,
        value: Number(symbol),
      };
    const kind = ({ SKIP: "skip", REVERSE: "reverse", "+2": "draw2" } as const)[
      symbol as "SKIP"
    ];
    if (!kind) throw new Error(`Unknown card: ${raw}`);
    return { id, kind, color };
  });
}
