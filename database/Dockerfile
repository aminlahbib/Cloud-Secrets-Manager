# =============================================================================
# Cloud Secrets Manager - PostgreSQL Database Dockerfile
# =============================================================================
# Custom PostgreSQL image with initialization scripts
# =============================================================================

FROM postgres:16-alpine

# Set environment variables
ENV POSTGRES_DB=secrets
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres

# Copy initialization scripts
# Scripts in /docker-entrypoint-initdb.d/ are executed automatically
# in alphabetical order when the database is first initialized
COPY init/ /docker-entrypoint-initdb.d/

# Set proper permissions for init scripts
RUN chmod -R 755 /docker-entrypoint-initdb.d/

# Expose PostgreSQL port
EXPOSE 5432

# Use the default PostgreSQL entrypoint
# This will automatically run scripts in /docker-entrypoint-initdb.d/
# when the data directory is empty (first initialization)

