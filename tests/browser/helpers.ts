import { expect, type Page } from "@playwright/test";
export async function openLab(page: Page) {
  await expect(page.locator(".countdown-stage")).toHaveCount(0);
  // Menu-launched games now draw automatically; a random Wild may need a color.
  if (
    await page
      .getByRole("dialog", { name: "Choose color", exact: true })
      .count()
  )
    await page.getByRole("button", { name: "Blue", exact: true }).click();
  await page.getByRole("button", { name: "Game options", exact: true }).click();
  await page.getByRole("button", { name: "Lab & replay", exact: true }).click();
}
export async function scenario(page: Page, name: string, start = true) {
  await openLab(page);
  await page.getByRole("button", { name, exact: true }).click();
  if (start) {
    const button = page.getByRole("button", {
      name: "Start match →",
      exact: true,
    });
    if (await button.count()) await button.click();
    else
      await expect(page.locator(".game-screen")).not.toHaveAttribute(
        "data-phase",
        "READY",
      );
  }
}
export async function deck(page: Page, text: string) {
  await openLab(page);
  await page
    .getByRole("textbox", { name: "Ordered deck", exact: true })
    .fill(text);
  await page.getByRole("button", { name: "Load deck", exact: true }).click();
  const start = page.getByRole("button", {
    name: "Start match →",
    exact: true,
  });
  if (await start.count()) await start.click();
  else
    await expect(page.locator(".game-screen")).not.toHaveAttribute(
      "data-phase",
      "READY",
    );
}
export async function move(page: Page, from: string, to: string) {
  await page.getByRole("button", { name: new RegExp(`^${from},`) }).click();
  await page
    .getByRole("button", { name: new RegExp(`^${to}.*legal destination`) })
    .click();
}
export async function verify(page: Page) {
  await page.getByRole("button", { name: "Game options", exact: true }).click();
  await page
    .getByRole("button", { name: "Verify this match", exact: true })
    .click();
  await expect(page.getByText("VERIFIED", { exact: true })).toBeVisible();
}
