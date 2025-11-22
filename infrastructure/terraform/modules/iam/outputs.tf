output "service_accounts" {
  description = "Created service account emails"
  value = {
    for sa_key, sa in google_service_account.service_accounts : sa_key => sa.email
  }
}

output "service_account_ids" {
  description = "Service account IDs (project number format)"
  value = {
    for sa_key, sa in google_service_account.service_accounts : sa_key => sa.unique_id
  }
}
