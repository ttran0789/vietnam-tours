import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/admin/bookings', label: 'Bookings' },
  { to: '/admin/upcoming', label: 'Upcoming' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/images', label: 'Photos' },
  { to: '/admin/pricing', label: 'Pricing', superOnly: true },
  { to: '/admin/chat', label: 'Chat' },
]

export default function AdminNav() {
  const { user } = useAuth()

  return (
    <div className="admin-nav">
      {links
        .filter(link => !link.superOnly || user?.role === 'admin')
        .map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `admin-nav-link ${isActive ? 'admin-nav-active' : ''}`}
          >
            {link.label}
          </NavLink>
        ))}
    </div>
  )
}
