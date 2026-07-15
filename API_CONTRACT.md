# API_CONTRACT.md — Complete API Reference

> **Ground truth for all endpoints — actual, verified implementation.**
> Base URL: `http://localhost:3000` (dev) / `https://<render-url>` (prod)
> All protected endpoints require: `Authorization: Bearer <jwt_token>`
> All responses: `Content-Type: application/json`
> All error responses: `{ "error": { "message": string, "code": string } }`

---

## Authentication — `/api/auth`

### POST /api/auth/register
Register a new user.

**Auth:** None  
**Body:**
```json
{
  "name": "string (min 2)",
  "email": "string (valid email)",
  "password": "string (min 8)",
  "role": "OWNER | TENANT"
}
```
**Success 201:**
```json
{
  "user": { "id": "uuid", "name": "string", "email": "string", "role": "OWNER|TENANT", "createdAt": "ISO8601" },
  "token": "jwt_string"
}
```
**Errors:**
- `400` — Validation failure (missing/invalid fields, role=ADMIN)
- `409 DUPLICATE_EMAIL` — Email already registered

---

### POST /api/auth/login
**Auth:** None  
**Body:** `{ "email": "string", "password": "string" }`  
**Success 200:** Same shape as register  
**Errors:**
- `400` — Missing fields
- `401 INVALID_CREDENTIALS` — Wrong email or password

---

### GET /api/auth/me
Get current user profile.  
**Auth:** JWT  
**Success 200:** `{ "id", "name", "email", "role", "createdAt" }`  
**Errors:** `401 MISSING_TOKEN`, `401 INVALID_TOKEN`

---

## Tenant Profile — `/api/tenant-profile`

> All routes require: JWT + role=TENANT

### POST /api/tenant-profile
Create profile (one per tenant).

