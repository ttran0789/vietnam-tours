import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { Booking, TransportBooking } from '../types'

const STATUS_STYLES: Record<string, string> = {
  pending: 'status-pending',
  approved: 'status-approved',
  confirmed: 'status-confirmed',
  rejected: 'status-rejected',
  cancelled: 'status-cancelled',
}

export default function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [transportBookings, setTransportBookings] = useState<TransportBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'tours' | 'transport'>('tours')
  const { t } = useTranslation()

  const fetchAll = () => {
    Promise.all([
      api.getBookings().then((data: any) => setBookings(data)),
      api.getTransportBookings().then((data: any) => setTransportBookings(data)),
    ]).finally(() => setLoading(false))
  }

  useEffect(() => { fetchAll() }, [])

  const handleCancelTour = async (id: number) => {
    if (!confirm(t('bookings.cancelConfirm'))) return
    await api.cancelBooking(id)
    fetchAll()
  }

  const handleCancelTransport = async (id: number) => {
    if (!confirm(t('bookings.cancelConfirm'))) return
    await api.cancelTransportBooking(id)
    fetchAll()
  }

  if (loading) return <div className="loading">{t('tour.loading')}</div>

  const isEmpty = bookings.length === 0 && transportBookings.length === 0

  return (
    <div className="container">
      <h1 className="page-title">{t('bookings.title')}</h1>

      {isEmpty ? (
        <div className="empty-state">
          <h2>{t('bookings.noBookings')}</h2>
          <p>{t('bookings.noBookingsDesc')}</p>
          <Link to="/" className="btn btn-primary">{t('bookings.exploreTours')}</Link>
        </div>
      ) : (
        <>
          <div className="bookings-tabs">
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

          {tab === 'tours' && (
            bookings.length === 0 ? (
              <div className="empty-state">
                <p>{t('bookings.noTourBookings')}</p>
              </div>
            ) : (
              <div className="bookings-list">
                {bookings.map(booking => (
                  <div key={booking.id} className="booking-item">
                    <div className="booking-item-info">
                      <h3>{booking.tour?.name || `Tour #${booking.tour_id}`}</h3>
                      <div className="booking-item-details">
                        <span>{t('bookings.date', { date: booking.start_date })}</span>
                        <span>{t('bookings.guests', { count: booking.num_guests })}</span>
                        <span>{t('bookings.total', { amount: booking.total_price.toFixed(2) })}</span>
                      </div>
                      <span className={`status-badge ${STATUS_STYLES[booking.status] || ''}`}>
                        {t(`bookings.status.${booking.status}`)}
                      </span>
                      {booking.comments && (
                        <p className="booking-comments">{t('bookings.yourComments')}: {booking.comments}</p>
                      )}
                      {booking.admin_notes && (
                        <p className="booking-admin-notes">{t('bookings.adminNotes')}: {booking.admin_notes}</p>
                      )}
                    </div>
                    <div className="booking-item-actions">
                      {booking.status === 'approved' && (
                        <Link to={`/payment/${booking.id}`} className="btn btn-primary btn-sm">
                          {t('bookings.payNow')}
                        </Link>
                      )}
                      {(booking.status === 'pending' || booking.status === 'approved') && (
                        <button onClick={() => handleCancelTour(booking.id)} className="btn btn-outline btn-sm">
                          {t('bookings.cancel')}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {tab === 'transport' && (
            transportBookings.length === 0 ? (
              <div className="empty-state">
                <p>{t('bookings.noTransportBookings')}</p>
              </div>
            ) : (
              <div className="bookings-list">
                {transportBookings.map(tb => (
                  <div key={tb.id} className="booking-item">
                    <div className="booking-item-info">
                      <h3>{tb.route ? `${tb.route.origin} → ${tb.route.destination}` : `Route #${tb.route_id}`}</h3>
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
                        <p className="booking-comments">{t('bookings.yourComments')}: {tb.comments}</p>
                      )}
                      {tb.admin_notes && (
                        <p className="booking-admin-notes">{t('bookings.adminNotes')}: {tb.admin_notes}</p>
                      )}
                    </div>
                    <div className="booking-item-actions">
                      {(tb.status === 'pending' || tb.status === 'approved') && (
                        <button onClick={() => handleCancelTransport(tb.id)} className="btn btn-outline btn-sm">
                          {t('bookings.cancel')}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </>
      )}
    </div>
  )
}
