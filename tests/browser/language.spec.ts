import { test, expect } from "./fixtures";
test("language preference translates menus, tutorial and game and survives reload", async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/");
  await page.getByRole("button", { name: "Settings" }).click();
  await page
    .getByRole("combobox", { name: "Language", exact: true })
    .selectOption("it");
  await expect(page.locator("html")).toHaveAttribute("lang", "it");
  await page.reload();
  await page.getByRole("button", { name: "Tutorial" }).click();
  await expect(
    page.getByRole("heading", { name: "Proviamoci insieme." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "a2, Pedone", exact: true }).click();
  await page.getByRole("button", { name: "a3", exact: true }).click();
  await page
    .getByRole("button", { name: "a1, Torre fantasma", exact: true })
    .click();
  await page.getByRole("button", { name: "Blu", exact: true }).click();
  await page.getByRole("button", { name: "Inverti ↻", exact: true }).click();
  await expect(page.getByText("TOCCA A TE!", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Capito. Giochiamo! →" }).click();
  await page.getByRole("button", { name: "Gioca", exact: false }).click();
  await page.getByRole("button", { name: /Partita locale/ }).click();
  const card = await page
    .getByRole("region", { name: "Carta e mosse" })
    .boundingBox();
  const board = await page.locator(".board-frame").boundingBox();
  expect(card!.y + card!.height).toBeLessThan(board!.y);
  await page
    .getByRole("button", { name: "Inizia partita →", exact: true })
    .click();
  await page.getByRole("button", { name: "Home", exact: true }).click();
  await page.getByRole("button", { name: "Impostazioni" }).click();
  await page
    .getByRole("combobox", { name: "Lingua", exact: true })
    .selectOption("en");
  await expect(
    page.getByRole("heading", { name: "Just the essentials." }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});
test("Italian card choices, prominent pass and finale stay playable", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("check-happens-language", JSON.stringify("it")),
  );
  await page.goto("/?play=local");
  await page
    .getByRole("button", { name: "Opzioni di gioco", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Laboratorio e replay", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Resurrezione e Jolly", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Inizia partita →", exact: true })
    .click();
  await page.getByRole("button", { name: "Blu", exact: true }).click();
  for (const sq of ["a1", "b1", "c1", "a2"])
    await page
      .getByRole("button", { name: new RegExp(`^${sq}, .*fantasma`) })
      .click();
  const pass = page.getByRole("button", { name: "Passa →", exact: true });
  await expect(pass).toHaveClass(/available-action/);
  expect((await pass.boundingBox())!.height).toBeGreaterThanOrEqual(52);
  await pass.click();
  await page.getByRole("button", { name: "Verde", exact: true }).click();
  await page
    .getByRole("button", { name: "a7, Pedone nero", exact: true })
    .click();
  await page.getByRole("button", { name: "Torre", exact: true }).click();
  await page
    .getByRole("button", { name: "Opzioni di gioco", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Verifica questa partita", exact: true })
    .click();
  await expect(page.getByText("VERIFICATA", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Chiudi opzioni", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Opzioni di gioco", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Laboratorio e replay", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Finale vittoria", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "VINCE GIOCATORE 1!" }),
  ).toBeVisible();
});
