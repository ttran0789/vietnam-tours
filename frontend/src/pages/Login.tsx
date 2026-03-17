import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import SEO from '../components/SEO'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      navigate('/')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <SEO title="Login" url="https://travelvntours.com/login" />
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>{t('login.title')}</h1>
        <p className="auth-subtitle">{t('login.subtitle')}</p>

        {error && <div className="error-message">{error}</div>}

        <label>
          {t('login.email')}
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </label>

        <label>
          {t('login.password')}
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </label>

        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? t('login.submitting') : t('login.submit')}
        </button>

        <p className="auth-link">
          {t('login.noAccount')} <Link to="/register">{t('login.signUp')}</Link>
        </p>
      </form>
    </div>
  )
}
