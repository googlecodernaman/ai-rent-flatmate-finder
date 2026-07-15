# NivasAI – AI Rent & Flatmate Finder

An AI-powered Rent & Flatmate Finder platform built as part of a placement assignment. Property owners post room listings; tenants browse them with AI-computed compatibility scores, express interest, and chat with owners once accepted.

## 🚀 Status

✅ **Backend complete — all 15 tasks done.**

### Completed Features
- **Scaffolding & Config**: Express server, centralized env validation, error handling, rate limiting.
- **Database**: 6 models (User, TenantProfile, Listing, CompatibilityScore, InterestRequest, ChatMessage) on Neon PostgreSQL via Prisma 6.
- **Auth & RBAC**: JWT register/login, role middleware (OWNER / TENANT / ADMIN).
- **Tenant Profile**: Create / read / update, one per tenant.
- **Listing Management**: Owner CRUD, photo uploads (multer), "room filled" marker.
- **Listing Browse & Filter**: Tenant view with pagination, location/budget filters.
- **AI Scoring Engine**: Gemini Flash LLM scoring (0–100) with rule-based fallback (budget 60% + location 40%). Score persisted and upserted per (tenant, listing) pair.
- **Batch Scoring & Invalidation**: Fire-and-forget triggers on profile and listing changes. Rate-limited to 4s between LLM calls.
- **Compatibility API & Ranking**: Listings ranked by compatibility score descending. Lazy-compute on demand.
- **Interest Request Flow**: PENDING → ACCEPTED → DECLINED. Duplicate and self-interest guarded.
- **Email Notifications**: Resend API — owner notified on high compatibility score; tenant notified on acceptance. Graceful no-op if key missing.
- **Real-Time Chat**: Socket.IO with JWT handshake auth. Rooms per interest. ACCEPTED-only gate. Messages persisted to DB.
- **Admin API**: Stats, paginated user/listing management, cascade delete.
- **Seed Script**: 1 admin, 3 owners, 5 tenants, 9 listings, 45 scores, 4 interests, sample chat.

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js 4 |
| Database | PostgreSQL (Neon) |
| ORM | Prisma 6 |
| AI | Google Gemini Flash (`gemini-1.5-flash`) |
| Real-Time | Socket.IO 4 |
| Email | Resend |
| Validation | Zod |
| Auth | JWT + bcryptjs |
| File Uploads | Multer (local `/uploads/`) |
| Rate Limiting | express-rate-limit |

## ⚙️ Setup

```bash
cd e:\nivasai\rent-flatmate-finder\backend
npm install
```

**`.env` (copy from `.env.example`):**
```env
DATABASE_URL="postgresql://..."        # Neon pooler connection string
JWT_SECRET="your-secret"
GEMINI_API_KEY="AIza..."               # Optional — falls back to rule-based scoring
RESEND_API_KEY="re_..."               # Optional — emails skipped if missing
EMAIL_FROM="onboarding@resend.dev"
SCORE_THRESHOLD=80                     # Min score to trigger owner email
PORT=3000
```

**Apply schema:**
```bash
npx prisma db push
```

**Seed demo data:**
```bash
npm run db:seed
# Credentials: password123 for all accounts
# Admin: admin@example.com
# Owners: rahul@example.com, priya@example.com, arjun@example.com
# Tenants: sneha@example.com, vikram@example.com, divya@example.com, rohan@example.com, aisha@example.com
```

**Start server:**
```bash
node src/server.js
# → http://localhost:3000
# → GET /api/health to verify
```

## 📡 API Overview

| Group | Base Path | Roles |
|-------|-----------|-------|
| Auth | `/api/auth` | Public |
| Tenant Profile | `/api/tenant-profile` | TENANT |
| Listings | `/api/listings` | OWNER (write), TENANT (read) |
| Compatibility | `/api/compatibility` | TENANT |
| Interests | `/api/interests` | TENANT (send), OWNER (manage) |
| Chat REST | `/api/chats` | TENANT + OWNER (ACCEPTED only) |
| Admin | `/api/admin` | ADMIN |
| Chat WebSocket | `ws://localhost:3000` | TENANT + OWNER (JWT in `auth.token`) |

Full endpoint reference: [`API_CONTRACT.md`](./API_CONTRACT.md)

## 📚 Documentation

| File | Purpose |
|------|---------|
| [`RULES.md`](./RULES.md) | Architecture boundaries and constraints |
| [`PROJECT_STATE.md`](./PROJECT_STATE.md) | Progress tracker and directory structure |
| [`API_CONTRACT.md`](./API_CONTRACT.md) | Full endpoint reference |
| [`TASKS.md`](./TASKS.md) | Task specifications and implementation notes |
| [`AI_HANDOVER.md`](./AI_HANDOVER.md) | Agent quickstart guide |
