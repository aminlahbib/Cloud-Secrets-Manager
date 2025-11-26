# Docker - Local Development

## Quick Start

```bash
# 1. Setup environment
cp env.example .env.local
# Copy your Firebase service account JSON to infrastructure/gcp/keys/firebase-admin-key.json

# 2. Start all services (first run seeds the DB automatically)
docker-compose --env-file .env.local up

# 3. Access the app
open http://localhost:3000
```

## Services

| Service | Container | Port | Description |
|---------|-----------|------|-------------|
| PostgreSQL | `csm-db` | 5432 | Single database for all services |
| Backend | `csm-backend` | 8080 | Secret Service API |
| Audit | `csm-audit` | 8081 | Audit logging service |
| Frontend | `csm-frontend` | 3000 | React application |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                          │
│                        localhost:3000                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌─────────────────────┐        ┌─────────────────────┐        │
│  │   Backend (8080)    │───────▶│    Audit (8081)     │        │
│  │   Secret Service    │        │   Audit Service     │        │
│  └──────────┬──────────┘        └──────────┬──────────┘        │
│             │                              │                    │
│             └──────────────┬───────────────┘                    │
│                            ▼                                    │
│                 ┌─────────────────────┐                         │
│                 │  PostgreSQL (5432)  │                         │
│                 │    Single Database  │                         │
│                 │                     │                         │
│                 │  Tables:            │                         │
│                 │  - users            │                         │
│                 │  - workflows        │                         │
│                 │  - projects         │                         │
│                 │  - secrets          │                         │
│                 │  - audit_logs       │                         │
│                 └─────────────────────┘                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Commands

```bash
# Start
docker-compose up

# Start with rebuild
docker-compose up --build

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop
docker-compose down

# Reset database (delete volumes)
docker-compose down -v
docker-compose --env-file .env.local up
```

## Troubleshooting

- **Database seeded automatically** – the first `docker-compose up` run creates the schema and inserts mock users/projects/secrets. If you need to reapply seeds, run `docker-compose down -v` (or `scripts/dev/reset-db.sh`) before starting again.
- **Firebase key missing** – backend will fail if `GOOGLE_IDENTITY_ENABLED=true` but `infrastructure/gcp/keys/firebase-admin-key.json` isn’t present. Either add the key or set the variable to `false`.
- **Database drift** – run `scripts/dev/reset-db.sh` or `docker-compose down -v` when schema changes. Migrations live in `infrastructure/database/migrations`.
- **Frontend ↔ Backend proxy** – the nginx config proxies `/api` to the `backend` service inside Docker. Ensure the compose stack is up so `backend` resolves.
```

## Database Access

```bash
# Connect via psql
docker-compose exec postgres psql -U csm -d csm

# Or from host (if psql installed)
psql -h localhost -U csm -d csm
```

## Files

```
docker/
├── docker-compose.yml    # Main compose file
├── env.example           # Environment template
├── .env.local            # Your local config (gitignored)
└── README.md
```
