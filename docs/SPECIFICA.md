Implementa da zero un prototipo web locale giocabile di “Scacchi + UNO”, per due persone sullo stesso dispositivo.

Voglio un’app funzionante, con codice TypeScript ordinato, motore di regole indipendente dalla UI e test significativi. Non fermarti a un piano o a una schermata dimostrativa: completa implementazione, verifica e istruzioni di avvio.

## 1. Obiettivo e stack

Usa:

- TypeScript con controlli strict.
- React e Vite per l’interfaccia.
- CSS semplice e responsive.
- Vitest per i test del dominio.
- Test dell’interfaccia e un percorso end-to-end essenziale, se supportati dall’ambiente.

Nessun backend, account, multiplayer online o intelligenza artificiale nel primo prototipo.

La partita si gioca localmente, alternando due giocatori identificati stabilmente come P1 e P2. Il colore dell’esercito controllato può cambiare durante la partita.

L’interfaccia deve essere in italiano.

## 2. Priorità delle regole

Questa specifica consolidata prevale su qualsiasi interpretazione precedente.

In particolare:

1. Sotto scacco semplice, si difende il re PRIMA di pescare.
2. La difesa iniziale non sottrae mosse alla carta numerica successiva.
3. La difesa iniziale consuma invece la singola mossa standard/facoltativa associata a una carta speciale successiva.
4. Durante la difesa rimane attivo il colore UNO precedente, anche se era stato pescato dall’avversario.
5. Sotto scacco matto, non essendo possibile difendersi prima, si pesca una carta d’emergenza: questa costituisce il turno completo.
6. Reverse cambia immediatamente controllo degli eserciti, tempi residui e orientamento della scacchiera.

Non applicare le normali regole UNO di mani, corrispondenza tra carte, accumulo +2/+4 o salto del giocatore: qui ogni carta ha gli effetti scacchistici descritti sotto.

## 3. Partita e mazzo

Posizione iniziale degli scacchi tradizionali. P1 controlla inizialmente il bianco e comincia; P2 controlla il nero.

Clock iniziale: 5+0, cioè 300 secondi ciascuno e nessun incremento ordinario.

Usa il mazzo UNO classico da 108 carte:

- Per ognuno dei quattro colori: uno 0, due copie di ciascun numero da 1 a 9, due Skip, due Reverse, due +2.
- Quattro Jolly evoluzione.
- Quattro Jolly +4.

Mescola una volta all’avvio usando un generatore casuale iniettabile e riproducibile tramite seed.

Non distribuire mani. Si pesca automaticamente dal mazzo comune. Ogni carta pescata è subito visibile a entrambi. Le carte risolte vanno negli scarti, che non vengono rimescolati.

Distingui sempre:

- Colore dell’esercito: bianco o nero.
- Colore UNO: rosso, verde, blu o giallo.
- Identità del giocatore: P1 o P2.

## 4. Turno normale

Sequenza:

1. Attiva il clock del giocatore.
2. Pesca e rivela automaticamente una carta.
3. Aggiorna il colore UNO attivo; per un Jolly attendi la scelta del colore.
4. Applica l’effetto principale, raccogliendo eventuali scelte.
5. Risolvi le mosse concesse e gli eventuali bonus.
6. Passa il turno all’altro giocatore.

Gli effetti delle carte precedono le mosse.

Il clock continua durante pesca, scelte, effetti, promozioni e mosse.

Mettere sotto scacco il re avversario termina il turno corrente, facendo perdere le mosse residue. Valuta lo scacco sulla posizione risultante dopo la completa risoluzione atomica della mossa, incluso il rischio di distruzione.

## 5. Carte numeriche da 1 a 9

Una carta N concede fino a N mosse con pezzi distinti.

- Carta 1: una mossa.
- Carta 2: due mosse.
- Carta 3: tre mosse.
- Carta 4: quattro mosse.
- Carte da 5 a 9: prime quattro mosse obbligatorie, successive facoltative e rischiose.

