# Private invitations — planned

The current version supports two humans on one device and local training bots. It does not create online rooms.

`src/online/protocol.ts` sketches invite/resume tokens, revisions, commands, rejection reasons and resynchronization. A later server should own the resolver, deck/RNG, clocks and command journal, validate the connected player's turn, deduplicate command IDs and reject stale revisions. Clients should render authoritative updates and reconnect via snapshots.

Deployment, authentication/token expiry, room lifecycle, reconnect/timeout policies and end-to-end multi-client tests must be implemented before enabling the menu entry. Browser-generated JSON logs are not a substitute for an authoritative server.
