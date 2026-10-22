import { readFile, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import { getBuildInfo } from "./build-info.mjs";
const root = fileURLToPath(new URL("../", import.meta.url));
const args = process.argv.slice(2);
if (!args.length) {
  console.error(
    "Usage: npm run analyze:match -- match.json\n       npm run analyze:match -- --example example.json\n       npm run analyze:match -- --compact INPUT.json OUTPUT.json",
  );
  process.exit(2);
}
try {
  const result = await build({
    root,
    configFile: false,
    define: { __APP_BUILD__: JSON.stringify(getBuildInfo(root)) },
    logLevel: "silent",
    build: {
      write: false,
      minify: false,
      lib: { entry: resolve(root, "src/domain/audit.ts"), formats: ["es"] },
      rollupOptions: { output: { inlineDynamicImports: true } },
    },
  });
  const code = (Array.isArray(result) ? result[0] : result).output.find(
    (x) => x.type === "chunk",
  ).code;
  const api = await import(
    `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`
  );
  if (args[0] === "--compact") {
    if (!args[1] || !args[2] || resolve(args[1]) === resolve(args[2]))
      throw new Error(
        "Use --compact INPUT.json OUTPUT.json with different paths.",
      );
    if ((await stat(args[1])).size > 20_000_000)
      throw new Error("Match log exceeds 20 MB.");
    const original = JSON.parse(await readFile(args[1], "utf8"));
    const state = api.stateFromLog(original),
      log = api.exportMatch(state),
      report = api.verifyMatch(log);
    if (!report.valid) throw new Error(report.message);
    const text = JSON.stringify(log, null, 2) + "\n";
    await writeFile(args[2], text, { flag: "wx" });
    console.log(
      JSON.stringify(
        {
          ...report,
          inputBytes: (await stat(args[1])).size,
          outputBytes: Buffer.byteLength(text),
        },
        null,
        2,
      ),
    );
  } else if (args[0] === "--example") {
    // A deliberately rejected move followed by flag fall: both must reproduce.
    const core = await build({
      root,
      configFile: false,
      define: { __APP_BUILD__: JSON.stringify(getBuildInfo(root)) },
      logLevel: "silent",
      build: {
        write: false,
        minify: false,
        lib: {
          entry: resolve(root, "src/domain/turnResolver.ts"),
          formats: ["es"],
        },
        rollupOptions: { output: { inlineDynamicImports: true } },
      },
    });
    const engine = await import(
      `data:text/javascript;base64,${Buffer.from((Array.isArray(core) ? core[0] : core).output.find((x) => x.type === "chunk").code).toString("base64")}`
    );
    let s = engine.dispatch(
      engine.createGame(42),
      { type: "StartGame" },
      0,
      "human",
    ).state;
    s = engine.dispatch(
      s,
      { type: "SubmitMove", from: 0, to: 63 },
      500,
      "human",
    ).state;
    s = engine.dispatch(s, { type: "AdvanceTime" }, 500000, "clock").state;
    await writeFile(
      args[1] ?? "example.json",
      JSON.stringify(api.exportMatch(s), null, 2) + "\n",
    );
    console.log("Example match written.");
  } else {
    if ((await stat(args[0])).size > 20_000_000)
      throw new Error("Match log exceeds 20 MB.");
    const report = api.analyzeMatch(
      JSON.parse(await readFile(args[0], "utf8")),
    );
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = report.valid ? 0 : 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : "Invalid match log");
  process.exitCode = 2;
}
