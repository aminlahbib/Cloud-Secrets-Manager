# Artifact Registry
output "artifact_registry_url" {
  description = "URL for pushing Docker images"
  value       = module.artifact_registry.repository_url
}

# PostgreSQL
output "db_instance_name" {
  description = "Cloud SQL instance name"
  value       = module.postgresql.instance_name
}

output "db_connection_name" {
  description = "Cloud SQL connection name for proxy"
  value       = module.postgresql.instance_connection_name
}

output "db_password_secrets" {
  description = "Secret Manager IDs for database passwords"
  value       = module.postgresql.password_secret_ids
  sensitive   = true
}

# GKE
output "gke_cluster_name" {
  description = "GKE cluster name"
  value       = module.gke.cluster_name
}

output "gke_kubectl_command" {
  description = "Command to configure kubectl"
  value       = module.gke.kubectl_config_command
}

# IAM
output "service_accounts" {
  description = "Created service account emails"
  value       = module.iam.service_accounts
}

# Quick Start Commands
output "quick_start" {
  description = "Quick start commands"
  value = <<-EOT
    # Configure kubectl:
    ${module.gke.kubectl_config_command}

    # Configure Docker for Artifact Registry:
    gcloud auth configure-docker ${var.region}-docker.pkg.dev

    # Get database password:
    gcloud secrets versions access latest --secret="${module.postgresql.instance_name}-secrets_db-password"

    # Connect to database via proxy:
    cloud_sql_proxy -instances=${module.postgresql.instance_connection_name}=tcp:5432
  EOT
}
