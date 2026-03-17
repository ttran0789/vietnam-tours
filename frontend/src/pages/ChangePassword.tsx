import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import SEO from '../components/SEO'

export default function ChangePassword() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      setError(t('register.passwordMin'))
      return
    }
    if (newPassword !== confirm) {
      setError(t('auth.passwordMismatch'))
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.changePassword(currentPassword, newPassword)
      setDone(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <SEO title={t('auth.changePassword')} />
      <div className="auth-form">
        <h1>{t('auth.changePassword')}</h1>
        {done ? (
          <div className="booking-success">
            <h3>{t('auth.passwordChanged')}</h3>
            <p>{t('auth.passwordChangedDesc')}</p>
            <button className="btn btn-primary btn-block" onClick={() => navigate('/my-bookings')}>
              {t('bookings.title')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}
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
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? t('auth.saving') : t('auth.changePassword')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
