terraform {
  required_version = ">= 1.5"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

# -------------------------------------------------------------------
# Cloud SQL PostgreSQL instance
# -------------------------------------------------------------------
resource "google_sql_database_instance" "this" {
  project             = var.project_id
  name                = var.instance_name
  region              = var.region
  database_version    = "POSTGRES_16"
  deletion_protection = var.deletion_protection

  settings {
    tier              = var.tier
    availability_type = var.high_availability ? "REGIONAL" : "ZONAL"
    disk_size         = var.disk_size
    disk_type         = "PD_SSD"
    disk_autoresize   = true

    ip_configuration {
      ipv4_enabled = true
      ssl_mode     = "ENCRYPTED_ONLY"
      # No authorized_networks — apps connect via Cloud SQL Auth Proxy
    }

    backup_configuration {
      enabled                        = var.backup_enabled
      start_time                     = "03:00"
      point_in_time_recovery_enabled = var.backup_enabled
      transaction_log_retention_days = 7
    }

    maintenance_window {
      day          = 7
      hour         = 3
      update_track = "stable"
    }

    insights_config {
      query_insights_enabled  = true
      query_string_length     = 1024
      record_application_tags = true
      record_client_address   = false
    }

    database_flags {
      name  = "log_checkpoints"
      value = "on"
    }

    database_flags {
      name  = "log_connections"
      value = "on"
    }
  }

  lifecycle {
    ignore_changes = [settings[0].disk_size]
  }
}

# -------------------------------------------------------------------
# Databases
# -------------------------------------------------------------------
resource "google_sql_database" "databases" {
  for_each = toset(var.databases)

  project   = var.project_id
  name      = each.value
  instance  = google_sql_database_instance.this.name
  charset   = "UTF8"
  collation = "en_US.UTF8"
}

# -------------------------------------------------------------------
# Users + passwords
# -------------------------------------------------------------------
resource "random_password" "db_passwords" {
  for_each = toset(var.databases)

  length  = 32
  special = false
}

resource "google_sql_user" "users" {
  for_each = toset(var.databases)

  project  = var.project_id
  name     = "${each.value}_user"
  instance = google_sql_database_instance.this.name
  password = random_password.db_passwords[each.value].result
}

# -------------------------------------------------------------------
# Store credentials in Secret Manager (for ESO to sync)
# -------------------------------------------------------------------
resource "google_secret_manager_secret" "db_passwords" {
  for_each = toset(var.databases)

  project   = var.project_id
  secret_id = "${var.instance_name}-${each.value}-password"

  replication {
    auto {}
  }

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }
}

resource "google_secret_manager_secret_version" "db_passwords" {
  for_each = toset(var.databases)

  secret      = google_secret_manager_secret.db_passwords[each.value].id
  secret_data = random_password.db_passwords[each.value].result
}

resource "google_secret_manager_secret" "db_users" {
  for_each = toset(var.databases)

  project   = var.project_id
  secret_id = "${var.instance_name}-${each.value}-user"

  replication {
    auto {}
  }

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }
}

resource "google_secret_manager_secret_version" "db_users" {
  for_each = toset(var.databases)

  secret      = google_secret_manager_secret.db_users[each.value].id
  secret_data = "${each.value}_user"
}
