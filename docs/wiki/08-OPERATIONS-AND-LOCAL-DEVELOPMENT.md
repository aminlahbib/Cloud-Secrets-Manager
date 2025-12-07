# Operations & Local Development

## Running Locally

### Prerequisites

Before running the project locally, ensure you have:
- Java 21 or later
- Docker and Docker Compose
- Node.js 18 or later (for frontend development)
- A code editor with Java and TypeScript support

### Starting the Application

The project uses Docker Compose to orchestrate all services locally. A single command starts the database, all backend services, and the frontend.

**What gets started:**
- PostgreSQL database with migrations applied
- Secret Service on port 8080
- Audit Service on port 8081
- Notification Service on port 8082
- React frontend on port 5173 (or 3000)

### Environment Configuration

Local development uses default configuration that works out of the box. For features requiring external services (Firebase authentication, email sending), you'll need to provide credentials via environment variables.

**Firebase Authentication:**
- Required for full login flow
- Place the Firebase service account key in the configured location
- Set environment variables for Firebase project details

*Assumption: Local development can run with limited functionality if Firebase credentials are not configured. The backend gracefully degrades without Firebase.*

### Accessing Services

Once running:
- **API Documentation** — Swagger UI at the backend's `/swagger-ui.html` path
- **Health Checks** — Each service exposes `/actuator/health`
- **Frontend** — React application in the browser

---

## Environment Differences

### Development (Local)

| Aspect | Configuration |
|--------|---------------|
| Database | Local PostgreSQL container |
| Secrets | Environment variables or local files |
| Authentication | Firebase (optional) or disabled |
| Email | Logged, not sent |
| Replicas | Single instance of each service |

### Staging

| Aspect | Configuration |
|--------|---------------|
| Database | Cloud SQL (small instance) |
| Secrets | Google Secret Manager via ESO |
| Authentication | Firebase production project |
| Email | SendGrid (sandbox mode) |
| Replicas | 1-2 per service |

### Production

| Aspect | Configuration |
|--------|---------------|
| Database | Cloud SQL with HA |
| Secrets | Google Secret Manager via ESO |
| Authentication | Firebase production project |
| Email | SendGrid (live) |
| Replicas | Auto-scaling (2-5 per service) |

---

## Development Workflow

### Making Backend Changes

1. Make changes to the Java code
2. If running with Docker Compose, restart the relevant service
3. Test via Swagger UI or frontend
4. Write unit tests for new functionality
5. Run the test suite before committing

### Making Frontend Changes

1. Run the frontend in development mode (hot reloading enabled)
2. Make changes to React components
3. Changes appear immediately in the browser
4. Write tests for new components
5. Run the frontend test suite

### Database Migrations

Database schema changes use Flyway migrations:
1. Create a new migration file with the next version number
2. Write the SQL migration
3. Restart the services (migrations apply automatically)
4. Verify the schema change in the database

---

## Common Operations

### Viewing Logs

In local development, view logs through Docker Compose output or by checking individual container logs.

### Restarting Services

Restart individual services when making code changes. Full restarts are rarely needed except when changing infrastructure configuration.

### Clearing Data

For a fresh start, remove Docker volumes and restart. This resets the database to its initial state with seed data.

### Running Tests

- **Backend tests** — Run via Maven from the project root
- **Frontend tests** — Run via npm from the frontend directory
- **Integration tests** — Require running services (Docker Compose up)

---

## Troubleshooting

### Service Won't Start

- Check container logs for error messages
- Verify database is running and accessible
- Check for port conflicts with other applications
- Ensure required environment variables are set

### Database Connection Issues

- Verify PostgreSQL container is running
- Check connection string in configuration
- Ensure database user has correct permissions
- Check for network issues between containers

### Authentication Not Working

- Verify Firebase credentials are configured
- Check that the frontend Firebase config matches the backend project
- Ensure the callback URL is registered in Firebase Console
- Check browser console for OAuth errors

### Frontend Not Connecting to Backend

- Verify backend services are running
- Check CORS configuration allows frontend origin
- Verify API base URL in frontend configuration
- Check browser network tab for failed requests

---

## Deployment Operations

### Deploying to Staging

Merging to the main branch triggers automatic deployment to staging. Monitor the Cloud Build pipeline for success.

### Deploying to Production

Production deployments require manual approval after staging validation. Follow the deployment checklist in the operations runbook.

### Rollback Procedure

If issues occur after deployment:
1. Identify the previous working version
2. Use Helm to rollback to the previous release
3. Investigate the issue in staging before re-deploying

---

## Getting Help

| Resource | Purpose |
|----------|---------|
| This wiki | Architectural understanding |
| API Documentation (Swagger) | API contract details |
| Operations Runbook | Incident response procedures |
| Team chat channel | Real-time questions |

---

**← [Back to Wiki Home](./README.md)**
