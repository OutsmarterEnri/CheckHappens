import type { Command } from "./types";

export function isCommand(value: unknown): value is Command {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const c = value as Record<string, unknown>;
  const only = (keys: string[]) =>
    Object.keys(c).every((k) => keys.includes(k));
  const id = (v: unknown) =>
    typeof v === "string" && v.length > 0 && v.length <= 80;
  const square = (v: unknown) =>
    Number.isInteger(v) && Number(v) >= 0 && Number(v) < 64;
  switch (c.type) {
    case "StartGame":
    case "AdvanceTime":
      return only(["type"]);
    case "SubmitMove":
      return (
        only(["type", "from", "to", "promotion"]) &&
        square(c.from) &&
        square(c.to) &&
        (c.promotion === undefined ||
          (typeof c.promotion === "string" &&
            ["q", "r", "b", "n"].includes(c.promotion)))
      );
    case "ChooseUnoColor":
      return (
        only(["type", "color"]) &&
        typeof c.color === "string" &&
        ["red", "green", "blue", "yellow"].includes(c.color)
      );
    case "ChooseSkipTarget":
      return only(["type", "pieceId"]) && id(c.pieceId);
    case "ChooseResurrections":
      return (
        only(["type", "pieceIds"]) &&
        Array.isArray(c.pieceIds) &&
        c.pieceIds.length <= 4 &&
        c.pieceIds.every(id)
      );
    case "ChooseEvolution":
      return (
        only(["type", "pieceId", "pieceType"]) &&
        id(c.pieceId) &&
        typeof c.pieceType === "string" &&
        ["r", "b", "n"].includes(c.pieceType)
      );
    case "EndOptionalMoves":
      return only(["type"]);
    default:
      return false;
  }
}
