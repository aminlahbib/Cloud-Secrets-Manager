variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "europe-west10"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "staging"
}

# --- Feature flags -------------------------------------------------

variable "skip_k8s_resources" {
  description = "Skip Kubernetes/Helm resources (set true on first apply before GKE exists)"
  type        = bool
  default     = false
}

variable "enable_monitoring" {
  description = "Deploy the Prometheus + Grafana + Loki monitoring stack"
  type        = bool
  default     = true
}

# --- App config ----------------------------------------------------

variable "app_namespace" {
  description = "Kubernetes namespace for application workloads"
  type        = string
  default     = "csm-staging"
}

variable "image_tag" {
  description = "Docker image tag to deploy"
  type        = string
  default     = "latest"
}

# --- Monitoring config ---------------------------------------------

variable "grafana_admin_password" {
  description = "Grafana admin password"
  type        = string
  default     = "admin"
  sensitive   = true
}
