import { test, expect } from "./fixtures";
import { deck, move, scenario, verify } from "./helpers";
test("+2 ghosts toggle and commit immediately on the final required tap", async ({
  page,
}) => {
  await page.goto("/?play=local");
  await scenario(page, "Resurrection +2");
  const rook = page.getByRole("button", {
    name: "a1, ghost Rook",
    exact: true,
  });
  await rook.click();
  await expect(rook).toHaveAttribute("aria-pressed", "true");
  await rook.click();
  await expect(rook).toHaveAttribute("aria-pressed", "false");
  await rook.click();
  await page
    .getByRole("button", { name: "b1, ghost Knight", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "a1, Rook white", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "b1, Knight white", exact: true }),
  ).toBeVisible();
  await verify(page);
});
test("+4 color popup and holograms, Wild evolution quick popup", async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/?play=local");
  await scenario(page, "Resurrection & Wild");
  await expect(
    page.getByRole("dialog", { name: "Choose color" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Blue", exact: true }).click();
  for (const sq of ["a1", "b1", "c1", "a2"])
    await page
      .getByRole("button", { name: new RegExp(`^${sq}, ghost`) })
      .click();
  await expect(page.locator(".board-frame")).toHaveClass(/color-blue/);
  await page.getByRole("button", { name: "Pass →", exact: true }).click();
  await page.getByRole("button", { name: "Green", exact: true }).click();
  await page
    .getByRole("button", { name: "a7, Pawn black", exact: true })
    .click();
  await expect(page.getByRole("dialog", { name: "Evolve pawn" })).toBeVisible();
  await page.getByRole("button", { name: "Rook", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "a7, Rook black", exact: true }),
  ).toBeVisible();
  await verify(page);
});
test("Skip target is directly clickable", async ({ page }) => {
  await page.goto("/?play=local");
  await deck(page, "RSkip V2");
  await page
    .getByRole("button", { name: "a7, Pawn black", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "a7, Pawn black, blocked", exact: true }),
  ).toBeVisible();
  await verify(page);
});
test("risk cracks precede a move; breaking displays a puff and removes the piece", async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/?play=local");
  await scenario(page, "Break-risk demo", false);
  const rook = page.getByRole("button", {
    name: "b1, Rook white, 20% break risk",
    exact: true,
  });
  await expect(rook.locator(".crack")).toBeVisible();
  await expect(page.getByText("20% BREAK RISK", { exact: true })).toBeVisible();
  await page.screenshot({ path: "docs/v2-risk.png" });
  await move(page, "b1", "b3");
  await expect(
    page.getByRole("img", { name: "Rook broke", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "b3", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: "docs/v2-puff.png" });
  await verify(page);
});
for (const [name, title] of [
  ["Win finale", "YOU WIN!"],
  ["Lose finale", "YOU LOSE!"],
  ["Draw finale", "PLOT TWIST!"],
]) {
  test(`theatrical ${title} is accessible and allows a rematch`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto("/?play=computer");
    await scenario(page, name, false);
    const dialog = page.getByRole("dialog", { name: title });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: /One more round/ }),
    ).toBeFocused();
    await dialog
      .getByRole("button", { name: "Review table", exact: true })
      .click();
    await expect(dialog).toHaveCount(0);
    await page
      .getByRole("button", { name: "Play again →", exact: true })
      .click();
    await expect(
      page.getByRole("dialog", { name: "Starting match", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Start match →", exact: true }),
    ).toHaveCount(0);
  });
}
test("actual timeout opens finale and its JSON verifies", async ({ page }) => {
  await page.clock.install();
  await page.goto("/?play=local");
  await deck(page, "R4 V2");
  // Simulate elapsed time without rendering all 2,800 polling intervals.
  // This also exercises catching up after a suspended/backgrounded tab.
  await page.clock.fastForward(419000);
  await expect(
    page.getByRole("dialog", { name: "PLAYER 2 WINS!" }),
  ).toHaveCount(0);
  await page.clock.fastForward(2000);
  await expect(
    page.getByRole("dialog", { name: "PLAYER 2 WINS!" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Review table", exact: true }).click();
  await verify(page);
});
