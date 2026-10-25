import { useEdgeBack } from "./useEdgeBack";
import { BrandMark } from "./Brand";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  tutorialCourses,
  tutorialCardView,
  LEARNING_PROGRESS_KEY,
  validLearningProgress,
  type CourseId,
} from "../domain/tutorial";
import type { State } from "../domain/types";
import { cardLabel } from "../domain/cards";
import { PracticeTable } from "./PracticeTable";
import { PieceIcon } from "./PieceIcon";
import { Localized, useLanguage } from "./locale";
import { readPreference, writePreference } from "./preferences";
export function GuidedTutorial({
  courseId,
  onBack,
  onPlay,
  onCourse,
}: {
  courseId: CourseId;
  onBack: () => void;
  onPlay: () => void;
  onCourse: (course: CourseId) => void;
}) {
  const { language } = useLanguage(),
    course = tutorialCourses[courseId];
  const [index, setIndex] = useState(() => {
    const done = validLearningProgress(
      readPreference(LEARNING_PROGRESS_KEY, []),
    );
    const next = course.lessons.findIndex((l) => !done.includes(l.id));
    return next < 0 ? 0 : next;
  });
  const [observed, setObserved] = useState<State | null>(null),
    [hint, setHint] = useState(false),
    [finished, setFinished] = useState(false);
  const [done, setDone] = useState(() =>
    validLearningProgress(readPreference(LEARNING_PROGRESS_KEY, [])),
  );
  const lesson = course.lessons[index];
  const lastStep = index === course.lessons.length - 1;
  const canFinish =
    lastStep &&
    course.lessons.every((l) => l.id === lesson.id || done.includes(l.id));
  const initial = useMemo(() => lesson.create(), [lesson]);
  const complete = observed !== null && lesson.complete(observed);
  const needsRetry =
    !complete &&
    !!observed &&
    (!!observed.outcome || observed.events.some((e) => e.type === "TurnEnded"));
  const observe = useCallback((state: State) => setObserved(state), [lesson]);
  const view = tutorialCardView(observed ?? initial, lesson.id === "defense");
  useEdgeBack(onBack);
  useEffect(() => {
    if (!complete) return;
    const persisted = validLearningProgress(
      readPreference(LEARNING_PROGRESS_KEY, []),
    );
    if (!persisted.includes(lesson.id)) {
      const next = [...persisted, lesson.id];
      writePreference(LEARNING_PROGRESS_KEY, next);
      setDone(next);
    }
  }, [complete, lesson.id]);
  const go = (next: number) => {
    setObserved(null);
    setHint(false);
    setIndex(next);
  };
  if (finished)
    return (
      <Localized>
        <main className="learn-page coach-finish academy-finish">
          <header>
            <button onClick={onBack}>
              <BrandMark />← Tutorial
            </button>
          </header>
          <section>
            <div className="academy-award">
              <PieceIcon type="k" army="w" />
            </div>
            <h1>
              {courseId === "chess"
                ? "The board makes sense now."
                : "Ready for a little chaos."}
            </h1>
            <p>
              {courseId === "chess"
                ? "You have moved every piece, escaped check and tried the special moves. Next, discover what the cards change."
                : "You have tried the cards, colors, risk and king rescues. Your first match does not need to be perfect."}
            </p>
            <button
              className="primary"
              onClick={() =>
                courseId === "chess" ? onCourse("variant") : onPlay()
              }
            >
              {courseId === "chess" ? "Next: Check Happens" : "Choose a match"}
            </button>
            <button
              onClick={() => {
                setFinished(false);
                go(0);
              }}
            >
              Replay this course
            </button>
            <button onClick={onBack}>Back to learning</button>
          </section>
          <footer>Your saved match is untouched.</footer>
        </main>
      </Localized>
    );
  return (
    <Localized>
      <main
        className={`learn-page coach-page academy-lesson ${courseId === "chess" ? "academy-chess" : "academy-variant"}`}
        data-mission={lesson.id}
        data-course={courseId}
      >
        <header>
          <button className="quiet" onClick={onBack}>
            <BrandMark />← Tutorial
          </button>
          <label className="academy-jump">
            <span className="sr-only">Lesson</span>
            <select
              aria-label="Choose a lesson"
              value={index}
              onChange={(e) => go(Number(e.target.value))}
            >
              {course.lessons.map((l, i) => (
                <option key={l.id} value={i}>
                  {i + 1}. {l.title[language]}
                </option>
              ))}
            </select>
          </label>
          <span>
            {index + 1}/{course.lessons.length}
          </span>
        </header>
        <div
          className="coach-progress"
          role="progressbar"
          aria-label="Tutorial progress"
          aria-valuemin={0}
          aria-valuemax={course.lessons.length}
          aria-valuenow={
            course.lessons.filter((l) => done.includes(l.id)).length
          }
        >
          {course.lessons.map((l, i) => (
            <span
              key={l.id}
              className={`${done.includes(l.id) ? "done" : ""} ${i === index ? "current" : ""}`}
            />
          ))}
        </div>
        <section
          className={`coach-brief academy-copy ${complete ? "coach-success" : ""}`}
          aria-live="polite"
        >
          {courseId === "chess" ? (
            <div className="academy-piece" aria-hidden="true">
              <PieceIcon type={lesson.piece ?? "k"} army="w" />
            </div>
          ) : (
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
            </div>
          )}
          <div>
            <h1>{complete ? "You did it!" : lesson.title[language]}</h1>
            <p>
              {complete
                ? lesson.learned[language]
                : needsRetry
                  ? "That move was legal, but it missed the goal. Tap Retry to try again."
                  : hint
                    ? lesson.hint[language]
                    : lesson.explanation[language]}
            </p>
          </div>
        </section>
        <p className="academy-task">
          <span>{complete ? "Lesson complete" : "Your goal"}</span>
          {complete ? "Continue when you are ready." : lesson.task[language]}
        </p>
        <PracticeTable
          key={lesson.id}
          initialState={initial}
          color="green"
          scenario={
            courseId === "chess"
              ? "chess"
              : lesson.id === "defense" || lesson.id === "emergency"
                ? lesson.id
                : "card"
          }
          guided
          startAtRisk={lesson.startAtRisk}
          onSnapshot={observe}
          locked={complete || needsRetry}
          focusSquares={lesson.focus}
        />
        <footer>
          <button disabled={index === 0} onClick={() => go(index - 1)}>
            ← Previous
          </button>
          <button
            aria-pressed={hint}
            disabled={complete || needsRetry}
            onClick={() => setHint(!hint)}
          >
            {hint ? "Show lesson" : "Hint"}
          </button>
          <button
            className="primary"
            disabled={!complete}
            onClick={() =>
              lastStep
                ? canFinish
                  ? setFinished(true)
                  : go(course.lessons.findIndex((l) => !done.includes(l.id)))
                : go(index + 1)
            }
          >
            {canFinish ? "Finish" : "Next →"}
          </button>
        </footer>
      </main>
    </Localized>
  );
}
