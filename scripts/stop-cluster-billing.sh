#!/bin/bash

# Script to stop GKE cluster billing by scaling down nodes or deleting the cluster
# This will stop VM instance billing immediately

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration (update these based on your setup)
PROJECT_ID="${GCP_PROJECT_ID:-cloud-secrets-manager}"
CLUSTER_NAME="${GKE_CLUSTER_NAME:-cloud-secrets-cluster-dev}"
REGION="${GKE_REGION:-europe-west10}"
NODE_POOL_NAME="${NODE_POOL_NAME:-cloud-secrets-cluster-dev-node-pool}"

echo -e "${YELLOW}=== GKE Cluster Billing Management ===${NC}"
echo ""
echo "Project ID: $PROJECT_ID"
echo "Cluster: $CLUSTER_NAME"
echo "Region: $REGION"
echo "Node Pool: $NODE_POOL_NAME"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed${NC}"
    echo "Install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if kubectl is installed (needed for some operations)
if ! command -v kubectl &> /dev/null; then
    echo -e "${YELLOW}Warning: kubectl is not installed. Some operations may fail.${NC}"
fi

# Set the project
echo -e "${GREEN}Setting GCP project...${NC}"
gcloud config set project "$PROJECT_ID"

# Function to scale down node pool to 0
scale_down_nodes() {
    echo -e "${YELLOW}Scaling down node pool to 0 nodes...${NC}"
    echo "This will stop all VM instances and stop billing for compute resources."
    echo "The cluster will remain but no nodes will run."
    echo ""
    
    # First, scale down any running deployments to avoid issues
    if command -v kubectl &> /dev/null; then
        echo -e "${GREEN}Checking if cluster is accessible...${NC}"
        if gcloud container clusters get-credentials "$CLUSTER_NAME" --region="$REGION" --project="$PROJECT_ID" 2>/dev/null; then
            echo -e "${GREEN}Scaling down deployments to 0 replicas...${NC}"
            kubectl scale deployment --all --replicas=0 --all-namespaces 2>/dev/null || true
            echo -e "${GREEN}Waiting for pods to terminate...${NC}"
            sleep 10
        fi
    fi
    
    # Update node pool autoscaling to allow 0 nodes
    echo -e "${GREEN}Updating node pool autoscaling (min=0, max=0)...${NC}"
    gcloud container node-pools update "$NODE_POOL_NAME" \
        --cluster="$CLUSTER_NAME" \
        --region="$REGION" \
        --enable-autoscaling \
        --min-nodes=0 \
        --max-nodes=0 \
        --project="$PROJECT_ID" || {
        echo -e "${RED}Failed to update autoscaling. Trying to resize node pool directly...${NC}"
        gcloud container clusters resize "$CLUSTER_NAME" \
            --node-pool="$NODE_POOL_NAME" \
            --num-nodes=0 \
            --region="$REGION" \
            --project="$PROJECT_ID" || {
            echo -e "${RED}Error: Could not scale down nodes. You may need to do this manually in the GCP Console.${NC}"
            echo "Go to: GKE > Clusters > $CLUSTER_NAME > Nodes > $NODE_POOL_NAME"
            exit 1
        }
    }
    
    echo -e "${GREEN}✓ Node pool scaled down to 0 nodes${NC}"
    echo -e "${GREEN}✓ VM billing has stopped${NC}"
    echo ""
    echo -e "${YELLOW}Note: The cluster control plane will still incur minimal charges (~$70/month)${NC}"
    echo "To stop all billing, delete the cluster entirely (option 2)."
}

# Function to delete the entire cluster
delete_cluster() {
    echo -e "${RED}WARNING: This will DELETE the entire GKE cluster!${NC}"
    echo "This action cannot be undone."
    echo ""
    echo "This will delete:"
    echo "  - All VM instances (nodes)"
    echo "  - The cluster control plane"
    echo "  - All workloads running on the cluster"
    echo ""
    read -p "Are you sure you want to delete the cluster? (type 'yes' to confirm): " confirm
    
    if [ "$confirm" != "yes" ]; then
        echo "Cancelled."
        exit 0
    fi
    
    echo -e "${YELLOW}Deleting cluster: $CLUSTER_NAME...${NC}"
    gcloud container clusters delete "$CLUSTER_NAME" \
        --region="$REGION" \
        --project="$PROJECT_ID" \
        --quiet || {
        echo -e "${RED}Error: Could not delete cluster.${NC}"
        echo "You may need to:"
        echo "  1. Disable deletion protection in GCP Console"
        echo "  2. Delete the cluster manually"
        exit 1
    }
    
    echo -e "${GREEN}✓ Cluster deleted successfully${NC}"
    echo -e "${GREEN}✓ All billing has stopped${NC}"
}

# Function to check current status
check_status() {
    echo -e "${GREEN}Checking cluster status...${NC}"
    echo ""
    
    # Get cluster info
    gcloud container clusters describe "$CLUSTER_NAME" \
        --region="$REGION" \
        --project="$PROJECT_ID" \
        --format="table(name,status,location,currentNodeCount)" 2>/dev/null || {
        echo -e "${RED}Cluster not found or not accessible${NC}"
        exit 1
    }
    
    echo ""
    echo -e "${GREEN}Node pool status:${NC}"
    gcloud container node-pools describe "$NODE_POOL_NAME" \
        --cluster="$CLUSTER_NAME" \
        --region="$REGION" \
        --project="$PROJECT_ID" \
        --format="table(name,initialNodeCount,autoscaling.minNodeCount,autoscaling.maxNodeCount,status)" 2>/dev/null || {
        echo -e "${YELLOW}Could not get node pool details${NC}"
    }
    
    echo ""
    echo -e "${GREEN}Current VM instances:${NC}"
    gcloud compute instances list \
        --filter="name~gke-$CLUSTER_NAME" \
        --project="$PROJECT_ID" \
        --format="table(name,zone,status,machineType)" 2>/dev/null || {
        echo -e "${YELLOW}Could not list VM instances${NC}"
    }
}

# Main menu
echo "What would you like to do?"
echo ""
echo "1) Scale down node pool to 0 (stops VM billing, keeps cluster)"
echo "2) Delete entire cluster (stops ALL billing)"
echo "3) Check current status"
echo "4) Exit"
echo ""
read -p "Enter your choice [1-4]: " choice

case $choice in
    1)
        scale_down_nodes
        ;;
    2)
        delete_cluster
        ;;
    3)
        check_status
        ;;
    4)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}Done!${NC}"

