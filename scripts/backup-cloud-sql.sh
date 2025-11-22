#!/bin/bash

###############################################################################
# Cloud SQL Backup Script
#
# Creates on-demand backups of Cloud SQL database instances
# Supports both secrets and audit databases
#
# Usage: ./scripts/backup-cloud-sql.sh <instance-name> [description]
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
DESCRIPTION=${2:-"Manual backup $(date +%Y-%m-%d-%H%M%S)"}

if [ -z "$INSTANCE_NAME" ]; then
    echo -e "${RED}Error: Instance name required${NC}"
    echo "Usage: $0 <instance-name> [description]"
    echo ""
    echo "Available instances:"
    gcloud sql instances list --project=$PROJECT_ID --format="table(name,region)"
    exit 1
fi

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Cloud SQL Backup${NC}"
echo -e "${YELLOW}========================================${NC}"
echo -e "Project: ${GREEN}$PROJECT_ID${NC}"
echo -e "Region: ${GREEN}$REGION${NC}"
echo -e "Instance: ${GREEN}$INSTANCE_NAME${NC}"
echo -e "Description: ${GREEN}$DESCRIPTION${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Create backup
echo -e "${YELLOW}Creating backup...${NC}"
gcloud sql backups create \
    --instance=$INSTANCE_NAME \
    --description="$DESCRIPTION" \
    --project=$PROJECT_ID

# Wait for backup to complete
echo -e "${YELLOW}Waiting for backup to complete...${NC}"
sleep 10

# Get latest backup info
BACKUP_ID=$(gcloud sql backups list \
    --instance=$INSTANCE_NAME \
    --project=$PROJECT_ID \
    --limit=1 \
    --format="value(id)")

echo ""
echo -e "${GREEN}✓ Backup created successfully!${NC}"
echo -e "Backup ID: ${GREEN}$BACKUP_ID${NC}"

# Display backup details
echo ""
echo -e "${YELLOW}Backup Details:${NC}"
gcloud sql backups describe $BACKUP_ID \
    --instance=$INSTANCE_NAME \
    --project=$PROJECT_ID

# List recent backups
echo ""
echo -e "${YELLOW}Recent Backups (last 5):${NC}"
gcloud sql backups list \
    --instance=$INSTANCE_NAME \
    --project=$PROJECT_ID \
    --limit=5 \
    --format="table(id,windowStartTime,status,description)"

echo ""
echo -e "${GREEN}Backup complete!${NC}"
echo ""
echo "To restore from this backup:"
echo "  ./scripts/restore-cloud-sql.sh $INSTANCE_NAME $BACKUP_ID"

