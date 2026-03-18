import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { Tour, Review, TransportRoute } from '../types'
import { useAuth } from '../context/AuthContext'
import ReviewCard from '../components/ReviewCard'
import PhotoGallery from '../components/PhotoGallery'
import { TOUR_IMAGES, TOUR_HERO_IMAGES } from '../data/tourImages'
import { isInstantBooking } from '../utils/booking'
import SEO from '../components/SEO'

export default function TourDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [tour, setTour] = useState<Tour | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d.toISOString().split('T')[0]
  })
  const [numGuests, setNumGuests] = useState(1)
  const [comments, setComments] = useState('')
  const [booking, setBooking] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<{ url: string; caption: string }[]>([])
  const [disabledStock, setDisabledStock] = useState<string[]>([])
  const [coverUrl, setCoverUrl] = useState('')
  const [transportRoutes, setTransportRoutes] = useState<TransportRoute[]>([])
  const [rideType, setRideType] = useState('self')
  const [transportTo, setTransportTo] = useState('')
  const [transportFrom, setTransportFrom] = useState('')
  const [pickup, setPickup] = useState('')

  useEffect(() => {
    if (slug) {
      api.getTour(slug)
        .then((data: any) => {
          setTour(data)
          api.getReviews(data.id).then((r: any) => setReviews(r))
          api.getTransportRoutes().then((routes: any) => {
            // Filter routes relevant to this tour's location
            const location = data.location?.toLowerCase() || ''
            const relevant = routes.filter((r: TransportRoute) =>
              r.destination.toLowerCase().includes(location.split(',')[0].trim().toLowerCase()) ||
              r.origin.toLowerCase().includes(location.split(',')[0].trim().toLowerCase())
            )
            setTransportRoutes(relevant.length > 0 ? relevant : routes)
          })
          api.getTourImages(data.slug).then((result: any) => {
            setUploadedImages(result.uploaded || [])
            setDisabledStock(result.disabled_stock || [])
            setCoverUrl(result.cover || '')
          })
        })
        .finally(() => setLoading(false))
    }
  }, [slug])

  const handleBook = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    if (!startDate) {
      setError(t('tour.selectDate'))
      return
    }
    setBooking(true)
    setError('')
    try {
      const transportParts = []
      if (transportTo) transportParts.push(`To: ${transportTo}`)
      if (transportFrom) transportParts.push(`Return: ${transportFrom}`)
      const transportComment = transportParts.length > 0 ? `\n[Transport: ${transportParts.join(', ')}]` : ''
      const fullComments = comments + transportComment

      const res: any = await api.createBooking(tour!.id, startDate, numGuests, fullComments, rideType)

      // Create transport bookings if selected
      for (const selected of [transportTo, transportFrom]) {
        if (selected) {
          const route = transportRoutes.find(r => `${r.origin} → ${r.destination} (${r.vehicle_type})` === selected)
          if (route) {
            const passengers = route.vehicle_type === 'Private Car' ? 1 : numGuests
            await api.createTransportBooking(route.id, startDate, passengers, `Bundled with tour: ${tour!.name}`, pickup)
          }
        }
      }

      if (res.status === 'approved') {
        navigate(`/payment/${res.id}`)
      } else {
        navigate('/booking-confirmed')
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBooking(false)
    }
  }

  if (loading) return <div className="loading">{t('tour.loading')}</div>
  if (!tour) return <div className="container"><h2>{t('tour.notFound')}</h2></div>

  const highlights = tour.highlights ? JSON.parse(tour.highlights) : []
  const itinerary = tour.itinerary ? JSON.parse(tour.itinerary) : []
  const included = tour.included ? JSON.parse(tour.included) : []
  const notIncluded = tour.not_included ? JSON.parse(tour.not_included) : []
  // Combine uploaded images + enabled stock images
  const uploadedGallery = uploadedImages.map((img: any) => ({ url: img.url, caption: img.caption || '' }))
  const stockGallery = (TOUR_IMAGES[tour.slug] || []).filter(img => !disabledStock.includes(img.url))
  const galleryImages = [...uploadedGallery, ...stockGallery]
  const heroImage = coverUrl
    || (uploadedImages.length > 0 ? uploadedImages[0].url : null)
    || (stockGallery.length > 0 ? stockGallery[0].url : null)
    || TOUR_HERO_IMAGES[tour.slug]

  return (
    <div>
      <SEO title={tour.name} description={tour.description} image={heroImage} url={`https://travelvntours.com/tours/${tour.slug}`} />
      {heroImage && (
        <div className="tour-hero">
          <img src={heroImage} alt={tour.name} />
          <div className="tour-hero-overlay">
            <h1>{tour.name}</h1>
            <div className="tour-hero-meta">
              <span>{tour.location}</span>
              <span>{tour.duration}</span>
              <span>{tour.difficulty}</span>
            </div>
          </div>
        </div>
      )}

      <div className="container">
        <div className="tour-detail">
          <div className="tour-detail-main">
            {!heroImage && (
              <div className="tour-detail-header">
                <span className="tour-card-location">{tour.location}</span>
                <h1>{tour.name}</h1>
                <div className="tour-meta">
                  <span>{tour.duration}</span>
                  <span>{tour.difficulty}</span>
                  <span>{t('tour.maxPeople', { count: tour.max_group_size })}</span>
                </div>
              </div>
            )}

            <p className="tour-description">{tour.description}</p>

            {galleryImages.length > 0 && (
              <div className="tour-section">
                <h2>{t('tour.photos')}</h2>
                <PhotoGallery images={galleryImages} />
              </div>
            )}

            {highlights.length > 0 && (
              <div className="tour-section">
                <h2>{t('tour.highlights')}</h2>
                <ul className="highlight-list">
                  {highlights.map((h: string, i: number) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>
            )}

            {itinerary.length > 0 && (
              <div className="tour-section">
                <h2>{t('tour.itinerary')}</h2>
                <div className="itinerary">
                  {itinerary.map((day: any) => (
                    <div key={day.day} className="itinerary-day">
                      <div className="itinerary-day-header">
                        <span className="day-number">{t('tour.day', { number: day.day })}</span>
                        <h3>{day.title}</h3>
                      </div>
                      <p>{day.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="tour-includes-grid">
              {included.length > 0 && (
                <div className="tour-section">
                  <h2>{t('tour.included')}</h2>
                  <ul className="include-list included">
                    {included.map((item: string, i: number) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {notIncluded.length > 0 && (
                <div className="tour-section">
                  <h2>{t('tour.notIncluded')}</h2>
                  <ul className="include-list not-included">
                    {notIncluded.map((item: string, i: number) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {reviews.length > 0 && (
              <div className="tour-section">
                <h2>{t('reviews.title')} ({reviews.length})</h2>
                <div className="tour-reviews">
                  {reviews.map(review => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="tour-detail-sidebar">
            <div className="booking-card">
              <div className="booking-price">
                <span className="price-amount">${tour.price}</span>
                <span className="price-unit">{t('tour.perPerson')}</span>
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
                    {t('tour.startDate')}
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </label>

                  <label>
                    {t('tour.numGuests')}
                    <select value={numGuests} onChange={e => setNumGuests(Number(e.target.value))}>
                      {Array.from({ length: tour.max_group_size }, (_, i) => i + 1).map(n => (
                        <option key={n} value={n}>
                          {n === 1 ? t('tour.guest', { count: n }) : t('tour.guests', { count: n })}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="ride-type-selector">
                    <label>{t('tour.rideType')}</label>
                    <div className="ride-type-options">
                      <button
                        type="button"
                        className={`ride-type-btn ${rideType === 'self' ? 'ride-type-active' : ''}`}
                        onClick={() => setRideType('self')}
                      >
                        <strong>{t('tour.selfRide')}</strong>
                        <span>${tour.price}/person</span>
                      </button>
                      <button
                        type="button"
                        className={`ride-type-btn ${rideType === 'easy_rider' ? 'ride-type-active' : ''}`}
                        onClick={() => setRideType('easy_rider')}
                      >
                        <strong>{t('tour.easyRider')}</strong>
                        <span>${(tour.price * 1.2).toFixed(0)}/person</span>
                      </button>
                    </div>
                    {rideType === 'easy_rider' && (
                      <p className="ride-type-note">{t('tour.easyRiderDesc')}</p>
                    )}
                  </div>

                  {transportRoutes.length > 0 && (() => {
                    const location = tour.location?.split(',')[0].trim().toLowerCase() || ''
                    const toRoutes = transportRoutes.filter(r => r.destination.toLowerCase().includes(location))
                    const fromRoutes = transportRoutes.filter(r => r.origin.toLowerCase().includes(location))
                    const needsPickup = (transportTo + transportFrom).includes('Private Car')

                    return (
                      <div className="transport-addon">
                        <label className="transport-addon-title">{t('tour.addTransport')}</label>
                        {toRoutes.length > 0 && (
                          <label>
                            {t('tour.transportTo')}
                            <select value={transportTo} onChange={e => setTransportTo(e.target.value)}>
                              <option value="">{t('tour.noTransport')}</option>
                              {toRoutes.map(r => (
                                <option key={r.id} value={`${r.origin} → ${r.destination} (${r.vehicle_type})`}>
                                  {r.origin} → {r.destination} — {r.vehicle_type} (${r.price}{r.vehicle_type === 'Private Car' ? '/car' : '/person'})
                                </option>
                              ))}
                            </select>
                          </label>
                        )}
                        {fromRoutes.length > 0 && (
                          <label>
                            {t('tour.transportFrom')}
                            <select value={transportFrom} onChange={e => setTransportFrom(e.target.value)}>
                              <option value="">{t('tour.noTransport')}</option>
                              {fromRoutes.map(r => (
                                <option key={r.id} value={`${r.origin} → ${r.destination} (${r.vehicle_type})`}>
                                  {r.origin} → {r.destination} — {r.vehicle_type} (${r.price}{r.vehicle_type === 'Private Car' ? '/car' : '/person'})
                                </option>
                              ))}
                            </select>
                          </label>
                        )}
                        {needsPickup && (
                          <label>
                            {t('transport.pickup')}
                            <input type="text" value={pickup} onChange={e => setPickup(e.target.value)} placeholder={t('transport.pickupPlaceholder')} />
                          </label>
                        )}
                      </div>
                    )
                  })()}

                  <label>
                    {t('tour.comments')}
                    <textarea
                      value={comments}
                      onChange={e => setComments(e.target.value)}
                      placeholder={t('tour.commentsPlaceholder')}
                      rows={3}
                    />
                  </label>

                  {(() => {
                    const getTransportCost = (selected: string) => {
                      const route = transportRoutes.find(r => `${r.origin} → ${r.destination} (${r.vehicle_type})` === selected)
                      if (!route) return 0
                      return route.vehicle_type === 'Private Car' ? route.price : route.price * numGuests
                    }
                    const toCost = getTransportCost(transportTo)
                    const fromCost = getTransportCost(transportFrom)
                    const transportCost = toCost + fromCost
                    const pricePerPerson = rideType === 'easy_rider' ? tour.price * 1.2 : tour.price
                    const tourTotal = pricePerPerson * numGuests
                    return (
                      <div className="booking-total-section">
                        <div className="booking-total-line">
                          <span>{t('nav.tours')}{rideType === 'easy_rider' ? ' (Easy Rider)' : ''}</span>
                          <span>${tourTotal.toFixed(2)}</span>
                        </div>
                        {toCost > 0 && (
                          <div className="booking-total-line">
                            <span>{transportTo.split('(')[0].trim()}</span>
                            <span>${toCost.toFixed(2)}</span>
                          </div>
                        )}
                        {fromCost > 0 && (
                          <div className="booking-total-line">
                            <span>{transportFrom.split('(')[0].trim()}</span>
                            <span>${fromCost.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="booking-total">
                          <span>{t('tour.total')}</span>
                          <span className="total-amount">${(tourTotal + transportCost).toFixed(2)}</span>
                        </div>
                      </div>
                    )
                  })()}

                  {error && <div className="error-message">{error}</div>}

                  <button
                    className="btn btn-primary btn-block"
                    onClick={handleBook}
                    disabled={booking}
                  >
                    {booking
                    ? t('tour.booking')
                    : !user
                    ? t('tour.loginToBook')
                    : isInstantBooking(startDate)
                    ? t('tour.bookNow')
                    : t('tour.submitRequest')}
                  </button>
                  <p className="booking-note">
                    {isInstantBooking(startDate) ? t('tour.instantNote') : t('tour.bookingNote')}
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
