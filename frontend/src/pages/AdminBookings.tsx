import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { Booking } from '../types'

interface Stats {
  total_customers: number
  total_bookings: number
  pending_bookings: number
  approved_bookings: number
  confirmed_bookings: number
  confirmed_revenue: number
  pending_revenue: number
  upcoming_tours: number
  popular_tours: { name: string; bookings: number }[]
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'status-pending',
  approved: 'status-approved',
  confirmed: 'status-confirmed',
  rejected: 'status-rejected',
  cancelled: 'status-cancelled',
}

const FILTER_OPTIONS = ['all', 'pending', 'approved', 'confirmed', 'rejected', 'cancelled']

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [actionNotes, setActionNotes] = useState<Record<number, string>>({})
  const { t } = useTranslation()

  const fetchBookings = () => {
    setLoading(true)
    api.getAdminBookings(filter === 'all' ? undefined : filter)
      .then((data: any) => setBookings(data))
      .finally(() => setLoading(false))
  }

  const fetchStats = () => {
    api.getAdminStats().then((data: any) => setStats(data))
  }

  useEffect(() => { fetchStats() }, [])
  useEffect(() => { fetchBookings() }, [filter])

  const handleApprove = async (id: number) => {
    await api.approveBooking(id, actionNotes[id] || '')
    fetchBookings()
    fetchStats()
  }

  const handleReject = async (id: number) => {
    await api.rejectBooking(id, actionNotes[id] || '')
    fetchBookings()
    fetchStats()
  }

  return (
    <div className="container">
      <h1 className="page-title">{t('admin.title')}</h1>

      {stats && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">${stats.confirmed_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div className="stat-label">{t('admin.stats.confirmedRevenue')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">${stats.pending_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div className="stat-label">{t('admin.stats.pendingRevenue')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.pending_bookings}</div>
              <div className="stat-label">{t('admin.stats.pendingBookings')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.upcoming_tours}</div>
              <div className="stat-label">{t('admin.stats.upcomingTours')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.total_customers}</div>
              <div className="stat-label">{t('admin.stats.customers')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.confirmed_bookings}</div>
              <div className="stat-label">{t('admin.stats.confirmed')}</div>
            </div>
          </div>

          {stats.popular_tours.length > 0 && (
            <div className="popular-tours-card">
              <h3>{t('admin.stats.popularTours')}</h3>
              <div className="popular-tours-list">
                {stats.popular_tours.map((tour, i) => (
                  <div key={i} className="popular-tour-item">
                    <span className="popular-tour-rank">#{i + 1}</span>
                    <span className="popular-tour-name">{tour.name}</span>
                    <span className="popular-tour-count">{tour.bookings} {t('admin.stats.bookingsLabel')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <h2 className="admin-section-title">{t('admin.bookingsSection')}</h2>

      <div className="admin-filters">
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt}
            className={`btn btn-sm ${filter === opt ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter(opt)}
          >
            {t(`admin.filter.${opt}`)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">{t('tour.loading')}</div>
      ) : bookings.length === 0 ? (
        <div className="empty-state">
          <h2>{t('admin.noBookings')}</h2>
        </div>
      ) : (
        <div className="bookings-list">
          {bookings.map(booking => (
            <div key={booking.id} className="booking-item admin-booking-item">
              <div className="booking-item-info">
                <h3>{booking.tour?.name || `Tour #${booking.tour_id}`}</h3>
                <div className="booking-item-details">
                  <span>{t('admin.customer')}: {booking.user?.name} ({booking.user?.email})</span>
                </div>
                <div className="booking-item-details">
                  <span>{t('bookings.date', { date: booking.start_date })}</span>
                  <span>{t('bookings.guests', { count: booking.num_guests })}</span>
                  <span>{t('bookings.total', { amount: booking.total_price.toFixed(2) })}</span>
                </div>
                <span className={`status-badge ${STATUS_STYLES[booking.status] || ''}`}>
                  {t(`bookings.status.${booking.status}`)}
                </span>
                {booking.comments && (
                  <div className="admin-comments">
                    <strong>{t('admin.customerComments')}:</strong> {booking.comments}
                  </div>
                )}
                {booking.admin_notes && (
                  <div className="admin-notes-display">
                    <strong>{t('bookings.adminNotes')}:</strong> {booking.admin_notes}
                  </div>
                )}
              </div>
              {booking.status === 'pending' && (
                <div className="admin-actions">
                  <input
                    type="text"
                    placeholder={t('admin.notesPlaceholder')}
                    value={actionNotes[booking.id] || ''}
                    onChange={e => setActionNotes({ ...actionNotes, [booking.id]: e.target.value })}
                    className="admin-notes-input"
                  />
                  <div className="admin-action-buttons">
                    <button onClick={() => handleApprove(booking.id)} className="btn btn-primary btn-sm">
                      {t('admin.approve')}
                    </button>
                    <button onClick={() => handleReject(booking.id)} className="btn btn-danger btn-sm">
                      {t('admin.reject')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
