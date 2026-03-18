export interface User {
  id: number
  email: string
  name: string
  is_admin: boolean
  phone: string
  whatsapp: string
  zalo: string
  nationality: string
}

export interface Tour {
  id: number
  name: string
  slug: string
  description: string
  highlights: string | null
  duration: string
  price: number
  location: string
  image_url: string | null
  max_group_size: number
  difficulty: string
  itinerary: string | null
  included: string | null
  not_included: string | null
}

export interface Booking {
  id: number
  tour_id: number
  start_date: string
  num_guests: number
  total_price: number
  status: string
  ride_type: string
  comments: string
  admin_notes: string
  stripe_payment_intent_id: string | null
  created_at: string | null
  tour: Tour | null
  user: User | null
}

export interface Review {
  id: number
  tour_id: number | null
  reviewer_name: string
  reviewer_country: string
  rating: number
  text: string
  created_at: string | null
}

export interface TransportRoute {
  id: number
  origin: string
  destination: string
  slug: string
  description: string
  price: number
  duration: string
  vehicle_type: string
  included: string | null
}

export interface TransportBooking {
  id: number
  route_id: number
  travel_date: string
  num_passengers: number
  total_price: number
  status: string
  comments: string
  admin_notes: string
  pickup_location: string
  created_at: string | null
  route: TransportRoute | null
  user: User | null
}
