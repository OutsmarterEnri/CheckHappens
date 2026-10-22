# Check Happens — project status, 22 October 2026

Playable prototype 2.5, published at https://outsmarterenri.github.io/CheckHappens/.
Project-authored code and assets remain reserved under the root LICENSE.

## Implemented

- Local pass-and-play and three heuristic training bots, with White/Black/Random and 4/7/10-minute clocks.
- Chess/card turn resolver, check defense, emergency draws, Reverse, action cards and break-risk feedback.
- English/Italian phone UI, six visual worlds, illustrated mascot, installable icons, reduced motion and one-screen layouts.
- Sixteen guided missions, a card laboratory and an isolated position Sandbox using the real resolver.
- On-device save/resume, compact JSON recording, replay verification and CLI analysis.
- Edge-swipe navigation, explicit Back/Home buttons, single-screen menu and learning templates.
- GitHub verification and manually dispatched Pages deployment; 195 unit and 68 Chromium browser tests.

The 22 October review batch is included in this release: validated imports, shared command validation, ordered room responses, sandbox checks, CLI correction and development-tool updates. See [review report](REVIEW_2026-10-22.md).

## Still experimental or limited

- Private rooms have an authoritative Node server and local two-client tests. No public HTTPS backend is configured; Pages hosts only the frontend.
- Training Elo labels are estimates, not calibrated ratings.
- Browser tests emulate phone geometry and touch events in Chromium. Physical Safari/Home Screen testing, larger accessibility text and native edge-gesture behavior remain release checks.
- Deterministic JSON replay checks agreement with this resolver, not independent proof of rule correctness. Logs are unsigned.
- Chess dead-position/timeout material evaluation is conservative in exceptional positions.
- Saves are device/origin-local, with no accounts or cloud synchronization. Leaving play does not pause the clock.

## Recommended next milestones

1. Physical iPhone playtest of all menus, edge Back, countdown, card choices and a complete match; collect any failing match JSON.
2. Analyze real games and refine rule clarity, interaction feedback and training strength from observed behavior.
3. Choose and configure a separate backend, then test private matches across two devices with real Internet latency and reconnects before promoting multiplayer.
