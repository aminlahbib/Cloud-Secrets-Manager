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

### Step 6: Create Kubernetes Secrets (Replaced by External Secrets Operator)

**Note:** This step is now automated by the **External Secrets Operator (ESO)**. You no longer need to manually create these secrets with `kubectl create secret` or use Sealed Secrets.

Instead, ensure you have:

1.  Created the secrets in **Google Secret Manager** (see [External Secrets Setup](./EXTERNAL_SECRETS_SETUP.md)).
2.  Installed ESO via Terraform (`infrastructure/terraform/environments/dev`).
3.  Applied the `ExternalSecret` manifests:

```bash
kubectl apply -f infrastructure/kubernetes/k8s/external-secrets.yaml
```

This will automatically create the following secrets in the `cloud-secrets-manager` namespace:
- `csm-db-secrets` (contains: secrets-db-user, secrets-db-password, audit-db-user, audit-db-password)
- `csm-app-config` (contains: JWT_SECRET, AES_KEY, GOOGLE_PROJECT_ID, GOOGLE_API_KEY)
- `csm-google-service-account` (contains: service-account.json)

**Verify:**
```bash
kubectl get externalsecrets -n cloud-secrets-manager
kubectl get secrets -n cloud-secrets-manager
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
- **Cloud SQL Proxy**: Sidecar container connecting to Cloud SQL via Workload Identity
- **Database Connection**: Applications connect to `127.0.0.1:5432` (proxied by Cloud SQL Proxy)
- **Databases**: `secrets` and `audit` (Cloud SQL managed PostgreSQL)
- **Users**: `secrets_user` and `audit_user`
- **Resource Requests**: 
  - Secret Service: 200m CPU, 256Mi memory
  - Audit Service: 100m CPU, 128Mi memory
  - Cloud SQL Proxy: 50m CPU, 64Mi memory

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

# 6. Setup External Secrets (secrets are managed by ESO from Google Secret Manager)
# See: docs/deployment/EXTERNAL_SECRETS_SETUP.md for creating secrets in Google Secret Manager
kubectl apply -f infrastructure/kubernetes/k8s/external-secrets.yaml

# Verify secrets are synced
kubectl get externalsecrets -n cloud-secrets-manager
kubectl get secrets -n cloud-secrets-manager

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

## Startup, Usage, and Management

### Starting the Application

After deployment, start the services:

```bash
# Scale up deployments
kubectl scale deployment secret-service audit-service --replicas=1 -n cloud-secrets-manager

# Monitor startup
kubectl get pods -n cloud-secrets-manager -w

# Wait for pods to be ready (2/2 containers)
kubectl wait --for=condition=ready pod -l app=secret-service -n cloud-secrets-manager --timeout=300s
kubectl wait --for=condition=ready pod -l app=audit-service -n cloud-secrets-manager --timeout=300s
```

### Accessing the Application

#### Port Forwarding (Local Access)

```bash
# Port forward secret-service
kubectl port-forward -n cloud-secrets-manager svc/secret-service 8080:8080

# Port forward audit-service (in another terminal)
kubectl port-forward -n cloud-secrets-manager svc/audit-service 8081:8081
```

#### Using the API

**1. Get Google ID Token:**
```bash
# See docs/current/GET_ID_TOKEN.md for detailed instructions
# Or use the provided script:
# testing/postman/get-token.js
```

**2. Authenticate:**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"idToken": "YOUR_GOOGLE_ID_TOKEN"}'

# Response contains accessToken and refreshToken
```

**3. Create a Secret:**
```bash
curl -X POST http://localhost:8080/api/secrets \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "database.password",
    "value": "mySecretPassword123",
    "description": "Database password for production"
  }'
```

**4. Retrieve a Secret:**
```bash
curl -X GET http://localhost:8080/api/secrets/database.password \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**5. List All Secrets:**
```bash
curl -X GET http://localhost:8080/api/secrets \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**6. Update a Secret:**
```bash
curl -X PUT http://localhost:8080/api/secrets/database.password \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "value": "newPassword456",
    "description": "Updated database password"
  }'
```

**7. Delete a Secret:**
```bash
curl -X DELETE http://localhost:8080/api/secrets/database.password \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**8. View Audit Logs:**
```bash
# Get all audit logs
curl -X GET http://localhost:8081/api/audit \
  -H "Authorization: Bearer <ACCESS_TOKEN>"

