terraform {
  required_version = ">= 1.5"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }
}

resource "google_pubsub_topic" "this" {
  project = var.project_id
  name    = var.topic_name
}

resource "google_pubsub_subscription" "this" {
  project = var.project_id
  name    = var.subscription_name
  topic   = google_pubsub_topic.this.id

  ack_deadline_seconds       = 30
  message_retention_duration = "${var.retention_days * 86400}s"
}
