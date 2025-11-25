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

### ✅ Implemented & Operational

- **Authentication & Authorization**
  - ✅ Google Cloud Identity Platform (Firebase Auth) integration
  - ✅ Google OAuth sign-in (working locally)
  - ✅ JWT tokens with auto-refresh mechanism
  - ✅ RBAC with fine-grained permissions (READ, WRITE, DELETE, SHARE, ROTATE)
  - ✅ Dual authentication support (Firebase + Local JWT)

- **Secret Management**
  - ✅ Full CRUD operations via REST API
  - ✅ AES-256 encryption at rest
  - ✅ Automatic versioning
  - ✅ Rollback to previous versions
  - ✅ Secret sharing between users
  - ✅ Bulk operations (create, update, delete)
  - ✅ Secret expiration and lifecycle management

- **Security & Compliance**
  - ✅ JWT token blacklisting with Redis
  - ✅ Kubernetes Network Policies
  - ✅ Pod Security Standards enforced
  - ✅ Rate limiting and security headers
  - ✅ Cloud SQL backup and disaster recovery
  - ✅ Complete audit logging via separate microservice

- **Observability & Reliability**
  - ✅ Prometheus metrics collection
  - ✅ Grafana dashboards (overview, JVM, database)
  - ✅ OpenTelemetry distributed tracing (Grafana Tempo)
  - ✅ Service Level Objectives (SLOs) and alerts
  - ✅ Comprehensive runbooks for incident response

- **Infrastructure & Deployment**
  - ✅ Docker & Docker Compose for local development
  - ✅ Kubernetes & Helm charts for GKE
  - ✅ CI/CD with GitHub Actions (disabled for solo dev workflow)
  - ✅ Trivy security scanning
  - ✅ Google Artifact Registry integration
  - ✅ External Secrets Operator (ESO) for secret management

- **Testing & Quality**
  - ✅ 80%+ test coverage (JaCoCo reports)
  - ✅ Comprehensive unit and integration tests
  - ✅ Testcontainers for database testing
  - ✅ k6 load and performance tests
  - ✅ Chaos engineering experiments

- **Frontend (React + TypeScript)**
  - ✅ UI/UX design specification and wireframes
  - ✅ React 18 + TypeScript + Tailwind CSS setup
  - ✅ Login page with Google OAuth
  - ✅ Protected routing and session management
  - 🚧 Secrets Management UI (in progress)
  - 🚧 Audit Logs UI (planned)
  - 🚧 Admin UI (planned)

### 🚧 In Progress

- **Frontend Development**
  - Secret list with pagination/filtering
  - Secret detail view
  - Create/Edit/Delete forms
  - Secret sharing UI
  - Audit logs viewer

### 📅 Future Enhancements

- Scheduled secret rotation policies
- Multi-region replication
- Advanced analytics and reporting
- Mobile app (iOS/Android)

---

## Repository Structure

```
apps/
  backend/
    secret-service/      # Core API for secrets (Spring Boot)
    audit-service/       # Audit logging microservice (Spring Boot)
  frontend/              # React + TypeScript UI (in development)
infrastructure/
  docker/                # docker-compose.yml for local development
  kubernetes/k8s/        # Base Kubernetes manifests
  helm/cloud-secrets-manager/  # Production Helm charts
  gcp/                   # GCP service account keys (gitignored)
deployment/
  scripts/               # Automated setup and helper scripts
testing/
  postman/               # Postman collections for API testing
  performance/           # k6 load testing scripts
  *.sh                   # CLI smoke tests and chaos experiments
monitoring/
  grafana/               # Grafana dashboards (JSON)
  servicemonitors/       # Prometheus ServiceMonitors
  alerts/                # PrometheusRule alert definitions
  tracing/               # Grafana Tempo configuration
security/
  policies/              # Network Policies, Pod Security Standards
docs/                    # Comprehensive documentation
  current/               # Active documentation and references
  deployment/            # Deployment and operations guides
  archive/               # Completed epic summaries and guides
  features/              # Feature development and testing
```

This monorepo keeps all backend services, infrastructure, frontend, testing, monitoring, and documentation organized and co-located.

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

### Getting Started
- **[Local Development Guide](docs/deployment/LOCAL_DEVELOPMENT_GUIDE.md)** ⭐ - Run locally with Docker Compose
- **[Complete Deployment Guide](docs/deployment/COMPLETE_DEPLOYMENT_GUIDE.md)** - Deploy to GKE
- **[Frontend UI Specification](docs/current/FRONTEND_UI_SPECIFICATION.md)** - UI/UX design and wireframes

