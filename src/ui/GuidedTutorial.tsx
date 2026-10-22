import { BrandMark } from "./Brand";
import { useCallback, useMemo, useState } from "react";
import { tutorialMissions, tutorialCardView } from "../domain/tutorial";
import type { State } from "../domain/types";
import { practiceSetup } from "../domain/practice";
import { cardLabel } from "../domain/cards";
import { PracticeTable } from "./PracticeTable";
import { Localized } from "./locale";
export function GuidedTutorial({
  onBack,
  onPlay,
}: {
  onBack: () => void;
  onPlay: () => void;
}) {
  const [index, setIndex] = useState(0),
    [complete, setComplete] = useState(false),
    [hint, setHint] = useState(false),
    [finished, setFinished] = useState(false),
    [needsRetry, setNeedsRetry] = useState(false),
    [observed, setObserved] = useState<State | null>(null);
  const mission = tutorialMissions[index];
  const initial = useMemo(
    () => practiceSetup(mission.card, mission.color, mission.scenario),
    [index],
  );
  const view = tutorialCardView(
    observed ?? initial,
    mission.scenario === "defense",
  );
  const observe = useCallback(
    (state: State) => {
      setObserved(state);
      const done = tutorialMissions[index].complete(state);
      setComplete(done);
      setNeedsRetry(
        !done &&
          (!!state.outcome || state.events.some((e) => e.type === "TurnEnded")),
      );
    },
    [index],
  );
  const go = (next: number) => {
    setComplete(false);
    setHint(false);
    setNeedsRetry(false);
    setObserved(null);
    setIndex(next);
  };
  if (finished)
    return (
      <Localized>
        <main className="learn-page coach-finish">
          <header>
            <button onClick={onBack}>
              <BrandMark />← Tutorial
            </button>
          </header>
          <section>
            <div className="coach-trophy" aria-hidden="true">
              ♔
            </div>
            <h1>You know the chaos.</h1>
            <p>
              You played through cards, colors, break risk and king emergencies.
              Your first match can begin.
            </p>
            <button className="primary" onClick={onPlay}>
              Ready to play →
            </button>
            <button
              onClick={() => {
                setFinished(false);
                go(0);
              }}
            >
              Play the lessons again
            </button>
            <button onClick={onBack}>Explore cards and Sandbox</button>
          </section>
          <footer>No clock. No penalties. Your saved match is safe.</footer>
        </main>
      </Localized>
    );
  return (
    <Localized>
      <main className="learn-page coach-page" data-mission={mission.id}>
        <header>
          <button className="quiet" onClick={onBack}>
            <BrandMark />← Tutorial
          </button>
          <span className="coach-stage">{mission.group}</span>
          <span>
            {index + 1}/{tutorialMissions.length}
          </span>
        </header>
        <div
          className="coach-progress"
          role="progressbar"
          aria-label="Tutorial progress"
          aria-valuemin={0}
          aria-valuemax={tutorialMissions.length}
          aria-valuenow={index + (complete ? 1 : 0)}
        >
          {tutorialMissions.map((m, i) => (
            <span
              key={m.id}
              className={i < index || (i === index && complete) ? "done" : ""}
            />
          ))}
        </div>
        <section
          className={`coach-brief ${complete ? "coach-success" : ""}`}
          aria-live="polite"
        >
          <div
            className={`mini-card ${view.card?.color ?? "neutral"}`}
            role="img"
            data-card-kind={view.card?.kind ?? "hidden"}
            data-card-value={view.card?.value}
            aria-label={
              view.card
                ? `${cardLabel(view.card)} · ${view.drawn ? "Card drawn" : "Next card"}`
                : "Card not drawn yet"
            }
          >
            <strong>{view.card ? cardLabel(view.card) : "?"}</strong>
            <small className="coach-card-caption">
              {view.drawn
                ? "Card drawn"
                : view.card
                  ? "Next card"
                  : "Defend first"}
            </small>
          </div>
          <div>
            <h1>{complete ? "You did it!" : mission.title}</h1>
            <p>
              {complete
                ? mission.learned
                : needsRetry
                  ? "That turn ended before the goal. Tap Retry for a fresh attempt."
                  : hint
                    ? mission.hint
                    : mission.task}
            </p>
          </div>
        </section>
        <PracticeTable
          key={mission.id}
          cardIndex={mission.card}
          color={mission.color}
          scenario={mission.scenario ?? "card"}
          guided
          startAtRisk={mission.id === "pass" || mission.id === "blue"}
          onSnapshot={observe}
          locked={complete}
          focusSquares={mission.focus}
        />
        <footer>
          <button disabled={index === 0} onClick={() => go(index - 1)}>
            ← Previous
          </button>
          <button
            aria-pressed={hint}
            disabled={complete}
            onClick={() => setHint(!hint)}
          >
            {hint ? "Show task" : "Hint"}
          </button>
          <button
            className="primary"
            disabled={!complete}
            onClick={() =>
              index === tutorialMissions.length - 1
                ? setFinished(true)
                : go(index + 1)
            }
          >
            {index === tutorialMissions.length - 1 ? "Finish" : "Next →"}
          </button>
        </footer>
      </main>
    </Localized>
  );
}
