variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "service_accounts" {
  description = "Map of service accounts to create"
  type = map(object({
    display_name = string
    description  = string
    roles        = list(string)
  }))
  default = {}
}

variable "workload_identity_bindings" {
  description = "Workload Identity bindings (K8s SA -> GCP SA)"
  type = map(object({
    gcp_service_account = string
    namespace           = string
    k8s_service_account = string
  }))
  default = {}
}

variable "environment" {
  description = "Environment name"
  type        = string
}
