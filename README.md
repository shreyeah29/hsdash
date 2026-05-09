## Wedding Production Management Dashboard

Monorepo:

- `backend/`: Express + TypeScript + Prisma + PostgreSQL (Render Postgres)
- `frontend/`: Vite + React + TypeScript + Tailwind + shadcn/ui

### Local development

#### Backend

1. Copy env:

```bash
cp backend/.env.example backend/.env
```

2. Set `DATABASE_URL` to your Postgres connection string.
3. Run migrations + seed:

```bash
cd backend
npm run prisma:migrate:dev
npm run seed
```

4. Start API:

```bash
npm run dev
```

API: `GET /health`

#### Frontend

1. Copy env:

```bash
cp frontend/.env.example frontend/.env
```

2. Start UI:

```bash
cd frontend
npm run dev
```

### Default seeded users & passwords

On **Render**, you do **not** need to run `npm run seed` manually if the database starts empty: on first startup the API creates admin + team users + a sample event/tasks.

- **Login password for every seeded account** (unless you set `SEED_DEFAULT_PASSWORD` in Render): **`ChangeMe123!`**
- To choose your own password before the first boot, set **`SEED_DEFAULT_PASSWORD`** in the backend environment (same value is used for all seeded users).

Manual re-seed (wipes users/events/tasks — use with care):

```bash
cd backend && npm run seed
```

Accounts:

- Admin: `admin@wedding.local`
- Team members:
  - `laxman@wedding.local`
  - `shashi@wedding.local`
  - `asha@wedding.local`
  - `anil@wedding.local`
  - `emmanuel@wedding.local`
  - `venkatesh@wedding.local`
  - `ravindra@wedding.local`

### Render deployment

#### Backend (Render Web Service)

- **Build Command**: `cd backend && npm ci && npx prisma generate && npm run build`
- **Start Command**: `cd backend && npx prisma migrate deploy && npm run start`

Set env vars:

- `DATABASE_URL` (Render Postgres internal URL)
- `JWT_SECRET`
- `JWT_EXPIRES_IN` (optional)
- `FRONTEND_URL` (your frontend URL)
- `COOKIE_SECURE=true`
- `PORT` is provided by Render automatically (you can omit it)

#### Frontend (Render Static Site)

- **Build Command**: `cd frontend && npm i && npm run build`
- **Publish Directory**: `frontend/dist`

Env vars:

- `VITE_API_URL` = your backend base URL (e.g. `https://<your-backend>.onrender.com`)

