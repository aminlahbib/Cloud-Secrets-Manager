terraform {
  required_version = ">= 1.5"

  backend "gcs" {
    bucket = "cloud-secrets-manager-tfstate-dev"
    prefix = "terraform/state/dev"
  }

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}
