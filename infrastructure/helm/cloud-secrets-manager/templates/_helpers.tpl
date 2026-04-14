{{- define "csm.fullname" -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "csm.labels" -}}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: cloud-secrets-manager
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
{{- end }}

{{/* Build the full image reference */}}
{{- define "csm.image" -}}
{{ .registry }}/{{ .name }}:{{ .tag }}
{{- end }}

{{/* Cloud SQL Auth Proxy sidecar container */}}
{{- define "csm.cloudSqlProxy" -}}
- name: cloud-sql-proxy
  image: {{ .Values.cloudSqlProxy.image }}
  args:
    - "--structured-logs"
    - "--auto-iam-authn"
    - "{{ .Values.global.cloudSql.connectionName }}"
  securityContext:
    runAsNonRoot: true
  resources:
    requests:
      cpu: {{ .Values.cloudSqlProxy.resources.requests.cpu }}
      memory: {{ .Values.cloudSqlProxy.resources.requests.memory }}
    limits:
      cpu: {{ .Values.cloudSqlProxy.resources.limits.cpu }}
      memory: {{ .Values.cloudSqlProxy.resources.limits.memory }}
{{- end }}
