/**
 * Tiny inline-SVG icon set. Lucide-style: 24x24 viewBox, stroke-based, 2px
 * stroke-width, rounded joins. Zero dependencies; tree-shakes perfectly.
 *
 * Each icon component accepts standard SVG props (className, size, etc).
 * Default size is 1em so they inherit text size when used in flow.
 */

function Svg({ children, className = 'w-4 h-4', ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export const IconActivity = props => (
  <Svg {...props}>
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </Svg>
)

export const IconGlobe = props => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </Svg>
)

export const IconMap = props => (
  <Svg {...props}>
    <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z" />
    <path d="M9 3v15" />
    <path d="M15 6v15" />
  </Svg>
)

export const IconLeaf = props => (
  <Svg {...props}>
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19.5 2c.5 6 .5 12-3 16-1.5 1.7-3.7 2-5.5 2z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6" />
  </Svg>
)

export const IconDollar = props => (
  <Svg {...props}>
    <line x1="12" y1="2" x2="12" y2="22" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </Svg>
)

export const IconShieldCheck = props => (
  <Svg {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </Svg>
)

export const IconWaves = props => (
  <Svg {...props}>
    <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
    <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
    <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
  </Svg>
)

export const IconSparkles = props => (
  <Svg {...props}>
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.5 5.5l2 2M16.5 16.5l2 2M5.5 18.5l2-2M16.5 7.5l2-2" />
  </Svg>
)

export const IconChevronDown = props => (
  <Svg {...props}>
    <polyline points="6 9 12 15 18 9" />
  </Svg>
)

export const IconExternal = props => (
  <Svg {...props}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </Svg>
)

export const IconBell = props => (
  <Svg {...props}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </Svg>
)

export const IconSettings = props => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </Svg>
)

export const IconSearch = props => (
  <Svg {...props}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </Svg>
)

export const IconChevronRight = props => (
  <Svg {...props}>
    <polyline points="9 18 15 12 9 6" />
  </Svg>
)

export const IconArrowUp = props => (
  <Svg {...props}>
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </Svg>
)

export const IconArrowDown = props => (
  <Svg {...props}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <polyline points="19 12 12 19 5 12" />
  </Svg>
)

/**
 * Decorative mini-sparkline. Not data-bound — a single hand-drawn trend
 * curve that adds visual interest to KPI cards. Inherits stroke color from
 * the surrounding text via currentColor.
 */
export function Sparkline({ className = 'w-12 h-6', variant = 'up' }) {
  // Two preset paths: gentle uptrend or wave. Both fit inside a 50x20 box.
  const path =
    variant === 'wave'
      ? 'M2 12 Q8 4 14 10 T26 8 T38 14 T48 10'
      : 'M2 16 Q9 13 14 14 T22 8 T32 10 T48 4'
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 50 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  )
}