Le mosse previste entro le prime quattro sono obbligatorie quando legalmente possibili, anche se strategicamente svantaggiose.

Ogni pezzo può essere mosso al massimo una volta nello stesso turno. Usa l’identità permanente del pezzo, non la casella o il tipo attuale.

Se non esistono altre mosse legali con pezzi distinti disponibili, termina il turno senza penalità. Questo vale anche se la disponibilità è ridotta da Skip.

Non richiedere al giocatore di ottimizzare anticipatamente la sequenza per massimizzare il numero di mosse: rivaluta la disponibilità dopo ogni azione.

Prima di una mossa numerica facoltativa rischiosa, permetti di terminare il turno.

### Rischio di distruzione

Il rischio dipende dall’indice della mossa nella sequenza della carta, includendo le mosse bonus gialle:

| Indice | Rischio |
|---|---:|
| 1–4 | 0% |
| 5 | 20% |
| 6 | 40% |
| 7 | 60% |
| 8 | 80% |
| 9 e successive | 99% |

La mossa viene completata prima del sorteggio.

In caso di cattura, il bersaglio viene eliminato comunque. Se si attiva il rischio, anche l’attaccante viene distrutto sulla casella di arrivo.

Se il pezzo mosso viene distrutto, il turno termina e si perdono tutte le mosse residue, comprese quelle bonus gialle.

Il re non può essere utilizzato dalla quinta mossa della sequenza in poi, anche se una modifica del rischio riducesse la probabilità.

Registra probabilità, valore casuale ed esito nel log.

## 6. Effetti dei colori UNO

Il colore aggiunge un effetto secondario alla carta principale, anche sulle mosse facoltative delle carte speciali.

### Rosso

Ogni mossa completata sottrae 3 secondi all’avversario.

Il bonus vale anche quando l’attaccante viene successivamente distrutto dal rischio.

Può portare l’avversario a zero durante il turno corrente e causare immediatamente la conclusione per tempo, con le eccezioni scacchistiche per impossibilità di dare matto.

### Verde

Ogni mossa completata aggiunge 3 secondi al giocatore attivo.

Vale anche se il pezzo viene distrutto dal rischio.

Se il tempo è già arrivato a zero prima del completamento della mossa, la partita termina e il bonus non può salvarlo.

### Blu

Assunzione esplicita del prototipo: il blu dimezza il rischio della quinta e della sesta mossa, portandolo rispettivamente al 10% e al 20%. Dalla settima in poi resta la tabella ordinaria.

La conversazione conferma il dimezzamento per le mosse 5 e 6, ma il collegamento al blu non è recuperabile esplicitamente. Isola questa regola nella configurazione e documentala come assunzione.

### Giallo

Ogni cattura genera una mossa aggiuntiva obbligatoria con un pezzo diverso da quelli già utilizzati nel turno.

Le mosse bonus possono generare altre mosse bonus tramite catture.

- Nessun limite artificiale a nove mosse.
- Dalla nona mossa in poi il rischio resta al 99%.
- Le mosse bonus sono obbligatorie anche ad alto rischio.
- Se non esistono pezzi distinti con mosse legali, la catena termina senza penalità.
- Se resta solo il re e la prossima mossa è dalla quinta in poi, la catena termina.
- En passant e cattura con promozione generano il bonus.
- Il pezzo promosso mantiene la stessa identità ed è già utilizzato.
- Se l’attaccante viene distrutto, il turno termina e il bonus viene perso.
- Dare scacco termina comunque il turno.
- Le carte speciali gialle e Reverse giallo possono attivare le catene tramite le successive mosse.

Tieni separati il budget numerico, la mossa facoltativa speciale e i bonus gialli obbligatori: il pulsante per passare non deve consentire di saltare un bonus obbligatorio.

## 7. Scacco semplice: difesa prima della pescata

Se il giocatore comincia sotto scacco ma esiste una difesa legale:

