# GKE Fixes Applied

## Recent Changes

### 1. Release Channel Configuration
- **Change**: Added `release_channel` variable and configuration block in `google_container_cluster`.
- **Reason**: To allow selecting different upgrade stability tracks for Dev (REGULAR) vs Prod (STABLE).
- **Code**:
  ```hcl
  release_channel {
    channel = var.release_channel
  }
  ```

### 2. Deletion Protection
- **Change**: Added `deletion_protection` variable.
- **Reason**: Terraform 5.0+ defaults this to true/false depending on context, but explicit control is needed to prevent accidental production deletions while allowing easy dev teardowns.
- **Code**:
  ```hcl
  deletion_protection = var.deletion_protection
  ```

### 3. Variable Validation
- **Change**: Added validation block to `release_channel` variable.
- **Reason**: To fail early if an invalid channel name is provided.
- **Code**:
  ```hcl
  validation {
    condition     = contains(["RAPID", "REGULAR", "STABLE", "UNSPECIFIED"], var.release_channel)
    error_message = "Release channel must be one of: RAPID, REGULAR, STABLE, UNSPECIFIED."
  }
  ```

### 4. Output Enhancements
- **Change**: (If applicable) Verified outputs include endpoint and CA certificate for provider configuration.

