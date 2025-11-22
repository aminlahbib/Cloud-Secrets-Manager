terraform {
  required_version = ">= 1.5"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

# Generate random suffix for instance name to avoid conflicts
resource "random_id" "db_suffix" {
  byte_length = 4
}

# Cloud SQL PostgreSQL Instance
resource "google_sql_database_instance" "main" {
  project             = var.project_id
  name                = "${var.instance_name}-${random_id.db_suffix.hex}"
  region              = var.region
  database_version    = var.database_version
  deletion_protection = var.deletion_protection

  settings {
    tier              = var.tier
    availability_type = var.high_availability ? "REGIONAL" : "ZONAL"
    disk_size         = var.disk_size
    disk_type         = var.disk_type
    disk_autoresize   = var.disk_autoresize
    disk_autoresize_limit = var.disk_autoresize_limit

    # Backup configuration
    backup_configuration {
      enabled                        = var.backup_enabled
      start_time                     = var.backup_start_time
      point_in_time_recovery_enabled = var.point_in_time_recovery_enabled
      transaction_log_retention_days = 7
      backup_retention_settings {
        retained_backups = 30
        retention_unit   = "COUNT"
      }
    }

    # IP configuration
    ip_configuration {
      ipv4_enabled    = var.network_id == null ? true : false
      private_network = var.network_id
      require_ssl     = true

      # Allow connections from Cloud Shell for initial setup
      dynamic "authorized_networks" {
        for_each = var.network_id == null ? [1] : []
        content {
          name  = "allow-cloud-shell"
          value = "0.0.0.0/0"
        }
      }
    }

    # Maintenance window
    maintenance_window {
      day          = 7  # Sunday
      hour         = 2  # 2 AM
      update_track = "stable"
    }

    # Database flags
    database_flags {
      name  = "max_connections"
      value = "100"
    }

    database_flags {
      name  = "log_checkpoints"
      value = "on"
    }

    database_flags {
      name  = "log_connections"
      value = "on"
    }

    database_flags {
      name  = "log_disconnections"
      value = "on"
    }

    # Insights configuration for monitoring
    insights_config {
      query_insights_enabled  = true
      query_string_length     = 1024
      record_application_tags = true
      record_client_address   = true
    }
  }

  lifecycle {
    prevent_destroy = true
    ignore_changes = [
      settings[0].disk_size  # Allow auto-resize without Terraform changes
    ]
  }
}

# Create databases
resource "google_sql_database" "databases" {
  for_each = toset(var.databases)

  project  = var.project_id
  name     = each.value
  instance = google_sql_database_instance.main.name
  charset  = "UTF8"
  collation = "en_US.UTF8"
}

# Generate random passwords for default users
resource "random_password" "db_passwords" {
  for_each = toset(var.databases)

  length  = 32
  special = true
}

# Create users for each database
resource "google_sql_user" "db_users" {
  for_each = toset(var.databases)

  project  = var.project_id
  name     = "${each.value}_user"
  instance = google_sql_database_instance.main.name
  password = random_password.db_passwords[each.value].result
}

# Store passwords in Secret Manager
resource "google_secret_manager_secret" "db_passwords" {
  for_each = toset(var.databases)

  project   = var.project_id
  secret_id = "${var.instance_name}-${each.value}-password"

  replication {
    auto {}
  }

  labels = {
    database    = each.value
    managed_by  = "terraform"
    environment = var.environment
  }
}

resource "google_secret_manager_secret_version" "db_passwords" {
  for_each = toset(var.databases)

  secret      = google_secret_manager_secret.db_passwords[each.value].id
  secret_data = random_password.db_passwords[each.value].result
}
