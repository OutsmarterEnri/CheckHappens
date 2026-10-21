export const themes = [
  {
    id: "candy",
    name: "Candy Chaos",
    colors: ["#fff8ed", "#c4aedf", "#ffe176"],
  },
  {
    id: "mint",
    name: "Minty Mayhem",
    colors: ["#eef9f3", "#9bcdbb", "#f5d96a"],
  },
  {
    id: "bubblegum",
    name: "Bubblegum Bandit",
    colors: ["#fff1f6", "#e7acd0", "#ffd68e"],
  },
  {
    id: "peach",
    name: "Peach Please",
    colors: ["#fff3e8", "#e8b391", "#f3cc79"],
  },
  {
    id: "cloud",
    name: "Cloudy with a Chance of Check",
    colors: ["#eff6ff", "#adc5eb", "#ffe08a"],
  },
] as const;
export type Theme = (typeof themes)[number]["id"];
export const THEME_KEY = "check-happens-theme";
export function validTheme(value: unknown): Theme {
  return themes.some((t) => t.id === value) ? (value as Theme) : "candy";
}
