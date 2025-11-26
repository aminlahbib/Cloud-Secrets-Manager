# Directory Structure Migration Guide

This guide explains the new directory structure and what files need to be moved/deleted.

## New Structure Overview

```
Cloud Secrets Manager/
│
├── apps/                          # ✅ UNCHANGED - Application code
│   ├── backend/
│   └── frontend/
│
├── database/                      # 🆕 NEW - Promoted to root
│   ├── migrations/                # V3 architecture schema
│   ├── seeds/
│   │   └── dev/
│   └── README.md
│
├── docker/                        # 🆕 NEW - Local development
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   ├── env.example
│   └── README.md
│
├── docs/                          # ✅ UNCHANGED
│
├── testing/                       # ✅ UNCHANGED
│
├── scripts/                       # 📝 REORGANIZED
│   ├── dev/                       # 🆕 Local dev scripts
│   │   ├── reset-db.sh
│   │   └── start-local.sh
│   └── ... (existing scripts)
│
├── infrastructure/                # 📝 REORGANIZED - Now contains all infra
│   ├── terraform/                 # ✅ Unchanged
│   ├── kubernetes/                # ✅ Unchanged (contains helm/)
│   ├── gcp/                       # ✅ Unchanged
│   ├── ci-cd/                     # 🆕 MOVED from deployment/
│   ├── monitoring/                # 🆕 MOVED from root
│   ├── security/                  # 🆕 MOVED from root
│   └── README.md                  # 📝 Updated
│
└── ... (other root files)
```

## Migration Steps

### Step 1: Files Already Created (Done)

The following NEW files have been created:

```
✅ docker/docker-compose.yml
✅ docker/docker-compose.dev.yml
✅ docker/env.example
✅ docker/README.md
✅ database/migrations/V001__initial_schema_v3.sql
✅ database/migrations/V002__seed_functions.sql
✅ database/seeds/dev/sample_data.sql
✅ database/README.md
✅ scripts/dev/reset-db.sh
✅ scripts/dev/start-local.sh
✅ infrastructure/README.md (updated)
✅ infrastructure/monitoring/README.md
✅ infrastructure/security/README.md
✅ infrastructure/ci-cd/README.md
```

### Step 2: Files to MOVE (Manual)

Run these commands to move files:

```bash
cd "Cloud Secrets Manager"

# Move monitoring to infrastructure
mv monitoring/alerts infrastructure/monitoring/
mv monitoring/grafana infrastructure/monitoring/
mv monitoring/servicemonitors infrastructure/monitoring/
mv monitoring/tracing infrastructure/monitoring/

# Move security to infrastructure
mv security/policies infrastructure/security/
mv security/scans infrastructure/security/

# Move CI/CD to infrastructure
mv deployment/ci-cd/* infrastructure/ci-cd/
mv deployment/scripts/* infrastructure/ci-cd/scripts/
```

### Step 3: Files to DELETE (Manual)

After moving, delete the old directories:

```bash
cd "Cloud Secrets Manager"

# Remove old root-level directories (now empty or redundant)
rm -rf monitoring/
rm -rf security/
rm -rf deployment/

# Remove old infrastructure/docker (replaced by root docker/)
rm -rf infrastructure/docker/

# Remove old database migrations (replaced by v3 schema)
rm -rf infrastructure/database/
```

### Step 4: Update .gitignore

Add these entries to `.gitignore`:

```gitignore
# Local environment files
docker/.env.local
.env.local

# Database
*.sql.backup

# IDE
.idea/
.vscode/

# Keys (already should be ignored)
infrastructure/gcp/keys/*.json
```

### Step 5: Verify Structure

After migration, your structure should look like:

```
Cloud Secrets Manager/
├── apps/
│   ├── backend/
│   │   ├── audit-service/
│   │   └── secret-service/
│   └── frontend/
├── database/
│   ├── migrations/
│   ├── seeds/
│   └── README.md
├── docker/
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   ├── env.example
│   └── README.md
├── docs/
├── infrastructure/
│   ├── ci-cd/
│   ├── gcp/
│   ├── kubernetes/
│   ├── monitoring/
│   ├── security/
│   └── terraform/
├── scripts/
│   ├── dev/
│   └── ... (other scripts)
├── testing/
└── tools/
```

## Quick Start After Migration

```bash
# 1. Set up environment
cd docker
cp env.example .env.local
# Edit .env.local with your Firebase credentials

# 2. Start services
docker-compose up

# 3. (Optional) Reset database with seed data
cd ../scripts/dev
chmod +x reset-db.sh
./reset-db.sh
```

## Notes

- The old `infrastructure/database/migrations/` contained migrations for the OLD global RBAC architecture
- The new `database/migrations/` contains the V3 Resource-Scoped RBAC schema
- Old Docker compose was in `infrastructure/docker/` - now it's at `docker/` for easier access
- All production/cloud infrastructure remains under `infrastructure/`

