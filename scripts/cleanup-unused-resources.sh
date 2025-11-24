#!/bin/bash

echo "Checking for unused resources..."

# List all VMs
echo "VMs:"
gcloud compute instances list

# List all disks
echo "Disks:"
gcloud compute disks list

# List all snapshots
echo "Snapshots:"
gcloud compute snapshots list

# List all clusters
echo "Clusters:"
gcloud container clusters list

# List all SQL instances
echo "SQL Instances:"
gcloud sql instances list