1. Non pescare ancora.
2. Mantieni il colore UNO attivo precedente.
3. Obbliga a una mossa legale che elimini lo scacco.
4. Applica il bonus del colore precedente alla difesa.
5. Solo dopo la difesa, pesca automaticamente.
6. Cambia colore.
7. Applica gli effetti della carta pescata.
8. Risolvi il resto del turno.

La difesa:

- Non consuma le mosse numeriche della carta successiva.
- Non aumenta l’indice di rischio della sequenza successiva.
- Consuma la singola mossa standard/facoltativa successiva delle carte speciali, incluso il fallback di una carta inutilizzabile.
- Non impedisce di applicare l’effetto principale della carta speciale pescata.

Esempi:

- Difesa, poi 4 rosso: quattro mosse numeriche disponibili con pezzi distinti.
- Difesa, poi Skip: scegli il bersaglio e applica il blocco, ma non ricevi un’altra mossa standard.
- Difesa, poi +2: resuscita i pezzi previsti, ma la mossa facoltativa è già consumata.
- Difesa con colore rosso precedente: sottrai 3 secondi all’avversario, poi applica il nuovo colore soltanto dopo la pescata.

Per i dettagli non esplicitamente risolti, usa e documenta queste assunzioni:

- Il pezzo della difesa è già utilizzato nel turno e non può essere mosso di nuovo nella sequenza numerica successiva.
- Un eventuale bonus giallo generato dalla cattura difensiva viene accodato dopo la pescata; non ritarda la pescata e non la duplica. Le mosse successive usano il nuovo colore.
- Se la difesa dà contro-scacco, termina il turno prima della pescata, applicando la regola generale di fine turno per scacco.

Se una carta speciale pescata dopo la difesa espone nuovamente il proprio re, non assegnare silenziosamente una seconda mossa standard: applica le regole di sicurezza usando solo le risorse ancora disponibili e documenta questo caso limite.

## 8. Scacco matto e pescata d’emergenza

Durante la fase UNO, uno scacco matto non conclude subito la partita se il mazzo contiene ancora carte.

Sequenza:

1. Attiva o mantieni il clock del giocatore minacciato.
2. Pesca esattamente una carta d’emergenza.
3. Cambia colore, o chiedilo per un Jolly.
4. Applica tutti gli effetti della carta.
5. Rivaluta la posizione.
6. Se ora esiste una difesa legale ed è necessaria, la prima mossa deve eliminare lo scacco.
7. Se il salvataggio riesce, completa le eventuali mosse residue secondo la carta.
8. Poi passa il turno.

La carta d’emergenza costituisce il turno completo: non si pesca un’altra carta normale dopo il salvataggio.

Qui non è stata eseguita la difesa preliminare dello scacco semplice: una difesa resa possibile dall’effetto usa le mosse della carta d’emergenza.

- Se l’effetto lascia il giocatore ancora senza difesa legale, perde.
- Non continuare a pescare carte per lo stesso scacco matto irrisolto.
- Ogni nuovo scacco matto successivo consente un nuovo tentativo, finché restano carte.
- Una carta numerica non consente mosse illegali per “uscire gradualmente” dal matto.
- Skip non elimina gli attacchi del pezzo bloccato.
- Se il mazzo è vuoto, il matto è definitivo.
- Se l’ultima carta produce matto all’avversario, non esiste un’altra carta di salvataggio.
- Se l’ultima carta salva il giocatore, completa comunque tutte le mosse residue prima del passaggio agli scacchi tradizionali.

Eccezione: un matto autoinflitto da resurrezione +2/+4 o da Reset causa sconfitta immediata, senza un’altra pescata d’emergenza.

## 9. Carta 0: Reset

Lo 0 è un effetto speciale, seguito normalmente da una mossa facoltativa.

Riporta alle proprie caselle iniziali tutti i pezzi ancora in gioco di entrambi gli eserciti, eccetto i pedoni ancora di tipo pedone.

