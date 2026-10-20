import { describe, it, expect } from "vitest";
import { createGame, dispatch } from "../src/domain/turnResolver";
import {
  exportMatch,
  verifyMatch,
  importMatch,
  stateFromLog,
} from "../src/domain/audit";
import { computerCommand } from "../src/domain/computer";
import { demo } from "../src/domain/fixtures";
import { restoreSnapshot } from "../src/ui/persistence";
import type { BotLevel } from "../src/domain/match";

describe("Match JSON auditing", () => {
  it.each([4, 7, 10] as const)("%i minutes per player", (minutes) => {
    const s = createGame(42, 0, undefined, minutes);
    expect(s.clock.remaining).toEqual({
      P1: minutes * 60000,
      P2: minutes * 60000,
    });
  });
  it.each(["easy", "medium", "hard"] as BotLevel[])(
    "%s bot actions and clock updates reproduce exactly",
    (level) => {
      let s = dispatch(
        createGame(171, 0),
        { type: "StartGame" },
        0,
        "human",
      ).state;
      for (let i = 0; i < 90 && !s.outcome; i++) {
        const command = computerCommand(s, 171 + i * 7919, level);
        expect(command).not.toBeNull();
        const result = dispatch(
          s,
          command!,
          s.clock.lastAt + 125.125,
          "computer",
        );
        expect(result.ok).toBe(true);
        s = result.state;
        s = dispatch(
          s,
          { type: "AdvanceTime" },
          s.clock.lastAt + 15.75,
          "clock",
        ).state;
      }
      const log = exportMatch(s),
        report = verifyMatch(JSON.parse(JSON.stringify(log)));
      expect(report, report.message).toMatchObject({
        valid: true,
        rejected: 0,
      });
      expect(report.checked).toBe(s.journal!.entries.length);
      expect(importMatch(JSON.stringify(log)).final).toEqual(log.final);
    },
  );
  it("records rejected moves without applying them, while time keeps running", () => {
    let s = dispatch(createGame(42), { type: "StartGame" }, 0, "human").state;
    const pieces = structuredClone(s.pieces);
    const result = dispatch(
      s,
      { type: "SubmitMove", from: 0, to: 63 },
      650,
      "human",
    );
    expect(result.ok).toBe(false);
    s = result.state;
    expect(s.pieces).toEqual(pieces);
    expect(s.clock.remaining.P1).toBe(419350);
    expect(verifyMatch(exportMatch(s))).toMatchObject({
      valid: true,
      rejected: 1,
      checked: 2,
    });
  });
  it("detects command, event, state, elapsed time and ordering corruption", () => {
    const s = dispatch(createGame(42), { type: "StartGame" }, 500).state;
    const log = exportMatch(s);
    for (const corrupt of [
      (x: typeof log) => {
        x.journal.entries[0].command = { type: "AdvanceTime" };
      },
      (x: typeof log) => {
        x.journal.entries[0].events = [];
      },
      (x: typeof log) => {
        x.journal.entries[0].stateFingerprint = "00000000";
      },
      (x: typeof log) => {
        x.journal.entries[0].elapsedMs = -1;
      },
      (x: typeof log) => {
        x.journal.entries[0].seq = 3;
      },
      (x: typeof log) => {
        x.final.clock.remaining.P1 = 42;
      },
    ]) {
      const copy = structuredClone(log);
      corrupt(copy);
      expect(verifyMatch(copy).valid).toBe(false);
    }
  });
  it("verifies elapsed time through suspension, clock rebasing and continuation", () => {
    let s = dispatch(createGame(42, 500), { type: "StartGame" }, 510).state;
    s = dispatch(s, { type: "AdvanceTime" }, 510.25).state;
    s = restoreSnapshot(s, 1000, 6000, 100);
    s = dispatch(s, computerCommand(s, 2)!, 100.5).state;
    const report = verifyMatch(exportMatch(s));
    expect(report, report.message).toMatchObject({ valid: true });
  });
  it("validates timeout endings, including after restore and import", () => {
    let s = dispatch(createGame(42), { type: "StartGame" }, 0).state;
    s = restoreSnapshot(s, 0, 700000, 50);
    expect(s.outcome?.winner).toBe("P2");
    const log = importMatch(JSON.stringify(exportMatch(s)));
    expect(verifyMatch(log).valid).toBe(true);
    expect(stateFromLog(log).journal?.entries.length).toBe(
      s.journal?.entries.length,
    );
  });
  it.each([
    "defense",
    "resurrection",
    "resurrection2",
    "risk",
    "breakage",
    "emergency",
    "yellow",
    "last",
  ])("replays %s effects", (name) => {
    let s = demo(name, 0);
    if (s.phase === "READY") s = dispatch(s, { type: "StartGame" }, 0).state;
    for (let i = 0; i < 16 && !s.outcome; i++) {
      const command = computerCommand(s, 20 + i, "hard");
      if (!command) break;
      s = dispatch(s, command, s.clock.lastAt + 10).state;
    }
    expect(verifyMatch(exportMatch(s)).valid).toBe(true);
  });
  it("rejects malformed logs and non-finite or out-of-board states", () => {
    expect(verifyMatch({}).valid).toBe(false);
    expect(() => importMatch("{")).toThrow();
    const log = exportMatch(createGame());
    log.journal.initial.pieces[0].square = 99;
    expect(verifyMatch(log).valid).toBe(false);
    log.journal.initial = createGame();
    log.journal.initial.clock.remaining.P1 = NaN;
    expect(verifyMatch(log).valid).toBe(false);
  });
});
