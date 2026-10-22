import { isCommand } from "../domain/commands";
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
  return (
    isCommand(value) &&
    value.type !== "StartGame" &&
    value.type !== "AdvanceTime"
  );
}
