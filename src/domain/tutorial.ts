import type { State, Card, PieceType, Move } from "./types";
import { square } from "./types";
import { createGame } from "./turnResolver";
import { testPiece } from "./fixtures";
import { practiceSetup } from "./practice";
export type LessonCopy = { en: string; it: string };
const copy = (en: string, it: string): LessonCopy => ({ en, it });
export interface TutorialLesson {
  id: string;
  title: LessonCopy;
  explanation: LessonCopy;
  task: LessonCopy;
  hint: LessonCopy;
  learned: LessonCopy;
  piece?: PieceType;
  create: () => State;
  complete: (state: State) => boolean;
  focus: number[];
  startAtRisk?: boolean;
}
const event = (s: State, type: string) => s.events.some((e) => e.type === type);
const moved = (s: State, from: string, to: string) =>
  s.events.some(
    (e) =>
      e.type === "MoveCompleted" &&
      (e.data.move as Move).from === square(from) &&
      (e.data.move as Move).to === square(to),
  );
const chess = (pieces: State["pieces"]): State => {
  const s = createGame(42, 0, []);
  s.mode = "classical";
  s.pieces = pieces;
  return s;
};
const kings = () => [
  testPiece("wk", "w", "k", "a1"),
  testPiece("bk", "b", "k", "h8"),
];
export const chessLessons: TutorialLesson[] = [
  {
    id: "board",
    piece: "k",
    title: copy("Find your way around", "Orientati sulla scacchiera"),
    explanation: copy(
      "The board has 64 squares and each army starts with 16 pieces. Keep a light square at the bottom-right and the queen on her own color. White moves first.",
      "La scacchiera ha 64 caselle e ogni esercito parte con 16 pezzi. In basso a destra c’è una casella chiara e la donna parte sul proprio colore. Muove prima il Bianco.",
    ),
    task: copy(
      "Tap a2, then a3: your first move.",
      "Tocca a2, poi a3: la tua prima mossa.",
    ),
    hint: copy(
      "Letters name files; numbers name ranks. a2 is the pawn in the bottom-left file. Tap it to see legal destinations.",
      "Le lettere indicano le colonne, i numeri le traverse. a2 è il pedone sulla colonna più a sinistra. Toccalo per vedere le mosse legali.",
    ),
    learned: copy(
      "You found a piece by its coordinates. Next we use smaller positions to focus on one idea at a time.",
      "Hai trovato un pezzo dalle coordinate. Ora useremo posizioni ridotte per concentrarci su un concetto alla volta.",
    ),
    create: () => {
      const state = createGame(42, 0, []);
      state.mode = "classical";
      return state;
    },
    focus: [8],
    complete: (state) => moved(state, "a2", "a3"),
  },

  {
    id: "pawn",
    piece: "p",
    title: copy("Meet the pawn", "Conosci il pedone"),
    explanation: copy(
      "White starts at the bottom and moves first. Pawns go forward one square, or two on their first move if clear. They capture one square diagonally.",
      "Il Bianco parte in basso e muove per primo. I pedoni avanzano di una casella, o due alla prima mossa se libere. Catturano di una casella in diagonale.",
    ),
    task: copy(
      "Capture e3 with the pawn on d2.",
      "Cattura e3 con il pedone in d2.",
    ),
    hint: copy(
      "Tap d2, then e3. The marked squares are legal moves; a pawn cannot capture straight ahead.",
      "Tocca d2, poi e3. Le caselle segnate sono mosse legali: il pedone non cattura in avanti.",
    ),
    learned: copy(
      "The black pawn is gone. Files use letters, ranks use numbers: you just played d2–e3.",
      "Il pedone nero è catturato. Le colonne hanno lettere, le traverse numeri: hai giocato d2–e3.",
    ),
    create: () => {
      const p = testPiece("wp", "w", "p", "d2");
      p.moved = false;
      return chess([...kings(), p, testPiece("bp", "b", "p", "e3")]);
    },
    focus: [11],
    complete: (s) => moved(s, "d2", "e3"),
  },
  {
    id: "rook",
    piece: "r",
    title: copy("Straight lines", "Linee dritte"),
    explanation: copy(
      "Rooks move any distance along a rank or file. They cannot jump pieces. Capture an enemy by landing on its square.",
      "Le torri si muovono quanto vogliono lungo colonne o traverse. Non saltano i pezzi. Per catturare, arrivano sulla casella avversaria.",
    ),
    task: copy(
      "Take the pawn on d6 with the rook on d4.",
      "Prendi il pedone in d6 con la torre in d4.",
    ),
    hint: copy(
      "d4–d6 is a clear vertical path. Diagonal destinations are not rook moves.",
      "d4–d6 è un percorso verticale libero. La torre non si muove in diagonale.",
    ),
    learned: copy(
      "A capture replaces the enemy piece. Your own pieces would block the rook instead.",
      "Una cattura sostituisce il pezzo avversario. I tuoi pezzi, invece, bloccano il percorso.",
    ),
    create: () =>
      chess([
        ...kings(),
        testPiece("wr", "w", "r", "d4"),
        testPiece("bp", "b", "p", "d6"),
      ]),
    focus: [27],
    complete: (s) => moved(s, "d4", "d6"),
  },
  {
    id: "bishop",
    piece: "b",
    title: copy("Stay on the diagonal", "Segui la diagonale"),
    explanation: copy(
      "Bishops travel diagonally without jumping. Each bishop stays on the same square color for the whole game.",
      "Gli alfieri percorrono le diagonali senza saltare. Ogni alfiere resta sempre su caselle dello stesso colore.",
    ),
    task: copy(
      "Capture f4 with the bishop on c1.",
      "Cattura f4 con l’alfiere in c1.",
    ),
    hint: copy(
      "The path is c1–d2–e3–f4. Every square before the target must be empty.",
      "Il percorso è c1–d2–e3–f4. Le caselle prima della destinazione devono essere libere.",
    ),
    learned: copy(
      "Long diagonals are powerful, but one piece in the way stops the bishop.",
      "Le diagonali lunghe sono potenti, ma basta un pezzo in mezzo per bloccare l’alfiere.",
    ),
    create: () =>
      chess([
        ...kings(),
        testPiece("wb", "w", "b", "c1"),
        testPiece("bp", "b", "p", "f4"),
      ]),
    focus: [2],
    complete: (s) => moved(s, "c1", "f4"),
  },
  {
    id: "knight",
    piece: "n",
    title: copy("The one that jumps", "Quello che salta"),
    explanation: copy(
      "Knights move in an L: two squares along a rank or file, then one sideways. They are the only pieces that can jump others.",
      "I cavalli si muovono a L: due caselle in una direzione e una di lato. Sono gli unici pezzi che possono saltare gli altri.",
    ),
    task: copy(
      "Jump from e4 to g5 and capture.",
      "Salta da e4 a g5 e cattura.",
    ),
    hint: copy(
      "The pawn on f4 does not block the knight. Two right, one up lands on g5.",
      "Il pedone in f4 non blocca il cavallo. Due a destra e una in alto portano a g5.",
    ),
    learned: copy(
      "A knight jumps over pieces, but cannot land on a friendly piece.",
      "Il cavallo salta i pezzi, ma non può arrivare su una casella occupata da un alleato.",
    ),
    create: () =>
      chess([
        ...kings(),
        testPiece("wn", "w", "n", "e4"),
        testPiece("wp", "w", "p", "f4"),
        testPiece("bp", "b", "p", "g5"),
      ]),
    focus: [28],
    complete: (s) => moved(s, "e4", "g5"),
  },
  {
    id: "queen",
    piece: "q",
    title: copy("Rook plus bishop", "Torre più alfiere"),
    explanation: copy(
      "The queen combines rook and bishop movement: straight or diagonal, as far as the path stays clear. She cannot jump.",
      "La donna unisce torre e alfiere: linee dritte o diagonali, finché il percorso è libero. Non può saltare.",
    ),
    task: copy(
      "Move the queen from d1 to g4 to capture.",
      "Muovi la donna da d1 a g4 per catturare.",
    ),
    hint: copy(
      "Follow the diagonal d1–e2–f3–g4.",
      "Segui la diagonale d1–e2–f3–g4.",
    ),
    learned: copy(
      "The queen has many moves. The king is still the piece you must protect.",
      "La donna ha tante mosse. Il pezzo da proteggere resta però il re.",
    ),
    create: () =>
      chess([
        ...kings(),
        testPiece("wq", "w", "q", "d1"),
        testPiece("bp", "b", "p", "g4"),
      ]),
    focus: [3],
    complete: (s) => moved(s, "d1", "g4"),
  },
  {
    id: "king",
    piece: "k",
    title: copy("One careful step", "Un passo prudente"),
    explanation: copy(
      "The king moves one square in any direction, but never into attack. Kings cannot stand next to each other. You win by trapping the king, not capturing it.",
      "Il re muove di una casella in ogni direzione, mai sotto attacco. I re non possono stare vicini. Si vince intrappolando il re, non catturandolo.",
    ),
    task: copy("Move the king from e1 to d1.", "Muovi il re da e1 a d1."),
    hint: copy(
      "The black rook attacks rank 2. e2 is unsafe; d1 is safe.",
      "La torre nera attacca la seconda traversa. e2 non è sicura; d1 sì.",
    ),
    learned: copy(
      "The board only offers moves that leave your king safe.",
      "La scacchiera propone solo mosse che lasciano il tuo re al sicuro.",
    ),
    create: () =>
      chess([
        testPiece("wk", "w", "k", "e1"),
        testPiece("bk", "b", "k", "h8"),
        testPiece("br", "b", "r", "h2"),
      ]),
    focus: [4],
    complete: (s) => moved(s, "e1", "d1"),
  },
  {
    id: "chess-check",
    piece: "k",
    title: copy("Check means act now", "Scacco: agisci subito"),
    explanation: copy(
      "Check means your king is attacked. You must move it away, capture the attacker or block the attack. A knight’s attack cannot be blocked.",
      "Scacco significa che il re è attaccato. Devi spostarlo, catturare l’attaccante o bloccare l’attacco. L’attacco del cavallo non si può bloccare.",
    ),
    task: copy(
      "Escape the rook’s check: e1 to d1.",
      "Esci dallo scacco della torre: e1–d1.",
    ),
    hint: copy(
      "The rook on e8 controls the e-file. Moving further up that file does not escape check.",
      "La torre in e8 controlla la colonna e. Avanzare su quella colonna non elimina lo scacco.",
    ),
    learned: copy(
      "You cannot ignore check to play a more exciting move elsewhere.",
      "Non puoi ignorare lo scacco per giocare una mossa più interessante altrove.",
    ),
    create: () => {
      const s = practiceSetup(0, "red", "defense");
      s.mode = "classical";
      s.color = null;
      s.deck = [];
      return s;
    },
    focus: [4],
    complete: (s) => moved(s, "e1", "d1"),
  },
  {
    id: "chess-mate",
    piece: "q",
    title: copy("Close every exit", "Chiudi ogni via d’uscita"),
    explanation: copy(
      "Checkmate is check with no legal escape. In ordinary chess it ends the game immediately. The king is never physically captured.",
      "Il matto è uno scacco senza difese legali. Negli scacchi normali termina subito la partita. Il re non viene catturato.",
    ),
    task: copy(
      "Play Qg7: move the queen from g6 to g7.",
      "Gioca Dg7: muovi la donna da g6 a g7.",
    ),
    hint: copy(
      "Your king on f6 protects g7. The queen checks h8 and covers the remaining exits.",
      "Il re in f6 protegge g7. La donna dà scacco in h8 e chiude le altre vie di fuga.",
    ),
    learned: copy(
      "Checkmate! In our card phase, an emergency draw can change this ending. You will try that in course 2.",
      "Scacco matto! Nella fase con carte, una pescata d’emergenza può cambiare questo finale. La proverai nel percorso 2.",
    ),
    create: () =>
      chess([
        testPiece("wk", "w", "k", "f6"),
        testPiece("wq", "w", "q", "g6"),
        testPiece("bk", "b", "k", "h8"),
      ]),
    focus: [46],
    complete: (s) =>
      s.outcome?.reason === "Checkmate" && s.outcome.winner === "P1",
  },
  {
    id: "castle",
    piece: "k",
    title: copy("King and rook, together", "Re e torre, insieme"),
    explanation: copy(
      "Castling moves the king two squares toward a rook, then the rook crosses beside it. Both must be unmoved; the path empty. The king cannot castle out of, through or into check.",
      "L’arrocco sposta il re di due caselle verso la torre, che gli passa accanto. Entrambi devono essere mai mossi e il percorso libero. Il re non può essere, passare o finire sotto scacco.",
    ),
    task: copy(
      "Castle: move e1 to g1. Watch the rook.",
      "Arrocca: muovi e1–g1. Guarda la torre.",
    ),
    hint: copy(
      "Select the king, not the rook. The rook on h1 moves to f1 automatically.",
      "Seleziona il re, non la torre. La torre in h1 si sposta automaticamente in f1.",
    ),
    learned: copy(
      "In ordinary chess this is one move. In our card phase castling costs two actions and is unavailable after move 4.",
      "Negli scacchi classici è una mossa. Nella variante con carte costa due azioni e non è disponibile dopo la quarta mossa.",
    ),
    create: () => {
      const ps = [
        testPiece("wk", "w", "k", "e1"),
        testPiece("wr", "w", "r", "h1"),
        testPiece("bk", "b", "k", "e8"),
      ];
      ps.forEach((p) => (p.moved = false));
      return chess(ps);
    },
    focus: [4],
    complete: (s) =>
      moved(s, "e1", "g1") && s.pieces.find((p) => p.id === "wr")?.square === 5,
  },
  {
    id: "en-passant",
    piece: "p",
    title: copy("The passing pawn", "Il pedone di passaggio"),
    explanation: copy(
      "A pawn that just advanced two squares beside yours may be captured as if it moved one. En passant must be taken immediately. Here Black just played d7–d5.",
      "Un pedone appena avanzato di due caselle accanto al tuo si può catturare come se ne avesse fatta una. L’en passant va giocato subito. Qui il Nero ha appena fatto d7–d5.",
    ),
    task: copy(
      "Play e5–d6. The pawn on d5 disappears.",
      "Gioca e5–d6. Il pedone in d5 scompare.",
    ),
    hint: copy(
      "Land on the empty d6 square, not on d5.",
      "Arriva sulla casella vuota d6, non su d5.",
    ),
    learned: copy(
      "That special capture is legal only while its en passant opportunity is active.",
      "Questa cattura speciale è legale solo finché l’opportunità en passant è attiva.",
    ),
    create: () => {
      const s = chess([
        ...kings(),
        testPiece("wp", "w", "p", "e5"),
        testPiece("bp", "b", "p", "d5"),
      ]);
      s.ep = [
        { pawnId: "bp", target: 43, eligibleArmy: "w", expiresAfterTurn: 1 },
      ];
      return s;
    },
    focus: [36],
    complete: (s) =>
      moved(s, "e5", "d6") &&
      s.pieces.find((p) => p.id === "bp")?.square === null,
  },
  {
    id: "promotion",
    piece: "p",
    title: copy("A pawn graduates", "Il pedone si diploma"),
    explanation: copy(
      "A pawn reaching the farthest rank becomes a queen, rook, bishop or knight. It does not need a captured piece. This exercise promotes to a queen.",
      "Un pedone sull’ultima traversa diventa donna, torre, alfiere o cavallo. Non serve un pezzo catturato. In questa prova diventa una donna.",
    ),
    task: copy(
      "Advance a7–a8 and see the new queen.",
      "Avanza a7–a8 e osserva la nuova donna.",
    ),
    hint: copy(
      "In a match you choose the promotion piece. This guided board has Queen selected.",
      "In partita scegli il pezzo di promozione. Questa prova guidata ha la Donna selezionata.",
    ),
    learned: copy(
      "Ordinary promotion can create a queen. The Wild card’s evolution cannot.",
      "La promozione normale può creare una donna. L’evoluzione della carta Wild no.",
    ),
    create: () => chess([...kings(), testPiece("wp", "w", "p", "a7")]),
    focus: [48],
    complete: (s) => s.pieces.find((p) => p.id === "wp")?.type === "q",
  },
  {
    id: "stalemate",
    piece: "q",
    title: copy(
      "No moves is not always mate",
      "Senza mosse non è sempre matto",
    ),
    explanation: copy(
      "If a player has no legal move but is NOT in check, ordinary chess ends in stalemate: a draw. Draws can also follow repetition, the 50-move rule or a dead position.",
      "Se un giocatore non ha mosse legali ma NON è sotto scacco, negli scacchi è stallo: patta. Esistono anche patte per ripetizione, regola delle 50 mosse o posizione morta.",
    ),
    task: copy(
      "Play g5–g6 and watch Black have no move.",
      "Gioca g5–g6: il Nero non avrà mosse.",
    ),
    hint: copy(
      "This queen move takes away the exits without checking h8. That is why it is a draw, not a win.",
      "La donna chiude le vie d’uscita senza dare scacco in h8. Per questo è patta, non vittoria.",
    ),
    learned: copy(
      "Stalemate is a draw in ordinary chess. During our card phase, a rescue card can sometimes reopen the position.",
      "Lo stallo è patta negli scacchi normali. Nella fase con carte, una carta di salvataggio può talvolta riaprire la posizione.",
    ),
    create: () =>
      chess([
        testPiece("wk", "w", "k", "f7"),
        testPiece("wq", "w", "q", "g5"),
        testPiece("bk", "b", "k", "h8"),
      ]),
    focus: [38],
    complete: (s) => s.outcome?.reason === "Stalemate",
  },
];
const variant =
  (
    card: number,
    color: "red" | "green" | "blue" | "yellow",
    scenario?: string,
  ) =>
  () =>
    practiceSetup(card, color, scenario);
