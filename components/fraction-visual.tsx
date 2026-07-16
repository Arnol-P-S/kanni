export function FractionVisual() {
  return (
    <figure className="fraction-visual">
      <svg
        viewBox="0 0 620 245"
        role="img"
        aria-labelledby="fraction-visual-title fraction-visual-description"
      >
        <title id="fraction-visual-title">One half and one quarter fraction strips</title>
        <desc id="fraction-visual-description">
          Two equal strips. The first is split into two equal parts with one part
          shaded. The second is split into four equal parts with one part shaded.
          The shaded half is larger than the shaded quarter.
        </desc>
        <g transform="translate(20 35)">
          <text x="0" y="22" className="fraction-label">One half</text>
          <rect x="145" y="0" width="420" height="68" rx="12" className="strip-base" />
          <path d="M157 0h198v68H157a12 12 0 0 1-12-12V12A12 12 0 0 1 157 0Z" className="strip-fill" />
          <line x1="355" y1="0" x2="355" y2="68" className="strip-line" />
        </g>
        <g transform="translate(20 145)">
          <text x="0" y="22" className="fraction-label">One quarter</text>
          <rect x="145" y="0" width="420" height="68" rx="12" className="strip-base" />
          <path d="M157 0h93v68h-93a12 12 0 0 1-12-12V12A12 12 0 0 1 157 0Z" className="strip-fill warm" />
          <line x1="250" y1="0" x2="250" y2="68" className="strip-line" />
          <line x1="355" y1="0" x2="355" y2="68" className="strip-line" />
          <line x1="460" y1="0" x2="460" y2="68" className="strip-line" />
        </g>
      </svg>
      <figcaption>Both strips show the same-sized whole.</figcaption>
    </figure>
  );
}
