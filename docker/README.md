# Docker - Local Development

This directory contains Docker Compose configurations for local development.

## Quick Start

```bash
# 1. Copy environment template
cp env.example .env.local

# 2. Edit .env.local with your Firebase credentials

# 3. Start all services
docker-compose up

# Or start with rebuild
docker-compose up --build
```

## Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Main compose file - starts all services |
| `docker-compose.dev.yml` | Development overrides (hot reload, debug ports) |
| `env.example` | Environment variables template |
| `.env.local` | Your local environment (gitignored) |

## Services

| Service | Port | Description |
|---------|------|-------------|
| `postgres` | 5432 | PostgreSQL database |
| `secret-service` | 8080 | Backend API |
| `audit-service` | 8081 | Audit logging service |
| `frontend` | 3000 | React frontend |
| `pgadmin` | 5050 | Database admin UI (dev only) |

## Common Commands

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# Start with development overrides (hot reload, pgadmin)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# View logs
docker-compose logs -f secret-service

# Stop all services
docker-compose down

# Stop and remove volumes (reset database)
docker-compose down -v

# Rebuild specific service
docker-compose build secret-service

# Access database shell
docker-compose exec postgres psql -U csm_user -d csm_dev
```

## Database Access

### Via psql (command line)
```bash
docker-compose exec postgres psql -U csm_user -d csm_dev
```

### Via pgAdmin (web UI)
1. Start with dev overrides: `docker-compose -f docker-compose.yml -f docker-compose.dev.yml up`
2. Open http://localhost:5050
3. Login: `admin@csm.local` / `admin`
4. Add server:
   - Host: `postgres`
   - Port: `5432`
   - Database: `csm_dev`
   - Username: `csm_user`
   - Password: `csm_password`

## Debugging

### Java Remote Debug
When using `docker-compose.dev.yml`:
- Secret Service debug port: `5005`
- Audit Service debug port: `5006`

In your IDE, create a "Remote JVM Debug" configuration pointing to `localhost:5005`.

### View Service Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f secret-service

# Last 100 lines
docker-compose logs --tail=100 secret-service
```

## Troubleshooting

### Port already in use
```bash
# Find what's using the port
lsof -i :8080

# Kill the process or change the port in docker-compose.yml
```

### Database connection issues
```bash
# Check if postgres is healthy
docker-compose ps

# Check postgres logs
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up
```

### Migrations not running
Migrations in `../database/migrations/` are mounted to `/docker-entrypoint-initdb.d/`.
They only run on first database creation. To re-run:
```bash
docker-compose down -v  # Remove volumes
docker-compose up       # Fresh start
```

