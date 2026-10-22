import { it, expect } from "vitest";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { verifyMatch } from "../src/domain/audit";
it("CLI --example uses example.json by default and produces a verifiable log", () => {
  const cwd = mkdtempSync(join(tmpdir(), "check-cli-"));
  try {
    const result = spawnSync(
      process.execPath,
      [resolve("scripts/analyze-match.mjs"), "--example"],
      { cwd, encoding: "utf8", timeout: 15000 },
    );
    expect(result.status, result.stderr).toBe(0);
    expect(
      verifyMatch(JSON.parse(readFileSync(join(cwd, "example.json"), "utf8")))
        .valid,
    ).toBe(true);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
}, 20000);
