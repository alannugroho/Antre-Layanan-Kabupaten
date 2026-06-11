# AI Project Context: Sistem Manajemen Antrean

## Project Goal
Build a full-stack queue management system for public service operations with three role experiences:
- Warga: take queue numbers and view queue progress.
- Staf Loket: call and process queue tickets.
- Admin: manage users, service categories, counters, and reports.

## Current State
- Existing files in workspace root are static HTML prototypes.
- Prototype is visually complete enough for UX direction but uses mock data and simulated actions.
- React frontend app is runnable in `frontend`.
- Node/Express backend API is runnable in `backend`.
- Backend data is currently in-memory; database integration is staged via `db/schema/schema.sql`.

## Canonical Full Structure
This workspace now includes a baseline structure for frontend, backend, and database work.

```text
web rico/
  frontend/
    README.md
    src/
      modules/
        auth/
          README.md
        warga/
          README.md
        staf/
          README.md
        admin/
          README.md

  backend/
    README.md
    src/
      modules/
        auth/
          README.md
        queue/
          README.md

  db/
    README.md
    schema/
      README.md
    migrations/
      .gitkeep
    seeds/
      .gitkeep

  infra/
    docker/
      README.md

  .env.example
  docker-compose.yml

  CONTEXT.md

  Legacy prototype pages:
    Untitled-1.html
    Warga - Landing Page Antrean.html
    Staf - Workstation Dashboard.html
    Admin - Control Panel.html
    Admin - Manajemen Akun.html
    Admin - Kategori Layanan.html
    Admin - Kategori Layanan
```

## Frontend Architecture
Suggested stack:
- React + TypeScript + Vite
- Tailwind CSS
- React Router
- TanStack Query for server state

Recommended frontend module split:
- auth: login, role bootstrap, route guards.
- warga: ticket creation, queue status, queue history.
- staf: workstation dashboard, queue actions, live ticket updates.
- admin: user management, service category settings, reports.
- shared: API client, UI components, types, constants.

Recommended route map:
- /login
- /warga
- /staf/dashboard
- /admin/dashboard
- /admin/users
- /admin/services
- /admin/reports

## Backend Architecture
Suggested stack:
- Node.js + TypeScript
- Fastify or Express
- Prisma ORM
- PostgreSQL
- JWT access token and refresh token

Suggested backend module split:
- auth: login, refresh, logout, role claims.
- users: CRUD for staff/admin users.
- services: CRUD for service categories and SLA/estimate.
- counters: counter registration and assignments.
- tickets: queue number generation and state transitions.
- queue-events: append-only timeline for auditing.
- reports: aggregates, KPIs, and export endpoints.

Minimal endpoint set:
- POST /auth/login
- POST /auth/refresh
- GET /users
- POST /users
- GET /services
- POST /services
- PATCH /services/:id
- GET /tickets/next?counterId=
- POST /tickets
- POST /tickets/:id/call
- POST /tickets/:id/recall
- POST /tickets/:id/skip
- POST /tickets/:id/complete
- GET /reports/summary
- GET /reports/history

## Database Design
Target DB: PostgreSQL.

Core tables:
- users
  - id (uuid, pk)
  - nip (varchar, unique)
  - full_name
  - email
  - password_hash
  - role (admin or staff)
  - is_active
  - created_at, updated_at

- service_categories
  - id (uuid, pk)
  - code (varchar, unique) example: A, B, C
  - name
  - description
  - estimated_minutes
  - is_active
  - created_at, updated_at

- counters
  - id (uuid, pk)
  - code (varchar, unique) example: LOKET-01
  - display_name
  - is_active
  - created_at, updated_at

- counter_services
  - counter_id (fk counters.id)
  - service_category_id (fk service_categories.id)
  - primary key (counter_id, service_category_id)

- tickets
  - id (uuid, pk)
  - ticket_number (varchar, unique) example: A-001
  - service_category_id (fk)
  - citizen_nik (varchar)
  - status (waiting, called, skipped, completed, canceled)
  - assigned_counter_id (fk counters.id, nullable)
  - called_at, completed_at
  - created_at, updated_at

- queue_events
  - id (uuid, pk)
  - ticket_id (fk tickets.id)
  - event_type (created, called, recalled, skipped, completed, canceled)
  - actor_user_id (fk users.id, nullable)
  - actor_counter_id (fk counters.id, nullable)
  - note (text, nullable)
  - created_at

## Queue Lifecycle Rules
- Ticket created in waiting state.
- Staff calls next ticket based on FIFO within service category and counter eligibility.
- Ticket may move to called, skipped, or completed.
- Each transition must insert one queue_events record.
- Reports should be derived from tickets and queue_events.

## Integration Mapping From Existing Prototype
- Untitled-1.html maps to /login.
- Warga - Landing Page Antrean.html maps to /warga.
- Staf - Workstation Dashboard.html maps to /staf/dashboard.
- Admin - Control Panel.html maps to /admin/dashboard and /admin/reports.
- Admin - Manajemen Akun.html maps to /admin/users.
- Admin - Kategori Layanan.html maps to /admin/services.

## Risks and Cleanup Items
- File named "Admin - Kategori Layanan" (without extension) is likely a duplicate legacy artifact.
- Some prototype links still point to filenames not present in root (example: login.html).
- Keep legacy pages as visual references until React pages are implemented.

## Recommended Build Sequence
1. Finalize schema in db/schema and create first migration.
2. Implement backend auth and ticket lifecycle endpoints.
3. Implement frontend auth and role-based route guards.
4. Port each prototype page into frontend modules, one role at a time.
5. Connect reports and export after queue lifecycle is stable.

## Agent Instruction
When making changes:
- Prefer editing files inside frontend, backend, db, and infra.
- Treat root HTML files as legacy references unless asked to modify prototype directly.
- Keep endpoint and table naming consistent with this document.
