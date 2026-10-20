> Historical Pocket notes. Superseded by [ONLINE.md](ONLINE.md).

# Partita privata su invito — progetto della prossima fase

Stato: **progettata, non implementata**. Il menu Gioca lo dichiara; non genera link che fingono di collegare due dispositivi. Il server HTTP locale serve solo l’app e non sincronizza giocatori.

## Esperienza proposta

1. Gioca → Privata su invito → Crea stanza.
2. Un link da copiare/condividere, con codice stanza e stato “In attesa dell’amico”. Nessun account richiesto per il primo prototipo.
3. L’invitato apre il link: vede giocatori, formato 7+0 e regole, poi conferma.
4. Entrambi pronti: il server assegna P1/P2 e avvia la partita. Ogni telefono mostra la propria identità e l’esercito controllato, che può cambiare con Reverse.
5. Fine partita, rivincita o chiusura stanza. Non servono lobby pubbliche, chat o classifiche nella prima versione.

## Architettura proposta

Un servizio HTTPS/WebSocket mantiene uno stato autorevole per stanza e usa lo stesso resolver TypeScript. Il client invia solo comandi; non può inviare il proprio clock, mazzo, sorteggio o un nuovo stato come verità. Seed e ordine futuro del mazzo restano sul server. Il payload al client deve omettere le carte non pescate e lo stato RNG: l’attuale State locale è completo e **non va inviato integralmente in produzione online**.

Il server verifica sessione, identità, turno, fase, revisione e legalità, poi distribuisce gli eventi risolti. `src/online/protocol.ts` traccia il contratto del trasporto; prima di implementarlo, sostituire `State` con una vista pubblica che nasconda mazzo futuro e RNG. Non è un backend già pronto.

Clock sul server da sorgente monotona; ogni messaggio include timestamp server e revisione. I client interpolano solo la visualizzazione. Disconnessione e ritorno nel menu non fermano il clock. Una breve riconnessione richiede un resume token personale separato dal link pubblico d’invito.

Ogni comando ha un ID univoco e una revisione attesa: duplicati non vengono applicati due volte, revisioni arretrate causano risincronizzazione. Salvare snapshot ed eventi per riconnessione o riavvio del processo. Una sola transizione atomica per stanza evita doppie pescate e corse su Reverse.

## Inviti e limiti

Token casuali crittografici da almeno 128 bit, scadenza delle stanze inattive, join limitato a un ospite, token di ripresa distinti per i due giocatori e memorizzati come hash. Non usare il seed della partita come invito. HTTPS, controllo Origin e limiti su join/comandi completano il perimetro di base.

## Prossimo incremento concreto

Scegliere l’hosting del servizio persistente/WebSocket, implementare vista pubblica e stanza autorevole, poi invito, riconnessione e due browser di test. Servono test di doppio comando, clock/disconnessione, Replay/Reverse durante riconnessione e rifiuto di comandi dell’avversario. Il bot locale e l’interfaccia del turno sono già separati dall’identità dell’esercito e quindi riutilizzabili.
