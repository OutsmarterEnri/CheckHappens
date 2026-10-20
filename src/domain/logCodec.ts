import type { Journal, JournalEntry, Snapshot } from "./audit";
import type { BuildInfo } from "./build";
import { BUILD_INFO } from "./build";
import type { State } from "./types";
import type { BotLevel, Minutes } from "./match";
export interface RecordingSession {
  startSeq: number;
  opponentMode: "local" | "computer";
  botLevel: BotLevel | null;
  build: BuildInfo;
}
export type PackedEntry =
  | ({ kind: "action" } & JournalEntry)
  | {
      kind: "clock-run";
      seq: number;
      player: State["active"];
      turn: number;
      phase: State["phase"];
      ticks: [number, string][];
    };
export interface CompactMatchLog {
  format: "check-happens-match";
  version: 2;
  rulesVersion: "2.0.0";
  exportedAt: string;
  metadata: {
    exporter: BuildInfo;
    timeControlMinutes: Minutes | null;
    sessions: RecordingSession[];
  };
  journal: { initial: Snapshot; entries: PackedEntry[] };
  final: Omit<Snapshot, "events">;
}
export function withoutEvents(s: State): Omit<Snapshot, "events"> {
  const { events: _events, journal: _journal, ...body } = s;
  return structuredClone(body);
}
export function packJournal(journal: Journal): PackedEntry[] {
  const packed: PackedEntry[] = [];
  for (const e of journal.entries) {
    const eligible =
      e.source === "clock" &&
      e.command.type === "AdvanceTime" &&
      e.accepted &&
      !e.error &&
      e.elapsedMs >= 0 &&
      Number.isFinite(e.elapsedMs) &&
      e.events.every((v) => v.type === "ClockAdvanced");
    const last = packed.at(-1);
    if (eligible) {
      const tick: [number, string] = [e.elapsedMs, e.stateFingerprint];
      if (
        last?.kind === "clock-run" &&
        last.seq + last.ticks.length === e.seq &&
        last.player === e.player &&
        last.turn === e.turn &&
        last.phase === e.phase
      )
        last.ticks.push(tick);
      else
        packed.push({
          kind: "clock-run",
          seq: e.seq,
          player: e.player,
          turn: e.turn,
          phase: e.phase,
          ticks: [tick],
        });
    } else
      packed.push({
        kind: "action",
        ...structuredClone(e),
        events: structuredClone(
          e.events.filter((v) => v.type !== "Checkpoint"),
        ),
      });
  }
  return packed;
}
export type DecodedEntry = JournalEntry & { clockOnly?: true };
export function unpackJournal(entries: PackedEntry[]): DecodedEntry[] {
  const decoded: DecodedEntry[] = [];
  if (!Array.isArray(entries) || entries.length > 50000)
    throw new Error("Invalid journal size.");
  for (const packed of entries) {
    if (packed?.kind === "action") {
      const { kind: _kind, ...e } = packed;
      // Never permit a file to opt an ordinary action out of event comparison.
      if ("clockOnly" in e) throw new Error("Invalid action marker.");
      decoded.push(e);
    } else if (packed?.kind === "clock-run") {
      if (
        !Array.isArray(packed.ticks) ||
        !packed.ticks.length ||
        packed.ticks.length + decoded.length > 50000
      )
        throw new Error("Invalid clock run size.");
      for (const [i, tick] of packed.ticks.entries()) {
        if (
          !Array.isArray(tick) ||
          tick.length !== 2 ||
          !Number.isFinite(tick[0]) ||
          tick[0] < 0 ||
          typeof tick[1] !== "string"
        )
          throw new Error("Invalid clock sample.");
        decoded.push({
          seq: packed.seq + i,
          player: packed.player,
          turn: packed.turn,
          phase: packed.phase,
          command: { type: "AdvanceTime" },
          source: "clock",
          accepted: true,
          elapsedMs: tick[0],
          stateFingerprint: tick[1],
          events: [],
          clockOnly: true,
        });
      }
    } else throw new Error("Unknown packed action.");
    if (decoded.length > 50000) throw new Error("Too many actions.");
  }
  return decoded;
}
export function validateMetadata(log: CompactMatchLog, count: number): void {
  const m = log.metadata;
  const build = (b: BuildInfo) =>
    b &&
    typeof b.appVersion === "string" &&
    typeof b.revision === "string" &&
    typeof b.id === "string" &&
    typeof b.dirty === "boolean";
  if (
    !m ||
    !build(m.exporter) ||
    ![null, 4, 7, 10].includes(m.timeControlMinutes) ||
    !Array.isArray(m.sessions) ||
    m.sessions.length > count + 1
  )
    throw new Error("Invalid log metadata.");
  let previous = -1;
  for (const s of m.sessions) {
    if (
      !Number.isInteger(s.startSeq) ||
      s.startSeq < 0 ||
      s.startSeq > count ||
      s.startSeq <= previous ||
      !["local", "computer"].includes(s.opponentMode) ||
      !build(s.build) ||
      (s.opponentMode === "local"
        ? s.botLevel !== null
        : !["easy", "medium", "hard"].includes(s.botLevel ?? ""))
    )
      throw new Error("Invalid recording session.");
    previous = s.startSeq;
  }
}
export function startRecordingSession(
  state: State,
  opponentMode: RecordingSession["opponentMode"],
  botLevel: BotLevel,
): State {
  const { journal: _journal, ...body } = state;
  const journal: Journal = state.journal ?? {
    initial: structuredClone(body),
    entries: [],
  };
  const session: RecordingSession = {
    startSeq: journal.entries.length,
    opponentMode,
    botLevel: opponentMode === "computer" ? botLevel : null,
    build: BUILD_INFO,
  };
  const sessions = [...(journal.sessions ?? [])];
  if (sessions.at(-1)?.startSeq === session.startSeq) sessions.pop();
  sessions.push(session);
  return { ...state, journal: { ...journal, sessions } };
}
