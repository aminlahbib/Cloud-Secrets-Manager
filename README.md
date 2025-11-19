# Cloud Secrets Manager 🔐

A production-ready, cloud-native **Secrets Management System** that enables organizations to securely store, manage, and retrieve sensitive information such as API keys, database passwords, access tokens, and other confidential data. Built with modern microservices architecture, enterprise-grade security, and comprehensive observability.

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [What It Does](#what-it-does)
- [How It Works](#how-it-works)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Key Features](#key-features)
- [Workflow](#workflow)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Project Overview

**Cloud Secrets Manager** is an enterprise-grade secrets management platform designed to solve the critical problem of securely handling sensitive credentials in modern cloud applications. Instead of hardcoding secrets in configuration files or environment variables, this system provides:

- **Centralized Secret Storage**: Single source of truth for all secrets
- **Encryption at Rest**: All secrets are encrypted before storage
- **Access Control**: Role-based access control (RBAC) with fine-grained permissions
- **Audit Trail**: Complete logging of all secret operations for compliance
- **Versioning & Rollback**: Track secret changes and revert when needed
- **Automatic Rotation**: Scheduled secret rotation policies
- **Cloud-Native**: Built for Kubernetes and containerized environments

### Problem It Solves

Modern applications require numerous secrets (API keys, database passwords, certificates, etc.). Managing these securely is challenging:

- ❌ Hardcoded secrets in code repositories
- ❌ Secrets in environment variables (visible in process lists)
- ❌ No audit trail of who accessed what
- ❌ No versioning or rollback capabilities
- ❌ Manual rotation processes prone to errors

**Cloud Secrets Manager** addresses all these challenges with a secure, scalable, and auditable solution.

---

## ✨ What It Does

### Core Capabilities

1. **Secret Management**
   - Store secrets with encryption at rest
   - Retrieve secrets securely via REST API
   - Update secrets with automatic versioning
   - Delete secrets (soft delete with audit trail)

2. **Authentication & Authorization**
   - JWT-based authentication
   - Role-based access control (RBAC)
   - Fine-grained permissions (READ, WRITE, DELETE, SHARE, ROTATE)
   - Token refresh mechanism

3. **Security Features**
   - AES-256 encryption (MVP) → Vault/KMS integration (Production)
   - Secrets never stored in plaintext
   - Secure key management
   - Token blacklisting for revocation

4. **Audit & Compliance**
   - Complete audit log of all operations
   - Track who accessed what and when
   - Compliance reporting
   - Security event monitoring

5. **Advanced Features** (Production)
   - Secret versioning and rollback
   - Automatic expiration and rotation
   - Secret sharing between users/teams
   - Tag-based organization
   - Search and filtering

---

## 🔧 How It Works

### System Architecture

The system is built as **two microservices** that work together:

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Application                        │
│              (curl, Postman, Web UI, CLI)                    │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTPS / REST API
                        │
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
┌──────────────────┐          ┌──────────────────┐
│  Secret Service  │          │  Audit Service   │
│   (Port 8080)    │          │   (Port 8081)    │
│                  │          │                  │
│ • JWT Auth       │          │ • Audit Logger   │
│ • Encryption     │─────────▶│ • Query API      │
│ • CRUD Ops       │  REST    │ • Compliance     │
│ • RBAC           │          │                  │
└────────┬─────────┘          └────────┬─────────┘
         │                             │
         │                             │
         ▼                             ▼
┌──────────────────┐          ┌──────────────────┐
│   Secrets DB     │          │   Audit DB       │
│  (PostgreSQL)    │          │  (PostgreSQL)    │
│                  │          │                  │
│ • Encrypted      │          │ • Audit Logs     │
│   Secrets        │          │ • Events         │
│ • Metadata       │          │ • Timestamps     │
└──────────────────┘          └──────────────────┘
```

### Component Breakdown

#### 1. **Secret Service** (Port 8080)
The primary service that handles all secret operations:

- **REST API Endpoints**:
  - `POST /api/auth/login` - Authenticate and get JWT token
  - `POST /api/auth/refresh` - Refresh access token
  - `POST /api/secrets` - Create a new secret
  - `GET /api/secrets/{key}` - Retrieve a secret
  - `PUT /api/secrets/{key}` - Update a secret
  - `DELETE /api/secrets/{key}` - Delete a secret
  - `GET /api/secrets/{key}/versions` - Get version history
  - `POST /api/secrets/{key}/rollback/{version}` - Rollback to version

- **Responsibilities**:
  - JWT token generation and validation
  - Request authentication and authorization
  - Secret encryption before storage
  - Secret decryption on retrieval
  - RBAC permission checks
  - Sending audit events to Audit Service

#### 2. **Audit Service** (Port 8081)
Handles all audit logging and compliance:

- **REST API Endpoints**:
  - `POST /api/audit/log` - Receive audit events (internal)
  - `GET /api/audit` - Query audit logs (admin)
  - `GET /api/audit/{username}` - Get user-specific logs
  - `GET /api/audit/{secretKey}` - Get secret-specific logs

- **Responsibilities**:
  - Receive and store audit events
  - Provide query endpoints for compliance
  - Generate audit reports
  - Monitor security events

#### 3. **Databases**

- **Secrets Database**:
  - Stores encrypted secret values
  - Stores metadata (key, created_by, timestamps, tags)
  - Stores version history
  - Stores access policies

- **Audit Database**:
  - Stores all audit log entries
  - Tracks: username, action, secret_key, timestamp, IP address
  - Partitioned for performance (monthly partitions)

---

## 🏗 Architecture

### Microservices Design

The system follows **microservices architecture** principles:

- **Service Independence**: Each service can be deployed independently
- **Database per Service**: Separate databases for isolation
- **API Gateway Pattern**: Single entry point (via Ingress in K8s)
- **Event-Driven**: Audit events sent asynchronously
- **Stateless Services**: JWT tokens for stateless authentication

### Security Layers

1. **Network Security**:
   - HTTPS/TLS encryption in transit
   - Network policies in Kubernetes
   - Service-to-service authentication

2. **Application Security**:
   - JWT authentication
   - RBAC authorization
   - Input validation
   - SQL injection prevention

3. **Data Security**:
   - Encryption at rest (AES-256)
   - Key management (Vault/KMS in production)
   - Secrets never logged
   - Secure key rotation

4. **Infrastructure Security**:
   - Container security scanning
   - Pod security policies
   - Secrets management (Kubernetes Sealed Secrets)
   - Least privilege access

---

## 🛠 Tech Stack

### Core Technologies

| Component | Technology | Version |
|-----------|-----------|---------|
| **Language** | Java | 21 (LTS) |
| **Framework** | Spring Boot | 3.3.x |
| **Security** | Spring Security | 6.3.x |
| **Data Access** | Spring Data JPA | 3.3.x |
| **Database** | PostgreSQL | 16.x |
| **Authentication** | JWT (JJWT) | 0.12.x |
| **Encryption** | AES-256 / Vault | Latest |
| **API Documentation** | OpenAPI 3 / Swagger | 3.0.x |

### Infrastructure & DevOps

| Component | Technology | Version |
|-----------|-----------|---------|
| **Containerization** | Docker | Latest |
| **Orchestration** | Docker Compose | 2.x |
| **Container Orchestration** | Kubernetes | 1.30+ |
| **Package Manager** | Helm | 3.14+ |
| **Ingress Controller** | Nginx Ingress | Latest |
| **CI/CD** | GitHub Actions | Latest |

### Production Enhancements

| Component | Technology | Version |
|-----------|-----------|---------|
| **Secret Management** | HashiCorp Vault | 1.16+ |
| **Alternative KMS** | AWS KMS | Latest |
| **Monitoring** | Prometheus | 2.50+ |
| **Visualization** | Grafana | 10.x |
| **Tracing** | OpenTelemetry | 1.30+ |
| **Logging** | ELK Stack | 8.x |
| **Metrics** | Micrometer | 1.13+ |
| **Caching** | Redis | 7.x |
| **Load Testing** | Gatling | 3.10+ |

### Development Tools

| Component | Technology | Version |
|-----------|-----------|---------|
| **Build Tool** | Maven | 3.9+ |
| **Testing** | JUnit 5 | 5.10+ |
| **Mocking** | Mockito | 5.x |
| **Integration Testing** | Testcontainers | 1.19+ |
| **Code Quality** | SonarQube | Latest |

---

## 🚀 Key Features

### MVP Features ✅

- ✅ **JWT Authentication** - Secure token-based authentication
- ✅ **Secret CRUD Operations** - Create, Read, Update, Delete secrets
- ✅ **AES Encryption** - Encryption at rest for all secrets
- ✅ **Audit Logging** - Complete audit trail of all operations
- ✅ **Docker Support** - Fully containerized with Docker Compose
- ✅ **RESTful API** - Clean, RESTful API design
- ✅ **Health Checks** - Kubernetes liveness and readiness probes

### Production Features 🎯

- 🎯 **Secret Versioning** - Track all changes with version history
- 🎯 **Rollback Capability** - Revert to previous secret versions
- 🎯 **RBAC** - Role-based access control with fine-grained permissions
- 🎯 **Secret Expiration** - Automatic expiration and cleanup
- 🎯 **Automatic Rotation** - Scheduled secret rotation policies
- 🎯 **Secret Sharing** - Share secrets between users/teams
- 🎯 **Vault/KMS Integration** - Enterprise-grade key management
- 🎯 **Token Refresh** - Long-lived refresh tokens
- 🎯 **Token Blacklisting** - Revoke tokens instantly
- 🎯 **Tagging & Search** - Organize and find secrets easily
- 🎯 **Monitoring & Metrics** - Prometheus, Grafana, OpenTelemetry
- 🎯 **Comprehensive Testing** - 80%+ test coverage

---

## 🔄 Workflow

### 1. Authentication Flow

```
┌─────────┐                    ┌──────────────┐
│ Client  │                    │ Secret       │
│         │                    │ Service      │
└────┬────┘                    └──────┬───────┘
     │                                │
     │ 1. POST /auth/login            │
     │    {username, password}        │
     ├───────────────────────────────▶│
     │                                │
     │                                │ 2. Validate credentials
     │                                │    (check DB)
     │                                │
     │                                │ 3. Generate JWT token
     │                                │
     │ 4. Response: {token,           │
     │              refreshToken}     │
     │◀───────────────────────────────┤
     │                                │
```

### 2. Create Secret Flow

```
┌─────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Client  │    │ Secret       │    │ Secrets DB   │    │ Audit        │
│         │    │ Service      │    │              │    │ Service      │
└────┬────┘    └──────┬───────┘    └──────┬───────┘    └──────┬───────┘
     │                 │                   │                   │
     │ 1. POST /api/   │                   │                   │
     │    secrets      │                   │                   │
     │    + JWT        │                   │                   │
     ├───────────-────▶│                   │                   │
     │                 │                   │                   │
     │                 │ 2. Validate JWT   │                   │
     │                 │    & Check RBAC   │                   │
     │                 │                   │                   │
     │                 │ 3. Encrypt secret │                   │
     │                 │    (AES/Vault)    │                   │
     │                 │                   │                   │
     │                 │ 4. Store in DB    │                   │
     │                 ├──────────────────▶│                   │
     │                 │                   │                   │
     │                 │ 5. Send audit     │                   │
     │                 │    event          │                   │
     │                 ├──────────────────────────────────────▶│
     │                 │                   │                   │
     │                 │ 6. Response:      │                   │
     │                 │    Success        │                   │
     │◀────────────────┤                   │                   │
     │                 │                   │                   │
```

### 3. Retrieve Secret Flow

```
┌─────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Client  │    │ Secret       │    │ Secrets DB   │    │ Audit        │
│         │    │ Service      │    │              │    │ Service      │
└────┬────┘    └──────┬───────┘    └──────┬───────┘    └──────┬───────┘
     │                 │                   │                   │
     │ 1. GET /api/    │                   │                   │
     │    secrets/key  │                   │                   │
     │    + JWT        │                   │                   │
     ├────────────-───▶│                   │                   │
     │                 │                   │                   │
     │                 │ 2. Validate JWT   │                   │
     │                 │    & Check READ   │                   │
     │                 │    permission     │                   │
     │                 │                   │                   │
     │                 │ 3. Fetch from DB  │                   │
     │                 ├──────────────────▶│                   │
     │                 │                   │                   │
     │                 │ 4. Decrypt secret │                   │
     │                 │    (AES/Vault)    │                   │
     │                 │                   │                   │
     │                 │ 5. Log audit      │                   │
     │                 │    event          │                   │
     │                 ├──────────────────────────────────────▶│
     │                 │                   │                   │
     │                 │ 6. Response:      │                   │
     │                 │    {key, value}   │                   │
     │◀────────────────┤                   │                   │
     │                 │                   │                   │
```

### 4. Complete Request Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                         Request Lifecycle                        │
└─────────────────────────────────────────────────────────────────┘

1. Client Request
   ├─> HTTPS Request with JWT Token
   └─> Request reaches Ingress Controller

2. Authentication & Authorization
   ├─> JWT Token Validation
   ├─> Extract User & Roles
   ├─> Check RBAC Permissions
   └─> Authorize Request

3. Business Logic
   ├─> Encrypt/Decrypt Secrets
   ├─> Database Operations
   ├─> Version Management
   └─> Policy Enforcement

4. Audit Logging
   ├─> Create Audit Event
   ├─> Send to Audit Service (Async)
   └─> Store in Audit DB

5. Response
   ├─> Format Response
   ├─> Add Security Headers
   └─> Return to Client

6. Monitoring
   ├─> Record Metrics (Prometheus)
   ├─> Log Request (ELK)
   └─> Trace Request (OpenTelemetry)
```

### 5. Deployment Workflow (CI/CD)

```
┌─────────────────────────────────────────────────────────────────┐
│                      CI/CD Pipeline Flow                         │
└─────────────────────────────────────────────────────────────────┘

Developer Push
     │
     ▼
┌─────────────────┐
│  GitHub Actions │
│  (Triggered)    │
└────────┬────────┘
         │
         ├─▶ Build & Test
         │   ├─> Maven Build
         │   ├─> Unit Tests
         │   ├─> Integration Tests
         │   └─> Code Quality Checks
         │
         ├─▶ Docker Build
         │   ├─> Build Images
         │   ├─> Security Scan
         │   └─> Tag Images
         │
         ├─▶ Push to Registry
         │   └─> Docker Hub / ACR
         │
         └─▶ Deploy
             ├─> Update Helm Chart
             ├─> Deploy to K8s
             ├─> Health Checks
             └─> Smoke Tests
```

---

## 🚀 Getting Started

### Prerequisites

- **Java 21** or higher
- **Maven 3.9+**
- **Docker** and **Docker Compose**
- **Git**
- **PostgreSQL 16+** (optional, Docker Compose includes it)

### Quick Start with Docker Compose

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/cloud-secrets-manager.git
   cd cloud-secrets-manager
   ```

2. **Start all services**:
   ```bash
   docker-compose up --build
   ```

   This starts:
   - Secret Service on `http://localhost:8080`
   - Audit Service on `http://localhost:8081`
   - PostgreSQL databases for secrets and audit

3. **Test the API**:
   ```bash
   # 1. Authenticate
   curl -X POST http://localhost:8080/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username": "admin", "password": "admin"}'
   
   # Response: {"accessToken": "...", "refreshToken": "..."}
   
   # 2. Create a secret
   curl -X POST http://localhost:8080/api/secrets \
     -H "Authorization: Bearer <ACCESS_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"key": "db.password", "value": "mySecret123"}'
   
   # 3. Retrieve a secret
   curl -X GET http://localhost:8080/api/secrets/db.password \
     -H "Authorization: Bearer <ACCESS_TOKEN>"
   
   # 4. View audit logs
   curl -X GET http://localhost:8081/api/audit \
     -H "Authorization: Bearer <ACCESS_TOKEN>"
   ```

### Local Development Setup

**Important:** This project requires **Java 21**. If you have Java 24 installed, set JAVA_HOME:

```bash
export JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home
export PATH=$JAVA_HOME/bin:$PATH
```

Or use the provided build script:
```bash
./build.sh
```

1. **Build the services**:
   ```bash
   cd secret-service
   ./mvnw clean install
   
   cd ../audit-service
   ./mvnw clean install
   ```

2. **Configure environment variables**:
   ```bash
   # secret-service/.env
   SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/secrets
   SPRING_DATASOURCE_USERNAME=secret_user
   SPRING_DATASOURCE_PASSWORD=secret_pw
   JWT_SECRET=your-secret-key-here
   ENCRYPTION_KEY=your-encryption-key-here
   ```

3. **Start databases**:
   ```bash
   docker-compose up -d secrets-db audit-db
   ```

4. **Run services**:
   ```bash
   # Terminal 1: Secret Service
   cd secret-service
   ./mvnw spring-boot:run
   
   # Terminal 2: Audit Service
   cd audit-service
   ./mvnw spring-boot:run
   ```

---

## ☸️ Deployment

### Kubernetes Deployment

See the [Kubernetes & Helm Guide](./docs/kubernetes-helm-guide.md) for detailed instructions.

**Quick Deploy with Helm**:
```bash
# Install Helm chart
helm install secrets-manager ./helm/cloud-secrets-manager

# Check deployment
kubectl get pods
kubectl get svc
kubectl get ingress
```

### Cloud Deployment Options

- **AWS**: EKS with RDS PostgreSQL
- **Azure**: AKS with Azure Database for PostgreSQL
- **GCP**: GKE with Cloud SQL
- **Render/Railway**: Docker Compose deployment

See [Deployment Guide](./docs/secrets-manager-setup.md) for cloud-specific instructions.

---

## 📚 Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[Setup Guide](./docs/secrets-manager-setup.md)** - Complete setup instructions
- **[Dockerization Guide](./docs/dockerization-guide.md)** - Docker and Docker Compose setup
- **[Kubernetes & Helm Guide](./docs/kubernetes-helm-guide.md)** - K8s deployment guide
- **[Production Plan](./docs/a-plus-production-plan.md)** - Production-ready features roadmap

### API Documentation

Once the services are running, access:
- **Swagger UI**: `http://localhost:8080/swagger-ui.html`
- **OpenAPI Spec**: `http://localhost:8080/v3/api-docs`

---

## 🧪 Testing

### Run Tests

```bash
# Unit tests
mvn test

# Integration tests
mvn verify

# With coverage
mvn test jacoco:report
```

### Test Coverage Goal

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: Critical paths covered
- **Security Tests**: OWASP compliance
- **Load Tests**: Gatling scenarios

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) for details on:

- Code of conduct
- Development setup
- Pull request process
- Coding standards

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.

---

## 🎯 Roadmap

### Current Status: MVP ✅
- [x] Basic secret CRUD operations
- [x] JWT authentication
- [x] AES encryption
- [x] Audit logging
- [x] Docker support
- [x] Kubernetes deployment

### Next: Production Features 🚧
- [ ] Vault/KMS integration
- [ ] Secret versioning
- [ ] RBAC implementation
- [ ] Monitoring stack
- [ ] Comprehensive testing
- [ ] Performance optimization

See [Production Plan](./docs/a-plus-production-plan.md) for the complete roadmap.

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/cloud-secrets-manager/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/cloud-secrets-manager/discussions)
- **Email**: support@secrets-manager.com

---

## 🙏 Acknowledgments

- Spring Boot team for the excellent framework
- HashiCorp for Vault inspiration
- Kubernetes community for container orchestration
- All contributors and users

---

**Built with ❤️ for secure cloud-native applications**

