# Kubernetes Alerts Analysis

**Date:** November 22, 2025

## Alert Summary

Total alerts: 11

---

## Critical Issues (Need Attention)

### 1. Service Account Errors (2 alerts) ⚠️ **FIXED IN CODE**

**Alerts:**
- `Error creating: pods "audit-service-796dc567ff-" is forbidden: error looking up service account cloud-secrets-manager/csm-service-account: serviceaccount "csm-service-account" not found`
- `Error creating: pods "secret-service-56d4788c6-" is forbidden: error looking up service account cloud-secrets-manager/csm-google-service-account: serviceaccount "csm-google-service-account" not found`

**Root Cause:**
- Old Helm deployments or manual deployments were trying to use service account names that don't exist:
  - `csm-service-account` (doesn't exist)
  - `csm-google-service-account` (doesn't exist - this is a secret name, not a service account)

**Actual Service Accounts:**
- `secret-service` (bound to `secret-service-dev@...`)
- `audit-service` (bound to `audit-service-dev@...`)

**Status:** ✅ **FIXED**
- Updated Helm templates to use correct service account names
- Updated manual deployment manifests
- Old pods with wrong service accounts will fail, but new deployments use correct names

**Action Required:**
- Clean up old failed pods/replicasets
- Verify new deployments use correct service accounts

---

## Infrastructure Issues (Not Code Bugs)

### 2. GCP Quota Exceeded (1 alert) ⚠️ **INFRASTRUCTURE**

**Alert:**
- `Failed adding 1 nodes to group ... due to OutOfResource.QUOTA_EXCEEDED; source errors: Instance 'gke-cloud-secrets-cl-cloud-secrets-cl-8c72b86d-2c5b' creation failed: Quota 'IN_USE_ADDRESSES' exceeded. Limit: 8.0 in region europe-west10.`

**Root Cause:**
- GCP project has reached the quota limit for IP addresses in the region
- Limit: 8 IP addresses
- Cluster autoscaler tried to add a node but couldn't get an IP address

**Impact:**
- Cluster cannot scale up automatically
- New nodes cannot be created

**Resolution Options:**
1. **Request quota increase** (recommended for production):
   ```bash
   gcloud compute project-info describe --project=cloud-secrets-manager
   # Request increase via GCP Console: IAM & Admin > Quotas
   ```

2. **Reduce resource usage:**
   - Delete unused resources (old clusters, load balancers, etc.)
   - Reduce node pool size
   - Use smaller node instances

**Status:** ⚠️ **MONITOR** - Not a code bug, but may affect scaling

---

### 3. Invalid Image Filesystem Capacity (3 alerts) ℹ️ **INFORMATIONAL**

**Alerts:**
- Multiple nodes showing: `invalid capacity 0 on image filesystem`
- Nodes: `gke-cloud-secrets-cl-cloud-secrets-cl-703b3fb9-44h7`, `gke-cloud-secrets-cl-cloud-secrets-cl-703b3fb9-4v27`, `gke-cloud-secrets-cl-cloud-secrets-cl-703b3fb9-k5rk`

**Root Cause:**
- GKE node image filesystem metrics reporting issue
- Common in GKE clusters, usually harmless
- Related to container image storage metrics

**Impact:**
- No functional impact
- May affect monitoring/alerting if you have filesystem-based alerts

**Resolution:**
- Usually resolves itself on node restart
- Can be ignored unless causing actual issues
- If persistent, consider node pool recreation

**Status:** ℹ️ **INFORMATIONAL** - Can be ignored

---

## Informational Events (Not Errors)

### 4. Node Registration Events (5 alerts) ✅ **NORMAL**

**Events:**
- `** Starting Node Registration Checker **`
- `** Node ready and registered. **`

**Root Cause:**
- Normal GKE node lifecycle events
- Nodes starting up and registering with the cluster

**Impact:**
- None - these are expected events

**Status:** ✅ **NORMAL** - No action needed

---

## Summary

| Alert Type | Count | Severity | Status | Action Required |
|------------|-------|----------|--------|-----------------|
| Service Account Errors | 2 | High | ✅ Fixed | Clean up old pods |
| Quota Exceeded | 1 | Medium | ⚠️ Monitor | Request quota increase |
| Filesystem Warnings | 3 | Low | ℹ️ Info | Ignore |
| Node Events | 5 | None | ✅ Normal | None |

---

## Recommended Actions

### Immediate (Code-related)
1. ✅ **Service Account Fix** - Already fixed in code
   - Clean up old failed pods:
     ```bash
     kubectl delete pod -l app=secret-service -n cloud-secrets-manager --field-selector=status.phase!=Running
     kubectl delete pod -l app=audit-service -n cloud-secrets-manager --field-selector=status.phase!=Running
     ```

### Short-term (Infrastructure)
2. ⚠️ **Quota Management**
   - Review and clean up unused GCP resources
   - Request quota increase if needed for production
   - Monitor cluster scaling behavior

### Long-term (Monitoring)
3. ℹ️ **Filesystem Warnings**
   - Monitor if they persist
   - Consider node pool recreation if they cause issues
   - Can be safely ignored for now

---

## Verification Commands

```bash
# Check service accounts
kubectl get serviceaccounts -n cloud-secrets-manager

# Check current deployments
kubectl get deployments -n cloud-secrets-manager -o yaml | grep serviceAccountName

# Check for failed pods
kubectl get pods -n cloud-secrets-manager --field-selector=status.phase!=Running

# Check GCP quotas
gcloud compute project-info describe --project=cloud-secrets-manager | grep -A 5 "quotas"
```

---

**Analysis Date:** November 22, 2025  
**Analyst:** Cloud Secrets Manager Team

