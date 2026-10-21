import { demo } from "../../src/domain/fixtures";
import { exportMatch } from "../../src/domain/audit";
import { test, expect } from "./fixtures";
import { deck, move, scenario } from "./helpers";
test("fun palettes persist without changing card effect colors", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Settings/ }).click();
  await page.getByRole("button", { name: "Minty Mayhem", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "mint");
  await page.getByRole("checkbox").check();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "mint");
  await page.goto("/?play=local");
  await deck(page, "R1 B1");
  await expect(page.locator(".board-frame")).toHaveClass(/color-red/);
  const frame = await page
    .locator(".board-frame")
    .evaluate((e) => getComputedStyle(e).backgroundColor);
  expect(frame).toBe("rgb(237, 103, 102)");
});
test("Skip wraps the blocked piece in chains and stays readable with reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?play=local");
  await deck(page, "RSkip B1 V1");
  await page
    .getByRole("button", { name: "a8, Rook black", exact: true })
    .click();
  const rook = page.getByRole("button", { name: /^a8, Rook black, blocked/ });
  await expect(rook.locator(".skip-chains")).toBeVisible();
  expect(await rook.locator(".chain-links rect").count()).toBe(10);
  await expect(rook.locator(".chain-wrap")).toHaveCSS("animation-name", "none");
  await page.getByRole("button", { name: "Pass →", exact: true }).click();
  await expect(rook.locator(".skip-chains")).toBeVisible();
});
test("crevices progress from Blue risk to the highest effective risk", async ({
  page,
}) => {
  await page.goto("/?play=local");
  await scenario(page, "Blue risk");
  for (const [a, b] of [
    ["a2", "a3"],
    ["b2", "b3"],
    ["c2", "c3"],
    ["d2", "d3"],
  ])
    await move(page, a, b);
  await expect(
    page.locator('.crack[data-crack-stage="1"]').first(),
  ).toBeVisible();
  expect(
    await page
      .locator('.crack[data-crack-stage="1"]')
      .first()
      .locator("path")
      .count(),
  ).toBe(1);
  const lowCount = await page
    .locator('.crack[data-crack-stage="1"]')
    .first()
    .locator("path")
    .count();
  const state = demo("breakage", 0);
  state.moveIndex = 8;
  state.budget = 1;
  await page.getByRole("button", { name: "Game options", exact: true }).click();
  await page.getByRole("button", { name: "Lab & replay", exact: true }).click();
  const chooserPromise = page.waitForEvent("filechooser");
  await page
    .getByRole("button", { name: "Import replay", exact: true })
    .click();
  const chooser = await chooserPromise;
  await chooser.setFiles({
    name: "risk-99.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(exportMatch(state))),
  });
  const severe = page.locator('.crack[data-crack-stage="5"]').first();
  await expect(severe).toBeVisible();
  expect(await severe.locator("path").count()).toBeGreaterThan(lowCount);
});
