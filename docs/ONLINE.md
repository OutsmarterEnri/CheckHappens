# Private invitations — version 2.5

Private rooms use the included authoritative Node HTTP service. The same pure resolver owns legal actions, deck, clocks and journal on the server. Clients submit authenticated commands with revision and idempotency IDs, then render redacted snapshots through polling. Two-client invitation, move synchronization and reconnection are browser-tested.

See [setup, deployment and limitations](PRIVATE_MATCHES.md). GitHub Pages hosts only the frontend. No public room endpoint has been provisioned. A local server supports two devices on the same network; Internet play requires a separately hosted HTTPS instance.

The prototype uses one process, bounded rooms and private disk persistence. Seat tokens stay in session storage and only their hashes are persisted server-side. Invitations are single-use. Live snapshots hide the future deck, risk rolls and journal; full verified JSON is available after the match. Disconnects do not pause clocks. Accounts, seat recovery, synchronized rematch and multi-instance scaling remain future work.
