#!/bin/bash
# =============================================================================
# Reset Local Development Database
# =============================================================================
# This script:
#   1. Drops and recreates the database
#   2. Runs all migrations
#   3. Optionally loads seed data
#
# Usage:
#   ./scripts/dev/reset-db.sh           # Reset with seed data
#   ./scripts/dev/reset-db.sh --no-seed # Reset without seed data
# =============================================================================

set -e

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-csm_dev}"
DB_USER="${DB_USER:-csm_user}"
DB_PASSWORD="${DB_PASSWORD:-csm_password}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse arguments
LOAD_SEEDS=true
if [[ "$1" == "--no-seed" ]]; then
    LOAD_SEEDS=false
fi

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DB_DIR="$PROJECT_ROOT/database"

echo -e "${YELLOW}=== Cloud Secrets Manager - Database Reset ===${NC}"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: psql is not installed${NC}"
    echo "Install PostgreSQL client or use Docker:"
    echo "  docker-compose exec postgres psql -U $DB_USER -d $DB_NAME"
    exit 1
fi

# Export password for psql
export PGPASSWORD="$DB_PASSWORD"

echo -e "${YELLOW}Connecting to PostgreSQL at $DB_HOST:$DB_PORT...${NC}"

# Drop and recreate database
echo -e "${YELLOW}Dropping database '$DB_NAME'...${NC}"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null || true

echo -e "${YELLOW}Creating database '$DB_NAME'...${NC}"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;"

# Run migrations
echo -e "${YELLOW}Running migrations...${NC}"
for migration in "$DB_DIR/migrations"/*.sql; do
    if [[ -f "$migration" ]]; then
        filename=$(basename "$migration")
        echo -e "  Running: $filename"
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration" -q
    fi
done

# Load seed data
if [[ "$LOAD_SEEDS" == true ]]; then
    echo -e "${YELLOW}Loading seed data...${NC}"
    if [[ -f "$DB_DIR/seeds/dev/sample_data.sql" ]]; then
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$DB_DIR/seeds/dev/sample_data.sql" -q
        echo -e "  Loaded: sample_data.sql"
    fi
else
    echo -e "${YELLOW}Skipping seed data (--no-seed)${NC}"
fi

# Summary
echo ""
echo -e "${GREEN}=== Database Reset Complete ===${NC}"
echo ""
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"
echo ""
echo "Connect with:"
echo "  psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"
echo ""
if [[ "$LOAD_SEEDS" == true ]]; then
    echo "Test users created:"
    echo "  - alice@example.com (Platform Admin)"
    echo "  - bob@example.com (Project Owner)"
    echo "  - charlie@example.com (Member)"
    echo "  - diana@example.com (Viewer)"
fi