- Non resuscita pezzi eliminati.
- Include entrambi i re.
- I pedoni evoluti o promossi tornano alla casella iniziale del pedone originale mantenendo il tipo acquisito, inclusa la donna.
- Prima libera simultaneamente tutte le caselle dei pezzi coinvolti.
- Poi determina le destinazioni e risolve i conflitti, senza dipendere dall’ordine di iterazione.
- Un occupante rimasto su una destinazione viene distrutto.
- Nel caso specifico di conflitto sulla casella iniziale di un pedone evoluto/promosso, vengono distrutti entrambi i pezzi.
- Il re non può essere distrutto: in un eventuale conflitto che lo coinvolge, distruggi l’altro pezzo.
- I blocchi Skip seguono i pezzi e non vengono cancellati.
- Ripristina i diritti di arrocco quando re e torre tornano alle rispettive caselle iniziali e sono presenti.
- Non permettere arrocco nella singola mossa facoltativa successiva, perché durante UNO richiede due mosse.

Dopo il Reset:

- Se il proprio re è sotto scacco, la mossa disponibile diventa difensiva obbligatoria.
- Se non esiste difesa, sconfitta immediata.
- Se dà scacco all’avversario, termina il turno senza mossa facoltativa.

## 10. Skip

Scegli un pezzo avversario diverso dal re e bloccalo.

Il re è immune.

Il blocco:

- Impedisce movimenti volontari e catture.
- Non rimuove gli attacchi del pezzo.
- Impedisce alla torre di partecipare all’arrocco.
- Impedisce al pedone di avanzare e promuovere normalmente.
- È associato all’identità del pezzo e segue Reset, trasformazioni e Reverse.
- Scade al termine del prossimo turno in cui quel pezzo è controllato dal giocatore di turno, anche se Reverse ne cambia il controllore.
- Può essere rinnovato su un pezzo già bloccato, senza accumulare durate.
- Scompare quando il pezzo viene eliminato; la resurrezione non lo ripristina.

Dopo l’effetto è disponibile una mossa facoltativa, salvo che sia già stata consumata dalla difesa iniziale.

## 11. Reverse

Applica subito:

1. Scambio degli eserciti controllati da P1 e P2.
2. Scambio dei rispettivi tempi residui.
3. Rotazione visiva della scacchiera di 180°.

Non cambiare coordinate reali, colori dei pezzi, direzione dei pedoni, identità o caselle iniziali.

I diritti di arrocco restano associati all’esercito e ai pezzi.

Il colore UNO è quello del Reverse appena pescato.

Il giocatore attivo continua con il nuovo esercito e usa immediatamente il tempo ricevuto. Di norma dispone di una mossa facoltativa, se non già consumata dalla difesa preliminare.

Poi i giocatori continuano ad alternarsi per identità, indipendentemente dal colore degli eserciti.

Gestisci immediatamente le conseguenze dello scambio:

- Se il nuovo esercito del giocatore attivo è sotto scacco semplice, la mossa disponibile deve difendere il re.
- Se è sotto matto, applica il tentativo d’emergenza se ci sono carte.
- Se l’esercito trasferito all’avversario è sotto scacco, interrompi il turno corrente e avvia quello del nuovo controllore per difendersi prima di pescare.
- Se l’esercito trasferito all’avversario è sotto matto, avvia immediatamente il suo tentativo d’emergenza.
- Non fare doppie pescate o doppi cambi turno.

Le mosse effettuate in turni precedenti non limitano i pezzi nel turno corrente.

Registra lo scambio nel log in modo comprensibile.

## 12. +2 e Jolly +4: resurrezione

Resuscita rispettivamente fino a due o quattro pezzi eliminati del proprio esercito, escluso il re.

Sono eleggibili anche:

- Pedoni.
- Pezzi catturati.
- Pezzi distrutti dal rischio.
- Pezzi distrutti dagli effetti UNO.

