import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createGame, dispatch } from "../src/domain/turnResolver";
import {
  exportMatch,
  verifyMatch,
  stateFromLog,
  fingerprint,
  analyzeMatch,
  type LegacyMatchLog,
} from "../src/domain/audit";
import { startRecordingSession } from "../src/domain/logCodec";
import {
  restoreSnapshot,
  saveGame,
  restoreGame,
  SAVE_KEY,
} from "../src/ui/persistence";
import { vi } from "vitest";
function ticking() {
  let s = startRecordingSession(createGame(42, 0), "computer", "medium");
  s = dispatch(s, { type: "StartGame" }, 0, "human").state;
  for (let i = 1; i <= 40; i++)
    s = dispatch(s, { type: "AdvanceTime" }, i * 150, "clock").state;
  return s;
}
describe("Compact log schema v2", () => {
  it("groups ticks while keeping every duration and fingerprint", () => {
    const s = ticking(),
      log = exportMatch(s);
    expect(log.version).toBe(2);
    expect(log.journal.entries).toHaveLength(2);
    const run = log.journal.entries[1];
    expect(run.kind).toBe("clock-run");
    if (run.kind !== "clock-run") throw Error("No clock run");
    expect(run.ticks).toHaveLength(40);
    expect(run.ticks.every((t) => t[0] === 150)).toBe(true);
    expect(verifyMatch(log)).toMatchObject({ valid: true, checked: 41 });
    expect(fingerprint(stateFromLog(log))).toBe(fingerprint(s));
    expect(JSON.stringify(log).length).toBeLessThan(
      JSON.stringify({ journal: s.journal, final: s }).length * 0.4,
    );
  });
  it("preserves metadata, exact build identity and recording-session boundaries", () => {
    let s = ticking();
    s = startRecordingSession(s, "local", "hard");
    const log = exportMatch(s);
    expect(log.metadata.timeControlMinutes).toBe(7);
    expect(log.metadata.exporter.id).toMatch(/^[a-f0-9]{20}$/);
    expect(
      log.metadata.sessions.map((x) => [
        x.startSeq,
        x.opponentMode,
        x.botLevel,
      ]),
    ).toEqual([
      [0, "computer", "medium"],
      [41, "local", null],
    ]);
    expect(verifyMatch(log).valid).toBe(true);
    expect(exportMatch(stateFromLog(log)).metadata.sessions).toEqual(
      log.metadata.sessions,
    );
  });
  it("detects duration, sample fingerprint, sequencing and hidden timeout corruption", () => {
    const log = exportMatch(ticking());
    for (const change of ["duration", "fingerprint", "seq", "timeout"]) {
      const copy = structuredClone(log),
        run = copy.journal.entries[1];
      if (run.kind !== "clock-run") throw Error("No run");
      if (change === "duration") run.ticks[0][0] += 1;
      if (change === "fingerprint") run.ticks[0][1] = "deadbeef";
      if (change === "seq") run.seq++;
      if (change === "timeout") run.ticks[0][0] = 500000;
      expect(verifyMatch(copy).valid).toBe(false);
    }
  });
  it("retains timeout events as actions and resumes compact imports", () => {
    const s = ticking();
    const ended = dispatch(s, { type: "AdvanceTime" }, 700000, "clock").state;
    const log = exportMatch(ended);
    const last = log.journal.entries.at(-1)!;
    expect(last.kind).toBe("action");
    if (last.kind === "action")
      expect(last.events.some((e) => e.type === "GameEnded")).toBe(true);
    expect(verifyMatch(log).valid).toBe(true);
    let resumed = restoreSnapshot(stateFromLog(exportMatch(s)), 1000, 4000, 50);
    resumed = dispatch(resumed, { type: "AdvanceTime" }, 50.5, "clock").state;
    expect(verifyMatch(exportMatch(resumed)).valid).toBe(true);
  });
  it("re-exports compact logs without losing tick verification", () => {
    const once = exportMatch(ticking());
    const twice = exportMatch(stateFromLog(once));
    expect(twice.journal.entries).toEqual(once.journal.entries);
    expect(verifyMatch(twice)).toMatchObject({ valid: true, checked: 41 });
  });
  it("supports v1 logs and leaves unknown historical bot metadata empty", () => {
    const old = JSON.parse(
      readFileSync(
        new URL("../docs/examples/verified-match.json", import.meta.url),
        "utf8",
      ),
    ) as LegacyMatchLog;
    expect(old.version).toBe(1);
    expect(verifyMatch(old)).toMatchObject({
      valid: true,
      checked: 3,
      rejected: 1,
    });
    const compact = exportMatch(stateFromLog(old));
    expect(compact.metadata.sessions).toEqual([]);
    expect(verifyMatch(compact)).toMatchObject({
      valid: true,
      checked: 3,
      rejected: 1,
    });
  });
  it("derives an analysis summary from verified data only", () => {
    const log = exportMatch(ticking());
    expect(analyzeMatch(log)).toMatchObject({
      valid: true,
      summary: {
        turns: 1,
        moves: 0,
        cards: 1,
        elapsedPlayMs: 6000,
        recordingSessions: [{ opponentMode: "computer", botLevel: "medium" }],
      },
    });
    const run = log.journal.entries[1];
    if (run.kind === "clock-run") run.ticks[0][1] = "bad";
    expect(analyzeMatch(log).summary).toBeUndefined();
  });
  it("rejects malformed runs and invalid metadata", () => {
    const log = exportMatch(ticking());
    for (const kind of ["empty", "negative", "overflow", "metadata"]) {
      const copy = structuredClone(log),
        run = copy.journal.entries[1];
      if (run.kind !== "clock-run") throw Error("No run");
      if (kind === "empty") run.ticks = [];
      if (kind === "negative") run.ticks[0][0] = -1;
      if (kind === "overflow")
        run.ticks = Array.from({ length: 50001 }, () => [1, "hash"]);
      if (kind === "metadata") copy.metadata.sessions[0].startSeq = 50000;
      expect(verifyMatch(copy).valid).toBe(false);
    }
  });
  it("saves compact JSON and restores both new and legacy device saves", () => {
    const data = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      setItem: (k: string, v: string) => data.set(k, v),
      getItem: (k: string) => data.get(k) ?? null,
    });
    try {
      const s = ticking();
      s.clock.lastAt = performance.now();
      saveGame(s);
      const saved = JSON.parse(data.get(SAVE_KEY)!);
      expect(saved.state).toBeUndefined();
      expect(saved.log.version).toBe(2);
      const restored = restoreGame();
      expect(restored).not.toBeNull();
      expect(verifyMatch(exportMatch(restored!)).valid).toBe(true);
      const legacy = createGame();
      data.set(
        SAVE_KEY,
        JSON.stringify({ state: legacy, savedAt: Date.now() }),
      );
      expect(restoreGame()?.phase).toBe("READY");
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
