variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "topic_name" {
  description = "Pub/Sub topic name"
  type        = string
}

variable "subscription_name" {
  description = "Pub/Sub subscription name"
  type        = string
}

variable "retention_days" {
  description = "Message retention in days"
  type        = number
  default     = 7
}
