# Docker Configuration

This directory contains Docker Compose configuration for local development.

## Usage

From the project root:

```bash
# Start all services
docker-compose -f infrastructure/docker/docker-compose.yml up --build

# Start in detached mode
docker-compose -f infrastructure/docker/docker-compose.yml up -d

# Stop services
docker-compose -f infrastructure/docker/docker-compose.yml down
```

## Services

- **secret-service**: Port 8080
- **audit-service**: Port 8081
- **secrets-db**: PostgreSQL on port 5433
- **audit-db**: PostgreSQL on port 5434

## Note

The docker-compose.yml uses relative paths to `apps/backend/` for service builds.
