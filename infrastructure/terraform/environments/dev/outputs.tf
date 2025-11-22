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
  value       = <<-EOT
    # Configure kubectl:
    ${module.gke.kubectl_config_command}

    # Configure Docker for Artifact Registry:
    gcloud auth configure-docker ${var.region}-docker.pkg.dev

    # Get database passwords:
    gcloud secrets versions access latest --secret="${module.postgresql.secret_names["secrets"].password_secret}"
    gcloud secrets versions access latest --secret="${module.postgresql.secret_names["audit"].password_secret}"
    
    # Get database usernames:
    gcloud secrets versions access latest --secret="${module.postgresql.secret_names["secrets"].user_secret}"
    gcloud secrets versions access latest --secret="${module.postgresql.secret_names["audit"].user_secret}"

    # Connect to database via proxy:
    cloud_sql_proxy -instances=${module.postgresql.instance_connection_name}=tcp:5432

    # Note: Secrets are automatically synced to Kubernetes via External Secrets Operator
    # Check synced secrets:
    kubectl get secrets -n cloud-secrets-manager
    kubectl get externalsecrets -n cloud-secrets-manager
  EOT
}
