# Terraform Critical Fixes

## Summary
This document tracks critical fixes applied to the Terraform configuration during the review process.

## Fixes Applied

### 1. GKE Module: Missing Variables
- **Issue**: The GKE module was hardcoding some values or missing configuration options needed for flexible deployment across environments.
- **Fix**: Added variables for `release_channel` and `deletion_protection`.
- **Impact**: Allows "REGULAR" channel for Dev and "STABLE" for Prod. Prevents accidental deletion of production clusters.

### 2. Artifact Registry: Storage Costs
- **Issue**: Artifact Registry can grow indefinitely, increasing costs.
- **Fix**: Implemented `cleanup_policies` in the Artifact Registry module.
- **Impact**: Automatically deletes old images, keeping only the most recent 5 versions (configurable).

### 3. Dev Environment Configuration
- **Issue**: Dev environment settings were not explicitly defined for all new variables.
- **Fix**: Updated `environments/dev/main.tf` to set:
  - `release_channel = "REGULAR"`
  - `deletion_protection = false`
  - `cleanup_keep_count = 5`
- **Impact**: Dev environment is cost-effective and easy to tear down/rebuild.

### 4. Network Policy
- **Issue**: Network policy was optional or not explicitly controlled.
- **Fix**: Ensured `enable_network_policy` is available and set to `true` by default (or explicitly in Dev).
- **Impact**: Enhances security by allowing control over pod-to-pod communication.

