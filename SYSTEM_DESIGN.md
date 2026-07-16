**Word Count: 612 words**

# System Design

## 1. Compatibility Scoring Design

The compatibility scoring engine evaluates matches between a `TenantProfile` and a `Listing` and persists the result in the `CompatibilityScore` table to avoid redundant computations per request. This unique record ensures a 1:1 mapping between a tenant and a listing. 

Scoring follows a lazy-evaluation pattern for browse operations. When a tenant views a listing (`/api/compatibility/:listingId`), `getScore` in `compatibility.controller.js` checks the database. If no score exists, it invokes `computeAndPersistScore()` to generate and save one. 

To maintain score accuracy, updates to critical data trigger asynchronous recomputations. Both `listing.service.js` and `tenantProfile.service.js` track a constant array of `MATERIAL_FIELDS` (e.g., `rent`, `location`, `intent`, `budgetMin`). When a PUT request modifies any of these fields, the service hooks into a background loop (`invalidateAndRescore` in `batchScoring.service.js`) that recalculates the `CompatibilityScore` for all associated profiles or listings, ensuring the match data remains fresh without blocking the user's API request.

## 2. LLM Integration and Fallback

The application utilizes `google/gemini-2.5-flash` via the OpenRouter API to generate intelligent, context-aware match scores. Inside `gemini.service.js`, the `getCompatibilityScore` function constructs a prompt comparing the tenant's intent, budget, and location against the listing's rent, location, and room type. The prompt mandates a strict JSON response containing an integer `score` (0-100) and a two-sentence `explanation`.

To guarantee graceful degradation and uninterrupted user experience during LLM outages or rate limits, the system implements a robust fallback mechanism. If the `fetch` call times out, returns a non-200 status, or the JSON parsing fails, `computeAndPersistScore` catches the exception and immediately defaults to `computeFallbackScore()`. This rule-based fallback evaluates budget overlap (60% weight) and location substring matches (40% weight). The resulting score is persisted to the database with the `isFallback: true` flag, allowing the React frontend to display a "(rule)" badge alongside the score, ensuring transparency.

## 3. Chat Implementation

Real-time messaging is powered by `socket.io` and orchestrated through `chat.socket.js`. The WebSocket connection is secured using a middleware that verifies JWTs from the `auth` handshake object. 

Chat access is strictly gated at the database level. Before a user can join a chat room, the `join_room` event listener queries the `InterestRequest` table using the provided `interestId`. It verifies that the authenticated user is either the `tenantId` or `ownerId` associated with the request, and crucially, that the `status` is exactly `ACCEPTED`. If these conditions fail, an `error` event is emitted back to the client.

Upon validation, the socket joins a channel named after the `interestId`. When a user fires the `send_message` event, the payload is intercepted and synchronously written to PostgreSQL via `chatService.saveMessage()`, inserting a new `ChatMessage` record. Only after a successful database commit does the server broadcast a `receive_message` event to the channel, ensuring complete data persistence and preventing ghost messages.

## 4. Notification Flow

Lifecycle emails are dispatched using the `resend` Node SDK managed within `email.service.js`. The notification flow targets critical conversion actions to keep owners and tenants engaged.

When a tenant hits the `POST /api/interests` endpoint, the `interestService` checks the pre-computed `CompatibilityScore`. If the score meets or exceeds the `SCORE_THRESHOLD` environment variable (default 80), it asynchronously triggers `sendHighCompatibilityEmail(ownerEmail, ownerName, tenantName, listingTitle, score)`. This notifies the owner immediately of a high-value lead.

Similarly, when an owner interacts with the dashboard to patch an interest request via `PATCH /api/interests/:id/accept`, the controller invokes `sendInterestAcceptedEmail`. This fire-and-forget email promise is detached from the main execution thread using `.catch(console.error)`, ensuring the HTTP response is sent to the client immediately without waiting for the SMTP network resolution.
