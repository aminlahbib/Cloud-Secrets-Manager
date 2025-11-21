# Cloud Secrets Manager 🔐

A production-ready, cloud-native **Secrets Management System** for securely storing, managing, and retrieving sensitive information like API keys, database passwords, and access tokens.

[![Java](https://img.shields.io/badge/Java-21-orange)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.5-brightgreen)](https://spring.io/projects/spring-boot)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 🎯 What It Does

**Cloud Secrets Manager** solves the critical problem of securely handling sensitive credentials in modern cloud applications. Instead of hardcoding secrets or storing them in environment variables, this system provides:

- 🔒 **Encrypted Storage** - AES-256 encryption at rest
- 🔐 **Secure Access** - JWT authentication with Google Identity Platform
- 👥 **Access Control** - Role-based access control (RBAC) with fine-grained permissions
- 📝 **Audit Trail** - Complete logging of all operations
- 🔄 **Versioning** - Track changes and rollback to previous versions
- ☸️ **Cloud-Native** - Built for Kubernetes and containerized environments

---

## ✨ Key Features

### ✅ Implemented

- **Authentication & Authorization**
  - Google Cloud Identity Platform integration
  - JWT tokens with refresh mechanism
  - RBAC with fine-grained permissions (READ, WRITE, DELETE, SHARE, ROTATE)

- **Secret Management**
  - Full CRUD operations via REST API
  - AES-256 encryption at rest
  - Automatic versioning
  - Rollback to previous versions

- **Audit & Compliance**
  - Complete audit logging
  - Separate audit service
  - Query logs by user, secret, or date range

- **Infrastructure**
  - Docker & Docker Compose
  - Kubernetes & Helm charts
  - CI/CD with GitHub Actions
  - Security scanning (Trivy)

- **Testing**
  - 48 tests passing (60% coverage)
  - Unit and integration tests
  - Testcontainers for database testing

### ⏳ Planned

- Secret expiration and automatic cleanup
- Scheduled secret rotation
- Secret sharing between users/teams
- Token blacklisting (Redis-based)
- Rate limiting
- Advanced monitoring (Prometheus, Grafana)

---

## 🚀 Quick Start

### Prerequisites

- Java 21+
- Docker & Docker Compose
- Maven 3.9+ (optional, Maven wrapper included)

### Run with Docker Compose

```bash
# Clone the repository
git clone https://github.com/your-username/cloud-secrets-manager.git
cd cloud-secrets-manager

# Start all services
docker-compose up --build
```

This starts:
- **Secret Service** on `http://localhost:8080`
- **Audit Service** on `http://localhost:8081`
- PostgreSQL databases

### Verify Setup

```bash
# Test Google Cloud setup
./scripts/testing/test-google-cloud-setup.sh

# Test authentication
./scripts/testing/test-auth.sh
```

### Test the API

```bash
# 1. Get Google ID token (see docs/current/GET_ID_TOKEN.md)
# 2. Authenticate
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"idToken": "YOUR_GOOGLE_ID_TOKEN"}'

# 3. Create a secret
curl -X POST http://localhost:8080/api/secrets \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"key": "db.password", "value": "mySecret123"}'

# 4. Retrieve a secret
curl -X GET http://localhost:8080/api/secrets/db.password \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### API Documentation

Once running, access:
- **Swagger UI**: `http://localhost:8080/swagger-ui.html`
- **OpenAPI Spec**: `http://localhost:8080/v3/api-docs`

---

## 📚 Documentation

Comprehensive documentation is available in the [`docs/`](docs/README.md) directory:

- **[Complete Overview](docs/PROJECT_OVERVIEW.md)** - Full project documentation
- **[Setup Guide](docs/current/GOOGLE_IDENTITY_SETUP.md)** - Google Identity Platform setup
- **[Deployment Guide](docs/deployment/kubernetes-helm-guide.md)** - Kubernetes deployment
- **[API Testing](postman/README.md)** - Postman collection guide

**Quick Links:**
- [Documentation Index](docs/README.md)
- [Current Status](docs/status/STATUS.md)
- [Next Steps](docs/NEXT_STEPS.md)

---

## 🏗 Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌──────────────────┐          ┌──────────────────┐
│  Secret Service  │          │  Audit Service   │
│   (Port 8080)    │─────────▶│   (Port 8081)    │
└──────┬───────────┘          └────────┬─────────┘
       │                                │
       ▼                                ▼
┌──────────────┐              ┌──────────────┐
│ Secrets DB   │              │  Audit DB    │
│ (PostgreSQL) │              │ (PostgreSQL) │
└──────────────┘              └──────────────┘
```

**Two microservices:**
- **Secret Service** - Handles secret CRUD, encryption, authentication
- **Audit Service** - Handles audit logging and compliance

---

## 🛠 Tech Stack

- **Backend**: Java 21, Spring Boot 3.3.5
- **Database**: PostgreSQL 16
- **Authentication**: Google Cloud Identity Platform, JWT
- **Encryption**: AES-256
- **Containerization**: Docker, Kubernetes, Helm
- **CI/CD**: GitHub Actions
- **Testing**: JUnit 5, Testcontainers, JaCoCo

---

## 📊 Project Status

**Current Phase:** Production Features (60% complete)

- ✅ MVP Foundation - Complete
- ✅ Enhanced Security - Complete
- 🔄 Production Features - In Progress
- ⏳ Monitoring & Observability - Planned
- ✅ Testing Infrastructure - 60% complete

See [Status](docs/status/STATUS.md) for detailed progress.

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🔗 Links

- **Documentation**: [docs/README.md](docs/README.md)
- **Issues**: [GitHub Issues](https://github.com/your-username/cloud-secrets-manager/issues)
- **API Docs**: `http://localhost:8080/swagger-ui.html` (when running)

---

**Built with ❤️ for secure cloud-native applications**
