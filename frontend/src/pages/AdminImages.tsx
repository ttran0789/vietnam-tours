import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { Tour } from '../types'
import SEO from '../components/SEO'

interface ImageItem {
  url: string
  filename: string
}

export default function AdminImages() {
  const { t } = useTranslation()
  const [tours, setTours] = useState<Tour[]>([])
  const [selectedSlug, setSelectedSlug] = useState('')
  const [images, setImages] = useState<ImageItem[]>([])
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.getTours().then((data: any) => {
      setTours(data)
      if (data.length > 0) setSelectedSlug(data[0].slug)
    })
  }, [])

  useEffect(() => {
    if (selectedSlug) {
      api.getAdminTourImages(selectedSlug).then((data: any) => setImages(data))
    }
  }, [selectedSlug])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !selectedSlug) return
    setUploading(true)
    for (let i = 0; i < files.length; i++) {
      await api.uploadTourImage(selectedSlug, files[i])
    }
    // Refresh
    api.getAdminTourImages(selectedSlug).then((data: any) => setImages(data))
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleDelete = async (filename: string) => {
    if (!confirm('Delete this image?')) return
    await api.deleteTourImage(selectedSlug, filename)
    setImages(images.filter(img => img.filename !== filename))
  }

  return (
    <div className="container">
      <SEO title="Manage Images" />
      <h1 className="page-title">Manage Tour Photos</h1>

      <div className="admin-images-controls">
        <select
          value={selectedSlug}
          onChange={e => setSelectedSlug(e.target.value)}
          className="tour-select"
        >
          {tours.map(tour => (
            <option key={tour.slug} value={tour.slug}>{tour.name}</option>
          ))}
        </select>

        <label className="btn btn-primary upload-btn">
          {uploading ? 'Uploading...' : 'Upload Photos'}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      <p className="admin-images-hint">
        {images.length} photo{images.length !== 1 ? 's' : ''} uploaded.
        {images.length === 0 && ' Unsplash stock photos will be used until you upload your own.'}
      </p>

      {images.length > 0 && (
        <div className="admin-images-grid">
          {images.map(img => (
            <div key={img.filename} className="admin-image-item">
              <img src={`${img.url}`} alt={img.filename} />
              <button className="admin-image-delete" onClick={() => handleDelete(img.filename)}>&times;</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
