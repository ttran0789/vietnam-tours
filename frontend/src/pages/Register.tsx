import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      setError(t('register.passwordMin'))
      return
    }
    setLoading(true)
    setError('')
    try {
      await register(email, name, password)
      navigate('/')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>{t('register.title')}</h1>
        <p className="auth-subtitle">{t('register.subtitle')}</p>

        {error && <div className="error-message">{error}</div>}

        <label>
          {t('register.name')}
          <input type="text" value={name} onChange={e => setName(e.target.value)} required />
        </label>

        <label>
          {t('register.email')}
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </label>

        <label>
          {t('register.password')}
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
        </label>

        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? t('register.submitting') : t('register.submit')}
        </button>

        <p className="auth-link">
          {t('register.hasAccount')} <Link to="/login">{t('register.signIn')}</Link>
        </p>
      </form>
    </div>
  )
}
