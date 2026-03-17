import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import SEO from '../components/SEO'

export default function BookingConfirmed() {
  const { t } = useTranslation()

  return (
    <div className="container">
      <SEO title="Booking Confirmed" />
      <div className="confirmed-page">
        <div className="confirmed-icon">&#10003;</div>
        <h1>{t('confirmed.title')}</h1>
        <p>{t('confirmed.desc')}</p>
        <div className="confirmed-actions">
          <Link to="/my-bookings" className="btn btn-primary">{t('bookings.title')}</Link>
          <Link to="/" className="btn btn-outline">{t('about.ctaTours')}</Link>
        </div>
      </div>
    </div>
  )
}
