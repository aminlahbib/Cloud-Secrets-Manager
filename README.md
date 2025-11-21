# Cloud Secrets Manager 

A production-ready, cloud-native **Secrets Management System** for securely storing, managing, and retrieving sensitive information like API keys, database passwords, and access tokens.

[![Java](https://img.shields.io/badge/Java-21-orange)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.5-brightgreen)](https://spring.io/projects/spring-boot)
[![Maven](https://img.shields.io/badge/Maven-3.9%2B-C71A36?logo=apachemaven&logoColor=white)](https://maven.apache.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Python](https://img.shields.io/badge/Python-3-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![Shell Script](https://img.shields.io/badge/Shell_Script-121011?logo=gnu-bash&logoColor=white)](https://www.gnu.org/software/bash/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-Orchestration-326CE5?logo=kubernetes&logoColor=white)](https://kubernetes.io/)
[![Helm](https://img.shields.io/badge/Helm-Charts-0F1689?logo=helm&logoColor=white)](https://helm.sh/)
[![Google Cloud](https://img.shields.io/badge/Google%20Cloud-Artifact%20Registry-4285F4?logo=googlecloud&logoColor=white)](https://cloud.google.com/artifact-registry)
[![Identity Platform](https://img.shields.io/badge/Google%20Cloud-Identity%20Platform-4285F4?logo=googlecloud&logoColor=white)](https://cloud.google.com/identity-platform)
[![Firebase Admin SDK](https://img.shields.io/badge/Firebase-Admin%20SDK-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/docs/admin)
[![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-CI%2FCD-2088FF?logo=githubactions&logoColor=white)](https://github.com/features/actions)
[![Trivy](https://img.shields.io/badge/Trivy-Security%20Scan-1904DA?logo=aqua&logoColor=white)](https://trivy.dev/)
[![JUnit 5](https://img.shields.io/badge/JUnit-5-25A162?logo=junit5&logoColor=white)](https://junit.org/junit5/)
[![Testcontainers](https://img.shields.io/badge/Testcontainers-Integration-00B5E2?logo=docker&logoColor=white)](https://testcontainers.com/)
[![Mockito](https://img.shields.io/badge/Mockito-Unit%20Tests-4CAF50)](https://site.mockito.org/)
[![JaCoCo](https://img.shields.io/badge/JaCoCo-Coverage-DC322F)](https://www.jacoco.org/jacoco/)
[![Postman](https://img.shields.io/badge/Postman-API%20Testing-FF6C37?logo=postman&logoColor=white)](https://www.postman.com/)

---

## What It Does

**Cloud Secrets Manager** solves the critical problem of securely handling sensitive credentials in modern cloud applications. Instead of hardcoding secrets or storing them in environment variables, this system provides:

- **Encrypted Storage** - AES-256 encryption at rest
- **Secure Access** - JWT authentication with Google Identity Platform
- **Access Control** - Role-based access control (RBAC) with fine-grained permissions
- **Audit Trail** - Complete logging of all operations
- **Versioning** - Track changes and rollback to previous versions
- **Cloud-Native** - Built for Kubernetes and containerized environments

---

## Key Features

### Implemented

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

### Planned

- Secret expiration and automatic cleanup
- Scheduled secret rotation
- Secret sharing between users/teams
- Token blacklisting (Redis-based)
- Rate limiting
- Advanced monitoring (Prometheus, Grafana)

---

## Repository Structure

```
apps/
  backend/
    secret-service/      # Core API for secrets
    audit-service/       # Audit logging microservice
  frontend/              # Placeholder UI (coming soon)
infrastructure/
  docker/                # docker-compose.yml and helpers
  kubernetes/k8s/        # Base manifests (ConfigMaps, Deployments, Secrets)
  helm/cloud-secrets-manager/  # Production Helm chart
deployment/
  scripts/               # Automated setup / helper scripts
testing/
  postman/               # Collections, environments, Postman helpers
  *.sh                   # CLI smoke/diagnostic scripts
docs/                    # Project wiki (current, deployment, status, planning)
```

This monorepo layout keeps backend services, tooling, infrastructure, and docs organized while we grow the platform (frontend stub included for future UI work).

---

## Quick Start

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
docker-compose -f infrastructure/docker/docker-compose.yml up --build
```

This starts:
- **Secret Service** on `http://localhost:8080`
- **Audit Service** on `http://localhost:8081`
- PostgreSQL databases

### Verify Setup

```bash
# Test Google Cloud setup
./testing/test-google-cloud-setup.sh

# Test authentication
./testing/test-auth.sh
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

## Documentation

Comprehensive documentation is available in the [`docs/`](docs/README.md) directory:

- **[Complete Overview](docs/PROJECT_OVERVIEW.md)** - Full project documentation
- **[Setup Guide](docs/current/GOOGLE_IDENTITY_SETUP.md)** - Google Identity Platform setup
- **[Deployment Guide](docs/deployment/DEPLOYMENT_INDEX.md)** - Kubernetes / Helm / Artifact Registry deployment
- **[API Testing](testing/postman/README.md)** - Postman collection guide

**Quick Links:**
- [Documentation Index](docs/README.md)
- [Current Status](docs/status/STATUS.md)
- [Next Steps](docs/NEXT_STEPS.md)

---

## Architecture

```

   Client    

       
       
          
  Secret Service              Audit Service   
   (Port 8080)       (Port 8081)    
          
                                       
                                       
              
 Secrets DB                   Audit DB    
 (PostgreSQL)                (PostgreSQL) 
              
```

**Two microservices:**
- **Secret Service** - Handles secret CRUD, encryption, authentication
- **Audit Service** - Handles audit logging and compliance

---

## Tech Stack

- **Backend & Security**: Java 21, Spring Boot 3.3.5, Spring Security, Spring Data JPA, AES-256 encryption
- **Persistence**: PostgreSQL 16 (Secrets DB + Audit DB), Spring Data JPA/Hibernate schema management
- **Cloud & Identity**: Google Cloud Identity Platform, Firebase Admin SDK, Google Cloud Artifact Registry, JWT (access + refresh tokens)
- **Containers & Deployment**: Docker, Docker Compose, Kubernetes, Helm, scripted namespace/secret bootstrap
- **CI/CD & Security**: GitHub Actions pipelines, Trivy scans, GitHub Security tab integration
- **Testing & QA**: JUnit 5, Mockito, Testcontainers, JaCoCo, Postman collections
- **Docs & Monitoring**: OpenAPI/Swagger, Spring Boot Actuator, Grafana/Prometheus dashboards (planned)

---

## Project Status

**Current Phase:** Production Features (60% complete)

- MVP Foundation - Complete
- Enhanced Security - Complete
- Production Features - In Progress
- Monitoring & Observability - Planned
- Testing Infrastructure - 60% complete

See [Status](docs/status/STATUS.md) for detailed progress.

---

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## Links

- **Documentation**: [docs/README.md](docs/README.md)
- **Issues**: [GitHub Issues](https://github.com/your-username/cloud-secrets-manager/issues)
- **API Docs**: `http://localhost:8080/swagger-ui.html` (when running)

---

**Built with  for secure cloud-native applications**
