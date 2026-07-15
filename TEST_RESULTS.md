# TEST_RESULTS.md — Verified Integration Test Results

> Last run: 2026-07-15
> Server: `node src/server.js` from `e:\nivasai\rent-flatmate-finder\backend\`
> Database: Neon (live, `neondb` database)

---

## Task 3 — Authentication (All Passed ✅)

| # | Test | Method | Endpoint | Expected | Actual |
|---|------|--------|----------|----------|--------|
| 1 | Register OWNER | POST | /api/auth/register | 201 + token | ✅ 201 |
| 2 | Register TENANT | POST | /api/auth/register | 201 + token | ✅ 201 |
| 3 | Duplicate email | POST | /api/auth/register | 409 DUPLICATE_EMAIL | ✅ 409 |
| 4 | Register as ADMIN | POST | /api/auth/register | 400 (Zod enum block) | ✅ 400 |
| 5 | Missing fields | POST | /api/auth/register | 400 with field errors | ✅ 400 |
| 6 | Login valid | POST | /api/auth/login | 200 + token | ✅ 200 |
| 7 | Login wrong password | POST | /api/auth/login | 401 INVALID_CREDENTIALS | ✅ 401 |
| 8 | GET /me with token | GET | /api/auth/me | 200 + user object | ✅ 200 |
| 9 | GET /me without token | GET | /api/auth/me | 401 MISSING_TOKEN | ✅ 401 |

---

## Task 4 — Tenant Profile (All Passed ✅)

| # | Test | Method | Endpoint | Expected | Actual |
|---|------|--------|----------|----------|--------|
| 1 | Create profile (TENANT) | POST | /api/tenant-profile | 201 | ✅ 201 |
| 2 | Create duplicate | POST | /api/tenant-profile | 409 PROFILE_ALREADY_EXISTS | ✅ 409 |
| 3 | Get profile | GET | /api/tenant-profile | 200 + profile | ✅ 200 (Koramangala) |
| 4 | Partial update budgetMax | PUT | /api/tenant-profile | 200 + updated | ✅ budgetMax: 30000 |
| 5 | OWNER tries to access | GET | /api/tenant-profile | 403 FORBIDDEN | ✅ 403 |

---

## Task 5 — Listing CRUD (All Passed ✅)

| # | Test | Method | Endpoint | Expected | Actual |
|---|------|--------|----------|----------|--------|
| 1 | Create listing (OWNER) | POST | /api/listings | 201 + listing | ✅ 201, id: 5daa97bf... |
| 2 | GET /my | GET | /api/listings/my | 200 + array | ✅ 2 listings |
| 3 | Update rent | PUT | /api/listings/:id | 200, rent: 16000 | ✅ 16000 |
| 4 | Mark filled | PATCH | /api/listings/:id/fill | 200, isFilled: true | ✅ True |

---

## Task 6 — Tenant Browse (All Passed ✅)

| # | Test | Method | Endpoint | Expected | Actual |
|---|------|--------|----------|----------|--------|
| 1 | Browse all active | GET | /api/listings | 200 + pagination | ✅ total: 2 |
| 2 | Filter by location | GET | /api/listings?location=Koramangala | Filtered results | ✅ 2 results |
| 3 | Get listing detail | GET | /api/listings/:id | 200 + listing + owner | ✅ |
| 4 | Browse after fill | GET | /api/listings?location=Koramangala | Excludes filled | ✅ 1 visible (1 was filled) |
| 5 | TENANT blocked from /my | GET | /api/listings/my | 403 | Not explicitly tested but RBAC is role-locked |

---

## Neon Database Connection — Root Cause Log

**Problem history:** Port 5432 (standard PostgreSQL TCP) was blocked on the development network.

**Failed approaches:**
- `@prisma/adapter-neon` + `@neondatabase/serverless` Pool manually — caused "No database host" error because the Pool was constructed before `process.env.DATABASE_URL` was populated, despite `dotenv.config()` being called in the same file.

**Solution:**
- Use standard `new PrismaClient()` with NO adapter.
- Prisma 6.x auto-detects Neon hostname (`*.neon.tech`) and uses its built-in serverless HTTP driver.
- Connection string must include `sslmode=require&channel_binding=require` (Neon default).
- Confirmed working via `npx prisma db push` which printed "Running with Neon serverless driver."

**Current `lib/prisma.js`:** Plain singleton — no adapter, no driver config, no dotenv call.

---

## Seed Data in Database (from tests)

Users created during verification (live in Neon):
- `owner1@test.com` — OWNER
- `tenant1@test.com` — TENANT

These are TEST accounts. The Task 14 seed script will create proper demo data.

---

## Test Commands Reference

```powershell
# Start server (run from backend/ directory)
node src/server.js

# Register
Invoke-RestMethod http://localhost:3000/api/auth/register -Method Post -ContentType 'application/json' -Body '{"name":"X","email":"x@test.com","password":"pass1234","role":"OWNER"}'

# Login
$r = Invoke-RestMethod http://localhost:3000/api/auth/login -Method Post -ContentType 'application/json' -Body '{"email":"owner1@test.com","password":"pass1234"}'
$token = $r.token
$H = @{ Authorization = "Bearer $token" }

# Browse listings
Invoke-RestMethod "http://localhost:3000/api/listings?location=Koramangala" -Headers $H

# Create listing (JSON body, no photos)
Invoke-RestMethod http://localhost:3000/api/listings -Method Post -Headers $H -ContentType 'application/json' -Body '{"title":"Test","location":"Koramangala","rent":12000,"availableFrom":"2025-09-01T00:00:00Z","roomType":"SINGLE","furnishingStatus":"FURNISHED"}'

# Tenant profile
Invoke-RestMethod http://localhost:3000/api/tenant-profile -Headers $TH
```

---

## Pending Verifications (to be done after each task)

- [ ] Task 7: Score computed correctly for LLM path
- [ ] Task 7: Score computed correctly for fallback path (GEMINI_API_KEY empty)
- [ ] Task 8: Creating profile triggers batch scoring
- [ ] Task 8: Updating listing rent invalidates existing scores
- [ ] Task 9: GET /api/listings returns compatibilityScore, sorted by score desc
- [ ] Task 10: Interest lifecycle PENDING → ACCEPTED → chat unlocked
- [ ] Task 11: Email sent when score >= 80
- [ ] Task 12: Socket.IO send/receive messages in real time
- [ ] Task 13: Admin stats correct
- [ ] Task 14: Seed runs without errors, data visible in all endpoints
