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
  default     = "dev"
}
