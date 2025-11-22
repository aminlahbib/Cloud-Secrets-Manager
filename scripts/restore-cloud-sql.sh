#!/bin/bash

###############################################################################
# Cloud SQL Restore Script
#
# Restores Cloud SQL database from backup
# Includes safety checks and confirmation prompts
#
# Usage: ./scripts/restore-cloud-sql.sh <instance-name> <backup-id>
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
PROJECT_ID="cloud-secrets-manager"
REGION="europe-west10"

INSTANCE_NAME=${1}
BACKUP_ID=${2}

if [ -z "$INSTANCE_NAME" ] || [ -z "$BACKUP_ID" ]; then
    echo -e "${RED}Error: Instance name and backup ID required${NC}"
    echo "Usage: $0 <instance-name> <backup-id>"
    echo ""
    echo "Available backups:"
    if [ -n "$INSTANCE_NAME" ]; then
        gcloud sql backups list \
            --instance=$INSTANCE_NAME \
            --project=$PROJECT_ID \
            --format="table(id,windowStartTime,status,description)"
    fi
    exit 1
fi

echo -e "${RED}========================================${NC}"
echo -e "${RED}WARNING: DATABASE RESTORE${NC}"
echo -e "${RED}========================================${NC}"
echo -e "Project: ${YELLOW}$PROJECT_ID${NC}"
echo -e "Instance: ${YELLOW}$INSTANCE_NAME${NC}"
echo -e "Backup ID: ${YELLOW}$BACKUP_ID${NC}"
echo ""
echo -e "${RED}This will OVERWRITE the current database!${NC}"
echo -e "${RED}All current data will be LOST!${NC}"
echo ""

# Get backup info
echo -e "${YELLOW}Backup Details:${NC}"
gcloud sql backups describe $BACKUP_ID \
    --instance=$INSTANCE_NAME \
    --project=$PROJECT_ID

echo ""
read -p "Are you sure you want to continue? Type 'YES' to proceed: " confirmation

if [ "$confirmation" != "YES" ]; then
    echo -e "${YELLOW}Restore cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}Starting restore...${NC}"

# Perform restore
gcloud sql backups restore $BACKUP_ID \
    --backup-instance=$INSTANCE_NAME \
    --backup-project=$PROJECT_ID \
    --project=$PROJECT_ID

echo ""
echo -e "${GREEN}✓ Restore initiated!${NC}"
echo ""
echo -e "${YELLOW}Monitoring restore progress...${NC}"
echo "This may take several minutes..."

# Wait and check status
sleep 30

echo ""
echo -e "${YELLOW}Instance status:${NC}"
gcloud sql instances describe $INSTANCE_NAME \
    --project=$PROJECT_ID \
    --format="table(name,state,settings.tier)"

echo ""
echo -e "${GREEN}Restore process started!${NC}"
echo ""
echo "Next steps:"
echo "1. Monitor instance status: gcloud sql operations list --instance=$INSTANCE_NAME"
echo "2. Verify application connectivity"
echo "3. Run data integrity checks"
echo "4. Update documentation with restore details"

