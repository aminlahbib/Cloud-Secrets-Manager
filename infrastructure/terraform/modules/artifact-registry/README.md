# Artifact Registry Module

Creates and manages a Google Artifact Registry repository for Docker images.

## Features

- Docker image storage with vulnerability scanning
- Automatic cleanup policies for old images
- Labels for organization and cost tracking
- Optionally supports dry-run mode for cleanup testing

## Usage

```hcl
module "artifact_registry" {
  source = "../../modules/artifact-registry"

  project_id    = "cloud-secrets-manager"
  region        = "europe-west10"
  repository_id = "docker-images"
  environment   = "production"

  cleanup_keep_count = 10
  cleanup_policy_dry_run = false
}
```

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|----------|
| project_id | GCP project ID | string | - | yes |
| region | GCP region | string | europe-west10 | no |
| repository_id | Repository ID | string | docker-images | no |
| environment | Environment name | string | - | yes |
| cleanup_keep_count | Images to keep per tag | number | 10 | no |
| cleanup_policy_dry_run | Dry-run mode | bool | true | no |

## Outputs

| Name | Description |
|------|-------------|
| repository_url | Full repository URL for docker commands |
| repository_name | Full resource name |
| repository_id | Repository ID |
| repository_location | Repository location |

## Example Docker Commands

```bash
# Configure Docker authentication
gcloud auth configure-docker europe-west10-docker.pkg.dev

# Build and push
docker build -t europe-west10-docker.pkg.dev/PROJECT_ID/docker-images/secret-service:latest .
docker push europe-west10-docker.pkg.dev/PROJECT_ID/docker-images/secret-service:latest
```
