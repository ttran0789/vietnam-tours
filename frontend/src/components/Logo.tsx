export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Mountain backdrop */}
      <path d="M4 38L16 14L22 24L28 12L44 38H4Z" fill="#0f766e" opacity="0.15" />
      <path d="M4 38L16 18L22 26L28 16L44 38" stroke="#0f766e" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" fill="none" />
      {/* Sun */}
      <circle cx="38" cy="12" r="5" fill="#f59e0b" />
      {/* Road/path */}
      <path d="M20 38C20 38 22 30 24 30C26 30 28 38 28 38" stroke="#0f766e" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Rice terrace lines */}
      <path d="M8 34C12 32 14 33 18 31" stroke="#0f766e" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <path d="M30 33C34 31 36 32 40 30" stroke="#0f766e" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  )
}
