import type { Army, PieceType } from "../domain/types";
const paths: Record<PieceType, React.ReactNode> = {
  p: (
    <>
      <circle cx="24" cy="13" r="6" />
      <path d="M20 19h8l2 13H18zM16 33h16l3 7H13z" />
    </>
  ),
  r: (
    <>
      <path d="M14 8h5v6h4V8h4v6h4V8h5v13l-5 4 2 10H15l2-10-3-4zM12 36h24v5H12z" />
    </>
  ),
  n: (
    <>
      <path d="M14 36h20l-3-6 2-13-6-8-9-2 1 6-9 12 5 5 8-8 1 7-8 3zM12 37h24v5H12z" />
      <circle cx="25" cy="16" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  b: (
    <>
      <path d="M24 5c-3 5-9 8-9 15 0 4 4 7 6 8l-3 7h12l-3-7c3-1 6-4 6-8 0-7-6-10-9-15zM13 36h22v6H13z" />
      <path d="m24 11-4 9" fill="none" />
    </>
  ),
  q: (
    <>
      <path d="m12 15 6 7 6-12 6 12 6-7-5 19H17zM13 36h22v6H13z" />
      <circle cx="11" cy="12" r="3" />
      <circle cx="24" cy="7" r="3" />
      <circle cx="37" cy="12" r="3" />
    </>
  ),
  k: (
    <>
      <path d="M24 4v12m-5-7h10" fill="none" />
      <path d="M18 17h12c5 0 7 4 4 9l-5 8H19l-5-8c-3-5-1-9 4-9zM13 36h22v6H13z" />
    </>
  ),
};
export function PieceIcon({ type, army }: { type: PieceType; army: Army }) {
  return (
    <svg
      className={`piece piece-${army}`}
      viewBox="0 0 48 48"
      aria-hidden="true"
      fill={
        army === "w"
          ? "var(--piece-white, #fffcf1)"
          : "var(--piece-black, #8360c4)"
      }
      stroke="var(--piece-outline, #322546)"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[type]}
      {type !== "n" && (
        <g
          stroke="none"
          fill={
            army === "w"
              ? "var(--piece-white-eye, #322546)"
              : "var(--piece-black-eye, #fffcf1)"
          }
        >
          <ellipse
            cx="21"
            cy={type === "p" ? 13 : type === "b" ? 23 : 27}
            rx="1.3"
            ry="1.7"
          />
          <ellipse
            cx="27"
            cy={type === "p" ? 13 : type === "b" ? 23 : 27}
            rx="1.3"
            ry="1.7"
          />
        </g>
      )}
      {type === "n" && (
        <circle
          cx="25"
          cy="16"
          r="1.5"
          fill={
            army === "w"
              ? "var(--piece-white-eye, #322546)"
              : "var(--piece-black-eye, #fffcf1)"
          }
          stroke="none"
        />
      )}
    </svg>
  );
}
