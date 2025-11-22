# Cloud SQL Migration - Complete Analysis & Fixes

## Summary

This document summarizes the complete migration from local PostgreSQL containers to Google Cloud SQL and all fixes applied.

## Changes Made

### 1. Deleted Old Local Database Deployments

**Files Removed:**
- `infrastructure/kubernetes/k8s/secrets-db-deployment.yaml` - Local PostgreSQL container for secrets DB
- `infrastructure/kubernetes/k8s/audit-db-deployment.yaml` - Local PostgreSQL container for audit DB

**Reason:** These were creating local PostgreSQL pods in Kubernetes. We now use Google Cloud SQL (managed service).

### 2. Fixed Service Deployments

**Files Updated:**
- `infrastructure/kubernetes/k8s/secret-service-deployment.yaml`
- `infrastructure/kubernetes/k8s/audit-service-deployment.yaml`

**Fixes Applied:**
- Changed secret name from `db-credentials` to `csm-db-secrets` (matches External Secrets)
- Changed usernames to use secrets instead of hardcoded values
- Fixed database names: `secrets_db` → `secrets`, `audit_db` → `audit`
- Added `?sslmode=disable` to JDBC URLs (Cloud SQL Proxy handles encryption)
- Changed `localhost` to `127.0.0.1` (more explicit)
- Updated Cloud SQL Proxy args to use `--structured-logs` instead of `--address=0.0.0.0`
- Fixed service name reference: `csm-audit-service` → `audit-service`

### 3. Updated Terraform Configuration

**Files Updated:**
- `infrastructure/terraform/environments/dev/main.tf`
  - Changed database names: `["secrets_db", "audit_db"]` → `["secrets", "audit"]`
  - This matches what the application expects

- `infrastructure/terraform/modules/postgresql/main.tf`
  - Added automatic creation of username secrets in Google Secret Manager
  - Now creates: `secrets-manager-db-dev-{db_name}-user` secrets
  - Username format: `{db_name}_user` (e.g., `secrets_user`, `audit_user`)

**Secret Names Created by Terraform:**
- `secrets-manager-db-dev-secrets-user` → `secrets_user`
- `secrets-manager-db-dev-secrets-password` → (random 32-char password)
- `secrets-manager-db-dev-audit-user` → `audit_user`
- `secrets-manager-db-dev-audit-password` → (random 32-char password)

### 4. Updated External Secrets Configuration

**File Updated:**
- `infrastructure/kubernetes/k8s/external-secrets.yaml`

**Changes:**
- Updated to reference Terraform-created secrets:
  - `secrets-manager-db-dev-secrets-user`
  - `secrets-manager-db-dev-secrets-password`
  - `secrets-manager-db-dev-audit-user`
  - `secrets-manager-db-dev-audit-password`

### 5. Updated Helm Chart

**Files Updated:**
- `infrastructure/helm/cloud-secrets-manager/values.yaml`
  - Updated usernames: `secret_user` → `secrets_user`, `audit_user` → `audit_user` (already correct)
  - Added comments explaining username format matches Terraform
  - Database names already correct: `secrets`, `audit`

- `infrastructure/helm/cloud-secrets-manager/templates/databases.yaml`
  - Already wrapped in `{{- if .Values.postgres.enabled -}}` block
  - `postgres.enabled: false` in values.yaml (correct)

### 6. Deprecated Old Static Secrets

**File Updated:**
- `infrastructure/kubernetes/k8s/k8s-secrets.yaml`
  - Added deprecation notice
  - Commented out all secret definitions
  - Added note to use External Secrets Operator instead

### 7. Updated Documentation

**Files Updated:**
- `infrastructure/kubernetes/README.md`
  - Removed references to local DB deployments
  - Added Cloud SQL architecture explanation
  - Updated usage instructions for ESO

- `deployment/scripts/setup-kubernetes-secrets.sh`
  - Added deprecation warning
  - Noted that ESO should be used for production

## Architecture Overview

### Before (Local PostgreSQL)
```
Kubernetes Pods:
  - secrets-db (PostgreSQL container)
  - audit-db (PostgreSQL container)
  - secret-service → connects to secrets-db:5432
  - audit-service → connects to audit-db:5432
```

