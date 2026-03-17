import { Helmet } from 'react-helmet-async'

interface Props {
  title?: string
  description?: string
  image?: string
  url?: string
}

const DEFAULTS = {
  title: 'Travel VN Tours - Explore the Beauty of Vietnam',
  description: 'Book authentic Vietnam tours and transportation. Ha Giang Loop motorbike and jeep tours, local guides, fair prices, unforgettable adventures.',
  image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200&h=630&fit=crop',
  url: 'https://travelvntours.com',
}

export default function SEO({ title, description, image, url }: Props) {
  const t = title ? `${title} | Travel VN Tours` : DEFAULTS.title
  const d = description || DEFAULTS.description
  const i = image || DEFAULTS.image
  const u = url || DEFAULTS.url

  return (
    <Helmet>
      <title>{t}</title>
      <meta name="description" content={d} />
      <link rel="canonical" href={u} />
      <meta property="og:title" content={t} />
      <meta property="og:description" content={d} />
      <meta property="og:image" content={i} />
      <meta property="og:url" content={u} />
      <meta name="twitter:title" content={t} />
      <meta name="twitter:description" content={d} />
      <meta name="twitter:image" content={i} />
    </Helmet>
  )
}
