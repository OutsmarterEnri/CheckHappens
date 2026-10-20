import type { Command, State, PieceType } from "./types";
import { otherArmy } from "./types";
import {
  availableResurrections,
  resurrectionCount,
  evolutionChoices,
  movesAllowed,
  canEnd,
} from "./rules";
import { random, colors, risk } from "./cards";
import { engine, attacked } from "../engine/implementation";
import { botProfiles, type BotLevel } from "./match";
const value: Record<PieceType, number> = {
  p: 1,
  n: 3,
  b: 3.2,
  r: 5,
  q: 9,
  k: 0,
};
/** Training strengths are deliberately approximate, not calibrated Elo ratings. */
export function computerCommand(
  s: State,
  seed: number,
  level: BotLevel = "easy",
): Command | null {
  if (s.outcome || s.phase === "READY") return null;
  let rng = seed || 1;
  const roll = () => {
    let r;
    [r, rng] = random(rng);
    return r;
  };
  const pick = <T>(xs: T[]) => xs[Math.floor(roll() * xs.length)];
  const profile = botProfiles[level];
  if (s.phase === "CHOOSE_COLOR")
    return {
      type: "ChooseUnoColor",
      color:
        level === "easy"
          ? pick(colors)
          : s.clock.remaining[s.active] < 60000
            ? "green"
            : s.moveIndex >= 4
              ? "blue"
              : "yellow",
    };
  if (s.phase === "CHOOSE_TARGETS") {
    if (s.current?.kind === "skip") {
      const targets = s.pieces.filter(
        (p) =>
          p.square !== null && p.army !== s.control[s.active] && p.type !== "k",
      );
      const target =
        level === "hard"
          ? [...targets].sort((a, b) => value[b.type] - value[a.type])[0]
          : pick(targets);
      return target ? { type: "ChooseSkipTarget", pieceId: target.id } : null;
    }
    if (s.current?.kind === "wild") {
      const choices = evolutionChoices(s);
      const choice =
        level === "hard"
          ? (choices.find((c) => c.pieceType === "r") ?? choices[0])
          : pick(choices);
      return choice ? { type: "ChooseEvolution", ...choice } : null;
    }
    if (s.current?.kind === "draw2" || s.current?.kind === "draw4") {
      const available = [...availableResurrections(s)];
      if (level === "hard")
        available.sort((a, b) => value[b.original] - value[a.original]);
      const ids: string[] = [];
      while (ids.length < resurrectionCount(s)) {
        const p = level === "hard" ? available[0] : pick(available);
        ids.push(p.id);
        available.splice(available.indexOf(p), 1);
      }
      return { type: "ChooseResurrections", pieceIds: ids };
    }
  }
  const moves = movesAllowed(s);
  if (!moves.length) return null;
  if (
    canEnd(s) &&
    roll() < (level === "hard" ? 0.8 : level === "medium" ? 0.65 : 0.55)
  )
    return { type: "EndOptionalMoves" };
  let move = pick(moves);
  if (roll() > profile.randomness) {
    let best = -Infinity;
    for (const m of moves) {
      const p = s.pieces.find((p) => p.id === m.pieceId)!;
      let score =
        (m.captureId
          ? value[s.pieces.find((p) => p.id === m.captureId)!.type]
          : 0) +
        (m.promotion ? value[m.promotion] - 1 : 0) +
        roll() * 0.25;
      if (level === "hard") {
        const next = {
          ...s,
          pieces: structuredClone(s.pieces),
          ep: structuredClone(s.ep),
        };
        engine.apply(next, m);
        if (attacked(next, m.to, otherArmy(p.army)))
          score -= value[p.type] * 0.85;
        if (engine.inCheck(next, otherArmy(p.army))) score += 0.7;
        score -= risk(s.moveIndex + 1, s.color) * value[p.type];
      }
      if (score > best) {
        best = score;
        move = m;
      }
    }
  }
  return {
    type: "SubmitMove",
    from: move.from,
    to: move.to,
    promotion: move.promotion,
  };
}
