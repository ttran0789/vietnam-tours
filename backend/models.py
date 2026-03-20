from sqlalchemy import Column, Integer, String, Float, Text, DateTime, Boolean, ForeignKey, Enum as SqlEnum
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime, timezone
import enum


class BookingStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    CONFIRMED = "confirmed"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False)
    role = Column(String, default="user")  # "user", "employee", "admin"
    phone = Column(String, default="")
    whatsapp = Column(String, default="")
    zalo = Column(String, default="")
    nationality = Column(String, default="")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    bookings = relationship("Booking", back_populates="user")


class Tour(Base):
    __tablename__ = "tours"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=False)
    highlights = Column(Text)  # JSON string of highlights
    duration = Column(String, nullable=False)  # e.g. "4 Days 3 Nights"
    price = Column(Float, nullable=False)  # USD
    location = Column(String, nullable=False)
    image_url = Column(String)
    max_group_size = Column(Integer, default=12)
    difficulty = Column(String, default="Moderate")
    itinerary = Column(Text)  # JSON string of day-by-day itinerary
    included = Column(Text)  # JSON string
    not_included = Column(Text)  # JSON string

    bookings = relationship("Booking", back_populates="tour")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    tour_id = Column(Integer, ForeignKey("tours.id"), nullable=False)
    start_date = Column(String, nullable=False)
    num_guests = Column(Integer, default=1)
    total_price = Column(Float, nullable=False)
    status = Column(String, default=BookingStatus.PENDING)
    ride_type = Column(String, default="self")  # "self" or "easy_rider"
    group_type = Column(String, default="regular")  # "regular" or "small"
    comments = Column(Text, default="")
    admin_notes = Column(Text, default="")
    stripe_payment_intent_id = Column(String)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="bookings")
    tour = relationship("Tour", back_populates="bookings")


class TransportRoute(Base):
    __tablename__ = "transport_routes"

    id = Column(Integer, primary_key=True, index=True)
    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, default="")
    price = Column(Float, nullable=False)
    duration = Column(String, nullable=False)  # e.g. "6-7 hours"
    vehicle_type = Column(String, default="Limousine Bus")  # bus, sleeper bus, private car
    included = Column(Text)  # JSON string

    transport_bookings = relationship("TransportBooking", back_populates="route")


class TransportBooking(Base):
    __tablename__ = "transport_bookings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    route_id = Column(Integer, ForeignKey("transport_routes.id"), nullable=False)
    travel_date = Column(String, nullable=False)
    num_passengers = Column(Integer, default=1)
    total_price = Column(Float, nullable=False)
    status = Column(String, default=BookingStatus.PENDING)
    comments = Column(Text, default="")
    admin_notes = Column(Text, default="")
    pickup_location = Column(String, default="")
    stripe_payment_intent_id = Column(String)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", backref="transport_bookings")
    route = relationship("TransportRoute", back_populates="transport_bookings")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    tour_id = Column(Integer, ForeignKey("tours.id"), nullable=True)
    reviewer_name = Column(String, nullable=False)
    reviewer_country = Column(String, default="")
    rating = Column(Integer, default=5)  # 1-5
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    tour = relationship("Tour", backref="reviews")


class TaxiBooking(Base):
    __tablename__ = "taxi_bookings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    travel_date = Column(String, nullable=False)
    num_passengers = Column(Integer, default=1)
    distance_miles = Column(Float, nullable=False)
    driving_hours = Column(Float)
    total_price = Column(Float, nullable=False)
    status = Column(String, default=BookingStatus.PENDING)
    comments = Column(Text, default="")
    admin_notes = Column(Text, default="")
    stripe_payment_intent_id = Column(String)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", backref="taxi_bookings")


class SiteConfig(Base):
    __tablename__ = "site_config"

    key = Column(String, primary_key=True)
    value = Column(String, nullable=False)


class ChatReadReceipt(Base):
    __tablename__ = "chat_read_receipts"

    conversation_id = Column(String, primary_key=True)
    read_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(String, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    sender = Column(String, nullable=False)  # "user" or "admin"
    name = Column(String, default="")
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User")