Ogni pezzo torna alla propria casella iniziale soltanto se libera. Nessuna cattura dell’occupante.

È obbligatorio resuscitare il maggior numero possibile fino al limite della carta. Il giocatore sceglie la combinazione tra quelle che raggiungono tale massimo.

- Un pedone evoluto/promosso torna come normale pedone.
- Un pedone sulla casella iniziale recupera il doppio passo alle normali condizioni.
- Una torre resuscitata recupera l’idoneità all’arrocco, purché anche il re sia idoneo.
- I vecchi blocchi Skip non ricompaiono.
- Un pezzo resuscitato può essere mosso subito nella mossa facoltativa successiva.

Il +4 richiede anche la scelta del colore UNO.

Dopo la resurrezione:

- Se il proprio re è sotto scacco, la mossa disponibile diventa difensiva obbligatoria.
- Se non c’è difesa legale, sconfitta immediata senza pescata d’emergenza.
- È consentito scegliere una combinazione che esponga il proprio re: non filtrarla preventivamente come illegale.
- Se dà scacco al re avversario, termina il turno senza mossa facoltativa.

## 13. Jolly evoluzione

Scegli un colore UNO e trasforma un proprio pedone attualmente in gioco, sulla stessa casella, in:

- Torre.
- Alfiere.
- Cavallo.

Non può diventare donna o re.

Il pezzo mantiene identità e casella iniziale del pedone originale.

Può trasformare un pedone bloccato, mantenendone il blocco.

- Se la trasformazione espone il proprio re, la mossa disponibile diventa difensiva obbligatoria.
- Se non esiste una difesa legale disponibile, quella trasformazione è vietata.
- Se dà scacco al re avversario, termina il turno senza mossa facoltativa.
- Altrimenti segue una mossa facoltativa, se disponibile.

La promozione scacchistica ordinaria rimane separata e permette anche la donna.

## 14. Carte inutilizzabili

Regola generale consolidata: se l’effetto principale non può essere applicato, scarta la carta e conserva una mossa standard con il bonus del suo colore.

Esempi:

- Skip senza bersagli.
- Jolly evoluzione senza pedoni trasformabili.
- +2/+4 senza pezzi eliminati.
- +2/+4 con tutte le caselle iniziali occupate.

Questa regola sostituisce le vecchie interpretazioni che facevano terminare il turno senza mossa.

Il fallback non assegna una seconda mossa se la difesa preliminare l’ha già consumata.

I bonus colore restano attivi anche quando una carta numerica può essere eseguita soltanto parzialmente.

Assunzione del prototipo: la mossa fallback è facoltativa, come la mossa delle carte speciali, salvo obbligo di difendere il re.

## 15. Regole scacchistiche adattate

Mantieni movimento dei pezzi, attacchi, inchiodature, sicurezza del re, promozione, arrocco ed en passant.

Nessuna mossa ordinaria può lasciare il proprio re sotto scacco.

Le modifiche dirette prodotte dalle carte possono creare temporaneamente scacco e richiedono le verifiche descritte.

### Arrocco

Durante UNO:

- È atomico.
- Consuma due mosse UNO.
- Segna re e torre come utilizzati.
- Richiede almeno due mosse spendibili disponibili.
- Rispetta tutte le condizioni scacchistiche e i blocchi.
- Non è disponibile dopo un effetto speciale che concede una sola mossa.

Assunzione: durante UNO consenti arrocco soltanto quando entrambe le unità consumate appartengono alle prime quattro mosse sicure; evita un arrocco parzialmente rischioso.

Negli scacchi tradizionali torna a consumare una normale mossa.

### En passant

Il diritto rimane disponibile nel turno successivo dell’avversario anche se, dopo il doppio passo, sono state eseguite altre mosse nello stesso turno UNO.

Non farlo scadere alla successiva sotto-mossa dello stesso giocatore.

