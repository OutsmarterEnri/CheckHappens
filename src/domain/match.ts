export const timeControls = [
  { minutes: 4, label: "Bullet" },
  { minutes: 7, label: "Blitz" },
  { minutes: 10, label: "Rapid" },
] as const;
export type Minutes = 4 | 7 | 10;
export type BotLevel = "easy" | "medium" | "hard";
export const botProfiles = {
  easy: { label: "Easy", elo: 120, randomness: 0.85 },
  medium: { label: "Medium", elo: 200, randomness: 0.55 },
  hard: { label: "Hard", elo: 500, randomness: 0.15 },
} as const;

export type SidePreference = "white" | "black" | "random";
/** Seed parity is chosen once from the match's random seed, never during render. */
export function startingArmy(
  preference: SidePreference,
  seed: number,
): "w" | "b" {
  return preference === "white"
    ? "w"
    : preference === "black"
      ? "b"
      : (seed & 1) === 0
        ? "w"
        : "b";
}
