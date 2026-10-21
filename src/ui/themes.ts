export const themes = [
  {
    id: "candy",
    name: "Candy Chaos",
    colors: ["#fff3d9", "#b49be0", "#ffce52"],
  },
  {
    id: "mint",
    name: "Minty Mayhem",
    colors: ["#102f2c", "#98ca92", "#cbea77"],
  },
  {
    id: "bubblegum",
    name: "Bubblegum Bandit",
    colors: ["#ffe5ef", "#ed90bd", "#ffb858"],
  },
  {
    id: "peach",
    name: "Peach Please",
    colors: ["#ffdbb3", "#db945e", "#ffd379"],
  },
  {
    id: "cloud",
    name: "Cloudy with a Chance of Check",
    colors: ["#e8f3ff", "#83a8da", "#fbdc83"],
  },
] as const;
export type Theme = (typeof themes)[number]["id"];
export const THEME_KEY = "check-happens-theme";
export function validTheme(value: unknown): Theme {
  return themes.some((t) => t.id === value) ? (value as Theme) : "candy";
}
