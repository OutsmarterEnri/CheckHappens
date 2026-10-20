import type { State } from "./types";
export function emit(
  s: State,
  type: string,
  text: string,
  data: Record<string, unknown> = {},
): void {
  s.events.push({ seq: s.events.length, type, text, data });
}
export function checkpoint(s: State): void {
  const { events, journal: _journal, ...snapshot } = s;
  emit(s, "Checkpoint", "State verified", {
    snapshot: structuredClone(snapshot),
  });
}
export function replay(events: State["events"]): State {
  let state: State | undefined;
  for (const e of events) {
    if (e.type === "Checkpoint")
      state = {
        ...structuredClone(e.data.snapshot as Omit<State, "events">),
        events: [],
      };
    else if (e.type === "ClockAdvanced" && state)
      state.clock = structuredClone(e.data.clock as State["clock"]);
  }
  if (!state) throw new Error("Replay has no checkpoint");
  state.events = structuredClone(events);
  return state;
}
