> Historical Pocket notes. Superseded by [ARCHITECTURE.md](ARCHITECTURE.md).

# Architettura

## Flusso

`Comando + timestamp → dispatch → contabilizzazione clock → validazione → transizioni automatiche → invarianti → nuovo stato + eventi`.

`dispatch` non muta l’input. Un comando invalido restituisce un errore discriminato e lo stato con il solo tempo realmente trascorso. Il tempo non si può recuperare inviando mosse invalide. Il clock viene verificato prima della mossa, quindi un bonus verde non resuscita un clock già scaduto.

Il resolver procede direttamente fino alla prossima scelta. Le fasi intermedie sono esplicite nel codice, ma non producono animazioni o attese artificiali. Il turno si alterna tra identità P1/P2; la mappa di controllo dell’esercito è separata. La posizione e i diritti dei pezzi restano associati alle identità originali.

## Moduli

- `src/domain/types.ts`: stato serializzabile, comandi discriminati, errori, coordinate e identità.
- `src/domain/cards.ts`: mazzo 108 carte, shuffle Fisher–Yates, xorshift32, rischio e parser del laboratorio.
- `src/domain/policies.ts`: tabella rischio e moltiplicatori blu.
- `src/domain/turnResolver.ts`: turni, pesca, emergenze, carte e risoluzione delle mosse.
- `src/domain/rules.ts`: mosse consentite, fine facoltativa, Reset, resurrezione, evoluzione e invarianti.
- `src/domain/clock.ts`: contabilizzazione, bonus e risultati per tempo.
- `src/domain/events.ts`: fatti, checkpoint e replay.
- `src/domain/fixtures.ts`: scenari e costruttori per test.
- `src/engine/ChessEngineAdapter.ts`: interfaccia sostituibile.
- `src/engine/implementation.ts`: motore dedicato, attacchi, generazione legale, arrocco, promozione, en passant, chiavi di ripetizione e valutazione materiale.
- `src/ui/`: componenti React, pezzi SVG, CSS responsive. Non decide la legalità delle mosse.

## Budget e difesa

`budget` rappresenta le unità della carta numerica; `optionalSpecial` la mossa speciale disponibile; `yellow` le mosse bonus obbligatorie; `moveIndex` l’indice per il rischio. La difesa preliminare aggiorna `used`, `preDefense` e `specialConsumed`, senza incrementare `moveIndex` o ridurre il budget numerico pescato successivamente.

Entro le prime quattro mosse si consuma prima il budget numerico. Successivamente si consumano prima i bonus gialli, poi le mosse numeriche facoltative. Se sono presenti bonus gialli, `canEnd` è sempre falso. L’arrocco è una sola azione atomica a costo due durante UNO, e segna entrambi i pezzi come utilizzati.

## Clock

Il browser fornisce `performance.now()`. Il dominio riceve solo millisecondi monotoni; nessun import React, DOM, Date, timeout o interval. Il timer UI ogni 150 ms aggiorna la visualizzazione e invia il timestamp reale, senza accumulare decrementi fittizi. Quando una scheda torna attiva si contabilizza tutto il tempo trascorso. Reverse usa il residuo già contabilizzato e lo scambia atomicamente.

## Motore

Gli attacchi geometrici prescindono dai blocchi Skip. Le mosse volontarie filtrano i pezzi bloccati, poi simulano la posizione e verificano il proprio re. Il resolver aggiunge i vincoli di turno (pezzi utilizzati, costo, rischio del re). Questo consente più mosse dello stesso esercito senza aggirare un motore basato sull’alternanza classica.

Ogni opportunità en passant contiene identità del pedone, destinazione, esercito eleggibile e scadenza per turno. Più doppi passi nello stesso turno non si cancellano fra loro. Muovere o eliminare il pedone cancella la relativa opportunità.

Una FEN non è la fonte di verità: non conserva identità originali, trasformazioni, blocchi, resurrezioni o opportunità multiple.

La chiave di ripetizione include posizione, esercito al tratto, idoneità arrocco ed en passant effettivamente legale. Il contatore viene inizializzato all’ingresso nella fase classica.

## Eventi e replay

I fatti comprendono scelte, mosse, eliminazioni, probabilità, sorteggio, variazioni dei clock e transizioni. A ogni comando di gioco riuscito viene aggiunto un checkpoint dello stato senza la storia, evitando riferimenti ricorsivi. Gli aggiornamenti del solo tempo sono eventi leggeri `ClockAdvanced`.

`replay` ripristina l’ultimo checkpoint e gli aggiornamenti successivi del clock. Non riesegue un RNG e non dipende dall’orologio del dispositivo. Il formato è orientato alla ripresa deterministica della partita; non è una verifica crittografica di registri modificati da terzi.

## Verifiche

Vitest verifica il dominio e il motore, inclusi i conteggi perft iniziali 20 / 400 / 8902 e sequenze lunghe con invarianti. Playwright verifica interazioni reali, scelte e layout desktop/mobile. Non sono presenti test che richiedano server esterni.


## Pocket / iPhone

Timer iniziale 420.000 ms. `ui/persistence.ts` salva localmente con timestamp assoluto; a riapertura ribasa la sorgente monotona e passa il tempo trascorso a `dispatch`. Il salvataggio è best-effort, con fallback all’esportazione manuale. Le animazioni React/CSS leggono gli eventi già risolti e non ritardano il resolver. Le rimontature animate dipendono da identità/casella o carta/turno, non dai tick del clock.

`public/manifest.webmanifest`, icone PNG/SVG, metadati Apple e `public/sw.js` compongono la shell installabile. Il service worker si registra solo in produzione e in contesti sicuri. Precarica HTML, JS, CSS e icone: rete prima per navigazioni, cache per risorse versionate. Nessuna attivazione forzata mentre una partita è aperta. Per una futura release della shell incrementare il nome CACHE.

`scripts/serve.mjs --lan` permette una prova dal telefono sulla rete privata; il comportamento di default resta limitato al computer locale. Non vengono modificati firewall o impostazioni di sistema.


## Menu, bot e controllo diretto

`ui/Shell.tsx` gestisce home, scelta modalità, impostazioni, tutorial e tavolo. Preferenze e modalità sono indipendenti dallo stato scacchistico. `domain/computer.ts` genera comandi legali senza ricerca profonda né dipendenze UI. Il tavolo esegue un comando del bot ogni 480 ms durante il turno di P2, compresi colore, bersagli, resurrezione ed evoluzione. I timer del bot sono annullati su cambio fase/turno e smontaggio del tavolo; i tick del clock non li riavviano. L’input umano è rifiutato durante il turno del computer.

Gli ologrammi derivano da `availableResurrections`, dunque non propongono case occupate o pezzi di un altro esercito. Il popup colore è obbligatorio e mantiene il clock in esecuzione. Il banner del turno dipende dall’identità del giocatore; animazioni di rotazione e contro-rotazione durano 420 ms e non alterano le coordinate del motore. `online/protocol.ts` è soltanto un contratto progettuale: il backend online non esiste ancora.
