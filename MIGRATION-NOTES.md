# PhantomWay UI Firebase→Bridge API Migration — 2026-10-10

## What was changed

### index.html
- Removed 3 Firebase script tags:
  - `firebase-app-compat.js`
  - `firebase-firestore-compat.js`
  - `firebase-auth-compat.js`
- Added comment noting the migration

### highway.js (1323 lines)
**Removed:**
- `FIREBASE_CONFIG` (API keys, project ID, etc.)
- `firebase.initializeApp()` calls
- `firebase.auth()` — signInWithEmailAndPassword, currentUser, setPersistence
- `firebase.firestore()` — all `db.collection()` operations
- `FieldValue.serverTimestamp()` → replaced with `Date.now()` / ISO strings
- Read metering to `/metrics/reads` (disabled — no Firebase quota to track)

**Added:**
- `BridgeAPI` client object with methods for all operations
- `WIDGET_TOKEN` auth (via `?token=` URL param or `localStorage`)
- Polling replacements for all `onSnapshot` real-time listeners:
  - Messages: 5s poll + SSE
  - Presence: 15s poll
  - Typing: 5s poll
  - Tasks: 10s poll
  - Notes: 10s poll
  - Activity: 15s poll
  - DM/Nexus: 10s poll
- Simplified join flow (name-only, no Firebase Auth)

## Firestore operations replaced

| Operation | Old (Firestore) | New (Bridge API) |
|-----------|----------------|------------------|
| Read messages | `db.collection("highway_messages").onSnapshot` | `GET /api/messages?channel=room` (poll) |
| Send message | `db.collection("highway_messages").add()` | `POST /api/messages` ⚠️ |
| Read tasks | `db.collection("highway_tasks").onSnapshot` | `GET /api/tasks` (poll) |
| Add task | `db.collection("highway_tasks").add()` | `POST /api/tasks` ⚠️ |
| Update task | `db.collection("highway_tasks").doc().update()` | `POST /api/tasks/:id` ⚠️ |
| Delete task | `db.collection("highway_tasks").doc().delete()` | `POST /api/tasks/:id/delete` ⚠️ |
| Read presence | `db.collection("highway_presence").onSnapshot` | `GET /api/presence` (poll) |
| Set presence | `db.collection("highway_presence").doc().set()` | `POST /api/presence` ⚠️ |
| Read typing | `db.collection("highway_typing").onSnapshot` | `GET /api/typing` (poll) |
| Set typing | `db.collection("highway_typing").doc().set()` | `POST /api/typing` ⚠️ |
| Read notes | `db.collection("highway_notes").doc().onSnapshot` | `GET /api/notes` (poll) |
| Save notes | `db.collection("highway_notes").doc().set()` | `POST /api/notes` ⚠️ |
| Read activity | `db.collection("highway_activity").onSnapshot` | `GET /api/activity` (poll) |
| Log activity | `db.collection("highway_activity").add()` | `POST /api/activity` ⚠️ |
| Read DMs | `db.collection("highway_dm").onSnapshot` | `GET /api/messages?channel=dm` (poll) |
| Send DM/image | `db.collection("highway_dm").add()` | `POST /api/messages` ⚠️ |
| Reactions | `db.runTransaction()` | ⚠️ No endpoint |
| Clear chat | `db.batch().delete()` | ⚠️ No endpoint |
| Push subs | `db.collection("highway_push_subs").doc().set()` | ⚠️ No endpoint |

⚠️ = **BLOCKER**: Bridge API has no POST endpoints (only GET). These will 404 until backend implements them.

## Blockers

### 1. Bridge API is read-only (CRITICAL)
The bridge exposes GET endpoints for all collections, but **no POST/PUT/DELETE endpoints**.
- `POST /api/messages` → 404 "Cannot POST /api/messages"
- All write operations in the UI will fail until the backend adds write endpoints.

**Required backend work:**
- `POST /api/messages` (send message)
- `POST /api/tasks` (add task)
- `POST /api/tasks/:id` (update task)
- `POST /api/tasks/:id/delete` (delete task)
- `POST /api/presence` (heartbeat)
- `POST /api/typing` (typing indicator)
- `POST /api/notes` (save notes)
- `POST /api/activity` (log activity)
- `POST /api/messages/:id/reactions` (reactions)

### 2. Auth required for reads
`GET /api/*` requires a Bearer token (WIDGET_TOKEN or MCP caller token).
- The UI reads WIDGET_TOKEN from `?token=` URL param or `localStorage`
- If not set, all API calls will 401
- **Recommendation**: Make GET endpoints public (no auth for reads), keep POST authenticated. OR provision a public read-only token.

### 3. No real-time (polling instead)
Firestore `onSnapshot` provided real-time updates. Replaced with:
- Polling (5-15s intervals per collection)
- SSE via `/api/stream` (if the bridge emits events)

This is less efficient than Firestore real-time but functional.

## Testing
- `node --check highway.js`: SYNTAX OK
- No runtime testing performed (requires backend POST endpoints and WIDGET_TOKEN)

## Files changed
- `~/workspace/money-city-ui/index.html` (removed Firebase scripts)
- `~/workspace/money-city-ui/highway.js` (migrated to BridgeAPI)

**NOT committed or pushed** — left in working tree for review per task instructions.
