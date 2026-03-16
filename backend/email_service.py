import smtplib
import os
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from threading import Thread

logger = logging.getLogger(__name__)

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@vietnamtours.com")
FROM_NAME = os.getenv("FROM_NAME", "Vietnam Tours")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@vietnamtours.com")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


def _is_configured() -> bool:
    return bool(SMTP_HOST and SMTP_USER and SMTP_PASS)


def _send_email(to_email: str, subject: str, html_body: str):
    """Send email in background thread. Fails silently with logging."""
    if not _is_configured():
        logger.info(f"Email not configured. Would send to {to_email}: {subject}")
        return

    def _do_send():
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{FROM_NAME} <{FROM_EMAIL}>"
            msg["To"] = to_email
            msg.attach(MIMEText(html_body, "html"))

            with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
                server.starttls()
                server.login(SMTP_USER, SMTP_PASS)
                server.sendmail(FROM_EMAIL, to_email, msg.as_string())
            logger.info(f"Email sent to {to_email}: {subject}")
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")

    Thread(target=_do_send, daemon=True).start()


def _base_template(content: str) -> str:
    return f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #0f766e;">
        <h1 style="color: #0f766e; margin: 0; font-size: 24px;">Vietnam Tours</h1>
      </div>
      <div style="padding: 30px 0;">
        {content}
      </div>
      <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #64748b; font-size: 13px;">
        <p>Vietnam Tours &mdash; Unforgettable adventures through Vietnam</p>
      </div>
    </div>
    """


def send_booking_submitted(user_email: str, user_name: str, tour_name: str, start_date: str, num_guests: int, total_price: float):
    """Email to user when they submit a booking request."""
    content = f"""
    <h2 style="color: #1e293b;">Booking Request Received!</h2>
    <p>Hi {user_name},</p>
    <p>We've received your booking request and will review it shortly.</p>
    <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Tour:</strong> {tour_name}</p>
      <p style="margin: 5px 0;"><strong>Date:</strong> {start_date}</p>
      <p style="margin: 5px 0;"><strong>Guests:</strong> {num_guests}</p>
      <p style="margin: 5px 0;"><strong>Total:</strong> ${total_price:.2f}</p>
    </div>
    <p>We'll notify you once your booking is approved. No payment is required until then.</p>
    <p style="margin-top: 20px;">
      <a href="{FRONTEND_URL}/my-bookings" style="background: #0f766e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">View My Bookings</a>
    </p>
    """
    _send_email(user_email, f"Booking Request Received - {tour_name}", _base_template(content))


def send_admin_new_booking(user_name: str, user_email: str, tour_name: str, start_date: str, num_guests: int, total_price: float, comments: str):
    """Email to admin when a new booking is submitted."""
    comments_html = f'<p style="margin: 5px 0;"><strong>Comments:</strong> {comments}</p>' if comments else ""
    content = f"""
    <h2 style="color: #1e293b;">New Booking Request</h2>
    <p>A new booking request needs your review.</p>
    <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Customer:</strong> {user_name} ({user_email})</p>
      <p style="margin: 5px 0;"><strong>Tour:</strong> {tour_name}</p>
      <p style="margin: 5px 0;"><strong>Date:</strong> {start_date}</p>
      <p style="margin: 5px 0;"><strong>Guests:</strong> {num_guests}</p>
      <p style="margin: 5px 0;"><strong>Total:</strong> ${total_price:.2f}</p>
      {comments_html}
    </div>
    <p style="margin-top: 20px;">
      <a href="{FRONTEND_URL}/admin/bookings" style="background: #0f766e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Review Bookings</a>
    </p>
    """
    _send_email(ADMIN_EMAIL, f"New Booking: {tour_name} - {user_name}", _base_template(content))


def send_booking_approved(user_email: str, user_name: str, tour_name: str, booking_id: int, admin_notes: str = ""):
    """Email to user when their booking is approved."""
    notes_html = f'<p style="color: #0f766e; font-style: italic;">Admin notes: {admin_notes}</p>' if admin_notes else ""
    content = f"""
    <h2 style="color: #0f766e;">Your Booking Has Been Approved!</h2>
    <p>Hi {user_name},</p>
    <p>Great news! Your booking for <strong>{tour_name}</strong> has been approved.</p>
    {notes_html}
    <p>You can now proceed to complete your payment to confirm your spot.</p>
    <p style="margin-top: 20px;">
      <a href="{FRONTEND_URL}/payment/{booking_id}" style="background: #0f766e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Pay Now</a>
    </p>
    """
    _send_email(user_email, f"Booking Approved - {tour_name}", _base_template(content))


def send_booking_rejected(user_email: str, user_name: str, tour_name: str, admin_notes: str = ""):
    """Email to user when their booking is rejected."""
    notes_html = f'<p style="color: #64748b; font-style: italic;">Reason: {admin_notes}</p>' if admin_notes else ""
    content = f"""
    <h2 style="color: #1e293b;">Booking Update</h2>
    <p>Hi {user_name},</p>
    <p>Unfortunately, we were unable to approve your booking for <strong>{tour_name}</strong> at this time.</p>
    {notes_html}
    <p>Please feel free to browse other tours or contact us for more information.</p>
    <p style="margin-top: 20px;">
      <a href="{FRONTEND_URL}" style="background: #0f766e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Browse Tours</a>
    </p>
    """
    _send_email(user_email, f"Booking Update - {tour_name}", _base_template(content))


def send_payment_confirmed(user_email: str, user_name: str, tour_name: str, start_date: str, num_guests: int, total_price: float):
    """Email to user when payment is confirmed."""
    content = f"""
    <h2 style="color: #0f766e;">Payment Confirmed!</h2>
    <p>Hi {user_name},</p>
    <p>Your payment has been received and your tour is confirmed. Get ready for an amazing adventure!</p>
    <div style="background: #d1fae5; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Tour:</strong> {tour_name}</p>
      <p style="margin: 5px 0;"><strong>Date:</strong> {start_date}</p>
      <p style="margin: 5px 0;"><strong>Guests:</strong> {num_guests}</p>
      <p style="margin: 5px 0;"><strong>Total Paid:</strong> ${total_price:.2f}</p>
    </div>
    <p>We'll be in touch with more details as your tour date approaches.</p>
    <p style="margin-top: 20px;">
      <a href="{FRONTEND_URL}/my-bookings" style="background: #0f766e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">View My Bookings</a>
    </p>
    """
    _send_email(user_email, f"Tour Confirmed! - {tour_name}", _base_template(content))
