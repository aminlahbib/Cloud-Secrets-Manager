variable "billing_account_id" {
  description = "The ID of the billing account to associate this budget with."
  type        = string
}

variable "project_id" {
  description = "The ID of the project to apply the budget to."
  type        = string
}

variable "display_name" {
  description = "The name of the budget."
  type        = string
}

variable "amount" {
  description = "The amount of the budget."
  type        = number
}

variable "currency_code" {
  description = "The currency code for the budget."
  type        = string
  default     = "USD"
}

variable "pubsub_topic" {
  description = "The name of the Cloud Pub/Sub topic where budget related messages will be published, in the form projects/{project_id}/topics/{topic_id}."
  type        = string
  default     = null
}

variable "notification_channels" {
  description = "A list of monitoring notification channels to notify when the budget is exceeded."
  type        = list(string)
  default     = []
}

variable "disable_default_iam_recipients" {
  description = "Whether to disable default IAM recipients for budget alerts."
  type        = bool
  default     = false
}

