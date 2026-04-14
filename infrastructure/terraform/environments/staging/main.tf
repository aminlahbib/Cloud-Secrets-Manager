locals {
  cluster_name  = "csm-cluster-${var.environment}"
  sql_instance  = "csm-db-${var.environment}"
  app_namespace = var.app_namespace
}

# -------------------------------------------------------------------
# Enable required GCP APIs
# -------------------------------------------------------------------
resource "google_project_service" "apis" {
  for_each = toset([
    "compute.googleapis.com",
    "container.googleapis.com",
    "artifactregistry.googleapis.com",
    "sqladmin.googleapis.com",
    "secretmanager.googleapis.com",
    "iam.googleapis.com",
    "pubsub.googleapis.com",
  ])

  project            = var.project_id
  service            = each.key
  disable_on_destroy = false
}

# -------------------------------------------------------------------
# GKE Cluster
# -------------------------------------------------------------------
module "gke" {
  source = "../../modules/gke"

  project_id   = var.project_id
  region       = var.region
  environment  = var.environment
  cluster_name = local.cluster_name

  node_count     = 2
  min_node_count = 2
  max_node_count = 5
  machine_type   = "e2-standard-2"
  disk_size_gb   = 50

  deletion_protection = true

  depends_on = [google_project_service.apis]
}

# -------------------------------------------------------------------
# Cloud SQL PostgreSQL
# -------------------------------------------------------------------
module "cloud_sql" {
  source = "../../modules/cloud-sql"

  project_id    = var.project_id
  region        = var.region
  environment   = var.environment
  instance_name = local.sql_instance

  tier                = "db-custom-2-4096"
  disk_size           = 30
  high_availability   = false
  backup_enabled      = true
  deletion_protection = true

  databases = ["secrets", "audit"]

  depends_on = [google_project_service.apis]
}

# -------------------------------------------------------------------
# IAM — service accounts + Workload Identity
# -------------------------------------------------------------------
module "iam" {
  source = "../../modules/iam"

  project_id = var.project_id

  service_accounts = {
    "csm-secret-svc-${var.environment}" = {
      display_name = "Secret Service (${var.environment})"
      roles = [
        "roles/cloudsql.client",
        "roles/secretmanager.secretAccessor",
        "roles/pubsub.publisher",
      ]
    }
    "csm-audit-svc-${var.environment}" = {
      display_name = "Audit Service (${var.environment})"
      roles = [
        "roles/cloudsql.client",
      ]
    }
    "csm-notif-svc-${var.environment}" = {
      display_name = "Notification Service (${var.environment})"
      roles = [
        "roles/cloudsql.client",
        "roles/pubsub.subscriber",
      ]
    }
    "csm-eso-${var.environment}" = {
      display_name = "External Secrets Operator (${var.environment})"
      roles = [
        "roles/secretmanager.secretAccessor",
      ]
    }
  }

  workload_identity_bindings = {
    secret-service = {
      gcp_sa_key = "csm-secret-svc-${var.environment}"
      namespace  = local.app_namespace
      k8s_sa     = "secret-service"
    }
    audit-service = {
      gcp_sa_key = "csm-audit-svc-${var.environment}"
      namespace  = local.app_namespace
      k8s_sa     = "audit-service"
    }
    notification-service = {
      gcp_sa_key = "csm-notif-svc-${var.environment}"
      namespace  = local.app_namespace
      k8s_sa     = "notification-service"
    }
    external-secrets = {
      gcp_sa_key = "csm-eso-${var.environment}"
      namespace  = "external-secrets"
      k8s_sa     = "external-secrets"
    }
  }

  depends_on = [google_project_service.apis, module.gke]
}

# -------------------------------------------------------------------
# Pub/Sub
# -------------------------------------------------------------------
module "pubsub" {
  source = "../../modules/pubsub"

  project_id        = var.project_id
  topic_name        = "notifications-events-${var.environment}"
  subscription_name = "notifications-events-${var.environment}-sub"

  depends_on = [google_project_service.apis]
}
