import { useState, FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'
import SEO from '../components/SEO'

export default function Profile() {
  const { user, login } = useAuth()
  const { t } = useTranslation()

  // Profile fields
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp || '')
  const [zalo, setZalo] = useState(user?.zalo || '')
  const [nationality, setNationality] = useState(user?.nationality || '')
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setProfileLoading(true)
    setProfileError('')
    setProfileSaved(false)
    try {
      await api.updateProfile({ name, phone, whatsapp, zalo, nationality })
      setProfileSaved(true)
      // Refresh user data in context
      await api.getMe()
      window.location.reload()
    } catch (e: any) {
      setProfileError(e.message)
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      setPasswordError(t('register.passwordMin'))
      return
    }
    if (newPassword !== confirm) {
      setPasswordError(t('auth.passwordMismatch'))
      return
    }
    setPasswordLoading(true)
    setPasswordError('')
    setPasswordSaved(false)
    try {
      await api.changePassword(currentPassword, newPassword)
      setPasswordSaved(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirm('')
    } catch (e: any) {
      setPasswordError(e.message)
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="container">
      <SEO title={t('profile.title')} />
      <h1 className="page-title">{t('profile.title')}</h1>

      <div className="profile-layout">
        <div className="profile-section">
          <div className="profile-card">
            <h2>{t('profile.contactInfo')}</h2>
            <p className="profile-desc">{t('profile.contactDesc')}</p>

            <form onSubmit={handleProfileSubmit}>
              {profileError && <div className="error-message">{profileError}</div>}
              {profileSaved && <div className="success-message">{t('profile.saved')}</div>}

              <label>
                {t('profile.name')}
                <input type="text" value={name} onChange={e => setName(e.target.value)} required />
              </label>

              <label>
                {t('profile.email')}
                <input type="email" value={user?.email || ''} disabled className="input-disabled" />
              </label>

              <label>
                {t('profile.phone')}
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 234 567 8900" />
              </label>

              <label>
                WhatsApp
                <input type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+84 912 345 678" />
              </label>

              <label>
                Zalo
                <input type="tel" value={zalo} onChange={e => setZalo(e.target.value)} placeholder="+84 912 345 678" />
              </label>

              <label>
                {t('profile.nationality')}
                <input type="text" value={nationality} onChange={e => setNationality(e.target.value)} placeholder="e.g. American, Australian, German..." />
              </label>

              <button type="submit" className="btn btn-primary btn-block" disabled={profileLoading}>
                {profileLoading ? t('auth.saving') : t('profile.saveProfile')}
              </button>
            </form>
          </div>
        </div>

        <div className="profile-section">
          <div className="profile-card">
            <h2>{t('auth.changePassword')}</h2>

            <form onSubmit={handlePasswordSubmit}>
              {passwordError && <div className="error-message">{passwordError}</div>}
              {passwordSaved && <div className="success-message">{t('auth.passwordChanged')}</div>}

              <label>
                {t('auth.currentPassword')}
                <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
              </label>

              <label>
                {t('auth.newPassword')}
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
              </label>

              <label>
                {t('auth.confirmPassword')}
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={6} />
              </label>

              <button type="submit" className="btn btn-primary btn-block" disabled={passwordLoading}>
                {passwordLoading ? t('auth.saving') : t('auth.changePassword')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
