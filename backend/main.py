from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from dotenv import load_dotenv
import stripe
import os
import json

load_dotenv()

from database import engine, Base, get_db
from models import User, Tour, Booking, BookingStatus, TransportRoute, TransportBooking
from schemas import (
    UserCreate, UserLogin, UserResponse, TokenResponse,
    TourResponse, BookingCreate, BookingResponse, BookingAdminAction,
    TransportRouteResponse, TransportBookingCreate, TransportBookingResponse,
    PaymentIntentCreate,
)
from auth import hash_password, verify_password, create_access_token, get_current_user
from email_service import (
    send_booking_submitted, send_admin_new_booking,
    send_booking_approved, send_booking_rejected, send_payment_confirmed,
)
from seed_data import seed

Base.metadata.create_all(bind=engine)
seed()

app = FastAPI(title="Vietnam Tours API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")


def require_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


# ── Auth ─────────────────────────────────────────────────────────────────

@app.post("/api/auth/register", response_model=TokenResponse)
def register(data: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=data.email,
        name=data.name,
        hashed_password=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": user.id})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@app.post("/api/auth/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": user.id})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@app.get("/api/auth/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)):
    return UserResponse.model_validate(user)


# ── Tours ────────────────────────────────────────────────────────────────

@app.get("/api/tours", response_model=list[TourResponse])
def list_tours(db: Session = Depends(get_db)):
    return db.query(Tour).all()


@app.get("/api/tours/{slug}", response_model=TourResponse)
def get_tour(slug: str, db: Session = Depends(get_db)):
    tour = db.query(Tour).filter(Tour.slug == slug).first()
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    return tour


# ── Bookings ─────────────────────────────────────────────────────────────

