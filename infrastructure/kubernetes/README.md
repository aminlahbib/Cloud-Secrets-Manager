# Kubernetes Manifests

This directory contains Kubernetes deployment manifests scoped to the `cloud-secrets-manager` namespace.

## Structure

- `k8s/` - Base Kubernetes manifests
  - `namespace.yaml`
  - `secret-service-deployment.yaml`
  - `audit-service-deployment.yaml`
  - `secrets-db-deployment.yaml`
  - `audit-db-deployment.yaml`
  - `ingress.yaml`
  - `k8s-secrets.yaml`

## Usage

```bash
# 1. Create/refresh the dedicated namespace (safe to re-apply)
kubectl apply -f infrastructure/kubernetes/k8s/namespace.yaml

# 2. Apply the rest of the stack into that namespace
kubectl apply -n cloud-secrets-manager -f infrastructure/kubernetes/k8s/

# Apply a specific resource
kubectl apply -n cloud-secrets-manager -f infrastructure/kubernetes/k8s/secret-service-deployment.yaml
```

## Note

For production deployments, prefer the Helm chart in `infrastructure/helm/` which already mirrors this naming/labeling scheme.
