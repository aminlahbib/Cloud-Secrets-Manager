# Terraform Deletion Protection Fix

## Problem
Terraform is trying to destroy and recreate the GKE cluster, but it's blocked because `deletion_protection` is set to `true` in the Terraform state (even though the config has it set to `false`).

## Root Cause
When Terraform needs to recreate a resource (due to immutable field changes), it:
1. First tries to destroy the existing resource
2. Then creates a new one

If `deletion_protection = true` in the state, the destroy step fails, even if the config says `false`.

## Solution Options

### Option 1: Targeted Apply (Recommended)
Update `deletion_protection` first, then do full apply:

```bash
# Step 1: Update only deletion_protection
terraform apply -target=module.gke.google_container_cluster.primary

# Step 2: Full apply
terraform apply
```

### Option 2: Manual State Update
Manually update the Terraform state to set `deletion_protection = false`:

```bash
terraform state show module.gke.google_container_cluster.primary | grep deletion_protection

# If it shows true, update it:
terraform state rm module.gke.google_container_cluster.primary
terraform import module.gke.google_container_cluster.primary projects/cloud-secrets-manager/locations/europe-west10/clusters/cloud-secrets-cluster-dev
```

### Option 3: Temporary Ignore Changes
Temporarily add `deletion_protection` to `ignore_changes`, apply other changes, then remove it:

```hcl
lifecycle {
  ignore_changes = [
    node_pool,
    ip_allocation_policy,
    deletion_protection,  # Temporary
  ]
}
```

Then after apply, remove it from ignore_changes and apply again.

## Current Configuration
- Module: `deletion_protection = var.deletion_protection` ✓
- Dev Environment: `deletion_protection = false` ✓
- Lifecycle: `ip_allocation_policy` in `ignore_changes` ✓

## Next Steps
1. Remove duplicate `deletion_protection` from dev/main.tf (if present)
2. Run `terraform apply -target=module.gke.google_container_cluster.primary` to update deletion_protection
3. Run full `terraform apply`

