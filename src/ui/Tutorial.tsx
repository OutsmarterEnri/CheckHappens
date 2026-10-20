import { useState } from "react";
import { PieceIcon } from "./PieceIcon";
import { squareName, type UnoColor } from "../domain/types";
import { colors } from "../domain/cards";
import { colorNames } from "../domain/types";
const lessons = [
  [
    "One card. More moves.",
    "A 2 gives two moves with different pieces. Tap the pawn on a2, then a3.",
  ],
  [
    "These ghosts are friends.",
    "A +2 or +4 revives lost pieces. Tap the ghost rook on a1 to bring it back.",
  ],
  [
    "Color changes everything.",
    "A Wild opens a quick color choice. Tap a color. The frame remembers its effect.",
  ],
  [
    "Reverse!",
    "Armies and clocks swap. Tap Reverse and watch the board spin. You now control the other army.",
  ],
  [
    "Your turn to make it happen.",
    "The banner tells you who acts next. Giving check ends a turn. Under check, defend before drawing. Checkmate allows one emergency card while the deck lasts.",
  ],
];
export function Tutorial({ onHome }: { onHome: () => void }) {
  const [step, setStep] = useState(0),
    [selected, setSelected] = useState(false),
    [pawn, setPawn] = useState(8),
    [revived, setRevived] = useState(false),
    [color, setColor] = useState<UnoColor | null>(null),
    [flipped, setFlipped] = useState(false);
  const advance = () => {
    setStep((n) => n + 1);
    setSelected(false);
  };
  const squares = Array.from({ length: 64 }, (_, i) =>
    flipped
      ? Math.floor(i / 8) * 8 + 7 - (i % 8)
      : (7 - Math.floor(i / 8)) * 8 + (i % 8),
  );
  return (
    <main className="tutorial-screen">
      <button className="quiet" onClick={onHome}>
        ← Home
      </button>
      <div className="section-top">
        <h1>Let’s try it together.</h1>
        <span>{step + 1} / 5</span>
      </div>
      <div className="tutorial-progress">
        {lessons.map((_, i) => (
          <span className={i <= step ? "done" : ""} key={i} />
        ))}
      </div>
      <h2>{lessons[step][0]}</h2>
      <p>{lessons[step][1]}</p>
      <div
        className={`board-frame tutorial-board color-${color ?? "neutral"} ${flipped ? "reverse-enter" : ""}`}
      >
        <div className="board">
          {squares.map((sq, i) => {
            const ghost = step === 1 && sq === 0 && !revived;
            return (
              <button
                key={sq}
                className={`square ${((sq % 8) + Math.floor(sq / 8)) % 2 ? "light" : "dark"} ${sq === pawn && selected ? "selected" : ""} ${ghost ? "hologram" : ""} ${step === 0 && selected && sq === 16 ? "possible" : ""}`}
                aria-label={`${squareName(sq)}${ghost ? ", ghost Rook" : sq === pawn ? ", Pawn" : ""}`}
                onClick={() => {
                  if (step === 0 && sq === pawn) setSelected(true);
                  else if (step === 0 && selected && sq === 16) {
                    setPawn(16);
                    advance();
                  } else if (ghost) {
                    setRevived(true);
                    advance();
                  }
                }}
              >
                {i % 8 === 0 && (
                  <span className="rank">{Math.floor(sq / 8) + 1}</span>
                )}
                {i >= 56 && <span className="file">{"abcdefgh"[sq % 8]}</span>}
                {sq === pawn && <PieceIcon type="p" army="w" />}
                {sq === 0 && (ghost || revived) && (
                  <PieceIcon type="r" army="w" />
                )}
                {(sq === 4 || sq === 60) && (
                  <PieceIcon type="k" army={sq === 4 ? "w" : "b"} />
                )}{" "}
                {step === 0 && selected && sq === 16 && (
                  <span className="move-dot" />
                )}
              </button>
            );
          })}
        </div>
      </div>
      {step === 2 && (
        <div className="tutorial-color-choices color-choices">
          {colors.map((c) => (
            <button
              key={c}
              className={`color-choice ${c}`}
              onClick={() => {
                setColor(c);
                advance();
              }}
            >
              {colorNames[c]}
            </button>
          ))}
        </div>
      )}
      {step === 3 && (
        <button
          className="primary"
          onClick={() => {
            setFlipped(true);
            advance();
          }}
        >
          Reverse ↻
        </button>
      )}
      {step === 4 && (
        <>
          <div className="turn-banner" role="status">
            <strong>YOUR TURN!</strong>
            <span>Player 1 · new army</span>
          </div>
          <details>
            <summary>Risk and colors, quickly</summary>
            <p>
              The first 4 moves are safe. From the fifth: 20%, 40%, 60%, 80%,
              99%. You may pass, except for required yellow bonuses. Red takes 3
              seconds from your opponent; green gives you 3; blue halves the
              risk on moves 5 and 6; yellow adds one move per capture. The king
              cannot be used from move 5 onward.
            </p>
          </details>
          <button className="primary" onClick={onHome}>
            Got it. Let’s play! →
          </button>
        </>
      )}
      <small>Practice without a clock. Your saved match is unchanged.</small>
    </main>
  );
}
