import { readFileSync } from "node:fs";
import { test, expect } from "./fixtures";
// Chromium cannot reproduce iOS compositor blur. Activate the actual guarded
// stylesheet with synthetic safe-area values to verify inset transfer geometry.
const fix = readFileSync("src/ui/menus.css", "utf8")
  .split("/* iOS standalone notch:")[1]
  .split("*/")[1]
  .replace("@media (display-mode: standalone)", "@media all")
  .replace(
    "@supports (-webkit-touch-callout: none)",
    "@supports (display: block)",
  );
for (const [width, height, inset] of [
  [320, 568, 0],
  [393, 852, 59],
]) {
  test(`standalone notch headers preserve controls at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const baseline = await page.addStyleTag({
      content: `.menu-screen,.learn-page{padding-top:${Math.max(6, inset)}px!important}.menu-home.menu-v3{padding-top:${Math.max(height <= 720 ? 8 : 14, inset)}px!important}`,
    });
    const css = fix
      .replaceAll("env(safe-area-inset-top)", `${inset}px`)
      .replaceAll("padding-top: 0;", "padding-top: 0 !important;");
    async function verify() {
      const header = page.locator("main > header");
      const controls = header.locator("button, h1, .menu-overline");
      const before = await controls.evaluateAll((es) =>
        es.map((e) => e.getBoundingClientRect().top),
      );
      const injected = await page.addStyleTag({ content: css });
      expect(await header.evaluate((e) => e.getBoundingClientRect().top)).toBe(
        0,
      );
      expect(await header.evaluate((e) => getComputedStyle(e).position)).toBe(
        "sticky",
      );
      expect(
        await header.evaluate((e) => getComputedStyle(e).backgroundColor),
      ).not.toBe("rgba(0, 0, 0, 0)");
      const after = await controls.evaluateAll((es) =>
        es.map((e) => e.getBoundingClientRect().top),
      );
      after.forEach((v, i) => expect(Math.abs(v - before[i])).toBeLessThan(1));
      expect(
        await page
          .locator("main")
          .evaluate((e) => e.scrollHeight <= e.clientHeight + 1),
      ).toBe(true);
      await injected.evaluate((e) => e.parentNode!.removeChild(e));
    }
    await verify();
    await page.locator(".home-menu > button").nth(0).click();
    await verify();
    await page.locator(".private-play").click();
    await verify();
    await page.locator(".private-tabs button").nth(1).click();
    await verify();
    await page.locator(".back-menu").click();
    await page.locator(".home-menu > button").nth(2).click();
    await verify();
    await page.locator(".back-menu").click();
    await page.locator(".home-menu > button").nth(1).click();
    await verify();
    for (const i of [1, 2, 0]) {
      await page.locator(".learn-hub-options button").nth(i).click();
      await verify();
      await page.locator(".learn-page > header button").first().click();
    }
    await baseline.evaluate((e) => e.parentNode!.removeChild(e));
  });
}