@app.post("/api/bookings", response_model=BookingResponse)
def create_booking(
    data: BookingCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tour = db.query(Tour).filter(Tour.id == data.tour_id).first()
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    total_price = tour.price * data.num_guests
    booking = Booking(
        user_id=user.id,
        tour_id=data.tour_id,
        start_date=data.start_date,
        num_guests=data.num_guests,
        total_price=total_price,
        status=BookingStatus.PENDING,
        comments=data.comments,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    send_booking_submitted(user.email, user.name, tour.name, data.start_date, data.num_guests, total_price)
    send_admin_new_booking(user.name, user.email, tour.name, data.start_date, data.num_guests, total_price, data.comments)

    return booking


@app.get("/api/bookings", response_model=list[BookingResponse])
def list_bookings(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bookings = (
        db.query(Booking)
        .filter(Booking.user_id == user.id)
        .order_by(Booking.created_at.desc())
        .all()
    )
    return bookings


@app.delete("/api/bookings/{booking_id}")
def cancel_booking(
    booking_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id, Booking.user_id == user.id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status in (BookingStatus.CANCELLED, BookingStatus.CONFIRMED):
        raise HTTPException(status_code=400, detail="Cannot cancel this booking")
    booking.status = BookingStatus.CANCELLED
    db.commit()
    return {"detail": "Booking cancelled"}


# ── Admin ────────────────────────────────────────────────────────────────

@app.get("/api/admin/stats")
def admin_stats(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    total_customers = db.query(User).filter(User.is_admin == False).count()
    total_bookings = db.query(Booking).count()
    pending_bookings = db.query(Booking).filter(Booking.status == BookingStatus.PENDING).count()
    approved_bookings = db.query(Booking).filter(Booking.status == BookingStatus.APPROVED).count()
    confirmed_bookings = db.query(Booking).filter(Booking.status == BookingStatus.CONFIRMED).count()

    confirmed_revenue = db.query(func.coalesce(func.sum(Booking.total_price), 0)).filter(
        Booking.status == BookingStatus.CONFIRMED
    ).scalar()

    pending_revenue = db.query(func.coalesce(func.sum(Booking.total_price), 0)).filter(
        Booking.status.in_([BookingStatus.PENDING, BookingStatus.APPROVED])
    ).scalar()

    # Upcoming tours: approved or confirmed bookings with future dates
    from datetime import datetime, timezone
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    upcoming = (
        db.query(Booking)
        .filter(Booking.start_date >= today)
        .filter(Booking.status.in_([BookingStatus.APPROVED, BookingStatus.CONFIRMED]))
        .count()
    )

    # Most popular tours
    popular = (
        db.query(
            Tour.name,
            func.count(Booking.id).label("count"),
        )
        .join(Booking, Tour.id == Booking.tour_id)
        .filter(Booking.status != BookingStatus.CANCELLED)
        .group_by(Tour.id)
        .order_by(func.count(Booking.id).desc())
        .limit(5)
        .all()
    )

    return {
        "total_customers": total_customers,
        "total_bookings": total_bookings,
        "pending_bookings": pending_bookings,
        "approved_bookings": approved_bookings,
        "confirmed_bookings": confirmed_bookings,
        "confirmed_revenue": float(confirmed_revenue),
        "pending_revenue": float(pending_revenue),
        "upcoming_tours": upcoming,
        "popular_tours": [{"name": name, "bookings": count} for name, count in popular],
    }


@app.get("/api/admin/bookings", response_model=list[BookingResponse])
def admin_list_bookings(
    status: str = None,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = db.query(Booking)
    if status:
        query = query.filter(Booking.status == status)
    return query.order_by(Booking.created_at.desc()).all()


@app.put("/api/admin/bookings/{booking_id}/approve", response_model=BookingResponse)
def approve_booking(
    booking_id: int,
    data: BookingAdminAction,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status != BookingStatus.PENDING:
        raise HTTPException(status_code=400, detail="Only pending bookings can be approved")
    booking.status = BookingStatus.APPROVED
    if data.admin_notes:
        booking.admin_notes = data.admin_notes
    db.commit()
    db.refresh(booking)

    user = db.query(User).filter(User.id == booking.user_id).first()
    tour = db.query(Tour).filter(Tour.id == booking.tour_id).first()
    if user and tour:
        send_booking_approved(user.email, user.name, tour.name, booking.id, data.admin_notes)

    return booking


@app.put("/api/admin/bookings/{booking_id}/reject", response_model=BookingResponse)
def reject_booking(
    booking_id: int,
    data: BookingAdminAction,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status != BookingStatus.PENDING:
        raise HTTPException(status_code=400, detail="Only pending bookings can be rejected")
    booking.status = BookingStatus.REJECTED
    if data.admin_notes:
        booking.admin_notes = data.admin_notes
    db.commit()
    db.refresh(booking)

    user = db.query(User).filter(User.id == booking.user_id).first()
    tour = db.query(Tour).filter(Tour.id == booking.tour_id).first()
    if user and tour:
        send_booking_rejected(user.email, user.name, tour.name, data.admin_notes)

    return booking


# ── Transport ────────────────────────────────────────────────────────────

@app.get("/api/transport", response_model=list[TransportRouteResponse])
def list_transport_routes(db: Session = Depends(get_db)):
    return db.query(TransportRoute).all()


@app.post("/api/transport/bookings", response_model=TransportBookingResponse)
def create_transport_booking(
    data: TransportBookingCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    route = db.query(TransportRoute).filter(TransportRoute.id == data.route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    total_price = route.price * data.num_passengers
    tb = TransportBooking(
        user_id=user.id,
        route_id=data.route_id,
        travel_date=data.travel_date,
        num_passengers=data.num_passengers,
        total_price=total_price,
        status=BookingStatus.PENDING,
        comments=data.comments,
        pickup_location=data.pickup_location,
    )
    db.add(tb)
    db.commit()
    db.refresh(tb)

    route_name = f"{route.origin} → {route.destination}"
    send_booking_submitted(user.email, user.name, f"Transport: {route_name}", data.travel_date, data.num_passengers, total_price)
    send_admin_new_booking(user.name, user.email, f"Transport: {route_name}", data.travel_date, data.num_passengers, total_price, data.comments)

    return tb


@app.get("/api/transport/bookings", response_model=list[TransportBookingResponse])
def list_transport_bookings(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(TransportBooking)
        .filter(TransportBooking.user_id == user.id)
        .order_by(TransportBooking.created_at.desc())
        .all()
    )


@app.delete("/api/transport/bookings/{booking_id}")
def cancel_transport_booking(
    booking_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tb = db.query(TransportBooking).filter(TransportBooking.id == booking_id, TransportBooking.user_id == user.id).first()
    if not tb:
        raise HTTPException(status_code=404, detail="Booking not found")
    if tb.status in (BookingStatus.CANCELLED, BookingStatus.CONFIRMED):
        raise HTTPException(status_code=400, detail="Cannot cancel this booking")
    tb.status = BookingStatus.CANCELLED
    db.commit()
    return {"detail": "Transport booking cancelled"}


# Admin transport bookings
@app.get("/api/admin/transport/bookings", response_model=list[TransportBookingResponse])
def admin_list_transport_bookings(
    status: str = None,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = db.query(TransportBooking)
    if status:
        query = query.filter(TransportBooking.status == status)
    return query.order_by(TransportBooking.created_at.desc()).all()


@app.put("/api/admin/transport/bookings/{booking_id}/approve", response_model=TransportBookingResponse)
def approve_transport_booking(
    booking_id: int,
    data: BookingAdminAction,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    tb = db.query(TransportBooking).filter(TransportBooking.id == booking_id).first()
    if not tb:
        raise HTTPException(status_code=404, detail="Booking not found")
    if tb.status != BookingStatus.PENDING:
        raise HTTPException(status_code=400, detail="Only pending bookings can be approved")
    tb.status = BookingStatus.APPROVED
    if data.admin_notes:
        tb.admin_notes = data.admin_notes
    db.commit()
    db.refresh(tb)

    user = db.query(User).filter(User.id == tb.user_id).first()
    route = db.query(TransportRoute).filter(TransportRoute.id == tb.route_id).first()
    if user and route:
        send_booking_approved(user.email, user.name, f"Transport: {route.origin} → {route.destination}", tb.id, data.admin_notes)

    return tb


@app.put("/api/admin/transport/bookings/{booking_id}/reject", response_model=TransportBookingResponse)
def reject_transport_booking(
    booking_id: int,
    data: BookingAdminAction,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    tb = db.query(TransportBooking).filter(TransportBooking.id == booking_id).first()
    if not tb:
        raise HTTPException(status_code=404, detail="Booking not found")
    if tb.status != BookingStatus.PENDING:
        raise HTTPException(status_code=400, detail="Only pending bookings can be rejected")
    tb.status = BookingStatus.REJECTED
    if data.admin_notes:
        tb.admin_notes = data.admin_notes
    db.commit()
    db.refresh(tb)

    user = db.query(User).filter(User.id == tb.user_id).first()
    route = db.query(TransportRoute).filter(TransportRoute.id == tb.route_id).first()
    if user and route:
        send_booking_rejected(user.email, user.name, f"Transport: {route.origin} → {route.destination}", data.admin_notes)

    return tb


# ── Stripe Payments ──────────────────────────────────────────────────────

@app.post("/api/payments/create-intent")
def create_payment_intent(
    data: PaymentIntentCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.booking_type == "transport":
        booking = db.query(TransportBooking).filter(
            TransportBooking.id == data.booking_id, TransportBooking.user_id == user.id
        ).first()
    else:
        booking = db.query(Booking).filter(
            Booking.id == data.booking_id, Booking.user_id == user.id
        ).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status != BookingStatus.APPROVED:
        raise HTTPException(status_code=400, detail="Booking must be approved before payment")

    if not stripe.api_key or stripe.api_key.startswith("sk_test_your"):
        raise HTTPException(status_code=400, detail="Stripe is not configured. Add your Stripe keys to the .env file.")

    try:
        intent = stripe.PaymentIntent.create(
            amount=int(booking.total_price * 100),  # cents
            currency="usd",
            automatic_payment_methods={"enabled": False},
            payment_method_types=["card", "klarna"],
            metadata={
                "booking_id": booking.id,
                "booking_type": data.booking_type,
                "user_id": user.id,
            },
        )
    except stripe.error.AuthenticationError:
        raise HTTPException(status_code=400, detail="Stripe is not configured. Add your Stripe keys to the .env file.")

    booking.stripe_payment_intent_id = intent.id
    db.commit()
    return {"client_secret": intent.client_secret}


@app.post("/api/payments/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except (ValueError, stripe.error.SignatureVerificationError):
        raise HTTPException(status_code=400, detail="Invalid webhook")

    if event["type"] == "payment_intent.succeeded":
        intent = event["data"]["object"]
        booking_id = intent["metadata"].get("booking_id")
        booking_type = intent["metadata"].get("booking_type", "tour")

        if booking_id:
            if booking_type == "transport":
                tb = db.query(TransportBooking).filter(TransportBooking.id == int(booking_id)).first()
                if tb:
                    tb.status = BookingStatus.CONFIRMED
                    db.commit()
                    user = db.query(User).filter(User.id == tb.user_id).first()
                    route = db.query(TransportRoute).filter(TransportRoute.id == tb.route_id).first()
                    if user and route:
                        send_payment_confirmed(user.email, user.name, f"{route.origin} → {route.destination}", tb.travel_date, tb.num_passengers, tb.total_price)
            else:
                booking = db.query(Booking).filter(Booking.id == int(booking_id)).first()
                if booking:
                    booking.status = BookingStatus.CONFIRMED
                    db.commit()
                    user = db.query(User).filter(User.id == booking.user_id).first()
                    tour = db.query(Tour).filter(Tour.id == booking.tour_id).first()
                    if user and tour:
                        send_payment_confirmed(user.email, user.name, tour.name, booking.start_date, booking.num_guests, booking.total_price)

    return {"status": "ok"}


@app.get("/api/config/stripe")
def get_stripe_config():
    key = os.getenv("STRIPE_PUBLISHABLE_KEY", "")
    if key.startswith("pk_test_your"):
        key = ""
    return {"publishable_key": key}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
