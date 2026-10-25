import { MenuIcon } from "./MenuUI";
import { useEdgeBack } from "./useEdgeBack";
import { BrandMark } from "./Brand";
import {
  tutorialCourses,
  LEARNING_PROGRESS_KEY,
  validLearningProgress,
} from "../domain/tutorial";
import { readPreference } from "./preferences";
import { GuidedTutorial } from "./GuidedTutorial";
import { useState } from "react";
import { Localized, useLanguage, translate } from "./locale";
import { PracticeTable } from "./PracticeTable";
import { practiceCards } from "./learningCards";
import { practiceSetup, practiceCard } from "../domain/practice";
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
  const [page, setPage] = useState<
    "hub" | "cards" | "chess" | "variant" | "sandbox"
  >("hub");
  const [index, setIndex] = useState(0),
    [info, setInfo] = useState(0),
    [color, setColor] = useState<UnoColor>("green"),
    [revision, setRevision] = useState(0);
  const [draft, setDraft] = useState(() => practiceSetup().pieces);
  const back = () => setPage("hub");
  useEdgeBack(
    page === "hub" ? onHome : back,
    page !== "chess" && page !== "variant",
  );
  if (page === "chess" || page === "variant")
    return (
      <GuidedTutorial
        key={page}
        courseId={page}
        onBack={back}
        onPlay={onPlay}
        onCourse={setPage}
      />
    );
  if (page === "hub") {
    const done = validLearningProgress(
      readPreference(LEARNING_PROGRESS_KEY, []),
    );
    return (
      <Localized>
        <main className="learn-page learn-hub menu-v3 academy-hub">
          <header>
            <button className="quiet" onClick={onHome}>
              <BrandMark />← Home
            </button>
            <h1>Learn by playing.</h1>
          </header>
          <div className="academy-welcome">
            <BrandMark />
            <p>Two short paths. A real board. No ticking clock.</p>
          </div>
          <section className="learn-hub-options academy-courses">
            {(["chess", "variant"] as const).map((id, i) => {
              const course = tutorialCourses[id],
                count = course.lessons.filter((l) =>
                  done.includes(l.id),
                ).length;
              return (
                <button
                  key={id}
                  className={id === "chess" ? "primary" : ""}
                  data-course-link={id}
                  onClick={() => setPage(id)}
                >
                  <span className="hub-choice-icon">
                    <MenuIcon kind={id === "chess" ? "play" : "cards"} />
                  </span>
                  <strong>{course.title[language]}</strong>
                  <span>{course.description[language]}</span>
                  <small className="academy-course-progress">
                    <span>
                      {i + 1} · {course.lessons.length} <span>lessons</span>
                    </span>
                    <span>
                      {count}/{course.lessons.length}
                    </span>
                  </small>
                </button>
              );
            })}
          </section>
          <section className="academy-tools" aria-label="Free practice">
            <span>Explore freely</span>
            <div>
              <button onClick={() => setPage("cards")}>
                <MenuIcon kind="cards" />
                Card lab
              </button>
              <button onClick={() => setPage("sandbox")}>
                <MenuIcon kind="settings" />
                Sandbox
              </button>
            </div>
          </section>
          <footer>Start with chess, or jump straight to the cards.</footer>
        </main>
      </Localized>
    );
  }
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
                className={`mini-card ${practiceCard(index, color).color ?? "neutral"}`}
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
