# Verification — version 2.5.0

Latest UI and theme verification: 22 October 2026.

- Strict TypeScript and Vite production build pass.
- 176 Vitest tests pass: 22 new room, HTTP, theme, crack and viewer-finale cases, alongside 80 rule/engine cases, 5 persistence cases, 4 existing computer cases and 19 audit/time/bot cases, 9 compact-log/storage/metadata cases and 1 source-build fingerprint case, plus 3 language formatting regressions.
- 65 Chromium browser tests pass. Four new cases cover persisted themes, Skip chains, progressive cracks and a two-client invitation/reconnect match. The suite covers English menus/tutorial/settings, 4/7/10-minute matches, three training profiles, turn changes, Reverse, defense before draw, color choice, +2/+4 ghosts, Wild evolution, Skip, pre-move cracks, destruction puff, JSON download/analysis, altered-log rejection, clock expiry and theatrical Win/Lose/Draw dialogs.
- Portrait viewport checks: 375×667, 393×852, 430×932 and 768×1024. Main action and menu touch targets are checked. Landscape shows a portrait-orientation hint.
- Reduced-motion risk/finale feedback and production service-worker offline reload are exercised. Browser tests fail on unhandled JavaScript errors.
- Initial engine perft remains 20 / 400 / 8902 at depth 1 / 2 / 3.
- The command-line analyzer reproduces both synthetic schema-1 and schema-2 examples (three actions, one handled rejection), derives a trusted summary and converts without changing outcomes.
- The first real submitted match replays 1,017 actions identically before/after conversion: 4,850,927 input bytes became 235,203 bytes (about 95% smaller). The personal log remains outside the repository.
- The opaque header/safe-area background and non-fading turn banner are preserved.
- Service-worker fallback handles static servers with `Vary: Origin`, which otherwise caused precached module/style requests to miss offline.

Tests use Chromium and emulated viewport dimensions, not a physical iPhone. Native Safari behavior, Dynamic Type at all accessibility sizes and real device safe areas still need a release pass. Elo strengths are estimates. Private transport is tested with two Chromium contexts and a real local HTTP server. Public HTTPS hosting and two physical iPhones remain deployment checks.

The verifier reuses the production resolver, so deterministic replay alone cannot prove rule correctness. Independent regression cases cover card rules and chess legality. Logs are unsigned and cannot establish authenticity.

In this execution environment, requests to unused loopback ports could stall the Playwright readiness probe. The test servers were started directly on separate ports to avoid interfering with the user’s server. A temporary test configuration used port 5188 for development and `PW_PRODUCTION_URL=http://127.0.0.1:4188/` for offline production checks. `PW_REUSE_SERVER=1` is also supported when intentionally reusing default-port test servers. Normal CI starts its own servers with reuse disabled. Locally stop a running server before using the default test command, or opt into that variable when intentionally reusing your own servers.

Publication preparation: the manual-only Pages YAML and local documentation links were validated. A separate Chromium smoke test served the build under `/CheckHappens/` with `Vary: Origin`, checked the scoped service worker, public third-party notices and offline play. This did not activate or deploy GitHub Pages.

### iOS 27 installed-app header blur

