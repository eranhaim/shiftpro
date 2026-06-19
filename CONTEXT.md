# ShiftPro — Project Context for Continuation

## Background

This project was built for a client (company name: OnlyElite) who had an existing shift management app hosted at `https://shift-pro-seven.vercel.app/admin`. The original was built on Vercel with a Supabase (PostgreSQL) backend, but the client lost access to the source code. We were hired to rebuild it from scratch with the ability to modify and extend it.

## How We Reverse-Engineered the Original

Since we couldn't get the source code, we:

1. Got admin login credentials from the client: `gil@onlyelite.co.il` / `elite665`
2. Used Puppeteer to log into the live site, navigate all 9 pages, and take screenshots
3. Intercepted all 44 API calls to map out the Supabase database schema (tables, columns, relationships)
4. Extracted the full HTML structure, CSS classes (Tailwind), and navigation flow
5. Identified all features, data models, and business logic from the API responses

The screenshots and API call logs were saved to a `screenshots/` folder during exploration (since cleaned up).

## What the Client's Business Does

OnlyElite is a company that **represents and manages girls on OnlyFans**. Their workflow:
- Girls (called "מיוצגות" / models) upload content folders
- Shift workers (called "צ'אטרים" / chatters) work in shifts chatting with customers on **OnlyFans** and **Telegram**, selling the content
- The company schedules shifts, tracks income per chatter, and sets monthly revenue goals

## What Was Built

A full clone of the original app, rebuilt with a different stack:

| Original | Our Rebuild |
|----------|------------|
| Vercel + Supabase (PostgreSQL) | Vite + Express + MongoDB |
| Unknown framework (likely React/Next.js) | React 19 + Vite 6 |
| Supabase Auth | JWT + bcryptjs |
| Hosted on Vercel | Local dev (ready for any host) |

### Pages Built (8 of 9 from original)

1. **לוח בקרה (Dashboard)** — KPI cards, quick add model form, monthly goals table
2. **לוח משמרות (Shift Schedule)** — Weekly calendar, morning/evening shifts, model assignments
3. **אישור משמרות (Shift Approval)** — Approve/reject pending shift requests
4. **סיכומי יום (Daily Summaries)** — Shift summary debt tracker, income breakdown
5. **צ'אטרים (Chatters)** — Employee CRUD with tier system (A/B/C) and personal access links
6. **מיוצגות (Models)** — Creator CRUD with Telegram/OnlyFans platform toggles
7. **שגיאות (Errors)** — System error log
8. **אנליטיקס (Analytics)** — Time-filtered dashboards, income stats, goal progress

### What Was Intentionally Skipped

- **תזכורות (WhatsApp Reminders page)** — Client said don't implement yet
- **XLSX/CSV export buttons** — Client said don't implement yet
- These can be added later when the client asks for them

## Database Schema (MongoDB)

9 collections mirroring the original Supabase tables:

- `users` — Admin accounts (email, hashed password, displayName, role)
- `chatters` — Shift workers (name, phone, token for personal link, bonusTier A/B/C, lastSignInAt)
- `models` — OnlyFans girls (name, platforms { telegram, onlyfans }, active)
- `shifts` — Shift records (chatterId, date, startTime, endTime, status lifecycle)
- `shiftassignments` — Links shifts to models with platform (telegram/onlyfans)
- `dailysummaries` — End-of-shift reports with income fields (telegram, onlyfans, transfers, other, total)
- `monthlygoals` — Revenue targets per chatter per month
- `errorlogs` — System error tracking
- `activitylogs` — Audit trail

## Seed Data

Running `npm run seed` populates the database with data matching the original production site:
- 1 admin: `gil@onlyelite.co.il` / `elite665`
- 17 chatters with real names and phone numbers from the original
- 10 models with real names from the original
- 238 shifts for the current week (morning 12:00-19:00 + evening 19:00-02:00)
- 602 shift assignments (2-3 models per shift)
- 50 daily summaries with randomized income data
- 17 monthly goals with amounts matching the original

## Architecture

```
shiftpro/
├── client/                    # React + Vite frontend (port 5173)
│   ├── src/
│   │   ├── components/        # 8 page components + layout + auth
│   │   ├── contexts/          # AuthContext (JWT token in localStorage)
│   │   └── services/api.js    # 35+ API functions
│   └── vite.config.js         # Proxies /api to backend
├── server/                    # Express backend (port 4000)
│   ├── models/                # 9 Mongoose schemas
│   ├── routes/                # 9 route files with full CRUD
│   ├── middleware/auth.js     # JWT Bearer token verification
│   ├── seed-fn.js             # Reusable seed function
│   ├── seed.js                # Standalone seed script
│   └── index.js               # Entry point (falls back to in-memory MongoDB)
└── server/.env                # Not in git — PORT, MONGODB_URI, JWT_SECRET
```

## Key Technical Decisions

- **In-memory MongoDB fallback**: If no external MongoDB is available, the server auto-starts `mongodb-memory-server` and seeds data. Good for quick demos but data won't persist across restarts.
- **No .env in git**: The `.env` file is gitignored. Create `server/.env` with:
  ```
  PORT=4000
  MONGODB_URI=mongodb://127.0.0.1:27017/shiftpro
  JWT_SECRET=shiftpro-secret-change-in-production-2026
  ```
- **Hebrew RTL**: The entire UI is in Hebrew with `dir="rtl"` on the HTML element. All text is hardcoded in Hebrew.
- **Dark theme**: gray-950 base, gray-900 cards/sidebar, gray-800 borders, blue-600 accent. Matches the original.
- **Responsive**: Desktop has a right-side sidebar (RTL). Mobile has bottom nav (5 tabs) + top header.

## What the Client Will Likely Ask For Next

Based on the original app and what was skipped:
- WhatsApp reminder integration (the original had a תזכורות page with WhatsApp history)
- XLSX/CSV export for shifts and daily summaries
- Content upload/management features
- Chatter-facing app (the original had personal links with tokens for chatters to view their own shifts)
- Deployment to production (Vercel, Railway, or similar)

## How to Run

```bash
npm run install:all    # Install all dependencies
npm run seed           # Seed the database
npm run dev            # Start both servers (frontend :5173, backend :4000)
```

Login at http://localhost:5173 with `gil@onlyelite.co.il` / `elite665`
