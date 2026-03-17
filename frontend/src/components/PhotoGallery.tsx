import { useState } from 'react'

interface Props {
  images: { url: string; caption: string }[]
}

export default function PhotoGallery({ images }: Props) {
  const [lightbox, setLightbox] = useState<number | null>(null)

  if (images.length === 0) return null

  const close = () => setLightbox(null)
  const prev = () => setLightbox(i => (i !== null ? (i - 1 + images.length) % images.length : null))
  const next = () => setLightbox(i => (i !== null ? (i + 1) % images.length : null))

  return (
    <>
      <div className="gallery-grid">
        {images.map((img, i) => (
          <button key={i} className="gallery-thumb" onClick={() => setLightbox(i)}>
            <img src={img.url} alt={img.caption} loading="lazy" />
          </button>
        ))}
      </div>

      {lightbox !== null && (
        <div className="lightbox-overlay" onClick={close}>
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            <button className="lightbox-close" onClick={close}>&times;</button>
            <button className="lightbox-prev" onClick={prev}>&#8249;</button>
            <img src={images[lightbox].url.replace('w=400', 'w=1200').replace('h=300', 'h=800')} alt={images[lightbox].caption} />
            <button className="lightbox-next" onClick={next}>&#8250;</button>
            <div className="lightbox-caption">
              <span>{images[lightbox].caption}</span>
              <span className="lightbox-counter">{lightbox + 1} / {images.length}</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
