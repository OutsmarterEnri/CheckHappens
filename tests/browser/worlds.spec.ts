import { test, expect } from "./fixtures";
import { themes } from "../../src/ui/themes";
import { deck, move } from "./helpers";
for (const theme of themes)
  test(`world ${theme.id} transforms the app while all drawn card colors stay fixed`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.addInitScript(
      (id) => localStorage.setItem("check-happens-theme", JSON.stringify(id)),
      theme.id,
    );
    await page.goto("/");
    await expect(page.locator(".rooki-art")).toHaveAttribute(
      "data-look",
      theme.id,
    );
    expect(
      await page.locator(".rooki-art").evaluate(async (element) => {
        const source = getComputedStyle(element).backgroundImage.slice(5, -2);
        const image = new Image();
        image.src = source;
        await image.decode();
        return image.naturalWidth === 1536;
      }),
    ).toBe(true);
    expect(
      await page
        .locator("main")
        .evaluate((e) => e.scrollHeight <= e.clientHeight + 1),
    ).toBe(true);
    const home = await page.locator("main").evaluate((e) => ({
      pattern: getComputedStyle(e).backgroundImage,
      bg: getComputedStyle(e).backgroundColor,
    }));
    expect(home.pattern).not.toBe("none");
    await page.setViewportSize({ width: 320, height: 568 });
    await page.getByRole("button", { name: "Settings", exact: false }).click();
    const settingsBounds = await page.locator(".settings-panel").boundingBox();
    expect(settingsBounds!.y + settingsBounds!.height).toBeLessThanOrEqual(568);
    expect(
      await page
        .locator("main")
        .evaluate((e) => e.scrollHeight <= e.clientHeight + 1),
    ).toBe(true);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/?play=local");
    await deck(page, "R1 V1 B1 G1");
    const cardColors = [
      "rgb(241, 138, 133)",
      "rgb(168, 212, 164)",
      "rgb(147, 197, 237)",
      "rgb(255, 225, 118)",
    ];
    const frames = [
      "rgb(237, 103, 102)",
      "rgb(87, 185, 116)",
      "rgb(82, 158, 228)",
      "rgb(246, 202, 61)",
    ];
    for (let i = 0; i < 4; i++) {
      await expect(page.locator(".game-screen .mini-card")).toHaveCSS(
        "background-color",
        cardColors[i],
      );
      await expect(page.locator(".board-frame")).toHaveCSS(
        "background-color",
        frames[i],
      );
      if (i < 3)
        await move(
          page,
          ...([
            ["a2", "a3"],
            ["a7", "a6"],
            ["b2", "b3"],
          ][i] as [string, string]),
        );
    }
    expect(
      await page
        .locator(".game-screen")
        .evaluate((e) => e.scrollHeight <= e.clientHeight + 1),
    ).toBe(true);
    const piece = await page
      .locator(".piece-w")
      .first()
      .evaluate((e) => getComputedStyle(e).fill);
    expect(piece).not.toBe("");
  });
test("Rooki reacts without layout shift and respects reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");
  const mascot = page.getByRole("button", {
    name: "Say hello to Rooki",
    exact: true,
  });
  const box = await mascot.boundingBox();
  await mascot.click();
  await expect(page.locator(".rooki-speech")).toHaveText("Trust the cards.");
  await expect(page.locator(".rooki-art")).toHaveCSS("animation-name", "none");
  expect(await mascot.boundingBox()).toEqual(box);
  expect(
    await page
      .locator("main")
      .evaluate((e) => e.scrollHeight <= e.clientHeight + 1),
  ).toBe(true);
});
test("branded loading screen uses the saved world before React loads", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("check-happens-theme", JSON.stringify("mint")),
  );
  await page.route("**/assets/*.js", (route) => route.abort());
  await page.goto(process.env.PW_PRODUCTION_URL ?? "http://127.0.0.1:4173/");
  await expect(page.locator(".boot-splash")).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "mint");
  await expect(page.locator(".boot-splash")).toHaveCSS(
    "background-color",
    "rgb(16, 47, 44)",
  );
  expect(
    await page
      .locator(".boot-splash img")
      .evaluate((e) => (e as HTMLImageElement).naturalWidth > 0),
  ).toBe(true);
});