Rappresenta esplicitamente eventuali più pedoni eleggibili generati da doppi passi nello stesso turno, invece di affidarti a un solo campo FEN. Documenta questa estensione come scelta implementativa.

### Conseguenze del rischio

Assunzione necessaria: se la distruzione casuale espone il proprio re, termina il turno e assegna una sconfitta immediata per esposizione del re; non lasciare una posizione illegale continuabile e non concedere una pescata d’emergenza al giocatore che si è esposto.

Isola questa policy e documentala.

Per effetti che eccezionalmente minacciano entrambi i re, valuta prima la sicurezza del re attivo e la possibilità di difenderlo, evitando una vittoria ottenuta lasciando irrisolto il proprio scacco.

## 16. Stallo, patte e fine mazzo

Durante UNO:

- Disabilita triplice ripetizione.
- Disabilita regola delle 50 mosse.
- In stallo con carte disponibili, pesca una carta per tentare di sbloccare la posizione.
- La carta di sblocco costituisce il turno: nessuna seconda pesca normale.
- Se il tentativo non sblocca la posizione, patta.
- Non confondere stallo reale con esaurimento dei pezzi utilizzabili nella sequenza corrente.

Assunzione: non dichiarare automaticamente patta per semplice insufficienza di materiale durante UNO, perché resurrezioni ed evoluzioni possono cambiare il materiale.

Quando viene pescata l’ultima carta:

- Segna che il passaggio alla fase classica è pendente.
- Completa tutti gli effetti, mosse e bonus della carta.
- Non disattivare subito i colori o le catene.
- Il mazzo vuoto impedisce comunque nuove pescate d’emergenza.

Solo alla fine di quel turno:

- Passa agli scacchi tradizionali.
- Annulla colori UNO, blocchi Skip e altri effetti temporanei.
- Conserva posizione, trasformazioni, pezzi eliminati, tempi residui e controllo degli eserciti risultante dai Reverse.
- Una mossa per turno.
- Ripetizioni contate da questo momento.
- Contatore delle 50 mosse azzerato.
- Normale gestione di matto, stallo e patte.

La caduta della bandierina vale in entrambe le fasi con le eccezioni per impossibilità di dare matto tramite qualsiasi sequenza legale. Non equiparare automaticamente questo criterio a un semplice conteggio del materiale: rendi il valutatore sostituibile e dichiara eventuali limiti del prototipo.

## 17. Architettura TypeScript

Separa almeno:

- `domain/types`
- `domain/cards`
- `domain/rules`
- `domain/turnResolver`
- `domain/events`
- `domain/clock`
- `engine/ChessEngineAdapter`
- `engine/implementation`
- `ui`
- `tests`

Il dominio non deve importare React, DOM o timer del browser.

Usa funzioni pure, tipi discriminati ed errori tipizzati. Evita logica di gioco distribuita tra componenti o effetti React.

### Stato

Rappresenta esplicitamente:

- Identità dei giocatori.
- Mappa giocatore → esercito.
- Posizione e identità permanenti dei pezzi.
- Tipo originale e attuale.
- Casella iniziale e attuale.
- Stato in gioco/eliminato e causa dell’eliminazione.
- Diritti di arrocco.
- Opportunità en passant e scadenze per turno.
- Mazzo, indice di pesca e scarti.
- Seed/stato RNG.
- Colore UNO attivo.
- Carta corrente.
- Modalità UNO/classica e transizione pendente.
- Giocatore attivo e identificatore del turno.
- Fase del resolver.
- Pezzi utilizzati nel turno.
- Difesa preliminare eseguita.
- Mossa speciale già consumata.
- Budget numerico e indice di rischio.
- Bonus gialli pendenti.
- Blocchi Skip e loro scadenza.
- Clock.
- Esito e motivazione.
- Log degli eventi.

Mantieni lo stato serializzabile.

### Comandi ed eventi

Distingui le intenzioni dai fatti avvenuti.

Comandi indicativi:

