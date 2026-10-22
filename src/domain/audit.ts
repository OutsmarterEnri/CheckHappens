import { isCommand } from "./commands";
import {
  packJournal,
  unpackJournal,
  withoutEvents,
  validateMetadata,
  type CompactMatchLog,
  type RecordingSession,
  type DecodedEntry,
} from "./logCodec";
import { BUILD_INFO } from "./build";
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
  sessions?: RecordingSession[];
}
export interface LegacyMatchLog {
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
        ...journal,
        initial: journal?.initial ?? snapshot(input),
        entries: [...(journal?.entries ?? []), entry],
      },
    },
  };
}
export type MatchLog = LegacyMatchLog | CompactMatchLog;
export function exportMatch(s: State): CompactMatchLog {
  const journal = s.journal ?? { initial: snapshot(s), entries: [] };
  return {
    format: "check-happens-match",
    version: 2,
    rulesVersion: "2.0.0",
    exportedAt: new Date().toISOString(),
    metadata: {
      exporter: BUILD_INFO,
      timeControlMinutes: s.initialMinutes ?? null,
      sessions: structuredClone(journal.sessions ?? []),
    },
    journal: {
      initial: structuredClone(journal.initial),
      entries: packJournal(journal),
    },
    final: withoutEvents(s),
  };
}
function inspectMatch(
  value: unknown,
  success?: (state: State) => void,
): Verification {
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
      ![1, 2].includes(log.version) ||
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
    const compact = log.version === 2;
    const entries: DecodedEntry[] =
      log.version === 2
        ? unpackJournal(log.journal.entries)
        : log.journal.entries;
    if (log.version === 2) {
      validateMetadata(log, entries.length);
      if (
        log.metadata.timeControlMinutes !== (log.final.initialMinutes ?? null)
      )
        return bad("Time control differs from the final state.");
    }
    for (const e of entries) {
      if (
        e.seq !== checked ||
        !Number.isFinite(e.elapsedMs) ||
        !isCommand(e.command)
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
      const emitted = result.state.events.slice(state.events.length);
      if (compact && e.clockOnly) {
        if (emitted.some((v) => v.type !== "ClockAdvanced"))
          return bad("Clock run hides a game event.");
      } else if (
        canonical(
          compact ? emitted.filter((v) => v.type !== "Checkpoint") : emitted,
        ) !== canonical(e.events)
      )
        return bad("Emitted events differ from the resolver.");
      if (fingerprint(result.state) !== e.stateFingerprint)
        return bad("State differs from the recorded fingerprint.");
      if (!result.ok) rejected++;
      state = result.state;
      checked++;
    }
    assertInvariants({ ...log.final, events: [] });
    if (
      canonical(compact ? withoutEvents(state) : snapshot(state)) !==
      canonical(log.final)
    )
      return bad("Final snapshot differs from the replay.");
    success?.({
      ...state,
      journal: {
        initial: structuredClone(log.journal.initial),
        entries: entries.map(({ clockOnly: _clockOnly, ...e }) => e),
        ...(log.version === 2
          ? { sessions: structuredClone(log.metadata.sessions) }
          : {}),
      },
    });
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
export function verifyMatch(value: unknown): Verification {
  return inspectMatch(value);
}
export function stateFromLog(log: MatchLog): State {
  let state: State | undefined;
  const report = inspectMatch(log, (s) => {
    state = s;
  });
  if (!report.valid || !state)
    throw new Error(`Action ${report.firstDivergence}: ${report.message}`);
  return state;
}
export interface MatchSummary {
  turns: number;
  moves: number;
  captures: number;
  cards: number;
  reverses: number;
  resets: number;
  defenses: number;
  emergencyDraws: number;
  resurrections: number;
  riskRolls: number;
  breaks: number;
  elapsedPlayMs: number;
  outcome: State["outcome"];
  remainingMs: State["clock"]["remaining"];
  recordingSessions: RecordingSession[];
}
export function analyzeMatch(
  value: unknown,
): Verification & { summary?: MatchSummary } {
  let summary: MatchSummary | undefined;
  const verification = inspectMatch(value, (s) => {
    const count = (type: string) =>
      s.events.filter((e) => e.type === type).length;
    summary = {
      turns: s.turn,
      moves: count("MoveCompleted"),
      captures: s.events.filter(
        (e) =>
          e.type === "MoveCompleted" &&
          !!(e.data.move as { captureId?: string }).captureId,
      ).length,
      cards: count("CardDrawn"),
      reverses: count("ArmiesSwapped"),
      resets: count("ResetApplied"),
      defenses: s.events.filter(
        (e) => e.type === "MoveCompleted" && e.data.defense === true,
      ).length,
      emergencyDraws: count("EmergencyDrawStarted"),
      resurrections: count("PieceResurrected"),
      riskRolls: count("RiskResolved"),
      breaks: count("PieceDestroyed"),
      elapsedPlayMs: s
        .journal!.entries.filter(
          (e) => !["READY", "GAME_OVER"].includes(e.phase) && e.elapsedMs >= 0,
        )
        .reduce((total, e) => total + e.elapsedMs, 0),
      outcome: s.outcome,
      remainingMs: { ...s.clock.remaining },
      recordingSessions: structuredClone(s.journal!.sessions ?? []),
    };
  });
  return {
    ...verification,
    ...(verification.valid && summary ? { summary } : {}),
  };
}
