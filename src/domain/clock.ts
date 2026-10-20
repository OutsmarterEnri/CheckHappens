import type { Player, State } from "./types";
import { otherPlayer } from "./types";
import { engine } from "../engine/implementation";
import { emit } from "./events";
export function finish(s: State, winner: Player | null, reason: string): void {
  if (s.outcome) return;
  s.outcome = { winner, reason };
  s.phase = "GAME_OVER";
  emit(s, "GameEnded", `${winner ? `${winner} wins` : "Draw"}: ${reason}`, {
    winner,
    reason,
  });
}
export function timeout(s: State, loser: Player): void {
  const winner = otherPlayer(loser);
  finish(
    s,
    engine.canPossiblyMate(s, s.control[winner]) ? winner : null,
    engine.canPossiblyMate(s, s.control[winner])
      ? "Time expired"
      : "Flag fell: checkmate impossible",
  );
}
export function advance(s: State, now: number): void {
  if (s.phase === "READY" || s.outcome) {
    s.clock.lastAt = now;
    return;
  }
  const elapsed = now - s.clock.lastAt;
  s.clock.lastAt = now;
  s.clock.remaining[s.active] = Math.max(
    0,
    s.clock.remaining[s.active] - elapsed,
  );
  if (s.clock.remaining[s.active] === 0) timeout(s, s.active);
}
export function colorBonus(s: State): void {
  if (s.color === "green") {
    s.clock.remaining[s.active] += 3000;
    emit(s, "ClockAdjusted", `${s.active} +3 seconds`, {
      player: s.active,
      delta: 3000,
    });
  }
  if (s.color === "red") {
    const opponent = otherPlayer(s.active);
    s.clock.remaining[opponent] = Math.max(
      0,
      s.clock.remaining[opponent] - 3000,
    );
    emit(s, "ClockAdjusted", `${opponent} −3 seconds`, {
      player: opponent,
      delta: -3000,
    });
    if (s.clock.remaining[opponent] === 0) timeout(s, opponent);
  }
}
