import { assertInvariants } from "../domain/rules";
import type { Command } from "../domain/types";
import type { RoomCredentials, RoomView } from "./protocol";
export const ROOM_SESSION = "check-happens-private-session";
export const ROOM_SERVER = "check-happens-private-server";
export function serverAddress(input: string) {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error("INVALID_SERVER_URL");
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  )
    throw new Error("INVALID_SERVER_URL");
  if (location.protocol === "https:" && url.protocol !== "https:")
    throw new Error("HTTPS_SERVER_REQUIRED");
  return url.origin;
}
export async function roomRequest<T>(
  server: string,
  path: string,
  body?: unknown,
  token?: string,
  signal?: AbortSignal,
): Promise<T> {
  const controller = new AbortController(),
    abort = () => controller.abort();
  const timeout = setTimeout(abort, 10000);
  if (signal?.aborted) abort();
  else signal?.addEventListener("abort", abort, { once: true });
  try {
    const response = await fetch(server + path, {
      method: body === undefined ? "GET" : "POST",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const value = await response.json();
    if (!response.ok)
      throw new Error(
        typeof value.error === "string" ? value.error : "SERVER_ERROR",
      );
    return value as T;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}
function validateView(value: RoomView): RoomView {
  if (
    !value ||
    typeof value !== "object" ||
    !Number.isSafeInteger(value.revision) ||
    !Number.isSafeInteger(value.actionRevision) ||
    !Number.isFinite(value.serverNow) ||
    typeof value.joined !== "boolean" ||
    (value.startsAt !== null && !Number.isFinite(value.startsAt))
  )
    throw new Error("INVALID_SERVER_RESPONSE");
  try {
    assertInvariants(value.state);
  } catch {
    throw new Error("INVALID_SERVER_RESPONSE");
  }
  return value;
}
export const viewRoom = async (c: RoomCredentials, signal?: AbortSignal) =>
  validateView(
    await roomRequest<RoomView>(
      c.server,
      `/api/rooms/${c.roomId}`,
      undefined,
      c.token,
      signal,
    ),
  );
export async function sendRoomCommand(
  c: RoomCredentials,
  command: Command,
  expectedRevision: number,
) {
  const commandId = Array.from(
    crypto.getRandomValues(new Uint8Array(16)),
    (n) => n.toString(16).padStart(2, "0"),
  ).join("");
  const body = { commandId, command, expectedRevision };
  try {
    return validateView(
      await roomRequest<RoomView>(
        c.server,
        `/api/rooms/${c.roomId}/commands`,
        body,
        c.token,
      ),
    );
  } catch (error) {
    if (
      error instanceof TypeError ||
      (error instanceof DOMException && error.name === "AbortError")
    )
      return validateView(
        await roomRequest<RoomView>(
          c.server,
          `/api/rooms/${c.roomId}/commands`,
          body,
          c.token,
        ),
      );
    throw error;
  }
}

const errors: Record<string, string> = {
  INVALID_SERVER_URL: "Enter a complete room server address.",
  HTTPS_SERVER_REQUIRED: "This page requires an HTTPS room server.",
  ROOM_NOT_FOUND: "This room has expired or does not exist.",
  INVALID_ROOM_TOKEN: "This device no longer has access to the room.",
  INVALID_INVITE: "This invitation is not valid.",
  ROOM_FULL: "Both seats are already taken. Reconnect on your original device.",
  ROOM_CAPACITY: "The server is full. Try again later.",
  INVALID_SETTINGS: "Choose a supported time and side.",
  NOT_YOUR_TURN: "Wait for your turn.",
  STALE_REVISION: "The position changed. Check the board and try again.",
  INVALID_COMMAND: "This action is not available.",
  MATCH_NOT_STARTED: "Waiting for both players to join.",
  MATCH_FINISHED: "The match has ended.",
  LOG_AVAILABLE_AFTER_MATCH:
    "The complete JSON becomes available after the match.",
  RATE_LIMIT: "Too many requests. Wait a moment.",
  ORIGIN_NOT_ALLOWED: "This game address is not allowed by the room server.",
  STORAGE_UNAVAILABLE: "The room server is temporarily unavailable.",
  SERVER_ERROR: "The room server could not complete the request.",
  ILLEGAL_MOVE: "That move is not legal.",
  WRONG_PHASE: "This action is not available now.",
  INVALID_CHOICE: "Choose one of the highlighted options.",
  MANDATORY_ACTION: "Complete the required action first.",
  INVALID_SERVER_RESPONSE: "The room server sent an invalid position.",
};
export function roomError(error: unknown): string {
  if (
    error instanceof TypeError ||
    (error instanceof DOMException && error.name === "AbortError")
  )
    return "Connection lost. Please reconnect.";
  const text = error instanceof Error ? error.message : "SERVER_ERROR";
  return errors[text] ?? text;
}
