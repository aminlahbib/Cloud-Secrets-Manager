# Helm Charts

This directory contains Helm charts for deploying Cloud Secrets Manager to Kubernetes.

## Structure

- `cloud-secrets-manager/` - Main Helm chart
  - `Chart.yaml` - Chart metadata
  - `values.yaml` - Default values
  - `templates/` - Kubernetes resource templates

## Usage

```bash
# Install
helm install cloud-secrets-manager ./infrastructure/helm/cloud-secrets-manager \
    --namespace=secrets-manager \
    --create-namespace

# Upgrade
helm upgrade cloud-secrets-manager ./infrastructure/helm/cloud-secrets-manager \
    --namespace=secrets-manager

# Uninstall
helm uninstall cloud-secrets-manager --namespace=secrets-manager
```

## Configuration

Edit `values.yaml` to customize deployment settings.
