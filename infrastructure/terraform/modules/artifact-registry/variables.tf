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

variable "repository_id" {
  description = "Artifact Registry repository ID"
  type        = string
  default     = "docker-images"
}

variable "keep_count" {
  description = "Number of image versions to retain per tag"
  type        = number
  default     = 10
}
