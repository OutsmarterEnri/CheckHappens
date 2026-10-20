# Changelog

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
