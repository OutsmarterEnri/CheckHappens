import { test, expect } from "./fixtures";
test("Black choice starts a bot game through 3-2-1 without charging the clock", async ({
  page,
}) => {
  await page.clock.install();
  await page.addInitScript(() => {
    const original = crypto.getRandomValues.bind(crypto);
    crypto.getRandomValues = ((values: Uint32Array) => {
      if (values instanceof Uint32Array && values.length === 1) {
        values[0] = 2026;
        return values;
      }
      return original(values);
    }) as typeof crypto.getRandomValues;
  });
  await page.goto("/");
  await page.getByRole("button", { name: /^Play/ }).click();
  await page
    .getByRole("group", { name: "Starting side", exact: true })
    .getByRole("button", { name: "Black", exact: true })
    .click();
  await page.getByRole("button", { name: /Train with a bot/ }).click();
  const countdown = page.getByRole("dialog", {
    name: "Starting match",
    exact: true,
  });
  await expect(countdown.getByRole("status")).toHaveText("3");
  await expect(
    page.getByRole("button", { name: "Start match →", exact: true }),
  ).toHaveCount(0);
  await expect(
    countdown.getByText("You start with Black", { exact: true }),
  ).toBeVisible();
  for (const value of ["2", "1"]) {
    await page.clock.runFor(1000);
    await expect(countdown.getByRole("status")).toHaveText(value);
    await expect(page.getByLabel("Time P1", { exact: true })).toHaveText(
      "07:00",
    );
    await expect(page.getByLabel("Time P2", { exact: true })).toHaveText(
      "07:00",
    );
  }
  await page.clock.runFor(1000);
  await expect(countdown).toHaveCount(0);
  await expect(page.locator(".turn-banner strong")).toHaveText("BOT’S TURN");
  await expect(page.locator(".bottom-player .player-name strong")).toHaveText(
    "You",
  );
  await expect(page.locator(".bottom-player .player-name > span")).toHaveText(
    "Black army",
  );
  await page.clock.runFor(600);
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("scacchi-uno-pocket-v1")!),
  );
  expect(
    saved.log.journal.entries.some(
      (entry: { source?: string }) => entry.source === "computer",
    ),
  ).toBe(true);
});
test("countdown can be cancelled and side preference survives reopening the menu", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^Play/ }).click();
  await page
    .getByRole("group", { name: "Starting side", exact: true })
    .getByRole("button", { name: "Random", exact: true })
    .click();
  await page.getByRole("button", { name: /Local match/ }).click();
  await page
    .getByRole("dialog", { name: "Starting match", exact: true })
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  await page.reload();
  await page.getByRole("button", { name: /^Play/ }).click();
  await expect(
    page
      .getByRole("group", { name: "Starting side", exact: true })
      .getByRole("button", { name: "Random", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("resuming skips countdown while a rematch starts a fresh countdown", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  await page.getByRole("button", { name: /^Play/ }).click();
  await page.getByRole("button", { name: /Local match/ }).click();
  await page.clock.runFor(3000);
  if (
    await page
      .getByRole("dialog", { name: "Choose color", exact: true })
      .count()
  )
    await page.getByRole("button", { name: "Blue", exact: true }).click();
  await page.getByRole("button", { name: "Home", exact: true }).click();
  await page.getByRole("button", { name: /^Play/ }).click();
  await page.getByRole("button", { name: /Resume match/ }).click();
  await expect(
    page.getByRole("dialog", { name: "Starting match" }),
  ).toHaveCount(0);
  await expect(page.locator(".game-screen")).not.toHaveAttribute(
    "data-phase",
    "READY",
  );
  await page.getByRole("button", { name: "Game options", exact: true }).click();
  await page.getByRole("button", { name: "Lab & replay", exact: true }).click();
  await page.getByRole("button", { name: "Win finale", exact: true }).click();
  await page
    .getByRole("button", { name: "One more round", exact: false })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Starting match" }).getByRole("status"),
  ).toHaveText("3");
  await expect(
    page.getByRole("button", { name: "Start match →", exact: true }),
  ).toHaveCount(0);
});
