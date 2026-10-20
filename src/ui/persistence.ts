import { exportMatch, stateFromLog } from "../domain/audit";
import { assertInvariants } from "../domain/rules";
import { dispatch } from "../domain/turnResolver";
import type { State } from "../domain/types";
export const SAVE_KEY = "scacchi-uno-pocket-v1";
export function saveGame(state: State): void {
  try {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        log: exportMatch(state),
        savedAt:
          Date.now() -
          (state.phase === "READY" || state.outcome
            ? 0
            : Math.max(0, performance.now() - state.clock.lastAt)),
      }),
    );
  } catch {
    /* Private mode or storage quota: the game still works, export remains available. */
  }
}
export function restoreSnapshot(
  state: State,
  savedAt: number,
  wallNow: number,
  monotonicNow: number,
): State {
  assertInvariants(state);
  if (state.version !== 1 || !Number.isFinite(savedAt))
    throw new Error("Invalid saved match");
  const restored = structuredClone(state);
  restored.clock.lastAt = monotonicNow;
  if (restored.phase !== "READY" && !restored.outcome) {
    restored.clock.lastAt = monotonicNow - Math.max(0, wallNow - savedAt);
    return dispatch(restored, { type: "AdvanceTime" }, monotonicNow, "resume")
      .state;
  }
  return restored;
}
export function restoreGame(): State | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return restoreSnapshot(
      data.log ? stateFromLog(data.log) : data.state,
      data.savedAt,
      Date.now(),
      performance.now(),
    );
  } catch {
    return null;
  }
}