export const variantLessons: TutorialLesson[] = [
  {
    id: "number",
    title: copy("One card, several pieces", "Una carta, più pezzi"),
    explanation: copy(
      "Each turn draws automatically: adopt the color, resolve the effect, then move. A number grants that many actions with different pieces. Up to the first four are required and safe.",
      "Ogni turno pesca automaticamente: cambia colore, applica l’effetto, poi muovi. Un numero concede altrettante azioni con pezzi diversi. Fino alle prime quattro sono obbligatorie e sicure.",
    ),
    task: copy(
      "Draw 2. Play a2–a3, then b2–b3.",
      "Pesca 2. Gioca a2–a3, poi b2–b3.",
    ),
    hint: copy(
      "The first pawn cannot move again this turn. Giving check ends a turn early, even if actions remain.",
      "Il primo pedone non può muovere ancora nel turno. Dare scacco termina il turno anche se restano azioni.",
    ),
    learned: copy(
      "Two actions, two pieces. The next card was drawn automatically for the opponent.",
      "Due azioni, due pezzi. La carta successiva è stata pescata automaticamente per l’avversario.",
    ),
    create: variant(0, "green"),
    focus: [8, 9],
    complete: (s) => moved(s, "a2", "a3") && moved(s, "b2", "b3"),
  },
  {
    id: "clocks",
    title: copy("Colors change the clock", "I colori cambiano il tempo"),
    explanation: copy(
      "Green adds 3 seconds to you after a move. Red removes 3 from the opponent. Match clocks run during choices and menus too. Practice clocks do not tick.",
      "Il Verde ti aggiunge 3 secondi dopo una mossa. Il Rosso ne toglie 3 all’avversario. In partita il tempo scorre anche nelle scelte e nei menu. Qui è fermo.",
    ),
    task: copy(
      "Draw Green and play a2–a3. Watch P1.",
      "Pesca Verde e gioca a2–a3. Guarda P1.",
    ),
    hint: copy(
      "P1 starts at 420 seconds. The move should make it 423. In a real match elapsed time is also deducted.",
      "P1 parte da 420 secondi: la mossa lo porta a 423. In partita si sottrae anche il tempo trascorso.",
    ),
    learned: copy(
      "At 0 you lose unless the opponent cannot possibly mate. Choose 4, 7 or 10 minutes before a match. Leaving play never pauses the clock.",
      "A 0 perdi, salvo impossibilità di matto avversario. Scegli 4, 7 o 10 minuti prima di giocare. Uscire non ferma il tempo.",
    ),
    create: variant(0, "green"),
    focus: [8],
    complete: (s) => moved(s, "a2", "a3") && s.clock.remaining.P1 === 423000,
  },
  {
    id: "risk",
    title: copy(
      "Four safe moves. Then decide.",
      "Quattro mosse sicure. Poi decidi.",
    ),
    explanation: copy(
      "From move 5, the moving piece may break AFTER moving and capturing. Risks are 20%, 40%, 60%, 80%, then 99%. The king cannot move from move 5 onward.",
      "Dalla quinta mossa il pezzo può rompersi DOPO mossa e cattura. I rischi sono 20%, 40%, 60%, 80%, poi 99%. Il re non può muovere dalla quinta in poi.",
    ),
    task: copy(
      "Draw 7. We play four safe moves; then tap Pass.",
      "Pesca 7. Giochiamo quattro mosse sicure; poi tocca Passa.",
    ),
    hint: copy(
      "Cracks warn of risk. Passing is allowed after the required moves, unless a Yellow bonus remains. Breaking ends the turn.",
      "Le crepe segnalano il rischio. Dopo le mosse obbligatorie puoi passare, salvo bonus Gialli pendenti. Rompersi termina il turno.",
    ),
    learned: copy(
      "You kept three optional actions unplayed. More moves are an opportunity, not an obligation to gamble.",
      "Hai rinunciato a tre azioni facoltative. Più mosse sono un’opportunità, non un obbligo di rischiare.",
    ),
    create: variant(1, "red"),
    focus: [],
    startAtRisk: true,
    complete: (s) => event(s, "TurnEnded") && !event(s, "RiskResolved"),
  },
  {
    id: "blue",
    title: copy("Blue reduces the gamble", "Il Blu riduce il rischio"),
    explanation: copy(
      "Blue halves break risk only on moves 5 and 6: 10% and 20%. Later risks stay unchanged. It never allows the king into the danger zone.",
      "Il Blu dimezza il rischio solo sulle mosse 5 e 6: 10% e 20%. I rischi successivi restano uguali. Il re resta escluso dalla zona di rischio.",
    ),
    task: copy(
      "Draw Blue 7. After our four moves, play a2–a3.",
      "Pesca 7 Blu. Dopo le nostre quattro mosse, gioca a2–a3.",
    ),
    hint: copy(
      "The fifth move is a real 10% roll. The lesson succeeds whether the pawn survives or breaks.",
      "La quinta mossa ha un vero rischio del 10%. La lezione riesce sia se il pedone sopravvive sia se si rompe.",
    ),
    learned: copy(
      "You tried a real risk roll. The puff means the moved piece broke; its move still happened.",
      "Hai provato un vero tiro di rischio. Il puff indica che il pezzo si è rotto; la mossa è comunque avvenuta.",
    ),
    create: variant(1, "blue"),
    focus: [8],
    startAtRisk: true,
    complete: (s) =>
      s.events.some(
        (e) => e.type === "RiskResolved" && e.data.probability === 0.1,
      ),
  },
  {
    id: "yellow",
    title: copy("Capture, then move another", "Cattura, poi muovine un altro"),
    explanation: copy(
      "Yellow gives a required extra move when a capturing piece survives. Use another piece. More captures can chain; check or a break ends the turn.",
      "Il Giallo aggiunge una mossa obbligatoria se chi cattura sopravvive. Usa un altro pezzo. Altre catture creano catene; scacco o rottura terminano il turno.",
    ),
    task: copy(
      "Draw Yellow 1. Play b1–b3, then e3–f5.",
      "Pesca 1 Giallo. Gioca b1–b3, poi e3–f5.",
    ),
    hint: copy(
      "The rook captures a pawn. The knight then uses the bonus without capturing. You cannot pass that bonus.",
      "La torre cattura un pedone. Il cavallo usa il bonus senza catturare. Non puoi saltare quel bonus con Passa.",
    ),
    learned: copy(
      "The bonus is spent and the turn ends. A broken capturer earns no bonus.",
      "Il bonus è consumato e il turno finisce. Chi si rompe dopo la cattura non genera un bonus.",
    ),
    create: variant(0, "yellow", "yellow"),
    focus: [1, 20],
    complete: (s) =>
      event(s, "YellowBonusGranted") &&
      moved(s, "e3", "f5") &&
      s.active === "P2",
  },
  {
    id: "skip",
    title: copy("Chains stop movement", "Le catene fermano il movimento"),
    explanation: copy(
      "Skip freezes an enemy piece for its next controller’s turn. Kings are immune. Frozen pieces still attack: chains do not cancel check.",
      "Skip blocca un pezzo nemico per il prossimo turno del suo controllore. I re sono immuni. I pezzi bloccati attaccano ancora: le catene non eliminano lo scacco.",
    ),
    task: copy(
      "Draw Skip, then tap the pawn on a7.",
      "Pesca Skip, poi tocca il pedone in a7.",
    ),
    hint: copy(
      "Tap an enemy piece directly. After the effect, an unused optional move normally remains.",
      "Tocca direttamente un pezzo nemico. Dopo l’effetto resta normalmente una mossa facoltativa, se non già usata.",
    ),
    learned: copy(
      "The pawn is chained. Its block follows it through Reset or Reverse until it expires.",
      "Il pedone è incatenato. Il blocco lo segue attraverso Reset e Reverse fino alla scadenza.",
    ),
    create: variant(5, "red"),
    focus: [48],
    complete: (s) => s.pieces.find((p) => p.id === "b-48")?.blocked === true,
  },
  {
    id: "revive2",
    title: copy("+2 means two returns", "+2 significa due ritorni"),
    explanation: copy(
      "+2 revives lost pieces, not cards. Their original squares must be free. Revive as many as possible, up to two. A returning promoted pawn is a pawn again.",
      "+2 resuscita pezzi, non carte. Le case iniziali devono essere libere. Riportane il massimo possibile, fino a due. Un pedone promosso torna pedone.",
    ),
    task: copy(
      "Draw +2. Select the ghosts on a1 and b1.",
      "Pesca +2. Seleziona i fantasmi in a1 e b1.",
    ),
    hint: copy(
      "The final required tap applies both choices. A king can never be resurrected.",
      "L’ultimo tocco necessario applica entrambe le scelte. Il re non può essere resuscitato.",
    ),
    learned: copy(
      "Both pieces returned home. An unused optional move normally follows a special effect.",
      "I due pezzi sono tornati a casa. Un effetto speciale lascia normalmente una mossa facoltativa, se non già usata.",
    ),
    create: variant(2, "green"),
    focus: [0, 1],
    complete: (s) =>
      s.events.filter((e) => e.type === "PieceResurrected").length === 2,
  },
  {
    id: "revive4",
    title: copy("Choose your comeback color", "Scegli il colore del ritorno"),
    explanation: copy(
      "+4 lets you choose a color, then revive up to four eligible pieces. The chosen color applies to later moves. It does not draw four cards.",
      "+4 ti fa scegliere un colore e resuscitare fino a quattro pezzi idonei. Il colore scelto vale per le mosse successive. Non pesca quattro carte.",
    ),
    task: copy(
      "Draw +4, choose Blue, then a1, b1, c1 and a2.",
      "Pesca +4, scegli Blu, poi a1, b1, c1 e a2.",
    ),
    hint: copy(
      "Choose the color first. Glowing home squares show the pieces you can return.",
      "Scegli prima il colore. Le case iniziali luminose mostrano i pezzi che puoi far tornare.",
    ),
    learned: copy(
      "Four pieces returned and Blue is active. An occupied home square would prevent that resurrection.",
      "Quattro pezzi sono tornati e il Blu è attivo. Una casa iniziale occupata impedisce quella resurrezione.",
    ),
    create: variant(3, "blue"),
    focus: [0, 1, 2, 8],
    complete: (s) =>
      s.color === "blue" &&
      s.events.filter((e) => e.type === "PieceResurrected").length === 4,
  },
  {
    id: "wild",
    title: copy("A different kind of promotion", "Una promozione diversa"),
    explanation: copy(
      "Wild chooses a color and evolves one eligible pawn where it stands. Choose rook, bishop or knight; never queen. This effect does not spend the optional move.",
      "Wild sceglie un colore ed evolve un pedone idoneo sulla sua casella. Scegli torre, alfiere o cavallo; mai donna. L’effetto non consuma la mossa facoltativa.",
    ),
    task: copy(
      "Draw Wild. Choose Green, tap a2, then Rook.",
      "Pesca Wild. Scegli Verde, tocca a2, poi Torre.",
    ),
    hint: copy(
      "The pawn becomes a rook without moving. In a match, only evolutions allowed by king safety are offered.",
      "Il pedone diventa torre senza muoversi. In partita sono proposte solo evoluzioni compatibili con la sicurezza del re.",
    ),
    learned: copy(
      "The new rook keeps the pawn’s identity and home square. This is evolution, not ordinary promotion.",
      "La nuova torre mantiene identità e casa del pedone. È evoluzione, non promozione normale.",
    ),
    create: variant(4, "green"),
    focus: [8],
    complete: (s) => s.pieces.find((p) => p.id === "w-8")?.type === "r",
  },
  {
    id: "reverse",
    title: copy("New army. Same player.", "Nuovo esercito. Stesso giocatore."),
    explanation: copy(
      "Reverse exchanges armies and remaining clocks and turns the board. You keep the newly drawn color. Normally you may move with the army you just received.",
      "Reverse scambia eserciti e tempi residui e ruota la scacchiera. Mantieni il colore appena pescato. Normalmente puoi muovere con l’esercito ricevuto.",
    ),
    task: copy(
      "Draw Reverse. Watch P1 receive Black and its clock.",
      "Pesca Reverse. Guarda P1 ricevere il Nero e il suo tempo.",
    ),
    hint: copy(
      "P1 and P2 identify players, not army colors. Check can interrupt this sequence; checkmate can need an emergency draw.",
      "P1 e P2 identificano i giocatori, non i colori. Uno scacco può interrompere la sequenza; un matto può richiedere una pescata d’emergenza.",
    ),
    learned: copy(
      "P1 now controls Black. Blue stayed active. Plan for the army you might inherit, too.",
      "P1 ora controlla il Nero. Il Blu è rimasto attivo. Pensa anche all’esercito che potresti ereditare.",
    ),
    create: variant(6, "blue"),
    focus: [],
    complete: (s) =>
      event(s, "ArmiesSwapped") && s.control.P1 === "b" && s.color === "blue",
  },
  {
    id: "reset",
    title: copy(
      "Home is a place, not a revival",
      "Casa non significa resurrezione",
    ),
    explanation: copy(
      "Reset returns surviving non-pawn pieces home. Ordinary pawns stay put; evolved or promoted pawns return home keeping their new type. Lost pieces stay lost.",
      "Reset riporta a casa i pezzi superstiti non più pedoni. I pedoni normali restano fermi; quelli evoluti o promossi tornano col nuovo tipo. I pezzi persi restano persi.",
    ),
    task: copy(
      "Draw 0. Watch the rook move from a4 back to a1.",
      "Pesca 0. Guarda la torre tornare da a4 ad a1.",
    ),
    hint: copy(
      "An occupied home square can cause a collision. Reset can expose check, so look at both kings afterward.",
      "Una casa occupata può causare collisioni. Reset può esporre uno scacco: controlla entrambi i re dopo l’effetto.",
    ),
    learned: copy(
      "The rook is home; ordinary pawns did not move. Reset and resurrection are different effects.",
      "La torre è a casa; i pedoni normali non si sono mossi. Reset e resurrezione sono effetti diversi.",
    ),
    create: variant(7, "green"),
    focus: [24, 0],
    complete: (s) =>
      event(s, "ResetApplied") &&
      s.pieces.find((p) => p.id === "w-0")?.square === 0,
  },
  {
    id: "defense",
    title: copy("Defend. Then draw.", "Difendi. Poi pesca."),
    explanation: copy(
      "In simple check, first make a saving move with the OLD color. Only then draw. That defense spends no numbered moves or risk index, but consumes a special’s optional move.",
      "Sotto scacco semplice, fai prima una difesa col VECCHIO colore. Solo dopo peschi. Non consumi mosse numeriche né indice di rischio, ma consumi la mossa facoltativa speciale.",
    ),
    task: copy(
      "Begin the turn. Escape e1–d1 before Green appears.",
      "Inizia il turno. Fuggi e1–d1 prima che appaia il Verde.",
    ),
    hint: copy(
      "Old Red removes 3 seconds from the opponent. The drawn Green 4 still grants four moves; the king has already been used.",
      "Il vecchio Rosso toglie 3 secondi all’avversario. Il 4 Verde concede ancora quattro mosse; il re è già stato usato.",
    ),
    learned: copy(
      "You defended in Red, then drew Green with all four moves left. A counter-check would have ended the turn before drawing.",
      "Hai difeso col Rosso, poi pescato Verde con quattro mosse intatte. Un contro-scacco avrebbe chiuso il turno prima della pescata.",
    ),
    create: variant(0, "red", "defense"),
    focus: [4],
    complete: (s) =>
      moved(s, "e1", "d1") && s.color === "green" && s.budget === 4,
  },
  {
    id: "emergency",
    title: copy(
      "Mate gets one emergency card",
      "Il matto ha una carta d’emergenza",
    ),
    explanation: copy(
      "While cards remain, checkmate first triggers ONE emergency draw. Change color, apply the effect, then evaluate. A successful rescue is a full turn; a failed rescue loses.",
      "Finché restano carte, il matto attiva UNA pescata d’emergenza. Cambia colore, applica l’effetto e valuta. Se ti salvi giochi un turno completo; se fallisci perdi.",
    ),
    task: copy(
      "Begin the turn. The emergency Reset can save this king.",
      "Inizia il turno. Il Reset d’emergenza può salvare questo re.",
    ),
    hint: copy(
      "There is no legal defense before this draw. Self-mate caused by your Reset or resurrection does not earn another rescue card.",
      "Prima di questa pescata non c’è difesa legale. Un matto autoinflitto da Reset o resurrezione non dà un’altra carta di salvataggio.",
    ),
    learned: copy(
      "Reset rescued the position. Emergency draws are a rule, not a guarantee of survival. Stalemate also gets a card-rescue attempt.",
      "Reset ha salvato la posizione. La pescata d’emergenza è una regola, non una garanzia. Anche lo stallo ha un tentativo con carta.",
    ),
    create: variant(7, "green", "emergency"),
    focus: [0],
    complete: (s) =>
      event(s, "EmergencyDrawStarted") &&
      event(s, "ResetApplied") &&
      !s.outcome,
  },
  {
    id: "last",
    title: copy(
      "The deck ends. Chess stays.",
      "Il mazzo finisce. Gli scacchi restano.",
    ),
    explanation: copy(
      "The last card finishes its actions before ordinary chess begins: one move per turn, no card color bonuses or temporary chains. Armies and positions stay as they are.",
      "L’ultima carta finisce le sue azioni prima degli scacchi classici: una mossa per turno, senza bonus di colore né catene temporanee. Eserciti e posizione restano.",
    ),
    task: copy(
      "Draw the last 2. Play a2–a3 and b2–b3.",
      "Pesca l’ultimo 2. Gioca a2–a3 e b2–b3.",
    ),
    hint: copy(
      "The first move is not enough. Finish the card and watch the active color become neutral.",
      "La prima mossa non basta. Completa la carta e guarda il colore diventare neutro.",
    ),
    learned: copy(
      "You have met chess and the cards. In a real match, choose pieces carefully, watch the clocks and enjoy the chaos.",
      "Hai conosciuto scacchi e carte. In partita scegli con cura i pezzi, guarda il tempo e goditi il caos.",
    ),
    create: variant(0, "green", "last"),
    focus: [8, 9],
    complete: (s) =>
      s.mode === "classical" && event(s, "ClassicalPhaseStarted"),
  },
];
export type CourseId = "chess" | "variant";
export const tutorialCourses = {
  chess: {
    title: copy("Chess basics", "Scacchi di base"),
    description: copy(
      "Meet the pieces. Protect the king. Learn the important exceptions.",
      "Conosci i pezzi, proteggi il re e scopri le eccezioni importanti.",
    ),
    lessons: chessLessons,
  },
  variant: {
    title: copy("The Check Happens rules", "Le regole di Check Happens"),
    description: copy(
      "Read the cards, manage the risk and survive the surprises.",
      "Impara le carte, gestisci il rischio e affronta le sorprese.",
    ),
    lessons: variantLessons,
  },
};
export const LEARNING_PROGRESS_KEY = "check-happens-academy-v1";
export function tutorialCardView(
  state: State,
  hideUntilDraw = false,
): { card: Card | null; drawn: boolean } {
  const e = state.events.find((e) => e.type === "CardDrawn");
  return e
    ? { card: e.data.card as Card, drawn: true }
    : {
        card: hideUntilDraw ? null : (state.deck[state.deckIndex] ?? null),
        drawn: false,
      };
}

export function validLearningProgress(value: unknown): string[] {
  const ids = new Set([...chessLessons, ...variantLessons].map((l) => l.id));
  return Array.isArray(value)
    ? [
        ...new Set(
          value.filter((v): v is string => typeof v === "string" && ids.has(v)),
        ),
      ]
    : [];
}
