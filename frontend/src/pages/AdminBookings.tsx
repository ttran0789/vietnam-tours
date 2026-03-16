import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { Booking, TransportBooking } from '../types'

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
  const [transportBookings, setTransportBookings] = useState<TransportBooking[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [tab, setTab] = useState<'tours' | 'transport'>('tours')
  const [actionNotes, setActionNotes] = useState<Record<string, string>>({})
  const { t } = useTranslation()

  const fetchBookings = () => {
    setLoading(true)
    const statusFilter = filter === 'all' ? undefined : filter
    Promise.all([
      api.getAdminBookings(statusFilter).then((data: any) => setBookings(data)),
      api.getAdminTransportBookings(statusFilter).then((data: any) => setTransportBookings(data)),
    ]).finally(() => setLoading(false))
  }

  const fetchStats = () => {
    api.getAdminStats().then((data: any) => setStats(data))
  }

  useEffect(() => { fetchStats() }, [])
  useEffect(() => { fetchBookings() }, [filter])

  const handleApproveTour = async (id: number) => {
    await api.approveBooking(id, actionNotes[`tour-${id}`] || '')
    fetchBookings()
    fetchStats()
  }

  const handleRejectTour = async (id: number) => {
    await api.rejectBooking(id, actionNotes[`tour-${id}`] || '')
    fetchBookings()
    fetchStats()
  }

  const handleApproveTransport = async (id: number) => {
    await api.approveTransportBooking(id, actionNotes[`transport-${id}`] || '')
    fetchBookings()
    fetchStats()
  }

  const handleRejectTransport = async (id: number) => {
    await api.rejectTransportBooking(id, actionNotes[`transport-${id}`] || '')
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

      <div className="bookings-tabs" style={{ marginBottom: '0.75rem' }}>
        <button
          className={`btn btn-sm ${tab === 'tours' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setTab('tours')}
        >
          {t('nav.tours')} ({bookings.length})
        </button>
        <button
          className={`btn btn-sm ${tab === 'transport' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setTab('transport')}
        >
          {t('nav.transport')} ({transportBookings.length})
        </button>
      </div>

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
      ) : tab === 'tours' ? (
        bookings.length === 0 ? (
          <div className="empty-state"><h2>{t('admin.noBookings')}</h2></div>
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
                      value={actionNotes[`tour-${booking.id}`] || ''}
                      onChange={e => setActionNotes({ ...actionNotes, [`tour-${booking.id}`]: e.target.value })}
                      className="admin-notes-input"
                    />
                    <div className="admin-action-buttons">
                      <button onClick={() => handleApproveTour(booking.id)} className="btn btn-primary btn-sm">
                        {t('admin.approve')}
                      </button>
                      <button onClick={() => handleRejectTour(booking.id)} className="btn btn-danger btn-sm">
                        {t('admin.reject')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        transportBookings.length === 0 ? (
          <div className="empty-state"><h2>{t('admin.noBookings')}</h2></div>
        ) : (
          <div className="bookings-list">
            {transportBookings.map(tb => (
              <div key={tb.id} className="booking-item admin-booking-item">
                <div className="booking-item-info">
                  <h3>{tb.route ? `${tb.route.origin} → ${tb.route.destination}` : `Route #${tb.route_id}`}</h3>
                  <div className="booking-item-details">
                    <span>{t('admin.customer')}: {tb.user?.name} ({tb.user?.email})</span>
                  </div>
                  <div className="booking-item-details">
                    <span>{t('bookings.date', { date: tb.travel_date })}</span>
                    <span>{t('transport.passengersCount', { count: tb.num_passengers })}</span>
                    <span>{t('bookings.total', { amount: tb.total_price.toFixed(2) })}</span>
                  </div>
                  {tb.pickup_location && (
                    <div className="booking-item-details">
                      <span>{t('transport.pickup')}: {tb.pickup_location}</span>
                    </div>
                  )}
                  <span className={`status-badge ${STATUS_STYLES[tb.status] || ''}`}>
                    {t(`bookings.status.${tb.status}`)}
                  </span>
                  {tb.comments && (
                    <div className="admin-comments">
                      <strong>{t('admin.customerComments')}:</strong> {tb.comments}
                    </div>
                  )}
                  {tb.admin_notes && (
                    <div className="admin-notes-display">
                      <strong>{t('bookings.adminNotes')}:</strong> {tb.admin_notes}
                    </div>
                  )}
                </div>
                {tb.status === 'pending' && (
                  <div className="admin-actions">
                    <input
                      type="text"
                      placeholder={t('admin.notesPlaceholder')}
                      value={actionNotes[`transport-${tb.id}`] || ''}
                      onChange={e => setActionNotes({ ...actionNotes, [`transport-${tb.id}`]: e.target.value })}
                      className="admin-notes-input"
                    />
                    <div className="admin-action-buttons">
                      <button onClick={() => handleApproveTransport(tb.id)} className="btn btn-primary btn-sm">
                        {t('admin.approve')}
                      </button>
                      <button onClick={() => handleRejectTransport(tb.id)} className="btn btn-danger btn-sm">
                        {t('admin.reject')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
