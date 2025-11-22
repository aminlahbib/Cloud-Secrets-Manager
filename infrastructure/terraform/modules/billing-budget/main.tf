resource "google_billing_budget" "budget" {
  billing_account = var.billing_account_id
  display_name    = var.display_name

  budget_filter {
    projects = ["projects/${var.project_id}"]
  }

  amount {
    specified_amount {
      currency_code = var.currency_code
      units         = var.amount
    }
  }

  threshold_rules {
    threshold_percent = 0.5
  }

  threshold_rules {
    threshold_percent = 0.9
  }

  threshold_rules {
    threshold_percent = 1.0
  }

  all_updates_rule {
    pubsub_topic                     = var.pubsub_topic
    schema_version                   = "1.0"
    monitoring_notification_channels = var.notification_channels
    disable_default_iam_recipients   = var.disable_default_iam_recipients
  }
}


