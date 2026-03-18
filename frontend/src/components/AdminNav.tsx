import { NavLink } from 'react-router-dom'

const links = [
  { to: '/admin/bookings', label: 'Bookings' },
  { to: '/admin/upcoming', label: 'Upcoming' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/images', label: 'Photos' },
  { to: '/admin/pricing', label: 'Pricing' },
]

export default function AdminNav() {
  return (
    <div className="admin-nav">
      {links.map(link => (
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
