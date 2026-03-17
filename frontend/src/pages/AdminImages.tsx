import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { Tour } from '../types'
import { TOUR_IMAGES } from '../data/tourImages'
import SEO from '../components/SEO'

interface UploadedImage {
  url: string
  filename: string
  caption: string
}

export default function AdminImages() {
  const { t } = useTranslation()
  const [tours, setTours] = useState<Tour[]>([])
  const [selectedSlug, setSelectedSlug] = useState('')
  const [uploaded, setUploaded] = useState<UploadedImage[]>([])
  const [uploading, setUploading] = useState(false)
  const [captions, setCaptions] = useState<Record<string, string>>({})
  const [disabledStock, setDisabledStock] = useState<string[]>([])
  const [savedCaption, setSavedCaption] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.getTours().then((data: any) => {
      setTours(data)
      if (data.length > 0) setSelectedSlug(data[0].slug)
    })
  }, [])

  const loadImages = async (slug: string) => {
    try {
      const [adminData, stockConfig] = await Promise.all([
        api.getAdminTourImages(slug),
        fetch(`/api/admin/images/${slug}/stock-config`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }).then(r => r.ok ? r.json() : { disabled: [] }),
      ])

      const imgs = adminData as UploadedImage[]
      setUploaded(imgs)
      const caps: Record<string, string> = {}
      imgs.forEach(img => { caps[img.filename] = img.caption || '' })
      setCaptions(caps)
      setDisabledStock(stockConfig.disabled || [])
    } catch (e) {
      console.error('Failed to load images', e)
    }
  }

  useEffect(() => {
    if (selectedSlug) loadImages(selectedSlug)
  }, [selectedSlug])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !selectedSlug) return
    setUploading(true)
    for (let i = 0; i < files.length; i++) {
      await api.uploadTourImage(selectedSlug, files[i])
    }
    await loadImages(selectedSlug)
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleDelete = async (filename: string) => {
    if (!confirm('Delete this image?')) return
    await api.deleteTourImage(selectedSlug, filename)
    await loadImages(selectedSlug)
  }

  const handleCaptionSave = async (filename: string) => {
    await api.updateImageCaption(selectedSlug, filename, captions[filename] || '')
    setSavedCaption(filename)
    setTimeout(() => setSavedCaption(''), 1500)
  }

  const toggleStock = async (stockUrl: string) => {
    const newDisabled = disabledStock.includes(stockUrl)
      ? disabledStock.filter(u => u !== stockUrl)
      : [...disabledStock, stockUrl]
    setDisabledStock(newDisabled)

    fetch(`/api/admin/images/${selectedSlug}/stock-config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ disabled: newDisabled }),
    })
  }

  const stockImages = TOUR_IMAGES[selectedSlug] || []

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

      <h3 className="admin-section-title">Your Photos ({uploaded.length})</h3>
      {uploaded.length === 0 ? (
        <p className="admin-images-hint">No photos uploaded yet. Upload your own tour photos above.</p>
      ) : (
        <div className="admin-images-list">
          {uploaded.map(img => (
            <div key={img.filename} className="admin-image-row">
              <div className="admin-image-thumb">
                <img src={img.url} alt={img.caption} />
              </div>
              <div className="admin-image-caption">
                <input
                  type="text"
                  placeholder="Add a caption..."
                  value={captions[img.filename] || ''}
                  onChange={e => setCaptions({ ...captions, [img.filename]: e.target.value })}
                  onBlur={() => handleCaptionSave(img.filename)}
                  onKeyDown={e => { if (e.key === 'Enter') handleCaptionSave(img.filename) }}
                />
                {savedCaption === img.filename && <span className="caption-saved">Saved</span>}
              </div>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(img.filename)}>Delete</button>
            </div>
          ))}
        </div>
      )}

      <h3 className="admin-section-title" style={{ marginTop: '2rem' }}>
        Stock Photos ({stockImages.filter(img => !disabledStock.includes(img.url)).length}/{stockImages.length} enabled)
      </h3>
      <p className="admin-images-hint">Toggle stock photos on/off. Disabled photos won't show on the tour page.</p>
      {stockImages.length === 0 ? (
        <p className="admin-images-hint">No stock photos available for this tour.</p>
      ) : (
        <div className="admin-images-list">
          {stockImages.map(img => (
            <div key={img.url} className={`admin-image-row ${disabledStock.includes(img.url) ? 'admin-image-disabled' : ''}`}>
              <label className="admin-image-toggle">
                <input
                  type="checkbox"
                  checked={!disabledStock.includes(img.url)}
                  onChange={() => toggleStock(img.url)}
                />
              </label>
              <div className="admin-image-thumb">
                <img src={img.url} alt={img.caption} />
              </div>
              <div className="admin-image-caption">
                <span className="stock-caption">{img.caption}</span>
                <span className="stock-badge">Stock</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
