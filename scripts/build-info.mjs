import { readFileSync, readdirSync } from "node:fs";
import { resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
export function getBuildInfo(
  root = fileURLToPath(new URL("../", import.meta.url)),
) {
  const hash = createHash("sha256");
  function add(path) {
    hash.update(relative(root, path).replaceAll("\\", "/") + "\0");
    hash.update(readFileSync(path));
    hash.update("\0");
  }
  function walk(dir) {
    for (const item of readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name, "en"),
    )) {
      const path = resolve(dir, item.name);
      if (item.isDirectory()) walk(path);
      else if (item.isFile()) add(path);
    }
  }
  walk(resolve(root, "src"));
  walk(resolve(root, "public"));
  for (const name of [
    "package.json",
    "package-lock.json",
    "index.html",
    "vite.config.ts",
    "scripts/build-info.mjs",
  ])
    add(resolve(root, name));
  let revision = "unknown",
    dirty = true;
  try {
    revision = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    dirty = !!execFileSync("git", ["status", "--porcelain"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {}
  return {
    appVersion: JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"))
      .version,
    revision,
    dirty,
    id: hash.digest("hex").slice(0, 20),
  };
}
