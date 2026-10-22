# Changelog

## 2.5.0

- Draw the app behind the installed iOS status area and apply the saved palette before React loads, retaining opaque safe-area headers and the notch blur workaround.

- Extended the confirmed iOS standalone opaque-header notch workaround to home, setup, settings, invitations and all learning screens without moving their controls.

- Rebuilt the menus around a comic clubhouse: layered chess/card mascot stage, a dominant Play action, paired learning/settings shortcuts and themed SVG icons.
- Match setup now groups clock/side controls, local/private play cards and training in distinct surfaces. Settings uses an illustrated six-theme gallery and native accessible motion toggle.
- Added shared menu navigation chrome, restyled invitation and learning-hub menus, and four six-world regressions for home hierarchy, text fit and touch targets in EN/IT.

- Replaced centered match-choice layout with the shared top-aligned secondary-menu shell, including resumable matches and invitation forms.
- Added edge-swipe Back through menus, learning pages and game drawers; form, board, vertical, short, cancelled and multitouch gestures are excluded.
- Audited every menu/learning template in six themes, EN/IT and phone/safe-area layouts.

- Added Boo Happens (Dolcetto o Scacchetto), a sixth Halloween world with a witch-rook mascot, plum night surfaces and pumpkin-orange accents; card colors stay fixed.

- Anchored Settings to the game’s top header and 12px side margins; added safe-area layout regressions.
- Unified learning headers, card panels, turn banners, board frames, active-color labels and edge coordinates with the game presentation.

- Framed the menu mascot like the board and added a stationary-then-half-turn idle every 3.5 seconds, plus a subtle non-game page glimmer. Both respect system and saved reduced-motion preferences.

- Replaced the initial vector mascot with the owner-supplied illustrated identity, five theme variants, splash art and iPhone icons.

- Rebuilt all five themes as complete visual worlds, including board, pieces, controls and feedback; functional card and color-frame colors remain fixed.
- Introduced Rooki, an interactive vector rook mascot with theme accessories, plus a new wordmark, branded loading screen and installable icons.
- Added seven browser regressions for world coverage, four unchanged card/frame colors, small-screen settings, reduced motion and saved-theme loading.

- Four alternative, persisted cartoon palettes in bilingual Settings.
- Skip chains and five progressive crack stages reflect effective break risk, with reduced-motion support.
- Private invitations, two-device authoritative play, countdown and reconnect through the included Node server.
- Authenticated commands, revision/idempotency checks, hidden future deck, atomic room persistence and end-of-match verified JSON.
- LAN instructions, Docker packaging and separate HTTPS hosting guidance; no public backend provisioned.
- Viewer-aware online finales and independent offline saves.


## 2.0.1

- Compact JSON schema 2 groups consecutive clock samples while retaining exact duration and fingerprint checks for every dispatch.
- Full checkpoint and final event-history duplicates are removed from exports; import regenerates them through the resolver.
- Device saves use the same compact format; original schema-1 logs and original saved-state files remain supported.
- Recording sessions include local/computer mode, bot difficulty and build version/revision/source identity. Historical unknown metadata stays unknown.
- The CLI derives match summaries from verified replays and can convert old files without overwriting them.
- The first submitted real match shrank by approximately 95% with all 1,017 actions still verified.
- Header/safe-area backgrounds are opaque; the turn banner no longer fades in.
- Offline shell assets load correctly behind static hosts adding `Vary: Origin`.
- GitHub origin, CI, synthetic fixtures and first-push instructions are prepared. No push or deployment is performed automatically.

## 2.0.0

Initial local release: English iPhone-oriented interface, 4/7/10-minute modes, three training bots, card interactions, theatrical finales and deterministic schema-1 match logs.

### Tutorial card lab

- Visible examples of all action cards and safe/risky numbered cards, in English and Italian.
- Interactive move-risk preview, progressive cracks and explicit king restriction from move five.
- Expanded color, defense and emergency-turn explanations without touching saved matches.

### Separate learning spaces

- Separate card lab with playable examples, 14 guided lessons and a free position Sandbox.
- Real resolver and chess legality in practice, frozen clocks and isolated saved-match storage.
- Viewport-sized learning pages without scrolling; paged settings information and separate private create/join views.

### Tutorial rebuilt from scratch

- Sixteen action-based challenges replace the freely skipped lesson carousel.
- Visible cards, suggested squares, contextual hints, verified objectives and result feedback.
- Next unlocks on actual game outcomes; retry and a final transition to match setup support the first game.
- The learning-board grid no longer inherits toolbar minimum sizing on small screens.

### Tutorial rule audit

- Derive lesson card faces from actual setup/event data: Yellow 1, concealed pre-defense card and Green 4 after defense.
- Prepare risk lessons with four real resolver moves instead of changing counters; retain piece-use and clock effects. Free practice starts at move one.
- Correct the Yellow instruction and block completion while another capture bonus remains.
- Explain Red as time removal, qualify Yellow/Reverse exceptions and filter Wild options through engine legality.
