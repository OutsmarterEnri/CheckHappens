/** Risk is the effective next-move probability, including the blue-card bonus. */
export function crackStage(percent: number): number {
  return percent <= 0 ? 0 : Math.min(5, Math.ceil(percent / 20));
}
export function PieceCracks({ percent }: { percent: number }) {
  const stage = crackStage(percent);
  const lines = [
    "m25 10-4 7 6 3",
    "m27 20-8 7 4 6",
    "m21 17-7-3-3 4",
    "m23 33-5 8 6 3",
    "m26 22 9 6-3 8",
  ];
  return (
    <svg
      className={`crack crack-stage-${stage}`}
      viewBox="0 0 48 48"
      aria-hidden="true"
      data-crack-stage={stage}
    >
      {lines.slice(0, stage).map((d, i) => (
        <path key={i} d={d} className="crack-branch" />
      ))}
    </svg>
  );
}
export function SkipChains() {
  return (
    <span className="skip-chains" aria-hidden="true">
      <svg viewBox="0 0 48 48" className="chain-wrap">
        <g className="chain-links" transform="rotate(-30 24 24)">
          {[5, 13, 21, 29, 37].map((x) => (
            <rect key={x} x={x} y="20" width="12" height="8" rx="4" />
          ))}
        </g>
        <g className="chain-links" transform="rotate(35 24 24)">
          {[0, 8, 16, 24, 32].map((x) => (
            <rect key={x} x={x} y="20" width="12" height="8" rx="4" />
          ))}
        </g>
        <g className="chain-lock">
          <path d="M19 24v-5a5 5 0 0 1 10 0v5" />
          <rect x="17" y="23" width="14" height="13" rx="3" />
          <path d="M24 27v5" />
        </g>
      </svg>
    </span>
  );
}
