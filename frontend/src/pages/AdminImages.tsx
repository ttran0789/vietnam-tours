import { useState, useEffect, useRef } from 'react'
import { api } from '../api'
import { Tour } from '../types'
import { TOUR_IMAGES } from '../data/tourImages'
import SEO from '../components/SEO'

interface Photo {
  url: string
  filename: string
  caption: string
}

export default function AdminImages() {
  const [tours, setTours] = useState<Tour[]>([])
  const [selectedSlug, setSelectedSlug] = useState('')
  const [allPhotos, setAllPhotos] = useState<Photo[]>([])
  const [enabledFiles, setEnabledFiles] = useState<string[]>([])
  const [disabledStock, setDisabledStock] = useState<string[]>([])
  const [captions, setCaptions] = useState<Record<string, string>>({})
  const [cover, setCover] = useState('')
  const [uploading, setUploading] = useState(false)
  const [savedCaption, setSavedCaption] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.getTours().then((data: any) => {
      setTours(data)
      if (data.length > 0) setSelectedSlug(data[0].slug)
    })
    loadPhotos()
  }, [])

  const loadPhotos = async () => {
    const photos = await api.getAllPhotos() as Photo[]
    setAllPhotos(photos)
    const caps: Record<string, string> = {}
    photos.forEach(p => { caps[p.filename] = p.caption || '' })
    setCaptions(caps)
  }

  useEffect(() => {
    if (selectedSlug) {
      api.getTourPhotoConfig(selectedSlug).then((config: any) => {
        setEnabledFiles(config.enabled || [])
        setDisabledStock(config.disabled_stock || [])
        setCover(config.cover || '')
      })
    }
  }, [selectedSlug])

  const saveConfig = (enabled: string[], disabled: string[], coverFile: string = cover) => {
    api.updateTourPhotoConfig(selectedSlug, enabled, disabled, coverFile)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    setUploading(true)
    for (let i = 0; i < files.length; i++) {
      await api.uploadPhoto(files[i])
    }
    await loadPhotos()
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleDelete = async (filename: string) => {
    if (!confirm('Delete this photo permanently?')) return
    await api.deletePhoto(filename)
    // Remove from enabled lists
    const newEnabled = enabledFiles.filter(f => f !== filename)
    setEnabledFiles(newEnabled)
    saveConfig(newEnabled, disabledStock)
    await loadPhotos()
  }

  const handleCaptionSave = async (filename: string) => {
    await api.updatePhotoCaption(filename, captions[filename] || '')
    setSavedCaption(filename)
    setTimeout(() => setSavedCaption(''), 1500)
  }

  const togglePhoto = (filename: string) => {
    const newEnabled = enabledFiles.includes(filename)
      ? enabledFiles.filter(f => f !== filename)
      : [...enabledFiles, filename]
    setEnabledFiles(newEnabled)
    saveConfig(newEnabled, disabledStock)
  }

  const toggleStock = (stockUrl: string) => {
    const newDisabled = disabledStock.includes(stockUrl)
      ? disabledStock.filter(u => u !== stockUrl)
      : [...disabledStock, stockUrl]
    setDisabledStock(newDisabled)
    saveConfig(enabledFiles, newDisabled)
  }

  const handleSetCover = (filename: string) => {
    setCover(filename)
    // Also enable it if not already
    const newEnabled = enabledFiles.includes(filename) ? enabledFiles : [...enabledFiles, filename]
    setEnabledFiles(newEnabled)
    saveConfig(newEnabled, disabledStock, filename)
  }

  const handleSetStockCover = (stockUrl: string) => {
    setCover(stockUrl)
    // Also enable it if disabled
    const newDisabled = disabledStock.filter(u => u !== stockUrl)
    setDisabledStock(newDisabled)
    saveConfig(enabledFiles, newDisabled, stockUrl)
  }

  const stockImages = TOUR_IMAGES[selectedSlug] || []

  return (
    <div className="container">
      <SEO title="Manage Photos" />
      <h1 className="page-title">Manage Photos</h1>

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
        Check photos to show on this tour. {enabledFiles.length} uploaded + {stockImages.filter(s => !disabledStock.includes(s.url)).length} stock enabled.
      </p>

      <div className="admin-images-list">
        {allPhotos.map(photo => (
          <div key={photo.filename} className={`admin-image-row ${!enabledFiles.includes(photo.filename) ? 'admin-image-disabled' : ''}`}>
            <label className="admin-image-toggle">
              <input
                type="checkbox"
                checked={enabledFiles.includes(photo.filename)}
                onChange={() => togglePhoto(photo.filename)}
              />
            </label>
            <div className="admin-image-thumb">
              <img src={photo.url} alt={photo.caption} />
            </div>
            <div className="admin-image-caption">
              <input
                type="text"
                placeholder="Add a caption..."
                value={captions[photo.filename] || ''}
                onChange={e => setCaptions({ ...captions, [photo.filename]: e.target.value })}
                onBlur={() => handleCaptionSave(photo.filename)}
                onKeyDown={e => { if (e.key === 'Enter') handleCaptionSave(photo.filename) }}
              />
              {savedCaption === photo.filename && <span className="caption-saved">Saved</span>}
            </div>
            <button
              className={`btn btn-sm ${cover === photo.filename ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => handleSetCover(photo.filename)}
              title="Set as cover"
            >
              {cover === photo.filename ? 'Cover' : 'Set Cover'}
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(photo.filename)}>Delete</button>
          </div>
        ))}

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
            <button
              className={`btn btn-sm ${cover === img.url ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => handleSetStockCover(img.url)}
              title="Set as cover"
            >
              {cover === img.url ? 'Cover' : 'Set Cover'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
