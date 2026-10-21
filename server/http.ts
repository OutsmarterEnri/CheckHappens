import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  renameSync,
  existsSync,
} from "node:fs";
import { resolve, extname, sep } from "node:path";
import { RoomStore, RoomError, type SavedRoom } from "./rooms";
interface Options {
  store?: RoomStore;
  dataDir?: string;
  staticDir?: string;
  origins?: string[];
}
export function createRoomServer(options: Options = {}) {
  const store = options.store ?? new RoomStore(),
    dataFile = options.dataDir ? resolve(options.dataDir, "rooms.json") : null;
  if (dataFile) {
    mkdirSync(options.dataDir!, { recursive: true, mode: 0o700 });
    if (existsSync(dataFile)) {
      const saved = JSON.parse(readFileSync(dataFile, "utf8")) as SavedRoom[];
      store.restore(saved);
    }
  }
  let dirty = false,
    storageFailed = false;
  const persist = () => {
    if (!dataFile || !dirty) return;
    const temp = dataFile + ".tmp";
    try {
      writeFileSync(temp, JSON.stringify(store.save()), {
        mode: 0o600,
        flush: true,
      });
      renameSync(temp, dataFile);
    } catch (error) {
      storageFailed = true;
      throw error;
    }
    dirty = false;
  };
  const rates = new Map<
    string,
    { start: number; requests: number; creates: number }
  >();
  const send = (res: ServerResponse, status: number, value: unknown) => {
    res.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    });
    res.end(JSON.stringify(value));
  };
  const body = async (req: IncomingMessage) => {
    let text = "";
    for await (const chunk of req) {
      text += chunk;
      if (Buffer.byteLength(text) > 8192)
        throw new RoomError(413, "BODY_TOO_LARGE");
    }
    try {
      const value = JSON.parse(text || "{}");
      if (!value || typeof value !== "object" || Array.isArray(value))
        throw new Error();
      return value;
    } catch {
      throw new RoomError(400, "INVALID_JSON");
    }
  };
  const server = createServer(async (req, res) => {
    try {
      if (storageFailed) throw new RoomError(503, "STORAGE_UNAVAILABLE");
      const url = new URL(req.url ?? "/", "http://localhost"),
        origin = req.headers.origin;
      const allowed = new Set(
        options.origins ?? [
          "https://outsmarterenri.github.io",
          "http://localhost:5173",
          "http://127.0.0.1:5173",
          "http://localhost:5188",
          "http://127.0.0.1:5188",
        ],
      );
      const host = req.headers.host ?? "",
        localHost =
          /^(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(
            host,
          );
      if (
        origin &&
        !allowed.has(origin) &&
        !(localHost && origin === `http://${host}`)
      )
        throw new RoomError(403, "ORIGIN_NOT_ALLOWED");
      if (origin) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Vary", "Origin");
      }
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Authorization, Content-Type",
      );
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }
      if (url.pathname === "/health" && req.method === "GET") {
        send(res, 200, { ok: true, version: "2.5.0" });
        return;
      }
      if (!url.pathname.startsWith("/api/")) {
        if (!options.staticDir || req.method !== "GET")
          throw new RoomError(404, "NOT_FOUND");
        const root = resolve(options.staticDir),
          path = resolve(
            root,
            "." +
              decodeURIComponent(
                url.pathname === "/" ? "/index.html" : url.pathname,
              ),
          );
        if (!path.startsWith(root + sep)) throw new RoomError(403, "NOT_FOUND");
        let data: Buffer;
        try {
          data = readFileSync(path);
        } catch {
          throw new RoomError(404, "NOT_FOUND");
        }
        const mime: Record<string, string> = {
          ".html": "text/html",
          ".js": "text/javascript",
          ".css": "text/css",
          ".svg": "image/svg+xml",
          ".png": "image/png",
          ".webmanifest": "application/manifest+json",
          ".txt": "text/plain",
        };
        res.writeHead(200, {
          "Content-Type": mime[extname(path)] ?? "application/octet-stream",
          "Cache-Control": "no-cache",
          "X-Content-Type-Options": "nosniff",
          "Referrer-Policy": "no-referrer",
        });
        res.end(data);
        return;
      }
      const ip = req.socket.remoteAddress ?? "unknown",
        now = Date.now();
      let rate = rates.get(ip);
      if (!rate || now - rate.start > 60000) {
        rate = { start: now, requests: 0, creates: 0 };
        rates.set(ip, rate);
      }
      if (++rate.requests > 6000) throw new RoomError(429, "RATE_LIMIT");
      const parts = url.pathname.split("/").filter(Boolean);
      if (url.pathname === "/api/rooms" && req.method === "POST") {
        if (++rate.creates > 10) throw new RoomError(429, "RATE_LIMIT");
        const input = await body(req),
          result = store.create(input.minutes, input.side);
        dirty = true;
        persist();
        send(res, 201, result);
        return;
      }
      if (
        parts[0] !== "api" ||
        parts[1] !== "rooms" ||
        !/^[a-f0-9]{24}$/.test(parts[2] ?? "")
      )
        throw new RoomError(404, "ROOM_NOT_FOUND");
      const id = parts[2];
      if (parts.length === 4 && parts[3] === "join" && req.method === "POST") {
        const input = await body(req),
          result = store.join(id, input.invite);
        dirty = true;
        persist();
        send(res, 200, result);
        return;
      }
      const token = req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.slice(7)
        : "";
      if (!token) throw new RoomError(401, "INVALID_ROOM_TOKEN");
      if (parts.length === 3 && req.method === "GET") {
        const result = store.view(id, token);
        dirty = true;
        send(res, 200, result);
        return;
      }
      if (
        parts[3] === "commands" &&
        parts.length === 4 &&
        req.method === "POST"
      ) {
        const input = await body(req);
        try {
          const result = store.command(id, token, input);
          dirty = true;
          persist();
          send(res, 200, result);
        } catch (e) {
          dirty = true;
          persist();
          throw e;
        }
        return;
      }
      if (parts[3] === "log" && parts.length === 4 && req.method === "GET") {
        send(res, 200, store.log(id, token));
        return;
      }
      throw new RoomError(404, "NOT_FOUND");
    } catch (error) {
      if (!res.headersSent)
        send(res, error instanceof RoomError ? error.status : 500, {
          error: error instanceof RoomError ? error.message : "SERVER_ERROR",
        });
      else res.end();
    }
  });
  server.requestTimeout = 10000;
  server.headersTimeout = 10000;
  const ticker = setInterval(() => {
    try {
      store.tick();
      dirty = true;
      persist();
      for (const [ip, r] of rates)
        if (Date.now() - r.start > 60000) rates.delete(ip);
    } catch (error) {
      console.error(
        "Room persistence unavailable; stopping to prevent unsaved play.",
      );
      server.close();
      clearInterval(ticker);
    }
  }, 1000);
  ticker.unref();
  server.on("close", () => {
    clearInterval(ticker);
    if (!storageFailed) persist();
  });
  return {
    server,
    store,
    flush: () => {
      dirty = true;
      persist();
    },
  };
}
