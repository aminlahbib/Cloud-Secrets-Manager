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

variable "billing_account_id" {
  description = "The ID of the billing account to associate this budget with. Leave empty to skip budget creation."
  type        = string
  default     = ""
}

variable "budget_amount" {
  description = "The monthly budget amount."
  type        = number
  default     = 50
}
