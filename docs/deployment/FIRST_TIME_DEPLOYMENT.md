# First-Time Complete Deployment Guide

**Complete step-by-step guide for deploying Cloud Secrets Manager to Google Cloud Platform for the first time.**

This guide consolidates all setup steps: Infrastructure (Terraform), CI/CD (GitHub + Cloud Build), Helm, Kubernetes, Monitoring (Grafana + Prometheus), Operations (Artifact Registry), Security (Trivy), and Google SQL.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Phase 1: GCP Project Setup](#phase-1-gcp-project-setup)
3. [Phase 2: Infrastructure Provisioning (Terraform)](#phase-2-infrastructure-provisioning-terraform)
4. [Phase 3: Secrets & Identity Configuration](#phase-3-secrets--identity-configuration)
5. [Phase 4: CI/CD Pipeline Setup](#phase-4-cicd-pipeline-setup)
6. [Phase 5: Build & Push Docker Images](#phase-5-build--push-docker-images)
7. [Phase 6: Application Deployment (Helm)](#phase-6-application-deployment-helm)
8. [Phase 7: Monitoring Stack Deployment](#phase-7-monitoring-stack-deployment)
9. [Phase 8: Verification & Testing](#phase-8-verification--testing)
10. [Quick Reference](#quick-reference)

---

## Prerequisites

### Required Tools

```bash
# Verify all tools are installed
gcloud --version          # Google Cloud SDK
kubectl version --client # Kubernetes CLI
helm version             # Helm 3.x
terraform version        # Terraform >= 1.5
docker --version         # Docker
git --version            # Git
```

### GCP Account Setup

```bash
# 1. Login to GCP
gcloud auth login

# 2. Set application default credentials
gcloud auth application-default login

# 3. Set your project (replace with your project ID)
export PROJECT_ID="cloud-secrets-manager"
export REGION="europe-west10"
export CLUSTER_NAME="cloud-secrets-cluster-dev"

gcloud config set project ${PROJECT_ID}
gcloud config set compute/region ${REGION}

# 4. Verify project
gcloud config get-value project
```

### Enable Required GCP APIs

```bash
# Enable all required APIs
gcloud services enable \
  compute.googleapis.com \
  container.googleapis.com \
  artifactregistry.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  iam.googleapis.com \
  cloudbuild.googleapis.com \
  containeranalysis.googleapis.com \
  --project=${PROJECT_ID}
```

---

## Phase 1: GCP Project Setup

### Step 1.1: Create Terraform State Bucket

```bash
# Create GCS bucket for Terraform state
gsutil mb -p ${PROJECT_ID} -l ${REGION} \
  gs://${PROJECT_ID}-tfstate-dev

# Enable versioning
gsutil versioning set on gs://${PROJECT_ID}-tfstate-dev

# Set lifecycle policy (delete old versions after 30 days)
cat > /tmp/lifecycle.json <<'EOF'
{
  "lifecycle": {
    "rule": [{
      "action": {"type": "Delete"},
      "condition": {"age": 30, "isLive": false}
    }]
  }
}
EOF
gsutil lifecycle set /tmp/lifecycle.json gs://${PROJECT_ID}-tfstate-dev
```

### Step 1.2: Configure Terraform Variables

```bash
cd infrastructure/terraform/environments/dev

# Create terraform.tfvars (DO NOT COMMIT THIS FILE)
cat > terraform.tfvars <<EOF
project_id  = "${PROJECT_ID}"
region      = "${REGION}"
environment = "dev"
EOF
```

---

## Phase 2: Infrastructure Provisioning (Terraform)

### Step 2.1: Initialize Terraform

```bash
cd infrastructure/terraform/environments/dev

# Initialize Terraform backend
terraform init

# Verify backend configuration
terraform version
```

### Step 2.2: Plan Infrastructure

```bash
# Preview what will be created
terraform plan -var-file="terraform.tfvars"

# Review the plan carefully:
# - GKE Cluster
# - Cloud SQL PostgreSQL instance
# - Artifact Registry repository
# - Service Accounts with Workload Identity
# - External Secrets Operator installation
```

### Step 2.3: Apply Infrastructure

```bash
# Deploy infrastructure
terraform apply -var-file="terraform.tfvars"

# Type 'yes' when prompted
# This will take 10-15 minutes
```

**Expected Output:**
- ✅ GKE Cluster: `cloud-secrets-cluster-dev`
- ✅ Cloud SQL Instance: `secrets-manager-db-dev-*`
- ✅ Artifact Registry: `europe-west10-docker.pkg.dev/${PROJECT_ID}/docker-images`
- ✅ Service Accounts created
- ✅ External Secrets Operator installed

### Step 2.4: Configure kubectl

```bash
# Get cluster credentials
gcloud container clusters get-credentials ${CLUSTER_NAME} \
  --region ${REGION} \
  --project ${PROJECT_ID}

# Verify cluster access
kubectl cluster-info
kubectl get nodes
```

### Step 2.5: Configure Docker for Artifact Registry

```bash
# Authenticate Docker with Artifact Registry
gcloud auth configure-docker ${REGION}-docker.pkg.dev

# Verify
docker pull hello-world
```

---

## Phase 3: Secrets & Identity Configuration

### Step 3.1: Create Secrets in Google Secret Manager

```bash
# Database credentials
echo -n "secret_user" | gcloud secrets create secrets-db-user \
  --data-file=- --project=${PROJECT_ID}
echo -n "secret_pw" | gcloud secrets create secrets-db-password \
  --data-file=- --project=${PROJECT_ID}
echo -n "audit_user" | gcloud secrets create audit-db-user \
  --data-file=- --project=${PROJECT_ID}
echo -n "audit_pw" | gcloud secrets create audit-db-password \
  --data-file=- --project=${PROJECT_ID}

# Application configuration
echo -n "$(openssl rand -base64 32)" | gcloud secrets create jwt-secret \
  --data-file=- --project=${PROJECT_ID}
echo -n "$(openssl rand -base64 32 | head -c 32)" | gcloud secrets create aes-key \
  --data-file=- --project=${PROJECT_ID}
echo -n "${PROJECT_ID}" | gcloud secrets create google-project-id \
  --data-file=- --project=${PROJECT_ID}

# Service Account JSON (if you have one)
# gcloud secrets create google-service-account-json \
#   --data-file=path/to/service-account.json --project=${PROJECT_ID}
```

### Step 3.2: Configure External Secrets Operator

```bash
# Verify ESO is installed (should be done by Terraform)
kubectl get pods -n external-secrets-system

# Apply ExternalSecret manifests
kubectl apply -f infrastructure/kubernetes/k8s/external-secrets.yaml

# Wait for secrets to sync
kubectl wait --for=condition=ready externalsecret/csm-db-secrets \
  -n cloud-secrets-manager --timeout=60s || true

# Verify secrets are created
kubectl get secrets -n cloud-secrets-manager
kubectl get externalsecrets -n cloud-secrets-manager
```

**Expected Secrets:**
- `csm-db-secrets`
- `csm-app-config`
- `csm-google-service-account` (if configured)

### Step 3.3: Configure Google Identity Platform (Optional)

If using Firebase/Google Identity Platform:

```bash
# Create namespace
kubectl create namespace cloud-secrets-manager || true

# Create service account secret (if you have the JSON file)
kubectl create secret generic csm-google-service-account \
  --from-file=service-account.json=path/to/service-account.json \
  --namespace=cloud-secrets-manager || echo "Skip if not using Google Identity"
```

---

## Phase 4: CI/CD Pipeline Setup

### Step 4.1: Create GitHub Actions Service Account

```bash
# Create service account for GitHub Actions
gcloud iam service-accounts create github-actions-ci \
  --display-name="GitHub Actions CI/CD" \
  --project=${PROJECT_ID}

# Grant required roles
GITHUB_SA="github-actions-ci@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${GITHUB_SA}" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${GITHUB_SA}" \
  --role="roles/container.developer"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${GITHUB_SA}" \
  --role="roles/iam.serviceAccountUser"

# Create and download key
gcloud iam service-accounts keys create github-actions-key.json \
  --iam-account=${GITHUB_SA}

# Add to GitHub Secrets:
# 1. Go to GitHub repo → Settings → Secrets → Actions
# 2. Create secret: GCP_SA_KEY
# 3. Paste entire contents of github-actions-key.json
# 4. Delete local file: rm github-actions-key.json
```

### Step 4.2: Configure Cloud Build (Alternative/Additional)

```bash
# Grant Cloud Build service account permissions
CLOUD_BUILD_SA="cloud-build@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/container.developer"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/secretmanager.secretAccessor"
```

### Step 4.3: Set Up GitHub Environments (Optional)

1. Go to GitHub repo → Settings → Environments
2. Create environments:
   - **dev**: No protection (auto-deploy)
   - **staging**: 1 reviewer required
   - **production**: 2 reviewers required, 10min wait timer

---

## Phase 5: Build & Push Docker Images

### Step 5.1: Build Secret Service Image

```bash
cd apps/backend/secret-service

# Build image (IMPORTANT: Use linux/amd64 platform)
docker build --platform linux/amd64 \
  -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/docker-images/secret-service:latest \
  -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/docker-images/secret-service:$(git rev-parse --short HEAD) \
  .

# Scan image with Trivy (security check)
trivy image ${REGION}-docker.pkg.dev/${PROJECT_ID}/docker-images/secret-service:latest \
  --exit-code 1 --severity HIGH,CRITICAL || echo "Fix vulnerabilities before proceeding"

# Push to Artifact Registry
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/docker-images/secret-service:latest
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/docker-images/secret-service:$(git rev-parse --short HEAD)
```

### Step 5.2: Build Audit Service Image

```bash
cd ../audit-service

# Build image
docker build --platform linux/amd64 \
  -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/docker-images/audit-service:latest \
  -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/docker-images/audit-service:$(git rev-parse --short HEAD) \
  .

# Scan image
trivy image ${REGION}-docker.pkg.dev/${PROJECT_ID}/docker-images/audit-service:latest \
  --exit-code 1 --severity HIGH,CRITICAL || echo "Fix vulnerabilities before proceeding"

# Push to Artifact Registry
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/docker-images/audit-service:latest
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/docker-images/audit-service:$(git rev-parse --short HEAD)
```

### Step 5.3: Verify Images

```bash
# List images in Artifact Registry
gcloud artifacts docker images list \
  ${REGION}-docker.pkg.dev/${PROJECT_ID}/docker-images \
  --include-tags
```

---

## Phase 6: Application Deployment (Helm)

### Step 6.1: Update Helm Values

```bash
cd infrastructure/helm/cloud-secrets-manager

# Review and update values.yaml if needed
# Key values to check:
# - image.repository and image.tag
# - database connection strings
# - service account annotations
# - resource limits
```

### Step 6.2: Deploy with Helm

```bash
# Create namespace (if not exists)
kubectl create namespace cloud-secrets-manager || true

# Deploy application
helm upgrade --install cloud-secrets-manager \
  ./infrastructure/helm/cloud-secrets-manager \
  --namespace=cloud-secrets-manager \
  --create-namespace \
  --wait \
  --timeout=10m

# Verify Helm release
helm status cloud-secrets-manager -n cloud-secrets-manager
helm list -n cloud-secrets-manager
```

### Step 6.3: Verify Deployment

```bash
# Check pod status (wait for Running and 2/2 Ready)
kubectl get pods -n cloud-secrets-manager -w

# Check deployments
kubectl get deployments -n cloud-secrets-manager

# Check services
kubectl get svc -n cloud-secrets-manager

# Check logs
kubectl logs -n cloud-secrets-manager -l app=secret-service -c secret-service --tail=50
kubectl logs -n cloud-secrets-manager -l app=audit-service -c audit-service --tail=50
```

---

## Phase 7: Monitoring Stack Deployment

### Step 7.1: Install Prometheus Operator

```bash
# Add Prometheus Helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Create monitoring namespace
kubectl create namespace monitoring || true

# Install kube-prometheus-stack
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
  --set prometheus.prometheusSpec.podMonitorSelectorNilUsesHelmValues=false \
  --set prometheus.prometheusSpec.ruleSelectorNilUsesHelmValues=false \
  --set prometheus.prometheusSpec.retention=30d \
  --set grafana.enabled=true \
  --set grafana.adminPassword=admin \
  --wait

# Verify installation
kubectl get pods -n monitoring
```

### Step 7.2: Deploy Service Monitors

```bash
# Deploy ServiceMonitors for application metrics
kubectl apply -f monitoring/servicemonitors/secret-service-monitor.yaml
kubectl apply -f monitoring/servicemonitors/audit-service-monitor.yaml

# Verify
kubectl get servicemonitors -n cloud-secrets-manager
```

### Step 7.3: Deploy Alert Rules

```bash
# Deploy Prometheus alert rules
kubectl apply -f monitoring/alerts/prometheus-rules.yaml

# Verify
kubectl get prometheusrules -n monitoring
```

### Step 7.4: Configure Grafana Dashboards

```bash
# Deploy dashboard ConfigMaps
kubectl create configmap csm-overview-dashboard \
  --from-file=monitoring/grafana/dashboards/overview-dashboard.json \
  -n monitoring \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl label configmap csm-overview-dashboard \
  grafana_dashboard=1 -n monitoring

# Access Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
# Open: http://localhost:3000
# Username: admin
# Password: admin
```

---

## Phase 8: Verification & Testing

### Step 8.1: Health Checks

```bash
# Port-forward to secret-service
kubectl port-forward -n cloud-secrets-manager \
  svc/secret-service 8080:8080

# In another terminal, test health endpoint
curl http://localhost:8080/actuator/health
curl http://localhost:8080/actuator/prometheus
```

### Step 8.2: Verify Monitoring

```bash
# Port-forward to Prometheus
kubectl port-forward -n monitoring svc/prometheus-operated 9090:9090

# Open: http://localhost:9090/targets
# Verify secret-service and audit-service are UP

# Test Prometheus queries
# Query: up{job=~"secret-service|audit-service"}
# Should return: 1 (UP)
```

### Step 8.3: Database Connectivity

```bash
# Check Cloud SQL Proxy logs
kubectl logs -n cloud-secrets-manager \
  -l app=secret-service -c cloud-sql-proxy --tail=20

# Should see: "Ready for new connections"
```

### Step 8.4: End-to-End Test

```bash
# Test API endpoints (requires authentication token)
# 1. Get authentication token (if Google Identity configured)
# 2. Create a secret
curl -X POST http://localhost:8080/api/secrets \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"key":"test-key","value":"test-value"}'

# 3. Verify audit log was created
kubectl logs -n cloud-secrets-manager -l app=audit-service --tail=20
```

---

## Quick Reference

### Essential Commands

```bash
# Cluster connection
gcloud container clusters get-credentials ${CLUSTER_NAME} \
  --region ${REGION} --project ${PROJECT_ID}

# Pod status
kubectl get pods -n cloud-secrets-manager

# View logs
kubectl logs -n cloud-secrets-manager -l app=secret-service -c secret-service -f

# Restart deployment
kubectl rollout restart deployment/secret-service -n cloud-secrets-manager

# Helm upgrade
helm upgrade cloud-secrets-manager \
  ./infrastructure/helm/cloud-secrets-manager \
  --namespace=cloud-secrets-manager

# Scale deployment
kubectl scale deployment/secret-service --replicas=3 -n cloud-secrets-manager
```

### Key Resources

| Resource | Name/Path |
|----------|-----------|
| **GKE Cluster** | `cloud-secrets-cluster-dev` |
| **Namespace** | `cloud-secrets-manager` |
| **Helm Release** | `cloud-secrets-manager` |
| **Artifact Registry** | `${REGION}-docker.pkg.dev/${PROJECT_ID}/docker-images` |
| **Cloud SQL Instance** | `secrets-manager-db-dev-*` |
| **Monitoring Namespace** | `monitoring` |

### Troubleshooting

```bash
# Pods not starting
kubectl describe pod <pod-name> -n cloud-secrets-manager
kubectl get events -n cloud-secrets-manager --sort-by='.lastTimestamp'

# Database connection issues
kubectl logs -n cloud-secrets-manager -l app=secret-service -c cloud-sql-proxy

# Image pull errors
gcloud artifacts docker images list \
  ${REGION}-docker.pkg.dev/${PROJECT_ID}/docker-images

# Secrets not syncing
kubectl get externalsecrets -n cloud-secrets-manager
kubectl describe externalsecret <name> -n cloud-secrets-manager
```

---

## Next Steps

After successful first-time deployment:

1. ✅ **Configure CI/CD**: Set up GitHub Actions workflows for automated deployments
2. ✅ **Set up Alerts**: Configure AlertManager notifications (Slack, Email, etc.)
3. ✅ **Enable Ingress**: Configure external access with TLS
4. ✅ **Backup Strategy**: Set up automated Cloud SQL backups
5. ✅ **Security Hardening**: Apply network policies and pod security standards
6. ✅ **Cost Monitoring**: Set up billing alerts and budgets

---

**Related Documentation:**
- [Daily Development Workflow](./DAILY_DEVELOPMENT_WORKFLOW.md)
- [Operations Guide](./operations/OPERATIONS_GUIDE.md)
- [Monitoring Setup](./monitoring/MONITORING_SETUP.md)
- [CI/CD Setup](./ci-cd/CI_CD_SETUP.md)

---

**Last Updated:** December 2024

