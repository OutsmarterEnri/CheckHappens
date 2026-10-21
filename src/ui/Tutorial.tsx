import { Localized } from "./locale";
import { useState } from "react";
import { PieceCracks } from "./PieceEffects";
import { risk } from "../domain/cards";
import { PieceIcon } from "./PieceIcon";
import { squareName, type UnoColor } from "../domain/types";
import { colors } from "../domain/cards";
import { colorNames } from "../domain/types";
const cards = [
  {
    label: "Safe 2",
    symbol: "2",
    color: "green",
    title: "Two moves, zero break risk.",
    text: "Move two different pieces. Both moves are required and safe. The king may move if the move is legal.",
  },
  {
    label: "Risky 7",
    symbol: "7",
    color: "red",
    title: "Four safe moves. Then a choice.",
    text: "A 7 grants seven moves with different pieces. Moves 1–4 are required and safe. From move 5, pieces may break after moving. You may pass unless a yellow capture bonus is still required. The king cannot move from move 5 onward, even with Blue.",
  },
  {
    label: "+2",
    symbol: "+2",
    color: "yellow",
    title: "Bring your team back.",
    text: "Revive up to two eligible lost pieces on their free original squares. Choose as many as possible. With no eligible pieces, continue to the optional move.",
  },
  {
    label: "+4",
    symbol: "+4",
    color: "neutral",
    title: "A color and a comeback.",
    text: "Choose a color, then revive up to four eligible lost pieces on their free original squares. It does not mean drawing four cards.",
  },
  {
    label: "Wild",
    symbol: "Wild",
    color: "neutral",
    title: "Choose. Evolve. Surprise.",
    text: "Choose the active color, then evolve an eligible pawn into a rook, bishop or knight. No queen. With no eligible pawn, continue to the optional move.",
  },
  {
    label: "Skip",
    symbol: "Skip",
    color: "red",
    title: "Chain an enemy piece.",
    text: "Choose an eligible enemy piece to freeze for its next controller’s turn. Kings are immune. A frozen piece still attacks squares: it can still give check.",
  },
  {
    label: "Reverse",
    symbol: "Reverse",
    color: "blue",
    title: "The other army is yours.",
    text: "Swap armies and remaining clocks, rotate the board, then play the received army with the newly drawn color. Your opponent starts a normal turn afterward.",
  },
  {
    label: "Reset 0",
    symbol: "0",
    color: "green",
    title: "Home, surviving pieces!",
    text: "Return surviving non-pawn pieces to their original squares. Pawns stay put. Reset does not revive lost pieces; occupied home squares follow the game’s collision rules.",
  },
];
const lessonCards = [0, 2, 4, 6, 1];
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
    [flipped, setFlipped] = useState(false),
    [browsedCard, setBrowsedCard] = useState<number | null>(null),
    [riskMove, setRiskMove] = useState(5);
  const cardIndex = browsedCard ?? lessonCards[step];
  const preview = cards[cardIndex];
  const percent = Math.round(risk(riskMove, "red") * 100);
  const advance = () => {
    setStep((n) => n + 1);
    setSelected(false);
    setBrowsedCard(null);
  };
  const squares = Array.from({ length: 64 }, (_, i) =>
    flipped
      ? Math.floor(i / 8) * 8 + 7 - (i % 8)
      : (7 - Math.floor(i / 8)) * 8 + (i % 8),
  );
  return (
    <Localized>
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
        <section className="tutorial-card-lab" aria-label="Explore the cards">
          <h2>Meet your cards.</h2>
          <div
            className="tutorial-card-picker"
            role="group"
            aria-label="Card examples"
          >
            {cards.map((card, i) => (
              <button
                key={card.label}
                aria-pressed={i === cardIndex}
                onClick={() => setBrowsedCard(i)}
              >
                {card.label}
              </button>
            ))}
          </div>
          <div className="tutorial-card-preview" aria-live="polite">
            <div
              className={`mini-card tutorial-big-card ${preview.color}`}
              aria-label={`Card ${preview.symbol}`}
            >
              <strong>{preview.symbol}</strong>
            </div>
            <div>
              <h3>{preview.title}</h3>
              <p>{preview.text}</p>
            </div>
          </div>
          {cardIndex === 1 && (
            <div className="tutorial-risk-demo">
              <div role="group" aria-label="Move risk examples">
                {[1, 4, 5, 6, 7, 8, 9].map((n) => (
                  <button
                    key={n}
                    aria-pressed={riskMove === n}
                    onClick={() => setRiskMove(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="tutorial-risk-result" role="status">
                <span className="tutorial-risk-piece">
                  <PieceIcon type="n" army="w" />
                  {percent > 0 && <PieceCracks percent={percent} />}
                </span>
                <strong>{`Move ${riskMove}: ${percent}% break risk`}</strong>
              </div>
              <p>
                The fifth move has 20% risk, then 40%, 60%, 80% and 99%. Blue
                halves only moves 5 and 6 to 10% and 20%. Risk follows the move
                index, not the number printed on the card.
              </p>
              <p className="tutorial-king-rule">
                The king cannot move from move 5 onward. Choose another unused
                piece or pass when allowed.
              </p>
              <small>Preview only: no random roll is made here.</small>
            </div>
          )}
          {cardIndex > 1 && (
            <p>
              Special cards normally leave one optional move after their effect.
              A defense made before drawing consumes that optional move.
            </p>
          )}
        </section>
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
                  {i >= 56 && (
                    <span className="file">{"abcdefgh"[sq % 8]}</span>
                  )}
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
            <section
              className="tutorial-color-guide"
              aria-label="Color effects"
            >
              <h2>Four colors. Four powers.</h2>
              <p>
                Red takes 3 seconds from your opponent. Green adds 3 seconds to
                your clock. Blue halves break risk on moves 5 and 6. Yellow
                grants a required extra move after a capture, using another
                available piece.
              </p>
              <p>
                Under check, defend with the previous color before drawing. This
                defense does not spend the numbered card’s moves, but consumes a
                special card’s optional move. In checkmate, draw an emergency
                card, change color and resolve its effects as a full turn, then
                evaluate the position.
              </p>
            </section>
            <details>
              <summary>Risk and colors, quickly</summary>
              <p>
                The first 4 moves are safe. From the fifth: 20%, 40%, 60%, 80%,
                99%. You may pass, except for required yellow bonuses. Red takes
                3 seconds from your opponent; green gives you 3; blue halves the
                risk on moves 5 and 6; yellow adds one move per capture. The
                king cannot be used from move 5 onward.
              </p>
            </details>
            <button className="primary" onClick={onHome}>
              Got it. Let’s play! →
            </button>
          </>
        )}
        <small>Practice without a clock. Your saved match is unchanged.</small>
      </main>
    </Localized>
  );
}
