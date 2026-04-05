# Applications

This directory contains all application code for the Cloud Secrets Manager platform.

## Structure

### Backend (`backend/`)

Three Spring Boot microservices (Java 21, Spring Boot 3.3.x):

- **`secret-service/`** (port 8080) -- Core API for secrets management, project/team organization, RBAC, JWT authentication with Firebase integration, AES-256-GCM encryption, and event publishing via Google Pub/Sub.
- **`audit-service/`** (port 8081) -- Immutable audit log storage and query API with Flyway migrations, service-to-service API key authentication, caching, and compliance-ready analytics.
- **`notification-service/`** (port 8082) -- Multi-channel notification delivery (in-app, email via SendGrid, SSE real-time stream) with Pub/Sub subscription, smart batching, and user preference management.

### Frontend (`frontend/`)

Full single-page application built with React 18, TypeScript 5.3, Vite 5, and Tailwind CSS:

- 30+ pages including project management, secret CRUD with versioning, team collaboration, audit log viewer, admin panel, and notification center.
- TanStack React Query for server state, React Router v6 with lazy loading, real-time notifications via SSE.
- Dual authentication: Firebase/Google OAuth with backend JWT fallback, TOTP two-factor authentication.

## Development

See individual service READMEs for build and run instructions, or use `docker compose -f docker/docker-compose.yml up --build` to start everything.
