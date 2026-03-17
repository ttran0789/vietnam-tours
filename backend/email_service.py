import os
import logging
import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from threading import Thread

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

logger = logging.getLogger(__name__)

GMAIL_CLIENT_ID = os.getenv("GMAIL_CLIENT_ID", "")
GMAIL_CLIENT_SECRET = os.getenv("GMAIL_CLIENT_SECRET", "")
GMAIL_REFRESH_TOKEN = os.getenv("GMAIL_REFRESH_TOKEN", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "bookings@travelvntours.com")
FROM_NAME = os.getenv("FROM_NAME", "Travel VN Tours")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "bookings@travelvntours.com")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


def _is_configured() -> bool:
    return bool(GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET and GMAIL_REFRESH_TOKEN)


def _get_gmail_service():
    creds = Credentials(
        token=None,
        refresh_token=GMAIL_REFRESH_TOKEN,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=GMAIL_CLIENT_ID,
        client_secret=GMAIL_CLIENT_SECRET,
        scopes=["https://www.googleapis.com/auth/gmail.send"],
    )
    return build("gmail", "v1", credentials=creds)


def _send_email(to_email: str, subject: str, html_body: str):
    """Send email via Gmail API in background thread. Fails silently with logging."""
    if not _is_configured():
        logger.info(f"Gmail API not configured. Would send to {to_email}: {subject}")
        return

    def _do_send():
        try:
            service = _get_gmail_service()
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{FROM_NAME} <{FROM_EMAIL}>"
            msg["To"] = to_email
            msg.attach(MIMEText(html_body, "html"))

            raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()
            service.users().messages().send(
                userId="me",
                body={"raw": raw},
            ).execute()
            logger.info(f"Email sent to {to_email}: {subject}")
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")

    Thread(target=_do_send, daemon=True).start()


def _base_template(content: str) -> str:
    return f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #0f766e;">
        <h1 style="color: #0f766e; margin: 0; font-size: 24px;">Travel VN Tours</h1>
      </div>
      <div style="padding: 30px 0;">
        {content}
      </div>
      <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #64748b; font-size: 13px;">
        <p>Travel VN Tours &mdash; Unforgettable adventures through Vietnam</p>
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


def send_welcome(user_email: str, user_name: str):
    """Welcome email when a new user registers."""
    content = f"""
    <h2 style="color: #0f766e;">Welcome to Travel VN Tours!</h2>
    <p>Hi {user_name},</p>
    <p>Thanks for creating an account. You're one step closer to an unforgettable Vietnam adventure.</p>
    <p>Here's what you can do:</p>
    <ul style="color: #1e293b; line-height: 2;">
      <li>Browse our Ha Giang Loop motorbike and jeep tours</li>
      <li>Book comfortable transportation between cities</li>
      <li>Add special requests like food restrictions or group preferences</li>
    </ul>
    <p>Have questions? Just reply to this email or message us on WhatsApp — we're always happy to help.</p>
    <p style="margin-top: 20px;">
      <a href="{FRONTEND_URL}" style="background: #0f766e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Browse Tours</a>
    </p>
    """
    _send_email(user_email, "Welcome to Travel VN Tours!", _base_template(content))
