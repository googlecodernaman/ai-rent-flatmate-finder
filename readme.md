# NivasAI — Rent & Flatmate Finder

NivasAI is an AI-powered compatibility engine for the housing market. It allows owners to list rooms and properties, while tenants create looking-for-room profiles detailing their preferences and intents. The system then automatically computes a score and rank matches for every tenant-listing pair. When a strong match is found, NivasAI notifies users via email, and if an interest request is accepted, it unlocks real-time chat between the tenant and the owner.

![NivasAI — AI-ranked listings](./docs/screenshots/browse-listings.png)
*Listings ranked live by AI compatibility score — green ≥80, amber 50-79, red <50*

**Local Test Credentials (all passwords: `password123`)**
- **Admin**: `admin@example.com`
- **Owner**: `rahul@example.com`
- **Tenant**: `sneha@example.com`

---

## Tech Stack
- **Backend**: Node.js, Express
- **Frontend**: React, Vite, Tailwind CSS
- **Database**: PostgreSQL (Neon), Prisma ORM
- **WebSocket Library**: Socket.IO
- **Email Service**: Resend
- **LLM Provider / Model**: OpenRouter API / `google/gemini-2.5-flash`

---

## Setup Guide

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd rent-flatmate-finder
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Setup Environment Variables**
   Create a `.env` file in the `backend` directory based on `backend/.env.example` and populate it with your keys.

5. **Run Database Migrations & Seed**
   ```bash
   cd backend
   npm run db:push
   npm run db:seed
   ```
   *(The seed script populates 1 admin, 3 owners, 5 tenants, and 9 listings with pre-computed compatibility scores and chat messages).*

6. **Run Backend (includes WebSocket server on the same port)**
   ```bash
   npm run dev
   ```

7. **Run Frontend**
   Open a new terminal tab:
   ```bash
   cd frontend
   npm run dev
   ```

---

## .env.example

The application relies on the following environment variables (found in `backend/.env.example`):

```env
# Database connection strings (Neon / Supabase)
DATABASE_URL=postgresql://user:password@pooler-host:5432/dbname?sslmode=require  # Pooled connection
DIRECT_URL=postgresql://user:password@direct-host:5432/dbname?sslmode=require    # Direct connection for migrations

# Authentication Secret
JWT_SECRET=your-secret-key-change-in-production  # Secret for signing JWT tokens

# OpenRouter (LLM) API Key for compatibility scoring
OPENROUTER_API_KEY=your-openrouter-api-key  # API key for generating AI match scores

# Resend Email Configuration
RESEND_API_KEY=your-resend-api-key          # API key for sending notification emails
EMAIL_FROM=onboarding@resend.dev            # Verified sender email address

# Application Configuration
PORT=3000                                   # Backend server port
NODE_ENV=development                        # Environment type
SCORE_THRESHOLD=80                          # Minimum score to trigger email notifications
FRONTEND_URL=http://localhost:5173          # Allowed CORS origin for frontend
```

---

## API Documentation

### Auth
| Method | Endpoint | Auth | Request Body | Response | Key Errors |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/auth/register` | N | `{ name, email, password, role }` | `{ user, token }` | `409 DUPLICATE_EMAIL`, `400 VALIDATION_ERROR` |
| `POST` | `/api/auth/login` | N | `{ email, password }` | `{ user, token }` | `401 INVALID_CREDENTIALS` |
| `GET` | `/api/auth/me` | Y (Any) | - | `{ user }` | `401 UNAUTHORIZED` |

### Tenant Profile
| Method | Endpoint | Auth | Request Body | Response | Key Errors |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/tenant-profile` | Y (TENANT) | `{ intent, preferredLocation, budgetMin, budgetMax, moveInDate }` | `{ profile }` | `409 PROFILE_EXISTS` |
| `PUT` | `/api/tenant-profile` | Y (TENANT) | `{ ...fields }` | `{ profile }` | `404 PROFILE_NOT_FOUND` |
| `GET` | `/api/tenant-profile/me` | Y (TENANT) | - | `{ profile }` | `404 PROFILE_NOT_FOUND` |

