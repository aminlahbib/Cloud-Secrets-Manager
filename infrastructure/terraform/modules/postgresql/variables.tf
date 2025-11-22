variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region for the Cloud SQL instance"
  type        = string
  default     = "europe-west10"
}

variable "instance_name" {
  description = "Name of the Cloud SQL instance"
  type        = string
  default     = "secrets-manager-db"
}

variable "database_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "POSTGRES_16"
}

variable "tier" {
  description = "Machine tier for the instance"
  type        = string
  default     = "db-g1-small"
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
}

variable "disk_size" {
  description = "Disk size in GB"
  type        = number
  default     = 20
}

variable "disk_type" {
  description = "Disk type (PD_SSD or PD_HDD)"
  type        = string
  default     = "PD_SSD"
}

variable "disk_autoresize" {
  description = "Whether to auto-resize the disk"
  type        = bool
  default     = true
}

variable "disk_autoresize_limit" {
  description = "Maximum disk size in GB (0 = no limit)"
  type        = number
  default     = 100
}

variable "backup_enabled" {
  description = "Enable automated backups"
  type        = bool
  default     = true
}

variable "backup_start_time" {
  description = "Start time for backups (HH:MM format)"
  type        = string
  default     = "03:00"
}

variable "point_in_time_recovery_enabled" {
  description = "Enable point-in-time recovery"
  type        = bool
  default     = true
}

variable "high_availability" {
  description = "Enable high availability (regional)"
  type        = bool
  default     = false
}

variable "deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = true
}

variable "databases" {
  description = "List of databases to create"
  type        = list(string)
  default     = ["secrets_db", "audit_db"]
}

variable "network_id" {
  description = "VPC network ID for private IP (optional)"
  type        = string
  default     = null
}

variable "labels" {
  description = "Additional labels to apply"
  type        = map(string)
  default     = {}
}
