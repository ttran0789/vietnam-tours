import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { Tour } from '../types'

const PLACEHOLDER_IMAGES: Record<string, string> = {
  'ha-giang-motorbike-4d3n': 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600&h=400&fit=crop',
  'ha-giang-motorbike-3d2n': 'https://images.unsplash.com/photo-1528127269322-539801943592?w=600&h=400&fit=crop',
  'big-loop-6d5n': 'https://images.unsplash.com/photo-1570366583862-f91883984fde?w=600&h=400&fit=crop',
  'ha-giang-jeep-4d3n': 'https://images.unsplash.com/photo-1573790387438-4da905039392?w=600&h=400&fit=crop',
  'ha-giang-jeep-3d2n': 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600&h=400&fit=crop',
}

export default function Home() {
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const { t } = useTranslation()

  useEffect(() => {
    api.getTours()
      .then((data: any) => setTours(data))
      .finally(() => setLoading(false))
  }, [])

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
                    src={PLACEHOLDER_IMAGES[tour.slug] || 'https://images.unsplash.com/photo-1528127269322-539801943592?w=600&h=400&fit=crop'}
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
    </div>
  )
}
