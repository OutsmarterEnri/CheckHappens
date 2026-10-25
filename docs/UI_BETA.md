# UI preview and verification

This beta redesigns the home, match setup, settings, private invitations, learning
hub, card lab, guided lessons, sandbox, live table, choices, countdown and finale.
Rooki, all six worlds, EN/IT, game rules and semantic card colors are preserved.
The styling uses the local UI/UX Pro Max Claymorphism guidance; no new UI package,
external font, telemetry or hosted service has been added.

## Try on this computer

```sh
npm ci
npm run beta
```

On Windows you can double-click `BETA.cmd` to serve the already-built beta. Open http://localhost:4189/.
`npm run beta` builds `dist-beta/` and serves it; `BETA.cmd` only serves the existing beta build. The production `dist/` stays separate.
Keep the terminal open. Ctrl+C stops the preview. Re-run the command after changes.

## Try on iPhone

Connect the iPhone and computer to the same Wi-Fi. Open the LAN URL printed by
the server in Safari (port 4189). Local/bot matches work without a backend. The
computer must remain running. If the firewall asks, allow the server on your
private home network. HTTP LAN testing does not reproduce installed HTTPS PWA
status-bar behavior or reliable offline installation.

Port 4189 is a separate browser origin: its saved match, theme and language do not
replace the Pages app's data. Private invitations still need the experimental room
server. No public deployment or tunnel is created by this command.

## Cosa provare

- Home: logo, Rooki, Gioca/Tutorial/Impostazioni; nessuno scorrimento.
- Tutti i sei temi, lingua italiana/inglese e movimento ridotto.
- Scelta del tempo, colore di partenza, allenamento e countdown.
- Partita: cronometri, carta sopra la scacchiera, turno attivo, mosse residue,
  selezione colore/pezzi e Passa quando disponibile.
- Tutorial, laboratorio, sandbox e messaggi di vittoria/sconfitta.
- Header sotto il notch e comandi in basso: la resa PWA nativa richiede comunque
  un successivo test HTTPS su iPhone.

The owner reviewed this local preview and approved the update for push. The
preview command remains available for future changes. Pages deployment is managed
separately through the repository workflow.

## Verification

The beta keeps the existing domain resolver untouched. TypeScript, 207 unit tests,
production/server builds and the beta build pass. All 77 browser checks pass in Chrome, including complete EN/IT course playthroughs
at two phone sizes, skipped-lesson progress, and mascot interaction. Coverage includes all
existing game/navigation/tutorial cases plus dedicated text-contrast checks in
all six worlds and a 44px motion-toggle target. The prior world tests now expect
the intentionally solid backdrop and lighter 2px mascot frame. The Pass action
appears through opacity only, preserving its full touch geometry while animating.
Native iOS rendering, Dynamic Type and status-bar behavior require device review.

## Rebuilt learning experience

The beta now includes two independent, fully bilingual courses: 13 chess lessons
(board setup/coordinates, every piece, check, mate, castling, en passant, promotion
and stalemate) and 14 Check Happens lessons (turns, clocks/colors, risk/pass,
action cards, defense, emergency rescue and the exhausted deck). Each exercise
is evaluated by the real resolver, on an isolated state with frozen practice time.
Hints, retries, lesson selection and device-local progress are available. Card lab
and Sandbox remain optional exploration tools, not prerequisites for playing.
Clicking the mascot keeps its animation without displaying a speech bubble.
