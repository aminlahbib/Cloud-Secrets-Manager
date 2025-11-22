terraform {
  required_version = ">= 1.5"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

# Artifact Registry Repository
resource "google_artifact_registry_repository" "main" {
  project       = var.project_id
  location      = var.region
  repository_id = var.repository_id
  description   = var.description
  format        = var.format

  labels = merge(
    {
      environment = var.environment
      managed_by  = "terraform"
      service     = "cloud-secrets-manager"
    },
    var.labels
  )

  # Cleanup policy to remove old images
  cleanup_policies {
    id     = "keep-recent-versions"
    action = "KEEP"

    most_recent_versions {
      keep_count = var.cleanup_keep_count
    }
  }

  cleanup_policy_dry_run = var.cleanup_policy_dry_run
}

# Enable vulnerability scanning (automatic with Artifact Registry)
# No additional configuration needed - enabled by default

# Output the repository URL for use in CI/CD
output "repository_url" {
  description = "The URL of the Artifact Registry repository"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${var.repository_id}"
}

output "repository_name" {
  description = "The full name of the Artifact Registry repository"
  value       = google_artifact_registry_repository.main.name
}

output "repository_id" {
  description = "The ID of the Artifact Registry repository"
  value       = google_artifact_registry_repository.main.repository_id
}
