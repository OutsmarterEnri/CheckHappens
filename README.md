# Check Happens.
### In Cards we trust

A playful, local chess + cards prototype designed for an iPhone screen. Pass one phone between two players, or train against three deliberately forgiving bots.

![Check Happens on a phone](docs/v2-game-iphone.png)

## Play locally

Requires Node.js 22 or newer.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Choose **Play**, a time control and a local match or bot.

- **Bullet:** 4 minutes each.
- **Blitz:** 7 minutes each.
- **Rapid:** 10 minutes each.
- **Easy / Medium / Hard:** approximately 120 / 200 / 500 Elo labels. Strategies differ; ratings are uncalibrated estimates.

Time mode names are custom to this game. Gameplay stays inside one portrait viewport; secondary controls open in overlays. The colored board frame, turn banner and move counter remain visible. Risky pieces crack and shake; broken pieces disappear with a puff. Match endings have a theatrical Win/Lose/Draw popup, review and rematch controls. Reduced motion is supported.

## Try on iPhone

```sh
npm run build
node scripts/serve.mjs --lan
```

Connect computer and iPhone to the same Wi-Fi, then open the printed LAN URL in Safari. Keep the computer running. Windows users can use `IPHONE.cmd` after building, or `PLAY.cmd` to play on the computer. See [iPhone and PWA notes](docs/IPHONE.md). A secure HTTPS origin is needed for service-worker offline support on a physical iPhone; ordinary LAN HTTP supports gameplay, not offline caching.

## Compact match JSON and verification

From the table open **Game options → Save match JSON**, **Verify this match**, or **Analyze JSON file**. All resolver commands—including rejected input, clock updates, card choices and bot actions—are journaled. Logs include their initial state, exact clock samples, domain events, state fingerprints, final state, recording-session mode/bot level and build identity. Schema 2 groups clock samples and omits duplicate checkpoints; schema 1 remains compatible. Device saves use the compact format too. They remain local until you export/share them.

```sh
npm run analyze:match -- path/to/match.json
npm run analyze:match -- --compact old.json compact.json
```

The analyzer re-executes every action with the same rules, seed and timing, checks invariants and reports the first divergence. Exit code 0 means reproduced, 1 means divergence, 2 means an unreadable file/tool error. [Format and limits](docs/MATCH_LOGS.md).

A verified log demonstrates agreement with this resolver. It cannot prove that every game rule is correct or detect a bug consistently shared by recording and replay; independent rule tests cover that separately. Logs are diagnostic, not signed anti-cheat records.

## Development

```sh
npm run typecheck
npm test
npm run build
npx playwright install chromium
npx playwright test --workers=2
```

`npm run check` runs TypeScript, domain tests and a production build. Browser tests start/stop their own dev and production servers. They cover phone viewports, tutorial, three bot settings, direct card interactions, logs, match endings and offline loading. [Architecture](docs/ARCHITECTURE.md) · [verification details](docs/TESTING.md).

## Status

- Local play, bots, saving/resuming and JSON diagnostics work without a backend.
- Leaving a match does **not** pause the clock; resume accounts for elapsed wall time. Starting a new match replaces the one local save: export before replacing it.
- Fresh matches choose a new seed; exported logs preserve it for reproduction. The Lab offers seeded decks and deterministic scenarios, including breakage and finales. Lab fixtures are analysis starting positions, not normal match history.
- Existing Pocket saves retain their remaining time; journal coverage begins at the first action handled by version 2.0. Original schema-1 diagnostic logs remain verifiable. Older checkpoint-only replay files are not command journals.
- Private online invitations are a planned feature. [Transport contract and plan](docs/ONLINE.md); no server, invite links or remote matches are active.
- Original detailed rule notes remain in [REGOLE.md](docs/REGOLE.md) and [SPECIFICA.md](docs/SPECIFICA.md) in Italian.

## First GitHub push

The repository is prepared on branch `main`, with a lockfile, ignore rules and GitHub Actions checks. `origin` points to `OutsmarterEnri/CheckHappens`; the remote was empty when checked. No push or deployment runs automatically. Follow [PUSH.md](docs/PUSH.md) to publish the prepared commits.
