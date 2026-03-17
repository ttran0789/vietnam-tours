# Travel VN Tours

Full-stack travel booking app for Vietnam tours and transportation with Stripe payments.

**Live:** https://travelvntours.com
**Admin:** tuantran2@gmail.com

## Architecture
- **Frontend**: React + TypeScript (Vite) + react-i18next + react-helmet-async at `frontend/`
- **Backend**: FastAPI + SQLAlchemy + SQLite at `backend/`
- **Auth**: JWT-based (bcrypt password hashing) with admin roles
- **Payments**: Stripe Payment Intents (card + Klarna)
- **Email**: Gmail SMTP via Google Workspace (bookings@travelvntours.com)
- **Hosting**: DigitalOcean droplet (64.225.20.106) with Docker + nginx + SSL

## Features
- Tour browsing with photo gallery, hero images, lightbox
- Transportation booking (Hanoi ↔ Ha Giang, Sapa, Ninh Binh)
- Booking approval workflow: pending → approved → payment → confirmed
- Instant booking for dates 3+ days out (Vietnam timezone UTC+7)
- Admin dashboard with stats, tour/transport booking management
- Multi-language (EN/VI/ES/DE/RU)
- Email notifications (booking submitted, approved, rejected, payment confirmed)
- Reviews/testimonials (17 seeded reviews)
- WhatsApp floating button
- Mobile responsive with hamburger nav
- SEO meta tags and Open Graph

## Development

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Edit with your keys
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

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Current user (auth required)

### Tours
- `GET /api/tours` - List all tours
- `GET /api/tours/{slug}` - Tour detail

### Tour Bookings
- `POST /api/bookings` - Create booking (auth required, auto-approves if 3+ days out)
- `GET /api/bookings` - User's bookings (auth required)
- `DELETE /api/bookings/{id}` - Cancel booking (auth required)

### Transport
- `GET /api/transport` - List transport routes
- `POST /api/transport/bookings` - Book transport (auth required)
- `GET /api/transport/bookings` - User's transport bookings (auth required)
- `DELETE /api/transport/bookings/{id}` - Cancel transport booking (auth required)

### Reviews
- `GET /api/reviews` - List reviews (optional ?tour_id= filter)

### Admin
- `GET /api/admin/stats` - Dashboard stats
- `GET /api/admin/bookings` - All tour bookings (optional ?status= filter)
- `PUT /api/admin/bookings/{id}/approve` - Approve tour booking
- `PUT /api/admin/bookings/{id}/reject` - Reject tour booking
- `GET /api/admin/transport/bookings` - All transport bookings
- `PUT /api/admin/transport/bookings/{id}/approve` - Approve transport booking
- `PUT /api/admin/transport/bookings/{id}/reject` - Reject transport booking

### Payments
- `POST /api/payments/create-intent` - Create Stripe payment intent (booking_type: "tour" or "transport")
- `POST /api/payments/webhook` - Stripe webhook handler
- `GET /api/config/stripe` - Get Stripe publishable key

## Deployment

### Production (DigitalOcean)
```bash
ssh -i "C:\Users\tuan\.ssh\digital_ocean_openssh_key" root@64.225.20.106
cd /opt/vietnam-tours && git pull
docker stop vntours-backend vntours-frontend
docker rm vntours-backend vntours-frontend
docker build -t vntours-backend ./backend
docker build -t vntours-frontend ./frontend
docker run -d --name vntours-backend --restart unless-stopped -p 8090:8000 -v /opt/vietnam-tours-data:/app/data --env-file ./backend/.env.production --network my-network --dns 8.8.8.8 vntours-backend
docker network connect bridge vntours-backend
docker run -d --name vntours-frontend --restart unless-stopped -p 3003:80 --network my-network vntours-frontend
```

### Nginx
- Config: `/etc/nginx/sites-enabled/travelvntours.com`
- SSL: Let's Encrypt auto-renew (expires 2026-06-14)
- Frontend: proxied from port 3003
- API: `/api/` proxied to port 8090

### Database
- Production DB: `/opt/vietnam-tours-data/vietnam_tours.db`
- Env file: `/opt/vietnam-tours/backend/.env.production`

## Seed Data
- 5 tours: Ha Giang Loop (4D3N, 3D2N), Big Loop (6D5N), Jeep Tour (4D3N, 3D2N)
- 6 transport routes: Hanoi ↔ Ha Giang, Hanoi ↔ Sapa, Hanoi ↔ Ninh Binh
- 17 reviews across all tours
- Admin user: tuantran2@gmail.com
