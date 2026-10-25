import { test, expect } from "./fixtures";
import { themes } from "../../src/ui/themes";
import type { Page } from "@playwright/test";
async function contrast(page: Page, selector: string) {
  const failures = await page.locator(selector).evaluateAll((es) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d")!;
    const rgba = (s: string) => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = s;
      ctx.fillRect(0, 0, 1, 1);
      return [...ctx.getImageData(0, 0, 1, 1).data];
    };
    const luminance = (rgb: number[]) =>
      rgb
        .slice(0, 3)
        .map((v) => {
          v /= 255;
          return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
        })
        .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
    return es
      .filter((e) => e.getClientRects().length && !e.closest(":disabled"))
      .map((e) => {
        const layers: number[][] = [];
        for (let node: Element | null = e; node; node = node.parentElement)
          layers.push(rgba(getComputedStyle(node).backgroundColor));
        let background = [255, 255, 255];
        for (const layer of layers.reverse()) {
          const a = layer[3] / 255;
          background = background.map((v, i) => layer[i] * a + v * (1 - a));
        }
        const fg = luminance(rgba(getComputedStyle(e).color)),
          bg = luminance(background);
        return {
          text: e.textContent?.trim().slice(0, 45),
          ratio: (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05),
        };
      })
      .filter((v) => v.ratio < 4.5);
  });
  expect(failures, selector).toEqual([]);
}
test("refreshed text stays readable across all six worlds", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 393, height: 852 });
  for (const theme of themes) {
    await page.goto("/");
    await page.evaluate(
      (t) => localStorage.setItem("check-happens-theme", JSON.stringify(t)),
      theme.id,
    );
    await page.reload();
    await contrast(page, ".home-menu strong,.home-menu small,.menu-tagline");
    await page.getByRole("button", { name: "Play", exact: true }).click();
    await contrast(
      page,
      ".time-options strong,.time-options small,.bot-options strong,.bot-options small,.train-play",
    );
    await page.goto("/?play=local");
    await contrast(
      page,
      ".clock,.turn-banner strong,.turn-banner span,.move-summary h2,.move-summary p",
    );
    await expect(page.locator(".square").first()).toHaveCSS(
      "border-radius",
      "0px",
    );
  }
});
test("motion preference control has a full touch target", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  const toggle = page.locator('.preferences-card input[type="checkbox"]');
  const box = await toggle.boundingBox();
  expect(box!.width).toBeGreaterThanOrEqual(44);
  expect(box!.height).toBeGreaterThanOrEqual(44);
  await toggle.check();
  await expect(toggle).toBeChecked();
});
