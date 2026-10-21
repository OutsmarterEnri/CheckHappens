import { test, expect } from "./fixtures";
import { movesAllowed } from "../../src/domain/rules";
import { squareName, type State } from "../../src/domain/types";
import type { RoomCredentials } from "../../src/online/protocol";
const server = process.env.PW_ROOM_SERVER_URL ?? "http://127.0.0.1:8787";
test("two independent devices join an invite, share legal actions and reconnect", async ({
  page,
  browser,
}) => {
  const context = await browser.newContext({
      viewport: { width: 393, height: 852 },
    }),
    guest = await context.newPage();
  const errors: string[] = [];
  guest.on("pageerror", (e) => errors.push(e.message));
  try {
    await page.goto("/");
    await page.getByRole("button", { name: /^Play/ }).click();
    await page
      .getByRole("group", { name: "Starting side" })
      .getByRole("button", { name: "Black", exact: true })
      .click();
    await page.getByRole("button", { name: /Private match/ }).click();
    await page
      .getByRole("textbox", { name: "Room server", exact: true })
      .fill(server);
    await page
      .getByRole("button", { name: "Create private room", exact: true })
      .click();
    const link = await page
      .getByRole("textbox", { name: "Invite link", exact: true })
      .inputValue();
    expect(link).not.toContain("token=");
    await guest.goto(link);
    await guest
      .getByRole("button", { name: "Join private room", exact: true })
      .click();
    await expect(page.locator(".game-screen")).not.toHaveAttribute(
      "data-phase",
      "READY",
      { timeout: 10000 },
    );
    await expect(guest.locator(".game-screen")).not.toHaveAttribute(
      "data-phase",
      "READY",
      { timeout: 10000 },
    );
    await expect(guest.locator(".turn-banner strong")).toHaveText("YOUR TURN!");
    await expect(page.locator(".turn-banner strong")).toHaveText(
      "OPPONENT’S TURN",
    );
    const credentials = (await guest.evaluate(() =>
      JSON.parse(sessionStorage.getItem("check-happens-private-session")!),
    )) as RoomCredentials;
    const read = async () => {
      const response = await guest.request.get(
        server + `/api/rooms/${credentials.roomId}`,
        { headers: { Authorization: `Bearer ${credentials.token}` } },
      );
      return response.json() as Promise<{
        state: State;
        actionRevision: number;
      }>;
    };
    for (let guard = 0; guard < 6; guard++) {
      const view = await read();
      if (view.state.phase === "RESOLVE_MOVES") break;
      if (view.state.phase === "CHOOSE_COLOR")
        await guest.getByRole("button", { name: "Blue", exact: true }).click();
      else if (view.state.phase === "CHOOSE_TARGETS") {
        const ghost = guest.locator(".square.hologram");
        if (await ghost.count()) await ghost.first().click();
        else {
          await guest.locator(".square.target").first().click();
          const evolve = guest.getByRole("dialog", { name: "Evolve pawn" });
          if (await evolve.count())
            await evolve
              .getByRole("button", { name: "Rook", exact: true })
              .click();
        }
      }
      await expect
        .poll(async () => {
          const next = await read();
          return next.actionRevision;
        })
        .toBeGreaterThan(view.actionRevision);
    }
    const before = await read(),
      m = movesAllowed(before.state)[0];
    expect(m).toBeTruthy();
    await guest
      .getByRole("button", { name: new RegExp(`^${squareName(m.from)},`) })
      .click();
    await guest
      .getByRole("button", {
        name: new RegExp(`^${squareName(m.to)}.*legal destination`),
      })
      .click();
    const movedPiece = before.state.pieces.find((p) => p.id === m.pieceId)!;
    await expect
      .poll(async () => {
        const view = await read();
        return view.state.pieces.find((p) => p.id === m.pieceId)?.square;
      })
      .toBe(m.to);
    const english: Record<string, string> = {
      p: "Pawn",
      n: "Knight",
      b: "Bishop",
      r: "Rook",
      q: "Queen",
      k: "King",
    };
    await expect(
      page.getByRole("button", {
        name: new RegExp(`^${squareName(m.to)}, ${english[movedPiece.type]}`),
      }),
    ).toBeVisible();
    // No room snapshot or credentials overwrite the offline match slot.
    expect(
      await page.evaluate(() => localStorage.getItem("scacchi-uno-pocket-v1")),
    ).toBeNull();
    await context.setOffline(true);
    await expect(guest.locator(".turn-banner strong")).toHaveText(
      "RECONNECTING…",
      { timeout: 15000 },
    );
    await context.setOffline(false);
    await expect(guest.locator(".turn-banner strong")).not.toHaveText(
      "RECONNECTING…",
      { timeout: 15000 },
    );
    await guest.reload();
    await guest.getByRole("button", { name: /^Play/ }).click();
    await guest.getByRole("button", { name: /Private match/ }).click();
    await guest
      .getByRole("button", { name: "Reconnect to previous room", exact: true })
      .click();
    await expect(guest.locator(".game-screen")).toBeVisible();
    await expect(
      guest.getByRole("dialog", { name: "Starting match" }),
    ).toHaveCount(0);
    expect(errors).toEqual([]);
  } finally {
    await context.close();
  }
});
