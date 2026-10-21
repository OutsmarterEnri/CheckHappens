import type { State, UnoColor } from "./types";
const count = (s: State, event: string) =>
  s.events.filter((e) => e.type === event).length;
export interface TutorialMission {
  id: string;
  group: string;
  title: string;
  card: number;
  color: UnoColor;
  scenario?: string;
  task: string;
  hint: string;
  learned: string;
  focus: number[];
  complete: (state: State) => boolean;
}
export const tutorialMissions: TutorialMission[] = [
  {
    id: "turn",
    group: "Your first turn",
    title: "Two pieces. Two moves.",
    card: 0,
    color: "green",
    task: "Draw the 2. Move a2 to a3, then b2 to b3.",
    hint: "Tap a piece, then a marked square. A piece can move only once in this card turn.",
    learned:
      "You spent both required moves with different pieces. The next player now draws automatically.",
    focus: [8, 9],
    complete: (s) => count(s, "MoveCompleted") >= 2,
  },
  {
    id: "green",
    group: "Colors have power",
    title: "Earn three seconds.",
    card: 0,
    color: "green",
    task: "Draw Green and make one legal move. Watch your clock.",
    hint: "Move a pawn from a2 to a3. Practice time is frozen so you can see the bonus clearly.",
    learned:
      "Green added 3 seconds to your clock after the move. Every completed move applies the active color.",
    focus: [8],
    complete: (s) => s.clock.remaining.P1 > 420000,
  },
  {
    id: "red",
    group: "Colors have power",
    title: "Steal three seconds.",
    card: 0,
    color: "red",
    task: "Draw Red and make one move. Watch the other clock.",
    hint: "Try a2 to a3. Red removes time from the opponent, even without a capture.",
    learned:
      "Red removed 3 seconds from P2. The frame keeps the active color visible throughout the turn.",
    focus: [8],
    complete: (s) => s.clock.remaining.P2 < 300000,
  },
  {
    id: "pass",
    group: "Take a risk?",
    title: "You can say enough.",
    card: 1,
    color: "red",
    task: "Four safe moves are already done. Draw the 7, then Pass without moving.",
    hint: "Move 5 has 20% break risk. The king cannot move from move 5 onward. Passing avoids taking this risk.",
    learned:
      "You passed safely. Moves 1–4 are required. Later risks: 20%, 40%, 60%, 80%, 99%. You may pass unless a Yellow bonus remains.",
    focus: [],
    complete: (s) =>
      count(s, "TurnEnded") > 0 && count(s, "MoveCompleted") === 0,
  },
  {
    id: "blue",
    group: "Take a risk?",
    title: "Blue softens the gamble.",
    card: 1,
    color: "blue",
    task: "Draw Blue. Try the fifth move with a pawn, not the king.",
    hint: "Tap a2, then a3. Blue makes move 5 a 10% risk and move 6 a 20% risk. Later risks are unchanged.",
    learned:
      "You tried a real risk roll. Blue reduces the odds; it never makes the king available from move 5 onward.",
    focus: [8],
    complete: (s) => count(s, "MoveCompleted") > 0,
  },
  {
    id: "yellow",
    group: "Colors have power",
    title: "A capture earns a duty.",
    card: 0,
    color: "yellow",
    scenario: "yellow",
    task: "Draw Yellow. Capture b3 with the rook on b1, then move another piece.",
    hint: "After b1 to b3, try the bishop on c1 to d2. Pass is unavailable while the capture bonus is owed.",
    learned:
      "Yellow gave one required extra move. Another available piece had to play it, even if you wanted to pass.",
    focus: [1, 2],
    complete: (s) =>
      count(s, "YellowBonusGranted") > 0 && count(s, "MoveCompleted") >= 2,
  },
  {
    id: "skip",
    group: "Cards change the plan",
    title: "Put a piece in chains.",
    card: 5,
    color: "red",
    task: "Draw Skip and tap an enemy pawn to freeze it.",
    hint: "Tap a7. Kings are immune. A frozen piece still attacks squares and can still give check.",
    learned:
      "The chains stop that piece moving on its next controller’s turn. Its attacks stay active.",
    focus: [48],
    complete: (s) => count(s, "PieceBlocked") > 0,
  },
  {
    id: "revive2",
    group: "Cards change the plan",
    title: "Bring two friends back.",
    card: 2,
    color: "green",
    task: "Draw +2 and fill two glowing home squares.",
    hint: "Tap the ghosts on a1 and b1. You must revive as many eligible pieces as possible, up to two.",
    learned:
      "+2 revives pieces on free original squares. It does not draw cards. A special normally leaves one optional move.",
    focus: [0, 1],
    complete: (s) => count(s, "PieceResurrected") >= 2,
  },
  {
    id: "revive4",
    group: "Cards change the plan",
    title: "Choose a comeback color.",
    card: 3,
    color: "blue",
    task: "Draw +4, choose a color and revive all four ghosts.",
    hint: "After picking a color, tap a1, b1, c1 and a2. Occupied original squares cannot receive a resurrection.",
    learned:
      "+4 chose a color and revived four pieces. The chosen color now applies to your moves.",
    focus: [0, 1, 2, 8],
    complete: (s) => count(s, "PieceResurrected") >= 4,
  },
  {
    id: "wild",
    group: "Cards change the plan",
    title: "Give a pawn a new job.",
    card: 4,
    color: "green",
    task: "Draw Wild. Pick a color, tap a pawn and choose its new piece.",
    hint: "Tap a2, then choose rook, bishop or knight. Wild never offers a queen.",
    learned:
      "Evolution changed the pawn without spending an ordinary move. It stays on its square and keeps its identity.",
    focus: [8],
    complete: (s) => count(s, "PieceTransformed") > 0,
  },
  {
    id: "reverse",
    group: "Cards change the plan",
    title: "Now you play the other army.",
    card: 6,
    color: "blue",
    task: "Draw Reverse. Watch the armies, board and unequal clocks swap.",
    hint: "P1 stays P1, but now controls Black. The newly drawn Blue remains active.",
    learned:
      "Reverse exchanged armies and remaining clocks. You may move the received army; the opponent then starts a normal turn.",
    focus: [],
    complete: (s) => count(s, "ArmiesSwapped") > 0,
  },
  {
    id: "reset",
    group: "Cards change the plan",
    title: "Send the rook home.",
    card: 7,
    color: "green",
    task: "The rook is on a4. Draw Reset and watch a1.",
    hint: "Reset returns surviving non-pawn pieces home. It does not revive lost pieces or move ordinary pawns.",
    learned:
      "The rook returned to a1. Reset applies collision rules if a home square is occupied.",
    focus: [24, 0],
    complete: (s) => count(s, "ResetApplied") > 0,
  },
  {
    id: "defense",
    group: "When kings are threatened",
    title: "Save the king before drawing.",
    card: 0,
    color: "red",
    scenario: "defense",
    task: "Begin the turn, then move the king from e1 to d1 to escape check.",
    hint: "The old Red still applies to defense. Only after escaping does the new Green card appear.",
    learned:
      "Defense kept the old color and left all four numbered moves. With a special card, it consumes the optional move instead.",
    focus: [4],
    complete: (s) =>
      s.events.some(
        (e) => e.type === "MoveCompleted" && e.data.defense === true,
      ),
  },
  {
    id: "emergency",
    group: "When kings are threatened",
    title: "Checkmate gets one last card.",
    card: 7,
    color: "green",
    scenario: "emergency",
    task: "Begin this checkmated turn. Watch the emergency Reset rescue the king.",
    hint: "With cards remaining, checkmate triggers an emergency draw: new color, effects, then position evaluation.",
    learned:
      "The emergency card rescued this position and begins a full turn. A card that fails to rescue it still loses the game.",
    focus: [0],
    complete: (s) =>
      count(s, "EmergencyDrawStarted") > 0 &&
      count(s, "ResetApplied") > 0 &&
      !s.outcome,
  },
  {
    id: "check",
    group: "When kings are threatened",
    title: "Check ends your turn.",
    card: 0,
    color: "green",
    scenario: "check",
    task: "Draw the 2. Move the rook from b1 to b8 to give check.",
    hint: "The rook attacks the king along rank 8. Giving check ends the turn even with a numbered move left.",
    learned:
      "Your unused move was forfeited. The opponent must now defend before drawing, using the persistent color.",
    focus: [1],
    complete: (s) =>
      count(s, "MoveCompleted") > 0 &&
      s.active === "P2" &&
      s.phase === "PRE_DRAW_DEFENSE",
  },
  {
    id: "classic",
    group: "The last card",
    title: "Then it becomes chess.",
    card: 0,
    color: "green",
    scenario: "last",
    task: "Play the last 2: move a2 to a3 and b2 to b3.",
    hint: "The last card finishes all of its actions before the game switches. Ordinary chess then uses one move per turn.",
    learned:
      "The deck is empty. Card colors and temporary blocks end; the position and controlled armies stay. You are ready to play.",
    focus: [8, 9],
    complete: (s) => s.mode === "classical",
  },
];
