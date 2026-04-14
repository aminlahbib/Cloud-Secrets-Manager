terraform {
  required_version = ">= 1.5"

  backend "gcs" {
    bucket = "cloud-secrets-manager-tfstate"
    prefix = "terraform/dev"
  }

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# K8s / Helm providers — only usable after GKE exists.
# On first apply with skip_k8s_resources=true these are configured
# but never invoked, so a missing cluster is fine.
data "google_client_config" "default" {}

provider "kubernetes" {
  host                   = var.skip_k8s_resources ? "https://unused" : "https://${module.gke.cluster_endpoint}"
  token                  = data.google_client_config.default.access_token
  cluster_ca_certificate = var.skip_k8s_resources ? "" : base64decode(module.gke.cluster_ca_certificate)
}

provider "helm" {
  kubernetes {
    host                   = var.skip_k8s_resources ? "https://unused" : "https://${module.gke.cluster_endpoint}"
    token                  = data.google_client_config.default.access_token
    cluster_ca_certificate = var.skip_k8s_resources ? "" : base64decode(module.gke.cluster_ca_certificate)
  }
}
