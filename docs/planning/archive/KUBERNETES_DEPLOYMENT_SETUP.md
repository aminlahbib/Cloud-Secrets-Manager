# Kubernetes Deployment Setup

## ✅ Completed Steps

1. **Namespace Created**: `cloud-secrets-manager`
2. **Service Accounts Created**: `secret-service` and `audit-service` with Workload Identity annotations
3. **Docker Images Built & Pushed**: Both services pushed to Artifact Registry
4. **Database Credentials Secret**: `db-credentials` created with connection name and passwords

## 📋 Deployment Manifests Updated

### Changes Made:

1. **Service Accounts**: Both deployments now use `serviceAccountName` to leverage Workload Identity
2. **Cloud SQL Proxy**: Added as sidecar container in both deployments
3. **Database Connection**: Updated to use `localhost:5432` (via Cloud SQL Proxy)
4. **Secrets**: Using `db-credentials` secret we created
5. **Image Pull**: Removed `imagePullSecrets` (GKE nodes can pull from Artifact Registry via Workload Identity)

### Database Configuration:
- **Connection**: Via Cloud SQL Proxy sidecar on `localhost:5432`
- **Secret Service DB**: `secrets_db` database, user `secrets_db_user`
- **Audit Service DB**: `audit_db` database, user `audit_db_user`
- **Connection Name**: `cloud-secrets-manager:europe-west10:secrets-manager-db-dev-3631da18`

## ⚠️ Required Secrets

Before deploying, you need to create the `csm-app-config` secret with application configuration:

```bash
kubectl create secret generic csm-app-config \
  -n cloud-secrets-manager \
  --from-literal=JWT_SECRET="<generate-a-strong-random-secret>" \
  --from-literal=AES_KEY="<generate-a-32-byte-key>" \
  --from-literal=GOOGLE_PROJECT_ID="cloud-secrets-manager" \
  --from-literal=GOOGLE_API_KEY="<optional-google-api-key>"
```

**Generate secure keys:**
```bash
# Generate JWT Secret (64 characters)
openssl rand -hex 32

# Generate AES Key (32 bytes, base64 encoded)
openssl rand -base64 32
```

## 🚀 Deploy Applications

Once the `csm-app-config` secret is created:

```bash
# Deploy both services
kubectl apply -f infrastructure/kubernetes/k8s/secret-service-deployment.yaml
kubectl apply -f infrastructure/kubernetes/k8s/audit-service-deployment.yaml

# Or deploy all at once
kubectl apply -f infrastructure/kubernetes/k8s/
```

## ✅ Verify Deployment

```bash
# Check pods
kubectl get pods -n cloud-secrets-manager

# Check services
kubectl get services -n cloud-secrets-manager

# Check logs
kubectl logs -n cloud-secrets-manager -l app.kubernetes.io/name=secret-service -c secret-service
kubectl logs -n cloud-secrets-manager -l app.kubernetes.io/name=audit-service -c audit-service

# Check Cloud SQL Proxy logs
kubectl logs -n cloud-secrets-manager -l app.kubernetes.io/name=secret-service -c cloud-sql-proxy
kubectl logs -n cloud-secrets-manager -l app.kubernetes.io/name=audit-service -c cloud-sql-proxy
```

## 🔍 Troubleshooting

### Pods Not Starting
- Check if Cloud SQL Proxy is connecting: `kubectl logs <pod-name> -c cloud-sql-proxy`
- Verify service account has `roles/cloudsql.client` role
- Check database connection name in secret

### Database Connection Issues
- Verify `db-credentials` secret exists and has correct values
- Check Cloud SQL instance is running
- Verify service account IAM bindings

### Image Pull Issues
- Verify GKE nodes have `roles/artifactregistry.reader` role
- Check image name and tag are correct
- Verify Artifact Registry repository exists

### Workload Identity Issues
- Verify service account annotations: `kubectl describe sa secret-service -n cloud-secrets-manager`
- Check IAM bindings: `gcloud iam service-accounts get-iam-policy secret-service-dev@cloud-secrets-manager.iam.gserviceaccount.com`

