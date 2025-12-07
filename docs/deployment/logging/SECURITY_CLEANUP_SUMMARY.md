# Security Cleanup Summary

**Date:** December 5, 2025  
**Action:** Removed sensitive credentials from repository and git history

---

## What Was Done

### 1. Files Removed from Repository

The following sensitive files were permanently removed from both the working directory and git history:

1. `infrastructure/gcp/keys/firebase-admin-key.json`
   - Firebase Admin SDK service account key
   - Contains private key for Firebase authentication

2. `apps/backend/secret-service/src/main/resources/service-account.json`
   - GCP service account key
   - Used for backend service authentication

3. `apps/backend/secret-service/infrastructure/gcp/keys/firebase-admin-key.json`
   - Duplicate Firebase Admin SDK key
   - Same credentials as #1

### 2. Git History Cleaned

Used `git-filter-repo` to remove all traces of these files from the entire git history:
- **Commits affected:** 459 commits scanned
- **Tool used:** git-filter-repo v2.38+
- **Backup created:** `../Cloud-Secrets-Manager-backup.git`

### 3. .gitignore Updated

Enhanced `.gitignore` with comprehensive patterns to prevent future credential commits:

```gitignore
# GCP Service Account Keys (NEVER COMMIT!)
service-account.json
**/service-account.json
firebase-admin-key.json
**/firebase-admin-key.json
**/*-admin-key.json
infrastructure/gcp/keys/
infrastructure/gcp/keys/*.json

# Environment Variables & Secrets
.env
.env.local
.env.*.local
docker/.env
docker/.env.local
```

---

## Next Steps (IMPORTANT!)

### ⚠️ Before Force Pushing

**WARNING:** Force pushing will rewrite history on GitHub. This is a destructive operation.

**Coordination Required:**
- If other developers have clones of this repository, they will need to re-clone
- Any open pull requests will need to be recreated
- Forks will be out of sync

### Force Push Command

```bash
# Push all branches
git push origin --force --all

# Push all tags
git push origin --force --tags
```

### After Force Push

1. **Revoke Old Credentials**
   - Go to GCP Console → IAM & Admin → Service Accounts
   - Delete or disable the compromised service accounts:
     - `firebase-adminsdk-fbsvc@cloud-secrets-manager.iam.gserviceaccount.com`
     - `secrets-manager-backend@cloud-secrets-manager.iam.gserviceaccount.com`
   - Create new service accounts with fresh keys

2. **Update Local Development**
   - Use `gcloud auth application-default login` for local development
   - Never download service account keys again

3. **Update GKE Deployment**
   - Use Workload Identity instead of service account keys
   - Configure in Helm values:
     ```yaml
     serviceAccount:
       annotations:
         iam.gke.io/gcp-service-account: "secret-service-dev@cloud-secrets-manager.iam.gserviceaccount.com"
     ```

4. **Verify Cleanup**
   ```bash
   # Scan for any remaining secrets
   git log --all --full-history -S "private_key"
   
   # Should return no results
   ```

---

## Alternative: Using Workload Identity (Recommended)

Instead of service account keys, use Workload Identity for GKE:

### Setup Steps:

1. **Create GCP Service Account**
   ```bash
   gcloud iam service-accounts create secret-service-dev \
     --display-name="Secret Service Dev"
   ```

2. **Grant Permissions**
   ```bash
   gcloud projects add-iam-policy-binding cloud-secrets-manager \
     --member="serviceAccount:secret-service-dev@cloud-secrets-manager.iam.gserviceaccount.com" \
     --role="roles/firebase.admin"
   ```

3. **Bind to Kubernetes Service Account**
   ```bash
   gcloud iam service-accounts add-iam-policy-binding \
     secret-service-dev@cloud-secrets-manager.iam.gserviceaccount.com \
     --role roles/iam.workloadIdentityUser \
     --member "serviceAccount:cloud-secrets-manager.svc.id.goog[cloud-secrets-manager/secret-service]"
   ```

4. **Annotate Kubernetes Service Account**
   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: secret-service
     namespace: cloud-secrets-manager
     annotations:
       iam.gke.io/gcp-service-account: secret-service-dev@cloud-secrets-manager.iam.gserviceaccount.com
   ```

5. **Update Deployment**
   - Remove volume mounts for service account keys
   - Remove `GOOGLE_SERVICE_ACCOUNT_PATH` environment variable
   - Application will automatically use Workload Identity

---

## Local Development Without Service Account Keys

### Option 1: Use Application Default Credentials

```bash
# Authenticate with your user account
gcloud auth application-default login

# Your application will automatically use these credentials
```

### Option 2: Use gcloud CLI

```bash
# Set project
gcloud config set project cloud-secrets-manager

# Authenticate
gcloud auth login

# Application uses gcloud credentials
```

### Update docker-compose.yml

```yaml
backend:
  environment:
    # Remove this line:
    # GOOGLE_SERVICE_ACCOUNT_PATH: /app/firebase-admin-key.json
    
    # Add this instead:
    GOOGLE_APPLICATION_CREDENTIALS: ""  # Empty = use ADC
  
  # Remove this volume mount:
  # volumes:
  #   - ../infrastructure/gcp/keys/firebase-admin-key.json:/app/firebase-admin-key.json:ro
```

---

## Verification Checklist

After completing all steps:

- [ ] Force pushed to GitHub
- [ ] Verified no secrets in git history: `git log --all -S "private_key"`
- [ ] Revoked old service account keys in GCP Console
- [ ] Created new service accounts (if needed)
- [ ] Updated GKE deployments to use Workload Identity
- [ ] Updated local development to use ADC
- [ ] Tested application still works
- [ ] Updated documentation
- [ ] Notified team members (if applicable)

---

## Rollback Plan

If something goes wrong:

1. **Restore from backup:**
   ```bash
   cd ..
   rm -rf "Cloud Secrets Manager"
   git clone Cloud-Secrets-Manager-backup.git "Cloud Secrets Manager"
   cd "Cloud Secrets Manager"
   git remote set-url origin git@github.com:aminlahbib/Cloud-Secrets-Manager.git
   ```

2. **Re-apply changes carefully**

---

## References

- [git-filter-repo Documentation](https://github.com/newren/git-filter-repo)
- [GCP Workload Identity](https://cloud.google.com/kubernetes-engine/docs/how-to/workload-identity)
- [Application Default Credentials](https://cloud.google.com/docs/authentication/application-default-credentials)
- [Firebase Admin SDK Authentication](https://firebase.google.com/docs/admin/setup#initialize-sdk)

---

**Status:** ✅ Git history cleaned, ready for force push  
**Next Action:** Review this document, then execute force push
