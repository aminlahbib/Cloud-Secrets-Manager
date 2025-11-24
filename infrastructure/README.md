# Infrastructure

This directory contains all infrastructure-as-code (IaC) definitions, deployment configurations, and infrastructure-related resources for Cloud Secrets Manager.

## Directory Structure

```
infrastructure/
├── database/          # Database schemas, migrations, and seeds
├── docker/            # Docker Compose configuration for local development
├── gcp/               # GCP-specific resources (service account keys, etc.)
├── helm/              # Helm charts for Kubernetes deployment
├── kubernetes/        # Base Kubernetes manifests
└── terraform/         # Terraform modules and environment configurations
```

## Components

### 🗄️ `database/`
Database-related resources:
- **`migrations/`** - SQL migration scripts for schema changes
- **`schemas/`** - Database schema definitions
- **`seeds/`** - Seed data for development/testing

**See:** [`database/migrations/README.md`](database/migrations/README.md)

### 🐳 `docker/`
Docker Compose configuration for local development:
- **`docker-compose.yml`** - Complete local development stack
  - Secret Service (port 8080)
  - Audit Service (port 8081)
  - PostgreSQL databases (secrets-db, audit-db)
  - Frontend (port 3000)

**Usage:**
```bash
docker-compose -f infrastructure/docker/docker-compose.yml up --build
```

**See:** [`docker/README.md`](docker/README.md)

### ☁️ `gcp/`
Google Cloud Platform resources:
- **`keys/`** - Service account keys (gitignored, never commit!)
  - `firebase-admin-key.json` - Firebase Admin SDK credentials

**⚠️ Security Note:** All files in `keys/` are gitignored. Never commit service account keys to version control.

### 🎯 `helm/`
Helm charts for Kubernetes deployment:
- **`cloud-secrets-manager/`** - Main Helm chart
  - `Chart.yaml` - Chart metadata
  - `values.yaml` - Default values
  - `values-staging.yaml` - Staging environment values
  - `values-production.yaml` - Production environment values
  - `templates/` - Kubernetes manifest templates

**Deployment:**
```bash
helm install cloud-secrets-manager ./infrastructure/helm/cloud-secrets-manager \
  -f ./infrastructure/helm/cloud-secrets-manager/values-production.yaml
```

**See:** [`helm/README.md`](helm/README.md)

### ☸️ `kubernetes/`
Base Kubernetes manifests (not using Helm):
- **`k8s/`** - Raw Kubernetes YAML files
  - Service deployments
  - ConfigMaps and Secrets
  - Ingress configuration
  - Network policies
  - Pod security standards
  - Monitoring configuration

**See:** [`kubernetes/README.md`](kubernetes/README.md)

### 🏗️ `terraform/`
Infrastructure as Code using Terraform:
- **`modules/`** - Reusable Terraform modules
  - `gke-cluster/` - GKE cluster configuration
  - `postgresql/` - Cloud SQL PostgreSQL setup
  - `artifact-registry/` - Container registry
  - `iam/` - IAM roles and service accounts
  - `billing-budget/` - Cost management
- **`environments/`** - Environment-specific configurations
  - `dev/` - Development environment
  - `staging/` - Staging environment
  - `production/` - Production environment

**Usage:**
```bash
cd infrastructure/terraform/environments/dev
terraform init
terraform plan
terraform apply
```

**See:** [`terraform/README.md`](terraform/README.md)

## Quick Start

### Local Development
```bash
# Start all services with Docker Compose
docker-compose -f infrastructure/docker/docker-compose.yml up --build
```

### Kubernetes Deployment
```bash
# Using Helm (recommended)
helm install cloud-secrets-manager ./infrastructure/helm/cloud-secrets-manager

# Or using raw Kubernetes manifests
kubectl apply -f infrastructure/kubernetes/k8s/
```

### Infrastructure Provisioning
```bash
# Provision GKE cluster and Cloud SQL
cd infrastructure/terraform/environments/dev
terraform apply
```

## Related Documentation

- **[Complete Deployment Guide](../../docs/deployment/COMPLETE_DEPLOYMENT_GUIDE.md)** - Full deployment walkthrough
- **[Local Development Guide](../../docs/deployment/LOCAL_DEVELOPMENT_GUIDE.md)** - Local setup instructions
- **[Terraform Guide](../../docs/deployment/terraform/TERRAFORM_GUIDE.md)** - Infrastructure provisioning
- **[Helm Deployment Guide](../../docs/deployment/helm/HELM_DEPLOYMENT_GUIDE.md)** - Kubernetes deployment

## Security Notes

⚠️ **Important:**
- Never commit service account keys or secrets to version control
- All sensitive files in `gcp/keys/` are gitignored
- Use External Secrets Operator for production secret management
- Review network policies and pod security standards before deployment

## Maintenance

- **Database Migrations:** Add new migrations to `database/migrations/`
- **Helm Charts:** Update `helm/cloud-secrets-manager/` for Kubernetes changes
- **Terraform:** Modify modules in `terraform/modules/` and apply via environments
- **Docker Compose:** Update `docker/docker-compose.yml` for local development changes

---

**Last Updated:** December 2024

