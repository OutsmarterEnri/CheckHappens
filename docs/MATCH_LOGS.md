# Reproducible match logs

Schema: `format: "check-happens-match"`, `version: 1`, `rulesVersion: "2.0.0"`.

`journal.initial` captures the starting snapshot, including deck order, RNG state, clocks, ownership, phase and pieces. `journal.entries[]` records a zero-based `seq`, `elapsedMs`, source (`human`, `computer`, `clock`, `resume`, `system`), active player/turn/phase, typed command, acceptance or domain error, emitted events and a state fingerprint. `final` is the final snapshot. The envelope also records export time.

Every dispatch is recorded, including time ticks and rejected actions. Selecting a piece or opening a menu does not change domain state and is not a game command. Input after a completed match is normally disabled. A rejected move still spends elapsed time; no piece action is applied. Bots use exactly the same command/resolver path.

Verification starts from the initial snapshot and runs the resolver at each recorded elapsed time. It checks actor/phase, result/error, all emitted events, state fingerprints and invariants after every action, then compares the complete final snapshot. The result gives `valid`, `checked`, `rejected`, and (on failure) `firstDivergence` plus a message. Recorded rejection is a handled input, not automatically a match failure.

Clock origins change when a browser reloads; `lastAt` values are normalized for comparison while elapsed duration and remaining time remain checked. The one-device save retains the journal across reload. Resume writes its elapsed-time action into that same journal. Older saves without a journal start a new verification baseline at their next action, so they do not claim coverage of earlier gameplay.

The on-device save is best-effort localStorage: browser quota or private mode can prevent persistence. Export before starting another match or clearing browser storage. Export is explicit; the app never uploads logs. Generated human logs belong in ignored `match-logs/`, not Git. A small synthetic example is committed under `docs/examples/`.

Files larger than 20 MB, more than 50,000 actions, unsupported schema/rules versions, malformed commands and invalid states are rejected. Import replay accepts only successfully verified V2 logs. The CLI exits 0 for a valid replay, 1 for a detected divergence, 2 for usage/parse/tool failure. Zero-action logs are explicitly described as a validated snapshot, not a replayed match.

Fingerprints use FNV-1a for change detection and are not cryptographic. This format is not proof of authenticity and is not an online authority protocol. A malicious author can construct a new valid history. The verifier tests consistency with the current resolver, not the correctness of the resolver itself: rule regression tests and browser tests remain necessary.

For rule bug reports, export immediately after the unexpected behavior, note what you expected and include the seed, time control, bot level and device. The first divergent action localizes a reproduction failure; a clean replay of incorrect behavior instead localizes a rule bug for a new regression test.
