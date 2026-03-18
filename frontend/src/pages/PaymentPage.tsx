import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { api } from '../api'
import { Booking, TransportBooking } from '../types'
import SEO from '../components/SEO'

function CheckoutForm({ bookingId }: { bookingId: number }) {
  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)
  const [succeeded, setSucceeded] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setProcessing(true)
    setError('')

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/my-bookings',
      },
      redirect: 'if_required',
    })

    if (result.error) {
      setError(result.error.message || t('payment.paymentFailed'))
      setProcessing(false)
    } else {
      setSucceeded(true)
      setProcessing(false)
    }
  }

  if (succeeded) {
    return (
      <div className="payment-success">
        <h2>{t('payment.successTitle')}</h2>
        <p>{t('payment.successDesc')}</p>
        <Link to="/my-bookings" className="btn btn-primary">{t('payment.viewBookings')}</Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <PaymentElement options={{
        layout: 'tabs',
        paymentMethodOrder: ['card', 'klarna'],
      }} />
      {error && <div className="error-message">{error}</div>}
      <button type="submit" className="btn btn-primary btn-block" disabled={!stripe || processing}>
        {processing ? t('payment.processing') : t('payment.payNow')}
      </button>
    </form>
  )
}

export default function PaymentPage() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const [searchParams] = useSearchParams()
  const bookingType = searchParams.get('type') || 'tour'
  const { t } = useTranslation()
  const [clientSecret, setClientSecret] = useState('')
  const [stripePromise, setStripePromise] = useState<any>(null)
  const [error, setError] = useState('')
  const [noStripe, setNoStripe] = useState(false)
  const [configChecked, setConfigChecked] = useState(false)
  const [booking, setBooking] = useState<any>(null)
  const [bundledTransport, setBundledTransport] = useState<TransportBooking[]>([])

  // Load booking details
  useEffect(() => {
    if (!bookingId) return
    if (bookingType === 'transport') {
      api.getTransportBookings().then((data: any) => {
        const found = data.find((b: TransportBooking) => b.id === Number(bookingId))
        if (found) setBooking({ ...found, type: 'transport' })
      })
    } else {
      api.getBookings().then((data: any) => {
        const found = data.find((b: Booking) => b.id === Number(bookingId))
        if (found) {
          setBooking({ ...found, type: 'tour' })
          // Find bundled transport
          api.getTransportBookings().then((tdata: any) => {
            const bundled = tdata.filter((tb: TransportBooking) =>
              tb.travel_date === found.start_date &&
              tb.comments?.includes('Bundled with tour') &&
              (tb.status === 'approved' || tb.status === 'pending')
            )
            setBundledTransport(bundled)
          })
        }
      })
    }
  }, [bookingId, bookingType])

  useEffect(() => {
    api.getStripeConfig()
      .then((config) => {
        if (!config.publishable_key) {
          setNoStripe(true)
        } else {
          setStripePromise(loadStripe(config.publishable_key))
        }
      })
      .catch(() => setNoStripe(true))
      .finally(() => setConfigChecked(true))
  }, [])

  useEffect(() => {
    if (!configChecked || noStripe || !bookingId) return
    api.createPaymentIntent(Number(bookingId), bookingType)
      .then((data) => setClientSecret(data.client_secret))
      .catch((e) => {
        if (e.message.toLowerCase().includes('stripe')) {
          setNoStripe(true)
        } else {
          setError(e.message)
        }
      })
  }, [bookingId, configChecked, noStripe])

  if (noStripe) {
    return (
      <div className="container">
        <div className="payment-container">
          <h1>{t('payment.title')}</h1>
          <div className="payment-demo-notice">
            <h2>{t('payment.noStripeTitle')}</h2>
            <p>{t('payment.noStripeDesc')}</p>
            <Link to="/my-bookings" className="btn btn-primary">{t('payment.viewBookings')}</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <SEO title="Payment" />
      <div className="payment-container">
        <h1>{t('payment.title')}</h1>

        {booking && (
          <div className="payment-summary">
            <h3>{t('payment.orderSummary')}</h3>
            {booking.type === 'tour' ? (
              <>
                <div className="payment-summary-line">
                  <span>
                    {booking.tour?.name || 'Tour'}
                    {booking.ride_type === 'easy_rider' ? ' (Easy Rider)' : ''}
                    {booking.group_type === 'small' ? ' (Small Group)' : ''}
                  </span>
                </div>
                <div className="payment-summary-detail">
                  <span>{t('bookings.date', { date: booking.start_date })}</span>
                  <span>{t('bookings.guests', { count: booking.num_guests })}</span>
                </div>

                {bundledTransport.map(tb => (
                  <div key={tb.id} className="payment-summary-line" style={{ marginTop: '0.75rem' }}>
                    <span>
                      {tb.route ? `${tb.route.origin} → ${tb.route.destination}` : 'Transport'}
                      {tb.route ? ` (${tb.route.vehicle_type})` : ''}
                    </span>
                    <span>${tb.total_price.toFixed(2)}</span>
                  </div>
                ))}
              </>
            ) : (
              <>
                <div className="payment-summary-line">
                  <span>{booking.route ? `${booking.route.origin} → ${booking.route.destination}` : 'Transport'}</span>
                </div>
                <div className="payment-summary-detail">
                  <span>{t('bookings.date', { date: booking.travel_date })}</span>
                  {booking.route && <span>{booking.route.vehicle_type}</span>}
                </div>
                {booking.pickup_location && (
                  <div className="payment-summary-detail">
                    <span>{t('transport.pickup')}: {booking.pickup_location}</span>
                  </div>
                )}
              </>
            )}
            <div className="payment-summary-total">
              <span>{t('tour.total')}</span>
              <span className="total-amount">${booking.total_price.toFixed(2)}</span>
            </div>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}
        {clientSecret && stripePromise ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm bookingId={Number(bookingId)} />
          </Elements>
        ) : (
          <div className="loading">{t('payment.loading')}</div>
        )}
      </div>
    </div>
  )
}
