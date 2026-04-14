variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "service_accounts" {
  description = "Map of service account ID to config"
  type = map(object({
    display_name = string
    roles        = list(string)
  }))
}

variable "workload_identity_bindings" {
  description = "Workload Identity bindings (K8s SA → GCP SA)"
  type = map(object({
    gcp_sa_key = string
    namespace  = string
    k8s_sa     = string
  }))
  default = {}
}
