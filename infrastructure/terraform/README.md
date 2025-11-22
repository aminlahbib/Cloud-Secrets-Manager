# Terraform Infrastructure

This directory contains Terraform configurations for managing the Cloud Secrets Manager infrastructure on Google Cloud Platform.

## Directory Structure

```
terraform/
├── modules/               # Reusable Terraform modules
│   ├── artifact-registry/ # Docker image registry
│   ├── gke-cluster/      # Kubernetes cluster
│   ├── postgresql/       # Cloud SQL PostgreSQL
│   ├── iam/              # Service accounts and permissions
│   └── identity-platform/ # (Future) Google Identity Platform
├── environments/         # Environment-specific configurations
│   ├── dev/             # Development environment
│   ├── staging/         # Staging environment (future)
│   └── production/      # Production environment (future)
└── .gitignore           # Terraform files to ignore

```

## Prerequisites

### 1. Install Terraform

```bash
# macOS
brew install terraform

# Verify installation
terraform version  # Should be >= 1.5
```

### 2. Install Google Cloud SDK

```bash
# macOS
brew install google-cloud-sdk

# Authenticate
gcloud auth login
gcloud auth application-default login

# Set project
gcloud config set project YOUR_PROJECT_ID
```

### 3. One-Time Setup: Create State Bucket

```bash
# Create bucket for Terraform state (one-time setup)
gsutil mb -p YOUR_PROJECT_ID -l europe-west10 gs://cloud-secrets-manager-tfstate-dev

# Enable versioning (for state recovery)
gsutil versioning set on gs://cloud-secrets-manager-tfstate-dev

# Set lifecycle policy to keep old versions for 30 days
cat > /tmp/lifecycle.json <<EOF
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

gsutil lifecycle set /tmp/lifecycle.json gs://cloud-secrets-manager-tfstate-dev
```

## Quick Start

### Initialize and Deploy Dev Environment

```bash
# Navigate to dev environment
cd infrastructure/terraform/environments/dev

# Copy example variables
cp terraform.tfvars.example terraform.tfvars

# Edit with your project ID
vi terraform.tfvars  # Set your GCP project ID

# Initialize Terraform (downloads providers, sets up backend)
terraform init

# Preview changes
terraform plan

# Apply changes (deploys infrastructure)
terraform apply
```

### Viewing Outputs

```bash
# View all outputs
terraform output

# View specific output
terraform output artifact_registry_url

# View sensitive output
terraform output -json db_password_secrets
```

## Common Operations

### Updating Infrastructure

```bash
# Preview changes
terraform plan

# Apply changes
terraform apply

# Apply with auto-approve (use carefully)
terraform apply -auto-approve
```

### Destroying Infrastructure

```bash
# Destroy everything (WARNING: irreversible)
terraform destroy

# Destroy specific resource
terraform destroy -target=module.gke
```

### State Management

```bash
# List resources in state
terraform state list

# Show details of a resource
terraform state show module.gke.google_container_cluster.primary

# Remove resource from state (doesn't delete actual resource)
terraform state rm module.gke.google_container_cluster.primary

# Import existing resource
terraform import module.artifact_registry.google_artifact_registry_repository.main \
  projects/PROJECT_ID/locations/REGION/repositories/REPO_NAME
```

### Formatting and Validation

```bash
# Format all files
terraform fmt -recursive

# Validate configuration
terraform validate

# Check for security issues (requires tfsec)
tfsec .
```

## Module Usage

Each module is documented in its own README:

- [Artifact Registry](../../modules/artifact-registry/README.md)
- [GKE Cluster](../../modules/gke-cluster/README.md)
- [PostgreSQL](../../modules/postgresql/README.md)
- [IAM](../../modules/iam/README.md)

## Best Practices

1. **Always run `terraform plan` before `apply`**
2. **Use workspaces or separate backends for different environments**
3. **Store `terraform.tfvars` locally, never commit to Git**
4. **Review state changes carefully**
5. **Enable deletion protection for production databases**
6. **Use modules for reusability**
7. **Tag all resources with environment and managed_by labels**

## Troubleshooting

### Error: Backend configuration changed

```bash
# Re-initialize with new backend config
terraform init -reconfigure
```

### Error: Resource already exists

```bash
# Import existing resource instead of creating
terraform import <RESOURCE_TYPE>.<NAME> <RESOURCE_ID>
```

### Error: State lock

```bash
# Force unlock (use only if you're sure no other operation is running)
terraform force-unlock LOCK_ID
```

### View Terraform execution graph

```bash
# Generate and view dependency graph
terraform graph | dot -Tpng > graph.png
open graph.png
```

## Security Notes

- State files contain sensitive data (passwords, keys)
- State is stored in GCS with encryption at rest
- Never commit `.tfstate` files to Git
- Use Secret Manager for storing credentials
- Passwords are auto-generated and stored separately

## Cost Estimation

To estimate costs before applying:

```bash
# Using Infracost (requires installation)
infracost breakdown --path .

# Or use GCP's pricing calculator
# https://cloud.google.com/products/calculator
```

## Next Steps

See the [Terraform Operations Guide](../../../docs/deployment/TERRAFORM_OPERATIONS.md) for day-2 operations including:
- Import existing resources
- Disaster recovery
- State migration
- Multi-environment management