### Operations
- **[Operations Guide](docs/deployment/OPERATIONS_GUIDE.md)** - Day-to-day management
- **[Monitoring Setup](docs/deployment/monitoring/MONITORING_SETUP.md)** - Prometheus/Grafana/Tempo
- **[Runbooks](docs/deployment/monitoring/RUNBOOKS.md)** - Incident response procedures

### Reference
- **[Firebase Quick Reference](docs/current/FIREBASE_QUICK_REFERENCE.md)** - Authentication commands
- **[Testing Strategy](docs/features/TESTING_STRATEGY_UPDATE.md)** - Testing approach
- **[Documentation Index](docs/README.md)** - Complete documentation hub

### Completed Work
- **[Epic Summaries](docs/archive/epics/)** - Epics 1-5 implementation details
- **[Firebase Integration](docs/archive/firebase-integration/)** - Google OAuth setup and testing
- **[Archive Index](docs/archive/README.md)** - All completed guides

**API Documentation:**  
Once running, access Swagger UI at `http://localhost:8080/swagger-ui.html`

---

## Architecture
              
```mermaid
graph LR
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

### Backend
- **Framework**: Java 21, Spring Boot 3.3.5, Spring Security, Spring Data JPA
- **Database**: PostgreSQL 16 (Secrets DB + Audit DB)
- **Security**: AES-256 encryption, JWT tokens, Redis for token blacklisting
- **Observability**: Spring Boot Actuator, Micrometer, OpenTelemetry

### Frontend
- **Framework**: React 18, TypeScript 5
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query, React Context
- **Forms**: React Hook Form + Zod
- **UI Components**: Custom component library with Lucide icons

### Cloud & Infrastructure
- **Platform**: Google Kubernetes Engine (GKE)
- **Database**: Google Cloud SQL (PostgreSQL)
- **Secrets**: Google Secret Manager + External Secrets Operator
- **Registry**: Google Artifact Registry
- **Authentication**: Firebase Authentication (Google Cloud Identity Platform)

### Monitoring & Observability
- **Metrics**: Prometheus + ServiceMonitors
- **Visualization**: Grafana (dashboards for services, JVM, database)
- **Tracing**: Grafana Tempo + OpenTelemetry
- **Alerting**: PrometheusRule with custom alerts
- **Logging**: Structured JSON logs with trace correlation

### Security
- **Network**: Kubernetes Network Policies
- **Pod Security**: Pod Security Standards (restricted)
- **Scanning**: Trivy for container vulnerability scanning
- **Encryption**: AES-256 at rest, TLS in transit

### CI/CD & Automation
- **Pipeline**: GitHub Actions (build, test, scan, push to Artifact Registry)
- **Deployment**: Helm charts with environment-specific values
- **Testing**: Automated test runs with JaCoCo coverage reporting

### Testing
- **Unit Testing**: JUnit 5, Mockito
- **Integration Testing**: Testcontainers (PostgreSQL)
- **Load Testing**: k6 with performance scenarios
- **Chaos Testing**: kubectl-based chaos experiments
- **API Testing**: Postman collections

---

## Project Status

**Current Phase:** Frontend Development (Epic 5) - 40% Complete

### Completed Epics ✅
- ✅ **Epic 1**: CI/CD to GKE & Environments
- ✅ **Epic 2**: Observability & Reliability (Prometheus/Grafana/Tempo)
- ✅ **Epic 3**: Security & Compliance Hardening
- ✅ **Epic 4**: Testing, Resilience, and Performance (80%+ coverage)
- ✅ **Epic 5**: Frontend & UX Design (Specification complete)

### In Progress 🚧
- 🚧 **Epic 5**: Frontend Implementation
  - ✅ Authentication (Google OAuth working)
  - 🚧 Secrets Management UI
  - 📅 Audit Logs UI
  - 📅 Admin UI

### Metrics
- **Backend Test Coverage**: 80%+
- **Services**: 2 microservices (secret-service, audit-service)
- **Monitoring**: 17 Prometheus alert rules, 3 Grafana dashboards
- **Security**: Network policies enforced, Pod security standards (restricted)
- **Performance**: Tested up to 500 RPS with k6

See [`docs/archive/`](docs/archive/README.md) for completed epic implementation summaries.

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
