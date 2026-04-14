# -------------------------------------------------------------------
# Kubernetes-level resources — guarded by skip_k8s_resources
# -------------------------------------------------------------------

# -------------------------------------------------------------------
# External Secrets Operator
# -------------------------------------------------------------------
resource "helm_release" "external_secrets" {
  count = var.skip_k8s_resources ? 0 : 1

  name             = "external-secrets"
  repository       = "https://charts.external-secrets.io"
  chart            = "external-secrets"
  version          = "0.9.13"
  namespace        = "external-secrets"
  create_namespace = true

  set {
    name  = "installCRDs"
    value = "true"
  }

  set {
    name  = "serviceAccount.name"
    value = "external-secrets"
  }

  set {
    name  = "serviceAccount.annotations.iam\\.gke\\.io/gcp-service-account"
    value = module.iam.service_account_emails["csm-eso-${var.environment}"]
  }

  depends_on = [module.gke]
}

# -------------------------------------------------------------------
# ClusterSecretStore — tells ESO how to reach GCP Secret Manager
# -------------------------------------------------------------------
resource "kubernetes_manifest" "cluster_secret_store" {
  count = var.skip_k8s_resources ? 0 : 1

  manifest = {
    apiVersion = "external-secrets.io/v1beta1"
    kind       = "ClusterSecretStore"
    metadata = {
      name = "gcp-secret-manager"
    }
    spec = {
      provider = {
        gcpsm = {
          projectID = var.project_id
        }
      }
    }
  }

  depends_on = [helm_release.external_secrets]
}

# -------------------------------------------------------------------
# CSM Application — deployed via Helm
# -------------------------------------------------------------------
resource "helm_release" "csm_app" {
  count = var.skip_k8s_resources ? 0 : 1

  name             = "csm"
  chart            = "${path.module}/../../helm/cloud-secrets-manager"
  namespace        = local.app_namespace
  create_namespace = true

  values = [
    file("${path.module}/../../helm/cloud-secrets-manager/values.yaml"),
    file("${path.module}/../../helm/cloud-secrets-manager/values-dev.yaml"),
  ]

  set {
    name  = "global.image.tag"
    value = var.image_tag
  }

  set {
    name  = "global.image.registry"
    value = module.artifact_registry.repository_url
  }

  set {
    name  = "global.cloudSql.connectionName"
    value = module.cloud_sql.connection_name
  }

  set {
    name  = "global.projectId"
    value = var.project_id
  }

  set {
    name  = "global.environment"
    value = var.environment
  }

  set {
    name  = "secretService.serviceAccount.gcpEmail"
    value = module.iam.service_account_emails["csm-secret-svc-${var.environment}"]
  }

  set {
    name  = "auditService.serviceAccount.gcpEmail"
    value = module.iam.service_account_emails["csm-audit-svc-${var.environment}"]
  }

  set {
    name  = "notificationService.serviceAccount.gcpEmail"
    value = module.iam.service_account_emails["csm-notif-svc-${var.environment}"]
  }

  set {
    name  = "externalSecrets.sqlInstance"
    value = module.cloud_sql.instance_name
  }

  set {
    name  = "pubsub.topicName"
    value = module.pubsub.topic_name
  }

  set {
    name  = "pubsub.subscriptionName"
    value = module.pubsub.subscription_name
  }

  depends_on = [
    module.gke,
    module.iam,
    module.cloud_sql,
    kubernetes_manifest.cluster_secret_store,
  ]
}
