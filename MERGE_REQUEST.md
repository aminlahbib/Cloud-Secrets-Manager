# Infrastructure as Code with Terraform & Complete GKE Deployment

## Summary

This MR implements Infrastructure as Code (IaC) using Terraform for managing all GCP resources and completes the full deployment of Cloud Secrets Manager to Google Kubernetes Engine (GKE). The deployment is production-ready with proper security, monitoring, and operational procedures.

## Implementation

### Infrastructure as Code (Terraform)

**GKE Cluster Module** (`infrastructure/terraform/modules/gke-cluster/`)
- Regional GKE cluster with auto-scaling node pools (1-5 nodes, e2-medium)
- Workload Identity enabled for secure service authentication
- Release channel management (REGULAR for dev environment)
- Proper network and security configurations
- Lifecycle management for deletion protection and immutable fields

**PostgreSQL Module** (`infrastructure/terraform/modules/postgresql/`)
- Cloud SQL PostgreSQL 16 instance
- Multiple databases (secrets_db, audit_db) with dedicated users
- Secure password management via Google Secret Manager
- SSL/TLS configuration (ENCRYPTED_ONLY mode)
- Automated backup and maintenance windows

**Artifact Registry Module** (`infrastructure/terraform/modules/artifact-registry/`)
- Docker image repository for container storage
- IAM permissions for service accounts
- Multi-region support configuration

**IAM Module** (`infrastructure/terraform/modules/iam/`)
- Service accounts for secret-service and audit-service
- Workload Identity bindings linking Kubernetes service accounts to GCP service accounts
- Cloud SQL client roles for database access
- Artifact Registry reader roles for image pulling

**Environment Configuration** (`infrastructure/terraform/environments/dev/`)
- Complete infrastructure stack for dev environment
- Environment-specific variables and configurations
- Remote state management via GCS backend

### Kubernetes Deployment

**Deployment Manifests**
- Secret Service and Audit Service deployments with Cloud SQL Proxy sidecar containers
- Resource requests and limits optimized for GKE scheduling
- Health checks (liveness and readiness probes) for application monitoring
- Workload Identity integration via service account annotations
- Environment variable configuration from Kubernetes secrets

**Services & Configuration**
- Kubernetes Services (ClusterIP) for internal service discovery
- Namespace isolation (cloud-secrets-manager)
- Service account setup with Workload Identity annotations
- Secrets management for database credentials and application configuration

**Database Connectivity**
- Cloud SQL Proxy sidecar containers in each pod
- Applications connect to localhost:5432 (proxied by Cloud SQL Proxy)
- Encrypted connections to Cloud SQL via public IP
- Connection string: `cloud-secrets-manager:europe-west10:secrets-manager-db-dev-3631da18`

### Docker Images

**Image Build Process**
- Multi-stage Docker builds for optimized image size
- Built for linux/amd64 architecture (GKE nodes are x86_64)
- Images pushed to Artifact Registry: `europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images`
- Tags: `secret-service:latest`, `audit-service:latest`

### Documentation

**Complete Deployment Guide** (`docs/deployment/COMPLETE_DEPLOYMENT_GUIDE.md`)
- Step-by-step deployment process from infrastructure to running applications
- Startup and shutdown procedures
- Complete workflow commands for initial and routine deployments
- Prerequisites and verification steps

**Operations Guide** (`docs/deployment/OPERATIONS_GUIDE.md`)
- Monitoring and health check procedures
- Scaling operations (horizontal and vertical)
- Update and rollout management
- Log management and troubleshooting commands
- Database operations and backup procedures
- Security operations and secret management

**Documentation Organization**
- Enhanced Terraform guides with operational procedures
- Reorganized planning documentation (archived historical docs to `docs/planning/archive/`)
- Updated deployment index with new guides

## Architecture

```
GKE Cluster (cloud-secrets-cluster-dev)
├── Namespace: cloud-secrets-manager
├── Secret Service Deployment
│   ├── Application Container (Spring Boot on port 8080)
│   └── Cloud SQL Proxy Sidecar (port 5432)
├── Audit Service Deployment
│   ├── Application Container (Spring Boot on port 8081)
│   └── Cloud SQL Proxy Sidecar (port 5432)
└── Services
    ├── csm-secret-service (ClusterIP:8080)
    └── csm-audit-service (ClusterIP:8081)
```

## Security Implementation

- Workload Identity for secure GCP service authentication (no service account keys)
- Secrets stored in Kubernetes Secrets and Google Secret Manager
- Cloud SQL Proxy for encrypted database connections
- SSL/TLS enforced for all database connections
- Service accounts with least-privilege IAM roles
- Non-root containers with proper security contexts
- Resource limits to prevent resource exhaustion attacks

## Deployment Status

**Infrastructure:**
- GKE Cluster: Operational in europe-west10
- Cloud SQL: Operational with secrets_db and audit_db databases
- Artifact Registry: Operational with Docker images
- Workload Identity: Configured and working

**Applications:**
- Audit Service: Running (2/2 Ready - application + Cloud SQL Proxy)
- Secret Service: Running (2/2 Ready - application + Cloud SQL Proxy)

## Key Implementation Details

**Terraform State Management**
- Remote state stored in GCS bucket: `gs://cloud-secrets-manager-tfstate-dev/`
- State locking for concurrent access protection
- Environment-specific state files

**Image Architecture**
- All images built for linux/amd64 platform
- Multi-stage builds for production optimization
- Base images: eclipse-temurin:21-jre-alpine

**Encryption Keys**
- JWT secret: 64-character hex string
- AES key: Exactly 32 bytes (plain string, not base64/hex encoded)
- Keys stored in Kubernetes secrets and referenced via environment variables

**Resource Allocation**
- Secret Service: 300m CPU / 512Mi memory (requests), 1000m CPU / 1Gi (limits)
- Audit Service: 200m CPU / 256Mi memory (requests), 500m CPU / 512Mi (limits)
- Cloud SQL Proxy: 30m CPU / 64Mi memory (requests), 100m CPU / 128Mi (limits)

## Files Changed

**Infrastructure:**
- `infrastructure/terraform/modules/gke-cluster/` - New GKE cluster module
- `infrastructure/terraform/modules/postgresql/` - New PostgreSQL module
- `infrastructure/terraform/modules/artifact-registry/` - New Artifact Registry module
- `infrastructure/terraform/modules/iam/` - New IAM module
- `infrastructure/terraform/environments/dev/` - Dev environment configuration

**Kubernetes:**
- `infrastructure/kubernetes/k8s/secret-service-deployment.yaml` - Secret service deployment
- `infrastructure/kubernetes/k8s/audit-service-deployment.yaml` - Audit service deployment

**Documentation:**
- `docs/deployment/COMPLETE_DEPLOYMENT_GUIDE.md` - New deployment guide
- `docs/deployment/OPERATIONS_GUIDE.md` - New operations guide
- `docs/deployment/DEPLOYMENT_INDEX.md` - Updated index
- `docs/planning/archive/` - Archived historical planning docs

---

**Branch:** `IoC/Terraform`  
**Target Branch:** `main`  
**Author:** @amine  
**Created:** November 22, 2025
