/**
 * Check if a date string (YYYY-MM-DD) is 3+ days from now in Vietnam time (UTC+7).
 * Matches the backend logic for instant booking.
 */
export function isInstantBooking(dateStr: string): boolean {
  if (!dateStr) return false
  const bookingDate = new Date(dateStr + 'T00:00:00+07:00')
  const nowVietnam = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }))
  nowVietnam.setHours(0, 0, 0, 0)
  const diffDays = Math.floor((bookingDate.getTime() - nowVietnam.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays >= 3
}
