# Third-party notices

The project-owned code remains reserved; that does not replace the licenses of these components.

| Component | Locked version | Role | License and full supplied text |
|---|---|---|---|
| React | 19.3.1 | Browser runtime | [MIT](licenses/react-LICENSE) |
| React DOM | 19.3.1 | Browser runtime | [MIT](licenses/react-dom-LICENSE) |
| Scheduler | 0.28.0 | React runtime support | [MIT](licenses/scheduler-LICENSE) |
| Vite | 6.4.4 | Build tool / browser preload helper | [MIT core and bundled-tool notices](licenses/vite-LICENSE.md) |

The production build includes [public notices](public/THIRD_PARTY_NOTICES.txt) at `THIRD_PARTY_NOTICES.txt`. Keep these when distributing or deploying `dist/`. Vite's complete supplied license file is retained in `licenses/`, including its bundled dependency notices; this does not imply those build-only dependencies all run in the browser.

[Dependency inventory](docs/DEPENDENCY_LICENSES.md) lists package-level metadata from the lockfile, including development tools. Package metadata is an inventory, not a legal clearance opinion. Full upstream texts and any NOTICE obligations take priority. Recheck when dependencies or assets change.

Chess move logic, SVG pieces and the application icon are maintained in this repository. There is no external chess engine or downloaded icon/font package in the current runtime dependency list. Font names in CSS refer to fonts provided by the device; font files are not bundled. This source/dependency inspection does not establish that the project name or all visual design choices are cleared for third-party rights.

Ponytail, Graphify, OmniRoute and Agent Skills are development workflow references/tools; their implementations are not bundled into the deployed game. Their licenses would need separate review if their code or assets were copied into a release.
