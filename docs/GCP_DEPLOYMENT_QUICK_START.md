# Cloud Secrets Manager - GCP Deployment Quick Start

**Date:** December 5, 2025  
**For:** DevOps Engineers & System Administrators  
**Time to Deploy:** 4-6 hours (development environment)

> **How this fits the current project:**  
> - This guide walks you through bringing up a **GCP `dev` environment on GKE** using Terraform + Helm.  
> - The repo now also has a fully documented **local Docker + local Kubernetes workflow** (see `docs/DEVELOPER_GUIDE.md`) and detailed infrastructure docs under `docs/infrastructure/`.  
> - Terraform environments for **`dev` and `staging`** are implemented in `infrastructure/terraform/environments/`; the steps below focus on `dev`, but `staging` follows the same pattern with its own variables and `values-staging.yaml`.

---

## Prerequisites

- GCP account with billing enabled
- `gcloud` CLI installed and configured
- `kubectl` installed
- `helm` installed
- `terraform` installed (v1.5+)
- Docker installed (for building images)

---

## Quick Start (Development Environment)

### Step 1: Set Up GCP Project (15 minutes)

```bash
# Set variables
export PROJECT_ID="cloud-secrets-manager-dev"
export REGION="europe-west10"
export CLUSTER_NAME="cloud-secrets-cluster-dev"

# Create project
gcloud projects create $PROJECT_ID
gcloud config set project $PROJECT_ID

# Link billing account
gcloud billing accounts list
gcloud billing projects link $PROJECT_ID --billing-account=BILLING_ACCOUNT_ID

# Enable APIs
gcloud services enable \
  compute.googleapis.com \
  container.googleapis.com \
  artifactregistry.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  iam.googleapis.com \
  pubsub.googleapis.com
```

### Step 2: Deploy Infrastructure with Terraform (30 minutes)

```bash
# Navigate to dev environment
cd infrastructure/terraform/environments/dev

# Create terraform.tfvars
cat > terraform.tfvars <<EOF
project_id = "$PROJECT_ID"
region = "$REGION"
billing_account_id = "YOUR_BILLING_ACCOUNT_ID"
budget_amount = 100
EOF

# Initialize and apply
terraform init
terraform plan -out=tfplan
terraform apply tfplan

# Save outputs
terraform output > outputs.txt
```

### Step 3: Build and Push Images (45 minutes)

```bash
# Authenticate Docker
gcloud auth configure-docker ${REGION}-docker.pkg.dev

# Set registry
export REGISTRY="${REGION}-docker.pkg.dev/${PROJECT_ID}/docker-images"

# Build secret-service
cd apps/backend/secret-service
docker build -t ${REGISTRY}/secret-service:dev-latest .
docker push ${REGISTRY}/secret-service:dev-latest

# Build audit-service
cd ../audit-service
docker build -t ${REGISTRY}/audit-service:dev-latest .
docker push ${REGISTRY}/audit-service:dev-latest

# Build notification-service
cd ../notification-service
docker build -t ${REGISTRY}/notification-service:dev-latest .
docker push ${REGISTRY}/notification-service:dev-latest
```

### Step 4: Configure Secrets (15 minutes)

```bash
# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32)
echo -n "$JWT_SECRET" | gcloud secrets create jwt-secret --data-file=-

# Generate encryption key
ENCRYPTION_KEY=$(openssl rand -base64 32)
echo -n "$ENCRYPTION_KEY" | gcloud secrets create encryption-key --data-file=-

# Add SendGrid API key (if you have one)
echo -n "YOUR_SENDGRID_API_KEY" | gcloud secrets create sendgrid-api-key --data-file=-
```

### Step 5: Get GKE Credentials (5 minutes)

```bash
# Get cluster credentials
gcloud container clusters get-credentials $CLUSTER_NAME --region=$REGION

# Verify connection
kubectl get nodes
kubectl get namespaces
```

### Step 6: Deploy Application with Helm (30 minutes)

```bash
# Get Cloud SQL connection name
export CONNECTION_NAME=$(gcloud sql instances describe secrets-manager-db-dev --format="value(connectionName)")

# Deploy
cd infrastructure/helm/cloud-secrets-manager
helm upgrade --install cloud-secrets-manager . \
  -f values.yaml \
  --namespace cloud-secrets-manager \
  --create-namespace \
  --set image.tag=dev-latest \
  --set image.repositorySecretService=${REGISTRY}/secret-service \
  --set image.repositoryAuditService=${REGISTRY}/audit-service \
  --set image.repositoryNotificationService=${REGISTRY}/notification-service \
  --set cloudSql.connectionName=${CONNECTION_NAME} \
  --wait \
  --timeout 10m
```

