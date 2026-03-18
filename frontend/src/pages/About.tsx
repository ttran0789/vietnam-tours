import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'

const PHONE = '17204537336'
const EMAIL = 'bookings@travelvntours.com'
const WHATSAPP = '17204537336'

export default function About() {
  const { t } = useTranslation()

  return (
    <div>
      <SEO title="About Us" description="Travel VN Tours - Founded by a Vietnamese-American passionate about sharing authentic northern Vietnam experiences. Local guides, fair prices, safety first." url="https://travelvntours.com/about" />
      <section className="hero hero-sm">
        <div className="hero-content">
          <h1>{t('about.heroTitle')}</h1>
          <p>{t('about.heroSubtitle')}</p>
        </div>
      </section>

      <div className="container">
        <div className="about-layout">
          <div className="about-main">
            <section className="about-section">
              <h2>{t('about.storyTitle')}</h2>
              <p>{t('about.storyP1')}</p>
              <p>{t('about.storyP2')}</p>
              <p>{t('about.storyP3')}</p>
            </section>

            <section className="about-section">
              <h2>{t('about.whyTitle')}</h2>
              <div className="about-features">
                <div className="about-feature">
                  <div className="about-feature-icon">&#9733;</div>
                  <h3>{t('about.why1Title')}</h3>
                  <p>{t('about.why1Desc')}</p>
                </div>
                <div className="about-feature">
                  <div className="about-feature-icon">&#9829;</div>
                  <h3>{t('about.why2Title')}</h3>
                  <p>{t('about.why2Desc')}</p>
                </div>
                <div className="about-feature">
                  <div className="about-feature-icon">&#9992;</div>
                  <h3>{t('about.why3Title')}</h3>
                  <p>{t('about.why3Desc')}</p>
                </div>
                <div className="about-feature">
                  <div className="about-feature-icon">&#128274;</div>
                  <h3>{t('about.why4Title')}</h3>
                  <p>{t('about.why4Desc')}</p>
                </div>
              </div>
            </section>

            <section className="about-section">
              <h2>{t('about.ctaTitle')}</h2>
              <p>{t('about.ctaDesc')}</p>
              <div className="about-cta-buttons">
                <Link to="/" className="btn btn-primary">{t('about.ctaTours')}</Link>
                <Link to="/transport" className="btn btn-outline">{t('about.ctaTransport')}</Link>
              </div>
            </section>
          </div>

          <aside className="about-sidebar">
            <div className="contact-card">
              <h3>{t('about.contactTitle')}</h3>

              <div className="contact-item">
                <span className="contact-icon">&#9993;</span>
                <div>
                  <span className="contact-label">{t('about.email')}</span>
                  <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
                </div>
              </div>

              <div className="contact-item">
                <span className="contact-icon">&#9742;</span>
                <div>
                  <span className="contact-label">{t('about.phone')}</span>
                  <a href={`tel:+${PHONE}`}>+1 (720) 593-8387</a>
                </div>
              </div>

              <div className="contact-item">
                <span className="contact-icon">&#128172;</span>
                <div>
                  <span className="contact-label">WhatsApp</span>
                  <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer">
                    {t('about.chatWhatsApp')}
                  </a>
                </div>
              </div>

              <div className="contact-hours">
                <span className="contact-label">{t('about.hours')}</span>
                <p>{t('about.hoursDetail')}</p>
              </div>

              <div className="contact-response">
                <p>{t('about.responseTime')}</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
