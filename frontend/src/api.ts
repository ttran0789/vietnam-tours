const API = '/api'

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

export const api = {
  register: (email: string, name: string, password: string) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, name, password }),
    }),

  login: (email: string, password: string) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getMe: () => request('/auth/me'),

  forgotPassword: (email: string) =>
    request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, password: string) =>
    request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),

  changePassword: (currentPassword: string, newPassword: string) =>
    request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    }),

  updateProfile: (data: { name: string; phone: string; whatsapp: string; zalo: string; nationality: string }) =>
    request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getTours: () => request('/tours'),

  getTour: (slug: string) => request(`/tours/${slug}`),

  getReviews: (tourId?: number) =>
    request(`/reviews${tourId ? `?tour_id=${tourId}` : ''}`),

  createBooking: (tourId: number, startDate: string, numGuests: number, comments: string, rideType: string = 'self', groupType: string = 'regular', transportToId?: number, transportFromId?: number, pickupLocation: string = '', dropoffLocation: string = '') =>
    request('/bookings', {
      method: 'POST',
      body: JSON.stringify({
        tour_id: tourId, start_date: startDate, num_guests: numGuests, comments,
        ride_type: rideType, group_type: groupType,
        transport_to_id: transportToId || null, transport_from_id: transportFromId || null,
        pickup_location: pickupLocation, dropoff_location: dropoffLocation,
      }),
    }),

  getBookings: () => request('/bookings'),

  cancelBooking: (id: number) =>
    request(`/bookings/${id}`, { method: 'DELETE' }),

  // Admin
  getAdminStats: () => request('/admin/stats'),
  getAdminUsers: () => request('/admin/users'),
  updateUserRole: (userId: number, role: string) =>
    request(`/admin/users/${userId}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
  getAdminUpcoming: () => request('/admin/upcoming'),

  updateTourPrice: (tourId: number, price: number) =>
    request(`/admin/tours/${tourId}/price`, { method: 'PUT', body: JSON.stringify({ price }) }),

  updateTransportPrice: (routeId: number, price: number) =>
    request(`/admin/transport/${routeId}/price`, { method: 'PUT', body: JSON.stringify({ price }) }),

  getAdminBookings: (status?: string) =>
    request(`/admin/bookings${status ? `?status=${status}` : ''}`),

  approveBooking: (id: number, adminNotes: string = '') =>
    request(`/admin/bookings/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ admin_notes: adminNotes }),
    }),

  rejectBooking: (id: number, adminNotes: string = '') =>
    request(`/admin/bookings/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ admin_notes: adminNotes }),
    }),

  // Transport
  getTransportRoutes: () => request('/transport'),

  createTransportBooking: (routeId: number, travelDate: string, numPassengers: number, comments: string, pickupLocation: string) =>
    request('/transport/bookings', {
      method: 'POST',
      body: JSON.stringify({ route_id: routeId, travel_date: travelDate, num_passengers: numPassengers, comments, pickup_location: pickupLocation }),
    }),

  getTransportBookings: () => request('/transport/bookings'),

  cancelTransportBooking: (id: number) =>
    request(`/transport/bookings/${id}`, { method: 'DELETE' }),

  getAdminTransportBookings: (status?: string) =>
    request(`/admin/transport/bookings${status ? `?status=${status}` : ''}`),

  approveTransportBooking: (id: number, adminNotes: string = '') =>
    request(`/admin/transport/bookings/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ admin_notes: adminNotes }),
    }),

  rejectTransportBooking: (id: number, adminNotes: string = '') =>
    request(`/admin/transport/bookings/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ admin_notes: adminNotes }),
    }),

  // Images
  getTourImages: (tourSlug: string) =>
    request(`/images/${tourSlug}`),

  getAllPhotos: () => request('/admin/photos'),

  uploadPhoto: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const token = localStorage.getItem('token')
    return fetch('/api/admin/upload', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(res => {
      if (!res.ok) throw new Error('Upload failed')
      return res.json()
    })
  },

  updatePhotoCaption: (filename: string, caption: string) =>
    request(`/admin/photos/${filename}/caption?caption=${encodeURIComponent(caption)}`, { method: 'PUT' }),

  deletePhoto: (filename: string) =>
    request(`/admin/photos/${filename}`, { method: 'DELETE' }),

  getTourPhotoConfig: (tourSlug: string) =>
    request(`/admin/tour-photos/${tourSlug}`),

  updateTourPhotoConfig: (tourSlug: string, enabled: string[], disabledStock: string[], cover: string = '') =>
    request(`/admin/tour-photos/${tourSlug}`, {
      method: 'PUT',
      body: JSON.stringify({ enabled, disabled_stock: disabledStock, cover }),
    }),

  // Taxi
  getTaxiLocations: () => request<string[]>('/taxi/locations'),
  getTaxiQuote: (origin: string, destination: string) =>
    request<{ origin: string; destination: string; distance_miles: number; driving_hours: number; rate_per_mile: number; total_price: number }>(
      '/taxi/quote', { method: 'POST', body: JSON.stringify({ origin, destination }) }
    ),

  // Admin config
  getConfig: (key: string) => request<{ key: string; value: string }>(`/admin/config/${key}`),
  updateConfig: (key: string, value: string) =>
    request(`/admin/config/${key}`, { method: 'PUT', body: JSON.stringify({ value }) }),

  createPaymentIntent: (bookingId: number, bookingType: string = 'tour') =>
    request<{ client_secret: string }>('/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({ booking_id: bookingId, booking_type: bookingType }),
    }),

  getStripeConfig: () =>
    request<{ publishable_key: string }>('/config/stripe'),
}
