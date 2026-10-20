# Verification — version 2.0

Verified on 20 October 2026.

- Strict TypeScript and Vite production build pass.
- 107 Vitest tests pass: 79 rule/engine cases, 5 persistence cases, 4 existing computer cases and 19 new audit/time/bot cases.
- 25 Chromium browser tests pass. The suite covers English menus/tutorial/settings, 4/7/10-minute matches, three training profiles, turn changes, Reverse, defense before draw, color choice, +2/+4 ghosts, Wild evolution, Skip, pre-move cracks, destruction puff, JSON download/analysis, altered-log rejection, clock expiry and theatrical Win/Lose/Draw dialogs.
- Portrait viewport checks: 375×667, 393×852, 430×932 and 768×1024. Main action and menu touch targets are checked. Landscape shows a portrait-orientation hint.
- Reduced-motion risk/finale feedback and production service-worker offline reload are exercised. Browser tests fail on unhandled JavaScript errors.
- Initial engine perft remains 20 / 400 / 8902 at depth 1 / 2 / 3.
- The command-line analyzer reproduces the committed synthetic example (three actions, one handled rejection) and returns a successful report.

Tests use Chromium and emulated viewport dimensions, not a physical iPhone. Native Safari behavior, Dynamic Type at all accessibility sizes and real device safe areas still need a release pass. Elo strengths are estimates. Online invitations have no active transport and are not included in these results.

The verifier reuses the production resolver, so deterministic replay alone cannot prove rule correctness. Independent regression cases cover card rules and chess legality. Logs are unsigned and cannot establish authenticity.

In this execution environment, requests to unused loopback ports could stall the Playwright readiness probe. The test servers were started directly, then the suite ran with `PW_REUSE_SERVER=1`. Normal CI starts its own servers with reuse disabled. Locally stop a running server before using the default test command, or opt into that variable when intentionally reusing your own servers.
