import { useState } from "react";
import { Localized, useLanguage, translate } from "./locale";
import { PracticeTable } from "./PracticeTable";
import { practiceCards } from "./learningCards";
import { practiceSetup } from "../domain/practice";
import { colors } from "../domain/cards";
import { colorNames, type UnoColor } from "../domain/types";
const chapters = [
  {
    title: "One card. More moves.",
    text: "A 2 means two required moves with different pieces. Tap a2, then a3. Move b2 next: the other player receives the next card.",
    card: 0,
    color: "green",
  },
  {
    title: "Four safe moves. Then a choice.",
    text: "This lesson starts at move 5 of a 7. Try a pawn: it has 20% break risk. The king has no legal destination. Pass ends optional moves.",
    card: 1,
    color: "red",
  },
  {
    title: "Blue changes the odds.",
    text: "Try the same fifth move with Blue: risk falls to 10%. Move 6 is 20%. Later moves keep their usual risk. The king remains unavailable.",
    card: 1,
    color: "blue",
  },
  {
    title: "Red and Green change time.",
    text: "Make a move with Red and watch P2 lose 3 seconds. In the card lab, choose Green to add 3 seconds to your own clock. Practice clocks never tick.",
    card: 0,
    color: "red",
  },
  {
    title: "Yellow captures keep you going.",
    text: "Move the rook from b1 to b3 to capture. Yellow adds one required move with a different available piece. You cannot pass while this bonus is owed.",
    card: 0,
    color: "yellow",
    scenario: "yellow",
  },
  {
    title: "These ghosts are friends.",
    text: "Tap Try card. Revive two pieces by tapping their glowing original squares. You must revive as many eligible pieces as the card allows, then may move or pass.",
    card: 2,
    color: "yellow",
  },
  {
    title: "A color and a comeback.",
    text: "Try +4, choose Blue, then tap four glowing home squares. This revives pieces; it does not draw four cards. The chosen color persists for your moves.",
    card: 3,
    color: "blue",
  },
  {
    title: "Choose. Evolve. Surprise.",
    text: "Try Wild, choose a color, tap a pawn and choose rook, bishop or knight. Evolution is not an ordinary move. A queen is not offered.",
    card: 4,
    color: "green",
  },
  {
    title: "Chain an enemy piece.",
    text: "Try Skip, then tap an enemy pawn. It cannot move during its next controller’s turn, but still attacks squares. Kings cannot be chained.",
    card: 5,
    color: "red",
  },
  {
    title: "The other army is yours.",
    text: "Try Reverse. Notice the board, armies and unequal clocks swap. You keep the newly drawn Blue and may move the received army. Player identities do not swap.",
    card: 6,
    color: "blue",
  },
  {
    title: "Home, surviving pieces!",
    text: "The rook starts away from home. Try Reset and watch it return to a1. Pawns stay put. Lost pieces stay lost; occupied home squares use collision rules.",
    card: 7,
    color: "green",
  },
  {
    title: "Defend before drawing.",
    text: "White is in check. Try card, then move the king from e1 to d1. Defense uses the old Red before drawing Green and does not spend the new numbered budget.",
    card: 0,
    color: "red",
    scenario: "defense",
  },
  {
    title: "Checkmate gets an emergency.",
    text: "White starts in checkmate. Try card: the emergency Reset changes color and resolves its effect before the position is evaluated. It starts a full emergency turn.",
    card: 7,
    color: "green",
    scenario: "emergency",
  },
  {
    title: "Your turn to make it happen.",
    text: "Giving check ends your current turn. When the deck runs out, classic chess begins after the last effect finishes. You can revisit any lesson or build a position in Sandbox.",
    card: 0,
    color: "green",
  },
] as const;
export function Tutorial({ onHome }: { onHome: () => void }) {
  const { language } = useLanguage();
  const [page, setPage] = useState<"hub" | "cards" | "guided" | "sandbox">(
    "hub",
  );
  const [index, setIndex] = useState(0),
    [chapter, setChapter] = useState(0),
    [info, setInfo] = useState(0),
    [color, setColor] = useState<UnoColor>("green"),
    [revision, setRevision] = useState(0);
  const [draft, setDraft] = useState(() => practiceSetup().pieces);
  const back = () => setPage("hub");
  if (page === "hub")
    return (
      <Localized>
        <main className="learn-page learn-hub">
          <header>
            <button className="quiet" onClick={onHome}>
              ← Home
            </button>
            <h1>Let’s try it together.</h1>
          </header>
          <section className="learn-hub-options">
            <button onClick={() => setPage("cards")}>
              <strong>Card lab</strong>
              <span>See every card. Try every effect.</span>
            </button>
            <button onClick={() => setPage("guided")}>
              <strong>Guided tutorial</strong>
              <span>14 short lessons, real game rules.</span>
            </button>
            <button onClick={() => setPage("sandbox")}>
              <strong>Sandbox</strong>
              <span>Place pieces. Change cards. Experiment.</span>
            </button>
          </section>
          <footer>
            Practice without a clock. Your saved match is unchanged.
          </footer>
        </main>
      </Localized>
    );
  const lesson = chapters[chapter],
    card = practiceCards[index];
  const sentences = translate(card.text, language).match(
    /[^.!?]+[.!?]+|[^.!?]+$/g,
  ) ?? [card.text];
  return (
    <Localized>
      <main className={`learn-page learn-${page}`}>
        <header>
          <button className="quiet" onClick={back}>
            ← Tutorial
          </button>
          <h1>
            {page === "cards"
              ? "Card lab"
              : page === "guided"
                ? "Guided tutorial"
                : "Sandbox"}
          </h1>
        </header>
        {page === "guided" ? (
          <section className="learn-explanation" aria-live="polite">
            <h2>{lesson.title}</h2>
            <p>{lesson.text}</p>
          </section>
        ) : (
          <>
            <div className="learn-selectors">
              <label>
                Card
                <select
                  aria-label="Card example"
                  value={index}
                  onChange={(e) => {
                    setIndex(Number(e.target.value));
                    setInfo(0);
                  }}
                >
                  {practiceCards.map((c, i) => (
                    <option key={c.label} value={i}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Color
                <select
                  aria-label="Practice color"
                  value={color}
                  onChange={(e) => setColor(e.target.value as UnoColor)}
                >
                  {colors.map((c) => (
                    <option key={c} value={c}>
                      {colorNames[c]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {page === "cards" ? (
              <section
                className="learn-card-info"
                aria-label="Card explanation"
              >
                <div
                  className={`mini-card ${["draw4", "wild"].includes(["number", "number", "draw2", "draw4", "wild", "skip", "reverse", "reset"][index]) ? "neutral" : color}`}
                >
                  <strong>{card.symbol}</strong>
                </div>
                <div aria-live="polite">
                  <p>{sentences[info]}</p>
                  <button
                    className="quiet"
                    onClick={() => setInfo((info + 1) % sentences.length)}
                  >
                    More detail{" "}
                    <span>
                      {info + 1}/{sentences.length}
                    </span>{" "}
                    →
                  </button>
                </div>
              </section>
            ) : (
              <p className="learn-sandbox-note">
                Place pieces, then test with real rules. White starts.
              </p>
            )}
          </>
        )}
        <PracticeTable
          key={`${page}-${page === "guided" ? chapter : index}-${color}-${revision}`}
          cardIndex={page === "guided" ? lesson.card : index}
          color={page === "guided" ? lesson.color : color}
          scenario={
            page === "guided" && "scenario" in lesson ? lesson.scenario : "card"
          }
          sandbox={page === "sandbox"}
          initialPieces={page === "sandbox" ? draft : undefined}
          onPositionChange={page === "sandbox" ? setDraft : undefined}
        />
        <footer>
          {page === "guided" ? (
            <>
              <button
                disabled={chapter === 0}
                onClick={() => setChapter(chapter - 1)}
              >
                ← Previous
              </button>
              <span>{chapter + 1}/14</span>
              <button
                className="primary"
                onClick={() =>
                  chapter === 13 ? back() : setChapter(chapter + 1)
                }
              >
                {chapter === 13 ? "Finish" : "Next →"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  if (page === "sandbox") setDraft(practiceSetup().pieces);
                  setRevision(revision + 1);
                }}
              >
                Reset example
              </button>
              <small>Separate practice · no saved match changes</small>
              {page === "cards" && (
                <button
                  onClick={() => {
                    setIndex((index + 1) % practiceCards.length);
                    setInfo(0);
                  }}
                >
                  Next card →
                </button>
              )}
            </>
          )}
        </footer>
      </main>
    </Localized>
  );
}