# Get logs by username
curl -X GET http://localhost:8081/api/audit/username/john.doe@example.com \
  -H "Authorization: Bearer <ACCESS_TOKEN>"

# Get logs by secret key
curl -X GET http://localhost:8081/api/audit/secret/database.password \
  -H "Authorization: Bearer <ACCESS_TOKEN>"

# Get logs by date range
curl -X GET "http://localhost:8081/api/audit/date-range?start=2025-11-01T00:00:00Z&end=2025-11-22T23:59:59Z" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**9. Health Checks:**
```bash
# Secret Service health
curl http://localhost:8080/actuator/health
curl http://localhost:8080/actuator/health/liveness
curl http://localhost:8080/actuator/health/readiness

# Audit Service health
curl http://localhost:8081/actuator/health

# Metrics
curl http://localhost:8080/actuator/metrics
curl http://localhost:8080/actuator/prometheus
```

### Managing the Deployment

#### Scaling

```bash
# Scale up secret-service to 3 replicas
kubectl scale deployment secret-service --replicas=3 -n cloud-secrets-manager

# Scale down
kubectl scale deployment secret-service --replicas=1 -n cloud-secrets-manager

# Check current replica count
kubectl get deployment secret-service -n cloud-secrets-manager
```

#### Updating Application

```bash
# Build and push new image
cd apps/backend/secret-service
docker build --platform linux/amd64 \
  -t europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images/secret-service:latest .
docker push europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images/secret-service:latest

# Restart deployment to pull new image
kubectl rollout restart deployment/secret-service -n cloud-secrets-manager

# Monitor rollout
kubectl rollout status deployment/secret-service -n cloud-secrets-manager

# View rollout history
kubectl rollout history deployment/secret-service -n cloud-secrets-manager

# Rollback if needed
kubectl rollout undo deployment/secret-service -n cloud-secrets-manager
```

#### Viewing Logs

```bash
# Secret Service logs
kubectl logs -l app=secret-service -n cloud-secrets-manager -c secret-service -f

# Audit Service logs
kubectl logs -l app=audit-service -n cloud-secrets-manager -c audit-service -f

# Cloud SQL Proxy logs
kubectl logs -l app=secret-service -n cloud-secrets-manager -c cloud-sql-proxy -f

# Last 100 lines
kubectl logs -l app=secret-service -n cloud-secrets-manager -c secret-service --tail=100
```

#### Resource Monitoring

```bash
# Pod resource usage
kubectl top pods -n cloud-secrets-manager

# Node resource usage
kubectl top nodes

# Detailed pod information
kubectl describe pod <pod-name> -n cloud-secrets-manager
```

### Shutting Down

#### Graceful Shutdown (Recommended)

```bash
# Scale down to 0 replicas (allows pods to finish current requests)
kubectl scale deployment secret-service audit-service --replicas=0 -n cloud-secrets-manager

# Wait for pods to terminate
kubectl get pods -n cloud-secrets-manager -w

# Verify all pods are terminated
kubectl get pods -n cloud-secrets-manager
```

#### Complete Shutdown (Removes Resources)

```bash
# Delete deployments
kubectl delete deployment secret-service audit-service -n cloud-secrets-manager

# Delete services
kubectl delete svc secret-service audit-service -n cloud-secrets-manager

# Delete secrets (if not using ESO)
# kubectl delete secret csm-db-secrets csm-app-config -n cloud-secrets-manager

# Delete namespace (removes everything in namespace)
# kubectl delete namespace cloud-secrets-manager
```

**Warning:** Complete shutdown removes all resources. You'll need to recreate secrets and redeploy if you want to start again.

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

---

## Related Documentation

- **[Local Development Guide](./LOCAL_DEVELOPMENT_GUIDE.md)** - For local development with Docker Compose
- **[External Secrets Setup](./EXTERNAL_SECRETS_SETUP.md)** - Setting up secret management
- **[Helm Deployment Guide](./HELM_DEPLOYMENT_GUIDE.md)** - Alternative deployment using Helm
- **[Operations Guide](./OPERATIONS_GUIDE.md)** - Day-to-day operations and management

---

**Last Updated:** November 22, 2025  
**Maintained by:** Cloud Secrets Manager Team

