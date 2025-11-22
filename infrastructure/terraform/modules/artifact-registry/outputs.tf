output "repository_url" {
  description = "The URL of the Artifact Registry repository for docker pull/push"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${var.repository_id}"
}

output "repository_name" {
  description = "The full resource name of the repository"
  value       = google_artifact_registry_repository.main.name
}

output "repository_id" {
  description = "The ID of the repository"
  value       = google_artifact_registry_repository.main.repository_id
}

output "repository_location" {
  description = "The location of the repository"
  value       = google_artifact_registry_repository.main.location
}
