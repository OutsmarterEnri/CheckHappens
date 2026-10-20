# Regole effettive del prototipo

La specifica integrale ricevuta è conservata in [SPECIFICA.md](SPECIFICA.md). Questo documento riassume l’implementazione e distingue le assunzioni dalle regole confermate.

## Base e turno

Due giocatori locali P1 e P2; P1 parte col bianco. Clock 420 secondi ciascuno (7+0, ultimo aggiornamento richiesto il 20 ottobre 2026), senza incremento ordinario. Il mazzo normale contiene 108 carte UNO classiche: per colore uno 0, due 1–9, due Skip, due Reverse, due +2; quattro Jolly evoluzione e quattro Jolly +4. Non esistono mani, compatibilità tra carte, stacking o rimescolamento degli scarti.

Turno normale: clock attivo → pesca automatica visibile → nuovo colore/scelta Jolly → effetto → mosse → avversario. Dare scacco, dopo la risoluzione atomica completa, interrompe il turno.

## Numeri, rischio e colori

Una carta N concede N mosse con pezzi distinti. Entro le prime quattro sono obbligatorie; dalla quinta sono facoltative, salvo bonus gialli. Se non rimangono mosse legali con altri pezzi disponibili, il turno finisce senza penalità. Non si ricerca preventivamente una sequenza ottimale.

Rischio per indice della mossa: 1–4 0%, 5 20%, 6 40%, 7 60%, 8 80%, 9+ 99%. Il re non può essere mosso dal quinto indice in poi. Prima si completa la mossa e la cattura, poi si sorteggia la distruzione dell’attaccante. Se distrutto, il turno termina e perde i bonus residui. Il log conserva probabilità, sorteggio ed esito.

- Rosso: ogni mossa completata sottrae 3 secondi all’avversario; può farlo perdere subito.
- Verde: ogni mossa completata aggiunge 3 secondi al giocatore. Non salva un tempo già scaduto prima del completamento.
- Blu: quinto e sesto rischio dimezzati (10% e 20%); assunzione dichiarata sotto.
- Giallo: ogni cattura aggiunge una mossa obbligatoria, con altro pezzo. Le catene possono superare nove mosse; rischio 99% dalla nona. En passant e cattura con promozione contano. Distruzione dell’attaccante, scacco avversario o assenza di pezzi disponibili interrompono la catena. Il re non è utilizzabile da quinto indice in poi.

Rosso e verde valgono anche se il pezzo è distrutto dopo la mossa. Il colore vale anche sulla mossa di una carta speciale, sui fallback e sulle esecuzioni parziali di carte numeriche.

## Scacco semplice

Prima della pesca si deve difendere il re con una mossa legale, conservando il colore precedente anche se pescato dall’avversario. Dopo la difesa si pesca, si aggiorna il colore e si applica la carta.

La difesa non riduce il budget della successiva carta numerica e non incrementa l’indice di rischio. Consuma la singola mossa standard/facoltativa di una speciale o di un fallback; l’effetto principale resta applicabile. Un nuovo scacco al proprio re dopo un effetto può usare solo le risorse residue: nessuna seconda mossa standard viene regalata.

## Matto e stallo

Con carte ancora disponibili, il matto offre una sola pescata d’emergenza: nuovo colore → effetto completo → rivalutazione → eventuale difesa legale → resto delle mosse. Costituisce il turno intero, senza nuova pescata normale. Non si pesca ripetutamente per lo stesso matto irrisolto. Nuovi matti successivi danno nuovi tentativi finché ci sono carte.

Matto a mazzo vuoto: sconfitta definitiva. +2/+4 e Reset che lasciano il proprio re senza difesa: sconfitta immediata senza nuova emergenza. Una trasformazione Jolly senza difesa disponibile è invece vietata.

Stallo reale con carte disponibili: una carta di sblocco, che costituisce il turno; se non sblocca, patta. Esaurire i pezzi utilizzabili nella sequenza corrente non è stallo. Se un tentativo di salvataggio elimina il matto ma lascia uno stallo reale, il risultato è patta.

## Speciali

Tutte le speciali concedono normalmente una mossa facoltativa dopo l’effetto, a meno che sia consumata dalla difesa preliminare. Se bisogna difendere il proprio re, diventa obbligatoria. Se l’effetto dà scacco all’avversario, il turno termina senza mossa aggiuntiva.

### 0 / Reset

