import { PrivateRoom } from "./PrivateRoom";
import { themes, THEME_KEY, validTheme } from "./themes";
import { Localized, useLanguage } from "./locale";
import { useEffect, useState } from "react";
import { App } from "./App";
import { Tutorial } from "./Tutorial";
import { PieceIcon } from "./PieceIcon";
import { SAVE_KEY, restoreGame } from "./persistence";
import {
  MODE_KEY,
  PREFS_KEY,
  readPreference,
  writePreference,
  type OpponentMode,
  type Preferences,
} from "./preferences";
import {
  timeControls,
  botProfiles,
  type SidePreference,
  type Minutes,
  type BotLevel,
} from "../domain/match";
const MATCH_KEY = "check-happens-match";
export function Shell() {
  const [theme, setTheme] = useState(() =>
    validTheme(readPreference(THEME_KEY, "candy")),
  );
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute(
        "content",
        getComputedStyle(document.documentElement)
          .getPropertyValue("--app-background")
          .trim(),
      );
    writePreference(THEME_KEY, theme);
  }, [theme]);
  const { language, setLanguage } = useLanguage();
  const query = new URLSearchParams(location.search).get("play");
  const [screen, setScreen] = useState<
    "home" | "choose" | "game" | "tutorial" | "settings" | "private"
  >(
    query === "local" || query === "computer"
      ? "game"
      : new URLSearchParams(location.hash.slice(1)).has("invite")
        ? "private"
        : "home",
  );
  const [mode, setMode] = useState<OpponentMode>(
    query === "computer"
      ? "computer"
      : query === "local"
        ? "local"
        : readPreference(MODE_KEY, "local"),
  );
  const stored = readPreference<{
    minutes: number;
    level: string;
    side?: string;
  }>(MATCH_KEY, {
    minutes: 7,
    level: "easy",
  });
  const [minutes, setMinutes] = useState<Minutes>(
    [4, 7, 10].includes(stored.minutes) ? (stored.minutes as Minutes) : 7,
  );
  const [level, setLevel] = useState<BotLevel>(
    ["easy", "medium", "hard"].includes(stored.level)
      ? (stored.level as BotLevel)
      : "easy",
  );
  const [side, setSide] = useState<SidePreference>(
    stored.side === "black" || stored.side === "random" ? stored.side : "white",
  );
  const [autoStart, setAutoStart] = useState(false);
  const [prefs, setPrefs] = useState<Preferences>(() => ({
    reduceMotion:
      readPreference<Preferences>(PREFS_KEY, { reduceMotion: false })
        .reduceMotion === true,
  }));
  const [gameKey, setGameKey] = useState(0);
  const saved = screen !== "game" ? restoreGame() : null;
  const home = () => {
    history.replaceState(null, "", location.pathname);
    setScreen("home");
  };
  const start = (newMode: OpponentMode) => {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {}
    setMode(newMode);
    writePreference(MODE_KEY, newMode);
    writePreference(MATCH_KEY, { minutes, level, side });
    setAutoStart(true);
    setGameKey((n) => n + 1);
    setScreen("game");
  };
  return (
    <Localized>
      <div className={prefs.reduceMotion ? "reduce-motion" : ""}>
        {screen === "private" ? (
          <PrivateRoom minutes={minutes} side={side} onHome={home} />
        ) : screen === "game" ? (
          <App
            key={gameKey}
            opponentMode={mode}
            onHome={home}
            minutes={minutes}
            botLevel={level}
            sidePreference={side}
            autoStart={autoStart}
          />
        ) : screen === "tutorial" ? (
          <Tutorial onHome={home} />
        ) : (
          <main className="menu-screen">
            {screen !== "home" && (
              <button className="quiet back-menu" onClick={home}>
                ← Home
              </button>
            )}
            <div className="menu-logo" aria-hidden="true">
              <div className="menu-card">+2</div>
              <PieceIcon type="n" army="w" />
              <span>✦</span>
            </div>
            <h1>
              Check <span>Happens.</span>
            </h1>
            <p className="menu-tagline">In Cards we trust</p>
            {screen === "home" && (
              <nav className="home-menu" aria-label="Main menu">
                <button className="primary" onClick={() => setScreen("choose")}>
                  Play <span aria-hidden="true">→</span>
                </button>
                <button onClick={() => setScreen("tutorial")}>
                  Tutorial <span aria-hidden="true">?</span>
                </button>
                <button onClick={() => setScreen("settings")}>
                  Settings <span aria-hidden="true">···</span>
                </button>
              </nav>
            )}
            {screen === "choose" && (
              <section className="home-menu mode-menu">
                <h2>Make it happen.</h2>
                <div
                  className="time-options"
                  role="group"
                  aria-label="Time control"
                >
                  {timeControls.map((t) => (
                    <button
                      key={t.minutes}
                      aria-pressed={minutes === t.minutes}
                      onClick={() => setMinutes(t.minutes)}
                    >
                      <strong>{t.minutes} min</strong>
                      <small>{t.label}</small>
                    </button>
                  ))}
                </div>
                <div
                  className="side-options"
                  role="group"
                  aria-label="Starting side"
                >
                  <span>Play as</span>
                  {(["white", "random", "black"] as const).map((value) => (
                    <button
                      key={value}
                      aria-pressed={side === value}
                      onClick={() => setSide(value)}
                    >
                      <span aria-hidden="true">
                        {value === "random" ? (
                          "?"
                        ) : (
                          <PieceIcon
                            type="p"
                            army={value === "white" ? "w" : "b"}
                          />
                        )}
                      </span>
                      {value === "white"
                        ? "White"
                        : value === "black"
                          ? "Black"
                          : "Random"}
                    </button>
                  ))}
                </div>
                {saved && saved.phase !== "READY" && !saved.outcome && (
                  <button
                    className="resume-game"
                    onClick={() => {
                      setAutoStart(false);
                      setMode(readPreference(MODE_KEY, "local"));
                      setGameKey((n) => n + 1);
                      setScreen("game");
                    }}
                  >
                    Resume match<small>Your clock keeps running</small>
                  </button>
                )}
                <button className="primary" onClick={() => start("local")}>
                  Local match <small>Two players · one phone</small>
                </button>
                <div
                  className="bot-options"
                  role="group"
                  aria-label="Training level"
                >
                  {(Object.keys(botProfiles) as BotLevel[]).map((k) => (
                    <button
                      key={k}
                      aria-pressed={level === k}
                      onClick={() => setLevel(k)}
                    >
                      {botProfiles[k].label}
                      <small>~{botProfiles[k].elo} Elo</small>
                    </button>
                  ))}
                </div>
                <button onClick={() => start("computer")}>
                  Train with a bot{" "}
                  <small>
                    {botProfiles[level].label} · estimated{" "}
                    {botProfiles[level].elo} Elo
                  </small>
                </button>
                <small className="rating-note">
                  Training labels are estimates, not calibrated ratings.
                </small>
                <button
                  className="private-play"
                  onClick={() => setScreen("private")}
                >
                  Private match<small>Experimental · invitation only</small>
                </button>
              </section>
            )}
            {screen === "settings" && (
              <section className="settings-panel">
                <h2>Just the essentials.</h2>
                <fieldset className="theme-picker">
                  <legend>Theme</legend>
                  {themes.map((t) => (
                    <button
                      key={t.id}
                      aria-pressed={theme === t.id}
                      onClick={() => setTheme(t.id)}
                    >
                      <span className="theme-swatches" aria-hidden="true">
                        {t.colors.map((c) => (
                          <i key={c} style={{ background: c }} />
                        ))}
                      </span>
                      {t.name}
                    </button>
                  ))}
                </fieldset>
                <label className="language-picker">
                  <span>Language</span>
                  <select
                    aria-label="Language"
                    value={language}
                    onChange={(e) =>
                      setLanguage(e.target.value === "it" ? "it" : "en")
                    }
                  >
                    <option value="en">English</option>
                    <option value="it">Italiano</option>
                  </select>
                </label>
                <label>
                  <span>
                    Reduce motion
                    <small>We also respect your phone’s preference.</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={prefs.reduceMotion}
                    onChange={(e) => {
                      const next = { reduceMotion: e.target.checked };
                      setPrefs(next);
                      writePreference(PREFS_KEY, next);
                    }}
                  />
                </label>
                <p>
                  Choose 4-minute Bullet, 7-minute Blitz or 10-minute Rapid
                  before each match. These are this game’s custom mode names.
                </p>
                <p>
                  Three training bots: Easy ~120, Medium ~200, Hard ~500 Elo.
                  Their strategies differ, but the ratings have not been
                  measured.
                </p>
                <p>
                  Matches save on this device. Leaving the table does not pause
                  the clock. Existing matches keep their remaining time.
                </p>
              </section>
            )}
            <small className="menu-caption">
              VERSION 2.5 · MADE FOR YOUR POCKET
            </small>
          </main>
        )}
      </div>
    </Localized>
  );
}
