# Clinic OS — Doctor's Appointment & Scheduling System

A full-stack web application for managing clinic appointments, patients, and doctor schedules.

## Project Structure

```
clinic-os/
├── backend/        ← Express + Supabase REST API
└── frontend/       ← React + Vite SPA
```

---

## Backend Setup

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Fill in your Supabase URL, service role key, and JWT secret
```

### 3. Create database tables
Run `schema.sql` in your **Supabase SQL Editor** (Dashboard → SQL Editor → New Query).

### 4. Run the API
```bash
npm run dev       # development with nodemon
npm start         # production
```

API runs on `http://localhost:5000`

---

## Frontend Setup

### 1. Install dependencies
```bash
cd frontend
npm install
```

### 2. Configure environment (optional)
```bash
# Create frontend/.env if your backend isn't on localhost:5000
echo "VITE_API_URL=http://localhost:5000/api" > .env
```

### 3. Start the dev server
```bash
npm run dev
```

App runs on `http://localhost:3000`

---

## API Endpoints

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/api/auth/register` | Public | Register user (doctor/receptionist) |
| POST | `/api/auth/login` | Public | Login & get JWT |
| GET | `/api/auth/me` | Auth | Current user profile |
| GET | `/api/appointments` | Auth | List appointments (role-filtered) |
| GET | `/api/appointments/today` | Auth | Today's schedule |
| GET | `/api/appointments/available-slots` | Auth | Available booking slots |
| GET | `/api/appointments/stats/summary` | Auth | Dashboard stats |
| POST | `/api/appointments` | Auth | Book appointment (clash-checked) |
| PATCH | `/api/appointments/:id/status` | Auth | Cancel / complete / no-show |
| PUT | `/api/appointments/:id/reschedule` | Auth | Reschedule (clash-checked) |
| GET | `/api/patients` | Auth | List / search patients |
| POST | `/api/patients` | Auth | Create patient |
| GET | `/api/patients/:id` | Auth | Patient + appointment history |
| PUT | `/api/patients/:id` | Auth | Update patient |
| DELETE | `/api/patients/:id` | Auth | Delete patient |
| GET | `/api/doctors` | Auth | List doctors |
| GET | `/api/doctors/:id/schedule` | Auth | Doctor's weekly schedule |

---

## Roles

| Feature | Receptionist | Doctor |
|---------|-------------|--------|
| View dashboard | ✅ | ✅ |
| View appointments | ✅ All | ✅ Own only |
| Book appointments | ✅ | ❌ |
| Cancel / complete | ✅ | ✅ Own only |
| Reschedule | ✅ | ✅ Own only |
| Manage patients | ✅ Full CRUD | ✅ Read-only |
| View weekly schedule | ✅ Any doctor | ✅ Own |

---

## Tech Stack
- **Backend**: Node.js, Express 5, Supabase (PostgreSQL), JWT, bcryptjs
- **Frontend**: React 18, React Router v6, Vite, date-fns
- **Database**: PostgreSQL via Supabase with row-level clash detection
