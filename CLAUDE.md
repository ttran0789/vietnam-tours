# Vietnam Tours

Full-stack travel booking app for Vietnam tours with Stripe payments.

## Architecture
- **Frontend**: React + TypeScript (Vite) at `frontend/`
- **Backend**: FastAPI + SQLAlchemy + SQLite at `backend/`
- **Auth**: JWT-based (bcrypt password hashing)
- **Payments**: Stripe Payment Intents

## Development

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Edit with your Stripe keys
python main.py
```
API runs on http://localhost:8000

### Frontend
```bash
cd frontend
npm install
npm run dev
```
App runs on http://localhost:5173 (proxies /api to backend)

## API Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Current user (auth required)
- `GET /api/tours` - List all tours
- `GET /api/tours/{slug}` - Tour detail
- `POST /api/bookings` - Create booking (auth required)
- `GET /api/bookings` - User's bookings (auth required)
- `DELETE /api/bookings/{id}` - Cancel booking (auth required)
- `POST /api/payments/create-intent` - Create Stripe payment intent
- `POST /api/payments/webhook` - Stripe webhook handler
- `GET /api/config/stripe` - Get Stripe publishable key

## Seed Data
Database auto-seeds with 6 tours: Ha Giang Loop (4D3N & 3D2N), Sapa Trekking, Ninh Binh, Phong Nha, Mekong Delta.
