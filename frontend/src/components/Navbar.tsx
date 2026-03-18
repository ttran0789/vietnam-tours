import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import LanguageSwitcher from './LanguageSwitcher'
import Logo from './Logo'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  const closeMenu = () => setMenuOpen(false)

  // Close menu on route change
  const NavLink = ({ to, children, className }: { to: string; children: React.ReactNode; className?: string }) => (
    <Link to={to} className={className} onClick={closeMenu}>{children}</Link>
  )

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo" onClick={closeMenu}>
          <Logo size={32} />
          <span>{t('nav.logo')}</span>
        </Link>

        <button
          className={`nav-hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`nav-links ${menuOpen ? 'nav-links-open' : ''}`}>
          <NavLink to="/">{t('nav.tours')}</NavLink>
          <NavLink to="/transport">{t('nav.transport')}</NavLink>
          <NavLink to="/about">{t('nav.about')}</NavLink>
          {user ? (
            <>
              <NavLink to="/my-bookings">{t('nav.myBookings')}</NavLink>
              {user.is_admin && (
                <NavLink to="/admin/bookings">{t('nav.admin')}</NavLink>
              )}
              <NavLink to="/profile" className="nav-user-link">{t('nav.greeting', { name: user.name })}</NavLink>
              <button onClick={() => { logout(); closeMenu() }} className="btn btn-outline btn-sm">{t('nav.logout')}</button>
            </>
          ) : (
            <>
              <NavLink to="/login">{t('nav.login')}</NavLink>
              <NavLink to="/register" className="btn btn-primary btn-sm">{t('nav.signUp')}</NavLink>
            </>
          )}
          <LanguageSwitcher />
        </div>

        {menuOpen && <div className="nav-overlay" onClick={closeMenu} />}
      </div>
    </nav>
  )
}
