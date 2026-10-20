export type Army = "w" | "b";
export type Player = "P1" | "P2";
export type UnoColor = "red" | "green" | "blue" | "yellow";
export type PieceType = "p" | "n" | "b" | "r" | "q" | "k";
export type Square = number; // a1 = 0, h8 = 63
export interface Piece {
  id: string;
  army: Army;
  original: PieceType;
  type: PieceType;
  home: Square;
  square: Square | null;
  moved: boolean;
  blocked: boolean;
  blockedAtTurn?: number;
  death?: "capture" | "risk" | "reset";
}
export interface EnPassant {
  pawnId: string;
  target: Square;
  eligibleArmy: Army;
  expiresAfterTurn: number;
}
export type CardKind =
  "number" | "reset" | "skip" | "reverse" | "draw2" | "wild" | "draw4";
export interface Card {
  id: string;
  kind: CardKind;
  color: UnoColor | null;
  value?: number;
}
export type Phase =
  | "READY"
  | "TURN_START"
  | "PRE_DRAW_DEFENSE"
  | "DRAW"
  | "CHOOSE_COLOR"
  | "RESOLVE_EFFECT"
  | "CHOOSE_TARGETS"
  | "RESOLVE_MOVES"
  | "EMERGENCY_DRAW"
  | "STALEMATE_RESCUE"
  | "TURN_END"
  | "GAME_OVER";
export interface Outcome {
  winner: Player | null;
  reason: string;
}
export interface GameEvent {
  seq: number;
  type: string;
  text: string;
  data: Record<string, unknown>;
}
export interface ClockState {
  remaining: Record<Player, number>;
  lastAt: number;
}
export interface Move {
  from: Square;
  to: Square;
  pieceId: string;
  captureId?: string;
  promotion?: Exclude<PieceType, "p" | "k">;
  castleRook?: string;
  rookTo?: Square;
  cost: number;
}
export interface State {
  journal?: import("./audit").Journal;
  version: 1;
  initialMinutes?: 4 | 7 | 10;
  pieces: Piece[];
  control: Record<Player, Army>;
  active: Player;
  orientation: Army;
  mode: "uno" | "classical";
  phase: Phase;
  turn: number;
  deck: Card[];
  deckIndex: number;
  discards: Card[];
  rng: number;
  seed: number;
  color: UnoColor | null;
  current: Card | null;
  used: string[];
  preDefense: boolean;
  specialConsumed: boolean;
  budget: number;
  optionalSpecial: boolean;
  moveIndex: number;
  yellow: number;
  rescue: "mate" | "stalemate" | null;
  transitionPending: boolean;
  ep: EnPassant[];
  clock: ClockState;
  outcome: Outcome | null;
  events: GameEvent[];
  halfmoves: number;
  repetitions: Record<string, number>;
}
export type Command =
  | { type: "StartGame" }
  | {
      type: "SubmitMove";
      from: Square;
      to: Square;
      promotion?: "q" | "r" | "b" | "n";
    }
  | { type: "ChooseUnoColor"; color: UnoColor }
  | { type: "ChooseSkipTarget"; pieceId: string }
  | { type: "ChooseResurrections"; pieceIds: string[] }
  | { type: "ChooseEvolution"; pieceId: string; pieceType: "r" | "b" | "n" }
  | { type: "EndOptionalMoves" }
  | { type: "AdvanceTime" };
export type ErrorCode =
  | "WRONG_PHASE"
  | "ILLEGAL_MOVE"
  | "INVALID_CHOICE"
  | "MANDATORY_ACTION"
  | "GAME_OVER"
  | "INVALID_TIME";
export interface DomainError {
  code: ErrorCode;
  message: string;
}
export type Result =
  { ok: true; state: State } | { ok: false; state: State; error: DomainError };
export const otherArmy = (a: Army): Army => (a === "w" ? "b" : "w");
export const otherPlayer = (p: Player): Player => (p === "P1" ? "P2" : "P1");
export const squareName = (s: number) =>
  "abcdefgh"[s % 8] + (Math.floor(s / 8) + 1);
export const square = (name: string) =>
  "abcdefgh".indexOf(name[0]) + (Number(name[1]) - 1) * 8;
export const colorNames: Record<UnoColor, string> = {
  red: "Red",
  green: "Green",
  blue: "Blue",
  yellow: "Yellow",
};
export const pieceNames: Record<PieceType, string> = {
  p: "Pawn",
  n: "Knight",
  b: "Bishop",
  r: "Rook",
  q: "Queen",
  k: "King",
};
