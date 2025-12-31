# Database Directory

This directory contains the database initialization scripts and Docker configuration.

## Structure

```
database/
├── Dockerfile              # Custom PostgreSQL image with init scripts
├── init/                   # Initialization scripts (executed in order)
│   ├── 01-init-database.sql    # Creates user and grants permissions
│   └── 02-schema-migrations.sql # Creates complete database schema
└── README.md               # This file
```

## Initialization Scripts

The scripts in `init/` are executed automatically when the PostgreSQL container is first created. They run in alphabetical order:

1. **01-init-database.sql**: 
   - Creates `secret_user` with password `secret_pw`
   - Grants all necessary permissions
   - Enables required PostgreSQL extensions (uuid-ossp, pgcrypto)

2. **02-schema-migrations.sql**:
   - Creates all database tables
   - Sets up indexes and constraints
   - Defines the complete schema for the application

## Usage

### Using Docker Compose

The database is automatically built and initialized when you run:

```bash
docker-compose -f docker/docker-compose.yml up postgres
```

### Building the Database Image Manually

```bash
cd database
docker build -t csm-postgres:latest .
```

### Running the Database Container

```bash
docker run -d \
  --name csm-db \
  -e POSTGRES_DB=secrets \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  csm-postgres:latest
```

## Database Credentials

- **Database Name**: `secrets`
- **Superuser**: `postgres` / `postgres`
- **Application User**: `secret_user` / `secret_pw`

## Important Notes

1. **First Initialization Only**: Init scripts only run when the database data directory is empty
2. **To Reinitialize**: Remove the Docker volume: `docker-compose down -v`
3. **Script Order**: Scripts are executed in alphabetical order (01, 02, ...)
4. **Permissions**: All scripts must be executable (755)

## Schema Management

- **Initial Schema**: Defined in `init/02-schema-migrations.sql`
- **Future Migrations**: Managed by Flyway in the backend services
- **Development**: Use `SPRING_JPA_HIBERNATE_DDL_AUTO=update` for auto-updates (not recommended for production)

## Troubleshooting

### Database Not Initializing

1. Check if the volume already exists (init scripts won't run)
2. Remove volume: `docker-compose down -v`
3. Check logs: `docker-compose logs postgres`

### Permission Errors

1. Ensure scripts are executable: `chmod 755 init/*.sql`
2. Check file ownership in the container

### Connection Issues

1. Verify credentials match in `docker-compose.yml`
2. Check if database is ready: `docker-compose exec postgres pg_isready -U postgres`
3. Test connection: `docker-compose exec postgres psql -U secret_user -d secrets`