- StartGame
- SubmitMove
- ChooseUnoColor
- ChooseSkipTarget
- ChooseResurrections
- ChooseEvolution
- ChoosePromotion
- EndOptionalMoves
- AdvanceTime
- RestartGame

Eventi indicativi:

- TurnStarted
- DefenseRequired
- MoveCompleted
- CardDrawn
- UnoColorChanged
- PieceBlocked
- PieceResurrected
- PieceTransformed
- ResetApplied
- ArmiesSwapped
- ClocksSwapped
- RiskResolved
- PieceDestroyed
- ClockAdjusted
- EmergencyDrawStarted
- TurnEnded
- ClassicalPhaseStarted
- GameEnded

Ogni evento deve contenere i dati necessari al replay, comprese le decisioni casuali. Il replay non deve risorteggiare.

### Turn resolver

Implementa una macchina a stati esplicita con fasi come:

- TURN_START
- PRE_DRAW_DEFENSE
- DRAW
- CHOOSE_COLOR
- RESOLVE_EFFECT
- CHOOSE_TARGETS
- RESOLVE_MOVES
- EMERGENCY_DRAW
- STALEMATE_RESCUE
- TURN_END
- GAME_OVER

Le transizioni automatiche devono procedere fino alla prossima scelta dell’utente o alla conclusione.

Rendi disponibile una funzione per ricavare le azioni consentite dallo stato. UI e resolver devono usare la stessa fonte di verità.

Impedisci:

- Doppie pescate.
- Doppie risoluzioni.
- Comandi fuori fase.
- Turni duplicati.
- Riutilizzo dello stesso pezzo.
- Passaggio quando restano azioni obbligatorie.
- Elaborazione di azioni dopo la fine partita.

## 18. Chess engine adattabile

Definisci un’interfaccia che supporti:

- Generazione di mosse legali per un esercito scelto esplicitamente.
- Calcolo degli attacchi indipendente dai blocchi Skip.
- Scacco, matto e stallo.
- Mosse consecutive dello stesso esercito.
- Modifiche dirette della posizione.
- Promozioni e identità permanenti.
- Arrocco e diritti modificabili.
- En passant con durata per turno UNO.
- Valutazione delle condizioni di patta e timeout.

Puoi usare una libreria esistente dietro l’adapter, dopo averne verificato API e limiti. Non affidarti alla sua alternanza automatica dei colori o al suo game-over per governare la variante.

La posizione del dominio è la fonte autorevole; una semplice FEN non conserva tutte le informazioni necessarie.

Se la libreria non supporta le modifiche in sicurezza, estendi o implementa la parte necessaria, mantenendo l’interfaccia sostituibile.

## 19. Clock

Usa una sorgente di tempo monotona iniettabile.

- Calcola il tempo da timestamp, senza sottrarre un secondo a ogni intervallo.
- Il timer della UI serve a ridisegnare, non è la fonte autorevole.
- Prima di ogni comando, contabilizza il tempo trascorso.
- Controlla lo zero prima di applicare una mossa o il bonus verde.
- Durante Reverse contabilizza prima il tempo, poi scambia i residui atomicamente e continua con il tempo ricevuto.
- Il clock scorre durante tutte le scelte e le emergenze.
- Blocca immediatamente le interazioni a partita conclusa.
- Nei test usa un fake clock: nessuna attesa reale.

## 20. UI minimale

Mostra:

- Scacchiera 8×8 con coordinate e pezzi leggibili.
- Selezione origine/destinazione e mosse consentite evidenziate.
- Identità del giocatore attivo ed esercito controllato.
- Due clock.
- Carta corrente e spiegazione dell’effetto.
- Colore UNO attivo.
- Carte rimaste e scarti.
- Mosse obbligatorie, facoltative e bonus ancora disponibili.
- Probabilità della prossima mossa.
- Pezzi già utilizzati.
- Blocchi Skip visibili.
- Pannello per colore, bersagli, resurrezione, evoluzione e promozione.
- Pulsante “Termina turno” soltanto quando consentito.
- Stato di scacco, emergenza e fase classica.
- Log leggibile.
- Esito finale con motivo.
- Nuova partita e riavvio.

