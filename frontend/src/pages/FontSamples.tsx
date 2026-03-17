import { useEffect } from 'react'
import { Logo1 } from '../components/LogoOptions'

const FONTS = [
  { name: 'Inter (current)', family: 'Inter, sans-serif', weight: 700 },
  { name: 'Poppins', family: 'Poppins, sans-serif', weight: 700 },
  { name: 'Montserrat', family: 'Montserrat, sans-serif', weight: 700 },
  { name: 'Playfair Display', family: 'Playfair Display, serif', weight: 700 },
  { name: 'Cormorant Garamond', family: 'Cormorant Garamond, serif', weight: 700 },
  { name: 'Bebas Neue', family: 'Bebas Neue, sans-serif', weight: 400 },
  { name: 'Oswald', family: 'Oswald, sans-serif', weight: 600 },
  { name: 'Pacifico', family: 'Pacifico, cursive', weight: 400 },
  { name: 'Caveat', family: 'Caveat, cursive', weight: 700 },
  { name: 'Merriweather', family: 'Merriweather, serif', weight: 700 },
  { name: 'Lora', family: 'Lora, serif', weight: 700 },
  { name: 'Raleway', family: 'Raleway, sans-serif', weight: 700 },
  { name: 'Josefin Sans', family: 'Josefin Sans, sans-serif', weight: 700 },
  { name: 'Archivo Black', family: 'Archivo Black, sans-serif', weight: 400 },
  { name: 'DM Serif Display', family: 'DM Serif Display, serif', weight: 400 },
]

export default function FontSamples() {
  useEffect(() => {
    const families = FONTS.map(f => f.name.replace(/ /g, '+')).join('&family=')
    const link = document.createElement('link')
    link.href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`
    link.rel = 'stylesheet'
    document.head.appendChild(link)
    return () => { document.head.removeChild(link) }
  }, [])

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Font Samples</h1>
      <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '2rem' }}>Pick a font for the logo</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {FONTS.map((font, i) => (
          <div key={i} style={{
            background: 'white',
            borderRadius: 12,
            padding: '1.25rem 1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}>
            <div style={{ flexShrink: 0 }}>
              <Logo1 size={36} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: font.family,
                fontWeight: font.weight,
                fontSize: '1.5rem',
                color: '#0f766e',
                lineHeight: 1.2,
              }}>
                Travel VN Tours
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                {font.name}
              </div>
            </div>
            <div style={{
              background: '#f8fafc',
              borderRadius: 8,
              padding: '0.75rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <Logo1 size={28} />
              <span style={{
                fontFamily: font.family,
                fontWeight: font.weight,
                fontSize: '1.1rem',
                color: '#0f766e',
              }}>
                Travel VN Tours
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