**Body:**
```json
{
  "preferredLocation": "string (min 2)",
  "budgetMin": 10000,
  "budgetMax": 25000,
  "moveInDate": "2025-08-01T00:00:00Z"
}
```
**Success 201:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "preferredLocation": "Koramangala",
  "budgetMin": 10000,
  "budgetMax": 25000,
  "moveInDate": "ISO8601",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```
**Errors:** `400` validation, `409 PROFILE_ALREADY_EXISTS`

---

### GET /api/tenant-profile
Get own profile.  
**Success 200:** Profile object (same shape as create response)  
**Errors:** `404 PROFILE_NOT_FOUND`

---

### PUT /api/tenant-profile
Partial update.  
**Body:** Any subset of: `{ preferredLocation, budgetMin, budgetMax, moveInDate }`  
**Constraint:** At least one field required. `budgetMin ≤ budgetMax` enforced with existing values.  
**Success 200:** Updated profile object  
**Errors:** `400` validation, `400 INVALID_BUDGET_RANGE`, `404 PROFILE_NOT_FOUND`

---

## Listings — `/api/listings`

### POST /api/listings
**Auth:** JWT + OWNER  
**Content-Type:** `multipart/form-data`  
**Body fields:**
```
title         string (min 3, max 200)
description   string (max 2000, optional)
location      string (min 2, max 200)
rent          number (positive integer)
availableFrom ISO8601 datetime string
roomType      SINGLE | SHARED | STUDIO
furnishingStatus FURNISHED | SEMI_FURNISHED | UNFURNISHED
photos        File[] (optional, max 10, max 5MB each, jpeg/png/webp)
```
**Success 201:** Listing object (see schema below)

**Listing object:**
```json
{
  "id": "uuid",
  "ownerId": "uuid",
  "title": "string",
  "description": "string|null",
  "location": "string",
  "rent": 15000,
  "availableFrom": "ISO8601",
  "roomType": "SINGLE",
  "furnishingStatus": "FURNISHED",
  "photos": ["/uploads/uuid.jpg"],
  "isFilled": false,
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

---

### GET /api/listings/my
**Auth:** JWT + OWNER  
**Success 200:** `Listing[]` (all listings by this owner, newest first)

---

### PUT /api/listings/:id
**Auth:** JWT + OWNER (must be listing's owner)  
**Content-Type:** `multipart/form-data`  
**Body:** Any subset of listing fields. New photos are appended to existing array.  
**Success 200:** Updated Listing object  
**Errors:** `400` validation, `403 FORBIDDEN`, `404 LISTING_NOT_FOUND`

---

### DELETE /api/listings/:id
**Auth:** JWT + OWNER (must be owner)  
**Success 204:** No body  
**Errors:** `403 FORBIDDEN`, `404 LISTING_NOT_FOUND`

---

### PATCH /api/listings/:id/fill
Mark listing as filled (room taken).  
**Auth:** JWT + OWNER  
**Success 200:** Updated Listing object with `isFilled: true`  
**Errors:** `403 FORBIDDEN`, `404 LISTING_NOT_FOUND`

---

### GET /api/listings
Browse available listings.  
**Auth:** JWT + TENANT  
**Query params:**
```
location    string (case-insensitive substring match)
budgetMin   integer
budgetMax   integer
page        integer (default 1)
limit       integer (default 20, max 100)
```
**Success 200:**
```json
{
  "data": [Listing, ...],
  "pagination": { "page": 1, "limit": 20, "total": 42, "pages": 3 }
}
```
> **Note:** After Task 9, each listing will also include `"compatibilityScore": number|null`, sorted by score desc.

---

### GET /api/listings/:id
Get listing detail.  
**Auth:** JWT + TENANT  
**Success 200:** Listing object + `"owner": { "id", "name", "email" }`  
**Errors:** `404 LISTING_NOT_FOUND`, `410 LISTING_FILLED` (gone, room taken)

---

## Compatibility — `/api/compatibility` ⏳ (Task 9)

### GET /api/compatibility/:listingId
**Auth:** JWT + TENANT  
**Success 200:**
```json
{
  "score": 87,
  "explanation": "string",
  "isFallback": false,
  "computedAt": "ISO8601"
}
```
**Errors:** `404 LISTING_NOT_FOUND`, `404 PROFILE_NOT_FOUND`

---

## Interests — `/api/interests` ⏳ (Task 10)

### POST /api/interests
**Auth:** JWT + TENANT  
**Body:** `{ "listingId": "uuid" }`  
**Success 201:** `{ "id", "listingId", "ownerId", "tenantId", "status": "PENDING", "createdAt" }`  
**Errors:** `409` already expressed interest, `404` listing not found

### GET /api/interests
**Auth:** JWT + TENANT  
**Success 200:** `InterestRequest[]` with listing summary

### GET /api/interests/received
**Auth:** JWT + OWNER  
**Success 200:** `InterestRequest[]` with tenant info + compatibility score

### PATCH /api/interests/:id/accept
**Auth:** JWT + OWNER  
**Success 200:** Updated interest with `status: ACCEPTED`

### PATCH /api/interests/:id/decline
**Auth:** JWT + OWNER  
**Success 200:** Updated interest with `status: DECLINED`

---

## Chat — `/api/chats` ⏳ (Task 12)

### GET /api/chats/:interestId
Fetch message history.  
**Auth:** JWT (OWNER or TENANT of this interest)  
**Query:** `page`, `limit`  
**Success 200:** `{ data: ChatMessage[], pagination: {...} }`

**ChatMessage object:**
```json
{
  "id": "uuid",
  "interestId": "uuid",
  "senderId": "uuid",
  "content": "string",
  "createdAt": "ISO8601",
  "sender": { "id", "name", "role" }
}
```

---

## Socket.IO Events ⏳ (Task 12)

**Connection auth:** `{ auth: { token: "jwt_string" } }`

| Event | Direction | Payload |
|-------|-----------|---------|
| `join_room` | Client→Server | `{ interestId: "uuid" }` |
| `send_message` | Client→Server | `{ interestId: "uuid", content: "string" }` |
| `receive_message` | Server→Client | `ChatMessage` object |
| `error` | Server→Client | `{ message: "string", code: "string" }` |

---

## Admin — `/api/admin` ⏳ (Task 13)

> All require JWT + ADMIN role

### GET /api/admin/stats
```json
{
  "users": 10,
  "listings": 8,
  "interests": 5,
  "scores": 40
}
```

### GET /api/admin/users
Returns paginated user list.

### DELETE /api/admin/users/:id
Deletes user and all cascaded data.

### GET /api/admin/listings
Returns paginated listing list (all, including filled).

---

## Health Check

### GET /api/health
No auth required.  
**Success 200:**
```json
{
  "status": "ok",
  "timestamp": "ISO8601",
  "environment": "development"
}
```

---

## Error Code Reference

| Code | HTTP Status | Meaning |
|------|------------|---------|
| `MISSING_TOKEN` | 401 | No Authorization header |
| `INVALID_TOKEN` | 401 | JWT malformed or expired |
| `FORBIDDEN` | 403 | Role mismatch or not resource owner |
| `NOT_FOUND` | 404 | Route not found |
| `LISTING_NOT_FOUND` | 404 | Listing doesn't exist |
| `PROFILE_NOT_FOUND` | 404 | Tenant profile doesn't exist |
| `LISTING_FILLED` | 410 | Listing exists but room is taken |
| `PROFILE_ALREADY_EXISTS` | 409 | Tenant already has a profile |
| `DUPLICATE_EMAIL` | 409 | Email already registered |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `INVALID_BUDGET_RANGE` | 400 | budgetMin > budgetMax |
| `INVALID_FILE_TYPE` | 400 | Uploaded file is not jpeg/png/webp |
| `INTERNAL_ERROR` | 500 | Unhandled server error |
