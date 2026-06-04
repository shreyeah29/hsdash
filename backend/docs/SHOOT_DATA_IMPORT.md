# Shoot data import — schema & workflow analysis

## Phase 1: Add Shoot Details workflow

### Tables touched (manual add)

| Table | When |
|-------|------|
| `ShootCalendarEntry` | **Always** — one row per shoot day (this is what Calendar, Weddings, Dashboard, and event details use). |
| `Event` | Only when **Create deliverable timeline** is enabled (or editor assignments on create). |
| `Task` | Created with `Event` via `createEventTasksTx`. |
| `TaskActivity` / `UserNotification` | Optional, on assignment notifications. |

There is **no separate `Client` table**. Client identity lives on each `ShootCalendarEntry`:

- `clientName`, `phoneNumber`, `clientType`, `clientContact`, `city`
- `brideName`, `groomName` (wedding-style names)

There is **no separate “shoot” table** — `ShootCalendarEntry` **is** the shoot.

The optional `Event` row is post-production only. Historical calendar imports should **not** create `Event`/`Task` rows unless you explicitly enable deliverables later.

### Relationships

```
User (ADMIN) ──creates──► ShootCalendarEntry
                              │
                              └──optional──► Event ──► Task[]
```

### APIs & services (manual flow)

- `POST /production-calendar/entries` — `productionCalendar.ts`
- Mobile: `ProductionCalendarRepository.createEntry(ShootFormData)`
- Shared create path (import + API): `createShootCalendarEntryTx()` in `shootCalendarEntryService.ts`

### Where imported rows appear (no UI changes)

Any screen that reads `GET /production-calendar/entries` automatically includes imported rows:

- Dashboard / upcoming shoots
- Calendar month view
- Weddings archive
- Shoot event details
- Client autocomplete / history
- Reports / export

---

## Phase 2: Import engine

### Commands

```bash
cd backend
npm run import-data -- imports/MASTER-CALENDAR-2025-JMD.xlsx
npm run import-data -- imports/2024-data.csv
```

### Files

- `src/services/importService.ts` — orchestration, dedup, batch insert
- `src/services/import/spreadsheetParser.ts` — xlsx / xls / csv
- `src/services/import/importRowMapper.ts` — column mapping, dates, validation
- `src/services/shootCalendarEntryService.ts` — same insert shape as Add Shoot Details
- `scripts/importData.ts` — CLI entry

### Client deduplication

1. **Real phone** (8–15 digits) from `Phone`, `Phone Number`, or numeric `Client contact` → primary key `phone:{digits}`.
2. **No phone** (e.g. 2025 master Excel) → stable `legacy:{normalized-client-name}` stored in `phoneNumber`, with a warning in logs. Rows for the same name reuse contact / city / type from the first imported or existing row.

### Duplicate events

Skipped when the same **client key + day + event name** already exists in the file or database.

### 2025 master file columns

Mapped from sheet columns (trailing spaces trimmed):

| Excel | App field |
|-------|-----------|
| CLIENT NAME | `clientName` |
| TYPE | `clientType` (HSP, SLK, …) |
| EVENT | `eventName` |
| CITY | `city` |
| VENUE | `venue` |
| DATE | `day` (sheet `JAN 25` → year 2025) |
| TEAM - PHOTO | `photoTeam` |
| TEAM - VIDEO | `videoTeam` |
| START / END TIME | `startTime` / `endTime` |
| ADD ON / DELIVERABLE COMMITMENT | `addons` |

Rows inherit **date** and **client name** from the previous row when blank (multi-line events in the sheet).

### Deploy

Ensure `DATABASE_URL` points at your DB, then:

```bash
npm run import-data -- imports/MASTER-CALENDAR-2025-JMD.xlsx
```
