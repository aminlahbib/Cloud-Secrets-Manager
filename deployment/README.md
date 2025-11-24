# Deployment

This directory contains deployment configurations, CI/CD pipelines, and environment-specific resources for Cloud Secrets Manager.

## Directory Structure

```
deployment/
├── ci-cd/              # CI/CD pipeline configurations
├── scripts/            # Deployment helper scripts
├── dev/                # Development environment configs (if needed)
├── staging/            # Staging environment configs (if needed)
└── production/         # Production environment configs (if needed)
```

## Components

### 🚀 `ci-cd/`
CI/CD pipeline configurations using Google Cloud Build:
- **`cloudbuild.yaml`** - Base Cloud Build configuration
- **`cloudbuild-dev.yaml`** - Development environment build
- **`cloudbuild-staging.yaml`** - Staging environment build
- **`cloudbuild-production.yaml`** - Production environment build

**Usage:**
```bash
# Build and deploy to development
gcloud builds submit --config=deployment/ci-cd/cloudbuild-dev.yaml

# Build and deploy to staging
gcloud builds submit --config=deployment/ci-cd/cloudbuild-staging.yaml

# Build and deploy to production
gcloud builds submit --config=deployment/ci-cd/cloudbuild-production.yaml
```

**See:** [`ci-cd/CLOUD_BUILD_SETUP.md`](../docs/deployment/ci-cd/CLOUD_BUILD_SETUP.md) for detailed setup instructions.

### 📜 `scripts/`
Deployment helper scripts:
- **`setup-kubernetes-secrets.sh`** - Setup Kubernetes secrets from Google Secret Manager

**Usage:**
```bash
./deployment/scripts/setup-kubernetes-secrets.sh
```

**Note:** Most deployment scripts are in the root `scripts/` directory. This directory contains deployment-specific helpers.

### 🌍 Environment Directories
Environment-specific configurations (currently empty, can be populated as needed):
- **`dev/`** - Development environment overrides
- **`staging/`** - Staging environment overrides
- **`production/`** - Production environment overrides

These directories can be used for:
- Environment-specific Helm values
- Environment-specific Terraform variables
- Environment-specific Kubernetes manifests

## Deployment Workflows

### Local Development
```bash
# Use Docker Compose (see infrastructure/docker/)
docker-compose -f infrastructure/docker/docker-compose.yml up
```

### Kubernetes Deployment (Helm)
```bash
# Deploy using Helm charts
helm install cloud-secrets-manager ./infrastructure/helm/cloud-secrets-manager \
  -f ./infrastructure/helm/cloud-secrets-manager/values-production.yaml
```

### Kubernetes Deployment (Raw Manifests)
```bash
# Deploy using raw Kubernetes manifests
kubectl apply -f infrastructure/kubernetes/k8s/
```

### CI/CD Pipeline
```bash
# Trigger Cloud Build pipeline
gcloud builds submit --config=deployment/ci-cd/cloudbuild-production.yaml
```

## Related Documentation

- **[Complete Deployment Guide](../docs/deployment/COMPLETE_DEPLOYMENT_GUIDE.md)** - Full deployment walkthrough
- **[Local Development Guide](../docs/deployment/LOCAL_DEVELOPMENT_GUIDE.md)** - Local setup
- **[Operations Guide](../docs/deployment/OPERATIONS_GUIDE.md)** - Day-to-day operations
- **[CI/CD Setup](../docs/deployment/ci-cd/CI_CD_SETUP.md)** - Pipeline configuration
- **[Cloud Build Setup](../docs/deployment/ci-cd/CLOUD_BUILD_SETUP.md)** - Google Cloud Build

## Infrastructure vs Deployment

**`infrastructure/`** contains:
- Infrastructure as Code (Terraform)
- Kubernetes manifests and Helm charts
- Docker Compose for local development
- Database schemas and migrations

**`deployment/`** contains:
- CI/CD pipeline configurations
- Deployment scripts and automation
- Environment-specific deployment configs

## Quick Reference

### Deploy to Development
```bash
gcloud builds submit --config=deployment/ci-cd/cloudbuild-dev.yaml
```

### Deploy to Staging
```bash
gcloud builds submit --config=deployment/ci-cd/cloudbuild-staging.yaml
```

### Deploy to Production
```bash
gcloud builds submit --config=deployment/ci-cd/cloudbuild-production.yaml
```

### Verify Deployment
```bash
./scripts/verify-deployment.sh
```

---

**Last Updated:** December 2024

