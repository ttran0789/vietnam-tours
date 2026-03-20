import { useState, useEffect } from 'react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import SEO from '../components/SEO'
import AdminNav from '../components/AdminNav'

interface AdminUser {
  id: number
  email: string
  name: string
  phone: string
  whatsapp: string
  zalo: string
  nationality: string
  is_admin: boolean
  role: string
  created_at: string | null
  tour_bookings: number
  transport_bookings: number
}

export default function AdminUsers() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const isSuperAdmin = currentUser?.role === 'admin'

  useEffect(() => {
    api.getAdminUsers().then((data: any) => setUsers(data)).finally(() => setLoading(false))
  }, [])

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await api.updateUserRole(userId, newRole)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
    } catch (err: any) {
      alert(err.message || 'Failed to update role')
    }
  }

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.nationality.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div className="container">
      <AdminNav />
      <SEO title="Users" />
      <h1 className="page-title">Users ({users.length})</h1>

      <input
        type="text"
        placeholder="Search by name, email, or nationality..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="admin-search"
      />

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>WhatsApp</th>
              <th>Nationality</th>
              {isSuperAdmin && <th>Role</th>}
              <th>Bookings</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(user => (
              <tr key={user.id}>
                <td>
                  <strong>{user.name}</strong>
                  {!isSuperAdmin && user.role === 'admin' && <span className="stock-badge" style={{ marginLeft: 6 }}>Admin</span>}
                  {!isSuperAdmin && user.role === 'employee' && <span className="stock-badge" style={{ marginLeft: 6, background: '#2196F3' }}>Employee</span>}
                </td>
                <td>{user.email}</td>
                <td>{user.phone || '-'}</td>
                <td>{user.whatsapp || '-'}</td>
                <td>{user.nationality || '-'}</td>
                {isSuperAdmin && (
                  <td>
                    <select
                      value={user.role}
                      onChange={e => handleRoleChange(user.id, e.target.value)}
                      style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #ccc' }}
                    >
                      <option value="user">User</option>
                      <option value="employee">Employee</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                )}
                <td>{user.tour_bookings + user.transport_bookings}</td>
                <td>{user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
