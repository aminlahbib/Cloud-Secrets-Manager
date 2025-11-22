# Manual Deletion Protection Fix

## Problem
Terraform cannot update `deletion_protection` because it's trying to destroy and recreate the cluster, but the destroy is blocked by `deletion_protection = true` in the actual GCP resource.

## Root Cause
The plan shows multiple changes forcing cluster recreation:
- `master_ipv4_cidr_block` being added (line 342: forces replacement)
- Network/subnetwork format differences
- `deletion_protection` change from `true` to `false`

Terraform tries to destroy first, but GCP blocks it because `deletion_protection = true`.

## Solution: Manual Update Required

Since `gcloud` doesn't support updating `deletion_protection` directly, you must disable it manually in the GCP Console:

### Steps:
1. Go to [GCP Console - Kubernetes Engine](https://console.cloud.google.com/kubernetes/clusters)
2. Select project: `cloud-secrets-manager`
3. Click on cluster: `cloud-secrets-cluster-dev`
4. Click **EDIT**
5. Scroll to **Security** section
6. Find **Deletion protection** and **UNCHECK** it
7. Click **SAVE**

### Alternative: Use GCP API directly

```bash
PROJECT_ID="cloud-secrets-manager"
CLUSTER_NAME="cloud-secrets-cluster-dev"
REGION="europe-west10"

curl -X PATCH \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  -d '{"deletionProtection": false}' \
  "https://container.googleapis.com/v1/projects/${PROJECT_ID}/locations/${REGION}/clusters/${CLUSTER_NAME}?updateMask=deletionProtection"
```

### After Manual Update:
1. Run `terraform refresh` to sync state
2. Run `terraform apply` - it should now proceed

## Temporary Workaround
I've added `deletion_protection` to `ignore_changes` in the lifecycle block. This allows Terraform to proceed with other updates, but you'll still need to manually disable it in GCP Console for future operations.

