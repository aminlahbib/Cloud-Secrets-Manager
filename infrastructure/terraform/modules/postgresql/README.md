# PostgreSQL Cloud SQL Module

Creates and manages Google Cloud SQL PostgreSQL instances with production-ready configuration.

## Features

- PostgreSQL 16 with automatic minor version upgrades
- Automated daily backups with point-in-time recovery
- High availability (optional regional configuration)
- Auto-scaling disk storage
- SSL/TLS encryption enforced
- Query insights for performance monitoring
- Automatic password generation and Secret Manager storage
- Multiple database support (secrets_db, audit_db)

## Usage

### Basic (Development)
```hcl
module "postgresql" {
  source = "../../modules/postgresql"

  project_id  = "cloud-secrets-manager"
  environment = "dev"
  
  tier                = "db-g1-small"
  high_availability   = false
  deletion_protection = false
}
```

### Production
```hcl
module "postgresql" {
  source = "../../modules/postgresql"

  project_id    = "cloud-secrets-manager"
  environment   = "production"
  instance_name = "secrets-manager-db"
  
  # Production sizing
  tier                      = "db-n1-standard-2"
  disk_size                 = 50
  disk_autoresize_limit     = 500
  
  # High availability
  high_availability         = true
  
  # Enhanced backups
  backup_enabled            = true
  backup_start_time         = "03:00"
  point_in_time_recovery_enabled = true
  
  # Security
  deletion_protection       = true
  network_id                = "projects/PROJECT_ID/global/networks/vpc-name"
  
  databases = ["secrets_db", "audit_db"]
}
```

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|----------|
| project_id | GCP project ID | string | - | yes |
| environment | Environment name | string | - | yes |
| region | GCP region | string | europe-west10 | no |
| tier | Machine tier | string | db-g1-small | no |
| high_availability | Enable HA | bool | false | no |
| deletion_protection | Protect from deletion | bool | true | no |
| databases | List of databases | list(string) | ["secrets_db", "audit_db"] | no |

## Outputs

| Name | Description |
|------|-------------|
| instance_connection_name | Cloud SQL Proxy connection name |
| instance_ip_address | IP address of instance |
| database_names | Created database names |
| password_secret_ids | Secret Manager IDs for passwords |
| connection_strings | JDBC connection strings |

## Connecting to the Database

### Via Cloud SQL Proxy (Recommended)
```bash
# Download Cloud SQL Proxy
wget https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64 -O cloud_sql_proxy
chmod +x cloud_sql_proxy

# Start proxy
./cloud_sql_proxy -instances=<INSTANCE_CONNECTION_NAME>=tcp:5432

# Connect (in another terminal)
psql "host=127.0.0.1 port=5432 dbname=secrets_db user=secrets_db_user"
```

### From Kubernetes
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secret-service
spec:
  containers:
  - name: app
    image: secret-service:latest
    env:
    - name: DB_HOST
      value: "127.0.0.1"
    - name: DB_PORT
      value: "5432"
  - name: cloud-sql-proxy
    image: gcr.io/cloudsql-docker/gce-proxy:latest
    command:
      - "/cloud_sql_proxy"
      - "-instances=<INSTANCE_CONNECTION_NAME>=tcp:5432"
```

## Password Retrieval

Passwords are auto-generated and stored in Secret Manager:

```bash
# Retrieve password
gcloud secrets versions access latest \
  --secret="secrets-manager-db-secrets_db-password"
```

## Notes

- Instance name includes random suffix to prevent conflicts
- Deletion protection is enabled by default in production
- Disk auto-resize is enabled to prevent storage issues
- Query insights are enabled for performance monitoring
