import type { Command, Player, State } from "../domain/types";
export type OnlineCommand = Exclude<
  Command,
  { type: "AdvanceTime" } | { type: "StartGame" }
>;
export interface RoomCredentials {
  server: string;
  roomId: string;
  token: string;
  player: Player;
  inviteLink?: string;
}
/** Redacted state is a display projection. Never run the local resolver on it. */
export interface RoomView {
  roomId: string;
  revision: number;
  actionRevision: number;
  state: State;
  joined: boolean;
  startsAt: number | null;
  serverNow: number;
  opponentOnline: boolean;
  totalMoves: number;
}
export interface RemoteGame extends RoomView {
  player: Player;
  connected: boolean;
  pending: boolean;
  send: (command: Command) => Promise<void>;
  download: () => Promise<void>;
  leave: () => void;
}
export function isOnlineCommand(value: unknown): value is OnlineCommand {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const c = value as Record<string, unknown>;
  const only = (keys: string[]) =>
    Object.keys(c).every((k) => keys.includes(k));
  const id = (v: unknown) =>
    typeof v === "string" && v.length > 0 && v.length <= 80;
  const square = (v: unknown) =>
    Number.isInteger(v) && Number(v) >= 0 && Number(v) < 64;
  switch (c.type) {
    case "SubmitMove":
      return (
        only(["type", "from", "to", "promotion"]) &&
        square(c.from) &&
        square(c.to) &&
        (c.promotion === undefined ||
          ["q", "r", "b", "n"].includes(String(c.promotion)))
      );
    case "ChooseUnoColor":
      return (
        only(["type", "color"]) &&
        ["red", "green", "blue", "yellow"].includes(String(c.color))
      );
    case "ChooseSkipTarget":
      return only(["type", "pieceId"]) && id(c.pieceId);
    case "ChooseResurrections":
      return (
        only(["type", "pieceIds"]) &&
        Array.isArray(c.pieceIds) &&
        c.pieceIds.length <= 4 &&
        c.pieceIds.every(id)
      );
    case "ChooseEvolution":
      return (
        only(["type", "pieceId", "pieceType"]) &&
        id(c.pieceId) &&
        ["r", "b", "n"].includes(String(c.pieceType))
      );
    case "EndOptionalMoves":
      return only(["type"]);
    default:
      return false;
  }
}
