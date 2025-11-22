# Local Development Guide

This guide explains how to run the Cloud Secrets Manager application locally for development using Docker Compose.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Services Overview](#services-overview)
4. [Configuration](#configuration)
5. [Development Workflow](#development-workflow)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

```bash
# Docker and Docker Compose
docker --version
docker-compose --version

# Java 21 (for local development without Docker)
java -version

# Maven (for building)
mvn --version
```

### Environment Setup

No GCP credentials or Kubernetes cluster required for local development. The application runs with:
- Local PostgreSQL databases (via Docker)
- In-memory or file-based configurations
- No external dependencies

---

## Quick Start

### Start All Services

From the project root:

```bash
# Start all services (builds images if needed)
docker-compose -f infrastructure/docker/docker-compose.yml up --build

# Or start in detached mode (background)
docker-compose -f infrastructure/docker/docker-compose.yml up -d --build
```

### Stop Services

```bash
# Stop and remove containers
docker-compose -f infrastructure/docker/docker-compose.yml down

# Stop and remove containers + volumes (deletes database data)
docker-compose -f infrastructure/docker/docker-compose.yml down -v
```

### View Logs

```bash
# All services
docker-compose -f infrastructure/docker/docker-compose.yml logs -f

# Specific service
docker-compose -f infrastructure/docker/docker-compose.yml logs -f secret-service
docker-compose -f infrastructure/docker/docker-compose.yml logs -f audit-service
```

---

## Services Overview

### Application Services

| Service | Port | Description |
|---------|------|-------------|
| `secret-service` | 8080 | Main API service for secret management |
| `audit-service` | 8081 | Audit logging service |

### Database Services

| Service | Port | Database | User | Password |
|---------|------|----------|------|----------|
| `secrets-db` | 5433 | `secrets` | `secret_user` | `secret_pw` |
| `audit-db` | 5434 | `audit` | `audit_user` | `audit_pw` |

**Note:** These are local PostgreSQL containers for development only. Production uses Google Cloud SQL.

---

## Configuration

### Environment Variables

Services are configured via environment variables in `docker-compose.yml`:

**Secret Service:**
- `SPRING_DATASOURCE_URL`: `jdbc:postgresql://secrets-db:5432/secrets`
- `SPRING_DATASOURCE_USERNAME`: `secret_user`
- `SPRING_DATASOURCE_PASSWORD`: `secret_pw`
- `SPRING_PROFILES_ACTIVE`: `docker`
- `JWT_SECRET`: Default development key
- `ENCRYPTION_KEY`: Default development key
- `AUDIT_SERVICE_URL`: `http://audit-service:8081`

**Audit Service:**
- `SPRING_DATASOURCE_URL`: `jdbc:postgresql://audit-db:5432/audit`
- `SPRING_DATASOURCE_USERNAME`: `audit_user`
- `SPRING_DATASOURCE_PASSWORD`: `audit_pw`
- `SPRING_PROFILES_ACTIVE`: `docker`

### Google Cloud Identity Platform (Optional)

To test Google Identity Platform locally:

1. **Set environment variables:**
   ```bash
   export GOOGLE_IDENTITY_ENABLED=true
   export GOOGLE_PROJECT_ID=your-project-id
   export GOOGLE_API_KEY=your-api-key
   export GOOGLE_SERVICE_ACCOUNT_PATH=./apps/backend/secret-service/src/main/resources/service-account.json
   ```

2. **Mount service account file:**
   The `docker-compose.yml` already mounts the service account JSON file if it exists.

3. **Restart services:**
   ```bash
   docker-compose -f infrastructure/docker/docker-compose.yml restart secret-service
   ```

---

## Development Workflow

### Running Individual Services

You can run services individually for faster iteration:

```bash
# Start only databases
docker-compose -f infrastructure/docker/docker-compose.yml up secrets-db audit-db

# Run secret-service locally (connects to Docker databases)
cd apps/backend/secret-service
mvn spring-boot:run -Dspring-boot.run.profiles=docker
```

### Rebuilding After Code Changes

```bash
# Rebuild and restart a specific service
docker-compose -f infrastructure/docker/docker-compose.yml up -d --build secret-service

# Rebuild all services
docker-compose -f infrastructure/docker/docker-compose.yml up -d --build
```

### Database Access

Connect to databases directly:

```bash
# Connect to secrets database
docker exec -it cloud-secrets-manager-secrets-db-1 psql -U secret_user -d secrets

# Connect to audit database
docker exec -it cloud-secrets-manager-audit-db-1 psql -U audit_user -d audit

# Or from host machine (if PostgreSQL client installed)
psql -h localhost -p 5433 -U secret_user -d secrets
# Password: secret_pw

psql -h localhost -p 5434 -U audit_user -d audit
# Password: audit_pw
```

### Running Tests

```bash
# Run tests for a specific service
cd apps/backend/secret-service
mvn test

# Run all tests
mvn test -pl apps/backend/secret-service,apps/backend/audit-service
```

---

## Troubleshooting

### Services Won't Start

**Check logs:**
```bash
docker-compose -f infrastructure/docker/docker-compose.yml logs
```

**Common issues:**
- Port conflicts: Ensure ports 8080, 8081, 5433, 5434 are not in use
- Database not ready: Wait a few seconds after starting databases before starting services
- Out of memory: Increase Docker memory allocation

### Database Connection Errors

**Verify databases are running:**
```bash
docker-compose -f infrastructure/docker/docker-compose.yml ps
```

**Check database logs:**
```bash
docker-compose -f infrastructure/docker/docker-compose.yml logs secrets-db
docker-compose -f infrastructure/docker/docker-compose.yml logs audit-db
```

**Reset databases:**
```bash
# Stop and remove volumes
docker-compose -f infrastructure/docker/docker-compose.yml down -v

# Start fresh
docker-compose -f infrastructure/docker/docker-compose.yml up -d
```

### Service Health Checks

**Check service health:**
```bash
# Secret Service
curl http://localhost:8080/actuator/health

# Audit Service
curl http://localhost:8081/actuator/health
```

### Viewing Application Logs

```bash
# Follow logs for all services
docker-compose -f infrastructure/docker/docker-compose.yml logs -f

# Follow logs for specific service
docker-compose -f infrastructure/docker/docker-compose.yml logs -f secret-service

# View last 100 lines
docker-compose -f infrastructure/docker/docker-compose.yml logs --tail=100 secret-service
```

### Cleaning Up

```bash
# Stop and remove containers
docker-compose -f infrastructure/docker/docker-compose.yml down

# Remove containers, volumes, and networks
docker-compose -f infrastructure/docker/docker-compose.yml down -v

# Remove images as well
docker-compose -f infrastructure/docker/docker-compose.yml down -v --rmi all
```

---

## Differences from Production

| Aspect | Local Development | Production |
|--------|------------------|------------|
| **Database** | Local PostgreSQL containers | Google Cloud SQL |
| **Secrets** | Environment variables | Google Secret Manager + ESO |
| **Authentication** | Optional (can enable Google Identity) | Google Cloud Identity Platform |
| **Service Discovery** | Docker Compose networking | Kubernetes Services |
| **Scaling** | Single instance | Kubernetes Deployments (scalable) |
| **Monitoring** | Docker logs | Kubernetes + Cloud Monitoring |
| **Storage** | Docker volumes | Persistent volumes + Cloud SQL |

---

## Next Steps

- **Production Deployment**: See [Complete Deployment Guide](./COMPLETE_DEPLOYMENT_GUIDE.md)
- **Infrastructure Setup**: See [Terraform Guide](./TERRAFORM_GUIDE.md)
- **Operations**: See [Operations Guide](./OPERATIONS_GUIDE.md)

---

**Last Updated:** November 22, 2025  
**Maintained by:** Cloud Secrets Manager Team

