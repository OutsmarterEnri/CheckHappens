import { expect, type Page } from "@playwright/test";
export async function openLab(page: Page) {
  await page.getByRole("button", { name: "Game options", exact: true }).click();
  await page.getByRole("button", { name: "Lab & replay", exact: true }).click();
}
export async function scenario(page: Page, name: string, start = true) {
  await openLab(page);
  await page.getByRole("button", { name, exact: true }).click();
  if (start)
    await page
      .getByRole("button", { name: "Start match →", exact: true })
      .click();
}
export async function deck(page: Page, text: string) {
  await openLab(page);
  await page
    .getByRole("textbox", { name: "Ordered deck", exact: true })
    .fill(text);
  await page.getByRole("button", { name: "Load deck", exact: true }).click();
  await page
    .getByRole("button", { name: "Start match →", exact: true })
    .click();
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