The user reproduced a blurred game header on iOS 27.2 only when launched from
Home Screen; Safari renders the same controls sharply. An iOS standalone-only
CSS workaround transfers the existing top inset into an opaque sticky header,
so the header reaches the viewport edge without moving its controls or changing
the game table's available height. Normal browser layout remains unchanged.
This follows the safe-area header experiment reported by
[OJapp](https://tips.ojapp.app/en/ios-27-pwa-top-blur-workaround-2/), not a documented
Apple API. Chromium checks cannot reproduce or prove removal of the system blur;
the user confirmed the patch works on the affected iPhone. The service-worker cache is
bumped so an installed app can receive the updated shell after its windows close.

### Bilingual phone UI

English remains the default. The Italian preference persists independently of the
match, updates the document language, and translates visible controls and their
accessible names at the React presentation boundary. Commands, serialized state,
replay fingerprints and diagnostic records are not translated. Two browser cases
exercise the persisted switch, tutorial, local game, +4 ghosts, Wild color and
evolution choices, prominent Pass action, verifier and translated finale. Existing
English browser scenarios continue to run. Card content precedes the board in DOM
and visual order; clocks are larger and action animation respects reduced motion.

### Starting side and automatic launch

Five domain regressions cover White/Black/seeded Random, the bot opening with
White while the human remains P1, no countdown clock charge, Reverse swaps and
verified JSON replay from either starting configuration. Existing constructors
still default to White, preserving saved-match and schema-1/2 fixture behavior.
Browser coverage exercises 3–2–1, the missing extra Start button in normal play,
first bot action, cancellation, persisted Random preference, direct resume and rematch countdown. Menu-launched
matches and rematches count down; resumed matches retain their current state.
Direct laboratory links retain a manual start for deterministic diagnostics.

### Board height and legibility comfort pass

The square board now anchors near the card panel instead of the bottom of its
column, matching the higher placement in the user's reference. Its size follows
the column's actual available height through container units, with the previous
viewport calculation retained as a fallback. Both clocks have a 130px minimum
width and 35–41px numerals (120px / 33px on short screens). Game labels, move
budgets, coordinates, color tags and action hints are larger without changing the
font family. Manual geometry checks cover 375×667, 393×852, 414×896 and 430×932,
including 59px top and 34px bottom safe areas; the board remains square and no
page scrolling or player-row clipping is introduced.

### Card tutorial lab

Two additional bilingual browser cases inspect every card example at 375×667, the safe/risky move preview, king restriction, crack stages and unchanged offline save. Existing guided tutorial and language flows also pass.

### Separate learning pages and sandbox

Card lab and 14 guided lessons use the same dispatch/engine as real matches. Sandbox positions are validated before testing and never overwrite the game save. Six focused unit cases cover practice isolation, numeric risk, king restriction, colors, resurrection, Skip, defense and emergency effects. Browser cases check every lesson/card, editing and Reverse in EN/IT, plus viewport bounds at 320×568, 375×667, 393×852 and 430×932. Menus and private-room create/join views are checked for overflow too.

### Tutorial rebuilt around actions

Sixteen missions use actual resolver outcomes to unlock Next. Seventeen new unit cases prove each goal starts incomplete, is achievable through real legal commands, and is not satisfied by drawing alone. Three browser journeys play all missions in EN/IT and at 320×568, checking instructions, hints, results, viewport bounds and the untouched offline save. Learning-board grid cells now override toolbar minimum sizing, preventing adjacent small-screen squares from intercepting taps.

### Tutorial/engine audit

The Yellow lesson now shows the actual 1 card and requests a quiet knight move after the capture: the old bishop suggestion captured again and left another mandatory bonus. Completion stays blocked while that bonus remains. Defense conceals the new card until the engine draws the real Green 4, and uses Begin turn rather than Draw card. Risk lessons execute four real safe moves through dispatch; used pieces, positions, color bonuses and exact journal replay are preserved. Card lab and sandbox start a 7 at move one. Wild offers only engine-legal evolutions. Five independent regressions cover previews, genuine risk preparation, free practice, chained Yellow captures and defense color/budget/used-piece behavior.

### Rooki and complete visual themes

World browser cases exercise all six worlds, their distinct background patterns,
matching mascot variants, four fixed card-face and active-frame colors, and
viewport-contained settings at 320×568. Additional cases verify that tapping Rooki
changes its phrase without layout shift under reduced motion, and that the initial
loading screen uses the saved theme even when the React bundle is blocked.
The existing game, tutorial, sandbox, finale, bilingual and offline regressions
continue to run. The app icons use the owner-supplied mascot. Theme art is displayed directly from
the supplied sheet; the isolated main character is used for loading and compact marks.
No runtime dependencies were added.

The mascot idle regression samples paused animation frames at 0, 3.5 and 7 seconds,
checks the half-turn and 320×568 containment, unchanged menu positions, and both
reduced-motion controls. Gameplay does not receive the menu idle animation.

### Settings and learning shell alignment

Settings uses the table’s 12px side gutters and top-aligned 44px navigation.
Learning spaces share branded headers, bordered card panels, colored board frames
and edge-only coordinates. Three new browser cases check 320×568, 393×852 and
428×926, including simulated 59px top / 34px bottom safe areas, Settings panel
position and containment, and the card laboratory’s active-color frame label.
Real Safari safe-area rendering remains a physical-device check.

Boo Happens adds a sixth world to the shared card-color, frame-color, image-loading
and small-screen checks. Saved-theme loading is exercised with Halloween before
React starts. The six Settings choices still occupy three rows.

### Navigation and template audit

Seven browser cases audit all six palettes at 320×568 in EN/IT, 393×852 in IT
and 428×926 in EN, including simulated 59px top and 34px bottom safe areas.
Every visible control is checked inside the usable viewport on match selection,
settings, private create/join, learning hub, card lab, Sandbox and guided lessons.
A resumable-match chooser, waiting invitation and remembered-room reconnect entry are checked separately at 320×568.

TouchEvent-based tests exercise hierarchical edge Back, drawer close/back,
return from the table, board/form exclusions and rejection of short, non-edge,
vertical, leftward, cancelled and multitouch drags. Visible buttons remain the
alternative. Physical iPhone/Safari and Home Screen gesture behavior still need
user testing; Chromium touch-event simulation does not certify native gestures.

### Clubhouse menu rebuild

Four additional cases check the new home hierarchy across all six themes at
320×568 and 393×852, in English and Italian, including simulated phone safe areas.
They verify section separation, unclipped button text, 44px touch areas and no
page scrolling. Existing navigation matrices still cover match selection, saved
matches, invitation waiting/reconnect, settings, learning and edge Back.
The 65-case browser suite also verifies that all functional card/frame colors,
countdown, bot profiles, saves and teaching interactions remain unchanged.
