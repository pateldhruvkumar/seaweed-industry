export default function SparkAvatar({ size = 24, withGlow = false }) {
  const glow = withGlow ? 'shadow-[0_0_24px_rgba(45,212,191,0.35)]' : ''
  return (
    <span
      aria-hidden="true"
      style={{ width: `${size}px`, height: `${size}px` }}
      className={`inline-flex items-center justify-center rounded-full
                  bg-gradient-to-br from-brand-400 to-brand-700 ${glow}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ width: `${size * 0.55}px`, height: `${size * 0.55}px` }}
      >
        <path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6L12 3z" />
      </svg>
    </span>
  )
}