### Step 7: Verify Deployment (10 minutes)

```bash
# Check pods
kubectl get pods -n cloud-secrets-manager

# Check services
kubectl get svc -n cloud-secrets-manager

# Port forward to test
kubectl port-forward svc/secret-service 8080:8080 -n cloud-secrets-manager &

# Test health endpoint
curl http://localhost:8080/actuator/health

# Test API
curl http://localhost:8080/api/health
```

---

## Next Steps: Staging & Production

Once `dev` is healthy, you can repeat the same pattern for **staging** and later **production** using the existing Terraform and Helm configuration.

### Staging environment

- **Terraform config:**  
  - `infrastructure/terraform/environments/staging/`  
  - Same modules as `dev`, but with:
    - Larger GKE node sizes and replica counts
    - Stronger database settings (PITR, deletion protection, etc.)

- **Helm values:**  
  - `infrastructure/helm/cloud-secrets-manager/values-staging.yaml`

- **High-level flow:**
  1. Create `terraform.tfvars` in `environments/staging` (similar to dev, but with staging project/budget).
  2. `terraform init && terraform apply` for staging.
  3. Build images tagged for staging (or reuse dev images by SHA).
  4. Deploy with Helm using `values-staging.yaml` and the staging connection name.

### Production environment (planning)

- **Pattern:** Same as staging, but with:
  - HA Cloud SQL
  - Increased node pool capacity
  - Stricter network/security policies
  - Full monitoring + alerting enabled

- **Files to adjust when you introduce production:**
  - `infrastructure/terraform/environments/production/` (once created)
  - `infrastructure/helm/cloud-secrets-manager/values-production.yaml`

> **Recommendation:** Treat this guide as the **dev bootstrap**. For staging and production, follow the same steps but always:
> - Use separate GCP projects and Terraform backends per environment.
> - Keep all changes in Git (Terraform + Helm values).
> - Wire deployments into Cloud Build triggers instead of running Helm manually from your laptop.


### Step 8: Deploy Monitoring (Optional, 30 minutes)

```bash
# Install Prometheus stack
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false

# Install Loki
helm repo add grafana https://grafana.github.io/helm-charts
helm install loki grafana/loki-stack \
  --namespace logging \
  --create-namespace \
  -f infrastructure/helm/loki-stack-values.yaml

# Apply ServiceMonitors
kubectl apply -f infrastructure/kubernetes/monitoring/
```

---

## Common Issues & Solutions

### Issue: Terraform fails with "API not enabled"
**Solution:** Wait 2-3 minutes after enabling APIs, then retry

### Issue: Docker push fails with authentication error
**Solution:** Run `gcloud auth configure-docker ${REGION}-docker.pkg.dev` again

### Issue: Pods stuck in "Pending" state
**Solution:** Check node resources with `kubectl describe nodes`

### Issue: Cloud SQL connection fails
**Solution:** Verify Cloud SQL Proxy sidecar is running in pods

### Issue: External Secrets not syncing
**Solution:** Check service account permissions for Secret Manager

---

## Next Steps

1. **Configure DNS:** Point your domain to the Load Balancer IP
2. **Enable HTTPS:** Configure SSL/TLS certificates
3. **Set Up Monitoring:** Import Grafana dashboards
4. **Configure Alerts:** Set up Slack/Email notifications
5. **Run Tests:** Execute smoke tests and load tests

---

## Useful Commands

```bash
# View logs
kubectl logs -f deployment/secret-service -n cloud-secrets-manager

# Restart deployment
kubectl rollout restart deployment/secret-service -n cloud-secrets-manager

# Scale deployment
kubectl scale deployment/secret-service --replicas=3 -n cloud-secrets-manager

# Delete everything
helm uninstall cloud-secrets-manager -n cloud-secrets-manager
terraform destroy -auto-approve
```

---

## Cost Estimate

**Development Environment:** ~$76/month
- GKE: $24/month
- Cloud SQL: $26/month
- Other services: $26/month

**Tip:** Shut down dev environment when not in use to save costs!

---

## Support

- **Documentation:** `docs/GCP_DEPLOYMENT_ASSESSMENT.md`
- **Runbooks:** `docs/05_OPERATIONS_AND_RUNBOOK.md`
- **Issues:** Create GitHub issue

---

**Happy Deploying! 🚀**

