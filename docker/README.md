# Docker - Local Development

## Quick Start

```bash
# 1. Setup environment
cp env.example .env.local
# (Optional) Set GOOGLE_IDENTITY_ENABLED=true only if you have a Firebase key mounted

# 2. Start all services
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

- **Firebase optional locally** – set `GOOGLE_IDENTITY_ENABLED=false` (default) unless you mount a real service account file.
- **Database drift** – run `scripts/dev/reset-db.sh` or `docker-compose down -v` when schema changes. Migrations live in `infrastructure/database/migrations`.
- **Frontend ↔ Backend proxy** – the nginx config now proxies `/api` to the `backend` service inside Docker. Ensure the compose stack is up so `backend` resolves.
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
