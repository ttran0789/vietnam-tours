from fastapi import FastAPI, Depends, HTTPException, status, Request, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from dotenv import load_dotenv
import stripe
import os
import json

load_dotenv()

from database import engine, Base, get_db
from models import User, Tour, Booking, BookingStatus, TransportRoute, TransportBooking, Review, ChatMessage, SiteConfig
from schemas import (
    UserCreate, UserLogin, UserResponse, TokenResponse,
    TourResponse, BookingCreate, BookingResponse, BookingAdminAction,
    TransportRouteResponse, TransportBookingCreate, TransportBookingResponse,
    ReviewResponse, PaymentIntentCreate,
)
from auth import hash_password, verify_password, create_access_token, get_current_user, create_reset_token, verify_reset_token
from email_service import (
    send_booking_submitted, send_admin_new_booking,
    send_booking_approved, send_booking_rejected, send_payment_confirmed,
    send_welcome, send_password_reset,
)
from schemas import ForgotPassword, ResetPassword, ChangePassword, UserUpdate
from telegram_service import notify_new_chat, send_telegram, BOT_TOKEN
from seed_data import seed

Base.metadata.create_all(bind=engine)

# Migration: add role column to existing databases
from sqlalchemy import inspect as sa_inspect, text
with engine.connect() as conn:
    cols = [c["name"] for c in sa_inspect(engine).get_columns("users")]
    if "role" not in cols:
        conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR DEFAULT 'user'"))
        conn.execute(text("UPDATE users SET role = 'admin' WHERE is_admin = 1"))
        conn.commit()

seed()

# Seed default site config
from database import SessionLocal
_db = SessionLocal()
if not _db.query(SiteConfig).filter(SiteConfig.key == "taxi_rate_per_mile").first():
    _db.add(SiteConfig(key="taxi_rate_per_mile", value="1.60"))
    _db.commit()
_db.close()

