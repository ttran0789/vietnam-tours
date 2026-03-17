import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { Tour, Review } from '../types'
import ReviewCard from '../components/ReviewCard'
import { TOUR_CARD_IMAGES } from '../data/tourImages'

export default function Home() {
  const [tours, setTours] = useState<Tour[]>([])
  const [tourCardImages, setTourCardImages] = useState<Record<string, string>>({})
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const { t } = useTranslation()

  useEffect(() => {
    Promise.all([
      api.getTours().then((data: any) => {
        setTours(data)
        // Load uploaded images for each tour
        data.forEach((tour: Tour) => {
          api.getTourImages(tour.slug).then((result: any) => {
            const uploaded = result.uploaded || []
            if (uploaded.length > 0) {
              setTourCardImages(prev => ({ ...prev, [tour.slug]: uploaded[0].url }))
            }
          })
        })
      }),
      api.getReviews().then((data: any) => setReviews(data)),
    ]).finally(() => setLoading(false))
  }, [])

  // Show a mix of reviews on home page (up to 6)
  const featuredReviews = reviews.slice(0, 6)

  return (
    <div>
      <section className="hero">
        <div className="hero-content">
          <h1>{t('home.heroTitle')}</h1>
          <p>{t('home.heroSubtitle')}</p>
        </div>
      </section>

      <section className="container">
        <h2 className="section-title">{t('home.popularTours')}</h2>
        {loading ? (
          <div className="loading">{t('home.loadingTours')}</div>
        ) : (
          <div className="tour-grid">
            {tours.map(tour => (
              <Link to={`/tours/${tour.slug}`} key={tour.id} className="tour-card">
                <div className="tour-card-image">
                  <img
                    src={tourCardImages[tour.slug] || TOUR_CARD_IMAGES[tour.slug] || 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600&h=400&fit=crop'}
                    alt={tour.name}
                  />
                  <span className="tour-card-badge">{tour.difficulty}</span>
                </div>
                <div className="tour-card-body">
                  <div className="tour-card-location">{tour.location}</div>
                  <h3>{tour.name}</h3>
                  <p className="tour-card-duration">{tour.duration}</p>
                  <div className="tour-card-footer">
                    <span className="tour-card-price">${tour.price}</span>
                    <span className="tour-card-group">{t('home.maxPeople', { count: tour.max_group_size })}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {featuredReviews.length > 0 && (
        <section className="reviews-section">
          <div className="container">
            <h2 className="section-title">{t('reviews.title')}</h2>
            <div className="reviews-grid">
              {featuredReviews.map(review => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
