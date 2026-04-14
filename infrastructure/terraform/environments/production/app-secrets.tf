# -------------------------------------------------------------------
# Application secrets — auto-generated and stored in GCP Secret Manager
#
# These follow the same pattern as database credentials in the
# cloud-sql module: random value -> Secret Manager -> ESO -> K8s Secret.
# -------------------------------------------------------------------

resource "random_password" "jwt_secret" {
  length  = 64
  special = false
}

resource "random_password" "aes_key" {
  length  = 32
  special = false
}

resource "random_password" "audit_api_key" {
  length  = 48
  special = false
}

locals {
  app_secrets = {
    "csm-jwt-secret"    = random_password.jwt_secret.result
    "csm-aes-key"       = random_password.aes_key.result
    "csm-audit-api-key" = random_password.audit_api_key.result
  }
}

resource "google_secret_manager_secret" "app_secrets" {
  for_each = local.app_secrets

  project   = var.project_id
  secret_id = each.key

  replication {
    auto {}
  }

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }

  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret_version" "app_secrets" {
  for_each = local.app_secrets

  secret      = google_secret_manager_secret.app_secrets[each.key].id
  secret_data = each.value

  lifecycle {
    ignore_changes = [secret_data]
  }
}