app = FastAPI(title="Vietnam Tours API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_TEST_SECRET = os.getenv("STRIPE_TEST_SECRET_KEY", "")
STRIPE_TEST_PUBLISHABLE = os.getenv("STRIPE_TEST_PUBLISHABLE_KEY", "")

# Ensure upload directory exists
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "data", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


from datetime import datetime, timezone, timedelta

VIETNAM_TZ = timezone(timedelta(hours=7))

def is_instant_booking(date_str: str) -> bool:
    """Auto-approve if booking date is 3+ days from now in Vietnam time."""
    try:
        booking_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        now_vietnam = datetime.now(VIETNAM_TZ).date()
        return (booking_date - now_vietnam).days >= 3
    except ValueError:
        return False


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role not in ("admin", "employee"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


def require_super_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Super admin access required")
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
    send_welcome(user.email, user.name)
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


@app.put("/api/auth/profile", response_model=UserResponse)
def update_profile(
    data: UserUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.name:
        user.name = data.name
    user.phone = data.phone
    user.whatsapp = data.whatsapp
    user.zalo = data.zalo
    user.nationality = data.nationality
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)


@app.post("/api/auth/forgot-password")
def forgot_password(data: ForgotPassword, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if user:
        token = create_reset_token(user.email)
        send_password_reset(user.email, user.name, token)
    # Always return success to avoid email enumeration
    return {"detail": "If an account exists with that email, a reset link has been sent."}


@app.post("/api/auth/reset-password")
def reset_password(data: ResetPassword, db: Session = Depends(get_db)):
    email = verify_reset_token(data.token)
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid reset link")
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    user.hashed_password = hash_password(data.password)
    db.commit()
    return {"detail": "Password has been reset successfully"}


@app.post("/api/auth/change-password")
def change_password(
    data: ChangePassword,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(data.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    user.hashed_password = hash_password(data.new_password)
    db.commit()
    return {"detail": "Password changed successfully"}


# ── Admin Users ──────────────────────────────────────────────────────────

@app.get("/api/admin/users")
def admin_list_users(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "name": u.name,
            "phone": u.phone or "",
            "whatsapp": u.whatsapp or "",
            "zalo": u.zalo or "",
            "nationality": u.nationality or "",
            "is_admin": u.is_admin,
            "role": u.role or ("admin" if u.is_admin else "user"),
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "tour_bookings": db.query(Booking).filter(Booking.user_id == u.id).count(),
            "transport_bookings": db.query(TransportBooking).filter(TransportBooking.user_id == u.id).count(),
        }
        for u in users
    ]


@app.put("/api/admin/users/{user_id}/role")
async def update_user_role(user_id: int, request: Request, admin: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    data = await request.json()
    role = data.get("role")
    if role not in ("user", "employee", "admin"):
        raise HTTPException(status_code=400, detail="Invalid role")
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    target.role = role
    target.is_admin = role in ("admin", "employee")
    db.commit()
    return {"detail": "Role updated", "role": target.role}


@app.get("/api/admin/upcoming")
def admin_upcoming(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    from datetime import datetime, timezone
    today = datetime.now(timezone(timedelta(hours=7))).strftime("%Y-%m-%d")

    tour_bookings = (
        db.query(Booking)
        .filter(Booking.start_date >= today)
        .filter(Booking.status.in_([BookingStatus.PENDING, BookingStatus.APPROVED, BookingStatus.CONFIRMED]))
        .order_by(Booking.start_date.asc())
        .all()
    )

    transport_bookings = (
        db.query(TransportBooking)
        .filter(TransportBooking.travel_date >= today)
        .filter(TransportBooking.status.in_([BookingStatus.PENDING, BookingStatus.APPROVED, BookingStatus.CONFIRMED]))
        .order_by(TransportBooking.travel_date.asc())
        .all()
    )

    tours = []
    for b in tour_bookings:
        user = db.query(User).filter(User.id == b.user_id).first()
        tour = db.query(Tour).filter(Tour.id == b.tour_id).first()
        tours.append({
            "id": b.id, "type": "tour", "date": b.start_date, "status": b.status,
            "num_guests": b.num_guests, "total_price": b.total_price, "comments": b.comments or "",
            "customer_name": user.name if user else "", "customer_email": user.email if user else "",
            "customer_phone": user.phone or "" if user else "", "customer_whatsapp": user.whatsapp or "" if user else "",
            "tour_name": tour.name if tour else "",
        })

    transports = []
    for b in transport_bookings:
        user = db.query(User).filter(User.id == b.user_id).first()
        route = db.query(TransportRoute).filter(TransportRoute.id == b.route_id).first()
        transports.append({
            "id": b.id, "type": "transport", "date": b.travel_date, "status": b.status,
            "num_passengers": b.num_passengers, "total_price": b.total_price,
            "comments": b.comments or "", "pickup_location": b.pickup_location or "",
            "customer_name": user.name if user else "", "customer_email": user.email if user else "",
            "customer_phone": user.phone or "" if user else "", "customer_whatsapp": user.whatsapp or "" if user else "",
            "route_name": f"{route.origin} → {route.destination}" if route else "",
            "vehicle_type": route.vehicle_type if route else "",
        })

    return {"tours": tours, "transports": transports}


# ── Admin Pricing ────────────────────────────────────────────────────────

@app.put("/api/admin/tours/{tour_id}/price")
async def update_tour_price(tour_id: int, request: Request, admin: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    data = await request.json()
    tour = db.query(Tour).filter(Tour.id == tour_id).first()
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    tour.price = float(data["price"])
    db.commit()
    return {"detail": "Price updated", "price": tour.price}


@app.put("/api/admin/transport/{route_id}/price")
async def update_transport_price(route_id: int, request: Request, admin: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    data = await request.json()
    route = db.query(TransportRoute).filter(TransportRoute.id == route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    route.price = float(data["price"])
    db.commit()
    return {"detail": "Price updated", "price": route.price}


# ── Admin Config ─────────────────────────────────────────────────────────

@app.get("/api/admin/config/{key}")
def get_config(key: str, admin: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    cfg = db.query(SiteConfig).filter(SiteConfig.key == key).first()
    if not cfg:
        raise HTTPException(status_code=404, detail="Config not found")
    return {"key": cfg.key, "value": cfg.value}


@app.put("/api/admin/config/{key}")
async def update_config(key: str, request: Request, admin: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    data = await request.json()
    cfg = db.query(SiteConfig).filter(SiteConfig.key == key).first()
    if not cfg:
        raise HTTPException(status_code=404, detail="Config not found")
    cfg.value = str(data["value"])
    db.commit()
    return {"key": cfg.key, "value": cfg.value}


# ── Private Taxi ────────────────────────────────────────────────────────

from taxi_distances import get_locations, get_distance


@app.get("/api/taxi/locations")
def taxi_locations():
    return get_locations()


@app.post("/api/taxi/quote")
async def taxi_quote(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    origin = data.get("origin", "").strip()
    destination = data.get("destination", "").strip()
    if not origin or not destination:
        raise HTTPException(status_code=400, detail="Origin and destination required")
    if origin == destination:
        raise HTTPException(status_code=400, detail="Origin and destination must be different")
    result = get_distance(origin, destination)
    if not result:
        raise HTTPException(status_code=400, detail="Route not available. Contact us for a custom quote.")
    distance_miles, driving_hours = result
    cfg = db.query(SiteConfig).filter(SiteConfig.key == "taxi_rate_per_mile").first()
    rate = float(cfg.value) if cfg else 1.60
    total_price = round(distance_miles * rate, 2)
    return {
        "origin": origin,
        "destination": destination,
        "distance_miles": distance_miles,
        "driving_hours": driving_hours,
        "rate_per_mile": rate,
        "total_price": total_price,
    }


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
    price_per_person = tour.price
    if data.ride_type == "easy_rider":
        price_per_person *= 1.2
    if data.group_type == "small":
        price_per_person *= 1.15
    total_price = price_per_person * data.num_guests

    # Add bundled transport costs
    transport_details = []
    for route_id, location, label in [
        (data.transport_to_id, data.pickup_location, "to"),
        (data.transport_from_id, data.dropoff_location, "from"),
    ]:
        if route_id:
            route = db.query(TransportRoute).filter(TransportRoute.id == route_id).first()
            if route:
                if route.vehicle_type == "Private Car":
                    transport_cost = route.price
                else:
                    transport_cost = route.price * data.num_guests
                total_price += transport_cost
                transport_details.append((route, location, label, transport_cost))

    auto_approve = is_instant_booking(data.start_date)
    status = BookingStatus.APPROVED if auto_approve else BookingStatus.PENDING
    booking = Booking(
        user_id=user.id,
        tour_id=data.tour_id,
        start_date=data.start_date,
        num_guests=data.num_guests,
        total_price=total_price,
        ride_type=data.ride_type,
        group_type=data.group_type,
        status=status,
        comments=data.comments,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    # Create bundled transport bookings (auto-confirmed with tour)
    for route, location, label, cost in transport_details:
        tb = TransportBooking(
            user_id=user.id,
            route_id=route.id,
            travel_date=data.start_date,
            num_passengers=1 if route.vehicle_type == "Private Car" else data.num_guests,
            total_price=cost,
            status=status,
            comments=f"[bundled:booking-{booking.id}]",
            pickup_location=location,
        )
        db.add(tb)
    db.commit()

    if auto_approve:
        send_booking_approved(user.email, user.name, tour.name, booking.id, "Instant booking - approved automatically")
    else:
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


# ── Reviews ──────────────────────────────────────────────────────────────

@app.get("/api/reviews", response_model=list[ReviewResponse])
def list_reviews(tour_id: int = None, db: Session = Depends(get_db)):
    query = db.query(Review)
    if tour_id:
        query = query.filter(Review.tour_id == tour_id)
    return query.order_by(Review.created_at.desc()).all()


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
    # Private cars: flat rate. Buses: per person.
    if route.vehicle_type == "Private Car":
        total_price = route.price
    else:
        total_price = route.price * data.num_passengers
    auto_approve = is_instant_booking(data.travel_date)
    tb = TransportBooking(
        user_id=user.id,
        route_id=data.route_id,
        travel_date=data.travel_date,
        num_passengers=data.num_passengers,
        total_price=total_price,
        status=BookingStatus.APPROVED if auto_approve else BookingStatus.PENDING,
        comments=data.comments,
        pickup_location=data.pickup_location,
    )
    db.add(tb)
    db.commit()
    db.refresh(tb)

    route_name = f"{route.origin} → {route.destination}"
    if auto_approve:
        send_booking_approved(user.email, user.name, f"Transport: {route_name}", tb.id, "Instant booking - approved automatically")
    else:
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


# ── Image Uploads ────────────────────────────────────────────────────────

import uuid

# Shared photo pool config
PHOTOS_DIR = os.path.join(UPLOAD_DIR, "photos")
os.makedirs(PHOTOS_DIR, exist_ok=True)
CAPTIONS_FILE = os.path.join(UPLOAD_DIR, "captions.json")


def _load_captions() -> dict:
    if os.path.exists(CAPTIONS_FILE):
        with open(CAPTIONS_FILE) as f:
            return json.load(f)
    return {}


def _save_captions(captions: dict):
    with open(CAPTIONS_FILE, "w") as f:
        json.dump(captions, f)


def _load_tour_config(tour_slug: str) -> dict:
    """Load per-tour config: which photos are enabled + disabled stock."""
    config_file = os.path.join(UPLOAD_DIR, f"{tour_slug}.json")
    if os.path.exists(config_file):
        with open(config_file) as f:
            return json.load(f)
    return {"enabled": [], "disabled_stock": [], "cover": ""}


def _save_tour_config(tour_slug: str, config: dict):
    with open(os.path.join(UPLOAD_DIR, f"{tour_slug}.json"), "w") as f:
        json.dump(config, f)


@app.post("/api/admin/upload")
async def upload_image(
    file: UploadFile = File(...),
    admin: User = Depends(require_admin),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    ext = file.filename.split(".")[-1] if file.filename and "." in file.filename else "jpg"
    filename = f"{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(PHOTOS_DIR, filename)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    return {"url": f"/api/uploads/photos/{filename}", "filename": filename, "caption": ""}


@app.get("/api/admin/photos")
def list_all_photos(admin: User = Depends(require_admin)):
    """List all uploaded photos in the shared pool."""
    if not os.path.exists(PHOTOS_DIR):
        return []
    captions = _load_captions()
    files = sorted(f for f in os.listdir(PHOTOS_DIR) if not f.startswith("."))
    return [{"url": f"/api/uploads/photos/{f}", "filename": f, "caption": captions.get(f, "")} for f in files]


@app.put("/api/admin/photos/{filename}/caption")
def update_photo_caption(filename: str, caption: str = "", admin: User = Depends(require_admin)):
    filepath = os.path.join(PHOTOS_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Photo not found")
    captions = _load_captions()
    captions[filename] = caption
    _save_captions(captions)
    return {"detail": "Caption updated"}


@app.delete("/api/admin/photos/{filename}")
def delete_photo(filename: str, admin: User = Depends(require_admin)):
    filepath = os.path.join(PHOTOS_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Photo not found")
    os.remove(filepath)
    captions = _load_captions()
    captions.pop(filename, None)
    _save_captions(captions)
    return {"detail": "Photo deleted"}


@app.get("/api/admin/tour-photos/{tour_slug}")
def get_tour_photo_config(tour_slug: str, admin: User = Depends(require_admin)):
    return _load_tour_config(tour_slug)


@app.put("/api/admin/tour-photos/{tour_slug}")
async def update_tour_photo_config(tour_slug: str, request: Request, admin: User = Depends(require_admin)):
    data = await request.json()
    _save_tour_config(tour_slug, {
        "enabled": data.get("enabled", []),
        "disabled_stock": data.get("disabled_stock", []),
        "cover": data.get("cover", ""),
    })
    return {"detail": "Tour photo config updated"}


@app.get("/api/images/{tour_slug}")
def get_tour_images(tour_slug: str):
    """Public endpoint — returns enabled uploaded + enabled stock photos for a tour."""
    config = _load_tour_config(tour_slug)
    enabled_filenames = config.get("enabled", [])
    disabled_stock = config.get("disabled_stock", [])

    captions = _load_captions()
    uploaded = [
        {"url": f"/api/uploads/photos/{f}", "filename": f, "caption": captions.get(f, "")}
        for f in enabled_filenames
        if os.path.exists(os.path.join(PHOTOS_DIR, f))
    ]

    cover = config.get("cover", "")
    cover_url = f"/api/uploads/photos/{cover}" if cover and os.path.exists(os.path.join(PHOTOS_DIR, cover)) else ""

    return {"uploaded": uploaded, "disabled_stock": disabled_stock, "cover": cover_url}


# ── Chat ─────────────────────────────────────────────────────────────────

@app.post("/api/chat/send")
async def chat_send(request: Request, db: Session = Depends(get_db)):
    """Send a chat message (from user or guest)."""
    data = await request.json()
    conversation_id = data.get("conversation_id", "")
    message_text = data.get("message", "").strip()
    name = data.get("name", "Guest")
    user_id = None

    if not message_text:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # Try to get user from token
    from fastapi.security import OAuth2PasswordBearer
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        try:
            from auth import verify_reset_token
            from jose import jwt
            token = auth_header.split(" ")[1]
            payload = jwt.decode(token, os.getenv("SECRET_KEY", "dev-secret-key-change-in-production"), algorithms=["HS256"])
            uid = int(payload.get("sub", 0))
            user = db.query(User).filter(User.id == uid).first()
            if user:
                user_id = user.id
                name = user.name
                if not conversation_id:
                    conversation_id = f"user-{user.id}"
        except Exception:
            pass

    if not conversation_id:
        import uuid as _uuid
        conversation_id = f"guest-{_uuid.uuid4().hex[:8]}"

    msg = ChatMessage(
        conversation_id=conversation_id,
        user_id=user_id,
        sender="user",
        name=name,
        message=message_text,
    )
    db.add(msg)
    db.commit()

    notify_new_chat(conversation_id, name, message_text)

    return {"conversation_id": conversation_id, "message_id": msg.id}


@app.get("/api/chat/messages/{conversation_id}")
def chat_messages(conversation_id: str, db: Session = Depends(get_db)):
    """Get messages for a conversation."""
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.conversation_id == conversation_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    return [
        {"id": m.id, "sender": m.sender, "name": m.name, "message": m.message,
         "created_at": m.created_at.isoformat() if m.created_at else None}
        for m in messages
    ]


# Admin chat endpoints
@app.get("/api/admin/chat/conversations")
def admin_conversations(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    """List all chat conversations with latest message."""
    from sqlalchemy import distinct
    conv_ids = db.query(distinct(ChatMessage.conversation_id)).all()
    conversations = []
    for (conv_id,) in conv_ids:
        last_msg = (
            db.query(ChatMessage)
            .filter(ChatMessage.conversation_id == conv_id)
            .order_by(ChatMessage.created_at.desc())
            .first()
        )
        unread = (
            db.query(ChatMessage)
            .filter(ChatMessage.conversation_id == conv_id, ChatMessage.sender == "user")
            .count()
        )
        if last_msg:
            conversations.append({
                "conversation_id": conv_id,
                "name": last_msg.name,
                "last_message": last_msg.message,
                "last_sender": last_msg.sender,
                "last_at": last_msg.created_at.isoformat() if last_msg.created_at else None,
                "total_messages": db.query(ChatMessage).filter(ChatMessage.conversation_id == conv_id).count(),
            })
    conversations.sort(key=lambda c: c["last_at"] or "", reverse=True)
    return conversations


@app.get("/api/admin/chat/unread-count")
def admin_chat_unread(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Count conversations where the last message is from a user (needs reply)."""
    from sqlalchemy import distinct
    conv_ids = db.query(distinct(ChatMessage.conversation_id)).all()
    count = 0
    for (conv_id,) in conv_ids:
        last_msg = (
            db.query(ChatMessage)
            .filter(ChatMessage.conversation_id == conv_id)
            .order_by(ChatMessage.created_at.desc())
            .first()
        )
        if last_msg and last_msg.sender != "admin":
            count += 1
    return {"unread": count}


@app.post("/api/admin/chat/reply")
async def admin_chat_reply(request: Request, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Admin sends a reply to a conversation."""
    data = await request.json()
    conversation_id = data.get("conversation_id", "")
    message_text = data.get("message", "").strip()

    if not conversation_id or not message_text:
        raise HTTPException(status_code=400, detail="Missing conversation_id or message")

    msg = ChatMessage(
        conversation_id=conversation_id,
        user_id=admin.id,
        sender="admin",
        name="Travel VN Tours",
        message=message_text,
    )
    db.add(msg)
    db.commit()

    return {"message_id": msg.id}


# Telegram webhook for admin replies
@app.post("/api/telegram/webhook")
async def telegram_webhook(request: Request, db: Session = Depends(get_db)):
    """Receive admin replies from Telegram."""
    data = await request.json()
    message = data.get("message", {})
    text = message.get("text", "")
    chat_id = str(message.get("chat", {}).get("id", ""))

    if chat_id != os.getenv("TELEGRAM_CHAT_ID", "") or not text:
        return {"ok": True}

    # Parse "#conv_id message" format
    if text.startswith("#"):
        parts = text.split(" ", 1)
        if len(parts) == 2:
            conversation_id = parts[0][1:]  # Remove #
            reply_text = parts[1]

            msg = ChatMessage(
                conversation_id=conversation_id,
                sender="admin",
                name="Travel VN Tours",
                message=reply_text,
            )
            db.add(msg)
            db.commit()

            send_telegram(f"✅ Reply sent to #{conversation_id}")

    return {"ok": True}


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

    # Use test keys for admin users
    use_test = user.is_admin and STRIPE_TEST_SECRET
    api_key = STRIPE_TEST_SECRET if use_test else stripe.api_key

    if not api_key or api_key.startswith("sk_test_your"):
        raise HTTPException(status_code=400, detail="Stripe is not configured. Add your Stripe keys to the .env file.")

    try:
        intent = stripe.PaymentIntent.create(
            amount=int(booking.total_price * 100),  # cents
            currency="usd",
            automatic_payment_methods={"enabled": False},
            payment_method_types=["card"],
            metadata={
                "booking_id": booking.id,
                "booking_type": data.booking_type,
                "user_id": user.id,
            },
            api_key=api_key,
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
    test_webhook_secret = os.getenv("STRIPE_TEST_WEBHOOK_SECRET", "")

    # Try live secret first, then test secret
    event = None
    for secret in [webhook_secret, test_webhook_secret]:
        if not secret:
            continue
        try:
            event = stripe.Webhook.construct_event(payload, sig_header, secret)
            break
        except (ValueError, stripe.error.SignatureVerificationError):
            continue

    if not event:
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
                    # Also confirm any bundled transport bookings
                    bundled = db.query(TransportBooking).filter(
                        TransportBooking.comments.contains(f"[bundled:booking-{booking.id}]"),
                    ).all()
                    for tb in bundled:
                        tb.status = BookingStatus.CONFIRMED
                    db.commit()
                    user = db.query(User).filter(User.id == booking.user_id).first()
                    tour = db.query(Tour).filter(Tour.id == booking.tour_id).first()
                    if user and tour:
                        # Build transport lines for email
                        transport_lines = []
                        for tb in bundled:
                            route = db.query(TransportRoute).filter(TransportRoute.id == tb.route_id).first()
                            if route:
                                transport_lines.append({
                                    "route": f"{route.origin} → {route.destination}",
                                    "vehicle": route.vehicle_type,
                                    "price": tb.total_price,
                                })
                        send_payment_confirmed(user.email, user.name, tour.name, booking.start_date, booking.num_guests, booking.total_price, transport_lines)

    return {"status": "ok"}


@app.get("/api/config/stripe")
def get_stripe_config(request: Request, db: Session = Depends(get_db)):
    # Check if user is admin to return test keys
    auth_header = request.headers.get("Authorization", "")
    use_test = False
    if auth_header.startswith("Bearer "):
        try:
            from jose import jwt
            token = auth_header.split(" ")[1]
            payload = jwt.decode(token, os.getenv("SECRET_KEY", "dev-secret-key-change-in-production"), algorithms=["HS256"])
            uid = int(payload.get("sub", 0))
            user = db.query(User).filter(User.id == uid).first()
            if user and user.is_admin:
                use_test = True
        except Exception:
            pass

    if use_test and STRIPE_TEST_PUBLISHABLE:
        return {"publishable_key": STRIPE_TEST_PUBLISHABLE, "test_mode": True}

    key = os.getenv("STRIPE_PUBLISHABLE_KEY", "")
    if key.startswith("pk_test_your"):
        key = ""
    return {"publishable_key": key, "test_mode": False}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
