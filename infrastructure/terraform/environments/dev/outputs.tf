# --- Artifact Registry -----------------------------------------------
output "registry_url" {
  description = "Docker registry URL"
  value       = module.artifact_registry.repository_url
}

# --- GKE -------------------------------------------------------------
output "gke_cluster_name" {
  description = "GKE cluster name"
  value       = module.gke.cluster_name
}

output "kubectl_command" {
  description = "Command to configure kubectl"
  value       = "gcloud container clusters get-credentials ${module.gke.cluster_name} --region ${var.region} --project ${var.project_id}"
}

# --- Cloud SQL --------------------------------------------------------
output "sql_connection_name" {
  description = "Cloud SQL connection name (for Auth Proxy)"
  value       = module.cloud_sql.connection_name
}

output "sql_instance_name" {
  description = "Cloud SQL instance name"
  value       = module.cloud_sql.instance_name
}

# --- IAM --------------------------------------------------------------
output "service_accounts" {
  description = "Service account emails"
  value       = module.iam.service_account_emails
}

# --- Pub/Sub ----------------------------------------------------------
output "pubsub_topic" {
  description = "Pub/Sub topic name"
  value       = module.pubsub.topic_name
}

output "pubsub_subscription" {
  description = "Pub/Sub subscription name"
  value       = module.pubsub.subscription_name
}

# --- Quick start ------------------------------------------------------
output "quick_start" {
  description = "Quick start commands after apply"
  value       = <<-EOT
    # 1. Configure kubectl
    ${module.gke.cluster_name != "" ? "gcloud container clusters get-credentials ${module.gke.cluster_name} --region ${var.region} --project ${var.project_id}" : ""}

    # 2. Configure Docker for Artifact Registry
    gcloud auth configure-docker ${var.region}-docker.pkg.dev

    # 3. Check running workloads
    kubectl get pods -n ${var.app_namespace}
    kubectl get pods -n monitoring
  EOT
}
