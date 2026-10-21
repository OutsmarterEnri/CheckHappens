import { useEffect, useState } from "react";
import { Localized } from "./locale";
import type { Theme } from "./themes";
function RookFace() {
  return (
    <g
      stroke="var(--mascot-outline, #322546)"
      strokeWidth="4.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d="M20 13h20v17h13V9h20v21h13V13h20v34l-12 10 8 43H24l8-43-12-10Z"
        fill="var(--mascot-body, #b49be0)"
      />
      <path d="M29 47h68" opacity=".25" fill="none" />
      <rect
        x="23"
        y="91"
        width="80"
        height="17"
        rx="7"
        fill="var(--mascot-trim, #ffce52)"
      />
      <path
        d="m29 28 4 10"
        stroke="var(--mascot-shine, #fff9e9)"
        strokeWidth="5"
      />
      <g fill="var(--mascot-outline, #322546)" stroke="none">
        <ellipse cx="45" cy="57" rx="5" ry="7" />
        <ellipse className="rooki-eye" cx="79" cy="57" rx="5" ry="7" />
      </g>
      <path d="m39 44 12-2m21 0 12 4" fill="none" strokeWidth="3" />
      <ellipse
        cx="33"
        cy="72"
        rx="7"
        ry="4"
        fill="var(--mascot-cheek, #f48c9c)"
        stroke="none"
      />
      <ellipse
        cx="91"
        cy="72"
        rx="7"
        ry="4"
        fill="var(--mascot-cheek, #f48c9c)"
        stroke="none"
      />
      <path d="M45 75q17 21 34-1-17 8-34 1Z" fill="#fff8e9" strokeWidth="3" />
    </g>
  );
}
export function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 126 120" aria-hidden="true">
      <RookFace />
    </svg>
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
            setMood((mood + 1) % 3);
            setBouncing(true);
          }}
        >
          <svg
            className="rooki-art"
            viewBox="0 0 280 225"
            role="img"
            aria-label="Rooki, the chaos rook"
            data-look={theme}
          >
            <ellipse
              cx="142"
              cy="207"
              rx="76"
              ry="9"
              fill="var(--hero-shadow)"
            />
            <circle cx="140" cy="104" r="83" fill="var(--hero-medallion)" />
            <g fill="var(--purple)" stroke="none">
              <path d="m37 55 4-13 5 13 13 4-13 4-5 13-4-13-13-4Z" />
              <path d="m224 151 3-9 4 9 9 3-9 3-4 9-3-9-9-3Z" />
              <circle cx="218" cy="35" r="5" />
              <circle cx="53" cy="166" r="4" />
            </g>
            <g
              stroke="var(--mascot-outline)"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d="M100 96 64 180l62-13 58 17-22-85Z"
                fill="var(--mascot-cape)"
              />
              {theme === "cloud" && (
                <path
                  d="M81 112q-35-27-45-6 15 30 51 31m104-25q35-27 45-6-15 30-51 31"
                  fill="var(--mascot-shine)"
                />
              )}
              <path
                d="M102 118q-38-10-49 20m129-20q25 5 32-17"
                fill="none"
                stroke="var(--mascot-body)"
                strokeWidth="16"
              />
              <circle cx="52" cy="141" r="10" fill="var(--mascot-shine)" />
              <path d="m109 169-8 22m65-22 8 22" strokeWidth="11" />
              <path
                d="M102 185q-24-1-29 15 10 10 40 4l1-15Zm69 0q24-1 29 15-10 10-40 4l-1-15Z"
                fill="var(--mascot-trim)"
              />
              <g transform="translate(76 39)">
                <RookFace />
              </g>
              {theme === "mint" && (
                <g>
                  <path d="M94 76h84v12H94z" fill="var(--mascot-cape)" />
                  <path d="m95 81-18-9 6 20 12-7" fill="var(--mascot-trim)" />
                </g>
              )}
              {theme === "peach" && (
                <g fill="var(--mascot-outline)">
                  <path d="M108 89h29l-3 15h-20zm35 0h29l-6 15h-20Z" />
                  <path d="M137 92h7" />
                  <path
                    d="m113 91 11 3m25-3 11 3"
                    stroke="var(--mascot-shine)"
                    strokeWidth="2"
                  />
                </g>
              )}
              {theme === "cloud" && (
                <g fill="none">
                  <rect x="109" y="88" width="26" height="19" rx="8" />
                  <rect x="145" y="88" width="26" height="19" rx="8" />
                  <path d="M135 95h10m-36-1-10-5m72 5 10-5" />
                </g>
              )}
              {theme === "bubblegum" && (
                <g>
                  <circle
                    className="rooki-bubble"
                    cx="164"
                    cy="124"
                    r="19"
                    fill="var(--mascot-cape)"
                  />
                  <path
                    d="m157 112q6-5 12 1"
                    stroke="var(--mascot-shine)"
                    strokeWidth="3"
                  />
                </g>
              )}
              {theme === "candy" && (
                <path
                  d="m155 31 5 11 12 2-9 9 2 12-10-6-11 6 2-12-8-9 12-2Z"
                  fill="var(--mascot-trim)"
                  strokeWidth="3"
                />
              )}
              <g transform="rotate(13 223 94)">
                <rect
                  x="201"
                  y="57"
                  width="48"
                  height="69"
                  rx="9"
                  fill="var(--mascot-shine)"
                />
                <path d="m215 72 19 19-19 19" fill="none" strokeWidth="5" />
                <circle cx="209" cy="65" r="3" fill="#f18a85" stroke="none" />
                <circle cx="241" cy="65" r="3" fill="#93c5ed" stroke="none" />
                <circle cx="209" cy="118" r="3" fill="#a8d4a4" stroke="none" />
                <circle cx="241" cy="118" r="3" fill="#ffe176" stroke="none" />
              </g>
              <circle cx="211" cy="107" r="10" fill="var(--mascot-body)" />
            </g>
          </svg>
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
