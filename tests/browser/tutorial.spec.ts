import { test, expect } from "./fixtures";
async function fits(page: import("@playwright/test").Page) {
  expect(
    await page.evaluate(() => {
      const main = document.querySelector(".learn-page")!;
      return (
        main.scrollHeight <= main.clientHeight + 1 &&
        main.scrollWidth <= main.clientWidth + 1 &&
        document.documentElement.scrollHeight <= innerHeight + 1 &&
        document.documentElement.scrollWidth <= innerWidth + 1
      );
    }),
  ).toBe(true);
  const board = (await page.locator(".practice-board").count())
    ? await page.locator(".practice-board").boundingBox()
    : null;
  if (board) expect(board.width).toBeGreaterThan(170);
}
for (const language of ["en", "it"] as const)
  test(`separate card lab, guided lessons and sandbox fit without scrolling in ${language}`, async ({
    page,
  }) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.addInitScript(
      (lang) =>
        localStorage.setItem("check-happens-language", JSON.stringify(lang)),
      language,
    );
    await page.goto("/");
    await page.getByRole("button", { name: "Tutorial", exact: true }).click();
    await fits(page);
    await page
      .getByRole("button", {
        name: language === "en" ? /Card lab/ : /Laboratorio carte/,
      })
      .click();
    for (let card = 0; card < 8; card++) {
      await page
        .locator(".learn-selectors select")
        .first()
        .selectOption(String(card));
      await fits(page);
      await page
        .getByRole("button", {
          name: language === "en" ? "Try card" : "Prova carta",
          exact: true,
        })
        .click();
      await expect(page.locator(".practice-table")).not.toHaveAttribute(
        "data-phase",
        "READY",
      );
      await fits(page);
    }
    await page.getByRole("button", { name: "← Tutorial", exact: true }).click();
    await page
      .getByRole("button", {
        name: language === "en" ? /Chess basics/ : /Scacchi di base/,
      })
      .click();
    await fits(page);
    await page
      .getByRole("button", {
        name: language === "en" ? "Try move" : "Prova la mossa",
        exact: true,
      })
      .click();
    await fits(page);
    await page.getByRole("button", { name: "← Tutorial", exact: true }).click();
    await page.getByRole("button", { name: /^Sandbox/ }).click();
    await fits(page);
    await page
      .getByRole("button", {
        name: language === "en" ? "Erase" : "Rimuovi",
        exact: true,
      })
      .click();
    await page
      .getByRole("button", {
        name: language === "en" ? "a1, Rook" : "a1, Torre",
        exact: true,
      })
      .click();
    await page.locator(".learn-selectors select").first().selectOption("2");
    await page
      .getByRole("button", {
        name: language === "en" ? "Test position" : "Prova posizione",
        exact: true,
      })
      .click();
    await page
      .getByRole("button", {
        name: language === "en" ? "Try card" : "Prova carta",
        exact: true,
      })
      .click();
    await page.locator(".square.hologram").click();
    await expect(
      page.getByRole("button", {
        name: language === "en" ? "a1, Rook" : "a1, Torre",
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByRole("button", {
        name: language === "en" ? "Edit position" : "Modifica posizione",
        exact: true,
      })
      .click();

    await page
      .getByRole("button", {
        name: language === "en" ? "Clear pieces" : "Svuota",
        exact: true,
      })
      .click();
    await page
      .getByRole("button", {
        name: language === "en" ? "Knight" : "Cavallo",
        exact: true,
      })
      .click();
    await page.getByRole("button", { name: "c3", exact: true }).click();
    await expect(
      page.getByRole("button", {
        name: language === "en" ? "c3, Knight" : "c3, Cavallo",
        exact: true,
      }),
    ).toBeVisible();
    await page.locator(".learn-selectors select").first().selectOption("6");
    await expect(
      page.getByRole("button", {
        name: language === "en" ? "c3, Knight" : "c3, Cavallo",
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByRole("button", {
        name: language === "en" ? "Test position" : "Prova posizione",
        exact: true,
      })
      .click();
    await page
      .getByRole("button", {
        name: language === "en" ? "Try card" : "Prova carta",
        exact: true,
      })
      .click();
    await expect(page.locator(".practice-board")).toHaveClass(
      /practice-flipped/,
    );
    await fits(page);
    expect(
      await page.evaluate(() => localStorage.getItem("scacchi-uno-pocket-v1")),
    ).toBeNull();
  });
for (const [width, height] of [
  [393, 852],
  [430, 932],
  [320, 568],
])
  test(`practice fits ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    for (const menu of ["Settings", "Play"]) {
      await page.getByRole("button", { name: menu, exact: true }).click();
      expect(
        await page
          .locator("main")
          .evaluate(
            (e) =>
              e.scrollHeight <= e.clientHeight + 1 &&
              e.scrollWidth <= e.clientWidth + 1,
          ),
      ).toBe(true);
      await page.getByRole("button", { name: "← Home", exact: true }).click();
    }
    await page.getByRole("button", { name: "Play", exact: true }).click();
    await page.getByRole("button", { name: /Private match/ }).click();
    for (let i = 0; i < 2; i++) {
      expect(
        await page
          .locator("main")
          .evaluate((e) => e.scrollHeight <= e.clientHeight + 1),
      ).toBe(true);
      if (i === 0)
        await page
          .getByRole("button", { name: "Join an invitation", exact: true })
          .click();
    }
    await page.getByRole("button", { name: "← Home", exact: true }).click();
    await page.getByRole("button", { name: "Tutorial", exact: true }).click();
    await page.getByRole("button", { name: /Sandbox/ }).click();
    await fits(page);
  });
for (const [width, height, top, bottom] of [
  [320, 568, 0, 0],
  [393, 852, 59, 34],
  [428, 926, 59, 34],
])
  test(`settings and learning share the table margins at ${width} with safe areas`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await page.addStyleTag({
      content: `.menu-settings,.learn-page{padding-top:${Math.max(6, top)}px;padding-bottom:${Math.max(8, bottom)}px}`,
    });
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    const header = await page.locator(".back-menu").boundingBox();
    const panel = await page.locator(".settings-panel").boundingBox();
    expect(header!.y).toBeGreaterThanOrEqual(top);
    expect(header!.y).toBeLessThan(top + 16);
    expect(panel!.y).toBeLessThan(top + 62);
    expect(panel!.x).toBe(12);
    expect(panel!.width).toBe(width - 24);
    expect(panel!.y + panel!.height).toBeLessThanOrEqual(height - bottom);
    expect(
      await page
        .locator("main")
        .evaluate((e) => e.scrollHeight <= e.clientHeight + 1),
    ).toBe(true);
    await page.getByRole("button", { name: "← Home", exact: true }).click();
    await page.getByRole("button", { name: "Tutorial", exact: true }).click();
    await page.getByRole("button", { name: /Card lab/ }).click();
    await expect(page.locator(".practice-board .frame-color-label")).toHaveText(
      "Green",
    );
    await fits(page);
    await page.getByRole("button", { name: "Try card", exact: true }).click();
    await fits(page);
  });
