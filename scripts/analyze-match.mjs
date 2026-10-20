import { readFile, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";
const root = fileURLToPath(new URL("../", import.meta.url));
const args = process.argv.slice(2);
if (!args.length) {
  console.error(
    "Usage: npm run analyze:match -- match.json\n       npm run analyze:match -- --example example.json",
  );
  process.exit(2);
}
try {
  const result = await build({
    root,
    configFile: false,
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
  if (args[0] === "--example") {
    // A deliberately rejected move followed by flag fall: both must reproduce.
    const core = await build({
      root,
      configFile: false,
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
    const report = api.verifyMatch(JSON.parse(await readFile(args[0], "utf8")));
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = report.valid ? 0 : 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : "Invalid match log");
  process.exitCode = 2;
}