Tutti i pezzi in gioco di entrambi gli eserciti tornano alle proprie origini, eccetto i pezzi ancora di tipo pedone. Nessuna resurrezione. Entrambi i re tornano a casa. Pedoni evoluti/promossi tornano alla casa originale del pedone mantenendo il tipo attuale, anche donna.

Si liberano simultaneamente tutte le caselle dei pezzi coinvolti, poi si risolvono le destinazioni. Un occupante non coinvolto viene distrutto; sulla destinazione di un pedone evoluto/promosso muoiono entrambi. Il re è immune alla distruzione: prevale su eventuali altri pezzi in conflitto. Le identità originali assegnano destinazioni uniche; la simultaneità evita collisioni false tra pezzi che stanno tornando a casa.

Reset conserva Skip e ripristina l’idoneità arrocco di re e torri tornati a casa. Niente arrocco nell’unica mossa facoltativa successiva.

### Skip

Blocca un pezzo avversario, mai il re. Non può muoversi/catturare, ma continua ad attaccare. Una torre bloccata non arrocca; un pedone bloccato non avanza né promuove tramite movimento.

Il blocco segue l’identità anche dopo Reverse, Reset o evoluzione; scade alla fine del prossimo turno del suo controllore, anche se cambiato con Reverse. Riapplicarlo rinnova la durata senza accumulo. Eliminazione lo cancella definitivamente: resurrezione senza blocco.

### Reverse

Scambia immediatamente eserciti controllati e tempi residui, ruota la vista di 180°. Coordinate reali, direzioni dei pedoni, colori dei pezzi, identità e diritti arrocco restano invariati. Il giocatore attivo muove col nuovo esercito e col tempo ricevuto, usando il colore della carta.

Se il re assegnato al giocatore attivo è sotto scacco, deve difenderlo con l’azione disponibile; sotto matto tenta l’emergenza se può. Se l’esercito trasferito all’avversario è sotto scacco/matto, il turno corrente si interrompe e il nuovo controllore gestisce difesa/emergenza. I turni continuano ad alternarsi per P1/P2. Non si ereditano vincoli di pezzi usati nei turni precedenti.

### +2 / +4

Resuscitano il massimo numero possibile di pezzi eliminati del proprio esercito, fino a due/quattro, escluso il re, solo con casella iniziale libera. Il giocatore sceglie quali se più combinazioni raggiungono il massimo. Eleggibili tutte le cause di eliminazione, inclusi rischio e Reset.

Il pezzo torna al tipo originale: pedoni promossi/evoluti tornano pedoni. Un pedone a casa recupera il doppio passo; una torre recupera l’idoneità arrocco se anche il re è idoneo. Nessun vecchio blocco. Pezzi appena resuscitati possono essere mossi subito.

+4 richiede scelta del colore. La combinazione può lasciare il proprio re sotto scacco; va difeso con la mossa disponibile, altrimenti sconfitta immediata senza emergenza. Dare scacco termina il turno.

### Jolly evoluzione

Sceglie colore e trasforma un proprio pedone in torre, alfiere o cavallo. Stessa posizione e identità, stessa casa originale. Mantiene Skip. Donna e re non sono consentiti. Se crea scacco avversario termina il turno; se il proprio re rimane minacciato serve difesa legale disponibile, altrimenti la scelta è vietata.

### Inutilizzabili

Se Skip, Jolly o resurrezione non hanno bersagli utilizzabili, l’effetto è scartato ma rimane la mossa standard col colore della carta. Se già consumata dalla difesa, non si ripete. La carta è registrata negli scarti al termine del turno, anche quando l’effetto non ha avuto bersagli.

## Regole scacchistiche

Movimenti, inchiodature, sicurezza del re, promozione anche a donna e normali condizioni di arrocco restano attivi. Il re non è catturabile.

Durante UNO l’arrocco è atomico ma costa due mosse; usa re e torre e richiede due unità disponibili e sicure (entro il quarto indice). Durante la fase classica costa una mossa. I diritti restano con l’esercito dopo Reverse.

Un doppio passo crea en passant disponibile per tutto il prossimo turno avversario, anche dopo altre sotto-mosse. Più doppi passi creano più opportunità; si cancellano per scadenza, movimento/eliminazione del pedone o Reset. In fase classica rimangono le normali opportunità valide al passaggio di fase, poi durano una sola mossa avversaria.

## Fine mazzo e patte

