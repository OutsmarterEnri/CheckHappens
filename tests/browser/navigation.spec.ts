import { test, expect } from "./fixtures";
import { themes } from "../../src/ui/themes";
import { deck } from "./helpers";
import type { Page } from "@playwright/test";
async function swipe(
  page: Page,
  {
    x = 4,
    y = 180,
    dx = 150,
    dy = 2,
    target = "body",
    cancel = false,
    multi = false,
  } = {},
) {
  await page
    .locator(target)
    .first()
    .evaluate(
      (element, args) => {
        const touch = (x: number, y: number, id = 1) =>
          new Touch({
            identifier: id,
            target: element,
            clientX: x,
            clientY: y,
          });
        const dispatch = (type: string, touches: Touch[], changed: Touch[]) =>
          element.dispatchEvent(
            new TouchEvent(type, {
              bubbles: true,
              cancelable: true,
              touches,
              targetTouches: touches,
              changedTouches: changed,
            }),
          );
        const start = touch(args.x, args.y),
          end = touch(args.x + args.dx, args.y + args.dy);
        const initial = args.multi
          ? [start, touch(args.x + 10, args.y, 2)]
          : [start];
        dispatch("touchstart", initial, initial);
        dispatch("touchmove", [end], [end]);
        dispatch(args.cancel ? "touchcancel" : "touchend", [], [end]);
      },
      { x, y, dx, dy, cancel, multi },
    );
}
async function contained(page: Page, top: number, bottom: number) {
  const result = await page.locator("main").evaluate(
    (main, { top, bottom }) => {
      const bad = [
        ...main.querySelectorAll<HTMLElement>(
          "button,input,select,header,.settings-panel,.mode-menu",
        ),
      ]
        .filter((e) => e.getClientRects().length)
        .filter((e) => {
          const r = e.getBoundingClientRect();
          return (
            r.top < top - 1 ||
            r.bottom > innerHeight - bottom + 1 ||
            r.left < -1 ||
            r.right > innerWidth + 1
          );
        })
        .map((e) => e.textContent?.slice(0, 60) || e.tagName);
      return {
        fits:
          main.scrollHeight <= main.clientHeight + 1 &&
          main.scrollWidth <= main.clientWidth + 1,
        bad,
      };
    },
    { top, bottom },
  );
  expect(result).toEqual({ fits: true, bad: [] });
}
for (const [width, height, lang, top, bottom] of [
  [320, 568, "en", 0, 0],
  [320, 568, "it", 0, 0],
  [393, 852, "it", 59, 34],
  [428, 926, "en", 59, 34],
] as const)
  test(`all six worlds keep every menu and learning template contained at ${width} ${lang}`, async ({
    page,
  }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width, height });
    await page.addInitScript(
      (lang) =>
        localStorage.setItem("check-happens-language", JSON.stringify(lang)),
      lang,
    );
    for (const theme of themes) {
      await page.goto("/");
      await page.evaluate(
        (id) => localStorage.setItem("check-happens-theme", JSON.stringify(id)),
        theme.id,
      );
      await page.reload();
      await page.addStyleTag({
        content: `.menu-secondary,.private-menu,.learn-page{padding-top:${Math.max(6, top)}px;padding-bottom:${Math.max(8, bottom)}px}`,
      });
      await page.locator(".home-menu > button").nth(0).click();
      const header = await page.locator(".back-menu").boundingBox();
      expect(header!.y, theme.id).toBeLessThan(top + 16);
      await contained(page, top, bottom);
      await page.locator(".private-play").click();
      await contained(page, top, bottom);
      await page.locator(".private-tabs button").nth(1).click();
      await contained(page, top, bottom);
      await page.locator(".back-menu").click();
      await page.locator(".home-menu > button").nth(2).click();
      await contained(page, top, bottom);
      await page.locator(".back-menu").click();
      await page.locator(".home-menu > button").nth(1).click();
      await contained(page, top, bottom);
      for (const index of [1, 2, 0]) {
        await page.locator(".learn-hub-options button").nth(index).click();
        await contained(page, top, bottom);
        await page.locator(".learn-page > header button").first().click();
      }
      await page.locator(".learn-page > header button").first().click();
    }
  });
test("edge swipe follows menu, invitation and tutorial hierarchy and closes game drawers", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await swipe(page);
  await expect(page.locator(".menu-home")).toBeVisible();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page.locator(".private-play").click();
  await page.locator(".private-tabs button").nth(1).click();
  await swipe(page);
  await expect(page.locator(".private-join")).toHaveCount(0);
  await swipe(page);
  await expect(page.locator(".menu-choose")).toBeVisible();
  await swipe(page);
  await expect(page.locator(".menu-home")).toBeVisible();
  await page.getByRole("button", { name: "Tutorial", exact: true }).click();
  for (const index of [0, 1, 2]) {
    await page.locator(".learn-hub-options button").nth(index).click();
    await swipe(page);
    await expect(page.locator(".learn-hub")).toBeVisible();
  }
  await swipe(page);
  await expect(page.locator(".menu-home")).toBeVisible();
  await page.goto("/?play=local");
  await deck(page, "R2 V2");
  await page.getByRole("button", { name: "Game options", exact: true }).click();
  await page.getByRole("button", { name: "Lab & replay", exact: true }).click();
  await swipe(page);
  await expect(
    page.getByRole("button", { name: "Lab & replay", exact: true }),
  ).toBeVisible();
  await swipe(page);
  await expect(
    page.getByRole("dialog", { name: "Game options", exact: true }),
  ).toHaveCount(0);
  await swipe(page, { target: ".square", x: 20 });
  await expect(page.locator(".game-screen")).toBeVisible();
  await swipe(page);
  await expect(page.locator(".menu-home")).toBeVisible();
});
test("short, vertical, reversed, cancelled, multitouch and non-edge drags never navigate", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  for (const args of [
    { dx: 30 },
    { dy: 90 },
    { dx: -3 },
    { x: 90 },
    { cancel: true },
    { multi: true },
  ]) {
    await swipe(page, args);
    await expect(page.locator(".menu-settings")).toBeVisible();
  }
  await swipe(page);
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page.locator(".private-play").click();
  await swipe(page, { target: "input", x: 18 });
  await expect(page.locator(".private-menu")).toBeVisible();
});
test("saved-match chooser and invitation states fit on the smallest phone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/?play=local");
  await deck(page, "R2 V2");
  await page.getByRole("button", { name: "Home", exact: true }).click();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /Resume match/ }),
  ).toBeVisible();
  await contained(page, 0, 0);
  await page.locator(".private-play").click();
  await page
    .getByRole("textbox", { name: "Room server", exact: true })
    .fill(process.env.PW_ROOM_SERVER_URL ?? "http://127.0.0.1:8787");
  await page
    .getByRole("button", { name: "Create private room", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Invite link", exact: true }),
  ).toBeVisible();
  await contained(page, 0, 0);
  await page.locator(".back-menu").click();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page.locator(".private-play").click();
  await expect(
    page.getByRole("button", {
      name: "Reconnect to previous room",
      exact: true,
    }),
  ).toBeVisible();
  await contained(page, 0, 0);
});
