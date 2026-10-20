/** Contratto progettuale: nessun trasporto online è attivo nel prototipo. */
import type { Command, GameEvent, Player, State } from "../domain/types";
export type OnlineCommand = Exclude<
  Command,
  { type: "AdvanceTime" } | { type: "StartGame" }
>;
export type ClientMessage =
  | { type: "JoinRoom"; inviteToken: string; resumeToken?: string }
  | { type: "Ready"; roomId: string }
  | {
      type: "Command";
      roomId: string;
      commandId: string;
      expectedRevision: number;
      command: OnlineCommand;
    };
export type ServerMessage =
  | {
      type: "Joined";
      roomId: string;
      player: Player;
      resumeToken: string;
      revision: number;
      snapshot: State;
      serverNow: number;
    }
  | {
      type: "Updated";
      revision: number;
      events: GameEvent[];
      serverNow: number;
    }
  | { type: "Resync"; revision: number; snapshot: State; serverNow: number }
  | {
      type: "Rejected";
      commandId: string;
      reason:
        "NOT_YOUR_TURN" | "STALE_REVISION" | "INVALID_COMMAND" | "ROOM_CLOSED";
    };
export interface PrivateRoomTransport {
  connect(inviteToken: string): Promise<void>;
  send(message: ClientMessage): void;
  subscribe(listener: (message: ServerMessage) => void): () => void;
  close(): void;
}
