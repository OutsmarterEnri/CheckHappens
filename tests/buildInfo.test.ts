import { describe, it, expect } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getBuildInfo } from "../scripts/build-info.mjs";
describe("Build fingerprint", () => {
  it("is repeatable, changes with source and avoids absolute machine paths", () => {
    const root = mkdtempSync(join(tmpdir(), "check-happens-build-"));
    try {
      for (const dir of ["src", "public", "scripts"])
        mkdirSync(join(root, dir));
      for (const name of [
        "package-lock.json",
        "index.html",
        "vite.config.ts",
        "scripts/build-info.mjs",
      ])
        writeFileSync(join(root, name), "fixture");
      writeFileSync(
        join(root, "package.json"),
        JSON.stringify({ version: "2.0.1" }),
      );
      writeFileSync(join(root, "src/game.ts"), "one");
      const first = getBuildInfo(root);
      expect(getBuildInfo(root)).toEqual(first);
      expect(first.revision).toBe("unknown");
      expect(first.id).toMatch(/^[a-f0-9]{20}$/);
      writeFileSync(join(root, "src/game.ts"), "two");
      expect(getBuildInfo(root).id).not.toBe(first.id);
      const beforeDocs = getBuildInfo(root).id;
      writeFileSync(join(root, "README.md"), "documentation only");
      const next = getBuildInfo(root);
      expect(next.id).toBe(beforeDocs);
      expect(JSON.stringify(next)).not.toContain(root);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
