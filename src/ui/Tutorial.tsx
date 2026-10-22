import { useEdgeBack } from "./useEdgeBack";
import { BrandMark } from "./Brand";
import { GuidedTutorial } from "./GuidedTutorial";
import { useState } from "react";
import { Localized, useLanguage, translate } from "./locale";
import { PracticeTable } from "./PracticeTable";
import { practiceCards } from "./learningCards";
import { practiceSetup } from "../domain/practice";
import { colors } from "../domain/cards";
import { colorNames, type UnoColor } from "../domain/types";
export function Tutorial({
  onHome,
  onPlay = onHome,
}: {
  onHome: () => void;
  onPlay?: () => void;
}) {
  const { language } = useLanguage();
  const [page, setPage] = useState<"hub" | "cards" | "guided" | "sandbox">(
    "hub",
  );
  const [index, setIndex] = useState(0),
    [info, setInfo] = useState(0),
    [color, setColor] = useState<UnoColor>("green"),
    [revision, setRevision] = useState(0);
  const [draft, setDraft] = useState(() => practiceSetup().pieces);
  const back = () => setPage("hub");
  useEdgeBack(page === "hub" ? onHome : back, page !== "guided");
  if (page === "guided")
    return <GuidedTutorial onBack={back} onPlay={onPlay} />;
  if (page === "hub")
    return (
      <Localized>
        <main className="learn-page learn-hub">
          <header>
            <button className="quiet" onClick={onHome}>
              <BrandMark />← Home
            </button>
            <h1>Learn the chaos.</h1>
          </header>
          <section className="learn-hub-options">
            <button className="primary" onClick={() => setPage("guided")}>
              <strong>Guided tutorial</strong>
              <span>One challenge at a time. You play, we guide.</span>
            </button>
            <button onClick={() => setPage("cards")}>
              <strong>Card lab</strong>
              <span>See every card. Try every effect.</span>
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
  const card = practiceCards[index];
  const sentences = translate(card.text, language).match(
    /[^.!?]+[.!?]+|[^.!?]+$/g,
  ) ?? [card.text];
  return (
    <Localized>
      <main className={`learn-page learn-${page}`}>
        <header>
          <button className="quiet" onClick={back}>
            <BrandMark />← Tutorial
          </button>
          <h1>{page === "cards" ? "Card lab" : "Sandbox"}</h1>
        </header>
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
            <section className="learn-card-info" aria-label="Card explanation">
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
        <PracticeTable
          key={`${page}-${index}-${color}-${revision}`}
          cardIndex={index}
          color={color}
          sandbox={page === "sandbox"}
          initialPieces={page === "sandbox" ? draft : undefined}
          onPositionChange={page === "sandbox" ? setDraft : undefined}
        />
        <footer>
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
        </footer>
      </main>
    </Localized>
  );
}
