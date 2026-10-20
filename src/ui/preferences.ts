export type OpponentMode = "local" | "computer";
export interface Preferences {
  reduceMotion: boolean;
}
export function readPreference<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback;
  } catch {
    return fallback;
  }
}
export function writePreference(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
export const MODE_KEY = "scacchi-uno-opponent";
export const PREFS_KEY = "scacchi-uno-preferences";
