# Mobile API implementation (mirrors `API.md`)

Same backend as the web app. One module at a time.

| Module | Endpoints | Status |
|--------|-----------|--------|
| **1. Auth** | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` | Done |
| **2. Admin** | `GET /admin/overview`, `GET /admin/task-activity`, `POST /admin/clear-production-data` | Done |
| **3. Tasks** | `GET /tasks`, `PUT /tasks/:id/status`, `PUT /tasks/:id/assignee` | Done |
| **4. Notifications** | `GET /notifications`, `PATCH .../read`, `POST /read-all` | Done |
| **5. Production calendar** | entries CRUD, team-members, start-post-production, assigned | Done |
| **6. Users** | `GET/POST/PUT/DELETE /users`, reset-password | Done |
| **7. Events** | `POST /events` (+ calendar-linked deliverables) | Done |
| **8. Realtime** | Socket.IO | Done |

Repository files: `lib/data/repositories/<module>_repository.dart`
