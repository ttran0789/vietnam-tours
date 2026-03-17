import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { Tour, Review } from '../types'
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

  useEffect(() => {
    if (slug) {
      api.getTour(slug)
        .then((data: any) => {
          setTour(data)
          api.getReviews(data.id).then((r: any) => setReviews(r))
          api.getTourImages(data.slug).then((result: any) => {
            setUploadedImages(result.uploaded || [])
            setDisabledStock(result.disabled_stock || [])
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
      const res: any = await api.createBooking(tour!.id, startDate, numGuests, comments)
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
  const heroImage = uploadedImages.length > 0
    ? uploadedImages[0].url
    : (stockGallery.length > 0 ? stockGallery[0].url : TOUR_HERO_IMAGES[tour.slug])

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

                  <label>
                    {t('tour.comments')}
                    <textarea
                      value={comments}
                      onChange={e => setComments(e.target.value)}
                      placeholder={t('tour.commentsPlaceholder')}
                      rows={3}
                    />
                  </label>

                  <div className="booking-total">
                    <span>{t('tour.total')}</span>
                    <span className="total-amount">${(tour.price * numGuests).toFixed(2)}</span>
                  </div>

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
