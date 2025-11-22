# Terraform Plan Review

## Overview
This document reviews the Terraform plan for the Cloud Secrets Manager infrastructure. The focus is on modularity, security, and maintainability.

## Infrastructure Components

### 1. GKE Cluster (Module)
- **Type**: Regional/Zonal cluster (configurable).
- **Networking**: VPC-native with separate subnets for pods and services.
- **Security**:
  - Workload Identity enabled (critical for secure GCP access).
  - Private nodes supported (optional for dev, recommended for prod).
  - Shielded nodes enabled.
  - Network policy enabled (Calico).

### 2. Artifact Registry (Module)
- **Repository**: Docker format.
- **Lifecycle**: Cleanup policies implemented to manage storage costs (keep last N versions).
- **Security**: Vulnerability scanning enabled by default in GCP.

### 3. PostgreSQL (Module)
- **Cloud SQL**: Managed PostgreSQL instance.
- **Database Separation**: Separate databases for `secrets_db` and `audit_db` within the same instance for cost efficiency in Dev.
- **Security**: Private IP access (needs VPC peering/PSA).

### 4. IAM (Module)
- **Service Accounts**: Dedicated SAs for `secret-service` and `audit-service`.
- **Least Privilege**: Roles scoped to specific needs (e.g., `secretmanager.secretAccessor`, `cloudsql.client`).
- **Workload Identity**: Bindings between K8s SAs and GCP SAs.

## Environment Strategy
- **Dev**: Minimal resources (`e2-medium`, 1 node), public endpoint for ease of access, `deletion_protection` disabled.
- **Prod**: (Planned) High availability, private endpoints, `deletion_protection` enabled.

## Recommendations
1. **State Management**: Ensure GCS backend is configured for state locking.
2. **Secrets**: Do not commit sensitive values. Use Secret Manager or environment variables.
3. **CI/CD**: Automate `terraform plan` and `terraform apply` in the pipeline.

