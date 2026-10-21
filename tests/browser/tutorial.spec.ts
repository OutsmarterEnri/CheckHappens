import { test, expect } from "./fixtures";
import { translate } from "../../src/ui/locale";
for (const language of ["en", "it"] as const) {
  test(`card tutorial teaches safe moves, risk and every action in ${language}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.addInitScript(
      (lang) => localStorage.setItem("check-happens-language", JSON.stringify(lang)),
      language,
    );
    await page.goto("/");
    const saved = await page.evaluate(() =>
      localStorage.getItem("scacchi-uno-pocket-v1"),
    );
    await page.getByRole("button", { name: "Tutorial", exact: true }).click();
    const lab = page.getByRole("region", {
      name: language === "en" ? "Explore the cards" : "Esplora le carte",
    });
    await expect(lab.locator(".tutorial-big-card")).toContainText("2");
    await lab
      .getByRole("button", {
        name: language === "en" ? "Risky 7" : "7 rischioso",
        exact: true,
      })
      .click();
    await expect(lab.locator(".tutorial-king-rule")).toContainText(
      language === "en" ? "king cannot move" : "re non può muoversi",
    );
    const moves = lab.getByRole("group", {
      name:
        language === "en"
          ? "Move risk examples"
          : "Esempi di rischio per mossa",
    });
    for (const [n, percent] of [
      [4, 0],
      [5, 20],
      [6, 40],
      [9, 99],
    ]) {
      await moves.getByRole("button", { name: String(n), exact: true }).click();
      await expect(lab.getByRole("status")).toContainText(`${percent}%`);
      await expect(lab.locator(".crack")).toHaveCount(percent === 0 ? 0 : 1);
    }
    for (const name of ["+2", "+4", "Wild", "Skip", "Reverse", "Reset 0"]) {
      // Translation also applies to button accessible names.
      const index =
        ["+2", "+4", "Wild", "Skip", "Reverse", "Reset 0"].indexOf(name) + 2;
      await lab.locator(".tutorial-card-picker button").nth(index).click();
      await expect(lab.locator(".tutorial-big-card")).toContainText(
        translate(name === "Reset 0" ? "0" : name, language),
      );
      await expect(lab.locator("h3")).not.toBeEmpty();
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      await page.evaluate(() => localStorage.getItem("scacchi-uno-pocket-v1")),
    ).toBe(saved);
  });
}
