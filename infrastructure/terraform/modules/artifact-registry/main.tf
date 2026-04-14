terraform {
  required_version = ">= 1.5"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }
}

resource "google_artifact_registry_repository" "this" {
  project       = var.project_id
  location      = var.region
  repository_id = var.repository_id
  description   = "Docker images for Cloud Secrets Manager"
  format        = "DOCKER"

  cleanup_policies {
    id     = "keep-recent"
    action = "KEEP"

    most_recent_versions {
      keep_count = var.keep_count
    }
  }

  cleanup_policy_dry_run = false

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }
}
