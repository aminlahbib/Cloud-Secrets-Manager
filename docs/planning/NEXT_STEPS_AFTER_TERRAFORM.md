# Next Steps After Terraform Deployment

## ✅ Infrastructure Deployed Successfully

Your Terraform deployment completed successfully! Here's what was created:

- **GKE Cluster**: `cloud-secrets-cluster-dev` (running in `europe-west10`)
- **PostgreSQL Database**: `secrets-manager-db-dev-3631da18`
- **Artifact Registry**: `docker-images` repository
- **Service Accounts**: `secret-service-dev` and `audit-service-dev` with proper IAM roles
- **Workload Identity**: Bindings configured for both services

## Step 1: Configure kubectl

Connect to your GKE cluster:

```bash
gcloud container clusters get-credentials cloud-secrets-cluster-dev \
  --region europe-west10 \
  --project cloud-secrets-manager
```

Verify connection:
```bash
kubectl cluster-info
kubectl get nodes
```

## Step 2: Configure Docker for Artifact Registry

Authenticate Docker to push/pull images:

```bash
gcloud auth configure-docker europe-west10-docker.pkg.dev
```

## Step 3: Create Kubernetes Namespace and Service Accounts

Create the namespace and Kubernetes service accounts that will use Workload Identity:

```bash
# Create namespace
kubectl create namespace cloud-secrets-manager

# Create Kubernetes service accounts (they will be bound to GCP service accounts via Workload Identity)
kubectl create serviceaccount secret-service -n cloud-secrets-manager
kubectl create serviceaccount audit-service -n cloud-secrets-manager

# Annotate them for Workload Identity
kubectl annotate serviceaccount secret-service \
  -n cloud-secrets-manager \
  iam.gke.io/gcp-service-account=secret-service-dev@cloud-secrets-manager.iam.gserviceaccount.com

kubectl annotate serviceaccount audit-service \
  -n cloud-secrets-manager \
  iam.gke.io/gcp-service-account=audit-service-dev@cloud-secrets-manager.iam.gserviceaccount.com
```

## Step 4: Build and Push Docker Images

Build your application images and push them to Artifact Registry:

```bash
# From your project root
cd apps/backend/secret-service
docker build -t europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images/secret-service:latest .
docker push europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images/secret-service:latest

cd ../audit-service
docker build -t europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images/audit-service:latest .
docker push europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images/audit-service:latest
```

## Step 5: Get Database Credentials

Retrieve database passwords from Secret Manager:

```bash
# Get secrets_db password
gcloud secrets versions access latest \
  --secret="secrets-manager-db-dev-secrets_db-password"

# Get audit_db password
gcloud secrets versions access latest \
  --secret="secrets-manager-db-dev-audit_db-password"
```

## Step 6: Create Kubernetes Secrets

Store database connection details as Kubernetes secrets:

```bash
# Get the connection name
DB_CONNECTION="cloud-secrets-manager:europe-west10:secrets-manager-db-dev-3631da18"

# Create secrets (you'll need to replace PASSWORD with actual values from Step 5)
kubectl create secret generic db-credentials \
  -n cloud-secrets-manager \
  --from-literal=connection-name="$DB_CONNECTION" \
  --from-literal=secrets-db-password="<PASSWORD_FROM_SECRET_MANAGER>" \
  --from-literal=audit-db-password="<PASSWORD_FROM_SECRET_MANAGER>"
```

## Step 7: Deploy Applications

Create Kubernetes deployment manifests or use Helm charts. Example structure:

```yaml
# Example: apps/backend/secret-service/k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: secret-service
  namespace: cloud-secrets-manager
spec:
  replicas: 2
  selector:
    matchLabels:
      app: secret-service
  template:
    metadata:
      labels:
        app: secret-service
    spec:
      serviceAccountName: secret-service
      containers:
      - name: secret-service
        image: europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images/secret-service:latest
        env:
        - name: DB_CONNECTION_NAME
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: connection-name
        # ... other env vars
```

## Step 8: Set Up Cloud SQL Proxy (if needed)

If your applications need to connect via Cloud SQL Proxy:

```bash
# Install Cloud SQL Proxy
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.darwin.arm64
chmod +x cloud-sql-proxy

# Test connection (for local development)
./cloud-sql-proxy cloud-secrets-manager:europe-west10:secrets-manager-db-dev-3631da18
```

For production, use the Cloud SQL Auth Proxy sidecar in your Kubernetes deployments.

## Step 9: Verify Deployment

Check that everything is running:

```bash
# Check pods
kubectl get pods -n cloud-secrets-manager

# Check services
kubectl get services -n cloud-secrets-manager

# Check logs
kubectl logs -n cloud-secrets-manager -l app=secret-service
kubectl logs -n cloud-secrets-manager -l app=audit-service
```

## Step 10: Set Up Ingress (Optional)

If you have an ingress configuration, apply it:

```bash
kubectl apply -f infrastructure/kubernetes/k8s/ingress.yaml
```

## Troubleshooting

### Workload Identity Issues
If pods can't authenticate, verify:
```bash
kubectl describe serviceaccount secret-service -n cloud-secrets-manager
kubectl describe serviceaccount audit-service -n cloud-secrets-manager
```

### Database Connection Issues
- Verify Cloud SQL instance is running
- Check service account has `roles/cloudsql.client` role
- Verify connection name format

### Image Pull Issues
- Ensure Docker is authenticated: `gcloud auth configure-docker europe-west10-docker.pkg.dev`
- Verify service account has `roles/artifactregistry.reader` role

## Quick Reference

**Cluster Info:**
- Name: `cloud-secrets-cluster-dev`
- Region: `europe-west10`
- Project: `cloud-secrets-manager`

**Database:**
- Instance: `secrets-manager-db-dev-3631da18`
- Connection: `cloud-secrets-manager:europe-west10:secrets-manager-db-dev-3631da18`

**Artifact Registry:**
- URL: `europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images`

**Service Accounts:**
- Secret Service: `secret-service-dev@cloud-secrets-manager.iam.gserviceaccount.com`
- Audit Service: `audit-service-dev@cloud-secrets-manager.iam.gserviceaccount.com`

