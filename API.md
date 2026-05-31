# HS Dash — API reference (web frontend)

Use this document to build the **mobile app** against the same backend as the web dashboard.

**Production API base URL:** set by your deploy (web uses `VITE_API_URL`, e.g. `https://your-api.onrender.com`).

**Local dev:** `http://localhost:4000`

---

## Authentication

All routes except `GET /health`, `POST /auth/login`, and `POST /auth/demo` require a logged-in user.

### Headers

```http
Authorization: Bearer <accessToken>
Content-Type: application/json
```

The web app stores `accessToken` from login in `localStorage` under key `hsdash_access_token`. Mobile should store it securely (Keychain / Keystore) and send it on every request.

Cookies are also set on login (`withCredentials: true` on web); **Bearer token is enough for mobile**.

### Roles

| Role | Who |
|------|-----|
| `ADMIN` | Damini — full studio control |
| `COORDINATOR` | Emmanuel — assign crew, activate deliverables |
| `EDITOR` | Photo / video / album editors — own tasks only |

---

## Quick index (endpoints used by web app)

| Method | Path | Used by | Min role |
|--------|------|---------|----------|
| `GET` | `/health` | — | public |
| `POST` | `/auth/login` | Login | public |
| `POST` | `/auth/demo` | — | public (if enabled) |
| `POST` | `/auth/logout` | Logout | any |
| `GET` | `/auth/me` | Session restore | any |
| `GET` | `/admin/overview` | Admin overview calendar | ADMIN |
| `GET` | `/admin/task-activity` | Admin notifications / activity | ADMIN |
| `POST` | `/admin/clear-production-data` | Clear all shoots | ADMIN |
| `GET` | `/production-calendar/entries` | Shoot calendar, export, coordinator | COORDINATOR, ADMIN |
| `POST` | `/production-calendar/entries` | Add shoot | ADMIN |
| `PUT` | `/production-calendar/entries/:id` | Edit shoot | ADMIN |
| `DELETE` | `/production-calendar/entries/:id` | Delete shoot | ADMIN |
| `POST` | `/production-calendar/entries/:id/start-post-production` | Activate deliverables | COORDINATOR, ADMIN |
| `GET` | `/production-calendar/team-members` | Editor roster | COORDINATOR, ADMIN |
| `GET` | `/production-calendar/entries/assigned` | — | EDITOR |
| `POST` | `/events` | Create deliverables (no calendar row) | ADMIN |
| `GET` | `/tasks` | Tasks list (all roles) | any |
| `PUT` | `/tasks/:id/status` | Mark start / done | EDITOR, COORDINATOR |
| `PUT` | `/tasks/:id/assignee` | Assign editor | COORDINATOR, ADMIN |
| `GET` | `/notifications` | Editor notifications | any |
| `PATCH` | `/notifications/:id/read` | Mark read | any |
| `POST` | `/notifications/read-all` | Mark all read | any |
| `GET` | `/users` | Team management | ADMIN |
| `POST` | `/users` | Create user | ADMIN |
| `PUT` | `/users/:id` | Update user | ADMIN |
| `POST` | `/users/:id/reset-password` | Reset password | ADMIN |
| `DELETE` | `/users/:id` | Delete user | ADMIN |

---

## Auth

### `POST /auth/login`

**Body**

```json
{
  "email": "damini@example.com",
  "password": "your-password"
}
```

**Response `200`**

```json
{
  "user": {
    "id": "cuid",
    "name": "Damini",
    "email": "damini@example.com",
    "role": "ADMIN",
    "team": null,
    "designation": null,
    "isActive": true
  },
  "accessToken": "jwt..."
}
```

**Errors:** `401` invalid credentials

---

### `POST /auth/logout`

**Response `200`**

```json
{ "ok": true }
```

---

### `GET /auth/me`

**Response `200`**

```json
{
  "user": { "id", "name", "email", "role", "team", "designation", "isActive" }
}
```

---

### `POST /auth/demo` (optional)

Only when server has `DEMO_LOGIN=true`.

**Body:** `{ "portal": "admin" | "team" }`

---

## Admin

### `GET /admin/overview`

Powers the **admin overview** (today greeting + deadline calendar).

**Response `200`**