### Listings
| Method | Endpoint | Auth | Request Body | Response | Key Errors |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/listings` | Y (OWNER) | `FormData` (photos, details) | `{ listing }` | `400 VALIDATION_ERROR` |
| `GET` | `/api/listings` | Y (TENANT) | `?page,limit` | `{ data, pagination }` | - |
| `GET` | `/api/listings/my` | Y (OWNER) | - | `[{ listing }]` | - |
| `GET` | `/api/listings/:id` | Y (Any) | - | `{ listing }` | `404 LISTING_NOT_FOUND` |
| `PUT` | `/api/listings/:id` | Y (OWNER) | `FormData` (photos, details) | `{ listing }` | `404 LISTING_NOT_FOUND` |
| `DELETE` | `/api/listings/:id` | Y (OWNER) | - | `204 No Content` | `404 LISTING_NOT_FOUND` |
| `PATCH` | `/api/listings/:id/fill` | Y (OWNER) | - | `{ listing }` | `404 LISTING_NOT_FOUND` |

### Interests
| Method | Endpoint | Auth | Request Body | Response | Key Errors |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/interests` | Y (TENANT) | `{ listingId }` | `{ interest }` | `409 INTEREST_EXISTS`, `410 LISTING_FILLED` |
| `GET` | `/api/interests` | Y (TENANT) | - | `[{ interest }]` | - |
| `GET` | `/api/interests/received` | Y (OWNER) | - | `[{ interest }]` | - |
| `PATCH`| `/api/interests/:id/accept`| Y (OWNER) | - | `{ interest }` | `404 INTEREST_NOT_FOUND`, `403 FORBIDDEN` |
| `PATCH`| `/api/interests/:id/decline`| Y (OWNER) | - | `{ interest }` | `404 INTEREST_NOT_FOUND`, `403 FORBIDDEN` |

### Compatibility
| Method | Endpoint | Auth | Request Body | Response | Key Errors |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/compatibility/:listingId` | Y (TENANT) | - | `{ listingId, score, explanation, isFallback, computedAt }` | `404 LISTING_NOT_FOUND`, `404 PROFILE_NOT_FOUND` |

### Chat
| Method | Endpoint | Auth | Request Body | Response | Key Errors |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/chat/:interestId` | Y (Any) | `?page,limit` | `{ data, pagination }` | `403 NOT_ACCEPTED`, `404 INTEREST_NOT_FOUND` |

