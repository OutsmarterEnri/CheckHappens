import { startRecordingSession } from "../domain/logCodec";
import { useEffect, useRef, useState } from "react";
import { createGame, dispatch } from "../domain/turnResolver";
import {
  assertInvariants,
  availableResurrections,
  canEnd,
  evolutionChoices,
  movesAllowed,
  resurrectionCount,
} from "../domain/rules";
import {
  cardDescription,
  cardLabel,
  colors,
  risk,
  parseDeck,
} from "../domain/cards";
import {
  colorNames,
  otherPlayer,
  pieceNames,
  squareName,
  type Command,
  type Move,
  type State,
} from "../domain/types";
import { demo } from "../domain/fixtures";
import { engine } from "../engine/implementation";
import {
  exportMatch,
  importMatch,
  stateFromLog,
  verifyMatch,
  type Verification,
} from "../domain/audit";
import { MatchFinale } from "./MatchFinale";
import { restoreGame, saveGame } from "./persistence";
import { computerCommand } from "../domain/computer";
import type { Minutes, BotLevel } from "../domain/match";
import { botProfiles } from "../domain/match";
import type { OpponentMode } from "./preferences";
import { PieceIcon } from "./PieceIcon";
const phaseLabel: Record<State["phase"], string> = {
  READY: "Ready to play",
  TURN_START: "Turn start",
  PRE_DRAW_DEFENSE: "Defend before drawing",
  DRAW: "Drawing a card",
  CHOOSE_COLOR: "Choose your color",
  RESOLVE_EFFECT: "Card effect",
  CHOOSE_TARGETS: "Resolve the effect",
  RESOLVE_MOVES: "Your move",
  EMERGENCY_DRAW: "Emergency card",
  STALEMATE_RESCUE: "Stalemate rescue",
  TURN_END: "Turn ended",
  GAME_OVER: "Match over",
};
const bonusText = {
  red: "−3 seconds from your opponent per move",
  green: "+3 seconds per move",
  blue: "Half break risk on moves 5 and 6",
  yellow: "Each capture adds a required move",
};
const time = (ms: number) =>
  `${Math.floor(ms / 60000)
    .toString()
    .padStart(2, "0")}:${Math.floor((ms % 60000) / 1000)
    .toString()
    .padStart(2, "0")}`;
