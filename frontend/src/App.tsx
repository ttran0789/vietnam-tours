import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { api } from './api'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import TourDetail from './pages/TourDetail'
import MyBookings from './pages/MyBookings'
import Login from './pages/Login'
import Register from './pages/Register'
import PaymentPage from './pages/PaymentPage'
import AdminBookings from './pages/AdminBookings'
import Transport from './pages/Transport'
import About from './pages/About'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Profile from './pages/Profile'
import BookingConfirmed from './pages/BookingConfirmed'
import AdminImages from './pages/AdminImages'
import AdminUsers from './pages/AdminUsers'
import AdminUpcoming from './pages/AdminUpcoming'
import AdminPricing from './pages/AdminPricing'
import AdminSettings from './pages/AdminSettings'
import ChatWidget from './components/ChatWidget'
import AdminChat from './pages/AdminChat'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading">Loading...</div>
  return user ? <>{children}</> : <Navigate to="/login" />
}

function AdminRoute({ children, superOnly }: { children: React.ReactNode; superOnly?: boolean }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading">Loading...</div>
  if (!user) return <Navigate to="/login" />
  const isStaff = user.role === 'admin' || user.role === 'employee'
  if (!isStaff) return <Navigate to="/" />
  if (superOnly && user.role !== 'admin') return <Navigate to="/admin/bookings" />
  return <>{children}</>
}

export default function App() {
  useEffect(() => {
    api.getTheme()
      .then(data => { document.documentElement.setAttribute('data-theme', data.theme) })
      .catch(() => {})
  }, [])

  return (
    <>
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tours/:slug" element={<TourDetail />} />
          <Route path="/transport" element={<Transport />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/booking-confirmed" element={<BookingConfirmed />} />
          <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/payment/:bookingId" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
          <Route path="/admin/bookings" element={<AdminRoute><AdminBookings /></AdminRoute>} />
          <Route path="/admin/images" element={<AdminRoute><AdminImages /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/upcoming" element={<AdminRoute><AdminUpcoming /></AdminRoute>} />
          <Route path="/admin/pricing" element={<AdminRoute superOnly><AdminPricing /></AdminRoute>} />
          <Route path="/admin/settings" element={<AdminRoute superOnly><AdminSettings /></AdminRoute>} />
          <Route path="/admin/chat" element={<AdminRoute><AdminChat /></AdminRoute>} />
        </Routes>
      </main>
      <ChatWidget />
    </>
  )
}
