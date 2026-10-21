import { test, expect } from "./fixtures";
import { deck, move, scenario, verify } from "./helpers";
test("English homepage, interactive tutorial and persistent motion preference", async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page).toHaveTitle(/Check Happens/);
  await expect(
    page.getByRole("navigation", { name: "Main menu" }).getByRole("button"),
  ).toHaveCount(3);
  await page.screenshot({ path: "docs/v2-home.png" });
  await page.getByRole("button", { name: /Tutorial/ }).click();
  await page.getByRole("button", { name: /Guided tutorial/ }).click();
  await page.getByRole("button", { name: "Draw card", exact: true }).click();
  await page.getByRole("button", { name: "← Tutorial", exact: true }).click();
  await page.getByRole("button", { name: "← Home", exact: true }).click();
  await page.getByRole("button", { name: /Settings/ }).click();
  await page.getByRole("checkbox").check();
  await page.reload();
  await page.getByRole("button", { name: /Settings/ }).click();
  await expect(page.getByRole("checkbox")).toBeChecked();
});
for (const [minutes, label] of [
  [4, "Bullet"],
  [7, "Blitz"],
  [10, "Rapid"],
] as const) {
  test(`${label} local match starts with ${minutes} minutes`, async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /^Play/ }).click();
    await page
      .getByRole("group", { name: "Time control" })
      .getByRole("button", { name: `${minutes} min ${label}` })
      .click();
    await page.getByRole("button", { name: /Local match/ }).click();
    await expect(page.getByLabel("Time P1", { exact: true })).toHaveText(
      `${String(minutes).padStart(2, "0")}:00`,
    );
  });
}
for (const level of ["Easy", "Medium", "Hard"]) {
  test(`${level} training starts and bot responds`, async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /^Play/ }).click();
    await page
      .getByRole("group", { name: "Training level" })
      .getByRole("button", { name: new RegExp(`^${level}`) })
      .click();
    await page.getByRole("button", { name: /Train with a bot/ }).click();
    await deck(page, "R1 V1 B1 G1");
    await move(page, "a2", "a3");
    await expect(page.locator(".turn-banner strong")).toHaveText("YOUR TURN!");
    await expect(page.locator(".turn-banner span")).toContainText("White");
    await verify(page);
  });
}
test("local turn changes, remaining moves and Reverse army/color persist", async ({
  page,
}) => {
  await page.goto("/?play=local");
  await deck(page, "R2 BReverse V2");
  await expect(page.getByText("2 moves left", { exact: true })).toBeVisible();
  await move(page, "a2", "a3");
  await expect(page.getByText("1 move left", { exact: true })).toBeVisible();
  await move(page, "b2", "b3");
  await expect(page.locator(".board-frame")).toHaveClass(/color-blue/);
  await expect(page.locator(".board-frame")).toHaveClass(/reverse-enter/);
  await expect(page.locator(".turn-banner")).toContainText("PLAYER 2");
  await expect(page.locator(".turn-banner")).toContainText("White");
  await expect(
    page.getByRole("button", { name: "Pass →", exact: true }),
  ).toBeVisible();
  await verify(page);
});
test("defense occurs before drawing and keeps previous red color", async ({
  page,
}) => {
  await page.goto("/?play=local");
  await scenario(page, "Defense before draw");
  await expect(page.locator(".game-screen")).toHaveAttribute(
    "data-phase",
    "PRE_DRAW_DEFENSE",
  );
  await expect(page.locator(".board-frame")).toHaveClass(/color-red/);
  await expect(page.getByText("Defend first", { exact: true })).toBeVisible();
  await move(page, "e1", "f1");
  await expect(page.locator(".board-frame")).toHaveClass(/color-green/);
  await expect(page.getByText("4 moves left", { exact: true })).toBeVisible();
  await verify(page);
});
test("full JSON exports, verifies after reload, and detects altered content", async ({
  page,
}, testInfo) => {
  await page.goto("/?play=local");
  await deck(page, "R4 V2");
  await move(page, "a2", "a3");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "a3, Pawn white, used", exact: true }),
  ).toBeVisible();
  await verify(page);
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Save match JSON", exact: true })
    .click();
  const file = await download;
  const path = testInfo.outputPath("match.json");
  await file.saveAs(path);
  const fs = await import("node:fs/promises");
  const log = JSON.parse(await fs.readFile(path, "utf8"));
  expect(log.format).toBe("check-happens-match");
  expect(log.version).toBe(2);
  expect(log.metadata.exporter.id).toMatch(/^[a-f0-9]{20}$/);
  expect(log.metadata.sessions[0]).toMatchObject({
    opponentMode: "local",
    botLevel: null,
  });
  expect(
    log.journal.entries.some((e: { kind: string }) => e.kind === "clock-run"),
  ).toBe(true);
  const save = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("scacchi-uno-pocket-v1")!),
  );
  expect(save.log.version).toBe(2);
  expect(save.state).toBeUndefined();
  expect(log.journal.entries.length).toBeGreaterThan(1);
  log.journal.entries[0].accepted = false;
  await page.getByTestId("analyze-file").setInputFiles({
    name: "altered.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(log)),
  });
  await expect(
    page.getByText("DIVERGENCE FOUND", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".verification")).toContainText(
    "first divergence #0",
  );
});
