import { test, expect } from "./fixtures";
import { deck, scenario } from "./helpers";
for (const [width, height] of [
  [375, 667],
  [393, 852],
  [430, 932],
  [768, 1024],
])
  test(`game fits ${width}x${height} without page scrolling`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/?play=local");
    await deck(page, "R9 V2");
    const bounds = await page.evaluate(() => ({
      scroll:
        document.documentElement.scrollHeight > innerHeight ||
        document.documentElement.scrollWidth > innerWidth,
      boxes: [
        ".game-header",
        ".turn-banner",
        ".board-frame",
        ".bottom-player",
        ".play-dock",
        ".action-bar",
      ].map((s) => {
        const r = document.querySelector(s)!.getBoundingClientRect();
        return {
          selector: s,
          top: r.top,
          bottom: r.bottom,
          left: r.left,
          right: r.right,
        };
      }),
    }));
    expect(bounds.scroll).toBe(false);
    for (const box of bounds.boxes) {
      expect(box.top, box.selector).toBeGreaterThanOrEqual(0);
      expect(box.bottom, box.selector).toBeLessThanOrEqual(height);
      expect(box.left).toBeGreaterThanOrEqual(0);
      expect(box.right).toBeLessThanOrEqual(width);
    }
    await page.mouse.wheel(0, 800);
    expect(await page.evaluate(() => scrollY)).toBe(0);
    if (width === 393) {
      await expect(page.locator(".comic-fx")).toHaveCount(0);
      await page.screenshot({ path: "docs/v2-game-iphone.png" });
    }
  });
test("reduced motion keeps risk and finale readable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/?play=local");
  await scenario(page, "Break-risk demo", false);
  expect(
    await page
      .locator(".at-risk .piece-actor")
      .first()
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
  await scenario(page, "Win finale", false);
  await expect(
    page.getByRole("dialog", { name: "PLAYER 1 WINS!" }),
  ).toBeVisible();
  await page.screenshot({ path: "docs/v2-finale.png" });
});
test("built app works offline after service worker installation", async ({
  page,
  context,
}) => {
  await page.goto(process.env.PW_PRODUCTION_URL ?? "http://127.0.0.1:4173/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await page.getByRole("button", { name: /^Play/ }).click();
  await page.getByRole("button", { name: /Local match/ }).click();
  await expect(
    page.getByRole("button", { name: "Start match →", exact: true }),
  ).toBeVisible();
});

test("landscape explains portrait mode and primary controls have touch targets", async ({
  page,
}) => {
  await page.setViewportSize({ width: 852, height: 393 });
  await page.goto("/?play=local");
  await expect(
    page.getByText("Rotate your phone to portrait to play.", { exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 393, height: 852 });
  await expect(
    page.getByText("Rotate your phone to portrait to play.", { exact: true }),
  ).toBeHidden();
  for (const label of ["New match", "Game options", "Start match →"]) {
    const r = await page
      .getByRole("button", { name: label, exact: true })
      .boundingBox();
    expect(r!.width).toBeGreaterThanOrEqual(44);
    expect(r!.height).toBeGreaterThanOrEqual(44);
  }
});
