import { useEffect, useState } from "react";
import { Localized, useLanguage, translate } from "./locale";
import { PieceIcon } from "./PieceIcon";
import { PieceCracks, SkipChains } from "./PieceEffects";
import {
  practiceSetup,
  beginPractice,
  positionError,
} from "../domain/practice";
import { dispatch } from "../domain/turnResolver";
import {
  movesAllowed,
  availableResurrections,
  resurrectionCount,
  canEnd,
  evolutionChoices,
} from "../domain/rules";
import { colors, risk, cardLabel } from "../domain/cards";
import {
  squareName,
  pieceNames,
  colorNames,
  type State,
  type Command,
  type PieceType,
  type Army,
  type UnoColor,
  type Piece,
} from "../domain/types";
export function PracticeTable({
  cardIndex = 0,
  color = "green",
  scenario = "card",
  sandbox = false,
  initialPieces,
  onPositionChange,
  onSnapshot,
  guided = false,
  locked = false,
  focusSquares = [],
}: {
  onSnapshot?: (state: State) => void;
  guided?: boolean;
  locked?: boolean;
  focusSquares?: number[];
  initialPieces?: Piece[];
  onPositionChange?: (pieces: Piece[]) => void;
  cardIndex?: number;
  color?: UnoColor;
  scenario?: string;
  sandbox?: boolean;
}) {
  const { language } = useLanguage();
  const [s, setS] = useState(() => {
    const state = practiceSetup(cardIndex, color, scenario);
    if (initialPieces) state.pieces = structuredClone(initialPieces);
    return state;
  });
  const [editing, setEditing] = useState(sandbox),
    [tool, setTool] = useState<PieceType | "erase">("p"),
    [army, setArmy] = useState<Army>("w");
  const [selected, setSelected] = useState<number | null>(null),
    [revive, setRevive] = useState<string[]>([]),
    [evolve, setEvolve] = useState<string | null>(null);
  const [message, setMessage] = useState("Tap Try card to begin."),
    [before, setBefore] = useState(s);
  const [promotion, setPromotion] = useState<"q" | "r" | "b" | "n">("q");
  useEffect(() => {
    onSnapshot?.(s);
  }, [s, onSnapshot]);
  const send = (command: Command) => {
    if (locked) return;
    const result = dispatch(s, command, s.clock.lastAt, "human");
    setS(result.state);
    setSelected(null);
    setEvolve(null);
    setMessage(result.ok ? "Action applied." : "That action is not available.");
  };
  const moves = movesAllowed(s),
    ghosts =
      s.phase === "CHOOSE_TARGETS" &&
      ["draw2", "draw4"].includes(s.current?.kind ?? "")
        ? availableResurrections(s)
        : [];
  const chance =
    s.phase === "RESOLVE_MOVES"
      ? Math.round(risk(s.moveIndex + 1, s.color) * 100)
      : 0;
  const click = (sq: number) => {
    if (locked) return;
    if (editing) {
      const removed = s.pieces.find((p) => p.square === sq);
      let pieces = s.pieces.filter((p) => p.square !== sq);
      if (tool === "erase" && removed && removed.type !== "k") {
        pieces.push({
          ...removed,
          square: null,
          blocked: false,
          death: "capture",
        });
        setMessage("Piece moved to the lost pile.");
      }
      if (tool !== "erase") {
        if (tool === "k")
          pieces = pieces.filter((p) => !(p.type === "k" && p.army === army));
        if (pieces.length >= 32) {
          setMessage("Use at most 32 pieces.");
          return;
        }
        pieces.push({
          id: crypto.randomUUID?.() ?? `editor-${Date.now()}-${sq}`,
          type: tool,
          original: tool,
          army,
          home: sq,
          square: sq,
          moved: true,
          blocked: false,
        });
      }
      onPositionChange?.(pieces);
      setS({ ...s, pieces });
      return;
    }
    const p = s.pieces.find((p) => p.square === sq),
      ghost = ghosts.find((p) => p.home === sq);
    if (ghost) {
      const ids = revive.includes(ghost.id)
        ? revive.filter((id) => id !== ghost.id)
        : [...revive, ghost.id];
      setRevive(ids);
      if (ids.length === resurrectionCount(s)) {
        send({ type: "ChooseResurrections", pieceIds: ids });
        setRevive([]);
      }
      return;
    }
    if (s.phase === "CHOOSE_TARGETS" && s.current?.kind === "skip" && p) {
      send({ type: "ChooseSkipTarget", pieceId: p.id });
      return;
    }
    if (s.phase === "CHOOSE_TARGETS" && s.current?.kind === "wild" && p) {
      if (evolutionChoices(s).some((c) => c.pieceId === p.id)) setEvolve(p.id);
      return;
    }
    const move = moves.find(
      (m) =>
        m.from === selected &&
        m.to === sq &&
        (!m.promotion || m.promotion === promotion),
    );
    if (move) {
      send({
        type: "SubmitMove",
        from: move.from,
        to: move.to,
        ...(move.promotion ? { promotion: move.promotion } : {}),
      });
      return;
    }
    setSelected(moves.some((m) => m.from === sq) ? sq : null);
  };
  const phases: Record<string, string> = {
    READY: "Tap Try card to begin.",
    CHOOSE_COLOR: "Choose the active color.",
    CHOOSE_TARGETS:
      s.current?.kind === "skip"
        ? "Tap an enemy piece to chain it."
        : s.current?.kind === "wild"
          ? "Tap a pawn, then choose its evolution."
          : "Tap the glowing home squares to revive pieces.",
    PRE_DRAW_DEFENSE: "Defend check before drawing. Keep the previous color.",
    RESOLVE_MOVES: "Select a piece, then a highlighted square.",
    GAME_OVER: "Experiment finished. Retry or edit the position.",
  };
  const squares = Array.from({ length: 64 }, (_, i) =>
    s.orientation === "w"
      ? (7 - Math.floor(i / 8)) * 8 + (i % 8)
      : Math.floor(i / 8) * 8 + 7 - (i % 8),
  );
  const reset = () => {
    setS(structuredClone(before));
    setSelected(null);
    setRevive([]);
    setEvolve(null);
    setMessage("Tap Try card to begin.");
  };
  return (
    <Localized>
      <section
        className={`practice-table ${guided ? "guided-table" : ""}`}
        data-phase={s.phase}
        data-editing={editing}
        aria-label="Practice board"
      >
        <div className="practice-status" role="status">
          <strong>
            {editing
              ? "Edit position"
              : `${s.active} · ${s.control[s.active] === "w" ? "White" : "Black"}`}
          </strong>
          <span>
            {editing
              ? "Choose a piece and tap a square."
              : (phases[s.phase] ?? "Resolve the card.")}
          </span>
        </div>
        <div className="practice-board-slot">
          <div
            className={`board-frame practice-board color-${s.color ?? color} ${s.orientation === "b" ? "practice-flipped" : ""}`}
          >
            <div className="board">
              {squares.map((sq) => {
                const p = s.pieces.find((p) => p.square === sq),
                  ghost = ghosts.find((p) => p.home === sq),
                  dest = moves.some((m) => m.from === selected && m.to === sq);
                const target =
                  s.phase === "CHOOSE_TARGETS" &&
                  (s.current?.kind === "skip"
                    ? p && p.army !== s.control[s.active] && p.type !== "k"
                    : s.current?.kind === "wild" &&
                      evolutionChoices(s).some((c) => c.pieceId === p?.id));
                return (
                  <button
                    key={sq}
                    disabled={locked}
                    className={`square ${((sq % 8) + Math.floor(sq / 8)) % 2 ? "light" : "dark"} ${selected === sq ? "selected" : ""} ${focusSquares.includes(sq) && (p || ghost) && !locked ? "coach-square" : ""} ${ghost ? "hologram" : ""} ${target ? "target" : ""} ${revive.includes(ghost?.id ?? "") ? "selected" : ""}`}
                    aria-label={`${squareName(sq)}${p ? `, ${pieceNames[p.type]}` : ghost ? ", ghost " + pieceNames[ghost.type] : ""}${dest ? `, ${translate("legal destination", language)}` : ""}`}
                    onClick={() => click(sq)}
                  >
                    <span className="practice-coordinate">
                      {squareName(sq)}
                    </span>
                    {(p || ghost) && (
                      <PieceIcon
                        type={(p ?? ghost)!.type}
                        army={(p ?? ghost)!.army}
                      />
                    )}
                    {p?.blocked && <SkipChains />}
                    {p && selected === sq && chance > 0 && (
                      <PieceCracks percent={chance} />
                    )}{" "}
                    {dest && <span className="move-dot" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="practice-controls">
          {editing ? (
            <>
              <div
                className="practice-tool-row"
                role="group"
                aria-label="Piece palette"
              >
                {(["p", "n", "b", "r", "q", "k", "erase"] as const).map((t) => (
                  <button
                    key={t}
                    aria-label={t === "erase" ? "Erase" : pieceNames[t]}
                    aria-pressed={tool === t}
                    onClick={() => setTool(t)}
                  >
                    {t === "erase" ? "×" : <PieceIcon type={t} army={army} />}
                  </button>
                ))}
              </div>
              <div className="practice-toolbar">
                <button onClick={() => setArmy(army === "w" ? "b" : "w")}>
                  {army === "w" ? "White pieces" : "Black pieces"}
                </button>
                <button
                  onClick={() => {
                    const pieces = s.pieces.filter((p) => p.type === "k");
                    setS({ ...s, pieces });
                    onPositionChange?.(pieces);
                  }}
                >
                  Clear pieces
                </button>
                <button
                  onClick={() => {
                    setBefore(structuredClone(s));
                    const error = positionError(s.pieces);
                    if (error) {
                      setMessage(error);
                      return;
                    }
                    setEditing(false);
                    setMessage("Tap Try card to begin.");
                  }}
                >
                  Test position
                </button>
              </div>
            </>
          ) : s.phase === "CHOOSE_COLOR" ? (
            <div className="practice-toolbar">
              {colors.map((c) => (
                <button
                  className={`color-choice ${c}`}
                  key={c}
                  onClick={() => send({ type: "ChooseUnoColor", color: c })}
                >
                  {colorNames[c]}
                </button>
              ))}
            </div>
          ) : evolve ? (
            <div className="practice-toolbar">
              {(["r", "b", "n"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() =>
                    send({
                      type: "ChooseEvolution",
                      pieceId: evolve,
                      pieceType: t,
                    })
                  }
                >
                  {pieceNames[t]}
                </button>
              ))}
            </div>
          ) : (
            <div className="practice-toolbar">
              {s.phase === "READY" ? (
                <button
                  className="primary"
                  onClick={() => {
                    setS(
                      beginPractice(s, cardIndex === 1 && scenario === "card"),
                    );
                    setMessage(
                      cardIndex === 1
                        ? "Moves 1–4 completed for you."
                        : "Card applied.",
                    );
                  }}
                >
                  {guided ? "Draw card" : "Try card"}
                </button>
              ) : (
                <button onClick={reset}>Retry</button>
              )}
              {canEnd(s) && (
                <button
                  className="primary"
                  onClick={() => send({ type: "EndOptionalMoves" })}
                >
                  Pass →
                </button>
              )}
              {sandbox && (
                <button
                  onClick={() => {
                    setEditing(true);
                    setS(structuredClone(before));
                    setSelected(null);
                    setRevive([]);
                    setEvolve(null);
                  }}
                >
                  Edit position
                </button>
              )}
              <label className="practice-promotion">
                Promotion
                <select
                  aria-label="Promotion"
                  value={promotion}
                  onChange={(e) =>
                    setPromotion(e.target.value as typeof promotion)
                  }
                >
                  {(["q", "r", "b", "n"] as const).map((t) => (
                    <option key={t} value={t}>
                      {pieceNames[t]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
          <div
            className={`practice-feedback ${message === "Tap Try card to begin." ? "quiet-feedback" : ""} ${message === "That action is not available." ? "practice-error" : ""}`}
            aria-live="polite"
          >
            {message}
          </div>
          <div className="practice-metrics">
            <span>{`P1 ${Math.round(s.clock.remaining.P1 / 1000)}s · P2 ${Math.round(s.clock.remaining.P2 / 1000)}s`}</span>
            <span>
              {cardLabel(s.current)} ·{" "}
              {s.budget + s.yellow + (s.optionalSpecial ? 1 : 0)}{" "}
              <span>moves left</span> · {chance}%
            </span>
          </div>
        </div>
      </section>
    </Localized>
  );
}
