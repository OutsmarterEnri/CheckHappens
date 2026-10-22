import { useEdgeBack } from "./useEdgeBack";
import { useEffect, useRef, useState } from "react";
import { App } from "./App";
import { Localized } from "./locale";
import { readPreference, writePreference } from "./preferences";
import {
  roomRequest,
  serverAddress,
  viewRoom,
  sendRoomCommand,
  ROOM_SERVER,
  ROOM_SESSION,
  roomError,
} from "../online/client";
import type { RoomCredentials, RoomView } from "../online/protocol";
import type { Minutes, SidePreference } from "../domain/match";
const savedSession = () => {
  try {
    const raw = JSON.parse(sessionStorage.getItem(ROOM_SESSION) ?? "null");
    return raw &&
      typeof raw.server === "string" &&
      typeof raw.roomId === "string" &&
      typeof raw.token === "string" &&
      ["P1", "P2"].includes(raw.player)
      ? (raw as RoomCredentials)
      : null;
  } catch {
    return null;
  }
};
export function PrivateRoom({
  minutes,
  side,
  onHome,
  onBack = onHome,
}: {
  minutes: Minutes;
  side: SidePreference;
  onHome: () => void;
  onBack?: () => void;
}) {
  const fragment = new URLSearchParams(location.hash.slice(1));
  const [address, setAddress] = useState(
    () =>
      fragment.get("server") ??
      readPreference<string>(
        ROOM_SERVER,
        import.meta.env.VITE_ROOM_SERVER_URL ||
          (location.port === "8787" ? location.origin : ""),
      ),
  );
  const [joining, setJoining] = useState(() => fragment.has("invite"));
  const [roomId, setRoomId] = useState(() => fragment.get("room") ?? "");
  const [invite, setInvite] = useState(() => fragment.get("invite") ?? "");
  const [session, setSession] = useState<RoomCredentials | null>(null);
  const [previous, setPrevious] = useState(savedSession);
  const [view, setView] = useState<RoomView | null>(null);
  const [connected, setConnected] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const inviteLink = session?.inviteLink ?? "";
  const [notice, setNotice] = useState("");
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const remember = (c: RoomCredentials) => {
    try {
      sessionStorage.setItem(ROOM_SESSION, JSON.stringify(c));
    } catch {}
    setSession(c);
    setPrevious(c);
    writePreference(ROOM_SERVER, c.server);
    history.replaceState(null, "", location.pathname);
  };
  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();
    let stopped = false,
      timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const state = await viewRoom(session, controller.signal);
        if (stopped) return;
        setView(state);
        setConnected(true);
        setError("");
      } catch (e) {
        if (stopped) return;
        setConnected(false);
        setError(roomError(e));
      }
      if (!stopped) timer = setTimeout(poll, 500);
    };
    void poll();
    return () => {
      stopped = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [session]);
  const leave = () => {
    setSession(null);
    setView(null);
    setConnected(false);
    setError("");
  };
  const create = async () => {
    setPending(true);
    setError("");
    try {
      const server = serverAddress(address),
        created = await roomRequest<
          Omit<RoomCredentials, "server"> & { invite: string }
        >(server, "/api/rooms", { minutes, side });
      if (!alive.current) return;
      const c = {
        server,
        roomId: created.roomId,
        token: created.token,
        player: created.player,
      };
      const link = new URL(location.href);
      link.search = "";
      link.hash = new URLSearchParams({
        room: created.roomId,
        invite: created.invite,
        server,
      }).toString();
      remember({ ...c, inviteLink: link.href });
    } catch (e) {
      if (alive.current) setError(roomError(e));
    } finally {
      if (alive.current) setPending(false);
    }
  };
  const join = async () => {
    setPending(true);
    setError("");
    try {
      const server = serverAddress(address),
        joined = await roomRequest<Omit<RoomCredentials, "server">>(
          server,
          `/api/rooms/${roomId.trim()}/join`,
          { invite: invite.trim() },
        );
      if (alive.current) remember({ ...joined, server });
    } catch (e) {
      if (alive.current) setError(roomError(e));
    } finally {
      if (alive.current) setPending(false);
    }
  };
  useEdgeBack(
    () => {
      if (session) onHome();
      else if (joining) setJoining(false);
      else onBack();
    },
    !pending && !(session && view?.joined),
  );
  if (session && view && view.joined)
    return (
      <App
        key={session.server + session.roomId + session.player}
        opponentMode="local"
        minutes={view.state.initialMinutes ?? minutes}
        onHome={onHome}
        online={{
          ...view,
          player: session.player,
          connected,
          pending,
          leave,
          send: async (command) => {
            if (pending) return;
            setPending(true);
            setError("");
            try {
              const next = await sendRoomCommand(
                session,
                command,
                view.actionRevision,
              );
              if (alive.current) {
                setView(next);
                setConnected(true);
                setError("");
              }
            } catch (e) {
              if (alive.current) {
                setError(roomError(e));
                throw new Error(roomError(e));
              }
            } finally {
              if (alive.current) setPending(false);
            }
          },
          download: async () => {
            const log = await roomRequest<unknown>(
              session.server,
              `/api/rooms/${session.roomId}/log`,
              undefined,
              session.token,
            );
            const href = URL.createObjectURL(
                new Blob([JSON.stringify(log, null, 2)], {
                  type: "application/json",
                }),
              ),
              a = document.createElement("a");
            a.href = href;
            a.download = `check-happens-private-${session.roomId}.json`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(href), 0);
          },
        }}
      />
    );
  return (
    <Localized>
      <main className="menu-screen private-menu">
        <button className="quiet back-menu" onClick={onHome}>
          ← Home
        </button>
        <h1>Private match</h1>
        <p role="note">Experimental multiplayer · testing only</p>
        {session ? (
          <>
            <h2>Waiting for your friend…</h2>
            <p>
              Send this invite link. The match starts when the second player
              joins.
            </p>
            {inviteLink && (
              <>
                <label>
                  Invite link
                  <input
                    aria-label="Invite link"
                    readOnly
                    value={inviteLink}
                    onFocus={(e) => e.target.select()}
                  />
                </label>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(inviteLink);
                      setNotice("Invite copied!");
                    } catch {
                      setNotice("Select and copy the invite link.");
                    }
                  }}
                >
                  Copy invitation
                </button>
              </>
            )}
            <p role="status">
              {connected ? "Connected to room" : "Reconnecting…"}
            </p>
            <button className="quiet" onClick={leave}>
              Leave room
            </button>
          </>
        ) : (
          <>
            {!joining && (
              <p>
                Play on two devices. White starts; cards and clocks are managed
                by the room server.
              </p>
            )}
            <div className="private-tabs">
              <button aria-pressed={!joining} onClick={() => setJoining(false)}>
                Create
              </button>
              <button aria-pressed={joining} onClick={() => setJoining(true)}>
                Join an invitation
              </button>
            </div>
            <label>
              Room server
              <input
                aria-label="Room server"
                type="url"
                placeholder="https://your-room-server.example"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </label>
            {!joining && (
              <small>
                A separate room server is required. For a Wi-Fi test, open the
                address printed by the server on both phones.
              </small>
            )}
            {!joining && (
              <button
                className="primary"
                disabled={pending || !address.trim()}
                onClick={create}
              >
                Create private room
              </button>
            )}
            {joining && (
              <section className="private-join">
                <label>
                  Room code
                  <input
                    aria-label="Room code"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                  />
                </label>
                <label>
                  Invitation key
                  <input
                    aria-label="Invitation key"
                    value={invite}
                    onChange={(e) => setInvite(e.target.value)}
                  />
                </label>
                <button
                  disabled={
                    pending ||
                    !address.trim() ||
                    !roomId.trim() ||
                    !invite.trim()
                  }
                  onClick={join}
                >
                  Join private room
                </button>
              </section>
            )}
            {previous && (
              <button
                onClick={() => {
                  setError("");
                  setSession(previous);
                }}
              >
                Reconnect to previous room
              </button>
            )}
          </>
        )}
        {pending && <p role="status">Connecting…</p>}
        {notice && <p role="status">{notice}</p>}
        {error && <p role="alert">{error}</p>}
      </main>
    </Localized>
  );
}
