import { useState, FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import SEO from '../components/SEO'

export default function ResetPassword() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      setError(t('register.passwordMin'))
      return
    }
    if (password !== confirm) {
      setError(t('auth.passwordMismatch'))
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.resetPassword(token, password)
      setDone(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-form">
          <h1>{t('auth.resetPassword')}</h1>
          <div className="error-message">{t('auth.invalidResetLink')}</div>
          <Link to="/forgot-password" className="btn btn-primary btn-block">{t('auth.requestNewLink')}</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <SEO title={t('auth.resetPassword')} />
      <div className="auth-form">
        <h1>{t('auth.resetPassword')}</h1>
        {done ? (
          <div className="booking-success">
            <h3>{t('auth.passwordResetDone')}</h3>
            <p>{t('auth.passwordResetDoneDesc')}</p>
            <Link to="/login" className="btn btn-primary btn-block">{t('login.submit')}</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}
            <label>
              {t('auth.newPassword')}
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </label>
            <label>
              {t('auth.confirmPassword')}
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={6} />
            </label>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? t('auth.resetting') : t('auth.resetPassword')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
