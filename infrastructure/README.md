# Infrastructure

This directory contains all infrastructure-as-code and deployment configurations for Cloud Secrets Manager.

## Directory Structure

```
infrastructure/
│
├── terraform/              # Cloud infrastructure (GCP)
│   ├── environments/       # Environment-specific configs
│   │   ├── dev/
│   │   ├── staging/
│   │   └── production/
│   └── modules/            # Reusable Terraform modules
│       ├── gke-cluster/
│       ├── postgresql/
│       ├── artifact-registry/
│       └── ...
│
├── kubernetes/             # Kubernetes manifests & Helm
│   ├── helm/               # Helm charts
│   │   └── cloud-secrets-manager/
│   └── manifests/          # Raw K8s manifests
│       └── k8s/
│
├── ci-cd/                  # CI/CD pipelines
│   ├── cloudbuild.yaml
│   └── ...
│
├── monitoring/             # Observability stack
│   ├── alerts/             # Prometheus rules
│   ├── dashboards/         # Grafana dashboards
│   └── servicemonitors/
│
├── security/               # Security policies
│   ├── policies/           # Network & pod policies
│   └── scans/              # Security scan results
│
└── gcp/                    # GCP-specific configs
    └── keys/               # Service account keys (gitignored)
```

## Quick Reference

| Task | Location |
|------|----------|
| Provision GCP resources | `terraform/` |
| Deploy to Kubernetes | `kubernetes/helm/` |
| Set up CI/CD | `ci-cd/` |
| Configure monitoring | `monitoring/` |
| Apply security policies | `security/` |

## Local Development

For local development, use the `docker/` directory at the project root:

```bash
cd ../docker
docker-compose up
```

## Production Deployment

### 1. Provision Infrastructure (Terraform)

```bash
cd terraform/environments/production
terraform init
terraform plan
terraform apply
```

### 2. Deploy Application (Helm)

```bash
cd kubernetes/helm
helm upgrade --install csm ./cloud-secrets-manager \
  -f cloud-secrets-manager/values-production.yaml \
  -n cloud-secrets-manager
```

### 3. Apply Security Policies

```bash
kubectl apply -f security/policies/
```

### 4. Configure Monitoring

```bash
kubectl apply -f monitoring/servicemonitors/
kubectl apply -f monitoring/alerts/
```

## Environment Comparison

| Aspect | Dev | Staging | Production |
|--------|-----|---------|------------|
| GKE Nodes | 1 | 2 | 3+ |
| Cloud SQL | Shared | Dedicated | HA |
| Replicas | 1 | 2 | 3 |
| Auto-scaling | No | Yes | Yes |
| Monitoring | Basic | Full | Full + Alerts |
