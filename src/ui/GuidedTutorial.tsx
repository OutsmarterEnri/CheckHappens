import { useCallback, useState } from "react";
import { tutorialMissions } from "../domain/tutorial";
import type { State } from "../domain/types";
import { practiceCards } from "./learningCards";
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
    [needsRetry, setNeedsRetry] = useState(false);
  const mission = tutorialMissions[index];
  const observe = useCallback(
    (state: State) => {
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
    setIndex(next);
  };
  if (finished)
    return (
      <Localized>
        <main className="learn-page coach-finish">
          <header>
            <button onClick={onBack}>← Tutorial</button>
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
            ← Tutorial
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
            className={`mini-card ${mission.card === 3 || mission.card === 4 ? "neutral" : mission.color}`}
            aria-hidden="true"
          >
            <strong>{practiceCards[mission.card].symbol}</strong>
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
