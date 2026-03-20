import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { TransportRoute } from '../types'
import { useAuth } from '../context/AuthContext'
import { isInstantBooking } from '../utils/booking'
import SEO from '../components/SEO'

interface TaxiQuote {
  origin: string
  destination: string
  distance_miles: number
  driving_hours: number | null
  rate_per_mile: number
  total_price: number
}

function TaxiCalculator() {
  const { user } = useAuth()
  const isStaff = user?.role === 'admin' || user?.role === 'employee'
  const [locations, setLocations] = useState<string[]>([])
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [quote, setQuote] = useState<TaxiQuote | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getTaxiLocations().then(setLocations)
  }, [])

  const handleQuote = async () => {
    if (!origin || !destination) return
    setLoading(true)
    setError('')
    setQuote(null)
    try {
      const q = await api.getTaxiQuote(origin, destination)
      setQuote(q)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const WHATSAPP = '17204537336'

  return (
    <div className="taxi-calculator">
      <div className="taxi-form">
        <h2 className="section-title-left">Private Taxi Quote</h2>
        <p className="taxi-desc">Get an instant price estimate for a private car between any two destinations in Vietnam.</p>

        <div className="taxi-inputs">
          <label>
            From
            <select value={origin} onChange={e => setOrigin(e.target.value)}>
              <option value="">Select origin</option>
              {locations.filter(l => l !== destination).map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </label>

          <button
            className="taxi-swap"
            onClick={() => { setOrigin(destination); setDestination(origin); setQuote(null) }}
            disabled={!origin && !destination}
            aria-label="Swap"
          >
            ⇄
          </button>

          <label>
            To
            <select value={destination} onChange={e => setDestination(e.target.value)}>
              <option value="">Select destination</option>
              {locations.filter(l => l !== origin).map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </label>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleQuote}
          disabled={loading || !origin || !destination}
          style={{ marginTop: '1rem' }}
        >
          {loading ? 'Calculating...' : 'Get Quote'}
        </button>

        {error && <div className="error-message" style={{ marginTop: '1rem' }}>{error}</div>}
      </div>

      {quote && (
        <div className="taxi-result">
          <div className="taxi-route-header">
            <h3>{quote.origin} → {quote.destination}</h3>
          </div>
          <div className="taxi-details">
            <div className="taxi-detail">
              <span className="taxi-detail-label">Distance</span>
              <span className="taxi-detail-value">{quote.distance_miles} miles</span>
            </div>
            <div className="taxi-detail">
              <span className="taxi-detail-label">Est. Drive Time</span>
              <span className="taxi-detail-value">{quote.driving_hours ? `${quote.driving_hours} hours` : 'N/A'}</span>
            </div>
            {isStaff && (
              <div className="taxi-detail">
                <span className="taxi-detail-label">Rate</span>
                <span className="taxi-detail-value">${quote.rate_per_mile.toFixed(2)}/mile</span>
              </div>
            )}
          </div>
          <div className="taxi-total">
            <span>Estimated Total</span>
            <span className="taxi-total-price">${quote.total_price.toFixed(2)}</span>
          </div>
          <p className="taxi-note">Price is for a private car (up to 4 passengers). Contact us to book.</p>
          <a
            href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hi! I'd like to book a private taxi from ${quote.origin} to ${quote.destination}.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-block"
          >
            Book via WhatsApp
          </a>
        </div>
      )}
    </div>
  )
}

export default function Transport() {
  const [tab, setTab] = useState<'routes' | 'taxi'>('routes')
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
      const res: any = await api.createTransportBooking(selectedRoute.id, travelDate, 1, comments, pickup)
      navigate('/booking-confirmed')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const included = selectedRoute?.included ? JSON.parse(selectedRoute.included) : []

  return (
    <div>
      <SEO title="Transportation" description="Comfortable transfers between Vietnam's top destinations. Hanoi to Ha Giang, Sapa, Ninh Binh and back." url="https://travelvntours.com/transport" />
      <section className="hero hero-sm">
        <div className="hero-content">
          <h1>{t('transport.heroTitle')}</h1>
          <p>{t('transport.heroSubtitle')}</p>
        </div>
      </section>

      <div className="container">
        <div className="transport-tabs">
          <button
            className={`transport-tab ${tab === 'routes' ? 'transport-tab-active' : ''}`}
            onClick={() => setTab('routes')}
          >
            Scheduled Routes
          </button>
          <button
            className={`transport-tab ${tab === 'taxi' ? 'transport-tab-active' : ''}`}
            onClick={() => setTab('taxi')}
          >
            Private Taxi
          </button>
        </div>

        {tab === 'taxi' ? (
          <TaxiCalculator />
        ) : loading ? (
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
                    <span className="price-unit">{selectedRoute.vehicle_type === 'Private Car' ? '/ up to 4 guests' : '/ person'}</span>
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

                      {selectedRoute.vehicle_type === 'Private Car' && (
                        <label>
                          {t('transport.pickup')}
                          <input
                            type="text"
                            value={pickup}
                            onChange={e => setPickup(e.target.value)}
                            placeholder={t('transport.pickupPlaceholder')}
                          />
                        </label>
                      )}

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
                        <span className="total-amount">${selectedRoute.price.toFixed(2)}</span>
                      </div>

                      {error && <div className="error-message">{error}</div>}

                      <button
                        className="btn btn-primary btn-block"
                        onClick={handleBook}
                        disabled={submitting}
                      >
                        {submitting
                          ? t('tour.booking')
                          : !user
                          ? t('tour.loginToBook')
                          : isInstantBooking(travelDate)
                          ? t('tour.bookNow')
                          : t('tour.submitRequest')}
                      </button>
                      <p className="booking-note">
                        {isInstantBooking(travelDate) ? t('tour.instantNote') : t('tour.bookingNote')}
                      </p>
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
