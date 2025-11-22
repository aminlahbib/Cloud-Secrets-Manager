variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region for the Artifact Registry"
  type        = string
  default     = "europe-west10"
}

variable "repository_id" {
  description = "The ID of the Artifact Registry repository"
  type        = string
  default     = "docker-images"
}

variable "description" {
  description = "Description of the Artifact Registry repository"
  type        = string
  default     = "Docker images for Cloud Secrets Manager"
}

variable "format" {
  description = "The format of packages that are stored in the repository"
  type        = string
  default     = "DOCKER"
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
}

variable "cleanup_policy_dry_run" {
  description = "Whether to run cleanup policy in dry-run mode"
  type        = bool
  default     = true
}

variable "cleanup_keep_count" {
  description = "Number of images to keep per tag"
  type        = number
  default     = 10
}

variable "labels" {
  description = "Additional labels to apply to the repository"
  type        = map(string)
  default     = {}
}
