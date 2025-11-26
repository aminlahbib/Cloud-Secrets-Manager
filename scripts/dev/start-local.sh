#!/bin/bash
# =============================================================================
# Start Local Development Environment
# =============================================================================
# Quick start script for local development.
#
# Usage:
#   ./scripts/dev/start-local.sh           # Start all services
#   ./scripts/dev/start-local.sh --build   # Rebuild and start
#   ./scripts/dev/start-local.sh --dev     # Start with dev overrides (hot reload)
# =============================================================================

set -e

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DOCKER_DIR="$PROJECT_ROOT/docker"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Parse arguments
BUILD=""
DEV_MODE=""
for arg in "$@"; do
    case $arg in
        --build)
            BUILD="--build"
            ;;
        --dev)
            DEV_MODE="-f docker-compose.yml -f docker-compose.dev.yml"
            ;;
    esac
done

echo -e "${YELLOW}=== Cloud Secrets Manager - Local Development ===${NC}"
echo ""

# Check for .env.local
if [[ ! -f "$DOCKER_DIR/.env.local" ]]; then
    echo -e "${YELLOW}No .env.local found. Creating from template...${NC}"
    cp "$DOCKER_DIR/env.example" "$DOCKER_DIR/.env.local"
    echo -e "${YELLOW}Please edit docker/.env.local with your Firebase credentials${NC}"
    echo ""
fi

# Change to docker directory
cd "$DOCKER_DIR"

# Start services
echo -e "${GREEN}Starting services...${NC}"
if [[ -n "$DEV_MODE" ]]; then
    echo "Mode: Development (with hot reload, pgAdmin)"
    docker-compose $DEV_MODE up $BUILD
else
    echo "Mode: Standard"
    docker-compose up $BUILD
fi

