import type { Outcome } from "../domain/types";
import { PieceIcon } from "./PieceIcon";
export function MatchFinale({
  outcome,
  computer,
  winnerName,
  moves,
  onAgain,
  onReview,
  onExport,
}: {
  outcome: Outcome;
  computer: boolean;
  winnerName: string;
  moves: number;
  onAgain: () => void;
  onReview: () => void;
  onExport: () => void;
}) {
  const mood =
    outcome.winner === null
      ? "draw"
      : computer && outcome.winner === "P2"
        ? "lose"
        : "win";
  return (
    <div className={`modal-backdrop finale-stage ${mood}`}>
      <div className="curtain left" aria-hidden="true" />
      <div className="curtain right" aria-hidden="true" />
      <section
        className="modal finale"
        role="dialog"
        aria-modal="true"
        aria-labelledby="finale-title"
        aria-describedby="finale-reason"
      >
        <span className="eyebrow">AND THAT’S CHECK HAPPENS.</span>
        <div className="finale-emblem" aria-hidden="true">
          <span className="finale-rays" />
          <PieceIcon type={mood === "lose" ? "p" : "k"} army="w" />
          <span className="finale-spark s1">✦</span>
          <span className="finale-spark s2">✦</span>
        </div>
        <h2 id="finale-title">
          {mood === "draw"
            ? "PLOT TWIST!"
            : computer
              ? mood === "win"
                ? "YOU WIN!"
                : "YOU LOSE!"
              : `${winnerName.toUpperCase()} WINS!`}
        </h2>
        <p className="finale-line">
          {mood === "draw"
            ? "Nobody wins. Everybody has a story."
            : mood === "lose"
              ? "The cards had other plans. Rematch?"
              : "A little strategy. A lot of chaos."}
        </p>
        <p id="finale-reason" className="finale-reason">
          {outcome.winner === null ? "Draw" : `${winnerName} wins`} ·{" "}
          {outcome.reason}
        </p>
        <span className="finale-stat">
          {moves} moves. One unforgettable table.
        </span>
        <button className="primary" onClick={onAgain}>
          One more round <span aria-hidden="true">→</span>
        </button>
        <div className="finale-actions">
          <button onClick={onExport}>Save match JSON</button>
          <button onClick={onReview}>Review table</button>
        </div>
        <small>In Cards we trust</small>
      </section>
    </div>
  );
}
