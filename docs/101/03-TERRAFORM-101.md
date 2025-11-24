# Terraform 101: Infrastructure as Code

## Table of Contents
1. [What is Terraform?](#what-is-terraform)
2. [Why Infrastructure as Code?](#why-infrastructure-as-code)
3. [Core Concepts](#core-concepts)
4. [Installation](#installation)
5. [Your First Terraform Configuration](#your-first-terraform-configuration)
6. [State Management](#state-management)
7. [Modules](#modules)
8. [Hands-on Exercises](#hands-on-exercises)
9. [Best Practices](#best-practices)

---

## What is Terraform?

**Terraform** is an Infrastructure as Code (IaC) tool that lets you define and provision cloud infrastructure using declarative configuration files.

### The Problem Terraform Solves

**Without Terraform:**
```
You: "I need a GKE cluster, Cloud SQL database, and VPC network"
You: *Clicks through GCP Console for 2 hours*
You: *Takes screenshots to remember settings*
You: *Tries to recreate in another project*
You: *Forgets a setting, something breaks*
You: *Can't reproduce the exact setup*
```

**With Terraform:**
```hcl
# Define infrastructure in code
resource "google_container_cluster" "primary" {
  name     = "my-cluster"
  location = "us-central1"
}

# Apply it
terraform apply

# Same infrastructure, every time
# Version controlled
# Reproducible
# Documented
```

---

## Why Infrastructure as Code?

### Benefits

1. **Version Control**: Track changes to infrastructure like code
2. **Reproducibility**: Same infrastructure every time
3. **Documentation**: Code is self-documenting
4. **Collaboration**: Multiple people can work on infrastructure
5. **Testing**: Test infrastructure changes before applying
6. **Disaster Recovery**: Recreate infrastructure from code
7. **Cost Management**: See what resources will be created

### Terraform vs Alternatives

| Tool | Type | Best For |
|------|------|----------|
| **Terraform** | Declarative, Multi-cloud | GCP, AWS, Azure, etc. |
| **CloudFormation** | Declarative, AWS-only | AWS-only projects |
| **Ansible** | Imperative, Configuration | Server configuration |
| **Pulumi** | Code-based (Python/JS) | Developers who prefer code |

---

## Core Concepts

### 1. Provider
A **provider** is a plugin that interacts with a cloud platform.

```hcl
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = "my-project-id"
  region  = "us-central1"
}
```

### 2. Resource
A **resource** is a component of your infrastructure.

```hcl
resource "google_compute_instance" "vm" {
  name         = "my-vm"
  machine_type = "e2-medium"
  zone         = "us-central1-a"
  
  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-11"
    }
  }
}
```

### 3. Variable
**Variables** make configurations reusable.

```hcl
variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}
```

### 4. Output
**Outputs** expose information about created resources.

```hcl
output "cluster_endpoint" {
  value       = google_container_cluster.primary.endpoint
  description = "GKE cluster endpoint"
}
```

### 5. State
**State** tracks what Terraform has created.

- Stored in `terraform.tfstate`
- Maps resources to real infrastructure
- Used to plan changes

---

## Installation

### macOS
```bash
brew install terraform
```

### Linux
```bash
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/
```

### Windows
```powershell
choco install terraform
```

### Verify Installation
```bash
terraform version
```

### Install GCP Provider
Terraform will download providers automatically, but you need:

1. **Google Cloud SDK**
```bash
# macOS
brew install google-cloud-sdk

# Initialize
gcloud init
gcloud auth application-default login
```

2. **Service Account** (for automation)
```bash
# Create service account
gcloud iam service-accounts create terraform \
  --display-name="Terraform Service Account"

# Grant permissions
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:terraform@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/editor"
```

---

## Your First Terraform Configuration

### Step 1: Create Project Structure

```bash
mkdir terraform-learning
cd terraform-learning
```

### Step 2: Create main.tf

```hcl
terraform {
  required_version = ">= 1.5"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = "your-project-id"  # Replace with your project
  region  = "us-central1"
}

# Create a simple VM
resource "google_compute_instance" "vm" {
  name         = "my-first-vm"
  machine_type = "e2-micro"  # Free tier eligible
  zone         = "us-central1-a"

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-11"
    }
  }

  network_interface {
    network = "default"
    access_config {
      // Ephemeral public IP
    }
  }

  labels = {
    environment = "learning"
    managed_by  = "terraform"
  }
}
```

### Step 3: Initialize Terraform

```bash
terraform init
```

This downloads the Google provider and sets up the backend.

### Step 4: Plan Changes

```bash
terraform plan
```

This shows what Terraform will create without actually creating it.

### Step 5: Apply Configuration

```bash
terraform apply
```

Type `yes` when prompted. Terraform will create the VM.

### Step 6: Verify

```bash
# List VMs
gcloud compute instances list

# Or use Terraform
terraform show
```

### Step 7: Destroy Resources

```bash
terraform destroy
```

This removes all resources created by Terraform.

---

## State Management

### Local State (Default)

State is stored in `terraform.tfstate` locally.

**Pros:**
- Simple
- Fast
- Good for learning

**Cons:**
- Not shared
- Can be lost
- Not suitable for teams

### Remote State (Recommended for Teams)

Store state in Google Cloud Storage:

```hcl
terraform {
  backend "gcs" {
    bucket = "my-terraform-state"
    prefix = "terraform/state"
  }
}
```

**Benefits:**
- Shared state
- State locking (prevents conflicts)
- Version history
- Secure

### State Commands

```bash
# Show state
terraform show

# List resources in state
terraform state list

# Inspect specific resource
terraform state show google_compute_instance.vm

# Remove resource from state (doesn't delete it)
terraform state rm google_compute_instance.vm

# Import existing resource
terraform import google_compute_instance.vm projects/PROJECT/zones/ZONE/instances/NAME
```

---

## Modules

**Modules** are reusable Terraform configurations.

### Using Modules

```hcl
module "gke_cluster" {
  source = "./modules/gke-cluster"
  
  project_id   = var.project_id
  cluster_name = "my-cluster"
  region       = "us-central1"
  node_count   = 3
}
```

### Creating Modules

Create `modules/gke-cluster/main.tf`:

```hcl
variable "project_id" {
  type = string
}

variable "cluster_name" {
  type = string
}

variable "region" {
  type = string
}

variable "node_count" {
  type = number
  default = 1
}

resource "google_container_cluster" "primary" {
  name     = var.cluster_name
  location = var.region
  project  = var.project_id
  
  initial_node_count = var.node_count
}

output "cluster_endpoint" {
  value = google_container_cluster.primary.endpoint
}
```

### Public Modules

Use modules from Terraform Registry:

```hcl
module "gke" {
  source  = "terraform-google-modules/kubernetes-engine/google"
  version = "~> 30.0"
  
  project_id        = var.project_id
  name              = "my-cluster"
  region            = "us-central1"
  network           = "default"
  subnetwork        = "default"
  ip_range_pods     = "pods"
  ip_range_services = "services"
}
```

---

## Hands-on Exercises

### Exercise 1: Create Multiple Resources

```hcl
# Create 3 VMs
resource "google_compute_instance" "vm" {
  count        = 3
  name         = "vm-${count.index + 1}"
  machine_type = "e2-micro"
  zone         = "us-central1-a"

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-11"
    }
  }

  network_interface {
    network = "default"
    access_config {}
  }
}
```

### Exercise 2: Use Variables

Create `variables.tf`:
```hcl
variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "vm_count" {
  description = "Number of VMs to create"
  type        = number
  default     = 1
}

variable "machine_type" {
  description = "VM machine type"
  type        = string
  default     = "e2-micro"
}
```

Create `terraform.tfvars`:
```hcl
project_id   = "my-project-id"
vm_count     = 3
machine_type = "e2-small"
```

Update `main.tf`:
```hcl
resource "google_compute_instance" "vm" {
  count        = var.vm_count
  name         = "vm-${count.index + 1}"
  machine_type = var.machine_type
  # ...
}
```

### Exercise 3: Use Outputs

Create `outputs.tf`:
```hcl
output "vm_ips" {
  value = google_compute_instance.vm[*].network_interface[0].access_config[0].nat_ip
}

output "vm_names" {
  value = google_compute_instance.vm[*].name
}
```

View outputs:
```bash
terraform output
terraform output vm_ips
```

### Exercise 4: Use Data Sources

```hcl
# Get information about existing resources
data "google_compute_network" "default" {
  name = "default"
}

data "google_compute_zones" "available" {
  region = "us-central1"
}

# Use in resources
resource "google_compute_instance" "vm" {
  zone = data.google_compute_zones.available.names[0]
  # ...
}
```

### Exercise 5: Conditional Resources

```hcl
variable "create_backup" {
  type    = bool
  default = false
}

resource "google_compute_disk" "backup" {
  count = var.create_backup ? 1 : 0
  name  = "backup-disk"
  zone  = "us-central1-a"
  size  = 10
}
```

---

## Best Practices

### 1. Use Variables
Never hardcode values:
```hcl
# ❌ Bad
resource "google_compute_instance" "vm" {
  project = "my-project"
  zone    = "us-central1-a"
}

# ✅ Good
variable "project_id" { type = string }
variable "zone" { type = string }

resource "google_compute_instance" "vm" {
  project = var.project_id
  zone    = var.zone
}
```

### 2. Use Modules
Break down complex infrastructure:
```
infrastructure/
├── main.tf
├── variables.tf
├── outputs.tf
└── modules/
    ├── gke-cluster/
    ├── cloud-sql/
    └── networking/
```

### 3. Remote State
Use remote state for teams:
```hcl
terraform {
  backend "gcs" {
    bucket = "terraform-state-bucket"
    prefix = "project/state"
  }
}
```

### 4. Version Constraints
Pin provider versions:
```hcl
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"  # Allow 5.x, not 6.0
    }
  }
}
```

### 5. Use .tfvars Files
Separate values from code:
```
terraform.tfvars          # Default values
terraform.dev.tfvars      # Development
terraform.prod.tfvars     # Production
```

### 6. Validate and Format
```bash
# Format code
terraform fmt

# Validate syntax
terraform validate

# Check plan
terraform plan
```

### 7. Use Workspaces
Separate environments:
```bash
terraform workspace new dev
terraform workspace new prod

terraform workspace select dev
terraform apply -var-file=dev.tfvars
```

---

## Project-Specific: Our Terraform Structure

Looking at this project:

```
infrastructure/terraform/
├── modules/
│   ├── gke-cluster/      # GKE cluster module
│   ├── postgresql/       # Cloud SQL module
│   ├── iam/              # IAM module
│   └── ...
└── environments/
    ├── dev/
    │   ├── main.tf       # Uses modules
    │   ├── variables.tf
    │   └── terraform.tfvars
    └── production/
        └── ...
```

### Key Features:
- **Modular**: Reusable modules
- **Environment-specific**: Separate configs per environment
- **State management**: Remote state in GCS
- **Variables**: All values parameterized

### Try It:
```bash
cd infrastructure/terraform/environments/dev

# Initialize
terraform init

# Plan (see what will be created)
terraform plan

# Apply (create infrastructure)
terraform apply

# Destroy (remove everything)
terraform destroy
```

---

## Common Commands

```bash
# Initialize
terraform init

# Format code
terraform fmt

# Validate
terraform validate

# Plan
terraform plan

# Apply
terraform apply
terraform apply -auto-approve  # Skip confirmation

# Destroy
terraform destroy

# Show state
terraform show
terraform state list

# Workspaces
terraform workspace list
terraform workspace new <name>
terraform workspace select <name>
```

---

## Next Steps

1. ✅ Create your first infrastructure
2. ✅ Use variables and outputs
3. ✅ Create modules
4. ✅ Set up remote state
5. ✅ Move to [GKE 101](./04-GKE-101.md) to deploy Kubernetes

---

## Additional Resources

- [Terraform Official Docs](https://www.terraform.io/docs)
- [Google Provider Docs](https://registry.terraform.io/providers/hashicorp/google/latest/docs)
- [Terraform Best Practices](https://www.terraform.io/docs/cloud/guides/recommended-practices/index.html)
- [Terraform Registry](https://registry.terraform.io/) - Find modules

---

**Excellent!** You now understand Terraform. Next, learn [GKE](./04-GKE-101.md) to deploy Kubernetes in the cloud!

