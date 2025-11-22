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

  databases = ["secrets_db", "audit_db"]

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
      ]
    }
    "audit-service-dev" = {
      display_name = "Audit Service (Dev)"
      description  = "Service account for Audit Service in dev environment"
      roles = [
        "roles/cloudsql.client",
        "roles/logging.logWriter",
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
  }

  depends_on = [google_project_service.required_apis, module.gke]
}
