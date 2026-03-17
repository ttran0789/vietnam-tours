// Logo Option 1: Mountain + Sun (current, refined)
export function Logo1({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M4 38L16 14L22 24L28 12L44 38H4Z" fill="#0f766e" opacity="0.15" />
      <path d="M4 38L16 18L22 26L28 16L44 38" stroke="#0f766e" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" fill="none" />
      <circle cx="38" cy="12" r="5" fill="#f59e0b" />
      <path d="M20 38C20 38 22 30 24 30C26 30 28 38 28 38" stroke="#0f766e" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M8 34C12 32 14 33 18 31" stroke="#0f766e" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <path d="M30 33C34 31 36 32 40 30" stroke="#0f766e" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  )
}

// Logo Option 2: Motorbike
export function Logo2({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* Mountains background */}
      <path d="M0 40L12 22L20 32L28 18L48 40H0Z" fill="#0f766e" opacity="0.1" />
      {/* Bike body */}
      <circle cx="14" cy="34" r="6" stroke="#0f766e" strokeWidth="2.5" fill="none" />
      <circle cx="36" cy="34" r="6" stroke="#0f766e" strokeWidth="2.5" fill="none" />
      <path d="M14 34L22 22L30 22L36 34" stroke="#0f766e" strokeWidth="2.5" strokeLinejoin="round" fill="none" />
      <path d="M22 22L20 28H28L30 22" stroke="#0f766e" strokeWidth="2" strokeLinejoin="round" fill="none" />
      {/* Handlebar */}
      <path d="M30 22L34 18" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round" />
      {/* Rider hint */}
      <circle cx="24" cy="16" r="3" fill="#f59e0b" />
    </svg>
  )
}

// Logo Option 3: Vietnam Map Outline
export function Logo3({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* Simplified Vietnam S-shape */}
      <path
        d="M28 4C26 4 24 6 22 8C20 10 22 14 24 16C26 18 28 20 26 24C24 28 22 30 20 32C18 34 16 36 18 40C20 44 22 44 24 44"
        stroke="#0f766e"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Fill hint */}
      <path
        d="M28 4C26 4 24 6 22 8C20 10 22 14 24 16C26 18 28 20 26 24C24 28 22 30 20 32C18 34 16 36 18 40C20 44 22 44 24 44"
        fill="#0f766e"
        opacity="0.1"
      />
      {/* Ha Giang dot */}
      <circle cx="24" cy="10" r="3" fill="#f59e0b" />
      {/* Hanoi dot */}
      <circle cx="24" cy="20" r="2" fill="#0f766e" opacity="0.5" />
      {/* Compass rose */}
      <path d="M38 8L40 4L42 8L38 8Z" fill="#0f766e" />
      <path d="M38 8L40 12L42 8" stroke="#0f766e" strokeWidth="1" fill="none" />
      <path d="M36 6L40 4L40 8" stroke="#0f766e" strokeWidth="0.8" fill="none" opacity="0.4" />
    </svg>
  )
}

// Logo Option 4: Minimal Text VN
export function Logo4({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* Rounded square background */}
      <rect x="2" y="2" width="44" height="44" rx="12" fill="#0f766e" />
      {/* VN text */}
      <text x="24" y="30" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontSize="20" fontWeight="800" fill="white" letterSpacing="-1">VN</text>
      {/* Mountain silhouette at bottom */}
      <path d="M2 38L14 28L22 34L30 26L46 38" stroke="white" strokeWidth="1.5" opacity="0.4" strokeLinejoin="round" fill="none" />
      {/* Sun */}
      <circle cx="38" cy="12" r="4" fill="#f59e0b" />
    </svg>
  )
}

// Logo Option 5: Conical Hat (Non La)
export function Logo5({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* Conical hat */}
      <path d="M24 6L8 32H40L24 6Z" fill="#0f766e" opacity="0.15" />
      <path d="M24 6L8 32H40L24 6Z" stroke="#0f766e" strokeWidth="2.5" strokeLinejoin="round" fill="none" />
      {/* Hat brim */}
      <ellipse cx="24" cy="32" rx="16" ry="3" stroke="#0f766e" strokeWidth="2" fill="none" />
      {/* Hat line details */}
      <path d="M16 24L32 24" stroke="#0f766e" strokeWidth="1" opacity="0.3" />
      <path d="M12 28L36 28" stroke="#0f766e" strokeWidth="1" opacity="0.3" />
      {/* Small sun */}
      <circle cx="38" cy="10" r="4" fill="#f59e0b" />
      {/* Rice field hint */}
      <path d="M6 40C12 38 16 39 24 37C32 35 36 36 42 38" stroke="#0f766e" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
      <path d="M4 44C10 42 18 41 24 40C30 39 38 40 44 42" stroke="#0f766e" strokeWidth="1.5" strokeLinecap="round" opacity="0.2" />
    </svg>
  )
}

// Preview page showing all logos
export default function LogoOptions() {
  const logos = [
    { name: 'Mountain + Sun', Component: Logo1 },
    { name: 'Motorbike', Component: Logo2 },
    { name: 'Vietnam Map', Component: Logo3 },
    { name: 'Minimal VN', Component: Logo4 },
    { name: 'Conical Hat (Non La)', Component: Logo5 },
  ]

  return (
    <div style={{ padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem', textAlign: 'center' }}>Logo Options</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
        {logos.map(({ name, Component }, i) => (
          <div key={i} style={{ background: 'white', borderRadius: 12, padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <div style={{ marginBottom: '1rem' }}>
              <Component size={80} />
            </div>
            <h3 style={{ marginBottom: '1rem' }}>Option {i + 1}: {name}</h3>
            {/* Show in navbar context */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: 8 }}>
              <Component size={32} />
              <span style={{ fontWeight: 700, color: '#0f766e', fontSize: '1.1rem' }}>Travel VN Tours</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
