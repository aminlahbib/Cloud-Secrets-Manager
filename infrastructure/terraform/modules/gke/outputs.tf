output "cluster_name" {
  description = "GKE cluster name"
  value       = google_container_cluster.this.name
}

output "cluster_endpoint" {
  description = "GKE cluster endpoint"
  value       = google_container_cluster.this.endpoint
  sensitive   = true
}

output "cluster_ca_certificate" {
  description = "Base64 encoded CA certificate"
  value       = google_container_cluster.this.master_auth[0].cluster_ca_certificate
  sensitive   = true
}

output "location" {
  description = "Cluster location (region)"
  value       = google_container_cluster.this.location
}

output "node_service_account_email" {
  description = "Email of the node service account"
  value       = google_service_account.nodes.email
}
