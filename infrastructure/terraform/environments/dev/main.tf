# Cloud Secrets Manager - Dev Environment

locals {
  environment = "dev"
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

# Artifact Registry
module "artifact_registry" {
  source = "../../modules/artifact-registry"

  project_id    = var.project_id
  region        = var.region
  repository_id = "docker-images"
  environment   = local.environment

  cleanup_keep_count     = 5
  cleanup_policy_dry_run = false

  depends_on = [google_project_service.required_apis]
}

# PostgreSQL Database
module "postgresql" {
  source = "../../modules/postgresql"

  project_id    = var.project_id
  region        = var.region
  environment   = local.environment
  instance_name = "secrets-manager-db-dev"

  # Dev sizing (small and cost-effective)
  tier                  = "db-g1-small"
  disk_size             = 20
  disk_autoresize_limit = 50

  # Dev settings
  high_availability              = false
  deletion_protection            = false
  backup_enabled                 = true
  point_in_time_recovery_enabled = false

  databases = ["secrets", "audit"]

  depends_on = [google_project_service.required_apis]
}

# GKE Cluster
module "gke" {
  source = "../../modules/gke-cluster"

  project_id   = var.project_id
  region       = var.region
  environment  = local.environment
  cluster_name = "cloud-secrets-cluster-dev"

  # Dev sizing (minimal resources)
  node_count     = 1
  min_node_count = 1
  max_node_count = 3
  machine_type   = "e2-medium"
  disk_size_gb   = 30

  # Release channel: REGULAR for dev (balanced updates)
  release_channel = "REGULAR"

  # Deletion protection: disabled for dev (easier cleanup)
  deletion_protection = false
  # Networking
  enable_private_nodes     = false # Public for easier development
  enable_private_endpoint  = false
  enable_network_policy    = true
  enable_workload_identity = true

  depends_on = [google_project_service.required_apis]
}

# IAM Service Accounts
module "iam" {
  source = "../../modules/iam"

  project_id  = var.project_id
  environment = local.environment

  service_accounts = {
    "secret-service-dev" = {
      display_name = "Secret Service (Dev)"
      description  = "Service account for Secret Service in dev environment"
      roles = [
        "roles/cloudsql.client",
        "roles/secretmanager.secretAccessor",
        "roles/artifactregistry.reader",
        "roles/cloudsql.instanceUser", # Needed for IAM DB authentication if enabled
        "roles/pubsub.publisher",
      ]
    }
    "audit-service-dev" = {
      display_name = "Audit Service (Dev)"
      description  = "Service account for Audit Service in dev environment"
      roles = [
        "roles/cloudsql.client",
        "roles/logging.logWriter",
        "roles/artifactregistry.reader", # Needed to pull images from Artifact Registry
        "roles/cloudsql.instanceUser",   # Needed for IAM DB authentication if enabled
      ]
    }
    "notification-service-dev" = {
      display_name = "Notification Service (Dev)"
      description  = "Service account for Notification Service in dev environment"
      roles = [
        "roles/cloudsql.client",
        "roles/artifactregistry.reader",
        "roles/pubsub.subscriber",
        "roles/cloudsql.instanceUser",
      ]
    }
    "external-secrets-sa" = {
      display_name = "External Secrets Operator"
      description  = "Service account for External Secrets Operator"
      roles = [
        "roles/secretmanager.secretAccessor",
      ]
    }
  }

  # Workload Identity bindings (K8s SA -> GCP SA)
  workload_identity_bindings = {
    "secret-service" = {
      gcp_service_account = "secret-service-dev@${var.project_id}.iam.gserviceaccount.com"
      namespace           = "cloud-secrets-manager"
      k8s_service_account = "secret-service"
    }
    "audit-service" = {
      gcp_service_account = "audit-service-dev@${var.project_id}.iam.gserviceaccount.com"
      namespace           = "cloud-secrets-manager"
      k8s_service_account = "audit-service"
    }
    "external-secrets" = {
      gcp_service_account = "external-secrets-sa@${var.project_id}.iam.gserviceaccount.com"
      namespace           = "external-secrets"
      k8s_service_account = "external-secrets"
    }
    "notification-service" = {
      gcp_service_account = "notification-service-dev@${var.project_id}.iam.gserviceaccount.com"
      namespace           = "cloud-secrets-manager"
      k8s_service_account = "notification-service"
    }
  }

  depends_on = [google_project_service.required_apis, module.gke]
}

# Pub/Sub topic for notification events
resource "google_pubsub_topic" "notifications_events" {
  name    = "notifications-events"
  project = var.project_id

  depends_on = [google_project_service.required_apis]
}

# Pub/Sub subscription for notification-service
resource "google_pubsub_subscription" "notifications_events_sub" {
  name  = "notifications-events-sub"
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
    value = "external-secrets-sa@${var.project_id}.iam.gserviceaccount.com"
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

# Billing Budget (optional - only create if billing_account_id is provided)
module "billing_budget" {
  source = "../../modules/billing-budget"
  count  = var.billing_account_id != "" ? 1 : 0

  billing_account_id = var.billing_account_id
  project_id         = var.project_id
  display_name       = "budget-${local.environment}"
  amount             = var.budget_amount

  # Optional: Add notification channels here if needed
  # notification_channels = []
}
