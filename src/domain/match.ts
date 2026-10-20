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
