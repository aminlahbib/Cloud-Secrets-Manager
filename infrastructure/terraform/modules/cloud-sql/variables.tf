variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "instance_name" {
  description = "Cloud SQL instance name"
  type        = string
}

variable "tier" {
  description = "Machine tier (e.g. db-g1-small, db-custom-2-4096)"
  type        = string
  default     = "db-g1-small"
}

variable "disk_size" {
  description = "Initial disk size in GB"
  type        = number
  default     = 20
}

variable "high_availability" {
  description = "Enable HA (REGIONAL availability)"
  type        = bool
  default     = false
}

variable "backup_enabled" {
  description = "Enable automated backups"
  type        = bool
  default     = true
}

variable "deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = true
}

variable "databases" {
  description = "List of databases to create"
  type        = list(string)
  default     = ["secrets", "audit"]
}
