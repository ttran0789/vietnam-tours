import { useState, useEffect } from 'react'
import { api } from '../api'
import SEO from '../components/SEO'
import AdminNav from '../components/AdminNav'

const STATUS_STYLES: Record<string, string> = {
  pending: 'status-pending',
  approved: 'status-approved',
  confirmed: 'status-confirmed',
}

interface UpcomingTour {
  id: number; type: string; date: string; status: string
  num_guests: number; total_price: number; comments: string
  customer_name: string; customer_email: string; customer_phone: string; customer_whatsapp: string
  tour_name: string
}

interface UpcomingTransport {
  id: number; type: string; date: string; status: string
  num_passengers: number; total_price: number; comments: string; pickup_location: string
  customer_name: string; customer_email: string; customer_phone: string; customer_whatsapp: string
  route_name: string; vehicle_type: string
}

export default function AdminUpcoming() {
  const [tours, setTours] = useState<UpcomingTour[]>([])
  const [transports, setTransports] = useState<UpcomingTransport[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'tours' | 'transport'>('tours')

  useEffect(() => {
    api.getAdminUpcoming().then((data: any) => {
      setTours(data.tours || [])
      setTransports(data.transports || [])
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div className="container">
      <AdminNav />
      <SEO title="Upcoming" />
      <h1 className="page-title">Upcoming Bookings</h1>

      <div className="bookings-tabs" style={{ marginBottom: '1rem' }}>
        <button className={`btn btn-sm ${tab === 'tours' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('tours')}>
          Tours ({tours.length})
        </button>
        <button className={`btn btn-sm ${tab === 'transport' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('transport')}>
          Transport ({transports.length})
        </button>
      </div>

      {tab === 'tours' && (
        tours.length === 0 ? (
          <div className="empty-state"><p>No upcoming tour bookings.</p></div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Tour</th>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Guests</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Comments</th>
                </tr>
              </thead>
              <tbody>
                {tours.map(b => (
                  <tr key={b.id}>
                    <td><strong>{b.date}</strong></td>
                    <td>{b.tour_name}</td>
                    <td>{b.customer_name}<br /><span className="text-small">{b.customer_email}</span></td>
                    <td>
                      {b.customer_phone && <div>{b.customer_phone}</div>}
                      {b.customer_whatsapp && <div>WA: {b.customer_whatsapp}</div>}
                    </td>
                    <td>{b.num_guests}</td>
                    <td>${b.total_price.toFixed(2)}</td>
                    <td><span className={`status-badge ${STATUS_STYLES[b.status] || ''}`}>{b.status}</span></td>
                    <td className="text-small">{b.comments || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === 'transport' && (
        transports.length === 0 ? (
          <div className="empty-state"><p>No upcoming transport bookings.</p></div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Route</th>
                  <th>Vehicle</th>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Passengers</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Pickup</th>
                </tr>
              </thead>
              <tbody>
                {transports.map(b => (
                  <tr key={b.id}>
                    <td><strong>{b.date}</strong></td>
                    <td>{b.route_name}</td>
                    <td>{b.vehicle_type}</td>
                    <td>{b.customer_name}<br /><span className="text-small">{b.customer_email}</span></td>
                    <td>
                      {b.customer_phone && <div>{b.customer_phone}</div>}
                      {b.customer_whatsapp && <div>WA: {b.customer_whatsapp}</div>}
                    </td>
                    <td>{b.num_passengers}</td>
                    <td>${b.total_price.toFixed(2)}</td>
                    <td><span className={`status-badge ${STATUS_STYLES[b.status] || ''}`}>{b.status}</span></td>
                    <td className="text-small">{b.pickup_location || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  )
}
