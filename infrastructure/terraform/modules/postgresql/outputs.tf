output "instance_name" {
  description = "Name of the Cloud SQL instance"
  value       = google_sql_database_instance.main.name
}

output "instance_connection_name" {
  description = "Connection name for Cloud SQL Proxy"
  value       = google_sql_database_instance.main.connection_name
}

output "instance_ip_address" {
  description = "IP address of the Cloud SQL instance"
  value       = google_sql_database_instance.main.ip_address[0].ip_address
}

output "instance_self_link" {
  description = "Self link to the instance"
  value       = google_sql_database_instance.main.self_link
}

output "database_names" {
  description = "Names of created databases"
  value       = [for db in google_sql_database.databases : db.name]
}

output "database_users" {
  description = "Database usernames (passwords stored in Secret Manager)"
  value       = {
    for db_name, user in google_sql_user.db_users : db_name => user.name
  }
}

output "password_secret_ids" {
  description = "Secret Manager secret IDs containing database passwords"
  value       = {
    for db_name, secret in google_secret_manager_secret.db_passwords : db_name => secret.id
  }
  sensitive = true
}

output "connection_strings" {
  description = "JDBC connection strings for each database"
  value = {
    for db_name in var.databases : db_name => 
      "jdbc:postgresql://${google_sql_database_instance.main.ip_address[0].ip_address}:5432/${db_name}"
  }
}
