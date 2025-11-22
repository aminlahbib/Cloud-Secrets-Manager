# Terraform Operations Runbook

Day-2 operations guide for managing Cloud Secrets Manager infrastructure with Terraform.

---

## Daily Operations

### Checking Infrastructure Status

```bash
cd infrastructure/terraform/environments/dev

# View current state
terraform show

# List all resources
terraform state list

# Check for drift (differences between state and reality)
terraform plan -detailed-exitcode
# Exit code 0 = no changes, 1 = error, 2 = changes exist
```

### Making Configuration Changes

**Standard workflow:**

```bash
# 1. Create feature branch
git checkout -b feature/update-gke-nodes

# 2. Make changes
vi main.tf

# 3. Format
terraform fmt

# 4. Validate
terraform validate

# 5. Plan
terraform plan -out=tfplan

# 6. Review plan carefully
less tfplan  # or terraform show tfplan

# 7. Apply
terraform apply tfplan

# 8. Commit changes
git add .
git commit -m "Scale GKE nodes to 3"
git push
```

---

## Resource Scaling

### Scale GKE Nodes

```bash
# Edit main.tf
vi main.tf

# Change:
# min_node_count  = 1
# max_node_count  = 5

# To:
# min_node_count  = 2
# max_node_count  = 10

terraform apply
```

### Scale PostgreSQL

```bash
# Edit main.tf
vi main.tf

# Change tier
# tier = "db-g1-small"
# To:
# tier = "db-n1-standard-2"

terraform apply

# Note: This will cause downtime during migration
```

---

## Adding New Resources

### Add New Service Account

```bash
# Edit main.tf
vi main.tf

# Add to service_accounts map:
service_accounts = {
  # ... existing ...
  "monitoring-service-dev" = {
    display_name = "Monitoring Service (Dev)"
    description  = "Service account for monitoring"
    roles = [
      "roles/monitoring.metricWriter",
      "roles/logging.logWriter",
    ]
  }
}

terraform apply
```

### Add New Database

```bash
# Edit main.tf
vi main.tf

# Add to databases list:
databases = ["secrets_db", "audit_db", "analytics_db"]

terraform apply
```

---

## Disaster Recovery

### Backup State

```bash
# Manual backup
terraform state pull > backup-$(date +%Y%m%d).tfstate

# Verify backup
cat backup-$(date +%Y%m%d).tfstate | jq '.version'
```

### Restore from Backup

```bash
# List available versions
gsutil ls -a gs://cloud-secrets-manager-tfstate-dev/terraform/state/dev/

# Download specific version
gsutil cp gs://cloud-secrets-manager-tfstate-dev/terraform/state/dev/default.tfstate#1234567890 \
  ./restored-state.tfstate

# Push to remote state
terraform state push restored-state.tfstate

# Verify
terraform plan  # Should show no changes
```

### Recover Deleted Resource

```bash
# If you accidentally deleted a resource:

# 1. Find in state backup
cat backup.tfstate | jq '.resources[] | select(.name=="my_resource")'

# 2. Re-add to Terraform config
vi main.tf

# 3. Import from GCP
terraform import module.X.resource.name RESOURCE_ID

# 4. Verify
terraform plan  # Should show no changes
```

---

## Upgrading Infrastructure

### Upgrade Terraform Version

```bash
# Check current version
terraform version

# Upgrade (macOS)
brew upgrade terraform

# Re-initialize
cd infrastructure/terraform/environments/dev
terraform init -upgrade

# Verify
terraform plan
```

### Upgrade Provider Versions

```bash
# Edit provider.tf
vi provider.tf

# Change version constraint
# version = "~> 5.0"  # allows 5.x
# To:
# version = "~> 5.10"  # allows 5.10.x+

# Re-initialize
terraform init -upgrade

# Test
terraform plan
```

### Upgrade Kubernetes Version

```bash
# Via Terraform
vi main.tf

# GKE auto-upgrades within maintenance window
# To force upgrade:
# Change release_channel if needed

terraform apply
```

---

## Monitoring and Alerts

### Cost Monitoring

```bash
# View projected costs (requires Infracost)
infracost breakdown --path .

# Compare changes
terraform plan -out=tfplan
infracost diff --path=tfplan
```

### Resource Usage

```bash
# GKE nodes
kubectl top nodes

# GKE pods
kubectl top pods --all-namespaces

# Database connections
gcloud sql operations list --instance=INSTANCE_NAME

# Check disk usage
gcloud sql instances describe INSTANCE_NAME \
  --format="value(settings.dataDiskSizeGb, currentDiskSize)"
```

