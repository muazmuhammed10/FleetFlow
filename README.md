# FleetFlow — Secure Vehicle Rental & Fleet Management System

A complete, production-ready full-stack web application for managing vehicle rentals, fleet operations, bookings, payments, maintenance, and customer management.

> **Portfolio project** — demonstrates real-world software engineering: relational database design, REST API, role-based access control, secure authentication, business logic, automated tests, and CI/CD.

---

## Features

| Module | Highlights |
|---|---|
| **Auth** | Argon2id passwords, JWT + refresh tokens, rate limiting, password reset, audit logs |
| **Vehicles** | Full CRUD, categories, availability checking, compliance tracking |
| **Bookings** | Conflict-safe double-booking prevention (serializable transactions), full status lifecycle |
| **Pricing** | Server-side calculation only — clients cannot tamper prices |
| **Payments** | Simulated payment workflow, refunds, full transaction history |
| **Inspections** | Pre/post-rental vehicle inspection records with late-fee calculation |
| **Maintenance** | Scheduling, technician assignment, cost tracking, vehicle status management |
| **Customers** | Profile management, licence verification, IDOR-protected data access |
| **Notifications** | In-app notifications for all key events, unread count, mark-read persistence |
| **Reports** | Booking & revenue reports, CSV export with injection protection |
| **Audit Log** | Immutable log of all admin and security events |
| **Dashboards** | Role-specific stats and charts (Admin, Fleet Manager, Agent, Customer) |
| **Security** | Helmet, CORS, RBAC on every endpoint, no stack traces in prod |

---

## Technology Stack

### Backend
- **Node.js** + **Express.js** + **TypeScript**
- **Prisma ORM** → **PostgreSQL**
- **Argon2id** password hashing
- **JWT** (access + refresh tokens)
- **Zod** request validation
- **Winston** structured logging
- **Helmet** security headers
- **express-rate-limit**

### Frontend
- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** (custom design system)
- **React Router v7**
- **React Hook Form** + **Zod**
- **Recharts** analytics
- **Axios** with auto-refresh interceptor
- **Lucide React** icons

### Testing & DevOps
- **Vitest** unit & integration tests
- **Supertest** API tests
- **Docker** + **Docker Compose**
- **GitHub Actions** CI/CD
- Security scanning (Trivy + TruffleHog)

---

## Architecture

```
fleetflow/
├── backend/                 # Express API
│   ├── src/
│   │   ├── config/          # env, database, logger
│   │   ├── middleware/       # auth, validate, errorHandler, rateLimiter
│   │   ├── modules/         # feature modules (auth, vehicles, bookings, ...)
│   │   │   └── {module}/    # service, controller, routes, schemas
│   │   ├── types/           # shared TypeScript types
│   │   └── utils/           # pricing, tokens, pagination, apiResponse
│   ├── prisma/
│   │   ├── schema.prisma    # full relational schema
│   │   └── seed.ts          # development seed data
│   └── Dockerfile
├── frontend/                # React SPA
│   ├── src/
│   │   ├── api/             # typed API clients
│   │   ├── components/      # UI primitives + layout
│   │   ├── contexts/        # AuthContext
│   │   ├── pages/           # one directory per feature
│   │   ├── types/           # shared TypeScript types
│   │   └── utils/           # cn, format, pricing
│   └── Dockerfile
├── .github/workflows/       # CI/CD
├── docker-compose.yml
├── .env.example
├── SECURITY.md
└── CONTRIBUTING.md
```

---

## Prerequisites

- **Node.js** v20+
- **npm** v10+
- **PostgreSQL** 15+ (or Docker)
- Git

---

## Quick Start (Local)

### 1. Clone & configure environment

```bash
git clone https://github.com/yourname/fleetflow.git
cd fleetflow
cp .env.example .env
```

Edit `.env` — at minimum set:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/fleetflow_db"
JWT_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
JWT_REFRESH_SECRET=<another random 64-byte hex>
```

### 2. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Set up the database

Create the database in PostgreSQL:
```sql
CREATE DATABASE fleetflow_db;
CREATE USER fleetflow_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE fleetflow_db TO fleetflow_user;
```

Run migrations and seed:
```bash
cd backend
npx prisma migrate dev --name init
npm run db:seed
```

### 4. Start the servers

```bash
# Terminal 1 — Backend (http://localhost:4000)
cd backend
npm run dev

# Terminal 2 — Frontend (http://localhost:5173)
cd frontend
npm run dev
```

---

## Docker Setup

```bash
cp .env.example .env
# Edit .env with your secrets

docker compose up -d

# Run migrations inside the container
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npm run db:seed
```

Access the app at `http://localhost:5173`

### Useful Docker commands

```bash
docker compose stop          # stop containers
docker compose down          # stop and remove containers
docker compose down -v       # also remove volumes (resets database)
docker compose logs -f       # tail logs
docker compose exec backend sh   # shell into backend
```

---

## Running Tests

```bash
cd backend
npm test                     # run all tests once
npm run test:watch           # watch mode
npm run test:coverage        # with coverage report
```

**Current test results:** 13 tests passing (pricing engine, JWT tokens, booking references)

---

## API Documentation

With the backend running, Swagger UI is available at:
```
http://localhost:4000/api-docs
```

Key endpoints:

| Method | Path | Description |
|---|---|---|
| POST | /api/auth/register | Customer registration |
| POST | /api/auth/login | Login |
| POST | /api/auth/refresh | Refresh access token |
| GET | /api/vehicles | List vehicles |
| POST | /api/bookings | Create booking |
| PATCH | /api/bookings/:id/status | Approve/reject/cancel |
| POST | /api/inspections/pickup | Record vehicle pickup |
| POST | /api/inspections/return | Record vehicle return |
| GET | /api/reports/export/bookings | CSV export |

---

## Demo Accounts (Development Only)

> ⚠️ These credentials are for local development only. Change them before any deployment.

| Role | Email | Password |
|---|---|---|
| Administrator | admin@fleetflow.dev | Admin@FleetFlow2025! |
| Fleet Manager | manager@fleetflow.dev | Manager@FleetFlow2025! |
| Rental Agent | agent@fleetflow.dev | Agent@FleetFlow2025! |
| Customer | customer@fleetflow.dev | Customer@FleetFlow2025! |

---

## Database Schema

The full ER diagram is located at [`docs/erd.md`](docs/erd.md).

Key entities:
- `users` → `customer_profiles` / `driver_profiles`
- `vehicles` → `vehicle_categories`, `vehicle_images`
- `bookings` → `rental_contracts`, `payments`, `vehicle_inspections`, `driver_assignments`
- `maintenance_records`
- `notifications`
- `audit_logs`

---

## Security Features

See [SECURITY.md](SECURITY.md) for full details.

- Argon2id password hashing
- JWT with short-lived access tokens + revocable refresh tokens
- Role-based access control enforced server-side on every endpoint
- IDOR protection (customers only access their own data)
- Serializable transactions prevent double-booking race conditions
- CSV injection protection on all exports
- Helmet security headers
- Rate limiting on auth endpoints
- Audit logging for all sensitive operations
- No secrets in git — `.env` is gitignored

---

## Known Limitations

1. Payments are **simulated** — no real payment processing
2. Email uses Ethereal preview in development
3. File uploads are scaffolded but not wired to cloud storage
4. No HTTPS — configure TLS at your reverse proxy
5. Rate limiting uses in-memory store (use Redis for multi-instance)

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

MIT License — see [LICENSE](LICENSE).
