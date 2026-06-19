# ShiftPro — מערכת ניהול משמרות

A shift management system for agencies managing OnlyFans creators. Built with React, Express, and MongoDB.

## Features

- **Dashboard** — KPI cards, quick model creation, monthly revenue goals per chatter
- **Shift Schedule** — Weekly calendar with morning (12:00-19:00) and evening (19:00-02:00) slots, model coverage tracking
- **Shift Approval** — Approve/reject pending shift requests
- **Daily Summaries** — End-of-shift reports with income breakdown (Telegram, OnlyFans, Transfers)
- **Chatters Management** — CRUD for employees with tier system (A/B/C), personal access links
- **Models Management** — CRUD for creators with platform toggles (Telegram/OnlyFans)
- **Error Log** — System error tracking with resolve workflow
- **Analytics** — Time-filtered dashboards with income stats, platform breakdown, goal progress

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 6, Tailwind CSS v4, React Router 7, Lucide Icons |
| Backend | Express 4, Mongoose 8, JWT Authentication, bcryptjs |
| Database | MongoDB |
| Language | Hebrew (RTL) |
| Theme | Dark mode |

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local, Docker, or Atlas) — falls back to in-memory if unavailable

### Installation

```bash
# Clone the repo
git clone https://github.com/eranhaim/shiftpro.git
cd shiftpro

# Install all dependencies
npm run install:all
```

### Configuration

Create `server/.env` (a default one is included):

```env
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/shiftpro
JWT_SECRET=shiftpro-secret-change-in-production-2026
```

### Seed the Database

```bash
npm run seed
```

This creates:
- Admin user: `gil@onlyelite.co.il` / `elite665`
- 17 chatters with real data
- 10 models
- Full week of shifts with assignments
- Sample daily summaries and monthly goals

### Run Development Servers

```bash
# Start both frontend and backend
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:4000

### Build for Production

```bash
cd client
npm run build
```

## Project Structure

```
shiftpro/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── analytics/     # Analytics dashboard
│   │   │   ├── approval/      # Shift approval page
│   │   │   ├── auth/          # Login page
│   │   │   ├── chatters/      # Chatters management
│   │   │   ├── dashboard/     # Main dashboard
│   │   │   ├── errors/        # Error log
│   │   │   ├── layout/        # Sidebar, mobile nav, layout shell
│   │   │   ├── models/        # Models management
│   │   │   ├── shifts/        # Shift schedule calendar
│   │   │   └── summaries/     # Daily summaries
│   │   ├── contexts/          # Auth context
│   │   └── services/          # API service layer
│   └── index.html
├── server/                    # Express backend
│   ├── models/                # Mongoose schemas (9 models)
│   ├── routes/                # API routes (9 route files)
│   ├── middleware/            # JWT auth middleware
│   ├── seed.js                # Database seeder
│   └── index.js               # Server entry point
└── package.json
```

## API Endpoints

| Route | Description |
|-------|------------|
| `POST /api/auth/login` | Login with email + password |
| `GET /api/auth/me` | Get current user |
| `GET/POST/PUT/DELETE /api/chatters` | Chatter CRUD |
| `GET/POST/PUT/DELETE /api/models` | Model CRUD |
| `GET/POST/PUT/DELETE /api/shifts` | Shift CRUD |
| `POST /api/shifts/generate-week` | Generate shifts for a week |
| `PUT /api/shifts/:id/approve` | Approve a shift |
| `PUT /api/shifts/:id/reject` | Reject a shift |
| `GET /api/shifts/pending` | Get pending shifts |
| `GET/POST/DELETE /api/shift-assignments` | Shift assignment CRUD |
| `GET/POST/PUT /api/daily-summaries` | Daily summary CRUD |
| `GET /api/daily-summaries/debts` | Shifts missing summaries |
| `GET /api/daily-summaries/income` | Income aggregation |
| `GET/POST/PUT /api/monthly-goals` | Monthly goal CRUD |
| `POST /api/monthly-goals/copy` | Copy goals from previous month |
| `GET/POST/PUT /api/errors` | Error log CRUD |
| `GET /api/analytics/overview` | Dashboard KPIs |
| `GET /api/analytics/income` | Income analytics |
| `GET /api/analytics/shifts` | Shift analytics |
