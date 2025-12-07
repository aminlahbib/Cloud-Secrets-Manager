# Cloud Secrets Manager - Staging Environment
# 
# Staging is a production-like environment for integration testing
# before deploying to production.

locals {
  environment = "staging"
}

# Enable required APIs
resource "google_project_service" "required_apis" {
  for_each = toset([
    "compute.googleapis.com",
    "container.googleapis.com",
    "artifactregistry.googleapis.com",
    "sqladmin.googleapis.com",
    "secretmanager.googleapis.com",
    "iam.googleapis.com",
    "billingbudgets.googleapis.com",
    "pubsub.googleapis.com",
  ])

  project            = var.project_id
  service            = each.key
  disable_on_destroy = false
}

# Artifact Registry (shared with dev - no need to duplicate)
# Images are tagged per environment: latest, staging, production

# PostgreSQL Database - Staging
module "postgresql" {
  source = "../../modules/postgresql"

  project_id    = var.project_id
  region        = var.region
  environment   = local.environment
  instance_name = "secrets-manager-db-staging"

  # Staging sizing (moderate)
  tier                  = "db-custom-2-4096" # 2 vCPU, 4GB RAM
  disk_size             = 30
  disk_autoresize_limit = 100

  # Staging settings (more production-like)
  high_availability              = false # Enable for true production-like testing
  deletion_protection            = true  # Protect staging data
  backup_enabled                 = true
  point_in_time_recovery_enabled = true

  databases = ["secrets", "audit"]

  depends_on = [google_project_service.required_apis]
}

# GKE Cluster - Staging
module "gke" {
  source = "../../modules/gke-cluster"

  project_id   = var.project_id
  region       = var.region
  environment  = local.environment
  cluster_name = "cloud-secrets-cluster-staging"

  # Staging sizing (moderate - between dev and prod)
  node_count     = 2
  min_node_count = 2
  max_node_count = 5
  machine_type   = "e2-standard-2" # 2 vCPU, 8GB RAM
  disk_size_gb   = 50

  # Release channel: REGULAR for staging
  release_channel = "REGULAR"

  # Deletion protection: enabled for staging
  deletion_protection = true

  # Networking - more production-like
  enable_private_nodes     = true
  enable_private_endpoint  = false # Keep public endpoint for kubectl access
  enable_network_policy    = true
  enable_workload_identity = true

  depends_on = [google_project_service.required_apis]
}

# IAM Service Accounts - Staging
module "iam" {
  source = "../../modules/iam"

  project_id  = var.project_id
  environment = local.environment

  service_accounts = {
    "secret-service-staging" = {
      display_name = "Secret Service (Staging)"
      description  = "Service account for Secret Service in staging environment"
      roles = [
        "roles/cloudsql.client",
        "roles/secretmanager.secretAccessor",
        "roles/artifactregistry.reader",
        "roles/cloudsql.instanceUser",
        "roles/pubsub.publisher",
      ]
    }
    "audit-service-staging" = {
      display_name = "Audit Service (Staging)"
      description  = "Service account for Audit Service in staging environment"
      roles = [
        "roles/cloudsql.client",
        "roles/logging.logWriter",
        "roles/artifactregistry.reader",
        "roles/cloudsql.instanceUser",
      ]
    }
    "notification-service-staging" = {
      display_name = "Notification Service (Staging)"
      description  = "Service account for Notification Service in staging environment"
      roles = [
        "roles/cloudsql.client",
        "roles/artifactregistry.reader",
        "roles/pubsub.subscriber",
        "roles/cloudsql.instanceUser",
      ]
    }
    "external-secrets-staging" = {
      display_name = "External Secrets Operator (Staging)"
      description  = "Service account for External Secrets Operator in staging"
      roles = [
        "roles/secretmanager.secretAccessor",
      ]
    }
  }

  # Workload Identity bindings (K8s SA -> GCP SA)
  workload_identity_bindings = {
    "secret-service" = {
      gcp_service_account = "secret-service-staging@${var.project_id}.iam.gserviceaccount.com"
      namespace           = "csm-staging"
      k8s_service_account = "secret-service"
    }
    "audit-service" = {
      gcp_service_account = "audit-service-staging@${var.project_id}.iam.gserviceaccount.com"
      namespace           = "csm-staging"
      k8s_service_account = "audit-service"
    }
    "external-secrets" = {
      gcp_service_account = "external-secrets-staging@${var.project_id}.iam.gserviceaccount.com"
      namespace           = "external-secrets"
      k8s_service_account = "external-secrets"
    }
    "notification-service" = {
      gcp_service_account = "notification-service-staging@${var.project_id}.iam.gserviceaccount.com"
      namespace           = "csm-staging"
      k8s_service_account = "notification-service"
    }
  }

  depends_on = [google_project_service.required_apis, module.gke]
}

# Pub/Sub topic for notification events - Staging
resource "google_pubsub_topic" "notifications_events" {
  name    = "notifications-events-staging"
  project = var.project_id

  depends_on = [google_project_service.required_apis]
}

# Pub/Sub subscription for notification-service - Staging
resource "google_pubsub_subscription" "notifications_events_sub" {
  name  = "notifications-events-staging-sub"
  topic = google_pubsub_topic.notifications_events.name

  project = var.project_id

  ack_deadline_seconds       = 30
  message_retention_duration = "604800s" # 7 days

  depends_on = [google_pubsub_topic.notifications_events]
}

# External Secrets Operator
resource "helm_release" "external_secrets" {
  name             = "external-secrets"
  repository       = "https://charts.external-secrets.io"
  chart            = "external-secrets"
  version          = "0.9.13"
  namespace        = "external-secrets"
  create_namespace = true

  set {
    name  = "installCRDs"
    value = "true"
  }

  set {
    name  = "serviceAccount.create"
    value = "true"
  }
  set {
    name  = "serviceAccount.name"
    value = "external-secrets"
  }
  set {
    name  = "serviceAccount.annotations.iam\\.gke\\.io/gcp-service-account"
    value = "external-secrets-staging@${var.project_id}.iam.gserviceaccount.com"
  }

  depends_on = [module.gke, module.iam]
}

# ClusterSecretStore
resource "kubernetes_manifest" "cluster_secret_store" {
  manifest = {
    apiVersion = "external-secrets.io/v1beta1"
    kind       = "ClusterSecretStore"
    metadata = {
      name = "gcp-secret-manager"
    }
    spec = {
      provider = {
        gcpsm = {
          projectID = var.project_id
        }
      }
    }
  }

  depends_on = [helm_release.external_secrets]
}

# Billing Budget for Staging
module "billing_budget" {
  source = "../../modules/billing-budget"
  count  = var.billing_account_id != "" ? 1 : 0

  billing_account_id = var.billing_account_id
  project_id         = var.project_id
  display_name       = "budget-${local.environment}"
  amount             = var.budget_amount
}
