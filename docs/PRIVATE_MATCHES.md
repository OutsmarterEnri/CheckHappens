# Private matches — 2.5 prototype

The frontend remains compatible with GitHub Pages. Private matches require the
separate room server supplied in this repository; Pages alone cannot run it.
No hosted backend account or public room endpoint has been provisioned yet.

## Try two devices on the same Wi-Fi

Use Node.js 22 or newer. In the project directory, run:

```sh
npm ci
npm run build
npm run build:server
npm run start:server
```

On Windows, run these commands in PowerShell so Node listens on the Windows Wi-Fi
interface. The server prints an address such as `http://192.168.1.12:8787`.
Open that address on both phones connected to the same Wi-Fi. Allow the server
through the computer's firewall for the private network if prompted. Keep the
computer and terminal running. A WSL NAT address is usually not reachable directly
from another phone; use Windows Node or explicitly configure your own forwarding.

Choose time and starting side, then **Private match**. Enter the printed address
as Room server if it is not already filled. Create a room and send its invite link.
The guest opens the link and presses Join. When both seats are occupied, the
server starts a three-second countdown; White opens. Reverse still swaps armies
and clocks, while each device keeps its own current army at the bottom.

The invite is single-use, not a login. Each device receives a different private
seat token saved in that tab's session storage. Reload, open Private match and
use Reconnect to previous room. Closing the tab or clearing session storage may
lose that device's seat. Do not share a seat token. A host's waiting-room invite
is retained in its session so it can be copied again after reconnecting.

Leaving or disconnecting does not pause the match. Rejoining synchronizes with
the server's current position and clock. A rematch uses a newly created room and
invitation. There is no synchronized rematch negotiation or account recovery yet.

## Internet deployment

Use **one continuously running Node web service with persistent storage and HTTPS**.
The Dockerfile is also supplied for a VPS or a container host:

```sh
docker build -t check-happens-rooms .
docker run --rm -p 8787:8787 -v check-happens-rooms:/app/.room-data check-happens-rooms
```

A practical first managed-host option is a Render Web Service. Its official
[Node deployment guide](https://render.com/docs/deploy-node-express-app) supports
custom build/start commands. This server uses Node's HTTP library, not Express:

- Repository: this project's GitHub repository; root is the directory containing package.json.
- Runtime: Node 22 (or use the Dockerfile).
- Build: `npm ci && npm run build && npm run build:server`.
- Start: `npm run start:server`.
- Health check: `/health`; listen address `0.0.0.0` and the platform's `PORT`.
- Set `ROOM_DATA_DIR` to a directory on the service's persistent disk.
- Set `ALLOWED_ORIGINS` to `https://outsmarterenri.github.io` and, if serving the
  game on the backend's own domain, that HTTPS origin as well. Comma separated;
  specify origins, without trailing slashes or a repository subpath.

Render's [persistent disks](https://render.com/docs/disks) require an eligible paid
service. No resource, subscription or paid tier is created by this project.
Without durable storage, restarts/redeployments can lose rooms. An auto-sleeping
free instance also interrupts live play; do not advertise it as an always-on match
service. Compare the host's current terms before choosing a plan.

After hosting, paste its HTTPS root URL into Private match on the Pages app. It
is remembered on that device and included in new invitation links. Alternatively
set `VITE_ROOM_SERVER_URL` before building the Pages frontend. Backend environment
variables are not browser secrets and no provider credentials belong in this file.
Pages over HTTPS cannot use an HTTP room endpoint. The local Wi-Fi test therefore
opens the game directly from the HTTP room server instead of the Pages URL.

## Authority, privacy and diagnostics

The server creates and cryptographically shuffles the deck. It runs the same
resolver as local play, validates seats and turns, timestamps moves itself, and
rejects client StartGame/AdvanceTime commands. Command IDs deduplicate accepted
retries; the action revision rejects stale input without being invalidated by
clock-only updates. Network messages have bounded bodies and request rate limits.

Public snapshots omit checkpoints, journals, actual seed/RNG state, risk rolls
and future cards. Full match JSON is downloadable by a participant only after the
match ends, so it cannot reveal the live deck. The deterministic rules engine's
risk generator remains a server-held PRNG; this prototype is not a ranked,
cryptographically verifiable tournament system. Replay proves agreement with
this resolver, not fairness or authenticity against a malicious host.

Private-room snapshots never replace the offline saved-match slot. Room tokens
travel in Authorization headers, not query strings. The shared invitation uses a
URL fragment; treat the link as private. Only token hashes are stored on the
server. The server's atomic JSON file contains full private match logs and token
hashes, is excluded from Git/Docker context, and must be backed up and protected.

Rooms expire after six hours and a server admits up to 32 active rooms. One Node
instance owns the state. Disk snapshots are written after commands and every
second; elapsed clock time is reconciled on restart. A machine crash can lose
recent in-flight polling/clock samples, although persisted accepted moves are
written before the HTTP success response. Do not run replicas against the same
file. Scaling requires shared durable room ownership/transactions, stronger
operational limits and a database or an actor service such as Durable Objects.

The service has no accounts, public matchmaking, chat, analytics or room listing.
Hosting providers still process network traffic and IP addresses. Existing
reserved project rights and third-party notices continue to apply; no new runtime
npm package was added for networking.
