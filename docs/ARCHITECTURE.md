# Architecture

React + strict TypeScript + Vite, with no production dependencies beyond React. No backend or AI service is needed to play.

- `domain/types.ts`: state, phases, typed commands and events.
- `domain/turnResolver.ts`: synchronous deterministic rules. `resolveCommand` applies a command; `dispatch` adds journal recording around it.
- `domain/audit.ts`: log schema, command journal, event/state comparisons, imports and deterministic verification.
- `domain/cards.ts`, `rules.ts`, `clock.ts`: seeded deck/RNG, rule helpers/invariants and per-player clocks.
- `domain/computer.ts`: three stochastic heuristic profiles; all choices go through the resolver. No claim of measured Elo.
- `engine/ChessEngineAdapter.ts`: engine boundary. `implementation.ts` supports multi-move turns, stable piece IDs, resurrection and army swaps that ordinary alternating-turn engine APIs do not directly model.
- `ui/Shell.tsx`: home, mode/time/bot choice, settings and tutorial.
- `ui/App.tsx`: one-screen table and command dispatch; secondary actions use dialogs. `MatchFinale.tsx` renders Win/Lose/Draw without changing the outcome.
- `ui/persistence.ts`: best-effort device save and resume; elapsed wall time is charged on returning.
- `online/protocol.ts`: future private-room messages only. No active transport.

The first four numbered moves are mandatory and safe. Defense before drawing keeps the prior color, does not reduce the numeric card budget and consumes the optional action attached to a special card. Checkmate begins a full emergency-card turn while cards remain. Reverse swaps armies, clocks and orientation and keeps the newly drawn color. These rules have focused domain regression tests.

Journal data is excluded from checkpoint snapshots and from resolver cloning, preventing recursive growth. Checkpoint-only replay remains a legacy helper; V2 diagnostics re-execute commands instead of trusting checkpoints. Time ticks use compact events rather than full checkpoints.

Development-only Graphify builds a local AST graph; use it for cross-module navigation and verify findings against source/tests. OmniRoute is optional development tooling, not configured and not bundled into the game. Agent Skills validation applies when changing skills, not during gameplay.
