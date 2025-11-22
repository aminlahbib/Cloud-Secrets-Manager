terraform {
  required_version = ">= 1.5"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

# GKE Cluster
resource "google_container_cluster" "primary" {
  project  = var.project_id
  name     = var.cluster_name
  location = var.region

  # We can't create a cluster with no node pool defined, but we want to only use
  # separately managed node pools. So we create the smallest possible default
  # node pool and immediately delete it.
  remove_default_node_pool = true
  initial_node_count       = 1

  # Networking
  network    = var.network_name
  subnetwork = var.subnetwork_name

  # IP allocation for VPC-native cluster
  ip_allocation_policy {
    cluster_ipv4_cidr_block  = "" # GKE will auto-allocate
    services_ipv4_cidr_block = "" # GKE will auto-allocate
  }

  # Private cluster configuration
  private_cluster_config {
    enable_private_nodes    = var.enable_private_nodes
    enable_private_endpoint = var.enable_private_endpoint
    master_ipv4_cidr_block  = var.master_ipv4_cidr_block
  }

  # Master authorized networks
  dynamic "master_authorized_networks_config" {
    for_each = length(var.master_authorized_networks) > 0 ? [1] : []
    content {
      dynamic "cidr_blocks" {
        for_each = var.master_authorized_networks
        content {
          cidr_block   = cidr_blocks.value.cidr_block
          display_name = cidr_blocks.value.display_name
        }
      }
    }
  }

  # Workload Identity
  # Using dynamic block to avoid errors when disabled
  dynamic "workload_identity_config" {
    for_each = var.enable_workload_identity ? [1] : []
    content {
      workload_pool = "${var.project_id}.svc.id.goog"
    }
  }

  # Deletion protection
  deletion_protection = var.deletion_protection

  # Release channel configuration
  release_channel {
    channel = var.release_channel
  }

  # Maintenance Policy
  # We use GKE defaults for maintenance window which provides automatic
  # updates while respecting release channel settings.
  # No explicit maintenance_policy block defined to use defaults.

  # Network policy
  network_policy {
    enabled  = var.enable_network_policy
    provider = var.enable_network_policy ? "CALICO" : "PROVIDER_UNSPECIFIED"
  }

  # Addons
  addons_config {
    http_load_balancing {
      disabled = false
    }
    horizontal_pod_autoscaling {
      disabled = false
    }
    network_policy_config {
      disabled = !var.enable_network_policy
    }
  }

  # Binary Authorization
  dynamic "binary_authorization" {
    for_each = var.enable_binary_authorization ? [1] : []
    content {
      evaluation_mode = "PROJECT_SINGLETON_POLICY_ENFORCE"
    }
  }

  # Security features
  enable_shielded_nodes = true

  # Logging and monitoring
  logging_config {
    enable_components = ["SYSTEM_COMPONENTS", "WORKLOADS"]
  }

  monitoring_config {
    enable_components = ["SYSTEM_COMPONENTS"]
    managed_prometheus {
      enabled = true
    }
  }

  # Resource labels
  resource_labels = merge(
    {
      environment = var.environment
      managed_by  = "terraform"
      service     = "cloud-secrets-manager"
    },
    var.labels
  )

  lifecycle {
    ignore_changes = [
      node_pool, # Managed separately
      ip_allocation_policy,
      private_cluster_config[0].master_ipv4_cidr_block, # Prevent forced replacement
      network,    # Ignore format differences (projects/.../default vs default)
      subnetwork, # Ignore format differences (projects/.../default vs default)
      deletion_protection, # Temporarily ignore to allow updates - manually set to false in GCP Console first
    ]
  }
}

# Separately managed node pool
resource "google_container_node_pool" "primary_nodes" {
  project    = var.project_id
  name       = "${var.cluster_name}-node-pool"
  location   = var.region
  cluster    = google_container_cluster.primary.name
  node_count = var.node_count

  # Autoscaling
  autoscaling {
    min_node_count = var.min_node_count
    max_node_count = var.max_node_count
  }

  # Node configuration
  node_config {
    machine_type = var.machine_type
    disk_size_gb = var.disk_size_gb
    disk_type    = var.disk_type

    # OAuth scopes for GCP APIs
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]

    # Service account
    service_account = google_service_account.gke_nodes.email

    # Workload Identity metadata
    workload_metadata_config {
      mode = var.enable_workload_identity ? "GKE_METADATA" : "GCE_METADATA"
    }

    # Shielded instance config
    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }

    # Labels
    labels = merge(
      {
        environment = var.environment
        managed_by  = "terraform"
      },
      var.labels
    )

    # Metadata
    metadata = {
      disable-legacy-endpoints = "true"
    }
  }

  # Management
  management {
    auto_repair  = true
    auto_upgrade = true
  }

  # Upgrade settings
  upgrade_settings {
    max_surge       = 1
    max_unavailable = 0
  }
}

# Service account for GKE nodes
resource "google_service_account" "gke_nodes" {
  project      = var.project_id
  account_id   = "${substr(var.cluster_name, 0, 20)}-nodes"
  display_name = "GKE Node Service Account for ${var.cluster_name}"
}

# IAM roles for node service account
resource "google_project_iam_member" "gke_nodes_logging" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.gke_nodes.email}"
}

resource "google_project_iam_member" "gke_nodes_monitoring" {
  project = var.project_id
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${google_service_account.gke_nodes.email}"
}

resource "google_project_iam_member" "gke_nodes_monitoring_viewer" {
  project = var.project_id
  role    = "roles/monitoring.viewer"
  member  = "serviceAccount:${google_service_account.gke_nodes.email}"
}

resource "google_project_iam_member" "gke_nodes_artifact_registry" {
  project = var.project_id
  role    = "roles/artifactregistry.reader"
  member  = "serviceAccount:${google_service_account.gke_nodes.email}"
}