### After (Cloud SQL)
```
Google Cloud SQL:
  - secrets-manager-db-dev (PostgreSQL instance)
    - Database: secrets
    - Database: audit
    - User: secrets_user
    - User: audit_user

Kubernetes Pods:
  - secret-service
    - Container: secret-service (app)
    - Container: cloud-sql-proxy (sidecar) → connects to Cloud SQL
    - App connects to: 127.0.0.1:5432 (via proxy)
  - audit-service
    - Container: audit-service (app)
    - Container: cloud-sql-proxy (sidecar) → connects to Cloud SQL
    - App connects to: 127.0.0.1:5432 (via proxy)
```

## Secret Management Flow

1. **Terraform** creates:
   - Cloud SQL instance and databases
   - Database users with random passwords
   - Google Secret Manager secrets for passwords and usernames

2. **External Secrets Operator** (installed via Terraform):
   - Watches `ExternalSecret` resources
   - Syncs secrets from Google Secret Manager to Kubernetes Secrets
   - Updates Kubernetes Secrets when GCP secrets change

3. **Application Pods**:
   - Mount secrets as environment variables
   - Connect to Cloud SQL via proxy sidecar

## Next Steps

### 1. Apply Terraform Changes

If you haven't already, you need to:
1. Apply Terraform to create the username secrets:
   ```bash
   cd infrastructure/terraform/environments/dev
   terraform apply
   ```

2. This will create:
   - New username secrets in Google Secret Manager
   - Update database names (if databases need to be recreated)

**Note:** If databases `secrets_db` and `audit_db` already exist in Cloud SQL, you may need to:
- Option A: Recreate them with correct names (`secrets`, `audit`)
- Option B: Update Terraform to use the existing names (not recommended)

### 2. Update External Secrets

The `external-secrets.yaml` has been updated to reference the new secret names. Apply it:

```bash
kubectl apply -f infrastructure/kubernetes/k8s/external-secrets.yaml
```

### 3. Verify Secret Sync

```bash
kubectl get externalsecrets -n cloud-secrets-manager
kubectl get secrets -n cloud-secrets-manager
```

All should show `SecretSynced` status.

### 4. Restart Deployments

Restart the deployments to pick up the new secret values:

```bash
kubectl rollout restart deployment/secret-service -n cloud-secrets-manager
kubectl rollout restart deployment/audit-service -n cloud-secrets-manager
```

## Verification Checklist

- [ ] Terraform applied (creates username secrets)
- [ ] External Secrets synced (check `kubectl get externalsecrets`)
- [ ] Kubernetes secrets exist (check `kubectl get secrets`)
- [ ] Pods using correct service accounts (`secret-service`, `audit-service`)
- [ ] Cloud SQL Proxy logs show successful connection
- [ ] Application logs show successful database connection
- [ ] No references to old local DB deployments
- [ ] No references to old secret names (`db-credentials`)

## Files Changed Summary

**Deleted:**
- `infrastructure/kubernetes/k8s/secrets-db-deployment.yaml`
- `infrastructure/kubernetes/k8s/audit-db-deployment.yaml`

**Updated:**
- `infrastructure/kubernetes/k8s/secret-service-deployment.yaml`
- `infrastructure/kubernetes/k8s/audit-service-deployment.yaml`
- `infrastructure/kubernetes/k8s/external-secrets.yaml`
- `infrastructure/kubernetes/k8s/k8s-secrets.yaml` (deprecated)
- `infrastructure/kubernetes/README.md`
- `infrastructure/helm/cloud-secrets-manager/values.yaml`
- `infrastructure/terraform/environments/dev/main.tf`
- `infrastructure/terraform/modules/postgresql/main.tf`
- `deployment/scripts/setup-kubernetes-secrets.sh`

**Unchanged (Correct):**
- `infrastructure/helm/cloud-secrets-manager/templates/databases.yaml` (wrapped in conditional)
- `infrastructure/docker/docker-compose.yml` (for local dev only)

