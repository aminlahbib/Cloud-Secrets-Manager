This guide provides a complete workflow to deploy the Cloud Secrets Manager application to Google Kubernetes Engine (GKE) using Helm.

**Deployment Method:** Helm exclusively for consistent, manageable deployments.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
   - [Required Tools](#required-tools)
   - [GCP Authentication](#gcp-authentication)
   - [Infrastructure Requirements](#infrastructure-requirements)
2. [Deployment Workflow](#deployment-workflow)
   - [Phase 1: Initial Setup](#phase-1-initial-setup)
     - [1.1 Connect to GKE Cluster](#11-connect-to-gke-cluster)
     - [1.2 Configure Docker for Artifact Registry](#12-configure-docker-for-artifact-registry)
     - [1.3 Create Namespace](#13-create-namespace)
   - [Phase 2: Build & Push Images](#phase-2-build--push-images)
     - [2.1 Build Secret Service Image](#21-build-secret-service-image)
     - [2.2 Build Audit Service Image](#22-build-audit-service-image)
     - [2.3 Verify Images](#23-verify-images)
   - [Phase 3: Configure Secrets](#phase-3-configure-secrets)
     - [3.1 Verify External Secrets Operator](#31-verify-external-secrets-operator)
     - [3.2 Apply External Secret Manifests](#32-apply-external-secret-manifests)
     - [3.3 Verify Secrets Are Synced](#33-verify-secrets-are-synced)
   - [Phase 4: Deploy Stack](#phase-4-deploy-stack)
     - [4.1 Deploy Applications with Helm](#41-deploy-applications-with-helm)
     - [4.2 Deploy Monitoring Resources](#42-deploy-monitoring-resources)
   - [Phase 5: System Verification](#phase-5-system-verification)
     - [5.1 Check Pod Status](#51-check-pod-status)
     - [5.2 Verify Application Logs](#52-verify-application-logs)
     - [5.3 Verify Observability](#53-verify-observability)
     - [5.4 Test Async Flows](#54-test-async-flows)
3. [Operations](#operations)
   - [Starting Services](#starting-services)
   - [Stopping Services](#stopping-services)
     - [Graceful Shutdown](#graceful-shutdown)
     - [Complete Removal](#complete-removal)
   - [Updating Applications](#updating-applications)
     - [Update Image and Deploy](#update-image-and-deploy)
   - [Scaling](#scaling)
   - [Viewing Logs](#viewing-logs)
   - [Accessing the Application](#accessing-the-application)
     - [Port Forwarding](#port-forwarding)
     - [API Usage Examples](#api-usage-examples)
   - [Monitoring Resources](#monitoring-resources)
   - [Managing Docker Images](#managing-docker-images)
     - [List Images in Artifact Registry](#list-images-in-artifact-registry)
     - [Clean Up Old Images](#clean-up-old-images)
4. [Troubleshooting](#troubleshooting)
   - [Pods Stuck in Pending](#pods-stuck-in-pending)
   - [Pods in CrashLoopBackOff](#pods-in-crashloopbackoff)
   - [Database Connection Errors](#database-connection-errors)
   - [Image Pull Errors](#image-pull-errors)
   - [Workload Identity Issues](#workload-identity-issues)
5. [Quick Reference](#quick-reference)
   - [Cluster Information](#cluster-information)
   - [Database](#database)
   - [Artifact Registry](#artifact-registry)
   - [Service Accounts](#service-accounts)
   - [Kubernetes Resources](#kubernetes-resources)
   - [Essential Commands](#essential-commands)
6. [Complete Workflow Script](#complete-workflow-script)
7. [Next Steps](#next-steps)
8. [Related Documentation](#related-documentation)

---

## Prerequisites

### Required Tools

Install and verify these tools are available:

```bash
# Google Cloud SDK
gcloud --version

# Kubernetes CLI
kubectl version --client

# Docker
docker --version

# Terraform (for infrastructure - should already be deployed)
terraform version

# Helm (for application deployment)
helm version
```

### GCP Authentication

Authenticate with Google Cloud Platform:

```bash
# Login to GCP
gcloud auth login

# Set application default credentials (for local development)
gcloud auth application-default login

# Set your project
gcloud config set project cloud-secrets-manager

# Verify project is set
gcloud config get-value project
```

### Infrastructure Requirements

**Before starting, ensure Terraform has provisioned:**
- ✅ GKE Cluster: `cloud-secrets-cluster-dev`
- ✅ PostgreSQL Database: `secrets-manager-db-dev-*`
- ✅ Artifact Registry: `docker-images` repository
- ✅ Service Accounts with Workload Identity configured
- ✅ External Secrets Operator installed

---

## Deployment Workflow

Follow these phases in order for a complete deployment.

### Phase 1: Initial Setup

**Goal:** Connect to the cluster and prepare the environment.

#### 1.1 Connect to GKE Cluster

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

#### 1.2 Configure Docker for Artifact Registry

```bash
gcloud auth configure-docker europe-west10-docker.pkg.dev
```

**What this does:** Configures Docker to authenticate with Google Artifact Registry using your GCP credentials.

#### 1.3 Create Namespace

```bash
kubectl create namespace cloud-secrets-manager
```

**Note:** Helm can create the namespace automatically with `--create-namespace`, but creating it explicitly ensures it exists before other operations.

**✅ Checkpoint:** You should be able to connect to the cluster and authenticate Docker.

---

### Phase 2: Build & Push Images

**Goal:** Build application images and push them to Artifact Registry.

**Important:** Always build for `linux/amd64` platform since GKE nodes run on x86_64 architecture.

#### 2.1 Build Secret Service Image

```bash
cd apps/backend/secret-service

docker build --platform linux/amd64 \
  -t europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images/secret-service:latest .

docker push europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images/secret-service:latest
```

#### 2.2 Build Audit Service Image

```bash
cd ../audit-service

docker build --platform linux/amd64 \
  -t europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images/audit-service:latest .

docker push europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images/audit-service:latest
```

#### 2.3 Verify Images

```bash
gcloud artifacts docker images list \
  europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images \
  --include-tags
```

**Expected output:** Both `secret-service:latest` and `audit-service:latest` should be listed.

**✅ Checkpoint:** Images are available in Artifact Registry.

---

### Phase 3: Configure Secrets

**Goal:** Ensure secrets are synced from Google Secret Manager to Kubernetes.

#### 3.1 Verify External Secrets Operator

External Secrets Operator (ESO) should already be installed by Terraform. Verify it's running:

```bash
kubectl get pods -n external-secrets-system
```

#### 3.2 Apply External Secret Manifests

```bash
kubectl apply -f infrastructure/kubernetes/k8s/external-secrets.yaml
```

**What this does:** Creates `ExternalSecret` resources that sync secrets from Google Secret Manager to Kubernetes.

#### 3.3 Verify Secrets Are Synced

```bash
# Check ExternalSecret status
kubectl get externalsecrets -n cloud-secrets-manager

# Check actual Kubernetes secrets
kubectl get secrets -n cloud-secrets-manager
```

**Expected secrets:**
- `csm-db-secrets` (database credentials)
- `csm-app-config` (JWT_SECRET, AES_KEY, etc.)
- `csm-google-service-account` (service account JSON)

**✅ Checkpoint:** All required secrets exist in the namespace.

---

### Phase 4: Deploy Stack

**Goal:** Deploy the application via Helm and the associated observability configurations.

#### 4.1 Deploy Applications with Helm

Deploy the core services (`secret-service`, `audit-service`) using the Helm chart.

```bash
helm upgrade --install cloud-secrets-manager \
  ./infrastructure/helm/cloud-secrets-manager \
  --namespace=cloud-secrets-manager \
  --create-namespace
```

**What Helm creates:**
- Kubernetes Deployments (`secret-service`, `audit-service`)
- Kubernetes Services (for internal communication)
- Service Accounts with Workload Identity annotations
- Cloud SQL Proxy sidecars
- Environment variables and secret references

Verify the release status:
```bash
helm status cloud-secrets-manager -n cloud-secrets-manager
```

#### 4.2 Deploy Monitoring Resources

Apply the Prometheus alerting rules and Grafana dashboard configurations. These enable observability immediately upon application startup.

```bash
kubectl apply -f monitoring/alerts/prometheus-rules.yaml
kubectl apply -f monitoring/grafana/dashboard-configmap.yaml
```

**Note:** Ensure you have the Prometheus Operator and Grafana installed in your cluster (usually via `kube-prometheus-stack`).

**✅ Checkpoint:** Helm release is deployed, and monitoring manifests are applied.

---

### Phase 5: System Verification

**Goal:** Validate that all components (Apps, Database, Monitoring) are healthy and interacting correctly.

#### 5.0 Quick Verification (Recommended)

Run the comprehensive verification script:

```bash
./scripts/verify-deployment.sh
```

This script checks pod status, security contexts, network policies, and more.

#### 5.1 Check Pod Status

Wait for all pods to become ready (2/2 containers per pod).

```bash
# Watch pod status (Ctrl+C to exit)
kubectl get pods -n cloud-secrets-manager -w
```

**Expected:** Status `Running`, Ready `2/2`.

#### 5.2 Verify Application Logs

Check for successful startup and database connectivity.

```bash
# Secret Service logs
kubectl logs -n cloud-secrets-manager -l app=secret-service -c secret-service --tail=50

# Audit Service logs
kubectl logs -n cloud-secrets-manager -l app=audit-service -c audit-service --tail=50
```

**Expected:** Spring Boot startup banners and no connection errors.

#### 5.3 Verify Observability

Confirm that metrics are being scraped.

**1. Access Prometheus:**
```bash
kubectl port-forward svc/prometheus-operated 9090:9090 -n monitoring
```
Open [http://localhost:9090/targets](http://localhost:9090/targets) and ensure `secret-service` and `audit-service` are **UP**.

**2. Access Grafana:**
```bash
kubectl port-forward svc/grafana 3000:3000 -n monitoring
```
Open [http://localhost:3000](http://localhost:3000) and view the **"Cloud Secrets Manager Overview"** dashboard.

#### 5.4 Test Async Flows

Verify that the asynchronous auditing architecture is functioning.

1.  **Trigger an Action:**
    ```bash
    # Create a test secret
    # (Assuming port-forward to secret-service on 8080)
    curl -X POST http://localhost:8080/api/secrets \
      -H "Content-Type: application/json" \
      -d '{"key":"test-key", "value":"test-value"}'
    ```
2.  **Verify Non-Blocking Response:** The API should respond immediately.
3.  **Verify Audit Log:**
    ```bash
    kubectl logs -n cloud-secrets-manager -l app=audit-service --tail=20
    ```
    You should see the audit event processed shortly after the API response.
4.  **Verify Metrics:** Check the "Secret Operations" panel in Grafana; the counter should increment.

**✅ Checkpoint:** The system is fully operational, observable, and reliable.

---

## Operations

### Starting Services

If services were stopped and need to be restarted:

```bash
# Scale deployments back up
kubectl scale deployment secret-service audit-service \
  --replicas=1 -n cloud-secrets-manager

# Monitor startup
kubectl get pods -n cloud-secrets-manager -w

# Wait for readiness
kubectl wait --for=condition=ready pod \
  -l app=secret-service -n cloud-secrets-manager --timeout=300s

kubectl wait --for=condition=ready pod \
  -l app=audit-service -n cloud-secrets-manager --timeout=300s
```

### Stopping Services

#### Graceful Shutdown

```bash
# Scale down to 0 replicas (allows pods to finish current requests)
kubectl scale deployment secret-service audit-service \
  --replicas=0 -n cloud-secrets-manager

# Wait for pods to terminate
kubectl wait --for=delete pod \
  -l app=secret-service -n cloud-secrets-manager --timeout=60s || true

kubectl wait --for=delete pod \
  -l app=audit-service -n cloud-secrets-manager --timeout=60s || true
```

**Note:** This keeps deployments, services, and secrets intact for quick restart.

#### Complete Removal

```bash
# Uninstall Helm release (removes all resources)
helm uninstall cloud-secrets-manager -n cloud-secrets-manager

# Optional: Delete namespace (removes everything)
# kubectl delete namespace cloud-secrets-manager
```

### Updating Applications

#### Update Image and Deploy

```bash
# 1. Build and push new image
cd apps/backend/secret-service
docker build --platform linux/amd64 \
  -t europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images/secret-service:latest .
docker push europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images/secret-service:latest

# 2. Restart deployment to pull new image
kubectl rollout restart deployment/secret-service -n cloud-secrets-manager

# 3. Monitor rollout
kubectl rollout status deployment/secret-service -n cloud-secrets-manager

# 4. View rollout history
kubectl rollout history deployment/secret-service -n cloud-secrets-manager

# 5. Rollback if needed
kubectl rollout undo deployment/secret-service -n cloud-secrets-manager
```

### Scaling

```bash
# Scale up
kubectl scale deployment secret-service --replicas=3 -n cloud-secrets-manager

# Scale down
kubectl scale deployment secret-service --replicas=1 -n cloud-secrets-manager

# Check current replica count
kubectl get deployment secret-service -n cloud-secrets-manager
```

### Viewing Logs

```bash
# Follow logs (live)
kubectl logs -l app=secret-service -n cloud-secrets-manager \
  -c secret-service -f

# Last 100 lines
kubectl logs -l app=secret-service -n cloud-secrets-manager \
  -c secret-service --tail=100

# Cloud SQL Proxy logs
kubectl logs -l app=secret-service -n cloud-secrets-manager \
  -c cloud-sql-proxy -f
```

### Accessing the Application

#### Port Forwarding

```bash
# Secret Service
kubectl port-forward -n cloud-secrets-manager \
  svc/secret-service 8080:8080

# Audit Service (in another terminal)
kubectl port-forward -n cloud-secrets-manager \
  svc/audit-service 8081:8081
```

#### API Usage Examples

**1. Authenticate:**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"idToken": "YOUR_GOOGLE_ID_TOKEN"}'
```

**2. Create Secret:**
```bash
curl -X POST http://localhost:8080/api/secrets \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"key": "database.password", "value": "mySecretPassword123"}'
```

**3. Get Secret:**
```bash
curl -X GET http://localhost:8080/api/secrets/database.password \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**4. Health Check:**
```bash
curl http://localhost:8080/actuator/health
```

### Monitoring Resources

```bash
# Pod resource usage
kubectl top pods -n cloud-secrets-manager

# Node resource usage
kubectl top nodes

# Detailed pod information
kubectl describe pod <pod-name> -n cloud-secrets-manager
```

### Managing Docker Images

#### List Images in Artifact Registry

```bash
# List all images
gcloud artifacts docker images list \
  europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images \
  --include-tags

# List only latest tags
gcloud artifacts docker images list \
  europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images \
  --include-tags \
  --filter="tags:latest"
```

#### Clean Up Old Images

**Important:** Keep at least the `latest` tag and recent versions. Old untagged images and build caches can be removed to save storage costs.

```bash
# List images without tags (candidates for cleanup)
gcloud artifacts docker images list \
  europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images/secret-service \
  --include-tags \
  --filter="-tags:*"

# List buildcache images
gcloud artifacts docker images list \
  europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images \
  --include-tags \
  --filter="tags:buildcache"

# Delete a specific image by digest (be careful!)
# Format: IMAGE_PATH@sha256:DIGEST
# gcloud artifacts docker images delete \
#   europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images/secret-service@sha256:DIGEST \
#   --quiet

# Delete buildcache images
# Step 1: List buildcache images to see what will be deleted
gcloud artifacts docker images list \
  europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images \
  --include-tags \
  --filter="tags:buildcache"

# Step 2: Delete buildcache images by tag (since they're tagged, delete by tag)
# For tagged images, delete using the tag name instead of digest
gcloud artifacts docker images delete \
  europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images/audit-service:buildcache \
  --quiet

gcloud artifacts docker images delete \
  europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images/secret-service:buildcache \
  --quiet

# Alternative: Delete untagged images older than 7 days (manual cleanup)
# List first to verify:
gcloud artifacts docker images list \
  europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images/secret-service \
  --include-tags \
  --filter="-tags:*" \
  --format="table(package,version,create_time)"
# Then delete specific ones by digest if needed
```

**Best Practices:**
- Keep `latest` tag always
- Keep recent git SHA tags (last 5-10 commits)
- Remove old untagged images periodically (they consume storage)
- Remove `buildcache` images if not needed (they're large)
- Consider using Artifact Registry retention policies for automatic cleanup
- Always verify before deleting - use `--dry-run` if available or list first

---

## Troubleshooting

### Pods Stuck in Pending

**Symptom:** Pods show `Pending` status for extended time.

**Diagnosis:**
```bash
kubectl describe pod <pod-name> -n cloud-secrets-manager
kubectl top nodes
```

**Solution:** Check for insufficient cluster resources. Scale cluster or reduce resource requests.

### Pods in CrashLoopBackOff

**Symptom:** Pods restart repeatedly.

**Diagnosis:**
```bash
# Check pod events
kubectl describe pod <pod-name> -n cloud-secrets-manager

# Check application logs
kubectl logs <pod-name> -n cloud-secrets-manager -c secret-service

# Check Cloud SQL Proxy logs
kubectl logs <pod-name> -n cloud-secrets-manager -c cloud-sql-proxy
```

**Common causes:**
- Architecture mismatch (rebuild with `--platform linux/amd64`)
- Database connection issues
- Missing secrets
- Invalid encryption key format

### Database Connection Errors

**Symptom:** Applications can't connect to database.

**Diagnosis:**
```bash
# Verify Cloud SQL Proxy is running
kubectl logs <pod-name> -n cloud-secrets-manager -c cloud-sql-proxy

# Check Workload Identity (should see "Authorizing with Application Default Credentials")
kubectl logs <pod-name> -n cloud-secrets-manager -c cloud-sql-proxy | grep -i "authorizing"

# Verify service account has Cloud SQL roles
gcloud projects get-iam-policy cloud-secrets-manager \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:secret-service-dev@cloud-secrets-manager.iam.gserviceaccount.com" \
  --format="table(bindings.role)"

# Verify Workload Identity annotation
kubectl describe serviceaccount secret-service -n cloud-secrets-manager | \
  grep "iam.gke.io/gcp-service-account"
```

**Common fixes:**
- Ensure service account has `roles/cloudsql.client` and `roles/cloudsql.instanceUser`
- Verify Workload Identity annotation is present
- Restart pods after adding annotations

### Image Pull Errors

**Symptom:** Pods can't pull Docker images.

**Diagnosis:**
```bash
# Verify images exist
gcloud artifacts docker images list \
  europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images

# Verify Docker authentication
gcloud auth configure-docker europe-west10-docker.pkg.dev
```

**Solution:** Ensure images are pushed and service account has Artifact Registry Reader role.

### Workload Identity Issues

**Symptom:** Pods can't authenticate to GCP services (403 errors).

**Diagnosis:**
```bash
# Verify service account annotations
kubectl describe serviceaccount secret-service -n cloud-secrets-manager

# Verify Workload Identity binding
gcloud iam service-accounts get-iam-policy \
  secret-service-dev@cloud-secrets-manager.iam.gserviceaccount.com

# Check Cloud SQL Proxy logs
kubectl logs -n cloud-secrets-manager -l app=secret-service \
  -c cloud-sql-proxy --tail=20
```

**Solution:**
- Ensure service account annotation: `iam.gke.io/gcp-service-account=secret-service-dev@cloud-secrets-manager.iam.gserviceaccount.com`
- Verify GCP service account has required roles
- Restart pods after configuration changes

---

## Quick Reference

### Cluster Information

- **Cluster:** `cloud-secrets-cluster-dev`
- **Region:** `europe-west10`
- **Project:** `cloud-secrets-manager`
- **Namespace:** `cloud-secrets-manager`

### Database

- **Instance:** `secrets-manager-db-dev-*` (random suffix)
- **Connection:** `cloud-secrets-manager:europe-west10:secrets-manager-db-dev-*`
- **Databases:** `secrets`, `audit`

### Artifact Registry

- **Repository:** `europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images`
- **Images:** `secret-service:latest`, `audit-service:latest`

### Service Accounts

- **Secret Service:** `secret-service-dev@cloud-secrets-manager.iam.gserviceaccount.com`
- **Audit Service:** `audit-service-dev@cloud-secrets-manager.iam.gserviceaccount.com`

### Kubernetes Resources

- **Deployments:** `secret-service`, `audit-service`
- **Services:** `secret-service` (8080), `audit-service` (8081)
- **Secrets:** `csm-db-secrets`, `csm-app-config`, `csm-google-service-account`

### Essential Commands

```bash
# Get pod status
kubectl get pods -n cloud-secrets-manager

# View logs
kubectl logs -n cloud-secrets-manager -l app=secret-service -c secret-service

# Port forward
kubectl port-forward -n cloud-secrets-manager svc/secret-service 8080:8080

# Restart deployment
kubectl rollout restart deployment/secret-service -n cloud-secrets-manager

# Scale deployment
kubectl scale deployment/secret-service --replicas=2 -n cloud-secrets-manager

# Helm status
helm status cloud-secrets-manager -n cloud-secrets-manager

# Helm upgrade
helm upgrade cloud-secrets-manager \
  ./infrastructure/helm/cloud-secrets-manager \
  --namespace=cloud-secrets-manager
```

---

## Complete Workflow Script

For a complete first-time deployment, run these commands in order:

```bash
#!/bin/bash
set -e

# Phase 1: Setup
gcloud container clusters get-credentials cloud-secrets-cluster-dev \
  --region europe-west10 --project cloud-secrets-manager
gcloud auth configure-docker europe-west10-docker.pkg.dev
kubectl create namespace cloud-secrets-manager || true

# Phase 2: Build & Push
cd apps/backend/secret-service
docker build --platform linux/amd64 \
  -t europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images/secret-service:latest .
docker push europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images/secret-service:latest

cd ../audit-service
docker build --platform linux/amd64 \
  -t europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images/audit-service:latest .
docker push europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images/audit-service:latest

# Phase 3: Secrets
kubectl apply -f infrastructure/kubernetes/k8s/external-secrets.yaml
kubectl wait --for=condition=ready externalsecret/csm-db-secrets \
  -n cloud-secrets-manager --timeout=60s || true

# Phase 4: Deploy Stack
cd ../../..
helm upgrade --install cloud-secrets-manager \
  ./infrastructure/helm/cloud-secrets-manager \
  --namespace=cloud-secrets-manager --create-namespace

kubectl apply -f monitoring/alerts/prometheus-rules.yaml
kubectl apply -f monitoring/grafana/dashboard-configmap.yaml

# Phase 5: Verify
kubectl wait --for=condition=ready pod \
  -l app=secret-service -n cloud-secrets-manager --timeout=300s
kubectl wait --for=condition=ready pod \
  -l app=audit-service -n cloud-secrets-manager --timeout=300s

echo "✅ Deployment complete!"
kubectl get pods -n cloud-secrets-manager
```

---

## Next Steps

After successful deployment, consider these enhancements organized by priority. **All features listed below have been implemented and are ready for deployment** - see [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for complete details.

### High Priority ✅

1. **Security Hardening** ✅
   - **Network Policies**: ✅ Implemented - See `infrastructure/kubernetes/k8s/network-policies.yaml`
   - **Pod Security Standards**: ✅ Implemented - See `infrastructure/kubernetes/k8s/pod-security-standards.yaml`
   - **RBAC Review**: Audit and tighten Role-Based Access Control (RBAC) permissions
   - **Secrets Encryption**: Ensure secrets are encrypted at rest and in transit

   **Quick Deploy**:
```bash
   ./scripts/deploy-security-policies.sh
   # Or manually:
   kubectl apply -f infrastructure/kubernetes/k8s/network-policies.yaml
   kubectl apply -f infrastructure/kubernetes/k8s/pod-security-standards.yaml
   ```

2. **Monitoring Setup (Grafana)** ✅
   - **Prometheus Configuration**: ✅ Implemented - See `infrastructure/kubernetes/k8s/monitoring/prometheus-config.yaml`
   - **ServiceMonitors**: ✅ Configured for both services
   - **Alerting Rules**: ✅ Configured for critical metrics
   - **Documentation**: ✅ See `infrastructure/kubernetes/k8s/monitoring/README.md`

   **Quick Deploy**:
   ```bash
   ./scripts/deploy-monitoring.sh
   # Or manually:
   kubectl apply -f infrastructure/kubernetes/k8s/monitoring/prometheus-config.yaml
```

### Short-Term (Medium Priority) ✅

1. **Ingress Configuration** ✅
   - **TLS Support**: ✅ Implemented in Helm values
   - **Rate Limiting**: ✅ Configured (100 req/min, 10 connections)
   - **Security Headers**: ✅ Configured
   - **DDoS Protection**: ✅ Configured

   **Deployment**:
```bash
   helm upgrade cloud-secrets-manager \
     ./infrastructure/helm/cloud-secrets-manager \
     --namespace=cloud-secrets-manager \
     --set ingress.enabled=true \
     --set ingress.tls.enabled=true
   ```

2. **Backup Verification** ✅
   - **Complete Documentation**: ✅ See [BACKUP_VERIFICATION.md](./operations/BACKUP_VERIFICATION.md)
   - **Restore Procedures**: ✅ Documented with step-by-step instructions
   - **RTO/RPO**: ✅ Defined (RTO: 1 hour, RPO: 15 minutes)
   - **Testing Scripts**: ✅ Provided

3. **Multi-Environment Setup (Staging)** ✅
   - **Staging Values File**: ✅ See `infrastructure/helm/cloud-secrets-manager/values-staging.yaml`
   - **Environment-Specific Config**: ✅ Configured

   **Deployment**:
   ```bash
   helm install cloud-secrets-manager-staging \
     ./infrastructure/helm/cloud-secrets-manager \
     --namespace=cloud-secrets-manager-staging \
     --create-namespace \
     -f infrastructure/helm/cloud-secrets-manager/values-staging.yaml
   ```

### Long-Term (Low Priority) ✅

1. **Frontend Development** (if UI needed)
   - Build web interface for secret management
   - Implement user authentication and authorization UI
   - Create audit log visualization dashboard

2. **Secret Rotation Automation**
   - Implement automated secret rotation policies
   - Set up rotation schedules and notifications
   - Create rotation workflows for different secret types

3. **API Rate Limiting** ✅
   - **Application-Level Rate Limiting**: ✅ Implemented
   - **IP-Based Limiting**: ✅ 100 requests/minute per IP
   - **Rate Limit Headers**: ✅ Included in responses
   - **Configuration**: ✅ See `apps/backend/secret-service/src/main/java/com/secrets/config/RateLimitingConfig.java`

   **Note**: Rate limiting is automatically enabled. Rebuild and deploy the secret-service to activate.

---

**📋 For complete implementation details and deployment instructions, see [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)**

### Additional Resources

- **Operations Guide**: [OPERATIONS_GUIDE.md](./OPERATIONS_GUIDE.md) - Day-to-day management commands
- **CI/CD**: Configure automated deployments via GitHub Actions (see `.github/workflows/ci-cd.yml`)

---

## Related Documentation

- **[External Secrets Setup](./EXTERNAL_SECRETS_SETUP.md)** - Secret management configuration
- **[Operations Guide](./OPERATIONS_GUIDE.md)** - Day-to-day operations
- **[Troubleshooting Guide](./kubernetes/DEBUGGING_CRASHLOOPBACKOFF.md)** - Detailed troubleshooting
- **[Implementation Summary](./IMPLEMENTATION_SUMMARY.md)** - Details on all implemented next-step features
- **[Backup Verification](./operations/BACKUP_VERIFICATION.md)** - Backup and restore procedures

---

**Last Updated:** November 22, 2025  
**Maintained by:** Cloud Secrets Manager Team
