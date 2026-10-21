import { createRoomServer } from "./http";
import { networkInterfaces } from "node:os";
const port = Number(process.env.PORT ?? 8787),
  host = process.env.HOST ?? "0.0.0.0";
const { server, flush } = createRoomServer({
  dataDir: process.env.ROOM_DATA_DIR ?? ".room-data",
  staticDir: "dist",
  origins: process.env.ALLOWED_ORIGINS?.split(",")
    .map((s) => s.trim())
    .filter(Boolean),
});
server.listen(port, host, () => {
  console.log(`Check Happens 2.5 room server: http://localhost:${port}`);
  for (const interfaces of Object.values(networkInterfaces()))
    for (const item of interfaces ?? [])
      if (item.family === "IPv4" && !item.internal)
        console.log(`Same Wi-Fi: http://${item.address}:${port}`);
  console.log(
    "Use a single server instance and persistent storage; HTTPS is required for a public deployment.",
  );
});
const stop = () => {
  flush();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5000).unref();
};
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
