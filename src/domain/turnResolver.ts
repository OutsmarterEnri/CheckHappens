import { record, type ActionSource } from "./audit";
import type {
  Army,
  Card,
  Command,
  DomainError,
  Player,
  Result,
  State,
} from "./types";
import { colorNames, otherArmy, otherPlayer, squareName } from "./types";
import { random, risk, shuffled, cardLabel } from "./cards";
import { engine, initialPieces, eliminate } from "../engine/implementation";
import { emit, checkpoint } from "./events";
import { advance, colorBonus, finish } from "./clock";
import {
  assertInvariants,
  availableResurrections,
  canEnd,
  clearBlock,
  evolutionChoices,
  movesAllowed,
  reset,
  resurrect,
  resurrectionCount,
} from "./rules";
export function createGame(
  seed = 2026,
  now = 0,
  deck?: Card[],
  minutes: 4 | 7 | 10 = 7,
  startingArmy: Army = "w",
): State {
  if (![4, 7, 10].includes(minutes))
    throw new Error("Unsupported time control");
  const shuffledDeck = shuffled(seed);
  const s: State = {
    version: 1,
    initialMinutes: minutes,
    pieces: initialPieces(),
    control: { P1: startingArmy, P2: otherArmy(startingArmy) },
    active: startingArmy === "w" ? "P1" : "P2",
    orientation: startingArmy,
    mode: "uno",
    phase: "READY",
    turn: 0,
    deck: deck ?? shuffledDeck.deck,
    deckIndex: 0,
    discards: [],
    rng: shuffledDeck.rng,
    seed,
    color: null,
    current: null,
    used: [],
    preDefense: false,
    specialConsumed: false,
    budget: 0,
    optionalSpecial: false,
    moveIndex: 0,
    yellow: 0,
    rescue: null,
    transitionPending: false,
    ep: [],
    clock: {
      remaining: { P1: minutes * 60000, P2: minutes * 60000 },
      lastAt: now,
    },
    outcome: null,
    events: [],
    halfmoves: 0,
    repetitions: {},
  };
  checkpoint(s);
  return s;
}
function discard(s: State) {
  if (s.current) {
    s.discards.push(s.current);
    s.current = null;
  }
}
function classical(s: State) {
  s.mode = "classical";
  s.color = null;
  s.yellow = 0;
  for (const p of s.pieces) clearBlock(p);
  s.transitionPending = false;
  s.halfmoves = 0;
  s.repetitions = {};
  emit(s, "ClassicalPhaseStarted", "Deck empty: switching to classic chess");
}
function begin(s: State, player: Player): void {
  s.active = player;
  s.turn++;
  s.phase = "TURN_START";
  s.used = [];
  s.preDefense = false;
  s.specialConsumed = false;
  s.budget = 0;
  s.optionalSpecial = false;
  s.moveIndex = 0;
  s.yellow = 0;
  s.rescue = null;
  emit(s, "TurnStarted", `Turn ${s.turn} · ${player}`, {
    player,
    army: s.control[player],
  });
  if (s.mode === "uno" && s.deckIndex >= s.deck.length) classical(s);
  const army = s.control[player],
    moves = engine.legalMoves(s, army),
    check = engine.inCheck(s, army);
  if (s.mode === "classical") {
    if (!moves.length) {
      finish(
        s,
        check ? otherPlayer(player) : null,
        check ? "Checkmate" : "Stalemate",
      );
      return;
    }
    if (engine.deadPosition(s)) {
      finish(s, null, "Dead position");
      return;
    }
    const key = engine.positionKey(s);
    s.repetitions[key] = (s.repetitions[key] ?? 0) + 1;
    if (s.repetitions[key] >= 3) {
      finish(s, null, "Threefold repetition");
      return;
    }
    if (s.halfmoves >= 100) {
      finish(s, null, "50-move rule");
      return;
    }
    s.budget = 1;
    s.phase = "RESOLVE_MOVES";
    return;
  }
  if (check && moves.length) {
    s.phase = "PRE_DRAW_DEFENSE";
    emit(s, "DefenseRequired", "Defend your king before drawing", {
      color: s.color,
    });
    return;
  }
  if (!moves.length) {
    s.rescue = check ? "mate" : "stalemate";
    s.phase = check ? "EMERGENCY_DRAW" : "STALEMATE_RESCUE";
    emit(
      s,
      check ? "EmergencyDrawStarted" : "StalemateRescueStarted",
      check ? "Checkmate: one emergency card" : "Stalemate: one rescue card",
    );
  }
  draw(s);
}
function end(s: State): void {
  if (s.outcome) return;
  s.phase = "TURN_END";
  for (const p of s.pieces)
    if (
      p.blocked &&
      s.turn > (p.blockedAtTurn ?? s.turn) &&
      p.army === s.control[s.active]
    ) {
      clearBlock(p);
      emit(s, "BlockExpired", `Freeze expired: ${p.id}`, { pieceId: p.id });
    }
  s.ep = s.ep.filter((e) => e.expiresAfterTurn > s.turn);
  discard(s);
  emit(s, "TurnEnded", `Turn ended ${s.active}`);
  if (s.transitionPending) classical(s);
  begin(s, otherPlayer(s.active));
}
function draw(s: State): void {
  if (s.deckIndex >= s.deck.length) {
    if (s.rescue === "mate")
      finish(s, otherPlayer(s.active), "Checkmate: no rescue card left");
    else if (s.rescue === "stalemate") finish(s, null, "Stalemate");
    else {
      classical(s);
      s.phase = "RESOLVE_MOVES";
      s.budget = 1;
    }
    return;
  }
  discard(s);
  s.phase = "DRAW";
  s.current = s.deck[s.deckIndex++];
  s.transitionPending = s.deckIndex === s.deck.length;
  emit(s, "CardDrawn", `${s.active} draws ${cardLabel(s.current)}`, {
    card: structuredClone(s.current),
    emergency: s.rescue,
  });
  if (s.current.color) {
    s.color = s.current.color;
    emit(s, "UnoColorChanged", `Color: ${colorNames[s.color]}`, {
      color: s.color,
    });
    effect(s);
  } else s.phase = "CHOOSE_COLOR";
}
function effect(s: State): void {
  const card = s.current!;
  s.phase = "RESOLVE_EFFECT";
  s.budget = 0;
  s.optionalSpecial = !s.specialConsumed;
  if (card.kind === "number") {
    s.budget = card.value!;
    s.optionalSpecial = false;
    afterEffect(s, false);
    return;
  }
  if (card.kind === "reset") {
    reset(s);
    afterEffect(s, true);
    return;
  }
  if (card.kind === "reverse") {
    [s.control.P1, s.control.P2] = [s.control.P2, s.control.P1];
    [s.clock.remaining.P1, s.clock.remaining.P2] = [
      s.clock.remaining.P2,
      s.clock.remaining.P1,
    ];
    s.orientation = otherArmy(s.orientation);
    emit(s, "ArmiesSwapped", "Reverse: armies and board orientation swapped", {
      control: { ...s.control },
    });
    emit(s, "ClocksSwapped", "Reverse: remaining clocks swapped", {
      remaining: { ...s.clock.remaining },
    });
    const opponent = otherPlayer(s.active);
    if (engine.inCheck(s, s.control[opponent])) {
      end(s);
      return;
    }
    if (
      engine.inCheck(s, s.control[s.active]) &&
      !engine.legalMoves(s, s.control[s.active]).length
    ) {
      discard(s);
      s.specialConsumed = false;
      s.rescue = "mate";
      emit(
        s,
        "EmergencyDrawStarted",
        "Your new army is checkmated: emergency draw",
      );
      draw(s);
      return;
    }
    afterEffect(s, false);
    return;
  }
  if (card.kind === "skip") {
    if (
      s.pieces.some(
        (p) =>
          p.army !== s.control[s.active] && p.square !== null && p.type !== "k",
      )
    )
      s.phase = "CHOOSE_TARGETS";
    else fallback(s);
    return;
  }
  if (card.kind === "draw2" || card.kind === "draw4") {
    if (resurrectionCount(s) > 0) s.phase = "CHOOSE_TARGETS";
    else fallback(s);
    return;
  }
  if (card.kind === "wild") {
    if (evolutionChoices(s).length) s.phase = "CHOOSE_TARGETS";
    else fallback(s);
  }
}
function fallback(s: State) {
  emit(
    s,
    "CardUnusable",
    "Effect unavailable: standard move remains if unused",
  );
  afterEffect(s, false);
}
function afterEffect(s: State, selfMateLoses: boolean) {
  if (s.outcome) return;
  s.phase = "RESOLVE_MOVES";
  const own = s.control[s.active],
    check = engine.inCheck(s, own),
    legal = movesAllowed(s);
  if (check && !legal.length) {
    finish(
      s,
      otherPlayer(s.active),
      selfMateLoses
        ? "No defense after your own effect"
        : "Checkmate: rescue failed",
    );
    return;
  }
  if (!check && engine.inCheck(s, otherArmy(own))) {
    end(s);
    return;
  }
  if (s.rescue && !engine.legalMoves(s, own).length) {
    finish(s, null, "Stalemate: card could not help");
    return;
  }
  settleMoves(s);
}
function settleMoves(s: State) {
  if (s.outcome) return;
  if (s.budget === 0 && s.yellow === 0 && !s.optionalSpecial) {
    if (engine.inCheck(s, s.control[s.active]))
      finish(s, otherPlayer(s.active), "No action left to defend the king");
    else end(s);
    return;
  }
  if (!movesAllowed(s).length) {
    if (engine.inCheck(s, s.control[s.active]))
      finish(s, otherPlayer(s.active), "No defense available");
    else end(s);
  }
}
function fail(code: DomainError["code"], message: string): never {
  throw { code, message } satisfies DomainError;
}
export function resolveCommand(
  input: State,
  command: Command,
  now: number,
): Result {
  if (input.outcome)
    return {
      ok: false,
      state: input,
      error: { code: "GAME_OVER", message: "The match is over." },
    };
  if (!Number.isFinite(now) || now < input.clock.lastAt)
    return {
      ok: false,
      state: input,
      error: { code: "INVALID_TIME", message: "Invalid timestamp." },
    };
  const { events: oldEvents, ...body } = input;
  const timed: State = { ...structuredClone(body), events: [...oldEvents] };
  advance(timed, now);
  if (now !== input.clock.lastAt && input.phase !== "READY")
    emit(timed, "ClockAdvanced", "Clock updated", {
      clock: structuredClone(timed.clock),
    });
  if (timed.outcome) {
    checkpoint(timed);
    return { ok: true, state: timed };
  }
  const { events: timedEvents, ...timedBody } = timed;
  const s: State = { ...structuredClone(timedBody), events: [...timedEvents] };
  try {
    switch (command.type) {
      case "StartGame":
        if (s.phase !== "READY")
          fail("WRONG_PHASE", "The match has already started.");
        s.clock.lastAt = now;
        begin(s, s.active);
        break;
      case "AdvanceTime":
        break;
      case "ChooseUnoColor":
        if (s.phase !== "CHOOSE_COLOR")
          fail("WRONG_PHASE", "You cannot choose a color now.");
        if (!["red", "green", "blue", "yellow"].includes(command.color))
          fail("INVALID_CHOICE", "Invalid color.");
        s.color = command.color;
        emit(s, "UnoColorChanged", `Chosen color: ${colorNames[s.color]}`, {
          color: s.color,
        });
        effect(s);
        break;
      case "ChooseSkipTarget": {
        if (s.phase !== "CHOOSE_TARGETS" || s.current?.kind !== "skip")
          fail("WRONG_PHASE", "No freeze effect pending.");
        const target = s.pieces.find(
          (p) =>
            p.id === command.pieceId &&
            p.square !== null &&
            p.army !== s.control[s.active] &&
            p.type !== "k",
        );
        if (!target) fail("INVALID_CHOICE", "Invalid target.");
        target!.blocked = true;
        target!.blockedAtTurn = s.turn;
        emit(s, "PieceBlocked", `Frozen ${target!.id}`, {
          pieceId: target!.id,
        });
        afterEffect(s, false);
        break;
      }
      case "ChooseResurrections": {
        if (
          s.phase !== "CHOOSE_TARGETS" ||
          !["draw2", "draw4"].includes(s.current?.kind ?? "")
        )
          fail("WRONG_PHASE", "No resurrection pending.");
        const ids = command.pieceIds,
          available = availableResurrections(s);
        if (
          ids.length !== resurrectionCount(s) ||
          new Set(ids).size !== ids.length ||
          ids.some((id) => !available.some((p) => p.id === id))
        )
          fail(
            "INVALID_CHOICE",
            "Choose the maximum number of eligible pieces without duplicates.",
          );
        resurrect(s, ids);
        afterEffect(s, true);
        break;
      }
      case "ChooseEvolution": {
        if (s.phase !== "CHOOSE_TARGETS" || s.current?.kind !== "wild")
          fail("WRONG_PHASE", "No evolution pending.");
        if (
          !evolutionChoices(s).some(
            (c) =>
              c.pieceId === command.pieceId &&
              c.pieceType === command.pieceType,
          )
        )
          fail("INVALID_CHOICE", "That evolution is not allowed.");
        s.pieces.find((p) => p.id === command.pieceId)!.type =
          command.pieceType;
        emit(
          s,
          "PieceTransformed",
          `Evolution ${command.pieceId} → ${command.pieceType}`,
          { pieceId: command.pieceId, pieceType: command.pieceType },
        );
        afterEffect(s, false);
        break;
      }
      case "EndOptionalMoves":
        if (!canEnd(s))
          fail(
            "MANDATORY_ACTION",
            "Required moves remain or your king needs defending.",
          );
        s.budget = 0;
        s.optionalSpecial = false;
        end(s);
        break;
      case "SubmitMove": {
        if (!["PRE_DRAW_DEFENSE", "RESOLVE_MOVES"].includes(s.phase))
          fail("WRONG_PHASE", "Resolve the card choice first.");
        const move = movesAllowed(s).find(
          (m) =>
            m.from === command.from &&
            m.to === command.to &&
            m.promotion === command.promotion,
        );
        if (!move) fail("ILLEGAL_MOVE", "Move not allowed in this phase.");
        const m = move!,
          defense = s.phase === "PRE_DRAW_DEFENSE",
          p = s.pieces.find((q) => q.id === m.pieceId)!,
          pawnMove = p.type === "p";
        engine.apply(s, m);
        s.halfmoves = m.captureId || pawnMove ? 0 : s.halfmoves + 1;
        if (s.mode === "uno") {
          s.used.push(m.pieceId);
          if (m.castleRook) s.used.push(m.castleRook);
        }
        emit(
          s,
          "MoveCompleted",
          `${s.active}: ${squareName(m.from)} → ${squareName(m.to)}${m.captureId ? " ×" : ""}${m.promotion ? ` = ${m.promotion}` : ""}`,
          { move: m, defense },
        );
        if (s.mode === "classical") {
          end(s);
          break;
        }
        if (defense) {
          s.preDefense = true;
          s.specialConsumed = true;
          if (s.color === "yellow" && m.captureId) s.yellow++;
          colorBonus(s);
          if (s.outcome) break;
          if (engine.inCheck(s, otherArmy(s.control[s.active]))) {
            end(s);
            break;
          }
          draw(s);
          break;
        }
        let cost = m.cost;
        while (cost-- > 0) {
          if (s.moveIndex < 4 && s.budget > 0) s.budget--;
          else if (s.yellow > 0) s.yellow--;
          else if (s.budget > 0) s.budget--;
          else s.optionalSpecial = false;
          s.moveIndex++;
        }
        const probability = risk(s.moveIndex, s.color);
        let destroyed = false;
        if (probability > 0) {
          let roll;
          [roll, s.rng] = random(s.rng);
          destroyed = roll < probability;
          emit(
            s,
            "RiskResolved",
            `Break risk ${Math.round(probability * 100)}% · ${destroyed ? "piece broke" : "piece survived"}`,
            { probability, roll, destroyed, pieceId: p.id },
          );
          if (destroyed) {
            eliminate(s, p.id, "risk");
            emit(s, "PieceDestroyed", `${p.id} broke from risk`, {
              pieceId: p.id,
              cause: "risk",
            });
          }
        }
        colorBonus(s);
        if (s.outcome) break;
        if (engine.inCheck(s, s.control[s.active])) {
          finish(s, otherPlayer(s.active), "The break exposed your own king");
          break;
        }
        if (s.color === "yellow" && m.captureId && !destroyed) {
          s.yellow++;
          emit(
            s,
            "YellowBonusGranted",
            "Yellow capture: one extra required move",
          );
        }
        if (destroyed || engine.inCheck(s, otherArmy(s.control[s.active]))) {
          end(s);
          break;
        }
        settleMoves(s);
        break;
      }
    }
    assertInvariants(s);
    if (command.type !== "AdvanceTime" || s.outcome) checkpoint(s);
    return { ok: true, state: s };
  } catch (error) {
    const e = error as DomainError;
    if (!e.code) throw error;
    return { ok: false, state: timed, error: e };
  }
}

export function dispatch(
  input: State,
  command: Command,
  now: number,
  source: ActionSource = "system",
): Result {
  return record(input, command, now, source);
}
