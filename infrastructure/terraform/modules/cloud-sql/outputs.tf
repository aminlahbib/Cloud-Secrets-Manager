output "instance_name" {
  description = "Cloud SQL instance name"
  value       = google_sql_database_instance.this.name
}

output "connection_name" {
  description = "Connection name for Cloud SQL Auth Proxy"
  value       = google_sql_database_instance.this.connection_name
}

output "database_names" {
  description = "Created database names"
  value       = [for db in google_sql_database.databases : db.name]
}

output "secret_ids" {
  description = "Map of database name to password + user secret IDs"
  value = {
    for db in var.databases : db => {
      password_secret = google_secret_manager_secret.db_passwords[db].secret_id
      user_secret     = google_secret_manager_secret.db_users[db].secret_id
    }
  }
}
