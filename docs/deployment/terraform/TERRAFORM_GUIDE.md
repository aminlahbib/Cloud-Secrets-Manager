# Terraform Infrastructure Guide

Complete guide to managing Cloud Secrets Manager infrastructure with Terraform.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Initial Setup](#initial-setup)
4. [Deploying Infrastructure](#deploying-infrastructure)
5. [Managing State](#managing-state)
6. [Importing Existing Resources](#importing-existing-resources)
7. [Daily Operations](#daily-operations)
8. [Troubleshooting](#troubleshooting)

---

## Overview

This Terraform infrastructure manages:
- **Artifact Registry** - Docker image storage
- **Google Kubernetes Engine (GKE)** - Container orchestration
- **Cloud SQL PostgreSQL** - Databases (secrets_db, audit_db)
- **IAM** - Service accounts and Workload Identity
- **Secret Manager** - Database password storage

### Architecture

```
GCP Project
├── Artifact Registry (europe-west10)
│   └── docker-images repository
├── GKE Cluster (europe-west10)
│   ├── Node Pool (1-5 nodes, e2-medium)
│   └── Workload Identity enabled
├── Cloud SQL PostgreSQL 16
│   ├── secrets_db
│   └── audit_db
└── Service Accounts
    ├── secret-service (with Cloud SQL client role)
    └── audit-service (with Cloud SQL client role)
```

---

## Prerequisites

### Required Tools

```bash
# Terraform (>= 1.5)
brew install terraform
terraform version

# Google Cloud SDK
brew install google-cloud-sdk
gcloud version

# (Optional) tfsec for security scanning
brew install tfsec

# (Optional) Infracost for cost estimation
brew install infracost
```

### GCP Authentication

```bash
# Login to GCP
gcloud auth login

# Set application default credentials
gcloud auth application-default login

# Set your project
gcloud config set project YOUR_PROJECT_ID

# Verify
gcloud config get project
```

### Enable Required APIs

```bash
# These will be enabled automatically by Terraform, but you can do it manually:
gcloud services enable \
  compute.googleapis.com \
  container.googleapis.com \
  artifactregistry.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  iam.googleapis.com
```

---

## Initial Setup

### 1. Create State Storage Bucket

> [!IMPORTANT]
> This is a one-time setup. The state bucket must exist before running `terraform init`.

```bash
# Set your project ID
PROJECT_ID="cloud-secrets-manager"
ENV="dev"

# Create GCS bucket for Terraform state
gsutil mb -p ${PROJECT_ID} -l europe-west10 \
  gs://${PROJECT_ID}-tfstate-${ENV}

# Enable versioning (for rollback)
gsutil versioning set on gs://${PROJECT_ID}-tfstate-${ENV}

# Set lifecycle to delete old versions after 30 days
cat > /tmp/lifecycle.json <<'EOF'
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {
          "age": 30,
          "isLive": false
        }
      }
    ]
  }
}
EOF

gsutil lifecycle set /tmp/lifecycle.json gs://${PROJECT_ID}-tfstate-${ENV}

# Verify
gsutil ls -L gs://${PROJECT_ID}-tfstate-${ENV}
```

### 2. Configure Variables

```bash
cd infrastructure/terraform/environments/dev

# Copy example file
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
vi terraform.tfvars
```

Example `terraform.tfvars`:
```hcl
project_id  = "cloud-secrets-manager"
region      = "europe-west10"
environment = "dev"
```

> [!WARNING]
> **Never commit `terraform.tfvars` to Git!** It may contain sensitive data.

---

## Deploying Infrastructure

### First-Time Deployment

```bash
cd infrastructure/terraform/environments/dev

# 1. Initialize Terraform
terraform init

# 2. Preview changes
terraform plan

# 3. Review the plan carefully
# Look for:
# - Resources to be created
# - No unexpected deletions
# - Correct naming and labels

# 4. Apply changes
terraform apply

# Type 'yes' when prompted
```

**Expected output:**
```
Plan: 25 to add, 0 to change, 0 to destroy.

Do you want to perform these actions?
  Terraform will perform the actions described above.
  Only 'yes' will be accepted to approve.

  Enter a value: yes

Apply complete! Resources: 25 added, 0 changed, 0 destroyed.

Outputs:

artifact_registry_url = "europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images"
db_connection_name = "cloud-secrets-manager:europe-west10:secrets-manager-db-dev-abc123"
gke_cluster_name = "cloud-secrets-cluster-dev"
...
```

### Viewing Outputs

```bash
# All outputs
terraform output

# Specific output
terraform output artifact_registry_url

# Format as JSON
terraform output -json

# Sensitive outputs (requires -raw or -json)
terraform output -json db_password_secrets | jq
```

### Post-Deployment Configuration

```bash
# Configure kubectl
$(terraform output -raw gke_kubectl_command)

# Verify cluster access
kubectl get nodes

# Configure Docker for Artifact Registry
gcloud auth configure-docker europe-west10-docker.pkg.dev

# Test database connection (via Cloud SQL Proxy)
INSTANCE_CONNECTION=$(terraform output -raw db_connection_name)
cloud_sql_proxy -instances=${INSTANCE_CONNECTION}=tcp:5432 &

# Get database password
gcloud secrets versions access latest \
  --secret="$(terraform output -json db_password_secrets | jq -r '.secrets_db')"
```

---

## Managing State

### Understanding Terraform State

Terraform state tracks:
- What resources exist
- Their current configuration
- Dependencies between resources
- Metadata (timestamps, versions)

### Viewing State

```bash
# List all resources
terraform state list

# Show details of a resource
terraform state show module.gke.google_container_cluster.primary

# Pull state to view locally (read-only)
terraform state pull > state.json
cat state.json | jq '.resources[] | .name'
```

### State Operations

```bash
# Refresh state (sync with actual GCP resources)
terraform refresh

# Replace a resource (destroy and recreate)
terraform apply -replace="module.gke.google_container_node_pool.primary_nodes"

# Remove from state (keeps resource in GCP)
terraform state rm module.artifact_registry.google_artifact_registry_repository.main
```

### State Backup and Recovery

```bash
# State is automatically backed up in GCS with versioning
# To restore a previous version:

# 1. List versions
gsutil ls -a gs://cloud-secrets-manager-tfstate-dev/terraform/state/dev/

# 2. Copy old version
gsutil cp gs://cloud-secrets-manager-tfstate-dev/terraform/state/dev/default.tfstate#1234567890 \
  ./recovered-state.tfstate

# 3. Push to remote state
terraform state push recovered-state.tfstate
```

---

## Importing Existing Resources

If you have manually created GCP resources, import them into Terraform:

### Example: Import Artifact Registry

```bash
# 1. Add the resource to your Terraform config (if not already there)
# See: modules/artifact-registry/main.tf

# 2. Get the resource ID from GCP
gcloud artifacts repositories list --location=europe-west10

# 3. Import
terraform import module.artifact_registry.google_artifact_registry_repository.main \
  projects/cloud-secrets-manager/locations/europe-west10/repositories/docker-images

# 4. Verify (should show no changes)
terraform plan
```

### Example: Import Cloud SQL Instance

```bash
# Get instance name
gcloud sql instances list

# Import
terraform import module.postgresql.google_sql_database_instance.main \
  cloud-secrets-manager:europe-west10:secrets-manager-db-abc123

# Import databases
terraform import module.postgresql.google_sql_database.databases[\"secrets_db\"] \
  cloud-secrets-manager:secrets-manager-db-abc123:secrets_db
```

---

## Daily Operations

### Making Changes

```bash
# 1. Edit Terraform files
vi main.tf

# 2. Format code
terraform fmt

# 3. Validate syntax
terraform validate

# 4. Plan changes
terraform plan -out=tfplan

# 5. Review plan
# Look for unexpected changes

# 6. Apply
terraform apply tfplan
```

### Scaling Resources

```bash
# Edit variables
vi terraform.tfvars

# Example: Scale GKE nodes
# Change: max_node_count = 10

# Apply
terraform apply
```

### Updating Modules

```bash
# Update module source (e.g., new version)
vi main.tf

# Re-initialize to download new module
terraform init -upgrade

# Preview changes
terraform plan

# Apply
terraform apply
```

---

## Troubleshooting

### Error: Backend Configuration Changed

```bash
# Solution: Re-initialize
terraform init -reconfigure
```

### Error: Resource Already Exists

```bash
# Solution: Import the resource
terraform import <resource_address> <resource_id>

# Or, if you want to replace it:
terraform apply -replace="<resource_address>"
```

### Error: State Lock

```bash
# Check who has the lock
# (metadata is in the error message)

# If you're sure no one else is running Terraform:
terraform force-unlock LOCK_ID
```

### Error: Insufficient Permissions

```bash
# Check your current account
gcloud auth list

# Check IAM roles
gcloud projects get-iam-policy YOUR_PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:user:YOUR_EMAIL"

# You need these roles:
# - roles/owner or roles/editor
# - roles/iam.serviceAccountAdmin
# - roles/compute.admin
```

### Debugging Terraform

```bash
# Enable debug logging
export TF_LOG=DEBUG
terraform apply

# Save logs to file
export TF_LOG_PATH=./terraform.log
terraform apply

# Disable logging
unset TF_LOG
unset TF_LOG_PATH
```

### Accessing Remote State

```bash
# If state gets corrupted, you can manually inspect it:
gsutil cat gs://cloud-secrets-manager-tfstate-dev/terraform/state/dev/default.tfstate | jq

# To completely reset state (DANGEROUS):
rm -rf .terraform/
terraform init
```

---

## Best Practices

✅ **Do:**
- Always run `terraform plan` before `apply`
- Use modules for reusability
- Store state remotely (GCS)
- Enable state versioning
- Use `.tfvars` files for sensitive data
- Add labels to all resources
- Enable deletion protection for production databases

❌ **Don't:**
- Commit `terraform.tfvars` to Git
- Manually edit state files
- Run Terraform from multiple locations simultaneously
- Use `terraform destroy` in production without approval
- Skip `terraform plan`

---

## Security Best Practices

1. **State File Security**
   - State files contain passwords and sensitive data
   - Never commit to Git (in `.gitignore`)
   - Stored in GCS with encryption at rest
   - Limited access via IAM

2. **Credentials**
   - Use service accounts for CI/CD
   - Never hardcode credentials in `.tf` files
   - Use Secret Manager for application secrets
   - Rotate credentials regularly

3. **Access Control**
   - Principle of least privilege
   - Use Workload Identity for K8s pods
   - Separate service accounts per service
   - Enable Cloud Audit Logs

---

## Next Steps

- [ ] Deploy to staging environment
- [ ] Set up CI/CD pipeline for Terraform
- [ ] Configure alerting for infrastructure changes
- [ ] Implement automated testing with Terratest
- [ ] Set up cost monitoring and budgets

See also:
- [Terraform Operations Guide](./TERRAFORM_OPERATIONS.md)
- [Module Documentation](../terraform/modules/)
- [GCP Best Practices](https://cloud.google.com/docs/terraform/best-practices-for-terraform)
