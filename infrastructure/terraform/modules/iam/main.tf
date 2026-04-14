terraform {
  required_version = ">= 1.5"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }
}

# -------------------------------------------------------------------
# Service accounts
# -------------------------------------------------------------------
resource "google_service_account" "accounts" {
  for_each = var.service_accounts

  project      = var.project_id
  account_id   = each.key
  display_name = each.value.display_name
}

# -------------------------------------------------------------------
# Project-level IAM role bindings
# -------------------------------------------------------------------
resource "google_project_iam_member" "roles" {
  for_each = {
    for pair in flatten([
      for sa_key, sa in var.service_accounts : [
        for role in sa.roles : {
          key  = "${sa_key}--${role}"
          sa   = sa_key
          role = role
        }
      ]
    ]) : pair.key => pair
  }

  project = var.project_id
  role    = each.value.role
  member  = "serviceAccount:${google_service_account.accounts[each.value.sa].email}"
}

# -------------------------------------------------------------------
# Workload Identity bindings (K8s SA → GCP SA)
# -------------------------------------------------------------------
resource "google_service_account_iam_member" "workload_identity" {
  for_each = var.workload_identity_bindings

  service_account_id = google_service_account.accounts[each.value.gcp_sa_key].name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.project_id}.svc.id.goog[${each.value.namespace}/${each.value.k8s_sa}]"
}
