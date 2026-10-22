import { test, expect } from "./fixtures";
import { themes } from "../../src/ui/themes";
for (const [width, height, language, top, bottom] of [
  [320, 568, "en", 0, 0],
  [320, 568, "it", 0, 0],
  [393, 852, "en", 59, 34],
  [393, 852, "it", 59, 34],
] as const)
  test(`clubhouse hierarchy and button text fit all worlds at ${width} ${language}`, async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width, height });
    await page.addInitScript(
      (lang) =>
        localStorage.setItem("check-happens-language", JSON.stringify(lang)),
      language,
    );
    for (const theme of themes) {
      await page.goto("/");
      await page.evaluate(
        (id) => localStorage.setItem("check-happens-theme", JSON.stringify(id)),
        theme.id,
      );
      await page.reload();
      await page.addStyleTag({
        content: `.menu-home.menu-v3{padding-top:${Math.max(top, 8)}px;padding-bottom:${Math.max(bottom, 8)}px}`,
      });
      const result = await page.locator("main").evaluate((main) => {
        const sections = [
          ".menu-masthead",
          ".home-showcase",
          ".home-menu",
          ".menu-caption",
        ].map((s) => main.querySelector(s)!.getBoundingClientRect());
        const bad = [
          ...main.querySelectorAll<HTMLElement>(
            "button,.home-shortcut strong,.home-shortcut small",
          ),
        ]
          .filter(
            (e) =>
              e.scrollWidth > e.clientWidth + 1 ||
              e.scrollHeight > e.clientHeight + 1,
          )
          .map((e) => e.textContent?.trim());
        const buttons = [...main.querySelectorAll("button")].map((e) =>
          e.getBoundingClientRect(),
        );
        return {
          sections: sections.map((r) => ({ top: r.top, bottom: r.bottom })),
          bad,
          touch: buttons.every((r) => r.width >= 44 && r.height >= 44),
          scrolls:
            main.scrollHeight > main.clientHeight + 1 ||
            main.scrollWidth > main.clientWidth + 1,
        };
      });
      expect(result.bad, theme.id).toEqual([]);
      expect(result.touch, theme.id).toBe(true);
      expect(result.scrolls, theme.id).toBe(false);
      for (let i = 1; i < result.sections.length; i++)
        expect(result.sections[i].top).toBeGreaterThanOrEqual(
          result.sections[i - 1].bottom - 1,
        );
      expect(result.sections[0].top).toBeGreaterThanOrEqual(top);
      expect(result.sections[3].bottom).toBeLessThanOrEqual(
        height - bottom + 1,
      );
    }
  });
