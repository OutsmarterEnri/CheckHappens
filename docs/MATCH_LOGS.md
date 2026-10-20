# Reproducible match logs — schema 2

Version 2.0.1 writes `format: "check-happens-match"`, `version: 2`, `rulesVersion: "2.0.0"`. The game rules have not changed. Original schema-1 logs remain readable and verifiable; the synthetic schema-1 fixture stays in the repository to test compatibility.

## Compact data without dropping clock samples

`journal.initial` captures the verification baseline, including deck, RNG, clocks, pieces, control and phase. `journal.entries[]` contains either:

- `kind: "action"`: the original zero-based sequence, elapsed time, source, player/turn/phase, typed command, acceptance/error, domain events and state fingerprint. Full checkpoint snapshots are omitted: the resolver regenerates them during replay, and its resulting state is checked.
- `kind: "clock-run"`: consecutive accepted clock-only dispatches with the same player/turn/phase. Each `ticks` tuple retains its exact elapsed milliseconds and state fingerprint. No averaging or timing approximation is applied. Sequence numbers still refer to expanded actions.

Timeouts, rejected commands, resume events and meaningful game transitions remain ordinary actions. A clock run may not hide a GameEnded or any other non-clock event. Verification checks every expanded action, including individual clock samples, and reports the first original action index that diverges. `checked` counts expanded actions, not packed blocks.

`final` contains one final domain snapshot without its duplicated event history. Import reconstructs the full event history by replaying the journal. Re-exporting an imported compact log retains its timing, sequence and fingerprints.

## Recording context and exact build

`metadata.exporter` describes the application doing the export. `metadata.timeControlMinutes` records 4, 7 or 10 minutes (null for older unknown data). `metadata.sessions[]` records the first covered action index, local/computer mode, bot difficulty (null for local play), and recording build for each session or reload.

Each build has an application version, Git revision, dirty flag and a 20-character SHA-256 source identifier. The identifier includes source files, public assets, entry HTML, Vite configuration, lockfile and build-info generator. It does not contain machine paths, credentials or a timestamp. Git revision is `unknown` in source ZIPs without Git. In development the build context is captured when Vite starts: restart Vite after source edits when collecting diagnostics. Production builds capture the packaged source.

Schema-1 conversion leaves historical recording sessions empty; it never invents an unknown bot difficulty or recording build. If an old match is resumed, the newly observed context starts at the first action of that session. An exporter build is not a claim about the build that recorded an older match. Session metadata is diagnostic context, not authenticated evidence.

## Save, resume and analysis

On-device localStorage now stores the compact log plus save time. The loader still accepts the original `{state, savedAt}` saves. A resumed compact log is verified and reconstructed before applying time spent away. Clock origins (`lastAt`) are normalized for comparison; elapsed durations and remaining times are still checked. Saving is best-effort when browser storage is unavailable or full.

Menus and piece-selection taps are not domain commands. Rejected moves spend elapsed time without applying the move. The app does not upload logs. Export before replacing a match or clearing browser data. Store personal logs in ignored `match-logs/`; only synthetic examples belong in Git.

```sh
npm run analyze:match -- path/to/match.json
npm run analyze:match -- --compact OLD.json NEW.json
```

The analyzer accepts either schema and derives a summary from verified replay: moves, captures, cards, effects, elapsed covered play time, outcome and clocks. A log starting from a mid-match snapshot only covers later durations. Invalid logs do not receive a trusted summary. Conversion verifies before and after packing, refuses to overwrite files and leaves the input unchanged. Exit codes: 0 reproduced, 1 divergence, 2 usage/parse/tool error.

Limits remain 20 MB and 50,000 expanded actions. Malformed runs, invalid metadata, unsupported schemas or rules versions, invalid states and altered actions are rejected. Zero-action logs are described as snapshots rather than completed replays.

Fingerprints use FNV-1a for deterministic state-change detection; they are not cryptographic signatures. Replay consistency does not prove rule correctness or authenticity. Independent rule tests remain necessary. These logs are not an authoritative online/anti-cheat protocol.
