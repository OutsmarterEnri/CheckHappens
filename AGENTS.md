# Check Happens development

Support English and Italian presentation through the local language preference. Keep exported diagnostics and game commands in English. Preserve the iPhone portrait viewport and existing game rules.

For domain changes, read the relevant regression tests and caller phases before editing. All human, bot, clock and resume commands go through `dispatch`; `resolveCommand` is the pure replay path. Journal/checkpoint snapshots must never include a nested journal. Preserve replay compatibility or bump the rules/schema version explicitly. Schema 2 packs clock samples without discarding their durations/fingerprints; keep schema-1 fixtures and legacy saves readable. Recording context belongs to journal sessions, not the domain fingerprint.

Run `npm run check` and relevant Playwright tests. A verified log proves deterministic agreement with this resolver, not rule correctness. Add an independent regression test for a reproduced rule bug.

For cross-module work, use the installed Graphify skill when available with a local code-only graph of `src`; refresh changed sources and verify findings against source/tests. Generated graphs are ignored. OmniRoute and Agent Skills are development tools only, never game runtime dependencies. No gateway is configured by this project.

Do not commit personal match logs, environment files, dependencies, generated builds or browser traces. Do not enable online invitation UI until an authoritative transport is implemented and tested. `npm run analyze:match` accepts diagnostic files without uploading them.
