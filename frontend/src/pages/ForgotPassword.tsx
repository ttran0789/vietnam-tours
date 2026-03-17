import { useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import SEO from '../components/SEO'

export default function ForgotPassword() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.forgotPassword(email)
      setSent(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <SEO title={t('auth.forgotPassword')} />
      <div className="auth-form">
        <h1>{t('auth.forgotPassword')}</h1>
        {sent ? (
          <div className="booking-success">
            <h3>{t('auth.resetSent')}</h3>
            <p>{t('auth.resetSentDesc')}</p>
            <Link to="/login" className="btn btn-primary btn-block">{t('auth.backToLogin')}</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="auth-subtitle">{t('auth.forgotDesc')}</p>
            {error && <div className="error-message">{error}</div>}
            <label>
              {t('login.email')}
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </label>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? t('auth.sending') : t('auth.sendResetLink')}
            </button>
            <p className="auth-link">
              <Link to="/login">{t('auth.backToLogin')}</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
