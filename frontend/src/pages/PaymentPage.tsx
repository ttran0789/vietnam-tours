import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { api } from '../api'
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
