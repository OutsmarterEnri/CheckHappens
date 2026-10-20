import type { Army, Move, State } from "../domain/types";
export interface ChessEngineAdapter {
  legalMoves(state: State, army: Army): Move[];
  inCheck(state: State, army: Army): boolean;
  apply(state: State, move: Move): void;
  positionKey(state: State): string;
  canPossiblyMate(state: State, army: Army): boolean;
  deadPosition(state: State): boolean;
}
