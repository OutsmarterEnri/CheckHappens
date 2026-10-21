import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRoomServer } from "../server/http";
import type { AddressInfo } from "node:net";
const dir = mkdtempSync(join(tmpdir(), "check-happens-rooms-"));
let app: ReturnType<typeof createRoomServer>,
  base = "";
async function start() {
  app = createRoomServer({ dataDir: dir });
  await new Promise<void>((resolve) =>
    app.server.listen(0, "127.0.0.1", resolve),
  );
  base = `http://127.0.0.1:${(app.server.address() as AddressInfo).port}`;
}
async function stop() {
  app.server.closeAllConnections();
  await new Promise<void>((resolve, reject) =>
    app.server.close((e) => (e ? reject(e) : resolve())),
  );
}
const post = (
  path: string,
  body: unknown,
  headers: Record<string, string> = {},
) =>
  fetch(base + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
beforeAll(start);
afterAll(async () => {
  await stop();
  rmSync(dir, { recursive: true, force: true });
});
describe("private room HTTP transport", () => {
  it("allows the game origin, handles preflight, and forbids unrelated sites", async () => {
    const pre = await fetch(base + "/api/rooms", {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:5173",
        "Access-Control-Request-Headers": "Authorization",
      },
    });
    expect(pre.status).toBe(204);
    expect(pre.headers.get("Access-Control-Allow-Origin")).toBe(
      "http://localhost:5173",
    );
    const bad = await post(
      "/api/rooms",
      { minutes: 7, side: "white" },
      { Origin: "https://unrelated.example" },
    );
    expect(bad.status).toBe(403);
  });
  it("creates private seats, returns uncached redacted snapshots, and rejects forged time commands", async () => {
    const response = await post("/api/rooms", { minutes: 7, side: "black" });
    expect(response.status).toBe(201);
    const host = await response.json();
    const guestResponse = await post(`/api/rooms/${host.roomId}/join`, {
      invite: host.invite,
    });
    expect(guestResponse.status).toBe(200);
    const snapshot = await fetch(base + `/api/rooms/${host.roomId}`, {
      headers: { Authorization: `Bearer ${host.token}` },
    });
    expect(snapshot.headers.get("Cache-Control")).toBe("no-store");
    const view = await snapshot.json();
    expect(view.state.seed).toBe(0);
    expect(view.state.control.P1).toBe("b");
    const forged = await post(
      `/api/rooms/${host.roomId}/commands`,
      {
        commandId: "forged-clock-001",
        expectedRevision: 0,
        command: { type: "AdvanceTime" },
      },
      { Authorization: `Bearer ${host.token}` },
    );
    expect(forged.status).toBe(400);
    const noToken = await fetch(base + `/api/rooms/${host.roomId}`);
    expect(noToken.status).toBe(401);
  });
  it("rejects malformed bodies and oversized requests without exposing internals", async () => {
    const malformed = await fetch(base + "/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{bad",
    });
    expect(malformed.status).toBe(400);
    expect((await post("/api/rooms", null)).status).toBe(400);
    const tooBig = await post("/api/rooms", { padding: "x".repeat(10000) });
    expect(tooBig.status).toBe(413);
    const traversal = await fetch(base + "/%2e%2e%2fpackage.json");
    expect([403, 404]).toContain(traversal.status);
  });
  it("persists room credentials and the single-use invitation across process recreation", async () => {
    const created = await (
      await post("/api/rooms", { minutes: 4, side: "random" })
    ).json();
    await stop();
    await start();
    const found = await fetch(base + `/api/rooms/${created.roomId}`, {
      headers: { Authorization: `Bearer ${created.token}` },
    });
    expect(found.status).toBe(200);
    expect(
      (
        await post(`/api/rooms/${created.roomId}/join`, {
          invite: created.invite,
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await post(`/api/rooms/${created.roomId}/join`, {
          invite: created.invite,
        })
      ).status,
    ).toBe(409);
  });
});