### Admin
| Method | Endpoint | Auth | Request Body | Response | Key Errors |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/admin/stats` | Y (ADMIN) | - | `{ users, listings, interests, scores }` | `403 FORBIDDEN` |
| `GET` | `/api/admin/users` | Y (ADMIN) | `?page,limit` | `{ data, pagination }` | `403 FORBIDDEN` |
| `DELETE`| `/api/admin/users/:id` | Y (ADMIN) | - | `204 No Content` | `404 USER_NOT_FOUND` |
| `GET` | `/api/admin/listings` | Y (ADMIN) | `?page,limit` | `{ data, pagination }` | `403 FORBIDDEN` |

---

## Database Schema

```mermaid
erDiagram
    User {
        String id PK
        String email UK
        String passwordHash
        String name
        Enum role "ADMIN, OWNER, TENANT"
    }

    TenantProfile {
        String id PK
        String userId FK
        Enum intent "ENTIRE_PROPERTY, ROOMMATE"
        String preferredLocation
        Int budgetMin
        Int budgetMax
        DateTime moveInDate
    }

    Listing {
        String id PK
        String ownerId FK
        Enum intent "ENTIRE_PROPERTY, ROOMMATE"
        String title
        String description
        String location
        Int rent
        String[] photos
        Boolean isFilled
    }

    InterestRequest {
        String id PK
        String tenantId FK
        String listingId FK
        String ownerId FK
        Enum status "PENDING, ACCEPTED, DECLINED"
    }

    CompatibilityScore {
        String id PK
        String tenantId FK
        String listingId FK
        Int score
        String explanation
        Boolean isFallback
    }

    ChatMessage {
        String id PK
        String interestId FK
        String senderId FK
        String content
    }

    User ||--o| TenantProfile : has
    User ||--o{ Listing : creates
    User ||--o{ InterestRequest : initiates_or_receives
    Listing ||--o{ InterestRequest : receives
    InterestRequest ||--o{ ChatMessage : contains
    
    %% Explicitly requested uniqueness constraints
    TenantProfile ||--|| CompatibilityScore : "unique per pair"
    Listing ||--|| CompatibilityScore : "unique per pair"
    TenantProfile ||--|| InterestRequest : "unique per (tenant, listing)"
```

**Schema Uniqueness Constraints**:
- **TenantProfile + Listing** &rarr; **unique CompatibilityScore per pair** (avoid redundant AI scoring)
- **InterestRequest** &rarr; **unique per (tenant, listing)** (prevent duplicate requests)

---

## LLM Prompt & Example I/O

**Exact Compatibility Prompt (from `gemini.service.js`):**
```text
You are evaluating apartment rental compatibility. Respond ONLY with valid JSON matching exactly: {"score": <integer 0-100>, "explanation": "<2 sentences max>"}

TENANT PREFERENCES:
- Looking for: {tenant intent}
- Preferred location: {location}
- Budget: ₹{min}–₹{max}/month
- Move-in date: {date}

LISTING:
- Type: {listing intent}
- Title: {title}
- Location: {location}
- Rent: ₹{rent}/month
- Room type: {roomType}
- Furnishing: {furnishing}
- Available from: {date}

Score how well this listing matches the tenant's needs. 100 = perfect match, 0 = completely incompatible. Be objective. 
IMPORTANT: If the tenant is looking for an 'Entire property' and the listing is a 'Flatmate vacancy' (or vice-versa), penalize the score heavily (reduce by 40-50 points) as the primary intent does not match!
```

**Example Input:**
- **Tenant Profile**: Intent: `ROOMMATE`, Location: `Indiranagar`, Budget: `₹15000 - ₹20000`
- **Listing Input**: Intent: `ROOMMATE`, Title: `Single Room near Metro`, Location: `Indiranagar`, Rent: `₹18000`

**Example Output:**
```json
{
  "score": 95,
  "explanation": "The listing perfectly matches the tenant's intent for a flatmate vacancy and is located in the preferred Indiranagar area. Additionally, the rent of ₹18,000 falls comfortably within the tenant's specified budget range."
}
```

---

## AI Compatibility Scoring & Fallback

Compatibility scores are represented as an integer ranging from **0 to 100**, and are persisted in the database. They are **not recomputed per request**; they are lazily generated the first time a tenant views a listing (`GET /api/compatibility/:listingId`), and then cached. Background recomputations trigger only if material fields (like rent or intent) are updated.

To ensure **graceful degradation**, if the OpenRouter LLM API times out, returns an invalid format, or experiences an outage, the system immediately resorts to a rule-based **fallback** mechanism. The fallback logic checks for budget match (60% weight) and location match (40% weight). The `isFallback` boolean flag is saved to the database and surfaced to the frontend, rendering a small "(rule)" tag next to the AI badge so tenants know the score is approximated.

---

## Real-Time Chat

Real-time chat is gated strictly by the database: a tenant and owner can only connect if their `InterestRequest.status === ACCEPTED`. 

The Socket.IO implementation relies on the following events:
- `join_room`: Clients join a room uniquely identified by the `interestId`.
- `send_message`: Client emits a message to the room. The backend persists the message to the `ChatMessage` table synchronously before broadcasting.
- `receive_message`: Emitted to all clients in the room once the message is saved.
- `error`: Emitted to the sender if validation or access checks fail.

---

## Notifications

NivasAI uses **Resend** (via the `resend` Node SDK) to dispatch crucial lifecycle emails:
- `sendHighCompatibilityEmail`: An email is sent to the owner when a tenant with a compatibility score **above 80** expresses interest.
- `sendInterestAcceptedEmail`: An email is sent to the tenant when an owner **accepts** their interest request.

---

## UI Screenshots

### Authentication
![Register](./docs/screenshots/register.png)
*Role-based registration (Tenant/Owner)*

### Tenant — Browse Listings with AI Compatibility Scores
![Browse](./docs/screenshots/browse-listings.png)
*Listings ranked by AI compatibility score, color-coded badges (green ≥80, amber 50-79, red <50)*

### Tenant — Listing Detail with AI Score Explanation
![Detail](./docs/screenshots/listing-detail.png)
*AI-generated compatibility explanation and Express Interest flow*

### Owner — Create Listing
![Create Listing](./docs/screenshots/create-listing.png)
*Owner form for creating a property or flatmate listing*

### Owner — Interest Requests with Compatibility Scores
![Interests Received](./docs/screenshots/interests-received.png)
*Accept/Decline flow, triggers email notification*

### Real-Time Chat
![Chat](./docs/screenshots/chat.png)
*Live messaging via WebSocket after interest acceptance*

### Admin Dashboard
![Admin](./docs/screenshots/admin-dashboard.png)
*Platform statistics and user management*

### Email Notification Sample
![Email](./docs/screenshots/email-notification.png)
*Sample notification email for high-compatibility interest*

---

## Known Limitations / Backend Gaps

Identified for future iteration:
- **Pagination in Chat**: Chat history uses basic pagination but lacks cursor-based pagination, which is better suited for infinite scroll chat windows.
- **Image Deletion**: When an owner updates a listing and replaces photos, old photos are not purged from the local `uploads/` directory, leading to storage bloat.
- **LLM Rate Limits**: Batch scoring can occasionally hit OpenRouter rate limits. A robust queue system (e.g., BullMQ) should replace the current inline delay loop.
