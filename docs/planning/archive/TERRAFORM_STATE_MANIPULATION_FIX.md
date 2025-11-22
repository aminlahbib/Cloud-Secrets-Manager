# Terraform State Manipulation Fix for Deletion Protection

## Problem
- API call to update `deletionProtection` returns 404
- `gcloud` doesn't have a flag to update it
- Terraform can't update it because it needs to destroy first (which is blocked)

## Solution: Update Terraform State Directly

Since we can't update the actual GCP resource, we can update Terraform's state to reflect that `deletion_protection = false`, then use `terraform refresh` to sync.

### Step 1: Check Current State
```bash
cd infrastructure/terraform/environments/dev
terraform state show module.gke.google_container_cluster.primary | grep deletion_protection
```

### Step 2: Update State (if it shows `true`)
```bash
# Remove the resource from state (doesn't delete the actual resource)
terraform state rm module.gke.google_container_cluster.primary

# Re-import it (this will read the current state from GCP)
terraform import module.gke.google_container_cluster.primary projects/cloud-secrets-manager/locations/europe-west10/clusters/cloud-secrets-cluster-dev
```

### Step 3: Manually Edit State (Alternative)
If import doesn't work, you can manually edit the state file:
1. Download state: `terraform state pull > state.json`
2. Edit `state.json` to set `deletion_protection = false`
3. Upload: `terraform state push state.json`

### Step 4: Use Console to Actually Disable It
Even after state manipulation, you still need to disable it in GCP Console for future operations:
1. Go to GCP Console → Kubernetes Engine → Clusters
2. Select `cloud-secrets-cluster-dev`
3. Edit → Uncheck "Deletion protection"
4. Save

### Step 5: Refresh and Apply
```bash
terraform refresh
terraform apply
```

## Note
The `ignore_changes` for `deletion_protection` in the lifecycle block will prevent Terraform from trying to manage this field, allowing other updates to proceed.