```json
{
  "stats": {
    "dueToday": 0,
    "overdue": 5,
    "completed": 5,
    "pending": 20,
    "total": 30,
    "open": 25,
    "completionRate": 17,
    "weddings": 4,
    "eventCount": 4,
    "shootCount": 6
  },
  "tasks": [ /* Task[] — see Task shape below */ ],
  "entries": [ /* ShootCalendarEntry[] — upcoming shoots only */ ]
}
```

**Web usage:** `AdminDeliverablesCalendar.tsx` — uses `tasks` for calendar dots and today panel.

---

### `GET /admin/task-activity`

**Query:** `limit` (1–200, default 80)

**Response `200`**

```json
{
  "activities": [
    {
      "id": "cuid",
      "taskId": "cuid",
      "previousStatus": "PENDING",
      "newStatus": "IN_PROGRESS",
      "createdAt": "2026-05-29T...",
      "task": { "event": { "clientName": "..." }, ... },
      "actor": { "id", "name", "email", "team" }
    }
  ]
}
```

---

### `POST /admin/clear-production-data`

**Body**

```json
{ "confirm": "DELETE_ALL_SHOOTS" }
```

Deletes all shoots, events, tasks, notifications. Keeps users.

---

## Production calendar (shoot logistics)

Date query params use **`YYYY-MM-DD`** (calendar day in UTC storage).

### `GET /production-calendar/entries`

**Query**

| Param | Required | Description |
|-------|----------|-------------|
| `from` | yes | Start day `YYYY-MM-DD` |
| `to` | yes | End day `YYYY-MM-DD` |
| `summary` | no | `"1"` = lighter task payload |

**Response `200`**

```json
{
  "entries": [ /* ShootCalendarEntry[] */ ]
}
```

**Web usage:** Shoot calendar page, Excel export tab, coordinator dashboard.

---

### `POST /production-calendar/entries`

**Role:** ADMIN

**Body**

```json
{
  "day": "2026-05-31",
  "clientName": "Rahul & Priya",
  "clientType": "Wedding",
  "clientContact": "+91...",
  "city": "Hyderabad",
  "eventName": "Reception",
  "venue": "Taj Krishna",
  "startTime": "10:00 AM",
  "endTime": "11:00 PM",
  "photoTeam": "Team A names",
  "videoTeam": "Team B names",
  "addons": "Drone, extra album",
  "createDeliverableTimeline": false,
  "photoEditorId": "optional-user-id",
  "cinematicEditorId": "optional-user-id",
  "traditionalEditorId": "optional-user-id",
  "albumEditorId": "optional-user-id"
}
```

If `createDeliverableTimeline` is true **or** any editor ID is set, an `Event` + standard deliverable tasks are created automatically.

**Response `201`**

```json
{
  "entry": { /* ShootCalendarEntry */ },
  "assignedEditorIds": ["..."],
  "assignedEditors": [{ "id", "name", "email", "taskCount" }]
}
```

---

### `PUT /production-calendar/entries/:id`

Same fields as POST (all optional). ADMIN only.

---

### `DELETE /production-calendar/entries/:id`

ADMIN only. Deletes linked event and tasks.

**Response:** `{ "ok": true }`

---

### `POST /production-calendar/entries/:id/start-post-production`

COORDINATOR or ADMIN. Creates event + deliverable tasks for an existing shoot row.

**Body** (all optional)

```json
{
  "photoEditorIds": ["user-id"],
  "cinematicEditorIds": ["user-id"],
  "traditionalEditorIds": ["user-id"],
  "albumEditorIds": ["user-id"]
}
```

Or single IDs: `photoEditorId`, `cinematicEditorId`, etc.

**Response `201`**

```json
{ "entry": { /* ShootCalendarEntry with event.tasks */ } }
```

---

### `GET /production-calendar/team-members`

**Response `200`**

```json
{
  "users": [
    {
      "id": "cuid",
      "name": "Shashi",
      "email": "shashi@...",
      "team": "CINEMATIC_TEAM",
      "designation": "Video editor"
    }
  ]
}
```

Active editors only, sorted by team then name.

---

### `GET /production-calendar/entries/assigned`

**Role:** EDITOR — shoots where this user has assigned tasks.

