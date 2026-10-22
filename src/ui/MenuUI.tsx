import type { ReactNode } from "react";
import { BrandMark } from "./Brand";
import { Localized } from "./locale";
export type MenuSymbol =
  | "play"
  | "cards"
  | "settings"
  | "clock"
  | "people"
  | "bot"
  | "arrow"
  | "back"
  | "check"
  | "globe"
  | "moon";
export function MenuIcon({ kind }: { kind: MenuSymbol }) {
  const paths: Record<MenuSymbol, ReactNode> = {
    play: (
      <>
        <path d="M8 25h16l-2-11H10Z M10 14 7 7h5v4h4V6h4v5h4V7h3l-4 7M7 28h18" />
      </>
    ),
    cards: (
      <>
        <rect
          x="11"
          y="6"
          width="16"
          height="22"
          rx="3"
          transform="rotate(9 19 17)"
        />
        <path d="m9 8-4 1 2 20 11-1M17 12h5m-5 5h5m-5 5h3" />
      </>
    ),
    settings: (
      <>
        <path d="m13 4 1-2h4l1 2 2 2 3-1 3 4-1 3 1 3 3 2-1 4-4 1-2 2v4h-5l-2-3-3-1-3 2-3-4 1-3-1-3-3-2 1-4 4-1Z" />
        <circle cx="16" cy="15" r="5" />
      </>
    ),
    clock: (
      <>
        <circle cx="16" cy="17" r="11" />
        <path d="M16 10v8l5 3M12 2h8M16 2v4" />
      </>
    ),
    people: (
      <>
        <circle cx="11" cy="10" r="4" />
        <circle cx="24" cy="12" r="3" />
        <path d="M3 27v-4a8 8 0 0 1 16 0v4Zm20-8a6 6 0 0 1 7 6v2h-7" />
      </>
    ),
    bot: (
      <>
        <rect x="4" y="9" width="24" height="18" rx="5" />
        <path d="M16 9V4M14 3h4M1 16v5m30-5v5M11 22h10" />
        <circle cx="11" cy="16" r="1" />
        <circle cx="21" cy="16" r="1" />
      </>
    ),
    arrow: <path d="M6 16h20m-8-8 8 8-8 8" />,
    back: <path d="M26 16H6m8-8-8 8 8 8" />,
    check: <path d="m7 16 6 6L26 9" />,
    globe: (
      <>
        <circle cx="16" cy="16" r="12" />
        <ellipse cx="16" cy="16" rx="5" ry="12" />
        <path d="M5 12h22M5 20h22" />
      </>
    ),
    moon: <path d="M26 21A12 12 0 0 1 11 5a12 12 0 1 0 15 16Z" />,
  };
  return (
    <svg
      className="menu-icon"
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[kind]}
    </svg>
  );
}
export function MenuHeader({ onHome }: { onHome: () => void }) {
  return (
    <Localized>
      <header className="menu-topbar">
        <button
          className="quiet back-menu"
          aria-label="← Home"
          onClick={onHome}
        >
          <MenuIcon kind="back" />
          <span>Home</span>
        </button>
        <span className="menu-topbar-brand">
          <BrandMark />
          <span>Check Happens.</span>
        </span>
      </header>
    </Localized>
  );
}
