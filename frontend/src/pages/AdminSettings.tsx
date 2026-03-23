import { useState, useEffect } from 'react'
import { api } from '../api'
import SEO from '../components/SEO'
import AdminNav from '../components/AdminNav'

const THEMES = [
  { id: 'ocean-blue', name: 'Ocean Blue', primary: '#1d4ed8', bg: '#f0f4ff', accent: '#f97316' },
  { id: 'teal', name: 'Teal', primary: '#0f766e', bg: '#f8fafc', accent: '#f59e0b' },
  { id: 'sunset-gold', name: 'Sunset Gold', primary: '#b45309', bg: '#fffbeb', accent: '#dc2626' },
  { id: 'forest', name: 'Forest & Earth', primary: '#15803d', bg: '#f0fdf4', accent: '#ea580c' },
]

export default function AdminSettings() {
  const [currentTheme, setCurrentTheme] = useState('ocean-blue')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.getTheme().then(data => setCurrentTheme(data.theme)).catch(() => {})
  }, [])

  const handleThemeChange = async (themeId: string) => {
    setCurrentTheme(themeId)
    document.documentElement.setAttribute('data-theme', themeId)
    setSaving(true)
    setSaved(false)
    try {
      await api.updateConfig('theme', themeId)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err: any) {
      alert(err.message || 'Failed to save theme')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container">
      <AdminNav />
      <SEO title="Settings" />
      <h1 className="page-title">Settings</h1>

      <h2 className="bookings-subheader">Theme</h2>
      <p style={{ color: 'var(--text-light)', marginBottom: '1rem' }}>Choose a color theme for the entire site. Changes apply immediately for all visitors.</p>

      <div className="theme-grid">
        {THEMES.map(theme => (
          <button
            key={theme.id}
            className={`theme-card ${currentTheme === theme.id ? 'theme-card-active' : ''}`}
            onClick={() => handleThemeChange(theme.id)}
            disabled={saving}
          >
            <div className="theme-preview">
              <div className="theme-preview-nav" style={{ background: '#fff', borderBottom: `2px solid ${theme.primary}` }}>
                <div className="theme-preview-dot" style={{ background: theme.primary }} />
                <div className="theme-preview-dot" style={{ background: theme.primary, opacity: 0.5 }} />
                <div className="theme-preview-dot" style={{ background: theme.primary, opacity: 0.3 }} />
              </div>
              <div className="theme-preview-hero" style={{ background: theme.primary }} />
              <div className="theme-preview-body" style={{ background: theme.bg }}>
                <div className="theme-preview-card" />
                <div className="theme-preview-card" />
              </div>
            </div>
            <div className="theme-card-info">
              <strong>{theme.name}</strong>
              <div className="theme-swatches">
                <span className="theme-swatch" style={{ background: theme.primary }} title="Primary" />
                <span className="theme-swatch" style={{ background: theme.accent }} title="Accent" />
                <span className="theme-swatch" style={{ background: theme.bg, border: '1px solid #ccc' }} title="Background" />
              </div>
            </div>
            {currentTheme === theme.id && <span className="theme-check">Active</span>}
          </button>
        ))}
      </div>

      {saved && <p style={{ color: 'var(--primary)', fontWeight: 600, marginTop: '1rem' }}>Theme saved!</p>}
    </div>
  )
}
