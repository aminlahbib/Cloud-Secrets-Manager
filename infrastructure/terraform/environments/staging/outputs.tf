# Outputs for staging environment

output "gke_cluster_name" {
  description = "The name of the GKE cluster"
  value       = module.gke.cluster_name
}

output "gke_cluster_endpoint" {
  description = "The endpoint of the GKE cluster"
  value       = module.gke.cluster_endpoint
  sensitive   = true
}

output "postgresql_instance_name" {
  description = "The name of the Cloud SQL instance"
  value       = module.postgresql.instance_name
}

output "postgresql_connection_name" {
  description = "The connection name for Cloud SQL"
  value       = module.postgresql.connection_name
}

output "postgresql_database_names" {
  description = "List of database names"
  value       = module.postgresql.database_names
}

output "pubsub_topic_name" {
  description = "The Pub/Sub topic for notifications"
  value       = google_pubsub_topic.notifications_events.name
}

output "pubsub_subscription_name" {
  description = "The Pub/Sub subscription for notification service"
  value       = google_pubsub_subscription.notifications_events_sub.name
}

output "service_account_emails" {
  description = "Map of service account emails"
  value       = module.iam.service_account_emails
}

output "kubectl_connect_command" {
  description = "Command to connect kubectl to the cluster"
  value       = "gcloud container clusters get-credentials ${module.gke.cluster_name} --region ${var.region} --project ${var.project_id}"
}

output "helm_install_command" {
  description = "Command to install the application via Helm"
  value       = "helm install csm ../../helm/cloud-secrets-manager -n csm-staging -f ../../helm/cloud-secrets-manager/values-staging.yaml"
}
