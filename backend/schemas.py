from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    is_admin: bool = False
    phone: str = ""
    whatsapp: str = ""
    zalo: str = ""
    nationality: str = ""

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    name: str = ""
    phone: str = ""
    whatsapp: str = ""
    zalo: str = ""
    nationality: str = ""


class ForgotPassword(BaseModel):
    email: EmailStr


class ResetPassword(BaseModel):
    token: str
    password: str


class ChangePassword(BaseModel):
    current_password: str
    new_password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TourResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: str
    highlights: Optional[str] = None
    duration: str
    price: float
    location: str
    image_url: Optional[str] = None
    max_group_size: int
    difficulty: str
    itinerary: Optional[str] = None
    included: Optional[str] = None
    not_included: Optional[str] = None

    model_config = {"from_attributes": True}


class BookingCreate(BaseModel):
    tour_id: int
    start_date: str
    num_guests: int = 1
    comments: str = ""


class BookingResponse(BaseModel):
    id: int
    tour_id: int
    start_date: str
    num_guests: int
    total_price: float
    status: str
    comments: str = ""
    admin_notes: str = ""
    stripe_payment_intent_id: Optional[str] = None
    created_at: Optional[datetime] = None
    tour: Optional[TourResponse] = None
    user: Optional[UserResponse] = None

    model_config = {"from_attributes": True}


class BookingAdminAction(BaseModel):
    admin_notes: str = ""


class TransportRouteResponse(BaseModel):
    id: int
    origin: str
    destination: str
    slug: str
    description: str
    price: float
    duration: str
    vehicle_type: str
    included: Optional[str] = None

    model_config = {"from_attributes": True}


class TransportBookingCreate(BaseModel):
    route_id: int
    travel_date: str
    num_passengers: int = 1
    comments: str = ""
    pickup_location: str = ""


class TransportBookingResponse(BaseModel):
    id: int
    route_id: int
    travel_date: str
    num_passengers: int
    total_price: float
    status: str
    comments: str = ""
    admin_notes: str = ""
    pickup_location: str = ""
    created_at: Optional[datetime] = None
    route: Optional[TransportRouteResponse] = None
    user: Optional[UserResponse] = None

    model_config = {"from_attributes": True}


class ReviewResponse(BaseModel):
    id: int
    tour_id: Optional[int] = None
    reviewer_name: str
    reviewer_country: str = ""
    rating: int
    text: str
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class PaymentIntentCreate(BaseModel):
    booking_id: int
    booking_type: str = "tour"  # "tour" or "transport"
