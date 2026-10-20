> Historical Pocket notes. Superseded by [TESTING.md](TESTING.md).

# Verifica del prototipo

Eseguita il 20 ottobre 2026. Aggiornamento Pocket: timer 7+0, interfaccia iPhone, animazioni cartoon e salvataggio automatico.

| Controllo                             | Esito                                       |
| ------------------------------------- | ------------------------------------------- |
| Vitest dominio e motore               | **88 test passati**                         |
| Playwright su Chromium                | **15 test passati**                          |
| TypeScript strict (`tsc -b`)          | **Passato**                                 |
| Build Vite di produzione              | **Passata**                                 |
| Perft iniziale del motore             | **20 / 400 / 8902** a profondità 1 / 2 / 3  |
| Sequenza di 120 azioni con invarianti | **Passata**                                 |
| HTTP locale di sviluppo               | **200 OK**                                  |
| Desktop 1440 × 1100                   | **Verificato in browser**                   |
| Mobile 390 × 844                      | **Verificato, nessun overflow orizzontale** |

## Percorsi browser

1. Scacchiera con 64 caselle, difesa prima della pesca, budget numerico non ridotto e bonus del colore precedente.
2. Ultima carta completata, poi passaggio alla fase classica.
3. Jolly +4, scelta colore, selezione massima obbligatoria di quattro pezzi, resurrezione e chiusura tastiera della conferma nuova partita.
4. Matto salvato da Reset, un solo turno di emergenza, turno avversario successivo.
5. Avvio da tastiera e layout mobile.
6. Mazzo personalizzato con Reverse, rotazione, esercito/giocatore corretti, turno seguente e blocco Skip.

Screenshot reali: `screenshot-desktop.png`, `screenshot-mobile.png`, `screenshot-reverse.png`.

I test del dominio coprono inoltre rischio e distruzioni, bonus rosso/verde/giallo/blu, resurrezioni, Reset simultaneo e collisioni, vincoli del re, promozione, arrocco, opportunità en passant multiple, difesa preliminare e contro-scacco, emergenze ripetute, stallo, patte classiche, clock monotono, comandi invalidi e replay con clock. I test non sostituiscono un’omologazione arbitrale: il limite del valutatore per i rari casi di impossibilità di matto è esplicito in REGOLE.md.

## Verifiche aggiuntive Pocket

7. Layout iniziale 393×852 con due clock da 07:00 e azione principale nello schermo.
8. Ripresa di posizione, carta e pezzi usati dopo refresh.
9. Schermo 375×667 con movimento ridotto e scelta Jolly, senza overflow orizzontale.
10. Build standalone: manifest e icone, service worker attivo e riapertura con rete offline.

Cinque test unitari aggiuntivi verificano i 420.000 ms iniziali, il tempo escluso prima dell’avvio, la ripresa dopo 25 secondi, la scadenza a pagina chiusa e gli aggiustamenti negativi dell’orologio di sistema. L’anteprima `pocket-iphone.png` è stata acquisita con viewport 393×852, touch e modalità mobile emulati.

Non è stato usato un iPhone fisico né Safari reale; i test browser sono Chromium. La Home e il comportamento delle barre di sistema devono essere confermati sul dispositivo. La prova offline usa localhost, contesto sicuro: su iPhone tramite HTTP Wi-Fi il gioco richiede ancora il computer; per l’autonomia offline serve hosting HTTPS.

## Riproduzione

```sh
npm install
npm test
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

Il browser di test è stato installato nella cartella temporanea dell’ambiente di lavoro; non è incluso nel pacchetto e non serve per giocare. La build statica è inclusa in `dist/` e può essere servita senza dipendenze con `node scripts/serve.mjs`.

Il server della build è stato verificato in ambiente Linux. I launcher Windows sono inclusi; l’apertura del browser tramite `GIOCA.cmd` non è stata eseguita su Windows in questa sessione.


## Nuovi comandi e modalità

Ulteriori cinque percorsi browser verificano: homepage con sole tre voci, tutorial interattivo completo e preferenze salvate; +2 con selezione/deselezione di ologrammi e conferma automatica; popup colore e cornice blu per +4; turno del computer con ritorno a P1; animazione di rotazione Reverse e banner del giocatore.

Quattro test del computer verificano inattività prima/dopo la partita, scelte di colore e resurrezione massima, 180 comandi legali con invarianti e difesa preliminare. Il rating Elo del computer non è stato misurato. Le stanze private sono documentate, non attive.

L’anteprima di sviluppo usa polling dei file per rilevare correttamente le modifiche sul disco Windows. Test browser finali: tutti i 15 percorsi passati dopo il riavvio dell’anteprima aggiornata.