**Query:** `from`, `to` (`YYYY-MM-DD`)

---

## Events (deliverables without calendar row)

### `POST /events`

**Role:** ADMIN

**Body**

```json
{
  "clientName": "Eshwar & Kshitija",
  "eventDate": "2026-02-08T00:00:00.000Z",
  "photoEditorId": "optional",
  "cinematicEditorId": "optional",
  "traditionalEditorId": "optional",
  "albumEditorId": "optional"
}
```

Creates event + full deliverable task set. Used when admin creates tasks without logging a shoot.

**Response `201`:** `{ "event": { ...tasks } }`

---

## Tasks

### `GET /tasks`

**Query (admin/coordinator only)**

| Param | Values |
|-------|--------|
| `team` | `PHOTO_TEAM`, `CINEMATIC_TEAM`, `TRADITIONAL_TEAM`, `ALBUM_TEAM`, `COORDINATOR_TEAM` |
| `status` | `PENDING`, `IN_PROGRESS`, `COMPLETED`, `DELAYED` |
| `priority` | `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` |
| `eventId` | filter by wedding |

**Editors** always get only tasks where `assignedToId === their user id` (query filters ignored).

**Response `200`**

```json
{
  "tasks": [ /* Task[] */ ]
}
```

**Web usage:** Deliverables radar, assignments board, editor tasks page, coordinator grid.

---

### `PUT /tasks/:id/status`

**Role:** EDITOR (own tasks) or COORDINATOR. **Admin cannot** update status.

**Body**

```json
{
  "status": "PENDING" | "IN_PROGRESS" | "COMPLETED"
}
```

**Response `200`:** `{ "task": { ... } }`

Server may set `DELAYED` automatically if past deadline.

---

### `PUT /tasks/:id/assignee`

**Role:** COORDINATOR or ADMIN

**Body**

```json
{
  "assignedToId": "user-id-or-null"
}
```

`DATA_COPY` tasks cannot be reassigned (fixed to coordinator SPOC).

**Response `200`:** `{ "task": { ... } }`

---

## Notifications

### `GET /notifications`

Current user's notifications (latest 80).

**Response `200`**

```json
{
  "notifications": [
    {
      "id": "cuid",
      "userId": "cuid",
      "taskId": "cuid-or-null",
      "title": "New assignment",
      "body": "...",
      "read": false,
      "createdAt": "2026-05-29T..."
    }
  ]
}
```

---

### `PATCH /notifications/:id/read`

**Response `200`:** `{ "ok": true }`

---

### `POST /notifications/read-all`

**Response `200`:** `{ "ok": true }`

---

## Users (team management)

**Role:** ADMIN only

### `GET /users`

```json
{
  "users": [ /* User + createdAt */ ],
  "taskCounts": [{ "assignedTeam": "PHOTO_TEAM", "_count": { "_all": 7 } }]
}
```

### `POST /users`

```json
{
  "name": "Asha",
  "email": "asha@...",
  "password": "min-8-chars",
  "role": "EDITOR",
  "team": "CINEMATIC_TEAM",
  "designation": "Video editor",
  "isActive": true
}
```

### `PUT /users/:id`

Partial update; include `password` to change it.

### `POST /users/:id/reset-password`

```json
{ "password": "new-min-8-chars" }
```

### `DELETE /users/:id`

Cannot delete ADMIN users.

---

## Shared data shapes

### User

```typescript
{
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "COORDINATOR" | "EDITOR";
  team: "PHOTO_TEAM" | "CINEMATIC_TEAM" | "TRADITIONAL_TEAM" | "ALBUM_TEAM" | "COORDINATOR_TEAM" | null;
  designation: string | null;
  isActive: boolean;
}
```

### Task

```typescript
{
  id: string;
  eventId: string;
  taskType: string;  // see Task types below
  assignedTeam: Team;
  deadline: string;  // ISO datetime
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "DELAYED";
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  createdAt: string;
  assignedToId?: string | null;
  assignedTo?: { id, name, email, team } | null;
  assignedBy?: { id, name, email } | null;
  event?: {
    id: string;
    clientName: string;
    eventDate: string;
    venue?: string;
    shootTime?: string;
    notes?: string;
  };
}
```

