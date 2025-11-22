variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region for the GKE cluster"
  type        = string
  default     = "europe-west10"
}

variable "cluster_name" {
  description = "Name of the GKE cluster"
  type        = string
  default     = "cloud-secrets-cluster"
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
}

variable "network_name" {
  description = "Name of the VPC network"
  type        = string
  default     = "default"
}

variable "subnetwork_name" {
  description = "Name of the subnetwork"
  type        = string
  default     = "default"
}

variable "master_ipv4_cidr_block" {
  description = "CIDR block for GKE master"
  type        = string
  default     = "172.16.0.0/28"
}

variable "node_count" {
  description = "Number of nodes in the default pool"
  type        = number
  default     = 1
}

variable "min_node_count" {
  description = "Minimum nodes for autoscaling"
  type        = number
  default     = 1
}

variable "max_node_count" {
  description = "Maximum nodes for autoscaling"
  type        = number
  default     = 5
}

variable "machine_type" {
  description = "Machine type for nodes"
  type        = string
  default     = "e2-medium"
}

variable "disk_size_gb" {
  description = "Disk size for nodes in GB"
  type        = number
  default     = 50
}

variable "disk_type" {
  description = "Disk type for nodes"
  type        = string
  default     = "pd-standard"
}

variable "enable_private_nodes" {
  description = "Enable private IP for nodes"
  type        = bool
  default     = true
}

variable "enable_private_endpoint" {
  description = "Enable private endpoint for master"
  type        = bool
  default     = false
}

variable "master_authorized_networks" {
  description = "CIDR blocks allowed to access master"
  type = list(object({
    cidr_block   = string
    display_name = string
  }))
  default = []
}

variable "enable_workload_identity" {
  description = "Enable Workload Identity"
  type        = bool
  default     = true
}

variable "enable_network_policy" {
  description = "Enable network policy"
  type        = bool
  default     = true
}

variable "enable_binary_authorization" {
  description = "Enable Binary Authorization"
  type        = bool
  default     = false
}

variable "release_channel" {
  description = "Release channel for GKE upgrades (RAPID, REGULAR, STABLE)"
  type        = string
  default     = "REGULAR"
  validation {
    condition     = contains(["RAPID", "REGULAR", "STABLE", "UNSPECIFIED"], var.release_channel)
    error_message = "Release channel must be one of: RAPID, REGULAR, STABLE, UNSPECIFIED."
  }
}

variable "deletion_protection" {
  description = "Whether to enable deletion protection for the cluster"
  type        = bool
  default     = false
}

variable "labels" {
  description = "Additional labels for the cluster"
  type        = map(string)
  default     = {}
}
