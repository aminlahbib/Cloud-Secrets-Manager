# Database

This directory contains all database-related files for Cloud Secrets Manager.

## Directory Structure

```
database/
├── migrations/           # SQL migration files (run in order)
│   ├── V001__initial_schema_v3.sql
│   └── V002__seed_functions.sql
├── seeds/                # Seed data for different environments
│   ├── dev/
│   │   └── sample_data.sql
│   └── test/
│       └── test_fixtures.sql
├── scripts/              # Database utility scripts
│   ├── reset-db.sh
│   └── backup-db.sh
└── README.md
```

## Schema Overview (Architecture v3)

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    users    │       │  workflows  │       │  projects   │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id          │──┐    │ id          │       │ id          │
│ firebase_uid│  │    │ user_id     │───────│ name        │
│ email       │  │    │ name        │       │ description │
│ platform_role│ │    │ is_default  │       │ created_by  │
└─────────────┘  │    └─────────────┘       │ is_archived │
                 │           │              └─────────────┘
                 │           ▼                     │
                 │    ┌─────────────────┐          │
                 │    │workflow_projects│          │
                 │    └─────────────────┘          │
                 │                                 │
                 │    ┌───────────────────┐        │
                 │    │project_memberships│        │
                 └───▶│ (OWNER/ADMIN/     │────────┤
                      │  MEMBER/VIEWER)   │        │
                      └───────────────────┘        │
                                                   │
                      ┌─────────────┐              │
                      │   secrets   │──────────────┘
                      └─────────────┘
                             │
                      ┌───────────────┐
                      │secret_versions│
                      └───────────────┘
```

## Key Concepts

### Users
- Authenticated via Firebase
- Have a `platform_role`: `USER` or `PLATFORM_ADMIN`
- Platform admins manage the system but can't access secrets without project membership

### Workflows
- Personal organization containers (like folders)
- Each user has their own workflows
- NOT shared - when you invite someone to a project, they organize it in their own workflows
- Every user gets a default "My Workflow" on signup

### Projects
- The core collaboration unit
- Contains secrets
- Members have roles: `OWNER`, `ADMIN`, `MEMBER`, `VIEWER`
- Support soft delete with 30-day grace period

### Secrets
- Encrypted key-value pairs
- Belong to exactly one project
- Keys are unique within a project (not globally)
- Have version history

## Running Migrations

### With Docker (Recommended)

Migrations run automatically when the postgres container starts:

```bash
cd docker
docker-compose up postgres
```

### Manually

```bash
# Connect to database
psql -h localhost -U csm_user -d csm_dev

# Run migrations in order
\i migrations/V001__initial_schema_v3.sql
\i migrations/V002__seed_functions.sql

# Load seed data (dev only)
\i seeds/dev/sample_data.sql
```

### With Flyway (Production)

```bash
flyway -url=jdbc:postgresql://localhost:5432/csm_dev \
       -user=csm_user \
       -password=csm_password \
       migrate
```

## Seed Data

### Development Seeds

Located in `seeds/dev/sample_data.sql`. Creates:

- 4 test users (Alice, Bob, Charlie, Diana)
- 4 projects with different sharing configurations
- Sample secrets
- Audit log entries

```bash
# Load dev seeds
psql -h localhost -U csm_user -d csm_dev -f seeds/dev/sample_data.sql
```

### Test Fixtures

Located in `seeds/test/`. Used for automated testing.

## Useful Queries

### List all projects for a user

```sql
SELECT p.*, pm.role
FROM projects p
JOIN project_memberships pm ON p.id = pm.project_id
WHERE pm.user_id = 'USER_UUID'
  AND p.is_archived = FALSE;
```

### List secrets in a project

```sql
SELECT s.secret_key, s.description, s.created_at, u.email as created_by
FROM secrets s
JOIN users u ON s.created_by = u.id
WHERE s.project_id = 'PROJECT_UUID';
```

### Check user's role in a project

```sql
SELECT role FROM project_memberships
WHERE project_id = 'PROJECT_UUID' AND user_id = 'USER_UUID';
```

### Get project member counts

```sql
SELECT * FROM get_project_role_counts('PROJECT_UUID');
```

## Reset Database

```bash
# Via Docker (removes volume)
docker-compose down -v
docker-compose up

# Via script
./scripts/reset-db.sh
```

## Backup & Restore

```bash
# Backup
pg_dump -h localhost -U csm_user csm_dev > backup.sql

# Restore
psql -h localhost -U csm_user csm_dev < backup.sql
```

