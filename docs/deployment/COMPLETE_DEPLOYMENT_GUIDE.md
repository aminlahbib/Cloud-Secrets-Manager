# Complete Deployment Guide - Cloud Secrets Manager

This guide provides a step-by-step process to deploy the Cloud Secrets Manager application to Google Kubernetes Engine (GKE) after infrastructure has been provisioned with Terraform.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Infrastructure Overview](#infrastructure-overview)
3. [Step-by-Step Deployment](#step-by-step-deployment)
4. [Verification](#verification)
5. [Troubleshooting](#troubleshooting)
6. [Quick Reference](#quick-reference)

---

## Prerequisites

### Required Tools

```bash
# Google Cloud SDK
gcloud --version

# Kubernetes CLI
kubectl version --client

# Docker
docker --version

# Terraform (for infrastructure)
terraform version
```

### GCP Authentication

```bash
# Login to GCP
gcloud auth login

# Set application default credentials
gcloud auth application-default login

# Set your project
gcloud config set project cloud-secrets-manager

# Verify
gcloud config get-value project
```

**Purpose:** Authenticates your local machine with Google Cloud Platform to allow CLI operations and Docker image pushes.

---

## Infrastructure Overview

After Terraform deployment, the following resources are available:

- **GKE Cluster**: `cloud-secrets-cluster-dev` (region: `europe-west10`)
- **PostgreSQL Database**: `secrets-manager-db-dev-3631da18`
- **Artifact Registry**: `docker-images` repository in `europe-west10`
- **Service Accounts**: 
  - `secret-service-dev@cloud-secrets-manager.iam.gserviceaccount.com`
  - `audit-service-dev@cloud-secrets-manager.iam.gserviceaccount.com`
- **Workload Identity**: Configured for both service accounts

---

## Step-by-Step Deployment

### Step 1: Configure kubectl to Connect to GKE Cluster

**Purpose:** Establishes connection between your local `kubectl` and the GKE cluster.

```bash
gcloud container clusters get-credentials cloud-secrets-cluster-dev \
  --region europe-west10 \
  --project cloud-secrets-manager
```

**Verify connection:**
```bash
kubectl cluster-info
kubectl get nodes
```

**Expected output:** You should see cluster information and a list of GKE nodes.

---

### Step 2: Configure Docker Authentication for Artifact Registry

**Purpose:** Allows Docker to push/pull images from Google Artifact Registry.

```bash
gcloud auth configure-docker europe-west10-docker.pkg.dev
```

**What this does:** Configures Docker credential helper to authenticate with Artifact Registry using your GCP credentials.

---

### Step 3: Create Kubernetes Namespace and Service Accounts

**Purpose:** Creates the namespace for your application and Kubernetes service accounts that will use Workload Identity to authenticate with GCP services.

```bash
# Create namespace
kubectl create namespace cloud-secrets-manager

# Create Kubernetes service accounts
kubectl create serviceaccount secret-service -n cloud-secrets-manager
kubectl create serviceaccount audit-service -n cloud-secrets-manager

# Annotate service accounts for Workload Identity
# This links Kubernetes service accounts to GCP service accounts
kubectl annotate serviceaccount secret-service \
  -n cloud-secrets-manager \
  iam.gke.io/gcp-service-account=secret-service-dev@cloud-secrets-manager.iam.gserviceaccount.com

kubectl annotate serviceaccount audit-service \
  -n cloud-secrets-manager \
  iam.gke.io/gcp-service-account=audit-service-dev@cloud-secrets-manager.iam.gserviceaccount.com
```

**What this does:**
- Creates a dedicated namespace for the application
- Creates Kubernetes service accounts that will be used by pods
- Links Kubernetes service accounts to GCP service accounts via Workload Identity annotations

**Verify:**
```bash
kubectl get serviceaccounts -n cloud-secrets-manager
kubectl describe serviceaccount secret-service -n cloud-secrets-manager
```

---

### Step 4: Build and Push Docker Images

**Purpose:** Builds application Docker images for the correct architecture (linux/amd64 for GKE) and pushes them to Artifact Registry.

**Important:** Always build for `linux/amd64` platform since GKE nodes run on x86_64 architecture, even if you're developing on Apple Silicon (ARM64).

```bash
# Build and push secret-service
cd apps/backend/secret-service
docker build --platform linux/amd64 \
  -t europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images/secret-service:latest .
docker push europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images/secret-service:latest

# Build and push audit-service
cd ../audit-service
docker build --platform linux/amd64 \
  -t europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images/audit-service:latest .
docker push europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images/audit-service:latest
```

**What this does:**
- Builds multi-stage Docker images optimized for production
- Tags images with the Artifact Registry path
- Pushes images to Artifact Registry where GKE can pull them

**Verify:**
```bash
gcloud artifacts docker images list \
  europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images \
  --include-tags
```

---

### Step 5: Retrieve Database Credentials

**Purpose:** Gets database passwords from Google Secret Manager to create Kubernetes secrets.

```bash
# Get secrets_db password
SECRETS_DB_PASSWORD=$(gcloud secrets versions access latest \
  --secret="secrets-manager-db-dev-secrets_db-password")

# Get audit_db password
AUDIT_DB_PASSWORD=$(gcloud secrets versions access latest \
  --secret="secrets-manager-db-dev-audit_db-password")

# Verify passwords were retrieved
echo "Secrets DB password length: ${#SECRETS_DB_PASSWORD}"
echo "Audit DB password length: ${#AUDIT_DB_PASSWORD}"
```

**What this does:** Retrieves securely stored database passwords from Secret Manager and stores them in environment variables for use in the next step.

---

### Step 6: Create Kubernetes Secrets

**Purpose:** Stores sensitive configuration (database credentials, encryption keys) as Kubernetes secrets that pods can access.

```bash
# Database connection details
DB_CONNECTION="cloud-secrets-manager:europe-west10:secrets-manager-db-dev-3631da18"

# Create database credentials secret
kubectl create secret generic db-credentials \
  -n cloud-secrets-manager \
  --from-literal=connection-name="$DB_CONNECTION" \
  --from-literal=secrets-db-password="$SECRETS_DB_PASSWORD" \
  --from-literal=audit-db-password="$AUDIT_DB_PASSWORD"

# Generate secure application keys
JWT_SECRET=$(openssl rand -hex 32)
# AES key must be exactly 32 bytes (plain string, not base64/hex encoded)
AES_KEY=$(openssl rand -base64 24 | tr -d '\n' | head -c 32)

# Create application configuration secret
kubectl create secret generic csm-app-config \
  -n cloud-secrets-manager \
  --from-literal=JWT_SECRET="$JWT_SECRET" \
  --from-literal=AES_KEY="$AES_KEY" \
  --from-literal=GOOGLE_PROJECT_ID="cloud-secrets-manager"
```

**What this does:**
- Creates `db-credentials` secret with database connection information
- Creates `csm-app-config` secret with application encryption keys
- Generates cryptographically secure random keys for JWT and AES encryption

**Important:** The AES key must be exactly 32 bytes (256 bits) as a plain string. The application reads it directly from the environment variable and expects 32 characters. Do not use base64 or hex encoding.

**Verify:**
```bash
kubectl get secrets -n cloud-secrets-manager
kubectl describe secret db-credentials -n cloud-secrets-manager
```

---

### Step 7: Deploy Applications to Kubernetes

**Purpose:** Deploys the application containers to the GKE cluster using Kubernetes deployment manifests.

```bash
# Deploy both services
kubectl apply -f infrastructure/kubernetes/k8s/secret-service-deployment.yaml
kubectl apply -f infrastructure/kubernetes/k8s/audit-service-deployment.yaml
```

**What this does:**
- Creates Kubernetes Deployments that manage pod replicas
- Creates Kubernetes Services for internal service discovery
- Configures:
  - Cloud SQL Proxy sidecar for database connectivity
  - Resource requests and limits
  - Health checks (liveness and readiness probes)
  - Environment variables from secrets
  - Workload Identity via service account

**Deployment Configuration:**
- **Replicas**: 1 per service (can be scaled)
- **Cloud SQL Proxy**: Sidecar container connecting to Cloud SQL via public IP
- **Database Connection**: Applications connect to `localhost:5432` (proxied by Cloud SQL Proxy)
- **Resource Requests**: 
  - Secret Service: 300m CPU, 512Mi memory
  - Audit Service: 200m CPU, 256Mi memory
  - Cloud SQL Proxy: 30m CPU, 64Mi memory

---

### Step 8: Monitor Deployment Status

**Purpose:** Verifies that pods are starting correctly and identifies any issues.

```bash
# Watch pod status
kubectl get pods -n cloud-secrets-manager -w

# Check pod status (after waiting 1-2 minutes)
kubectl get pods -n cloud-secrets-manager

# Check services
kubectl get svc -n cloud-secrets-manager

# Check deployments
kubectl get deployments -n cloud-secrets-manager
```

**Expected output:** After 1-2 minutes, pods should show `2/2 Ready` status (application container + Cloud SQL Proxy sidecar).

---

### Step 9: Verify Application Logs

**Purpose:** Confirms applications are starting correctly and connecting to the database.

```bash
# Check secret-service logs
kubectl logs -n cloud-secrets-manager \
  -l app.kubernetes.io/name=secret-service \
  -c secret-service \
  --tail=50

# Check audit-service logs
kubectl logs -n cloud-secrets-manager \
  -l app.kubernetes.io/name=audit-service \
  -c audit-service \
  --tail=50

# Check Cloud SQL Proxy logs
kubectl logs -n cloud-secrets-manager \
  -l app.kubernetes.io/name=secret-service \
  -c cloud-sql-proxy \
  --tail=20
```

**Expected logs:**
- **Application**: Spring Boot startup messages, "Started ...Application in X seconds"
- **Cloud SQL Proxy**: "The proxy has started successfully and is ready for new connections!"

---

## Verification

### Health Check

```bash
# Port-forward to test services locally
kubectl port-forward -n cloud-secrets-manager \
  svc/csm-secret-service 8080:8080

# In another terminal, test health endpoint
curl http://localhost:8080/actuator/health
```

### Verify All Components

```bash
# Check all pods are running
kubectl get pods -n cloud-secrets-manager

# Check services are created
kubectl get svc -n cloud-secrets-manager

# Check deployments
kubectl get deployments -n cloud-secrets-manager

# Check service accounts
kubectl get serviceaccounts -n cloud-secrets-manager
```

**Success criteria:**
- All pods show `2/2 Ready` status
- No pods in `CrashLoopBackOff` or `Error` state
- Services have ClusterIP assigned
- Application logs show successful startup

---

## Troubleshooting

### Pods Stuck in Pending

**Symptom:** Pods show `Pending` status for extended time.

**Cause:** Insufficient cluster resources (CPU/memory).

**Solution:**
```bash
# Check node resources
kubectl top nodes

# Check pod resource requests
kubectl describe pod <pod-name> -n cloud-secrets-manager

# Scale cluster (if autoscaling enabled, it should happen automatically)
# Or reduce resource requests in deployment manifests
```

### Pods in CrashLoopBackOff

**Symptom:** Pods restart repeatedly.

**Solution:**
```bash
# Check pod events
kubectl describe pod <pod-name> -n cloud-secrets-manager

# Check application logs
kubectl logs <pod-name> -n cloud-secrets-manager -c secret-service

# Check Cloud SQL Proxy logs
kubectl logs <pod-name> -n cloud-secrets-manager -c cloud-sql-proxy
```

**Common issues:**
- **Architecture mismatch**: Rebuild images with `--platform linux/amd64`
- **Database connection**: Verify Cloud SQL Proxy is running and connection name is correct
- **Missing secrets**: Verify all required secrets exist
- **Encryption key format**: Ensure AES key is exactly 32 bytes (base64 encoded)

### Database Connection Errors

**Symptom:** Applications can't connect to database.

**Solution:**
```bash
# Verify Cloud SQL Proxy is running
kubectl logs <pod-name> -n cloud-secrets-manager -c cloud-sql-proxy

# Verify connection name is correct
kubectl get secret db-credentials -n cloud-secrets-manager -o jsonpath='{.data.connection-name}' | base64 -d

# Verify service account has Cloud SQL Client role
gcloud projects get-iam-policy cloud-secrets-manager \
  --flatten="bindings[].members" \
  --filter="bindings.members:secret-service-dev@cloud-secrets-manager.iam.gserviceaccount.com"
```

### Image Pull Errors

**Symptom:** Pods can't pull Docker images.

**Solution:**
```bash
# Verify Docker authentication
gcloud auth configure-docker europe-west10-docker.pkg.dev

# Verify images exist in Artifact Registry
gcloud artifacts docker images list \
  europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images

# Verify service account has Artifact Registry Reader role
gcloud projects get-iam-policy cloud-secrets-manager \
  --flatten="bindings[].members" \
  --filter="bindings.members:secret-service-dev@cloud-secrets-manager.iam.gserviceaccount.com"
```

### Workload Identity Issues

**Symptom:** Pods can't authenticate to GCP services.

**Solution:**
```bash
# Verify service account annotations
kubectl describe serviceaccount secret-service -n cloud-secrets-manager

# Verify Workload Identity binding exists
gcloud iam service-accounts get-iam-policy \
  secret-service-dev@cloud-secrets-manager.iam.gserviceaccount.com
```

---

## Quick Reference

### Cluster Information

- **Cluster Name**: `cloud-secrets-cluster-dev`
- **Region**: `europe-west10`
- **Project**: `cloud-secrets-manager`
- **Namespace**: `cloud-secrets-manager`

### Database Information

- **Instance**: `secrets-manager-db-dev-3631da18`
- **Connection String**: `cloud-secrets-manager:europe-west10:secrets-manager-db-dev-3631da18`
- **Databases**: `secrets_db`, `audit_db`

### Artifact Registry

- **Repository**: `europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images`
- **Images**: 
  - `secret-service:latest`
  - `audit-service:latest`

### Service Accounts

- **Secret Service**: `secret-service-dev@cloud-secrets-manager.iam.gserviceaccount.com`
- **Audit Service**: `audit-service-dev@cloud-secrets-manager.iam.gserviceaccount.com`

### Kubernetes Resources

- **Deployments**: `csm-secret-service`, `csm-audit-service`
- **Services**: `csm-secret-service` (port 8080), `csm-audit-service` (port 8081)
- **Secrets**: `db-credentials`, `csm-app-config`

### Useful Commands

```bash
# Get pod status
kubectl get pods -n cloud-secrets-manager

# View logs
kubectl logs -n cloud-secrets-manager -l app.kubernetes.io/name=secret-service -c secret-service

# Describe pod
kubectl describe pod <pod-name> -n cloud-secrets-manager

# Port forward for testing
kubectl port-forward -n cloud-secrets-manager svc/csm-secret-service 8080:8080

# Restart deployment
kubectl rollout restart deployment/csm-secret-service -n cloud-secrets-manager

# Scale deployment
kubectl scale deployment/csm-secret-service --replicas=2 -n cloud-secrets-manager

# Delete and recreate pods
kubectl delete pods -n cloud-secrets-manager -l app.kubernetes.io/name=secret-service
```

---

## Startup Procedures

### Starting a Fresh Deployment

If you need to start the deployment from scratch:

```bash
# 1. Connect to cluster
gcloud container clusters get-credentials cloud-secrets-cluster-dev \
  --region europe-west10 \
  --project cloud-secrets-manager

# 2. Verify namespace exists
kubectl get namespace cloud-secrets-manager || \
  kubectl create namespace cloud-secrets-manager

# 3. Verify secrets exist
kubectl get secrets -n cloud-secrets-manager

# 4. Deploy applications
kubectl apply -f infrastructure/kubernetes/k8s/secret-service-deployment.yaml
kubectl apply -f infrastructure/kubernetes/k8s/audit-service-deployment.yaml

# 5. Wait for pods to be ready
kubectl wait --for=condition=ready pod \
  -l app.kubernetes.io/name=secret-service \
  -n cloud-secrets-manager \
  --timeout=300s

kubectl wait --for=condition=ready pod \
  -l app.kubernetes.io/name=audit-service \
  -n cloud-secrets-manager \
  --timeout=300s
```

### Starting After Shutdown

If services were stopped and need to be restarted:

```bash
# 1. Scale deployments back up
kubectl scale deployment csm-secret-service --replicas=1 -n cloud-secrets-manager
kubectl scale deployment csm-audit-service --replicas=1 -n cloud-secrets-manager

# 2. Monitor startup
kubectl get pods -n cloud-secrets-manager -w

# 3. Verify health
kubectl get pods -n cloud-secrets-manager
```

---

## Shutdown Procedures

### Graceful Shutdown

To safely stop the application services:

```bash
# 1. Scale down deployments (graceful shutdown)
kubectl scale deployment csm-secret-service --replicas=0 -n cloud-secrets-manager
kubectl scale deployment csm-audit-service --replicas=0 -n cloud-secrets-manager

# 2. Wait for pods to terminate
kubectl wait --for=delete pod \
  -l app.kubernetes.io/name=secret-service \
  -n cloud-secrets-manager \
  --timeout=60s || true

kubectl wait --for=delete pod \
  -l app.kubernetes.io/name=audit-service \
  -n cloud-secrets-manager \
  --timeout=60s || true

# 3. Verify all pods are stopped
kubectl get pods -n cloud-secrets-manager
```

**Note:** This stops the application pods but keeps:
- Kubernetes Services (for quick restart)
- Secrets and ConfigMaps
- Service Accounts
- Deployments (ready to scale back up)

### Complete Shutdown (Remove All Resources)

To completely remove all application resources:

```bash
# 1. Delete deployments and services
kubectl delete -f infrastructure/kubernetes/k8s/secret-service-deployment.yaml
kubectl delete -f infrastructure/kubernetes/k8s/audit-service-deployment.yaml

# 2. (Optional) Delete secrets (WARNING: You'll need to recreate them)
# kubectl delete secret db-credentials csm-app-config -n cloud-secrets-manager

# 3. (Optional) Delete namespace (WARNING: Removes everything)
# kubectl delete namespace cloud-secrets-manager
```

**Warning:** Complete shutdown removes all resources. You'll need to recreate secrets and redeploy if you want to start again.

---

## Complete Deployment Workflow

### Initial Deployment (First Time)

```bash
# 1. Prerequisites
gcloud auth login
gcloud auth application-default login
gcloud config set project cloud-secrets-manager

# 2. Connect to cluster
gcloud container clusters get-credentials cloud-secrets-cluster-dev \
  --region europe-west10 \
  --project cloud-secrets-manager

# 3. Configure Docker
gcloud auth configure-docker europe-west10-docker.pkg.dev

# 4. Create namespace and service accounts
kubectl create namespace cloud-secrets-manager
kubectl create serviceaccount secret-service -n cloud-secrets-manager
kubectl create serviceaccount audit-service -n cloud-secrets-manager
kubectl annotate serviceaccount secret-service \
  -n cloud-secrets-manager \
  iam.gke.io/gcp-service-account=secret-service-dev@cloud-secrets-manager.iam.gserviceaccount.com
kubectl annotate serviceaccount audit-service \
  -n cloud-secrets-manager \
  iam.gke.io/gcp-service-account=audit-service-dev@cloud-secrets-manager.iam.gserviceaccount.com

# 5. Build and push images
cd apps/backend/secret-service
docker build --platform linux/amd64 \
  -t europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images/secret-service:latest .
docker push europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images/secret-service:latest

cd ../audit-service
docker build --platform linux/amd64 \
  -t europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images/audit-service:latest .
docker push europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images/audit-service:latest

# 6. Create secrets
SECRETS_DB_PASSWORD=$(gcloud secrets versions access latest \
  --secret="secrets-manager-db-dev-secrets_db-password")
AUDIT_DB_PASSWORD=$(gcloud secrets versions access latest \
  --secret="secrets-manager-db-dev-audit_db-password")
DB_CONNECTION="cloud-secrets-manager:europe-west10:secrets-manager-db-dev-3631da18"

kubectl create secret generic db-credentials \
  -n cloud-secrets-manager \
  --from-literal=connection-name="$DB_CONNECTION" \
  --from-literal=secrets-db-password="$SECRETS_DB_PASSWORD" \
  --from-literal=audit-db-password="$AUDIT_DB_PASSWORD"

JWT_SECRET=$(openssl rand -hex 32)
AES_KEY=$(openssl rand -base64 24 | tr -d '\n' | head -c 32)
kubectl create secret generic csm-app-config \
  -n cloud-secrets-manager \
  --from-literal=JWT_SECRET="$JWT_SECRET" \
  --from-literal=AES_KEY="$AES_KEY" \
  --from-literal=GOOGLE_PROJECT_ID="cloud-secrets-manager"

# 7. Deploy applications
kubectl apply -f infrastructure/kubernetes/k8s/secret-service-deployment.yaml
kubectl apply -f infrastructure/kubernetes/k8s/audit-service-deployment.yaml

# 8. Verify deployment
kubectl get pods -n cloud-secrets-manager -w
```

### Routine Deployment (Updates)

```bash
# 1. Build and push new images
cd apps/backend/secret-service
docker build --platform linux/amd64 \
  -t europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images/secret-service:latest .
docker push europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images/secret-service:latest

# 2. Restart deployment to pull new image
kubectl rollout restart deployment/csm-secret-service -n cloud-secrets-manager

# 3. Monitor rollout
kubectl rollout status deployment/csm-secret-service -n cloud-secrets-manager
```

---

## Next Steps

After successful deployment:

1. **Set up Ingress** (if external access is needed)
   ```bash
   kubectl apply -f infrastructure/kubernetes/k8s/ingress.yaml
   ```

2. **Configure Monitoring** (Prometheus/Grafana)

3. **Set up CI/CD Pipeline** for automated deployments

4. **Configure Backup Strategy** for Cloud SQL

5. **Review Security** (network policies, pod security standards)

6. **Review Operations Guide** - See [OPERATIONS_GUIDE.md](./OPERATIONS_GUIDE.md) for day-to-day management commands

---

**Last Updated:** November 22, 2025  
**Maintained by:** Cloud Secrets Manager Team