Non usare solo il colore per comunicare informazioni: aggiungi testo o simboli.

Reverse deve ruotare la visualizzazione senza cambiare le coordinate reali.

Aggiungi strumenti di sviluppo separati dalla normale partita per caricare fixture, impostare un mazzo noto e usare seed riproducibili.

## 21. Test richiesti

Copri con fixture piccole e deterministiche:

1. Frequenze e totale del mazzo.
2. Shuffle riproducibile.
3. Carte 1–4 e pezzi distinti.
4. Obbligo delle prime quattro mosse.
5. Passaggio sulle mosse numeriche rischiose.
6. Tabella del rischio e modifica blu.
7. Cattura prima della distruzione.
8. Fine turno su distruzione.
9. Divieto del re dalla quinta mossa.
10. Bonus rosso/verde anche con distruzione.
11. Timeout prima del verde.
12. Rosso che azzera il clock avversario.
13. Catene gialle obbligatorie e oltre nove mosse.
14. Giallo su en passant e promozione.
15. Fine catena per pezzi esauriti, scacco o distruzione.
16. Difesa prima della pescata e colore precedente.
17. Difesa che non riduce il budget numerico.
18. Difesa che consuma la mossa speciale/fallback.
19. Una sola carta d’emergenza per lo stesso matto.
20. Emergenza come turno completo.
21. Ultima carta, salvataggio e mosse residue.
22. Nessuna emergenza a mazzo vuoto.
23. Skip: attacchi conservati, re immune, durata, rinnovo e Reverse.
24. Skip persistente dopo Reset/evoluzione e rimosso dopo eliminazione.
25. Reverse: eserciti, tempi, orientamento e turno corretto.
26. Reverse che trasferisce scacco o matto.
27. Resurrezione massima obbligatoria e caselle occupate.
28. Resurrezione di pedoni evoluti come pedoni normali.
29. Recupero del doppio passo e idoneità della torre.
30. Matto autoinflitto senza emergenza.
31. Evoluzione vietata quando non esiste difesa.
32. Fallback delle carte inutilizzabili.
33. Reset simultaneo, collisioni, pedoni esclusi e promossi inclusi.
34. Arrocco a costo due durante UNO e costo uno nella fase classica.
35. En passant conservato tra sotto-mosse.
36. Stallo e tentativo di sblocco.
37. Completamento dell’ultima carta prima della fase classica.
38. Annullamento dei temporanei, conservazione di eserciti e posizione.
39. Azzeramento dei contatori di patta all’ingresso nella fase classica.
40. Rifiuto dei comandi fuori fase e dopo game-over.
41. Replay deterministico con clock e casualità registrati.

Aggiungi invarianti verificabili: nessun doppio occupante, identità uniche, nessun re distrutto, nessuna resurrezione duplicata, clock non negativi e nessuna azione accettata dopo la conclusione.

## 22. Metodo di lavoro e consegna

Procedi autonomamente con le scelte tecniche ordinarie.

Prima consolida le regole in un documento locale, evidenziando le assunzioni già indicate. Non presentare queste assunzioni come decisioni precedentemente confermate.

Poi implementa dominio, adapter, resolver, clock e UI. Esegui test, controllo TypeScript e build; correggi i problemi trovati.

Consegna:

- Prototipo giocabile completo.
- Codice organizzato.
- Test eseguibili.
- README con installazione e avvio locale.
- Documento delle regole.
- Elenco breve delle assunzioni e degli eventuali limiti effettivi.
- Riepilogo finale con comandi di avvio e verifiche eseguite.

Non sostituire meccaniche richieste con simulazioni visive. Se incontri un’ambiguità ulteriore, rendila una policy esplicita e testabile, scegli il comportamento più coerente con questa specifica e documentalo.