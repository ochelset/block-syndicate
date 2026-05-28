import type { SVGProps } from 'react';

export function BlockSyndicateLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 270 100"
      width="100%"
      height="100%"
      xmlns="http://w3.org"
      aria-label="Block Syndicate Logo"
      {...props}
    >
      <defs>
        {/* Neon Cyber Red Glow */}
        <filter id="neon-red" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Neon Cyber Cyan Glow */}
        <filter id="neon-cyan" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background Tech Grid Lines (Subtle) */}
      <path
        d="M 10,0 L 10,120 M 30,0 L 30,120"
        stroke="#1f2937"
        strokeWidth="1"
        opacity="0.3"
      />

      {/* "BLOCK" - Heavy Isometric Angular Typography */}
      <g
        fill="#ff2a5f"
        filter="url(#neon-red)"
        style={{ transform: 'skewX(-10deg)' }}
      >
        {/* B */}
        <path
          d="M 20,20 H 55 C 65,20 65,35 55,35 H 20 V 20 M 20,35 H 58 C 68,35 68,55 58,55 H 20 V 35"
          fillRule="evenodd"
        />
        {/* L */}
        <path d="M 75,20 V 55 H 105 V 45 H 87 V 20 Z" />
        {/* O */}
        <path
          d="M 115,20 H 145 V 55 H 115 Z M 127,30 V 45 H 133 V 30 Z"
          fillRule="evenodd"
        />
        {/* C */}
        <path d="M 185,20 H 155 V 55 H 185 V 45 H 167 V 30 H 185 Z" />
        {/* K */}
        <path d="M 195,20 V 55 H 207 V 40 L 222,55 H 237 L 217,35 L 235,20 H 220 L 207,32 V 20 Z" />
      </g>

      {/* "SYNDICATE" - Sharp, Futuristic Sub-text */}
      <text
        x="20"
        y="85"
        fill="#00f3ff"
        filter="url(#neon-cyan)"
        fontFamily="monospace"
        fontSize="24"
        fontWeight="900"
        letterSpacing="11"
        style={{ transform: 'skewX(-10deg)' }}
      >
        SYNDICATE
      </text>
    </svg>
  );
}