### ShootCalendarEntry

```typescript
{
  id: string;
  day: string;              // ISO datetime (UTC noon for calendar day)
  clientName: string;
  clientType: string;
  clientContact: string;
  city: string;
  eventName: string;
  venue: string;
  startTime: string;
  endTime: string;
  muhuruthamTime: string;   // DB field; not shown in web form (Excel column only)
  photoTeam: string;
  videoTeam: string;
  addons: string;
  createdById: string;
  createdBy: { id, name, email };
  eventId: string | null;
  event: null | (Event & { tasks: Task[] });
}
```

---

## Enums

### Task types (deliverables)

| `taskType` | Team | Days after event |
|------------|------|------------------|
| `DATA_COPY` | COORDINATOR_TEAM | +1 |
| `SNEAK_PEEK_PHOTOS` | PHOTO_TEAM | +7 |
| `FULL_SET_PHOTOS` | PHOTO_TEAM | +20 |
| `CINEMATIC_VIDEO` | CINEMATIC_TEAM | +20 |
| `REELS` | CINEMATIC_TEAM | +20 |
| `TRADITIONAL_VIDEO` | TRADITIONAL_TEAM | +45 |
| `ALBUM_DESIGN` | ALBUM_TEAM | +45 |
| `ALBUM_PRINT` | ALBUM_TEAM | +60 |

Legacy types may still exist on old weddings: `PREVIEW_PHOTOS`, `FULL_PHOTOS`, `CINEMATIC_HIGHLIGHT`.

Deadlines are computed from **event (shoot) date** at task creation.

---

## Realtime (Socket.IO)

Connect to the **same base URL** as the REST API.

```javascript
import { io } from "socket.io-client";

const socket = io(API_BASE_URL, {
  auth: { token: accessToken },
  transports: ["websocket", "polling"],
});
```

### Server → client events (web listens to these)

| Event | When | Mobile action |
|-------|------|---------------|
| `task:updated` | Task status/assignment changed | Refetch tasks, overview |
| `production:cleared` | Admin wiped all data | Refetch everything |
| `shoot:created` | New shoot saved | Refetch calendar + notifications |
| `assignment:updated` | Editor assigned | Refetch tasks + notifications |
| `notification:new` | New in-app notification | Refetch notifications |

---

## Health check

### `GET /health`

```json
{
  "ok": true,
  "features": { "assignmentSyncV2": true, "crewNotify": true }
}
```

---

## Error format

Typical error body:

```json
{
  "message": "Human readable message",
  "code": "ERROR_CODE"
}
```

Common HTTP status codes: `400` validation, `401` unauthenticated, `403` forbidden (wrong role), `404` not found.

---

## Mobile integration checklist

1. `POST /auth/login` → store `accessToken`
2. `GET /auth/me` on app launch if token exists
3. Route by `user.role`:
   - **ADMIN:** `GET /admin/overview`, calendar CRUD, `GET /tasks`, users
   - **COORDINATOR:** `GET /production-calendar/entries`, `GET /tasks`, assign + activate
   - **EDITOR:** `GET /tasks`, `PUT /tasks/:id/status`, `GET /notifications`
4. Connect Socket.IO with the same token for live updates
5. Send `Authorization: Bearer <token>` on every REST call

---

## Source files (web)

| Area | Frontend file |
|------|----------------|
| HTTP client | `frontend/src/services/api.ts` |
| Auth | `frontend/src/store/auth.ts`, `frontend/src/pages/LoginPage.tsx` |
| Admin overview | `frontend/src/components/admin/AdminDeliverablesCalendar.tsx` |
| Shoot calendar | `frontend/src/pages/shared/ShootCalendarPage.tsx` |
| Tasks | `frontend/src/pages/shared/TasksPage.tsx` |
| Assignments | `frontend/src/pages/shared/AssignmentsBoardPage.tsx` |
| Notifications | `frontend/src/pages/team/TeamDashboardPage.tsx` |
| Team CRUD | `frontend/src/pages/admin/TeamManagementPage.tsx` |
| Realtime | `frontend/src/routes/RealtimeSync.tsx` |
| Backend routes | `backend/src/routes/*.ts` |
