# Architecture

React + strict TypeScript + Vite, with no production dependencies beyond React. Local/bot play needs no backend or AI service. Private rooms use the separate Node service.

- `domain/types.ts`: state, phases, typed commands and events.
- `domain/turnResolver.ts`: synchronous deterministic rules. `resolveCommand` applies a command; `dispatch` adds journal recording around it.
- `domain/audit.ts`: command journal, schema-1/2 replay verification, imports and derived analysis.
- `domain/logCodec.ts`: compact clock runs, checkpoint deduplication and recording-session metadata.
- `domain/build.ts` and `scripts/build-info.mjs`: injected version/revision and deterministic source identity.
- `domain/cards.ts`, `rules.ts`, `clock.ts`: seeded deck/RNG, rule helpers/invariants and per-player clocks.
- `domain/computer.ts`: three stochastic heuristic profiles; all choices go through the resolver. No claim of measured Elo.
- `engine/ChessEngineAdapter.ts`: engine boundary. `implementation.ts` supports multi-move turns, stable piece IDs, resurrection and army swaps that ordinary alternating-turn engine APIs do not directly model.
- `ui/Shell.tsx`: home, mode/time/bot choice, settings and tutorial.
- `ui/App.tsx`: one-screen table and command dispatch; secondary actions use dialogs. `MatchFinale.tsx` renders Win/Lose/Draw without changing the outcome.
- `ui/persistence.ts`: best-effort device save and resume; elapsed wall time is charged on returning.
- `online/protocol.ts` and `client.ts`: validated room snapshots, authenticated HTTP commands, revision checks, retry IDs and polling/reconnect.
- `server/rooms.ts`: authoritative resolver, monotonic clocks, seat ownership, cryptographic deck shuffle, redacted public snapshots and replayable logs.
- `server/http.ts`: bounded JSON requests, CORS, rate limits, atomic persistence and optional static serving.
- `ui/PrivateRoom.tsx`: invitation/create/join/reconnect flow; `App.tsx` renders remote snapshots without local clock dispatch or offline-save writes.
- `ui/themes.ts` and `PieceEffects.tsx`: persisted palettes and reduced-motion-compatible chains/progressive cracks.

The first four numbered moves are mandatory and safe. Defense before drawing keeps the prior color, does not reduce the numeric card budget and consumes the optional action attached to a special card. Checkmate begins a full emergency-card turn while cards remain. Reverse swaps armies, clocks and orientation and keeps the newly drawn color. These rules have focused domain regression tests.

Journal data is excluded from checkpoint snapshots and from resolver cloning, preventing recursive growth. Checkpoint-only replay remains a legacy helper; V2 diagnostics re-execute commands instead of trusting checkpoints. Exports and device saves group clock ticks without discarding durations or fingerprints, and omit duplicate checkpoint/event histories. Imports regenerate the full history. Runtime state still keeps individual dispatch entries for verification.

Development-only Graphify builds a local AST graph; use it for cross-module navigation and verify findings against source/tests. OmniRoute is optional development tooling, not configured and not bundled into the game. Agent Skills validation applies when changing skills, not during gameplay.
