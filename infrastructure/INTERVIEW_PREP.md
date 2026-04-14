# Interview Preparation -- Cloud Secrets Manager Infrastructure

> Conversational answers grounded in the CSM project. Read each scenario, internalize the reasoning, and adapt to whatever angle the interviewer takes. Where the project has gaps, honest "I haven't done X but here's how I'd approach it" responses are prepared.

---

## 1. Pipelines, Automation, GitOps & CI Checks

### "Walk me through your CI/CD pipeline."

Our pipeline runs on GitHub Actions and targets GKE. It has four stages that run sequentially as quality gates.

First, **build and test** -- we run `mvnw clean verify` for each of the three Spring Boot backend services. This runs unit tests and integration tests. We use JDK 21 with Maven caching so repeat builds are fast. If any service fails its tests, nothing else runs.

Second, **security scanning** -- we run Trivy as a filesystem scan looking for CRITICAL and HIGH vulnerabilities. The results get uploaded as SARIF to GitHub's Security tab so we have a persistent audit trail. This catches vulnerable dependencies before they ever reach a container.

Third, **image building** -- we delegate to Google Cloud Build. A single `cloudbuild.yaml` builds all four Docker images in parallel. Each image gets tagged with the first 8 characters of the git SHA for immutability, plus a `latest` tag for convenience. The images get pushed to Artifact Registry. We use Cloud Build rather than building in GitHub Actions because it's inside GCP's network -- pushing to Artifact Registry is fast and we don't need to manage Docker credentials.

Fourth, **deployment** -- for the development branch, we do a `helm upgrade` against GKE using `--reuse-values` so we only change the image tag, keeping all the infrastructure values that Terraform originally set. We then verify with `kubectl rollout status` on each deployment to make sure pods actually come up healthy before marking the job as green.

### "Why not full GitOps with ArgoCD or Flux?"

Honest answer: I went with a push-based model -- CI pushes the change to the cluster -- because it's simpler and there was no operational need for a pull-based reconciliation loop in this project. For a team of one or two working on a dev/staging environment, `helm upgrade` from CI is perfectly fine.

That said, I understand the GitOps argument. With ArgoCD, you'd have a separate Git repo (or branch) for manifests, Argo watches it, and the cluster converges to whatever is declared. The benefits are drift detection, automatic self-healing, and a clear audit trail in Git. If this project scaled to multiple teams or production with strict compliance requirements, I'd add ArgoCD as the deployment operator and have CI just update the image tag in a manifests repo. The pipeline would become: CI builds and pushes images, then opens a PR to the GitOps repo with the new tag. Argo picks it up from there.

### "How do you handle PRs? What checks run before merge?"

On pull requests to `main` or `development`, the build-test and security-scan jobs run but image building and deployment do not -- those only trigger on push. So every PR gets unit tests and Trivy scan as merge gates. If we wanted to be stricter, we'd add `terraform plan` output as a PR comment for infrastructure changes, and potentially a `helm template` dry-run to catch manifest errors.

### "How does authentication work in the pipeline? No service account keys?"

We use Workload Identity Federation. GitHub Actions gets an OIDC token for the workflow run, exchanges it with GCP's Security Token Service for a short-lived access token that impersonates a specific GCP service account. No JSON key files are stored anywhere. The GCP side requires a Workload Identity Pool and Provider configured to trust GitHub's OIDC issuer, and the service account has an IAM policy binding that allows the specific GitHub repo to impersonate it. This is the Google-recommended approach -- static SA keys are a security liability and a rotation burden.

### "What if a build fails midway? Do you get partial deployments?"

