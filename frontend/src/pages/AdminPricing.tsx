import { useState, useEffect } from 'react'
import { api } from '../api'
import { Tour, TransportRoute } from '../types'
import SEO from '../components/SEO'
import AdminNav from '../components/AdminNav'

export default function AdminPricing() {
  const [tours, setTours] = useState<Tour[]>([])
  const [routes, setRoutes] = useState<TransportRoute[]>([])
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [saved, setSaved] = useState('')

  useEffect(() => {
    api.getTours().then((data: any) => {
      setTours(data)
      const p: Record<string, number> = {}
      data.forEach((t: Tour) => { p[`tour-${t.id}`] = t.price })
      setPrices(prev => ({ ...prev, ...p }))
    })
    api.getTransportRoutes().then((data: any) => {
      setRoutes(data)
      const p: Record<string, number> = {}
      data.forEach((r: TransportRoute) => { p[`route-${r.id}`] = r.price })
      setPrices(prev => ({ ...prev, ...p }))
    })
  }, [])

  const saveTourPrice = async (tourId: number) => {
    const key = `tour-${tourId}`
    await api.updateTourPrice(tourId, prices[key])
    setSaved(key)
    setTimeout(() => setSaved(''), 1500)
  }

  const saveRoutePrice = async (routeId: number) => {
    const key = `route-${routeId}`
    await api.updateTransportPrice(routeId, prices[key])
    setSaved(key)
    setTimeout(() => setSaved(''), 1500)
  }

  return (
    <div className="container">
      <AdminNav />
      <SEO title="Pricing" />
      <h1 className="page-title">Pricing</h1>

      <h2 className="bookings-subheader">Tours</h2>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Tour</th>
              <th>Duration</th>
              <th>Price (USD)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tours.map(tour => (
              <tr key={tour.id}>
                <td><strong>{tour.name}</strong></td>
                <td>{tour.duration}</td>
                <td>
                  <div className="price-input-wrap">
                    <span className="price-prefix">$</span>
                    <input
                      type="number"
                      className="price-input"
                      value={prices[`tour-${tour.id}`] ?? ''}
                      onChange={e => setPrices({ ...prices, [`tour-${tour.id}`]: Number(e.target.value) })}
                      onBlur={() => saveTourPrice(tour.id)}
                      onKeyDown={e => { if (e.key === 'Enter') saveTourPrice(tour.id) }}
                      step="0.01"
                      min="0"
                    />
                    {saved === `tour-${tour.id}` && <span className="caption-saved">Saved</span>}
                  </div>
                </td>
                <td className="text-small">/ person</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="bookings-subheader" style={{ marginTop: '2rem' }}>Transportation</h2>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Route</th>
              <th>Vehicle</th>
              <th>Duration</th>
              <th>Price (USD)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {routes.map(route => (
              <tr key={route.id}>
                <td><strong>{route.origin} → {route.destination}</strong></td>
                <td>{route.vehicle_type}</td>
                <td>{route.duration}</td>
                <td>
                  <div className="price-input-wrap">
                    <span className="price-prefix">$</span>
                    <input
                      type="number"
                      className="price-input"
                      value={prices[`route-${route.id}`] ?? ''}
                      onChange={e => setPrices({ ...prices, [`route-${route.id}`]: Number(e.target.value) })}
                      onBlur={() => saveRoutePrice(route.id)}
                      onKeyDown={e => { if (e.key === 'Enter') saveRoutePrice(route.id) }}
                      step="0.01"
                      min="0"
                    />
                    {saved === `route-${route.id}` && <span className="caption-saved">Saved</span>}
                  </div>
                </td>
                <td className="text-small">/ person</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