const freshSeed = () => crypto.getRandomValues(new Uint32Array(1))[0] || 1;
export function App({
  opponentMode = "local",
  onHome = () => {},
  minutes = 7,
  botLevel = "easy",
}: {
  opponentMode?: OpponentMode;
  onHome?: () => void;
  minutes?: Minutes;
  botLevel?: BotLevel;
}) {
  const [s, setS] = useState(() =>
    startRecordingSession(
      restoreGame() ??
        createGame(freshSeed(), performance.now(), undefined, minutes),
      opponentMode,
      botLevel,
    ),
  );
  const ref = useRef(s);
  const [spin, setSpin] = useState(false);
  const [resultDismissed, setResultDismissed] = useState(false);
  const [verification, setVerification] = useState<Verification | null>(null);
  const outcomePopup = !!s.outcome && !resultDismissed;
  const analyzeInput = useRef<HTMLInputElement>(null);
  const [evolutionTarget, setEvolutionTarget] = useState<string | null>(null);
  const computerTurn =
    opponentMode === "computer" &&
    s.active === "P2" &&
    s.phase !== "READY" &&
    !s.outcome;
  const colorPopup = s.phase === "CHOOSE_COLOR" && !computerTurn && !s.outcome;
  const [fx, setFx] = useState<{
    label: string;
    kind: string;
    id: number;
  } | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [resurrections, setResurrections] = useState<string[]>([]);
  const [promotion, setPromotion] = useState<Move[] | null>(null);
  const [drawer, setDrawer] = useState<
    "more" | "help" | "lab" | "log" | "targets" | null
  >(null);
  const [puff, setPuff] = useState<{
    square: number;
    type: State["pieces"][number]["type"];
    army: "w" | "b";
    id: number;
  } | null>(null);
  const [seed, setSeed] = useState(() => String(s.seed));
  const [deckText, setDeckText] = useState("R4 VSkip BReverse G+2 J +4");
  const [confirmNew, setConfirmNew] = useState(false);
  const importInput = useRef<HTMLInputElement>(null);
  const send = (command: Command, source: "human" | "computer" = "human") => {
    if (
      source === "human" &&
      opponentMode === "computer" &&
      ref.current.active === "P2" &&
      ref.current.phase !== "READY" &&
      !ref.current.outcome
    )
      return;
    const result = dispatch(ref.current, command, performance.now(), source);
    if (result.ok && command.type !== "AdvanceTime") {
      const events = result.state.events.slice(ref.current.events.length);
      if (events.some((e) => e.type === "ArmiesSwapped")) setSpin(true);
      const moved = events.find((e) => e.type === "MoveCompleted");
      const destroyed = events.find((e) => e.type === "PieceDestroyed");
      if (destroyed && moved) {
        const m = moved.data.move as Move;
        const p = ref.current.pieces.find((p) => p.id === m.pieceId)!;
        setPuff({ square: m.to, type: p.type, army: p.army, id: Date.now() });
      }
      const label = result.state.outcome
        ? "DONE!"
        : events.some((e) => e.type === "PieceDestroyed")
          ? "POOF!"
          : events.some((e) => e.type === "ArmiesSwapped")
            ? "REVERSE!"
            : events.some((e) => e.type === "DefenseRequired")
              ? "CHECK!"
              : events.some((e) => e.type === "PieceResurrected")
                ? "BACK AGAIN!"
                : events.some((e) => e.type === "PieceTransformed")
                  ? "TA-DA!"
                  : moved && (moved.data.move as Move).captureId
                    ? "CHOMP!"
                    : events.some((e) => e.type === "CardDrawn")
                      ? "DRAW!"
                      : null;
      if (label)
        setFx({
          label,
          kind: label === "POOF!" ? "danger" : "happy",
          id: Date.now(),
        });
    }
    ref.current = result.state;
    saveGame(result.state);
    setS(result.state);
    setError(result.ok ? "" : result.error.message);
    if (command.type !== "AdvanceTime") {
      setSelected(null);
      setResurrections([]);
      setPromotion(null);
      setEvolutionTarget(null);
    }
  };
  useEffect(() => {
    if (!computerTurn) return;
    const timer = setTimeout(() => {
      const current = ref.current;
      if (current.active !== "P2" || current.outcome) return;
      const command = computerCommand(
        current,
        current.seed + current.events.length * 7919 + current.turn * 173,
        botLevel,
      );
      if (command) send(command, "computer");
    }, 480);
    return () => clearTimeout(timer);
  }, [
    opponentMode,
    botLevel,
    s.active,
    s.phase,
    s.turn,
    s.current?.id,
    s.used.join(","),
    s.color,
    s.moveIndex,
    s.yellow,
  ]);
  useEffect(() => {
    if (!spin) return;
    const timer = setTimeout(() => setSpin(false), 500);
    return () => clearTimeout(timer);
  }, [spin, s.orientation]);
  useEffect(() => {
    const timer = setInterval(() => {
      if (ref.current.phase !== "READY" && !ref.current.outcome) {
        const r = dispatch(
          ref.current,
          { type: "AdvanceTime" },
          performance.now(),
          "clock",
        );
        ref.current = r.state;
        setS(r.state);
      }
    }, 150);
    return () => clearInterval(timer);
  }, []);
  const load = (loaded: State) => {
    const state = startRecordingSession(loaded, opponentMode, botLevel);
    ref.current = state;
    setS(state);
    setSeed(String(state.seed));
    setSelected(null);
    setPromotion(null);
    setResurrections([]);
    setError("");
    setConfirmNew(false);
    setResultDismissed(false);
    setVerification(null);
    setFx(null);
    setPuff(null);
    setDrawer(null);
    setEvolutionTarget(null);
    saveGame(state);
  };
  useEffect(() => {
    if (!puff) return;
    const timer = setTimeout(() => setPuff(null), 1100);
    return () => clearTimeout(timer);
  }, [puff]);
  useEffect(() => {
    if (!fx) return;
    const id = setTimeout(() => setFx(null), 720);
    return () => clearTimeout(id);
  }, [fx]);
  useEffect(() => {
    const persist = () => saveGame(ref.current);
    const timer = setInterval(persist, 2000);
    window.addEventListener("pagehide", persist);
    document.addEventListener("visibilitychange", persist);
    return () => {
      clearInterval(timer);
      window.removeEventListener("pagehide", persist);
      document.removeEventListener("visibilitychange", persist);
    };
  }, []);
  useEffect(() => {
    if (
      !promotion &&
      !confirmNew &&
      !colorPopup &&
      !evolutionTarget &&
      !drawer &&
      !outcomePopup
    )
      return;
    const previous = document.activeElement as HTMLElement | null;
    const modal = document.querySelector<HTMLElement>("[role=dialog]");
    modal?.querySelector<HTMLElement>("button")?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setResultDismissed(true);
        setPromotion(null);
        setConfirmNew(false);
        setEvolutionTarget(null);
        setDrawer(null);
      }
      if (e.key === "Tab" && modal) {
        const buttons = Array.from(
          modal.querySelectorAll<HTMLElement>(
            "button:not(:disabled),input:not([hidden])",
          ),
        );
        const first = buttons[0],
          last = buttons[buttons.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      previous?.focus();
    };
  }, [
    !!promotion,
    confirmNew,
    colorPopup,
    !!evolutionTarget,
    drawer,
    outcomePopup,
  ]);
  // Compute once per render, then share between board highlights and popups.
  const evolutions =
    s.phase === "CHOOSE_TARGETS" && s.current?.kind === "wild"
      ? evolutionChoices(s)
      : [];
  const moves = movesAllowed(s),
    selectedMoves = moves.filter((m) => m.from === selected);
  const own = s.control[s.active],
    bottomPlayer = s.control.P1 === s.orientation ? "P1" : "P2",
    opponent = otherPlayer(bottomPlayer);
  const check = s.phase !== "READY" && engine.inCheck(s, own);
  const mandatory =
    s.yellow > 0 ||
    s.phase === "PRE_DRAW_DEFENSE" ||
    check ||
    (s.current?.kind === "number" && s.moveIndex < 4 && s.budget > 0);
  const ghosts =
    s.phase === "CHOOSE_TARGETS" &&
    ["draw2", "draw4"].includes(s.current?.kind ?? "") &&
    !computerTurn
      ? availableResurrections(s)
      : [];
  const chooseResurrection = (id: string) => {
    const next = resurrections.includes(id)
      ? resurrections.filter((p) => p !== id)
      : [...resurrections, id];
    if (next.length === resurrectionCount(ref.current))
      send({ type: "ChooseResurrections", pieceIds: next });
    else setResurrections(next);
  };
  const clickSquare = (sq: number) => {
    if (computerTurn) return;
    const ghost = ghosts.find((p) => p.home === sq);
    if (ghost) {
      chooseResurrection(ghost.id);
      return;
    }
    if (s.phase === "CHOOSE_TARGETS" && s.current?.kind === "wild") {
      const piece = s.pieces.find((p) => p.square === sq);
      if (piece && evolutions.some((c) => c.pieceId === piece.id))
        setEvolutionTarget(piece.id);
      return;
    }
    if (s.phase === "CHOOSE_TARGETS" && s.current?.kind === "skip") {
      const p = s.pieces.find((p) => p.square === sq);
      if (p) send({ type: "ChooseSkipTarget", pieceId: p.id });
      return;
    }
    if (s.outcome) return;
    const targets = selectedMoves.filter((m) => m.to === sq);
    if (targets.length) {
      if (targets[0].promotion) setPromotion(targets);
      else send({ type: "SubmitMove", from: selected!, to: sq });
      return;
    }
    setSelected(moves.some((m) => m.from === sq) ? sq : null);
    setError("");
  };
  const exportReplay = () => {
    const a = document.createElement("a"),
      url = URL.createObjectURL(
        new Blob([JSON.stringify(exportMatch(ref.current), null, 2)], {
          type: "application/json",
        }),
      );
    a.href = url;
    a.download = `check-happens-${s.seed}-turn-${s.turn}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };
  const squares = Array.from({ length: 64 }, (_, i) =>
    s.orientation === "w"
      ? (7 - Math.floor(i / 8)) * 8 + (i % 8)
      : Math.floor(i / 8) * 8 + 7 - (i % 8),
  );
  const records = s.events.filter(
    (e) => !["Checkpoint", "ClockAdvanced"].includes(e.type),
  );
  const remaining = s.budget + s.yellow + (s.optionalSpecial ? 1 : 0);
  const nextRisk =
    s.mode === "uno" && s.phase === "RESOLVE_MOVES"
      ? Math.round(risk(s.moveIndex + 1, s.color) * 100)
      : 0;
  const newMatch = () =>
    load(createGame(freshSeed(), performance.now(), undefined, minutes));
  const playerName = (player: "P1" | "P2") =>
    opponentMode === "computer"
      ? player === "P1"
        ? "You"
        : `${botProfiles[botLevel].label} bot`
      : `Player ${player.slice(1)}`;
  const count = Math.min(
    12,
    Math.max(s.current?.value ?? 1, s.moveIndex + remaining),
  );
  return (
    <div className="game-screen" data-phase={s.phase}>
      <div className="portrait-hint" role="status">
        <strong>Your table looks better upright.</strong>
        <span>Rotate your phone to portrait to play.</span>
      </div>
      <header className="game-header">
        <button
          className="brand compact"
          aria-label="Home"
          onClick={() => {
            saveGame(ref.current);
            onHome();
          }}
        >
          CH<span>Check Happens.</span>
        </button>
        <span className="format-label">
          {s.mode === "classical"
            ? "Classic"
            : `${s.initialMinutes ?? minutes} + 0`}
        </span>
        <button aria-label="New match" onClick={() => setConfirmNew(true)}>
          ＋
        </button>
        <button aria-label="Game options" onClick={() => setDrawer("more")}>
          ···
        </button>
      </header>
      <div
        className="turn-banner"
        key={`${s.turn}-${s.active}`}
        role="status"
        aria-live="polite"
      >
        <strong>
          {s.phase === "READY"
            ? "READY?"
            : s.outcome
              ? "MATCH OVER"
              : computerTurn
                ? "BOT’S TURN"
                : opponentMode === "computer"
                  ? "YOUR TURN!"
                  : `${playerName(s.active).toUpperCase()}’S TURN`}
        </strong>
        <span>
          {s.phase === "READY"
            ? "In Cards we trust"
            : s.outcome
              ? s.outcome.reason
              : `${own === "w" ? "White" : "Black"} · ${computerTurn ? "thinking…" : phaseLabel[s.phase]}`}
        </span>
      </div>
      <section className="board-column" aria-label="Game table">
        <div
          className={`player-strip ${s.active === opponent && s.phase !== "READY" ? "active" : ""}`}
        >
          <span className="avatar">{opponent.slice(1)}</span>
          <div className="player-name">
            <strong>{playerName(opponent)}</strong>
            <span>
              {s.control[opponent] === "w" ? "White army" : "Black army"}
            </span>
          </div>
          <div className="clock" aria-label={`Time ${opponent}`}>
            {time(s.clock.remaining[opponent])}
          </div>
        </div>
        <div
          className={`board-frame color-${s.color ?? "neutral"} ${spin ? "reverse-enter" : ""}`}
          key={s.orientation}
        >
          <span className="frame-color-label">
            {s.color ? colorNames[s.color] : "Neutral"}
          </span>
          {fx && (
            <div
              key={fx.id}
              className={`comic-fx ${fx.kind}`}
              aria-hidden="true"
            >
              {fx.label}
              <span>✦</span>
            </div>
          )}
          <div className="board" role="group" aria-label="Chessboard, a1 to h8">
            {squares.map((sq, i) => {
              const piece = s.pieces.find((p) => p.square === sq),
                ghost = ghosts.find((p) => p.home === sq);
              const possible = selectedMoves.some((m) => m.to === sq);
              const breakable =
                !!piece &&
                nextRisk > 0 &&
                !computerTurn &&
                moves.some((m) => m.pieceId === piece.id);
              const target =
                s.phase === "CHOOSE_TARGETS" &&
                !computerTurn &&
                piece &&
                (s.current?.kind === "skip"
                  ? piece.army !== own && piece.type !== "k"
                  : s.current?.kind === "wild" &&
                    evolutions.some((c) => c.pieceId === piece.id));
              return (
                <button
                  key={sq}
                  className={`square ${((sq % 8) + Math.floor(sq / 8)) % 2 ? "light" : "dark"} ${selected === sq ? "selected" : ""} ${possible ? "possible" : ""} ${target ? "target" : ""} ${ghost ? "hologram" : ""} ${ghost && resurrections.includes(ghost.id) ? "ghost-selected" : ""} ${piece && s.used.includes(piece.id) ? "used" : ""} ${breakable ? "at-risk" : ""} ${piece?.type === "k" && check && piece.army === own ? "checked" : ""}`}
                  onClick={() => clickSquare(sq)}
                  aria-label={`${squareName(sq)}${ghost ? `, ghost ${pieceNames[ghost.original]}` : ""}${piece ? `, ${pieceNames[piece.type]} ${piece.army === "w" ? "white" : "black"}${piece.blocked ? ", blocked" : ""}${s.used.includes(piece.id) ? ", used" : ""}` : ""}${possible ? ", legal destination" : ""}${breakable ? `, ${nextRisk}% break risk` : ""}`}
                  aria-pressed={
                    ghost ? resurrections.includes(ghost.id) : selected === sq
                  }
                >
                  {i % 8 === 0 && (
                    <span className="rank">{Math.floor(sq / 8) + 1}</span>
                  )}
                  {i >= 56 && (
                    <span className="file">{"abcdefgh"[sq % 8]}</span>
                  )}
                  {piece && (
                    <span
                      className="piece-actor"
                      key={`${piece.id}-${piece.square}-${piece.type}`}
                    >
                      <PieceIcon type={piece.type} army={piece.army} />
                      {breakable && (
                        <svg
                          className="crack"
                          viewBox="0 0 48 48"
                          aria-hidden="true"
                        >
                          <path d="m28 9-7 10 8 2-10 12 5 8" />
                        </svg>
                      )}
                    </span>
                  )}
                  {ghost && (
                    <span className="ghost-piece">
                      <PieceIcon type={ghost.original} army={ghost.army} />
                      <b>{resurrections.includes(ghost.id) ? "✓" : "+"}</b>
                    </span>
                  )}
                  {piece?.blocked && <span className="blocked">⊘</span>}
                  {piece && s.used.includes(piece.id) && (
                    <span className="used-dot" />
                  )}
                  {possible && (
                    <span className={piece ? "capture-ring" : "move-dot"} />
                  )}
                  {puff?.square === sq && (
                    <span
                      key={puff.id}
                      className="break-puff"
                      role="img"
                      aria-label={`${pieceNames[puff.type]} broke`}
                    >
                      <span className="puff-silhouette">
                        <PieceIcon type={puff.type} army={puff.army} />
                      </span>
                      <i />
                      <i />
                      <i />
                      <b>POOF!</b>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <div
          className={`player-strip bottom-player ${s.active === bottomPlayer && s.phase !== "READY" ? "active" : ""}`}
        >
          <span className="avatar">{bottomPlayer.slice(1)}</span>
          <div className="player-name">
            <strong>{playerName(bottomPlayer)}</strong>
            <span>
              {s.control[bottomPlayer] === "w" ? "White army" : "Black army"}
            </span>
          </div>
          <div
            className={`clock ${s.clock.remaining[bottomPlayer] < 30000 ? "low" : ""}`}
            aria-label={`Time ${bottomPlayer}`}
          >
            {time(s.clock.remaining[bottomPlayer])}
          </div>
        </div>
      </section>
      <section
        className={`play-dock ${nextRisk > 0 ? "risky-dock" : ""}`}
        aria-label="Card and moves"
      >
        <div
          className={`mini-card ${s.color ?? "neutral"}`}
          key={`${s.turn}-${s.current?.id}`}
          aria-label={`Card ${cardLabel(s.current)}`}
        >
          <strong>
            {s.mode === "classical"
              ? "♟"
              : s.current
                ? cardLabel(s.current)
                : "?"}
          </strong>
        </div>
        <div className="move-summary">
          <div className="section-top">
            <h2>
              {s.current
                ? `${cardLabel(s.current)} · ${s.color ? colorNames[s.color] : "Wild"}`
                : s.mode === "classical"
                  ? "Classic chess"
                  : "Anything can happen."}
            </h2>
            <span className="pill">{s.deck.length - s.deckIndex} cards</span>
          </div>
          <div className="move-headline">
            <strong>
              {s.phase === "PRE_DRAW_DEFENSE"
                ? "Defend first"
                : s.phase === "READY"
                  ? "Your first card awaits"
                  : s.phase === "CHOOSE_TARGETS"
                    ? `${s.current?.kind === "skip" ? "Tap an enemy piece" : s.current?.kind === "wild" ? "Tap a pawn" : `Tap ${resurrectionCount(s)} ghosts · ${resurrections.length} selected`}`
                    : s.phase === "CHOOSE_COLOR"
                      ? "Pick a color"
                      : `${remaining} move${remaining === 1 ? "" : "s"} left`}
            </strong>
            <span className={`risk-label ${nextRisk > 0 ? "danger" : ""}`}>
              {nextRisk > 0 ? `${nextRisk}% BREAK RISK` : "SAFE"}
            </span>
          </div>
          <div
            className="move-track"
            aria-label={`${s.moveIndex} moves completed, ${remaining} remaining`}
          >
            {Array.from({ length: count }, (_, i) => (
              <span
                key={i}
                className={`${i < s.moveIndex ? "done" : ""} ${i >= 4 ? "risky" : ""}`}
              />
            ))}
          </div>
          <p>
            {s.phase === "PRE_DRAW_DEFENSE"
              ? `${s.color ? colorNames[s.color] : "Previous color"} stays active until you draw.`
              : s.yellow
                ? `${s.budget} card moves + ${s.yellow} mandatory capture bonus`
                : `${s.mode === "classical" ? "One move per turn" : `Next: move ${s.moveIndex + 1}`} · ${mandatory ? "MUST MOVE" : canEnd(s) ? "MAY PASS" : phaseLabel[s.phase]}`}
          </p>
        </div>
      </section>
      <div className="action-bar" aria-live="polite">
        {s.outcome ? (
          <>
            <span>
              {s.outcome.winner
                ? `${playerName(s.outcome.winner)} wins!`
                : "Draw"}
              <small>{s.outcome.reason}</small>
            </span>
            <button className="primary" onClick={newMatch}>
              Play again →
            </button>
          </>
        ) : s.phase === "READY" ? (
          <>
            <span>
              Pass & play or train.
              <small>{s.initialMinutes ?? minutes} minutes each.</small>
            </span>
            <button
              className="primary"
              onClick={() => send({ type: "StartGame" })}
            >
              Start match →
            </button>
          </>
        ) : computerTurn ? (
          <span>
            Bot is thinking…<small>Same rules. No shortcuts.</small>
          </span>
        ) : (
          <>
            <span>
              {error ||
                (selected !== null
                  ? `From ${squareName(selected)} · tap a destination`
                  : s.phase === "CHOOSE_TARGETS"
                    ? "Tap the highlighted pieces"
                    : s.phase === "CHOOSE_COLOR"
                      ? "Pick a color in the popup"
                      : nextRisk > 0
                        ? "This piece might break."
                        : check
                          ? "Save your king!"
                          : "Pick a piece, make it happen.")}
              <small>
                {nextRisk > 0
                  ? "Move completes first. Breaking ends your turn."
                  : s.color
                    ? bonusText[s.color]
                    : "In Cards we trust"}
              </small>
            </span>
            {canEnd(s) ? (
              <button onClick={() => send({ type: "EndOptionalMoves" })}>
                Pass →
              </button>
            ) : s.phase === "CHOOSE_TARGETS" ? (
              <button onClick={() => setDrawer("targets")}>List</button>
            ) : null}
          </>
        )}
      </div>
      {drawer && !outcomePopup && (
        <div className="modal-backdrop">
          <section
            className="modal drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Game options"
          >
            <div className="section-top">
              <h2>
                {drawer === "more"
                  ? "Your table"
                  : drawer === "help"
                    ? "How it works"
                    : drawer === "lab"
                      ? "Lab"
                      : drawer === "log"
                        ? "Move log"
                        : "Choose pieces"}
              </h2>
              <button
                aria-label="Close options"
                onClick={() => setDrawer(null)}
              >
                ×
              </button>
            </div>
            {drawer === "more" && (
              <div className="drawer-menu">
                <button onClick={() => setDrawer("help")}>How to play</button>
                <button onClick={() => setDrawer("log")}>Move log</button>
                <button onClick={() => setDrawer("lab")}>Lab & replay</button>
                <button onClick={exportReplay}>Save match JSON</button>
                <button
                  onClick={() => {
                    setVerification(verifyMatch(exportMatch(ref.current)));
                    setDrawer("log");
                  }}
                >
                  Verify this match
                </button>
                <button onClick={() => analyzeInput.current?.click()}>
                  Analyze JSON file
                </button>
                <button
                  onClick={() => {
                    saveGame(ref.current);
                    onHome();
                  }}
                >
                  Home <small>The clock keeps running</small>
                </button>
              </div>
            )}
            {drawer === "help" && (
              <>
                <p>
                  Numbers give moves with different pieces. The first four are
                  safe and required. From move 5 you may pass or risk a break:
                  20%, 40%, 60%, 80%, then 99%.
                </p>
                <p>
                  Giving check ends the turn. Under check, defend before drawing
                  with the previous color. Checkmate gets one emergency card
                  while the deck lasts.
                </p>
                {colors.map((c) => (
                  <p key={c}>
                    <span className={`dot ${c}`} />{" "}
                    <strong>{colorNames[c]}:</strong> {bonusText[c]}
                  </p>
                ))}
                <p>{cardDescription(s.current)}</p>
                <p>
                  Custom time modes: 4-minute Bullet, 7-minute Blitz, 10-minute
                  Rapid.
                </p>
              </>
            )}
            {drawer === "log" && (
              <div className="journal-list">
                <div className="log-tools">
                  <button onClick={exportReplay}>Save match JSON</button>
                  <button
                    onClick={() =>
                      setVerification(verifyMatch(exportMatch(ref.current)))
                    }
                  >
                    Verify this match
                  </button>
                  <button onClick={() => analyzeInput.current?.click()}>
                    Analyze JSON file
                  </button>
                </div>
                {verification && (
                  <div
                    className={`verification ${verification.valid ? "valid" : "invalid"}`}
                    role="status"
                  >
                    <strong>
                      {verification.valid ? "VERIFIED" : "DIVERGENCE FOUND"}
                    </strong>
                    <p>{verification.message}</p>
                    <small>
                      {verification.checked} actions checked ·{" "}
                      {verification.rejected} rejected inputs
                      {verification.firstDivergence !== undefined
                        ? ` · first divergence #${verification.firstDivergence}`
                        : ""}
                    </small>
                  </div>
                )}
                {records
                  .slice(-60)
                  .reverse()
                  .map((e) => (
                    <p key={e.seq}>{e.text}</p>
                  ))}
              </div>
            )}
            {drawer === "targets" && (
              <div className="target-list">
                {ghosts.length
                  ? ghosts.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          const last =
                            !resurrections.includes(p.id) &&
                            resurrections.length + 1 === resurrectionCount(s);
                          chooseResurrection(p.id);
                          if (last) setDrawer(null);
                        }}
                        aria-pressed={resurrections.includes(p.id)}
                      >
                        {pieceNames[p.original]} · {squareName(p.home)}
                      </button>
                    ))
                  : s.current?.kind === "wild"
                    ? evolutions.map((c) => (
                        <button
                          key={`${c.pieceId}-${c.pieceType}`}
                          onClick={() => {
                            send({ type: "ChooseEvolution", ...c });
                            setDrawer(null);
                          }}
                        >
                          {squareName(
                            s.pieces.find((p) => p.id === c.pieceId)!.square!,
                          )}{" "}
                          → {pieceNames[c.pieceType]}
                        </button>
                      ))
                    : s.pieces
                        .filter(
                          (p) =>
                            p.square !== null &&
                            p.army !== own &&
                            p.type !== "k",
                        )
                        .map((p) => (
                          <button
                            key={p.id}
                            onClick={() => {
                              send({ type: "ChooseSkipTarget", pieceId: p.id });
                              setDrawer(null);
                            }}
                          >
                            {pieceNames[p.type]} · {squareName(p.square!)}
                          </button>
                        ))}
              </div>
            )}
            {drawer === "lab" && (
              <div className="lab">
                <label>
                  Seed
                  <input
                    type="number"
                    value={seed}
                    onChange={(e) => setSeed(e.target.value)}
                  />
                </label>
                <button
                  onClick={() =>
                    load(
                      createGame(
                        Number(seed) || 2026,
                        performance.now(),
                        undefined,
                        minutes,
                      ),
                    )
                  }
                >
                  Load seed
                </button>
                {[
                  ["defense", "Defense before draw"],
                  ["resurrection", "Resurrection & Wild"],
                  ["resurrection2", "Resurrection +2"],
                  ["risk", "Blue risk"],
                  ["breakage", "Break-risk demo"],
                  ["emergency", "Checkmate & Reset"],
                  ["yellow", "Yellow chain"],
                  ["last", "Last card"],
                  ["win", "Win finale"],
                  ["lose", "Lose finale"],
                  ["draw", "Draw finale"],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => load(demo(id, performance.now()))}
                  >
                    {label}
                  </button>
                ))}
                <label>
                  Ordered deck (R red, V green, B blue, G yellow)
                  <input
                    aria-label="Ordered deck"
                    value={deckText}
                    onChange={(e) => setDeckText(e.target.value)}
                  />
                </label>
                <button
                  onClick={() => {
                    try {
                      load(
                        createGame(
                          Number(seed) || 2026,
                          performance.now(),
                          parseDeck(deckText),
                          minutes,
                        ),
                      );
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  Load deck
                </button>
                <button onClick={exportReplay}>Export replay</button>
                <button onClick={() => importInput.current?.click()}>
                  Import replay
                </button>
                <input
                  hidden
                  ref={importInput}
                  type="file"
                  accept="application/json"
                  onChange={async (e) => {
                    try {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      if (f.size > 20_000_000)
                        throw new Error("File exceeds 20 MB");
                      const log = importMatch(await f.text());
                      const state = stateFromLog(log);
                      state.clock.lastAt = performance.now();
                      load(state);
                    } catch (e) {
                      setError(
                        e instanceof Error ? e.message : "Invalid match log.",
                      );
                    } finally {
                      e.target.value = "";
                    }
                  }}
                />
              </div>
            )}
            {error && <p role="alert">{error}</p>}
          </section>
        </div>
      )}
      <input
        hidden
        data-testid="analyze-file"
        ref={analyzeInput}
        type="file"
        accept="application/json"
        onChange={async (e) => {
          try {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > 20_000_000) throw new Error("File exceeds 20 MB");
            const report = verifyMatch(JSON.parse(await file.text()));
            setVerification(report);
            setDrawer("log");
          } catch (e) {
            setVerification({
              valid: false,
              checked: 0,
              rejected: 0,
              message: e instanceof Error ? e.message : "Invalid JSON file.",
            });
            setDrawer("log");
          } finally {
            e.target.value = "";
          }
        }}
      />
      {outcomePopup && s.outcome && (
        <MatchFinale
          outcome={s.outcome}
          computer={opponentMode === "computer"}
          winnerName={
            s.outcome.winner ? playerName(s.outcome.winner) : "Nobody"
          }
          moves={records.filter((e) => e.type === "MoveCompleted").length}
          onAgain={newMatch}
          onReview={() => {
            setResultDismissed(true);
            setDrawer(null);
          }}
          onExport={exportReplay}
        />
      )}
      {colorPopup && !outcomePopup && (
        <div className="modal-backdrop">
          <section
            className="modal color-popup"
            role="dialog"
            aria-modal="true"
            aria-label="Choose color"
          >
            <span className="eyebrow">{cardLabel(s.current)} · TAP & PLAY</span>
            <h2>Choose your color.</h2>
            <div className="color-wheel">
              {colors.map((c) => (
                <button
                  className={`color-choice ${c}`}
                  key={c}
                  onClick={() => send({ type: "ChooseUnoColor", color: c })}
                >
                  <span className={`dot ${c}`} />
                  {colorNames[c]}
                </button>
              ))}
            </div>
            <small>Your clock keeps running.</small>
          </section>
        </div>
      )}
      {evolutionTarget && !s.outcome && !computerTurn && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Evolve pawn"
          >
            <h2>Pick a new role.</h2>
            <div className="promotion-choices">
              {evolutions
                .filter((c) => c.pieceId === evolutionTarget)
                .map((c) => (
                  <button
                    key={c.pieceType}
                    onClick={() => send({ type: "ChooseEvolution", ...c })}
                  >
                    <PieceIcon type={c.pieceType} army={own} />
                    {pieceNames[c.pieceType]}
                  </button>
                ))}
            </div>
            <button className="quiet" onClick={() => setEvolutionTarget(null)}>
              Cancel
            </button>
          </section>
        </div>
      )}
      {promotion && !s.outcome && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Promote pawn"
          >
            <h2>A new role.</h2>
            <div className="promotion-choices">
              {promotion.map((m) => (
                <button
                  key={m.promotion}
                  onClick={() =>
                    send({
                      type: "SubmitMove",
                      from: m.from,
                      to: m.to,
                      promotion: m.promotion,
                    })
                  }
                >
                  <PieceIcon type={m.promotion!} army={own} />
                  {pieceNames[m.promotion!]}
                </button>
              ))}
            </div>
            <button className="quiet" onClick={() => setPromotion(null)}>
              Cancel
            </button>
          </section>
        </div>
      )}
      {confirmNew && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="New match"
          >
            <h2>Make a fresh start?</h2>
            <p>
              This replaces the current match. Export it first if you want to
              keep it.
            </p>
            <button className="primary" onClick={newMatch}>
              New match
            </button>
            <button className="quiet" onClick={() => setConfirmNew(false)}>
              Keep playing
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
