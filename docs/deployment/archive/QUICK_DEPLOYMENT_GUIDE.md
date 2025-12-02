# Quick Deployment Guide

Use this checklist to deploy Cloud Secrets Manager to a production-like GKE cluster as quickly and safely as possible. Each step links to the deeper documentation it builds on.

---

## Before you start

| Requirement | Details |
| --- | --- |
| GCP project | Billing enabled, APIs turned on for GKE, Cloud SQL, Artifact Registry, Secret Manager, Cloud Build |
| Terraform backend | Remote state bucket + locking table configured (see [Terraform Guide](./terraform/TERRAFORM_GUIDE.md)) |
| CLI tooling | `gcloud`, `kubectl`, `helm`, `terraform`, `docker` |
| Access | GCP IAM roles for Admin (or delegated roles for compute, storage, secretmanager), Artifact Registry push |
| Source | Latest `main` checked out locally |

---

## Step 0 – Environment prep

```bash
export PROJECT_ID=<gcp-project-id>
export REGION=<gcp-region>
export CLUSTER_NAME=csm-gke
export TF_WORKSPACE=prod

gcloud auth login
gcloud config set project "${PROJECT_ID}"
gcloud auth application-default login
gcloud container clusters get-credentials "${CLUSTER_NAME}" --region "${REGION}"
```

If you manage infrastructure from this host, also run `gcloud auth login --update-adc` so Terraform picks up the right credentials.

---

## Step 1 – Provision infrastructure (Terraform)

1. Review/adjust variables in `infra/env/<env>.tfvars`.  
2. Initialize and apply:

```bash
cd infrastructure/terraform
terraform workspace select "${TF_WORKSPACE}" || terraform workspace new "${TF_WORKSPACE}"
terraform init
terraform plan -var-file="env/${TF_WORKSPACE}.tfvars"
terraform apply -var-file="env/${TF_WORKSPACE}.tfvars"
```

Outputs include the GKE cluster name, VPC, Cloud SQL connection string, Artifact Registry repo, and service accounts. Full reference: [Terraform Guide](./terraform/TERRAFORM_GUIDE.md).

---

## Step 2 – Configure secrets & identity

1. **External Secrets Operator**  
   - Store runtime secrets in Google Secret Manager (`gcloud secrets create ...`).  
   - Deploy/update manifests under `security/` and `monitoring/` as needed.  
   - Apply ESO resources: `kubectl apply -f infrastructure/kubernetes/eso/`.  
   - Map secrets with `ExternalSecret` CRDs (see [External Secrets Setup](./EXTERNAL_SECRETS_SETUP.md)).

2. **Google Identity Platform / Firebase Auth**  
   - Provision web app + service accounts as described in [Google Identity Deployment Setup](./GOOGLE_IDENTITY_DEPLOYMENT_SETUP.md).  
   - Update Helm values or Kubernetes Secrets with the client ID, issuer, and JWKS endpoints.

---

## Step 3 – Build and push container images

```bash
export IMAGE_TAG=$(git rev-parse --short HEAD)

(cd apps/backend/secret-service && \
  ./gradlew bootJar && \
  docker build -t "${REGION}-docker.pkg.dev/${PROJECT_ID}/csm/secret-service:${IMAGE_TAG}" . && \
  trivy image "${REGION}-docker.pkg.dev/${PROJECT_ID}/csm/secret-service:${IMAGE_TAG}" --exit-code 1 --severity HIGH,CRITICAL && \
  docker push "${REGION}-docker.pkg.dev/${PROJECT_ID}/csm/secret-service:${IMAGE_TAG}")

# Repeat for other services as needed
```

If CI/CD handles builds, verify the Artifact Registry tag you intend to deploy already exists and ensure the pipeline runs the same `trivy image` scan (see [Security README](../security/README.md) for install details).

---

## Step 4 – Deploy to GKE (Helm)

1. Copy the baseline values file (`helm/cloud-secrets-manager/values.yaml`) into an environment-specific overlay (e.g., `values-prod.yaml`).  
2. Fill in:
   - `image.repository` and `image.tag`
   - `env` blocks for service URLs, database connection strings, identity endpoints
   - Secrets references (ESO or native secrets)
3. Install or upgrade:

```bash
helm upgrade --install csm helm/cloud-secrets-manager \
  -n cloud-secrets-manager --create-namespace \
  -f helm/cloud-secrets-manager/values-prod.yaml
```

Need manifest-level granularity instead? Follow the [Complete Deployment Guide](./COMPLETE_DEPLOYMENT_GUIDE.md).

---

## Step 5 – Post-deployment verification

```bash
kubectl -n cloud-secrets-manager get pods
kubectl -n cloud-secrets-manager get svc
kubectl -n cloud-secrets-manager logs deploy/secret-service

# Smoke test
curl -H "Authorization: Bearer <token>" https://<ingress-host>/api/health
```

Then:
- Confirm ServiceMonitor targets are healthy (`kubectl get servicemonitors -n cloud-secrets-manager`, Prometheus UI).  
- Ensure Grafana dashboards render after the ConfigMap sync (`monitoring/` docs).  
- Run sanity checks from [Operations Guide](./OPERATIONS_GUIDE.md) (backup verification, latency/error SLO watch).  
- Trigger end-to-end workflow via UI or API to ensure secret creation, retrieval, and audit logging succeed.
- Run `trivy k8s --report summary cluster` to confirm the live cluster has no blocking vulnerabilities (details in the [Security README](../security/README.md)).

---

## Optional – Wire CI/CD

If you want automated deploys:
1. Configure GitHub secrets & Workload Identity per [CI/CD Setup Guide](./ci-cd/CI_CD_SETUP.md).  
2. Decide whether the pipeline should run Terraform, Helm, or both.  
3. Track remaining automation gaps in [CI/CD Pipeline Status](./ci-cd/CI_CD_PIPELINE_STATUS.md).

---

## Troubleshooting & escalation

- Rollbacks: `helm rollback csm <REVISION>` or redeploy the last known good tag.
- Pods failing: consult `docs/deployment/kubernetes/DEBUGGING_CRASHLOOPBACKOFF.md`.
- Authentication issues: re-check Google Identity config and JWKS endpoints.
- Secrets not syncing: review `ExternalSecret` status and ESO controller logs.
- For incidents, follow the monitoring runbooks under `docs/deployment/monitoring/`.

---

## Related reference

- [Deployment documentation hub](./README.md)
- [Complete Deployment Guide](./COMPLETE_DEPLOYMENT_GUIDE.md)
- [Operations Guide](./OPERATIONS_GUIDE.md)
- [Monitoring Setup](./monitoring/MONITORING_SETUP.md)
- [Security README](../security/README.md)

---

**Last Updated:** November 24, 2025

