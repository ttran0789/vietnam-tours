import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { TransportRoute } from '../types'
import { useAuth } from '../context/AuthContext'

export default function Transport() {
  const [routes, setRoutes] = useState<TransportRoute[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRoute, setSelectedRoute] = useState<TransportRoute | null>(null)
  const [travelDate, setTravelDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 3)
    return d.toISOString().split('T')[0]
  })
  const [numPassengers, setNumPassengers] = useState(1)
  const [comments, setComments] = useState('')
  const [pickup, setPickup] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const { user } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  useEffect(() => {
    api.getTransportRoutes()
      .then((data: any) => setRoutes(data))
      .finally(() => setLoading(false))
  }, [])

  const handleBook = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    if (!selectedRoute || !travelDate) return
    setSubmitting(true)
    setError('')
    try {
      const res: any = await api.createTransportBooking(selectedRoute.id, travelDate, numPassengers, comments, pickup)
      if (res.status === 'approved') {
        navigate(`/payment/${res.id}?type=transport`)
      } else {
        setSuccess(true)
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const included = selectedRoute?.included ? JSON.parse(selectedRoute.included) : []

  return (
    <div>
      <section className="hero hero-sm">
        <div className="hero-content">
          <h1>{t('transport.heroTitle')}</h1>
          <p>{t('transport.heroSubtitle')}</p>
        </div>
      </section>

      <div className="container">
        {loading ? (
          <div className="loading">{t('tour.loading')}</div>
        ) : (
          <div className="transport-layout">
            <div className="transport-routes">
              <h2 className="section-title-left">{t('transport.routes')}</h2>
              <div className="route-list">
                {routes.map(route => (
                  <button
                    key={route.id}
                    className={`route-card ${selectedRoute?.id === route.id ? 'route-card-active' : ''}`}
                    onClick={() => { setSelectedRoute(route); setSuccess(false) }}
                  >
                    <div className="route-card-header">
                      <span className="route-origin">{route.origin}</span>
                      <span className="route-arrow">→</span>
                      <span className="route-destination">{route.destination}</span>
                    </div>
                    <div className="route-card-details">
                      <span className="route-vehicle">{route.vehicle_type}</span>
                      <span className="route-duration">{route.duration}</span>
                      <span className="route-price">${route.price}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <aside className="transport-sidebar">
              {selectedRoute ? (
                <div className="booking-card">
                  <div className="route-selected-header">
                    <h3>{selectedRoute.origin} → {selectedRoute.destination}</h3>
                    <div className="route-selected-meta">
                      <span>{selectedRoute.vehicle_type}</span>
                      <span>{selectedRoute.duration}</span>
                    </div>
                  </div>

                  <p className="route-description">{selectedRoute.description}</p>

                  {included.length > 0 && (
                    <div className="route-included">
                      <h4>{t('tour.included')}</h4>
                      <ul className="include-list included">
                        {included.map((item: string, i: number) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="booking-price">
                    <span className="price-amount">${selectedRoute.price}</span>
                    <span className="price-unit">{t('transport.perPerson')}</span>
                  </div>

                  {success ? (
                    <div className="booking-success">
                      <h3>{t('tour.bookingSubmitted')}</h3>
                      <p>{t('tour.bookingSubmittedDesc')}</p>
                      <button className="btn btn-primary btn-block" onClick={() => navigate('/my-bookings')}>
                        {t('bookings.title')}
                      </button>
                    </div>
                  ) : (
                    <div className="booking-form">
                      <label>
                        {t('transport.travelDate')}
                        <input
                          type="date"
                          value={travelDate}
                          onChange={e => setTravelDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </label>

                      <label>
                        {t('transport.passengers')}
                        <select value={numPassengers} onChange={e => setNumPassengers(Number(e.target.value))}>
                          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      </label>

                      <label>
                        {t('transport.pickup')}
                        <input
                          type="text"
                          value={pickup}
                          onChange={e => setPickup(e.target.value)}
                          placeholder={t('transport.pickupPlaceholder')}
                        />
                      </label>

                      <label>
                        {t('tour.comments')}
                        <textarea
                          value={comments}
                          onChange={e => setComments(e.target.value)}
                          placeholder={t('transport.commentsPlaceholder')}
                          rows={2}
                        />
                      </label>

                      <div className="booking-total">
                        <span>{t('tour.total')}</span>
                        <span className="total-amount">${(selectedRoute.price * numPassengers).toFixed(2)}</span>
                      </div>

                      {error && <div className="error-message">{error}</div>}

                      <button
                        className="btn btn-primary btn-block"
                        onClick={handleBook}
                        disabled={submitting}
                      >
                        {submitting ? t('tour.booking') : user ? t('transport.bookTransport') : t('tour.loginToBook')}
                      </button>
                      <p className="booking-note">{t('tour.bookingNote')}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="booking-card transport-placeholder">
                  <p>{t('transport.selectRoute')}</p>
                </div>
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}
