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