L’ultima carta si completa con tutti gli effetti e bonus; il mazzo vuoto impedisce subito nuove emergenze. A fine turno si passa alla fase classica: colore e Skip annullati, posizione, trasformazioni, eliminati, controllo degli eserciti e tempi conservati. Una mossa per turno. Ripetizioni e 50 mosse iniziano da zero. Durante UNO non sono applicati.

Il clock scorre sempre, anche in emergenza, durante le scelte o con scheda in secondo piano. Prima di ogni comando si controlla il tempo reale trascorso. Timeout e bonus rosso usano il valutatore di possibilità di matto descritto sotto.

## Assunzioni esplicite

1. **Blu:** l’attribuzione al blu del dimezzamento delle mosse 5 e 6 proviene dalla specifica come assunzione, non da una conferma recuperabile. Configurazione in `src/domain/policies.ts`.
2. **Identità difensiva:** il pezzo della difesa iniziale è già utilizzato e non può muoversi di nuovo nello stesso turno.
3. **Giallo difensivo:** il bonus della cattura difensiva si accoda dopo la pesca; poi si usa il nuovo colore.
4. **Contro-scacco:** se la difesa dà scacco, termina prima della pescata.
5. **Nuovo scacco dopo difesa:** solo risorse residue; se la mossa speciale era consumata e non ci sono bonus utilizzabili, sconfitta, senza azione gratuita.
6. **Fallback:** è facoltativo salvo necessità di difesa.
7. **Arrocco UNO:** consentito solo con entrambe le unità entro il quarto indice; nessun arrocco parzialmente rischioso.
8. **Rischio che espone il re:** sconfitta immediata senza emergenza per chi si è esposto.
9. **Materiale UNO:** nessuna patta automatica per materiale insufficiente finché carte possono cambiare la posizione.
10. **Entrambi i re minacciati da un effetto:** priorità alla sicurezza del re attivo; non si termina vittoriosamente lasciando il proprio scacco irrisolto.
11. **Patte classiche:** triplice ripetizione e 50 mosse sono automatiche, senza richiesta manuale; non viene implementata una separata procedura di reclamo.
12. **Clock importato:** riprende dal residuo salvato; il tempo del file chiuso è escluso.

## Limiti effettivi

Il valutatore `canPossiblyMate` è sostituibile tramite adapter. Riconosce re solo, re contro re, un solo alfiere/cavallo complessivo, e soli alfieri su case dello stesso colore. Non risolve esaustivamente tutte le posizioni bloccate o le combinazioni asimmetriche di materiale minore: alcuni timeout possono assegnare vittoria dove un arbitro dichiarerebbe patta. Lo stesso limite riguarda le posizioni morte complesse nella fase classica. Non viene usato un engine esterno con tablebase.

Nessun account o rete di gioco. È disponibile un computer locale principiante, volutamente debole e senza rating misurato. Il salvataggio automatico locale riprende la partita dopo un refresh, conteggiando il tempo trascorso; se lo storage è disabilitato o pieno rimane l’esportazione manuale. Gli scenari di laboratorio sono strumenti di sviluppo e sostituiscono intenzionalmente lo stato corrente.


## Aggiornamento Pocket

Il timer iniziale di 5+0 della specifica archiviata è sostituito prima da 10+0 e ora da **7+0** su richiesta successiva dell’utente. Il formato della partita salvata conserva i tempi effettivi: le partite precedenti importate non ricevono minuti gratuiti. Interfaccia progettata prima per iPhone, metadati standalone, icona Home, animazioni pop da 140–250 ms e fumetti da 720 ms non bloccanti. La preferenza di sistema per movimento ridotto disattiva gli effetti.


## Modalità computer e interazioni dirette

Il computer controlla sempre P2, mentre Reverse cambia la sua mappa esercito come per qualsiasi giocatore. Esegue comandi del medesimo resolver e tutte le scelte richieste dalle carte; non è autorizzato a mosse illegali. Difficoltà principiante con obiettivo indicativo ~150 Elo, non testato contro un pool né calibrato.

Le resurrezioni tramite ologrammi confermano automaticamente solo al raggiungimento del massimo previsto dalla carta, senza cambiare le regole del dominio. Il colore nel popup precede l’effetto e aggiorna la cornice. Il menu non mette in pausa una partita: uscire dal tavolo salva, il clock resta soggetto al tempo trascorso.
