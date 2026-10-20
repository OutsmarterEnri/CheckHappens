// Serve the production build without npm runtime dependencies.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, extname, sep } from "node:path";
import { networkInterfaces } from "node:os";
import { spawn } from "node:child_process";
const root = fileURLToPath(new URL("../dist/", import.meta.url));
const port = 4173;
const lan = process.argv.includes("--lan");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
};
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(
      new URL(req.url ?? "/", "http://127.0.0.1").pathname,
    );
    const target = resolve(
      root,
      "." + (pathname === "/" ? "/index.html" : pathname),
    );
    if (!target.startsWith(resolve(root) + sep)) {
      res.writeHead(403);
      res.end();
      return;
    }
    const data = await readFile(target);
    res.writeHead(200, {
      "Content-Type": types[extname(target)] ?? "application/octet-stream",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("File not found. Run npm run build if dist is missing.");
  }
});
server.on("error", (error) => {
  console.error("Could not start the table:", error.message);
  process.exitCode = 1;
});
server.listen(port, lan ? "0.0.0.0" : "127.0.0.1", () => {
  const url = `http://127.0.0.1:${port}`;
  console.log(
    `Check Happens.\nOpen ${url}\nKeep this terminal open. Ctrl+C stops the table.`,
  );
  if (lan) {
    console.log("\nOn iPhone, connect to the same Wi-Fi and open in Safari:");
    for (const interfaces of Object.values(networkInterfaces()))
      for (const iface of interfaces ?? [])
        if (iface.family === "IPv4" && !iface.internal)
          console.log(`  http://${iface.address}:${port}`);
    console.log(
      "Keep the computer running. HTTPS is required for reliable offline Home Screen support.",
    );
  }
  if (process.platform === "win32")
    spawn("cmd.exe", ["/c", "start", "", url], {
      windowsHide: true,
      stdio: "ignore",
    }).on("error", () => {});
});
