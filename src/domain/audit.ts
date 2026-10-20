import type { Command, DomainError, GameEvent, Result, State } from "./types";
import { resolveCommand } from "./turnResolver";
import { assertInvariants } from "./rules";

export type Snapshot = Omit<State, "journal">;
export type ActionSource = "human" | "computer" | "clock" | "resume" | "system";
export interface JournalEntry {
  seq: number;
  elapsedMs: number;
  source: ActionSource;
  player: State["active"];
  turn: number;
  phase: State["phase"];
  command: Command;
  accepted: boolean;
  error?: DomainError;
  events: GameEvent[];
  stateFingerprint: string;
}
export interface Journal {
  initial: Snapshot;
  entries: JournalEntry[];
}
export interface MatchLog {
  format: "check-happens-match";
  version: 1;
  rulesVersion: "2.0.0";
  exportedAt: string;
  journal: Journal;
  final: Snapshot;
}
export interface Verification {
  valid: boolean;
  checked: number;
  rejected: number;
  firstDivergence?: number;
  message: string;
}
export function snapshot(s: State): Snapshot {
  const { journal: _journal, ...body } = s;
  return structuredClone(body);
}
// Clock origins change after reload; durations and remaining time are authoritative.
function canonical(value: unknown): string {
  return JSON.stringify(value, (key, item) => {
    if (key === "lastAt") return 0;
    if (item && typeof item === "object" && !Array.isArray(item))
      return Object.fromEntries(
        Object.keys(item)
          .sort()
          .map((k) => [k, item[k]]),
      );
    return item;
  });
}
export function fingerprint(s: State): string {
  const { events: _events, journal: _journal, ...body } = s;
  const text = canonical(body);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++)
    hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(16).padStart(8, "0");
}
export function record(
  input: State,
  command: Command,
  now: number,
  source: ActionSource,
): Result {
  const { journal, ...body } = input;
  const result = resolveCommand(body, command, now);
  const entry: JournalEntry = {
    seq: journal?.entries.length ?? 0,
    elapsedMs: now - input.clock.lastAt,
    source,
    player: input.active,
    turn: input.turn,
    phase: input.phase,
    command: structuredClone(command),
    accepted: result.ok,
    ...(!result.ok ? { error: result.error } : {}),
    events: structuredClone(result.state.events.slice(input.events.length)),
    stateFingerprint: fingerprint(result.state),
  };
  return {
    ...result,
    state: {
      ...result.state,
      journal: {
        initial: journal?.initial ?? snapshot(input),
        entries: [...(journal?.entries ?? []), entry],
      },
    },
  };
}
export function exportMatch(s: State): MatchLog {
  return {
    format: "check-happens-match",
    version: 1,
    rulesVersion: "2.0.0",
    exportedAt: new Date().toISOString(),
    journal: s.journal ?? { initial: snapshot(s), entries: [] },
    final: snapshot(s),
  };
}
function validCommand(c: Command): boolean {
  if (!c || typeof c !== "object") return false;
  const square = (n: unknown) =>
    Number.isInteger(n) && Number(n) >= 0 && Number(n) < 64;
  switch (c.type) {
    case "StartGame":
    case "AdvanceTime":
    case "EndOptionalMoves":
      return true;
    case "SubmitMove":
      return (
        square(c.from) &&
        square(c.to) &&
        (!c.promotion || ["q", "r", "b", "n"].includes(c.promotion))
      );
    case "ChooseUnoColor":
      return ["red", "green", "blue", "yellow"].includes(c.color);
    case "ChooseSkipTarget":
      return typeof c.pieceId === "string";
    case "ChooseEvolution":
      return (
        typeof c.pieceId === "string" && ["r", "b", "n"].includes(c.pieceType)
      );
    case "ChooseResurrections":
      return (
        Array.isArray(c.pieceIds) &&
        c.pieceIds.length <= 4 &&
        c.pieceIds.every((x) => typeof x === "string")
      );
    default:
      return false;
  }
}
export function verifyMatch(value: unknown): Verification {
  let checked = 0,
    rejected = 0;
  const bad = (message: string, firstDivergence = checked): Verification => ({
    valid: false,
    checked,
    rejected,
    firstDivergence,
    message,
  });
  try {
    const log = value as MatchLog;
    if (
      !log ||
      log.format !== "check-happens-match" ||
      log.version !== 1 ||
      log.rulesVersion !== "2.0.0"
    )
      return bad("Unsupported match log format or rules version.");
    if (
      !log.journal ||
      !Array.isArray(log.journal.entries) ||
      log.journal.entries.length > 50000
    )
      return bad("Invalid journal or too many actions.");
    let state: State = structuredClone(log.journal.initial);
    assertInvariants(state);
    if ("journal" in state || "journal" in log.final)
      return bad("Nested journals are not allowed.");
    for (const e of log.journal.entries) {
      if (
        e.seq !== checked ||
        !Number.isFinite(e.elapsedMs) ||
        !validCommand(e.command)
      )
        return bad("Malformed action.");
      if (
        e.player !== state.active ||
        e.turn !== state.turn ||
        e.phase !== state.phase
      )
        return bad("Actor, turn or phase differs from the resolver.");
      if (
        !["human", "computer", "clock", "resume", "system"].includes(e.source)
      )
        return bad("Unknown action source.");
      const result = resolveCommand(
        state,
        e.command,
        state.clock.lastAt + e.elapsedMs,
      );
      assertInvariants(result.state);
      if (
        result.ok !== e.accepted ||
        canonical(result.ok ? undefined : result.error) !== canonical(e.error)
      )
        return bad("Acceptance or rejection differs from the resolver.");
      if (
        canonical(result.state.events.slice(state.events.length)) !==
        canonical(e.events)
      )
        return bad("Emitted events differ from the resolver.");
      if (fingerprint(result.state) !== e.stateFingerprint)
        return bad("State differs from the recorded fingerprint.");
      if (!result.ok) rejected++;
      state = result.state;
      checked++;
    }
    assertInvariants(log.final);
    if (canonical(snapshot(state)) !== canonical(log.final))
      return bad("Final snapshot differs from the replay.");
    return {
      valid: true,
      checked,
      rejected,
      message: checked
        ? "All recorded actions reproduce exactly."
        : "Valid snapshot; no recorded actions to verify.",
    };
  } catch (error) {
    return bad(
      `Invalid log: ${error instanceof Error ? error.message : "malformed data"}`,
    );
  }
}
export function importMatch(text: string): MatchLog {
  if (text.length > 20_000_000) throw new Error("Match log exceeds 20 MB.");
  const log: unknown = JSON.parse(text);
  const report = verifyMatch(log);
  if (!report.valid)
    throw new Error(`Action ${report.firstDivergence}: ${report.message}`);
  return log as MatchLog;
}
export function stateFromLog(log: MatchLog): State {
  return {
    ...structuredClone(log.final),
    journal: structuredClone(log.journal),
  };
}
