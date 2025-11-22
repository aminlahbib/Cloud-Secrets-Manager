# Kubernetes Manifests

This directory contains Kubernetes deployment manifests scoped to the `cloud-secrets-manager` namespace.

## Architecture

**Database:** Uses Google Cloud SQL (managed PostgreSQL) via Cloud SQL Proxy sidecar.
**Secrets:** Managed by External Secrets Operator (ESO) syncing from Google Secret Manager.

## Structure

- `k8s/` - Base Kubernetes manifests
  - `namespace.yaml` - Namespace definition
  - `secret-service-deployment.yaml` - Secret Service with Cloud SQL Proxy
  - `audit-service-deployment.yaml` - Audit Service with Cloud SQL Proxy
  - `external-secrets.yaml` - External Secrets Operator resources (syncs from GCP Secret Manager)
  - `ingress.yaml` - Ingress configuration
  - `k8s-secrets.yaml` - **DEPRECATED** (kept for reference, use ESO instead)

## Prerequisites

1. **Infrastructure:** Terraform must be applied to create:
   - GKE Cluster
   - Cloud SQL instance
   - IAM Service Accounts
   - Google Secret Manager secrets

2. **External Secrets Operator:** Must be installed (via Terraform)

3. **Secrets in Google Secret Manager:** Must be created (see `docs/deployment/EXTERNAL_SECRETS_SETUP.md`)

## Usage

```bash
# 1. Create/refresh the dedicated namespace
kubectl apply -f infrastructure/kubernetes/k8s/namespace.yaml

# 2. Apply External Secrets (syncs secrets from Google Secret Manager)
kubectl apply -f infrastructure/kubernetes/k8s/external-secrets.yaml

# 3. Verify secrets are synced
kubectl get externalsecrets -n cloud-secrets-manager
kubectl get secrets -n cloud-secrets-manager

# 4. Apply service deployments
kubectl apply -f infrastructure/kubernetes/k8s/secret-service-deployment.yaml
kubectl apply -f infrastructure/kubernetes/k8s/audit-service-deployment.yaml

# Or apply everything at once (excluding deprecated k8s-secrets.yaml)
kubectl apply -n cloud-secrets-manager -f infrastructure/kubernetes/k8s/namespace.yaml
kubectl apply -n cloud-secrets-manager -f infrastructure/kubernetes/k8s/external-secrets.yaml
kubectl apply -n cloud-secrets-manager -f infrastructure/kubernetes/k8s/secret-service-deployment.yaml
kubectl apply -n cloud-secrets-manager -f infrastructure/kubernetes/k8s/audit-service-deployment.yaml
```

## Note

For production deployments, prefer the Helm chart in `infrastructure/helm/` which provides better configuration management and templating.
