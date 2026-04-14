# -------------------------------------------------------------------
# Monitoring PoC — Prometheus + Grafana + Loki
# Guarded by enable_monitoring AND skip_k8s_resources
# -------------------------------------------------------------------

locals {
  deploy_monitoring = var.enable_monitoring && !var.skip_k8s_resources
}

# -------------------------------------------------------------------
# kube-prometheus-stack (Prometheus + Grafana)
# -------------------------------------------------------------------
resource "helm_release" "kube_prometheus" {
  count = local.deploy_monitoring ? 1 : 0

  name             = "kube-prometheus-stack"
  repository       = "https://prometheus-community.github.io/helm-charts"
  chart            = "kube-prometheus-stack"
  version          = "65.1.1"
  namespace        = "monitoring"
  create_namespace = true

  # Reduce footprint for PoC
  values = [yamlencode({
    prometheus = {
      prometheusSpec = {
        retention = "24h"
        resources = {
          requests = { cpu = "100m", memory = "256Mi" }
          limits   = { cpu = "500m", memory = "512Mi" }
        }
        serviceMonitorSelectorNilUsesHelmValues = false
        podMonitorSelectorNilUsesHelmValues     = false
      }
    }

    grafana = {
      adminPassword = var.grafana_admin_password
      resources = {
        requests = { cpu = "50m", memory = "128Mi" }
        limits   = { cpu = "200m", memory = "256Mi" }
      }
      additionalDataSources = [
        {
          name      = "Loki"
          type      = "loki"
          url       = "http://loki.monitoring.svc.cluster.local:3100"
          access    = "proxy"
          isDefault = false
        }
      ]
    }

    alertmanager = {
      enabled = false
    }

    kubeEtcd = {
      enabled = false
    }

    kubeScheduler = {
      enabled = false
    }

    kubeControllerManager = {
      enabled = false
    }

    kubeProxy = {
      enabled = false
    }

    nodeExporter = {
      enabled = true
    }
  })]

  depends_on = [module.gke]
}

# -------------------------------------------------------------------
# Loki + Promtail (log aggregation)
# -------------------------------------------------------------------
resource "helm_release" "loki" {
  count = local.deploy_monitoring ? 1 : 0

  name             = "loki"
  repository       = "https://grafana.github.io/helm-charts"
  chart            = "loki-stack"
  version          = "2.10.2"
  namespace        = "monitoring"
  create_namespace = true

  values = [yamlencode({
    loki = {
      persistence = {
        enabled = false
      }
      resources = {
        requests = { cpu = "50m", memory = "128Mi" }
        limits   = { cpu = "200m", memory = "256Mi" }
      }
    }

    promtail = {
      enabled = true
      resources = {
        requests = { cpu = "50m", memory = "64Mi" }
        limits   = { cpu = "100m", memory = "128Mi" }
      }
    }

    grafana = {
      enabled = false
    }
  })]

  depends_on = [module.gke]
}
