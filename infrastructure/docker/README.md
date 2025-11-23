# Docker Compose Setup for Cloud Secrets Manager

## Overview

This Docker Compose configuration runs the complete Cloud Secrets Manager stack:
- **Frontend**: React + Vite application served by nginx (port 3000)
- **Secret Service**: Main secrets management API (port 8080)
- **Audit Service**: Audit logging service (port 8081)
- **PostgreSQL databases**: Two separate databases for secrets and audit logs

## Prerequisites

1. **Docker** and **Docker Compose** installed
2. **Firebase service account key** at `infrastructure/gcp/keys/firebase-admin-key.json`
3. **Environment variables** configured (see below)

## Environment Configuration

Create a `.env` file in this directory with your Firebase configuration:

```bash
# Firebase Configuration (from Firebase Console)
VITE_FIREBASE_API_KEY=AIzaSyA3Le53moXfFQaPOJL-bOvyxcMg8K_e0vo
VITE_FIREBASE_AUTH_DOMAIN=cloud-secrets-manager.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=cloud-secrets-manager
VITE_FIREBASE_STORAGE_BUCKET=cloud-secrets-manager.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1040913502384
VITE_FIREBASE_APP_ID=1:1040913502384:web:2fac7aba1b81a8b4d26b75

# API Configuration
VITE_API_BASE_URL=http://localhost:8080

# Backend Configuration
GOOGLE_IDENTITY_ENABLED=true
GOOGLE_PROJECT_ID=cloud-secrets-manager
JWT_SECRET=mySuperStrongSecretKeyForJWTTokenGeneration123456
ENCRYPTION_KEY=MySecure32ByteKeyForAES256Enc!@#
```

## Quick Start

### 1. Start all services

```bash
cd infrastructure/docker
docker-compose up -d
```

### 2. Check service status

```bash
docker-compose ps
```

### 3. View logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f secret-service
docker-compose logs -f audit-service
```

### 4. Access the application

- **Frontend**: http://localhost:3000
- **Secret Service API**: http://localhost:8080
- **Audit Service API**: http://localhost:8081
- **Swagger UI**: http://localhost:8080/swagger-ui.html

## Service Details

### Frontend
- **Container**: `frontend`
- **Port**: 3000
- **Base Image**: nginx:alpine
- **Health Check**: http://localhost/health

### Secret Service
- **Container**: `secret-service`
- **Port**: 8080
- **Health Check**: http://localhost:8080/actuator/health
- **Database**: secrets-db (PostgreSQL)

### Audit Service
- **Container**: `audit-service`
- **Port**: 8081
- **Health Check**: http://localhost:8081/actuator/health
- **Database**: audit-db (PostgreSQL)

### Databases
- **secrets-db**: PostgreSQL on port 5433 (external)
- **audit-db**: PostgreSQL on port 5434 (external)

## Common Commands

### Stop all services
```bash
docker-compose down
```

### Stop and remove volumes (⚠️ deletes data)
```bash
docker-compose down -v
```

### Rebuild services
```bash
docker-compose build
docker-compose up -d
```

### Rebuild specific service
```bash
docker-compose build frontend
docker-compose up -d frontend
```

### Restart a service
```bash
docker-compose restart secret-service
```

### Execute command in container
```bash
docker-compose exec secret-service sh
```

### View resource usage
```bash
docker-compose stats
```

## Troubleshooting

### Service won't start
1. Check logs: `docker-compose logs [service-name]`
2. Verify .env file exists and has correct values
3. Ensure Firebase key exists at `infrastructure/gcp/keys/firebase-admin-key.json`

### Database connection issues
```bash
# Check if databases are healthy
docker-compose ps

# Check database logs
docker-compose logs secrets-db
docker-compose logs audit-db
```

### Port conflicts
If ports 3000, 8080, 8081, 5433, or 5434 are already in use:

1. Stop conflicting services
2. Or modify ports in docker-compose.yml:
```yaml
ports:
  - "3001:80"  # Change frontend to port 3001
```

### Rebuild from scratch
```bash
# Stop everything
docker-compose down -v

# Remove images
docker-compose rm -f

# Rebuild
docker-compose build --no-cache
docker-compose up -d
```

## Production Considerations

For production deployment:

1. **Use secrets management** instead of .env file
2. **Set strong passwords** for databases
3. **Use external PostgreSQL** instead of containers
4. **Enable HTTPS** with proper SSL certificates
5. **Set up backup** for database volumes
6. **Monitor resources** with proper observability tools
7. **Disable setup endpoint** (`SETUP_ENABLED=false`)

## Network Architecture

All services run on the `secrets-net` bridge network:

```
frontend (port 3000) --> secret-service (port 8080) --> secrets-db (PostgreSQL)
                            |
                            └--> audit-service (port 8081) --> audit-db (PostgreSQL)
```

## Data Persistence

Data is persisted in Docker volumes:
- `secrets-db-data`: Stores secret metadata and encrypted values
- `audit-db-data`: Stores audit logs

To backup volumes:
```bash
docker run --rm -v secrets-db-data:/data -v $(pwd):/backup alpine tar czf /backup/secrets-db-backup.tar.gz -C /data .
```

## Health Checks

All services include health checks:
- **Frontend**: 30s interval, checks /health endpoint
- **Secret Service**: 30s interval, checks /actuator/health
- **Audit Service**: 30s interval, checks /actuator/health
- **Databases**: 10s interval, checks PostgreSQL readiness

## Support

For issues or questions:
1. Check logs: `docker-compose logs`
2. Verify configuration in .env file
3. Ensure all prerequisites are met
4. Check service health: `docker-compose ps`
