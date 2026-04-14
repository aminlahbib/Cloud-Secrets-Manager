output "topic_name" {
  description = "Pub/Sub topic name"
  value       = google_pubsub_topic.this.name
}

output "subscription_name" {
  description = "Pub/Sub subscription name"
  value       = google_pubsub_subscription.this.name
}
