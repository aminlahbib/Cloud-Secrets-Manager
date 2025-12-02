# Cloud Secrets Manager - Technical Documentation

**Last Updated:** November 29, 2025  
**Version:** 3.0  
**Target Audience:** Developers, DevOps Engineers, System Administrators

---

## Table of Contents

1. [Development Environment Setup](#1-development-environment-setup)
2. [Backend Architecture](#2-backend-architecture)
3. [Frontend Architecture](#3-frontend-architecture)
4. [Database Schema](#4-database-schema)
5. [API Reference](#5-api-reference)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [Security Implementation](#7-security-implementation)
8. [Deployment Architecture](#8-deployment-architecture)
9. [Monitoring & Observability](#9-monitoring--observability)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Development Environment Setup

### 1.1 Prerequisites

**Required Software:**
- Java 21+ (OpenJDK or Oracle JDK)
- Maven 3.9+ (or use Maven wrapper)
- Node.js 18+ and npm
- Docker & Docker Compose
- PostgreSQL 16+ (or use Docker)
- Git

**Optional but Recommended:**
- IntelliJ IDEA or VS Code
- Postman for API testing
- kubectl and helm (for Kubernetes deployment)

### 1.2 Local Development Setup

**1. Clone Repository:**
```bash
git clone <repository-url>
cd cloud-secrets-manager
```

**2. Start Services with Docker Compose:**
```bash
cd docker
cp env.example .env
# Edit .env with your configuration
docker-compose up --build
```

This starts:
- PostgreSQL database (port 5432)
- Secret Service (port 8080)
- Audit Service (port 8081)
- Frontend (port 3000)

**3. Run Backend Services Locally (Alternative):**

```bash
# Secret Service
cd apps/backend/secret-service
./mvnw spring-boot:run

# Audit Service (in another terminal)
cd apps/backend/audit-service
./mvnw spring-boot:run
```

**4. Run Frontend Locally:**

```bash
cd apps/frontend
npm install
npm run dev
```

### 1.3 Environment Variables

**Backend (Secret Service):**
```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/secrets
SPRING_DATASOURCE_USERNAME=secret_user
SPRING_DATASOURCE_PASSWORD=secret_pw
JWT_SECRET=your-secret-key
ENCRYPTION_KEY=your-32-byte-encryption-key
AUDIT_SERVICE_URL=http://localhost:8081
GOOGLE_IDENTITY_ENABLED=true
GOOGLE_PROJECT_ID=your-firebase-project-id
```

**Frontend:**
```bash
VITE_API_BASE_URL=http://localhost:8080
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
```

---

## 2. Backend Architecture

### 2.1 Service Structure

**Secret Service (`apps/backend/secret-service/`):**
```
src/main/java/com/secrets/
├── SecretServiceApplication.java    # Main application class
├── config/                          # Configuration classes
│   ├── SecurityConfig.java         # Spring Security configuration
│   ├── WebConfig.java              # Web configuration
│   └── ...
├── controller/                      # REST controllers
│   ├── AuthController.java
│   ├── ProjectController.java
│   ├── ProjectSecretController.java
│   ├── WorkflowController.java
│   └── ...
├── service/                         # Business logic
│   ├── ProjectService.java
│   ├── ProjectSecretService.java
│   ├── WorkflowService.java
│   └── ...
├── repository/                      # Data access layer
│   ├── ProjectRepository.java
│   ├── SecretRepository.java
│   └── ...
├── entity/                          # JPA entities
│   ├── Project.java
│   ├── Secret.java
│   ├── User.java
│   └── ...
└── dto/                            # Data transfer objects
    ├── ProjectResponse.java
    ├── SecretResponse.java
    └── ...
```

**Audit Service (`apps/backend/audit-service/`):**
```
src/main/java/com/audit/
├── AuditServiceApplication.java
├── controller/
│   └── AuditController.java
├── service/
│   └── AuditService.java
├── repository/
│   └── AuditLogRepository.java
└── entity/
    └── AuditLog.java
```

### 2.2 Key Design Patterns

**Layered Architecture:**
- **Controller Layer:** Handles HTTP requests/responses
- **Service Layer:** Business logic and orchestration
- **Repository Layer:** Data access abstraction
- **Entity Layer:** Domain models

**Dependency Injection:**
- Spring's `@Autowired` and constructor injection
- Interface-based design for testability

**DTO Pattern:**
- Separate DTOs for API requests/responses
- Prevents entity exposure and lazy loading issues

### 2.3 Database Access

**JPA/Hibernate:**
- Entity relationships with lazy loading
- Transaction management with `@Transactional`
- Query methods in repositories
- Custom queries with `@Query`

**Connection Pooling:**
- HikariCP for connection management
- Configurable pool size and timeouts

---

## 3. Frontend Architecture

### 3.1 Project Structure

```
apps/frontend/src/
├── main.tsx                        # Entry point
├── App.tsx                         # Root component with routing
├── index.css                       # Global styles
│
├── components/                     # Reusable components
│   ├── Layout.tsx                 # Main layout wrapper
│   ├── ErrorBoundary.tsx          # Error handling
│   ├── ui/                        # Base UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── ...
│   ├── projects/
│   │   └── CreateProjectModal.tsx
│   └── analytics/
│       └── ...
│
├── pages/                          # Page components
│   ├── Login.tsx
│   ├── Home.tsx
│   ├── Projects.tsx
│   ├── ProjectDetail.tsx
│   ├── SecretDetail.tsx
│   └── ...
│
├── contexts/                       # React contexts
│   └── AuthContext.tsx            # Authentication state
│
├── hooks/                          # Custom hooks
│   ├── useProjects.ts
│   ├── useSecrets.ts
│   └── useWorkflows.ts
│
├── services/                       # API clients
│   ├── api.ts                     # Axios instance
│   ├── auth.ts
│   ├── projects.ts
│   ├── secrets.ts
│   └── ...
│
├── types/                          # TypeScript types
│   └── index.ts
│
└── utils/                          # Utilities
    ├── tokenStorage.ts            # Token management
    └── ...
```

### 3.2 State Management

**Server State (TanStack Query):**
```typescript
// Example: Fetching projects
const { data: projects, isLoading } = useQuery({
  queryKey: ['projects'],
  queryFn: () => projectsService.getProjects(),
});
```

**Client State (React Context + Local State):**
- `AuthContext` for authentication state
- Component-level state for UI interactions
- URL state for routing parameters

### 3.3 Routing

**React Router v6:**
```typescript
<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route element={<ProtectedRoute />}>
    <Route path="/home" element={<HomePage />} />
    <Route path="/projects" element={<ProjectsPage />} />
    <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
  </Route>
</Routes>
```

---

## 4. Database Schema

### 4.1 Core Tables

**Users:**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    firebase_uid VARCHAR(128) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    platform_role VARCHAR(20) DEFAULT 'USER',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);
```

**Projects:**
```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_by UUID REFERENCES users(id),
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);
```

**Secrets:**
```sql
CREATE TABLE secrets (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id),
    secret_key VARCHAR(255) NOT NULL,
    encrypted_value TEXT NOT NULL,
    description TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(project_id, secret_key)
);
```

**Secret Versions:**
```sql
CREATE TABLE secret_versions (
    id UUID PRIMARY KEY,
    secret_id UUID REFERENCES secrets(id),
    version_number INTEGER NOT NULL,
    encrypted_value TEXT NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE,
    change_note TEXT,
    UNIQUE(secret_id, version_number)
);
```

### 4.2 Relationships

- **User → Projects:** One-to-many (created_by)
- **Project → Secrets:** One-to-many
- **Secret → Secret Versions:** One-to-many
- **Project → Memberships:** One-to-many
- **User → Memberships:** One-to-many

---

## 5. API Reference

### 5.1 Authentication

**Login (Local JWT):**
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}

Response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

**Refresh Token:**
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 5.2 Projects

**List Projects:**
```http
GET /api/projects?page=0&size=20&search=keyword&includeArchived=false
Authorization: Bearer <token>
```

**Create Project:**
```http
POST /api/projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My Project",
  "description": "Project description",
  "workflowId": "uuid"
}
```

### 5.3 Secrets

**List Secrets:**
```http
GET /api/projects/{projectId}/secrets?page=0&size=20&keyword=search
Authorization: Bearer <token>
```

**Create Secret:**
```http
POST /api/projects/{projectId}/secrets
Authorization: Bearer <token>
Content-Type: application/json

{
  "key": "database.password",
  "value": "secret-value",
  "description": "Database password"
}
```

**Get Secret Versions:**
```http
GET /api/projects/{projectId}/secrets/{key}/versions
Authorization: Bearer <token>
```

**Restore Version:**
```http
POST /api/projects/{projectId}/secrets/{key}/versions/{version}/restore
Authorization: Bearer <token>
```

### 5.4 Error Responses

**Standard Error Format:**
```json
{
  "timestamp": "2025-11-29T10:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/projects"
}
```

---

## 6. Authentication & Authorization

### 6.1 Authentication Flow

**Firebase Authentication:**
1. User signs in with Google OAuth
2. Frontend receives Firebase ID token
3. Frontend sends ID token to backend
4. Backend validates token with Firebase Admin SDK
5. Backend creates/updates user record
6. Backend returns JWT access token

**Local JWT Authentication:**
1. User provides email/password
2. Backend validates credentials
3. Backend generates JWT access token and refresh token
4. Tokens returned to frontend

### 6.2 Authorization Model

**Resource-Scoped RBAC:**
- Permissions are scoped to Projects
- Roles: OWNER, ADMIN, MEMBER, VIEWER
- Permissions: READ, WRITE, DELETE, LIST, ROTATE, SHARE

**Permission Matrix:**
| Role | READ | WRITE | DELETE | LIST | ROTATE | SHARE |
|------|------|-------|--------|------|--------|-------|
| OWNER | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| MEMBER | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| VIEWER | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |

---

## 7. Security Implementation

### 7.1 Encryption

**At Rest:**
- AES-256-GCM encryption for secret values
- Encryption key stored in environment variables
- Separate encryption per secret

**In Transit:**
- TLS/HTTPS for all API communications
- JWT tokens for authentication

### 7.2 Token Management

**Access Tokens:**
- Short-lived (15 minutes default)
- Stored in memory or sessionStorage
- Cross-tab synchronization

**Refresh Tokens:**
- Long-lived (7 days default)
- Stored in localStorage (persistent) or sessionStorage (session)
- Used to obtain new access tokens

**Token Blacklisting:**
- Redis-based blacklist for revoked tokens
- Checked on every authenticated request

### 7.3 Security Headers

**Implemented:**
- Content-Security-Policy
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security

---

## 8. Deployment Architecture

### 8.1 Kubernetes Deployment

**Services:**
- `secret-service` - Main API service
- `audit-service` - Audit logging service
- `frontend` - React application (nginx)

**Deployments:**
- Replica sets for high availability
- Health checks and probes
- Resource limits and requests

**ConfigMaps & Secrets:**
- Application configuration
- Database connection strings
- Encryption keys (via External Secrets Operator)

### 8.2 Infrastructure

**GKE Cluster:**
- VPC-native cluster
- Private IP for Cloud SQL
- Network policies enabled

**Cloud SQL:**
- PostgreSQL 16
- Automated backups
- High availability option

**Artifact Registry:**
- Container image storage
- Vulnerability scanning

---

## 9. Monitoring & Observability

### 9.1 Metrics

**Application Metrics:**
- Request count and latency
- Error rates
- Database query performance
- Cache hit rates

**Infrastructure Metrics:**
- CPU and memory usage
- Pod health
- Database connections

### 9.2 Logging

**Structured Logging:**
- JSON format
- Log levels: DEBUG, INFO, WARN, ERROR
- Correlation IDs for request tracing

**Log Aggregation:**
- Cloud Logging (GCP)
- Log-based metrics
- Alerting on error patterns

### 9.3 Tracing

**Distributed Tracing:**
- OpenTelemetry instrumentation
- Grafana Tempo for storage
- Trace correlation across services

---

## 10. Troubleshooting

### 10.1 Common Issues

**Port Already in Use:**
```bash
# Check what's using the port
lsof -i :8080
# Kill the process
kill -9 <PID>
```

**Database Connection Issues:**
- Verify database is running
- Check connection string
- Verify credentials
- Check network connectivity

**Token Expiration:**
- Check token expiration settings
- Verify refresh token is valid
- Check token storage location

**LazyInitializationException:**
- Ensure DTOs don't access lazy-loaded collections
- Use `@Transactional` for service methods
- Fetch required data explicitly

### 10.2 Debugging

**Backend Logging:**
```yaml
# application.yml
logging:
  level:
    com.secrets: DEBUG
    org.springframework.web: DEBUG
```

**Frontend Debugging:**
- Browser DevTools
- React DevTools
- Network tab for API calls
- Console logs

**Database Queries:**
```yaml
# Enable SQL logging
spring:
  jpa:
    show-sql: true
    properties:
      hibernate:
        format_sql: true
```

---

## Appendix A: Configuration Reference

### Backend Configuration

See `apps/backend/secret-service/src/main/resources/application.yml`

### Frontend Configuration

See `apps/frontend/.env.example`

---

## Appendix B: Useful Commands

**Backend:**
```bash
# Run tests
./mvnw test

# Build JAR
./mvnw clean package

# Run application
./mvnw spring-boot:run
```

**Frontend:**
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

**Docker:**
```bash
# Start all services
docker-compose up

# Stop services
docker-compose down

# View logs
docker-compose logs -f
```

---

**Last Updated:** November 29, 2025  
**Maintained By:** Development Team

