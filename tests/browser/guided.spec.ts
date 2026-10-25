import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";
const moves: Record<string, [string, string][]> = {
  board: [["a2", "a3"]],
  pawn: [["d2", "e3"]],
  rook: [["d4", "d6"]],
  bishop: [["c1", "f4"]],
  knight: [["e4", "g5"]],
  queen: [["d1", "g4"]],
  king: [["e1", "d1"]],
  "chess-check": [["e1", "d1"]],
  "chess-mate": [["g6", "g7"]],
  castle: [["e1", "g1"]],
  "en-passant": [["e5", "d6"]],
  promotion: [["a7", "a8"]],
  stalemate: [["g5", "g6"]],
  number: [
    ["a2", "a3"],
    ["b2", "b3"],
  ],
  clocks: [["a2", "a3"]],
  blue: [["a2", "a3"]],
  yellow: [
    ["b1", "b3"],
    ["e3", "f5"],
  ],
  defense: [["e1", "d1"]],
  last: [
    ["a2", "a3"],
    ["b2", "b3"],
  ],
};
const square = (page: Page, name: string) =>
  page
    .locator(".practice-board")
    .getByRole("button", { name: new RegExp("^" + name + "(?:,|$)") });
async function fit(page: Page) {
  for (const s of [".learn-page", ".academy-copy"])
    expect(
      await page
        .locator(s)
        .evaluate(
          (e) =>
            e.scrollHeight <= e.clientHeight + 1 &&
            e.scrollWidth <= e.clientWidth + 1,
        ),
      s,
    ).toBe(true);
  const board = await page.locator(".practice-board").boundingBox();
  expect(board!.width).toBeGreaterThan(155);
  const footer = await page.locator("main>footer").boundingBox();
  expect(footer!.y + footer!.height).toBeLessThanOrEqual(
    page.viewportSize()!.height + 1,
  );
}
for (const [lang, width, height] of [
  ["en", 375, 667],
  ["it", 375, 667],
  ["en", 320, 568],
  ["it", 320, 568],
] as const)
  for (const course of ["chess", "variant"] as const)
    test(`${course} course is playable in ${lang} at ${width}`, async ({
      page,
    }) => {
      test.setTimeout(120000);
      await page.setViewportSize({ width, height });
      await page.addInitScript(
        (l) =>
          localStorage.setItem("check-happens-language", JSON.stringify(l)),
        lang,
      );
      await page.goto("/");
      await page.getByRole("button", { name: "Tutorial", exact: true }).click();
      await page.locator(`[data-course-link="${course}"]`).click();
      const total = course === "chess" ? 13 : 14;
      for (let i = 0; i < total; i++) {
        const id = await page.locator("main").getAttribute("data-mission");
        const next = page.getByRole("button", {
          name:
            i === total - 1
              ? lang === "en"
                ? "Finish"
                : "Fine"
              : lang === "en"
                ? "Next →"
                : "Avanti →",
          exact: true,
        });
        await expect(next).toBeDisabled();
        await fit(page);
        await page
          .getByRole("button", {
            name: lang === "en" ? "Hint" : "Aiuto",
            exact: true,
          })
          .click();
        await fit(page);
        await page
          .getByRole("button", {
            name: lang === "en" ? "Show lesson" : "Mostra lezione",
            exact: true,
          })
          .click();
        await page
          .getByRole("button", {
            name:
              course === "chess"
                ? lang === "en"
                  ? "Try move"
                  : "Prova la mossa"
                : ["defense", "emergency"].includes(id!)
                  ? lang === "en"
                    ? "Begin turn"
                    : "Inizia turno"
                  : lang === "en"
                    ? "Draw card"
                    : "Pesca carta",
            exact: true,
          })
          .click();
        if (id === "risk")
          await page
            .getByRole("button", {
              name: lang === "en" ? "Pass →" : "Passa →",
              exact: true,
            })
            .click();
        if (id === "skip") await square(page, "a7").click();
        if (id === "revive4" || id === "wild")
          await page
            .getByRole("button", {
              name:
                lang === "en"
                  ? id === "wild"
                    ? "Green"
                    : "Blue"
                  : id === "wild"
                    ? "Verde"
                    : "Blu",
              exact: true,
            })
            .click();
        if (id === "revive2" || id === "revive4")
          for (const sq of id === "revive2"
            ? ["a1", "b1"]
            : ["a1", "b1", "c1", "a2"])
            await square(page, sq).click();
        if (id === "wild") {
          await square(page, "a2").click();
          await page
            .getByRole("button", {
              name: lang === "en" ? "Rook" : "Torre",
              exact: true,
            })
            .click();
        }
        for (const [from, to] of moves[id!] ?? []) {
          await square(page, from).click();
          await square(page, to).click();
        }
        await expect(next).toBeEnabled();
        await fit(page);
        await next.click();
      }
      await expect(page.locator(".academy-finish")).toBeVisible();
      expect(
        await page.evaluate(() =>
          localStorage.getItem("scacchi-uno-pocket-v1"),
        ),
      ).toBeNull();
      const progress = await page.evaluate(() =>
        JSON.parse(localStorage.getItem("check-happens-academy-v1")!),
      );
      expect(progress).toHaveLength(total);
    });
test("a different legal move needs a retry; goals persist without touching a saved match", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() =>
    localStorage.setItem("scacchi-uno-pocket-v1", "owner-save-marker"),
  );
  await page.getByRole("button", { name: "Tutorial", exact: true }).click();
  await page.locator('[data-course-link="chess"]').click();
  await page.getByRole("button", { name: "Try move", exact: true }).click();
  await square(page, "a2").click();
  await square(page, "a3").click();
  await page.getByRole("button", { name: "Next →", exact: true }).click();
  await page.getByRole("button", { name: "Try move", exact: true }).click();
  await square(page, "d2").click();
  await square(page, "d3").click();
  await expect(
    page.getByRole("button", { name: "Next →", exact: true }),
  ).toBeDisabled();
  await expect(page.locator(".academy-copy p")).toContainText(
    "missed the goal",
  );
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await page.getByRole("button", { name: "Try move", exact: true }).click();
  await square(page, "d2").click();
  await square(page, "e3").click();
  await expect(
    page.getByRole("button", { name: "Next →", exact: true }),
  ).toBeEnabled();
  await page.reload();
  await page.getByRole("button", { name: "Tutorial", exact: true }).click();
  await page.locator('[data-course-link="chess"]').click();
  await expect(page.locator("main")).toHaveAttribute("data-mission", "rook");
  expect(
    await page.evaluate(() => localStorage.getItem("scacchi-uno-pocket-v1")),
  ).toBe("owner-save-marker");
});

test("jumping to the last lesson does not complete the skipped course", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Tutorial", exact: true }).click();
  await page.locator('[data-course-link="chess"]').click();
  await page
    .getByRole("combobox", { name: "Choose a lesson" })
    .selectOption("12");
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "0",
  );
  await page.getByRole("button", { name: "Try move", exact: true }).click();
  await square(page, "g5").click();
  await square(page, "g6").click();
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "1",
  );
  await page.getByRole("button", { name: "Next →", exact: true }).click();
  await expect(page.locator("main")).toHaveAttribute("data-mission", "board");
  await expect(page.locator(".academy-finish")).toHaveCount(0);
});
