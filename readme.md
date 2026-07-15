# NivasAI – AI Rent & Flatmate Finder

An AI-powered Rent & Flatmate Finder platform built as part of a placement assignment. It enables property owners to post room listings and tenants to browse them with an AI-computed compatibility score matching their profile.

## 🚀 Status

🚧 **Under active development**

### ✅ Completed Features (Tasks 1-9)
- **Backend Architecture & Config**: Express 5 server, centralized error handling, and environment validation.
- **Database Schema**: 6 models (User, TenantProfile, Listing, CompatibilityScore, InterestRequest, ChatMessage) using PostgreSQL (Neon) and Prisma ORM.
- **Authentication & Authorization**: JWT-based auth with RBAC (`OWNER`, `TENANT`, `ADMIN`).
- **Tenant Profile**: CRUD operations ensuring a 1-to-1 mapping for tenants.
- **Listing Management**: Owner-driven listing CRUD, photo uploads (multer), and "room filled" marking.
- **Listing Browse & Filter**: Tenant view for browsing active listings with pagination and filters (location, budget).
- **AI Scoring Engine (Gemini Flash)**: Computes a compatibility score (0-100) between a tenant's profile and a listing. Gracefully falls back to a rule-based algorithm (budget & location matching) if LLM fails or is unavailable.
- **Batch Scoring & Invalidation**: Fire-and-forget background processing triggers score re-computations when profiles or listing material fields change.
- **Compatibility API & Ranking**: Integrates compatibility scores into the tenant's browsing experience, ranking listings by score.

### ⏳ Pending Features (Tasks 10-15)
- Interest Request Flow (PENDING → ACCEPTED → DECLINED)
- Email Notifications (Resend API)
- WebSocket Real-Time Chat for accepted interests (Socket.IO)
- Admin API for stats and user management
- Seed script for demo data
- Backend Polish & Rate Limiting

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js 5
- **Database**: PostgreSQL (hosted on Neon)
- **ORM**: Prisma 6
- **AI Integration**: Google Gemini API (gemini-1.5-flash)
- **Validation**: Zod
- **Authentication**: JWT, bcryptjs
- **File Uploads**: Multer (Local File System)

## 💻 Local Setup

1. **Clone the repository** and navigate to the `backend` directory:
   ```bash
   cd e:\nivasai\rent-flatmate-finder\backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Configuration**:
   Create a `.env` file in the `backend` directory (use `.env.example` as a template):
   ```env
   DATABASE_URL="postgresql://<user>:<password>@<neon-host>/neondb?sslmode=require&channel_binding=require"
   JWT_SECRET="your-secret"
   PORT=3000
   GEMINI_API_KEY="your-gemini-key" # Optional, falls back to rule-based scoring if omitted
   ```

4. **Database Migration**:
   Apply the schema to your Neon PostgreSQL instance:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

5. **Start the Server**:
   ```bash
   npm run dev
   # or
   node src/server.js
   ```

   The server will run on `http://localhost:3000`. Test the health endpoint: `GET /api/health`.

## 📚 Documentation

Detailed documentation and task breakdowns are available in the repository root:
- [`RULES.md`](./RULES.md): Architecture boundaries and project constraints.
- [`PROJECT_STATE.md`](./PROJECT_STATE.md): Current progress and directory structure.
- [`API_CONTRACT.md`](./API_CONTRACT.md): Detailed API endpoints, request/response structures.
- [`TASKS.md`](./TASKS.md): Feature specifications.
- [`AI_HANDOVER.md`](./AI_HANDOVER.md): Quickstart guide for AI agents.
