# Debugging CrashLoopBackOff Issues

## Quick Start

1. **Run local testing script:**
   ```bash
   ./scripts/test-local-deployment.sh
   ```

2. **Get pod logs:**
   ```bash
   ./scripts/get-pod-logs.sh cloud-secrets-manager secret-service
   ./scripts/get-pod-logs.sh cloud-secrets-manager audit-service
   ```

3. **Check pod status:**
   ```bash
   kubectl get pods -n cloud-secrets-manager
   kubectl describe pod <pod-name> -n cloud-secrets-manager
   ```

## Common Causes and Solutions

### 1. Missing Secrets

**Symptom:** Pod crashes immediately, logs show "Secret not found"

**Check:**
```bash
kubectl get secrets -n cloud-secrets-manager
kubectl get externalsecrets -n cloud-secrets-manager
```

**Solution:**
- Ensure ExternalSecrets are synced: `kubectl get externalsecrets -n cloud-secrets-manager -o yaml`
- Check ExternalSecrets status: Look for `status.synced` condition
- Manually trigger sync if needed

### 2. Database Connection Issues

**Symptom:** Logs show connection errors, "Connection refused", or timeout

**Check:**
```bash
# Check Cloud SQL Proxy is running
kubectl logs <pod-name> -n cloud-secrets-manager -c cloud-sql-proxy

# Check database credentials
kubectl get secret csm-db-secrets -n cloud-secrets-manager -o jsonpath='{.data}' | base64 -d
```

**Solution:**
- Verify Cloud SQL connection name is correct
- Check service account has `roles/cloudsql.client` role
- Verify database exists and user has permissions

### 3. Application Startup Errors

**Symptom:** Logs show Spring Boot errors, missing beans, or configuration issues

**Check:**
```bash
kubectl logs <pod-name> -n cloud-secrets-manager -c secret-service --previous
```

**Common issues:**
- JWT secret too short (must be 256 bits / 32 bytes)
- AES key format incorrect
- Missing required environment variables
- Database schema issues

### 4. Image Pull Errors

**Symptom:** Pod stuck in `ImagePullBackOff` or `ErrImagePull`

**Check:**
```bash
kubectl describe pod <pod-name> -n cloud-secrets-manager | grep -A 10 Events
```

**Solution:**
- Verify `artifact-registry-secret` exists
- Check service account has `roles/artifactregistry.reader`
- Verify image exists in Artifact Registry

### 5. Resource Constraints

**Symptom:** Pods pending, "Insufficient cpu" or "Insufficient memory"

**Check:**
```bash
kubectl top nodes
kubectl describe pod <pod-name> -n cloud-secrets-manager
```

**Solution:**
- Reduce resource requests in Helm values
- Scale cluster or add nodes
- Check cluster autoscaling

## Step-by-Step Debugging

### Step 1: Check Prerequisites

```bash
./scripts/test-local-deployment.sh
```

This checks:
- kubectl configuration
- Namespace exists
- ExternalSecrets configured
- Required secrets exist
- Service accounts exist
- Current pod status

### Step 2: Get Detailed Logs

```bash
# For secret-service
./scripts/get-pod-logs.sh cloud-secrets-manager secret-service

# For audit-service
./scripts/get-pod-logs.sh cloud-secrets-manager audit-service
```

### Step 3: Check Specific Issues

**Check if secrets are synced:**
```bash
kubectl get externalsecrets -n cloud-secrets-manager -o yaml | grep -A 5 status
```

**Check Cloud SQL Proxy:**
```bash
kubectl logs <pod-name> -n cloud-secrets-manager -c cloud-sql-proxy
```

**Check application logs:**
```bash
kubectl logs <pod-name> -n cloud-secrets-manager -c secret-service --previous
```

### Step 4: Verify Configuration

**Check environment variables:**
```bash
kubectl exec <pod-name> -n cloud-secrets-manager -c secret-service -- env | grep -E "(SPRING|JWT|AES|GOOGLE)"
```

**Check mounted secrets:**
```bash
kubectl exec <pod-name> -n cloud-secrets-manager -c secret-service -- ls -la /app/
kubectl exec <pod-name> -n cloud-secrets-manager -c secret-service -- cat /app/service-account.json | head -5
```

## Fixing Common Issues

### Issue: JWT Secret Too Short

**Error:** `WeakKeyException: The specified key byte array is 160 bits which is not secure enough`

**Fix:**
```bash
# Generate new 256-bit key
openssl rand -hex 32

# Update in Google Secret Manager
gcloud secrets versions add jwt-secret --data-file=- <<< "$(openssl rand -hex 32)"

# Restart ExternalSecret sync
kubectl delete externalsecret csm-app-config -n cloud-secrets-manager
kubectl apply -f infrastructure/kubernetes/k8s/external-secrets.yaml
```

### Issue: Database Connection Fails

**Error:** `Connection refused` or `password authentication failed`

**Fix:**
1. Verify Cloud SQL Proxy is running: `kubectl logs <pod> -c cloud-sql-proxy`
2. Check connection name matches: `gcloud sql instances describe secrets-manager-db-dev-3631da18 --format="value(connectionName)"`
3. Verify database user exists: `gcloud sql users list --instance=secrets-manager-db-dev-3631da18`
4. Check password in Secret Manager matches database

### Issue: Missing Service Account File

**Error:** `FileNotFoundException: /app/service-account.json`

**Fix:**
1. Verify secret exists: `kubectl get secret csm-google-service-account -n cloud-secrets-manager`
2. Check ExternalSecret is synced
3. Verify volume mount in deployment

## Testing After Fix

1. **Restart pods:**
   ```bash
   kubectl rollout restart deployment/secret-service -n cloud-secrets-manager
   kubectl rollout restart deployment/audit-service -n cloud-secrets-manager
   ```

2. **Monitor rollout:**
   ```bash
   kubectl rollout status deployment/secret-service -n cloud-secrets-manager
   kubectl rollout status deployment/audit-service -n cloud-secrets-manager
   ```

3. **Check logs:**
   ```bash
   kubectl logs -f -l app=secret-service -n cloud-secrets-manager -c secret-service
   ```

4. **Verify health:**
   ```bash
   kubectl get pods -n cloud-secrets-manager
   # Should show 2/2 Ready for both pods
   ```

## Getting Help

If issues persist:
1. Collect all logs: `./scripts/get-pod-logs.sh cloud-secrets-manager secret-service > debug.log`
2. Check events: `kubectl get events -n cloud-secrets-manager --sort-by='.lastTimestamp'`
3. Check Helm release: `helm status cloud-secrets-manager -n cloud-secrets-manager`

