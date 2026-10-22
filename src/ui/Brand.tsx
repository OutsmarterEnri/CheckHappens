import { useEffect, useState } from "react";
import { Localized } from "./locale";
import type { Theme } from "./themes";
const asset = (name: string) => `${import.meta.env.BASE_URL}brand/${name}`;
const mascotAsset = (theme: Theme) =>
  asset(theme === "halloween" ? "mascot-halloween.png" : "mascot-sheet.png");
export function BrandMark({ theme }: { theme?: Theme } = {}) {
  if (theme)
    return (
      <span
        className={`brand-mark rooki-illustration rooki-${theme}`}
        aria-hidden="true"
        style={{ backgroundImage: `url("${mascotAsset(theme)}")` }}
      />
    );
  return (
    <img
      className="brand-mark"
      src={asset("mascot-main.png")}
      alt=""
      aria-hidden="true"
    />
  );
}
export function BrandWordmark() {
  return (
    <span className="brand-wordmark">
      <span>CHECK</span>
      <strong>
        HAPPENS<span className="brand-period">.</span>
      </strong>
    </span>
  );
}
export function Rooki({ theme }: { theme: Theme }) {
  const [mood, setMood] = useState(0),
    [bouncing, setBouncing] = useState(false);
  useEffect(() => {
    if (!bouncing) return;
    const timer = setTimeout(() => setBouncing(false), 600);
    return () => clearTimeout(timer);
  }, [bouncing]);
  return (
    <Localized>
      <div className="menu-logo rooki-stage">
        <button
          className={`rooki-button ${bouncing ? "rooki-cheer" : ""}`}
          aria-label="Say hello to Rooki"
          onClick={() => {
            setMood((m) => (m + 1) % 3);
            setBouncing(true);
          }}
        >
          <span className="rooki-orbit">
            <span
              className={`rooki-art rooki-illustration rooki-${theme}`}
              role="img"
              aria-label="Rooki, the chaos rook"
              data-look={theme}
              style={{ backgroundImage: `url("${mascotAsset(theme)}")` }}
            />
          </span>
        </button>
        <span className="rooki-speech" role="status">
          {
            ["Small rook. Big trouble.", "Trust the cards.", "Check happens!"][
              mood
            ]
          }
        </span>
      </div>
    </Localized>
  );
}
