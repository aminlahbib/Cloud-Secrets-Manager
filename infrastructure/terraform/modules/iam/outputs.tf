output "service_account_emails" {
  description = "Map of service account key to email"
  value = {
    for k, sa in google_service_account.accounts : k => sa.email
  }
}