---

## Security Operations

### Rotate Service Account Keys

```bash
# Create new key
gcloud iam service-accounts keys create new-key.json \
  --iam-account=secret-service-dev@PROJECT_ID.iam.gserviceaccount.com

# Update Kubernetes secret
kubectl create secret generic gcp-key \
  --from-file=key.json=new-key.json \
  --dry-run=client -o yaml | kubectl apply -f -

# Delete old key
gcloud iam service-accounts keys delete KEY_ID \
  --iam-account=secret-service-dev@PROJECT_ID.iam.gserviceaccount.com
```

### Rotate Database Passwords

```bash
# Get current password from Secret Manager
gcloud secrets versions access latest --secret=INSTANCE-secrets_db-password

# Generate new password
NEW_PASSWORD=$(openssl rand -base64 32)

# Update in Cloud SQL
gcloud sql users set-password secrets_db_user \
  --instance=INSTANCE_NAME \
  --password="$NEW_PASSWORD"

# Update Secret Manager
echo -n "$NEW_PASSWORD" | gcloud secrets versions add INSTANCE-secrets_db-password --data-file=-

# Update application configuration
kubectl set env deployment/secret-service DB_PASSWORD="$NEW_PASSWORD"
```

---

## Troubleshooting

### Resource Not Found

```bash
# Refresh state
terraform refresh

# Re-import if needed
terraform import module.X.resource.name RESOURCE_ID
```

### Plan Shows Unexpected Changes

```bash
# View detailed diff
terraform plan -no-color > plan.txt
less plan.txt

# Check for manual changes in GCP
gcloud <resource-type> describe <resource-name>

# Refresh state
terraform refresh
terraform plan
```

### State Lock Error

```bash
# Check lock info (in error message)

# If safe to unlock:
terraform force-unlock LOCK_ID

# To prevent locks:
# - Don't run Terraform concurrently
# - Use CI/CD pipeline
# - Enable state locking logs
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Terraform
on:
  pull_request:
    paths:
      - 'infrastructure/terraform/**'

jobs:
  plan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
      
      - name: Terraform Init
        run: terraform init
        working-directory: infrastructure/terraform/environments/dev
        
      - name: Terraform Plan
        run: terraform plan -no-color
        working-directory: infrastructure/terraform/environments/dev
        env:
          GOOGLE_CREDENTIALS: ${{ secrets.GCP_SA_KEY }}
```

---

## Maintenance Windows

### Planned Maintenance

```bash
# 1. Notify team
# 2. Create backup
terraform state pull > backup-maintenance-$(date +%Y%m%d).tfstate

# 3. Apply changes
terraform apply

# 4. Verify
terraform plan  # Should show no changes
kubectl get pods --all-namespaces

# 5. Monitor
kubectl logs -f deployment/secret-service
```

### Emergency Rollback

```bash
# 1. Identify issue
kubectl describe pod POD_NAME

# 2. Restore state
gsutil ls -a gs://cloud-secrets-manager-tfstate-dev/terraform/state/dev/
gsutil cp gs://...#VERSION ./rollback.tfstate
terraform state push rollback.tfstate

# 3. Apply
terraform apply

# 4. Verify
terraform plan
kubectl get pods
```

---

## Best Practices

✅ **Do:**
- Always create backups before major changes
- Use `terraform plan` before every `apply`
- Enable deletion protection for production
- Use separate environments (dev/staging/prod)
- Document all manual changes
- Review Terraform plans in PRs

❌ **Don't:**
- Make manual changes in GCP console
- Run Terraform concurrently
- Skip backups
- Force-unlock without investigation
- Commit `.tfvars` files
- Use `terraform destroy` without approval

---

## Emergency Contacts

| Issue | Contact | Action |
|-------|---------|--------|
| State corrupted | DevOps Lead | Restore from backup |
| Unable to access GCP | IT Security | Check IAM permissions |
| Cost spike | FinOps Team | Review resource usage |
| Production outage | On-call Engineer | Check runbooks |

---

## Additional Resources

- [Terraform Docs](https://www.terraform.io/docs)
- [Google Provider Docs](https://registry.terraform.io/providers/hashicorp/google/latest/docs)
- [GCP Best Practices](https://cloud.google.com/docs/terraform/best-practices-for-terraform)
- [Terraform Guide](./TERRAFORM_GUIDE.md)
