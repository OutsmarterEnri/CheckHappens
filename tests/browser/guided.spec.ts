import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";
async function move(page: Page, from: string, to: string) {
  const board = page.locator(".practice-board");
  await board
    .getByRole("button", { name: new RegExp(`^${from}(?:,|$)`) })
    .click();
  await board
    .getByRole("button", { name: new RegExp(`^${to}(?:,|$)`) })
    .click();
}
async function fit(page: Page) {
  expect(
    await page
      .locator(".learn-page")
      .evaluate(
        (e) =>
          e.scrollHeight <= e.clientHeight + 1 &&
          e.scrollWidth <= e.clientWidth + 1,
      ),
  ).toBe(true);
  expect(
    await page
      .locator(".coach-brief")
      .evaluate((e) => e.scrollHeight <= e.clientHeight + 1),
  ).toBe(true);
  const footer = await page.locator(".coach-page>footer").boundingBox();
  expect(footer!.y + footer!.height).toBeLessThanOrEqual(
    (page.viewportSize()?.height ?? 0) + 1,
  );
}
for (const [lang, width, height] of [
  ["en", 375, 667],
  ["it", 375, 667],
  ["en", 320, 568],
] as const) {
  test(`action-based tutorial completes every real mission in ${lang} at ${width}`, async ({
    page,
  }) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width, height });
    await page.addInitScript(
      (language) =>
        localStorage.setItem(
          "check-happens-language",
          JSON.stringify(language),
        ),
      lang,
    );
    await page.goto("/");
    await page.getByRole("button", { name: "Tutorial", exact: true }).click();
    await page
      .getByRole("button", {
        name: lang === "en" ? /Guided tutorial/ : /Tutorial guidato/,
      })
      .click();
    for (let i = 0; i < 16; i++) {
      const next = page.getByRole("button", {
        name:
          i === 15
            ? lang === "en"
              ? "Finish"
              : "Fine"
            : lang === "en"
              ? "Next →"
              : "Avanti →",
        exact: true,
      });
      await expect(next).toBeDisabled();
      if (i === 5)
        await expect(
          page.locator(".coach-brief [data-card-value]"),
        ).toHaveAttribute("data-card-value", "1");
      if (i === 12)
        await expect(
          page.locator(".coach-brief [data-card-kind]"),
        ).toHaveAttribute("data-card-kind", "hidden");
      await fit(page);
      const hint = page.getByRole("button", {
        name: lang === "en" ? "Hint" : "Aiuto",
        exact: true,
      });
      await hint.click();
      await fit(page);
      await page
        .getByRole("button", {
          name: lang === "en" ? "Show task" : "Mostra obiettivo",
          exact: true,
        })
        .click();
      await page
        .getByRole("button", {
          name: [12, 13].includes(i)
            ? lang === "en"
              ? "Begin turn"
              : "Inizia turno"
            : lang === "en"
              ? "Draw card"
              : "Pesca carta",
          exact: true,
        })
        .click();
      if ([0, 1, 2, 4, 15].includes(i)) {
        await move(page, "a2", "a3");
        if (i === 0 || i === 15) await move(page, "b2", "b3");
      }
      if (i === 3) {
        // A wrong attempt must explain how to retry, never silently unlock Next.
        await move(page, "a2", "a3");
        const pass = page.getByRole("button", {
          name: lang === "en" ? "Pass →" : "Passa →",
          exact: true,
        });
        if (await pass.count()) await pass.click();
        await expect(next).toBeDisabled();
        await expect(page.locator(".coach-brief p")).toContainText(
          lang === "en" ? "fresh attempt" : "nuovo tentativo",
        );
        await page
          .getByRole("button", {
            name: lang === "en" ? "Retry" : "Riprova",
            exact: true,
          })
          .click();
        await page
          .getByRole("button", {
            name: lang === "en" ? "Draw card" : "Pesca carta",
            exact: true,
          })
          .click();
        await pass.click();
      }
      if (i === 5) {
        await move(page, "b1", "b3");
        await expect(
          page.getByRole("button", {
            name: lang === "en" ? "Pass →" : "Passa →",
            exact: true,
          }),
        ).toHaveCount(0);
        await move(page, "e3", "f5");
      }
      if (i === 6)
        await page
          .locator(".practice-board")
          .getByRole("button", { name: /^a7,/ })
          .click();
      if (i === 8 || i === 9)
        await page
          .getByRole("button", {
            name: lang === "en" ? "Blue" : "Blu",
            exact: true,
          })
          .click();
      if (i === 7 || i === 8) {
        for (const sq of i === 7 ? ["a1", "b1"] : ["a1", "b1", "c1", "a2"])
          await page
            .locator(".practice-board")
            .getByRole("button", { name: new RegExp(`^${sq},`) })
            .click();
      }
      if (i === 9) {
        await page
          .locator(".practice-board")
          .getByRole("button", { name: /^a2,/ })
          .click();
        await page
          .getByRole("button", {
            name: lang === "en" ? "Rook" : "Torre",
            exact: true,
          })
          .click();
      }
      if (i === 12) {
        await move(page, "e1", "d1");
        await expect(
          page.locator(".coach-brief [data-card-value]"),
        ).toHaveAttribute("data-card-value", "4");
      }
      if (i === 14) await move(page, "b1", "b8");
      await expect(next).toBeEnabled();
      await expect(page.locator(".coach-success")).toBeVisible();
      await fit(page);
      await next.click();
    }
    await expect(
      page.getByRole("heading", {
        name: lang === "en" ? "You know the chaos." : "Ora conosci il caos.",
      }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => localStorage.getItem("scacchi-uno-pocket-v1")),
    ).toBeNull();
    await page
      .getByRole("button", {
        name: lang === "en" ? "Ready to play →" : "Pronto a giocare →",
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("group", {
        name: lang === "en" ? "Time control" : "Tempo di gioco",
      }),
    ).toBeVisible();
  });
}