No. The pipeline stages are sequential with hard dependencies. If `build-test` fails, nothing else runs. If `build-images` fails (say one of the four Docker builds breaks), Cloud Build reports failure and the deploy job never triggers. If the deploy job itself fails (say the Helm upgrade times out because a pod won't come healthy), `--wait` makes the job fail and we get a clear error. The previous version of the deployments remains running because Kubernetes doesn't terminate old pods until new ones pass readiness checks.

### "How would you add staging or canary deployments?"

Staging and production environments are already implemented. Each has its own Terraform environment folder (`environments/staging/`, `environments/production/`) and Helm values file (`values-staging.yaml`, `values-production.yaml`). They use the exact same Terraform modules as dev -- only variables differ (machine types, replica counts, HA settings, TLS configuration). Staging runs with 2 replicas on `e2-standard-2` nodes, production with 3 replicas on `e2-standard-4`. The CI deploy job targets each environment through different branch triggers and GitHub environment approval gates.

For canary, I haven't implemented it in this project, but I'm familiar with the concept. You'd use either Istio with traffic splitting or a tool like Flagger that progressively shifts traffic from the old to the new version based on metrics. In the simpler case without a service mesh, you can do a manual canary by deploying the new version as a separate Deployment with a small replica count and having both versions behind the same Service selector, but that's crude. The proper approach is Flagger + a progressive delivery controller.

---

## 2. Cloud & Network Foundations

### "Describe your GCP architecture."

Everything runs in a single GCP project in `europe-west10` with three environments: dev, staging, and production. Each environment has its own GKE cluster, Cloud SQL instance, service accounts, and Pub/Sub resources -- all isolated by naming convention and Kubernetes namespaces (`csm-dev`, `csm-staging`, `csm-prod`). The module code is identical across environments; only variables change.

Dev has a single `e2-medium` node scaling 1–3 with a ZONAL Cloud SQL instance. Staging bumps to `e2-standard-2` with 2–5 nodes, PITR on Cloud SQL, and TLS-enabled NGINX Ingress. Production runs `e2-standard-4` with 3–10 nodes, HA (REGIONAL) Cloud SQL, automated TLS via cert-manager + Let's Encrypt, strict rate limits, and security headers (HSTS, X-Frame-Options, etc.). Container images live in Artifact Registry (shared across environments). Secrets are stored in GCP Secret Manager and synced into Kubernetes via External Secrets Operator. Terraform state is in a versioned GCS bucket with per-environment prefixes.

All clusters have Workload Identity enabled -- pods authenticate to GCP services using Kubernetes service accounts mapped to GCP service accounts, with no key files. Shielded nodes are on, legacy metadata endpoints are disabled, and each node runs as a dedicated service account with only logging, monitoring, and AR reader permissions.

### "Why a regional cluster instead of zonal?"

Cost difference is minimal for standard GKE -- you still pay one management fee. But regional gives you a highly available control plane across three zones. If a zone goes down, `kubectl` and the API server still work. For the node pool, with autoscaling from 1 to 3, nodes can be spread across zones automatically. In production, this matters for availability. In dev it's mostly the same price, so there's no reason not to be regional.

### "Why not use a VPC? What about network segmentation?"

In dev, we use the default VPC for simplicity. There are no multi-tenant concerns and the attack surface is limited -- Cloud SQL has no authorized networks (only accessible via Auth Proxy), and all K8s services are ClusterIP with no external exposure by default.

For staging and production, the next step would be a custom VPC module. The setup would be: a custom VPC with a primary subnet for GKE nodes, secondary ranges for pods and services (VPC-native cluster), private nodes with Cloud NAT for outbound internet (pulling images, etc.), and Private Service Connect or private IP for Cloud SQL. I'd also add Network Policies using Calico to restrict pod-to-pod traffic -- for example, only secret-service should be allowed to talk to audit-service on port 8081.

### "How does the database connectivity work?"

Applications never connect directly to Cloud SQL's IP. Each backend pod has a Cloud SQL Auth Proxy v2 sidecar container. The proxy authenticates to Cloud SQL using the pod's Workload Identity -- the pod's Kubernetes service account is mapped to a GCP service account that has the `cloudsql.client` role. The proxy opens a local socket on `localhost:5432`, and the application's JDBC URL points at `localhost`. The connection between the proxy and Cloud SQL is encrypted and authenticated via IAM -- no passwords for the tunnel itself. The database user credentials (username/password) are still needed for PostgreSQL authentication, and those come from Kubernetes secrets that ESO syncs from Secret Manager.

### "What if Cloud SQL goes down?"

In dev, it's ZONAL -- if the zone fails, the database is down until GCP recovers it. In production, Cloud SQL is configured for REGIONAL availability with a standby instance in another zone and synchronous replication. Failover is automatic and takes about 30 seconds. Staging and production both have PITR (point-in-time recovery) enabled. We also have automated daily backups with 7-day transaction log retention, so even in a catastrophic scenario we can restore to any point in the last week.

### "How do you handle DNS and service discovery?"

Inside the cluster, it's standard Kubernetes DNS. Services register as `{name}.{namespace}.svc.cluster.local`. So secret-service calls audit-service at `http://audit-service:8081` -- Kubernetes DNS resolves that to the ClusterIP. For external access, we have an NGINX Ingress Controller deployed in staging and production with path-based routing (`/api` to secret-service, `/api/audit` to audit-service, `/api/notifications` to notification-service, `/` to frontend). In dev, Ingress is disabled for simplicity. Staging uses a manually provisioned TLS certificate, while production uses cert-manager with a Let's Encrypt `ClusterIssuer` for automated certificate management.

---

## 3. SecOps & FinOps

### "How do you handle secrets?"

Three-tier pipeline, fully automated. First, Terraform generates all credentials at infrastructure provision time. Database passwords are 32-character random strings created by the `random` provider in the `cloud-sql` module. Application secrets -- JWT signing key (64-char), AES encryption key (32-char), and audit API key (48-char) -- are generated the same way in `app-secrets.tf`. All of them are immediately stored in GCP Secret Manager, never written to disk or logs (they are in Terraform state, which is why the state bucket is versioned and access-controlled).

Second, External Secrets Operator running in the cluster reads from Secret Manager every hour and materializes them as Kubernetes Secrets. Third, pods consume those K8s secrets via `secretKeyRef` in their env vars.

The `app-secrets.tf` uses `lifecycle { ignore_changes = [secret_data] }` on the secret versions, so once the secrets are generated on first apply, subsequent `terraform apply` runs won't regenerate them. This is important because rotating a JWT key would invalidate all existing tokens, and rotating the AES key would make existing encrypted data unreadable. Rotation is intentional: you'd taint the specific resource, apply, then restart pods.

No secret value ever appears in a Dockerfile, a Helm values file, or CI/CD logs. The only place raw secrets exist is inside GCP Secret Manager and inside the running pod's environment. Zero manual `gcloud` commands needed for a fresh deployment.

### "What about secret rotation?"

All secrets follow the same rotation pattern because they're all Terraform-managed now. For database passwords, you taint the `random_password` resource, run `terraform apply`, Terraform writes the new value to Secret Manager, ESO picks it up within its refresh interval (1 hour, configurable), and the pods get the new credential on next restart. You trigger a rolling restart with `kubectl rollout restart`.

For JWT and AES keys, rotation is more delicate because you need the application to support dual-key validation during the transition. The mechanism is the same: `terraform taint random_password.jwt_secret`, apply, ESO syncs, then rolling restart. But the application would ideally accept tokens signed by both the old and new keys during a grace period. For the AES key, you'd need a re-encryption migration. The `ignore_changes` lifecycle block prevents accidental rotation -- you have to explicitly taint the resource to trigger it.

### "What's your FinOps strategy?"

The dev environment costs roughly $130/month. The biggest items are the GKE management fee at $74 and the Cloud SQL instance at about $25. I made deliberate choices to keep this low: `e2-medium` nodes instead of `e2-standard`, `db-g1-small` for the database, autoscaling starting at 1 node, and the monitoring stack sized with minimal resources.

Cost optimization levers I'd pull if needed: switch to GKE Autopilot which eliminates the $74 management fee and charges per pod second instead. Use committed use discounts for production. Disable the monitoring stack in dev when not needed -- it's behind a feature flag. For Cloud SQL, consider shared-core instances or even Cloud SQL Serverless if the workload is bursty.

For production cost governance, the previous version of this infrastructure had a billing budget module with threshold alerts at 50%, 90%, and 100%. I removed it during the simplification but the pattern is straightforward to add back -- Terraform creates a `google_billing_budget` with Pub/Sub notifications.

### "Have you worked with SIEM or SOC tooling?"

I haven't integrated with a dedicated SIEM in this project. Our observability is Prometheus for metrics, Loki for logs, and Grafana for visualization. Cloud Logging captures everything from GKE and Cloud SQL natively. If the requirement was to feed into a SIEM like Splunk or Chronicle, I'd set up a Cloud Logging sink that exports to BigQuery or Pub/Sub, and from there into the SIEM's ingestion pipeline. The structured logs from the Spring Boot services (JSON format) would make parsing straightforward.

### "How do you handle compliance and audit trails?"

The application itself has a dedicated audit-service that logs every operation. On the infrastructure side, GCP has built-in audit logging -- Cloud Audit Logs capture every API call (admin activity and data access). Terraform state is versioned in GCS so every infrastructure change has a before/after snapshot. GitHub provides a complete commit and PR history. For SOC 2 or similar, I'd enable Data Access Audit Logs explicitly and export them to a long-term storage sink.

---

## 4. Infrastructure as Code

### "Why Terraform? Why not Pulumi or Crossplane?"

Terraform is the industry standard for multi-cloud IaC with the broadest provider ecosystem and hiring pool. The GCP Terraform provider is excellent and Google actively maintains it. I chose it because it's well understood, declarative, and has a mature state management model.

Pulumi is interesting if you want to write infrastructure in a real programming language -- useful for complex conditional logic. But HCL is good enough for what we need, and Terraform's plan/apply cycle is intuitive for review. Crossplane is a different paradigm -- it runs inside Kubernetes and manages cloud resources as CRDs. It's compelling for full GitOps where everything is K8s-native, but it adds operational complexity (you need a running cluster to manage your infrastructure, which is circular for bootstrap).

### "Explain your module structure."

Five modules, each owning one domain: `gke` for the cluster and node pool, `cloud-sql` for the database and credential lifecycle, `artifact-registry` for the container repo, `iam` for service accounts and Workload Identity bindings, and `pubsub` for messaging. Each module declares its own provider requirements, takes inputs through variables, and exposes outputs. Modules don't reference each other -- the environment root module (`environments/dev/main.tf`) wires them together by passing outputs from one module as inputs to another.

This is a deliberate architectural choice. A flat dependency graph means modules are independently testable and reusable. If I needed to add an environment, I copy the environment folder and change the variable values. The module code doesn't change.

### "How do you handle state?"

Remote state in a GCS bucket with versioning enabled. The bucket is created by a standalone bootstrap Terraform config that uses local state -- solving the chicken-and-egg problem of "where do I store the state for the resource that stores state." State locking is native to the GCS backend -- Terraform creates a `.tflock` file in the bucket. We keep 5 versions for rollback.

Each environment gets its own state prefix (`terraform/dev`, `terraform/staging`, `terraform/production`), so they're completely independent. A broken dev apply can't corrupt staging or production state.

### "What about Terraform drift? How do you detect it?"

In CI, I'd add a `terraform plan` step on PRs that posts the plan diff as a comment. Any unexpected changes indicate drift. For ongoing detection, you'd run `terraform plan` on a schedule (e.g., nightly cron in CI) and alert if the plan shows changes that nobody made in code. I haven't implemented scheduled drift detection in this project, but the mechanism is simple -- a GitHub Actions workflow on a cron trigger that runs `terraform plan -detailed-exitcode` and alerts on exit code 2 (changes detected).

### "How do you handle the chicken-and-egg problem with Kubernetes providers?"

The Kubernetes and Helm Terraform providers need a cluster endpoint to configure. But the cluster is created by Terraform. On the first apply, the cluster doesn't exist yet. I solve this with a `skip_k8s_resources` boolean variable. When `true`, all Helm releases and Kubernetes manifests are gated by `count = 0`, and the provider configuration receives dummy values (`https://unused`). First apply creates the GCP resources. Second apply (with `skip_k8s_resources=false`) configures the providers against the now-existing cluster and deploys the K8s resources. After that initial bootstrap, it's a single apply.

---

## 5. Rollouts, Rollbacks, Updates, Debugging, Strategies

### "How do you deploy a new version?"

Two paths. The automated path: push code to the `development` branch, CI runs tests, builds images tagged with the git SHA, then runs `helm upgrade --reuse-values --set global.image.tag={sha}`. Kubernetes performs a rolling update -- it creates new pods, waits for them to pass readiness checks, then terminates old pods. The `--wait` flag means the CI job doesn't complete until all pods are healthy or the timeout is hit.

The manual path: `terraform apply -var="image_tag=abc12345"` or a direct `helm upgrade` with the new tag. Both trigger the same rolling update in Kubernetes.

### "What's your rollback strategy?"

Since every image is tagged with its git SHA, rollback is just deploying the previous tag. With Helm, `helm rollback csm 1` reverts to the previous release revision. Helm keeps a configurable number of release revisions (default 10). Alternatively, just re-run the pipeline from the previous commit, or manually set the tag: `helm upgrade csm ... --reuse-values --set global.image.tag={previous-sha}`.

For infrastructure rollback, Terraform state versioning in GCS lets us recover previous state. But honestly, for infrastructure changes I'd rather fix-forward than roll back -- understanding what broke and applying a corrective change is safer than blindly reverting state.

### "How does the rolling update work? What about downtime?"

Kubernetes rolling updates replace pods one at a time by default. The new pod must pass its readiness probe (`/actuator/health/readiness`, checked every 10 seconds after a 30-second initial delay) before Kubernetes starts sending traffic to it and before the old pod is terminated. With a single replica in dev, there's a brief moment where the new pod is starting and the old one is still serving, then a cutover. With multiple replicas in production, there's zero downtime because at least one pod is always ready.

The GKE node pool also does zero-downtime upgrades: `max_surge=1, max_unavailable=0` means a new node comes up before an old one drains.

### "What if a deployment gets stuck? How do you debug?"

First, `kubectl get pods -n csm-dev` to see pod status. If pods are in `CrashLoopBackOff`, `kubectl logs {pod} -c {container}` for application logs, and `kubectl logs {pod} -c cloud-sql-proxy` for sidecar issues. If pods are `Pending`, `kubectl describe pod {pod}` to check scheduling issues (resource limits, node capacity). If pods are `ImagePullBackOff`, it's usually a registry authentication issue or a wrong image tag.

For deeper investigation: `kubectl describe deployment {name}` shows rollout events. `kubectl get events -n csm-dev --sort-by=.metadata.creationTimestamp` gives a timeline. For application-level issues, port-forward to the pod and hit the health endpoints directly: `kubectl port-forward pod/{name} 8080:8080` then `curl localhost:8080/actuator/health`.

If Loki is running, I can search logs in Grafana with `{namespace="csm-dev", container="secret-service"} |= "ERROR"` to find application errors without SSH-ing into anything.

### "What if the Cloud SQL Proxy sidecar fails?"

The application container would fail its health checks because it can't connect to `localhost:5432`. Kubernetes would mark the pod as not ready and stop sending traffic. The liveness probe would eventually restart the pod. In the logs, you'd see the proxy sidecar's structured logs showing the connection error -- typically either a Workload Identity issue (wrong SA binding) or a Cloud SQL connection name mismatch. Fix the root cause and the next pod restart resolves it.

### "Have you worked with blue-green deployments?"

I haven't implemented blue-green in this project -- we use rolling updates. But I understand the pattern: you maintain two identical environments (blue and green), deploy the new version to the inactive one, run smoke tests, then switch traffic by updating the Service selector or Ingress backend. The advantage is instant rollback (just switch back), and you can validate the new version with production traffic before committing. The cost is double the resources during the transition. On GKE, you could implement it with two Deployments and a Service that you update, or with Istio virtual services for traffic splitting.

### "How would you handle database schema migrations in a zero-downtime deploy?"

This is a real-world problem I've thought about. The audit-service already uses Flyway for migrations, which is the right tool. The pattern for zero-downtime migrations is: make all schema changes backward-compatible. Never rename or drop a column in the same release that changes the code. Instead, do it in phases: first release adds the new column (old code ignores it), second release starts using the new column, third release drops the old column. This way, during a rolling update, old pods and new pods can coexist against the same schema.

The secret-service currently uses Hibernate DDL auto-update, which I'd replace with Flyway for production. Hibernate DDL is unpredictable and can't do down-migrations.

### "What monitoring do you have? How do you know something is wrong?"

Three layers. Prometheus scrapes system metrics (CPU, memory, pod restarts, node health) and can scrape application metrics from `/actuator/prometheus`. Loki aggregates all container logs via Promtail running as a DaemonSet on every node. Grafana ties it together with dashboards and the ability to correlate metrics with logs.

The monitoring stack scales with the environment. Dev retains metrics for 24 hours with no log persistence (ephemeral PoC). Staging bumps retention to 48 hours and enables AlertManager. Production retains metrics for 7 days, enables Loki persistence (10Gi PVC), and runs AlertManager with rules like: pod restart count > 3 in 5 minutes, HTTP 5xx rate above threshold, pod memory approaching limits, Cloud SQL connection count near max. Alerts would go to Slack or PagerDuty via AlertManager's webhook integration.

I also have GCP-native observability: Cloud Logging captures everything, and Cloud Monitoring gets system metrics from GKE. Query Insights is enabled on Cloud SQL so I can identify slow queries without additional tooling.

---

## Quick "I Haven't Done X But..." Responses

**Service mesh (Istio/Linkerd):** "I haven't deployed a service mesh in production, but I understand the value -- mutual TLS between services, traffic management for canaries, and fine-grained observability. In this project, services communicate over plain HTTP within the cluster. If we needed mTLS or traffic splitting, Istio with its sidecar proxies would be my first choice. Anthos Service Mesh on GKE is the managed version that reduces operational burden."

**Multi-cloud:** "This project is GCP-only. I haven't worked on a multi-cloud deployment, but Terraform's provider model makes it feasible. The main challenge isn't the IaC -- it's the networking (connecting VPCs across clouds), identity federation, and making sure your application isn't tightly coupled to one cloud's managed services. For databases and messaging, you'd move to cloud-agnostic solutions or abstract behind interfaces."

**Chaos engineering:** "I haven't run formal chaos experiments, but the infrastructure is designed to tolerate failures: node auto-repair, pod health checks, autoscaling. If I were to add chaos engineering, I'd use LitmusChaos or Chaos Mesh to inject pod kills, network partitions, and resource pressure, and verify the system recovers within SLO."

**Policy-as-code (OPA/Gatekeeper):** "I don't have OPA in this cluster, but I know the pattern. You'd deploy Gatekeeper, write Rego policies as ConstraintTemplates, and enforce things like 'no containers running as root', 'all images must come from our Artifact Registry', 'resource limits must be set'. It's on my roadmap for production hardening."

**Terraform Cloud / Spacelift:** "I'm using the open-source Terraform CLI with a GCS backend. I haven't used Terraform Cloud or Spacelift, but I understand the value -- centralized state management, policy enforcement with Sentinel, cost estimation, and a web UI for plan approvals. For a team environment, I'd evaluate Spacelift or Terraform Cloud for the approval workflow and drift detection features."

**Windows containers / non-Linux workloads:** "Everything here is Linux-based. I haven't worked with Windows containers on Kubernetes. GKE does support Windows node pools, but it adds complexity with node selectors and taints. It hasn't been relevant to my work."

---

## Interview Openers & Closers

**When asked "tell me about a project":**

"I built the infrastructure for a secrets management platform on GCP. It's a microservices application -- three Spring Boot backends and a React frontend -- running on GKE across three environments: dev, staging, and production. I wrote the entire IaC in Terraform with reusable modules for GKE, Cloud SQL, IAM, Pub/Sub, and Artifact Registry. The same modules power all three environments -- only variables change (machine sizes, replica counts, HA configuration). The interesting part is the secret management pipeline -- Terraform auto-generates every credential (database passwords, JWT keys, AES encryption keys, API keys), stores them in GCP Secret Manager, and External Secrets Operator syncs them into Kubernetes. Zero manual steps, no credentials in CI/CD or source code. Staging and production have TLS-terminated NGINX Ingress with rate limiting and security headers; production uses cert-manager with Let's Encrypt for automated certificate management. The CI/CD pipeline uses GitHub Actions with Workload Identity Federation, delegates image builds to Cloud Build, and deploys via Helm. I also set up a monitoring stack with Prometheus, Grafana, and Loki that scales per environment -- dev is ephemeral, production has persistent log storage and AlertManager."

**When asked "what would you do differently":**

"Two things mainly. First, I'd use GKE Autopilot instead of Standard to eliminate node management and the $74/month management fee per cluster. Second, I'd replace Hibernate DDL auto-update with Flyway across all services -- schema management should be explicit and versioned, not implicit. I'd also consider Network Policies from day one with Calico -- it's not hard but easy to forget until it becomes a compliance issue."

**When asked "what are you most proud of in this project":**

"Two things. First, the secret management pipeline. The three-stage flow -- Terraform to Secret Manager to ESO to K8s secrets to pod env vars -- means no human ever sees or copies a password. Every secret in the system -- database credentials, JWT signing keys, AES encryption keys, API keys -- is generated, stored, synced, and consumed entirely by automation. A fresh environment goes from zero to fully running with a single `terraform apply`, no manual `gcloud` commands.

Second, the environment strategy. The same five Terraform modules power dev, staging, and production. Adding an environment is: copy a folder, change variables, apply. The Helm chart handles per-environment differences through layered values files. Dev has no TLS and minimal resources; production has automated TLS certificates, strict rate limits, security headers, HA Cloud SQL, and persistent monitoring. It's the same code at every layer -- only the dials change."
