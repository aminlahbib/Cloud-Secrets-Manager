#!/bin/bash

# =============================================================================
# Script to Restart Audit Service with Flyway Migration
# =============================================================================

set -e

echo "=========================================="
echo "Restarting Audit Service"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running in IDE (IntelliJ/Eclipse) or via Maven
if pgrep -f "AuditServiceApplication" > /dev/null; then
    echo -e "${YELLOW}Audit Service is currently running.${NC}"
    echo "Please stop it first, then restart to apply the migration."
    echo ""
    echo "To stop: Find the process and kill it, or stop it from your IDE"
    echo "To restart: Run the service again from your IDE or:"
    echo "  cd apps/backend/audit-service"
    echo "  mvn spring-boot:run"
    exit 0
fi

# Check if we're in the project root
if [ ! -f "pom.xml" ]; then
    echo -e "${RED}Error: Please run this script from the project root directory${NC}"
    exit 1
fi

# Navigate to audit-service directory
cd apps/backend/audit-service

echo -e "${GREEN}Starting Audit Service with Flyway migration...${NC}"
echo ""

# Run the service
mvn spring-boot:run

