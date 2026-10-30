# 0002. One container on Cloud Run in a dedicated GCP project

Status: Accepted
Date: 2026-10-29

## Context

E Noa's web applications already run on Google Cloud using serverless services (Cloud Run and managed databases), with no virtual machines or Kubernetes. Chris runs IT alone, so operations must stay simple. He has found it hard to see costs per application on Google Cloud. PM_System is small: 30 to 40 users and modest traffic. It may be sold to other firms later, so it should not depend heavily on one cloud provider.

## Decision

- Host on Google Cloud in a project dedicated to PM_System, so its costs can be seen on their own.
- Build one container image that contains the FastAPI backend and the built React frontend. FastAPI serves the API under `/api` and the frontend for every other path.
- Run it on Cloud Run: one service for staging, one for production.
- Use one Cloud SQL for PostgreSQL instance, at the smallest size that works, holding two databases (staging and production), each with its own database user that can reach only its own database.
- Store attachments in Cloud Storage, one private bucket per environment.
- Keep secrets in Secret Manager. Store images in Artifact Registry.
- Run database migrations as a Cloud Run Job before each deploy.
- Set everything up with a commented, re-runnable `gcloud` script (`infra/setup-gcp.sh`) rather than Terraform.
- Use only standard building blocks (a container, Postgres, object storage, a scheduled HTTP call) so a move to another provider stays a contained project.

## Consequences

- One deployable unit, one place to look at logs, and no separate frontend hosting or cross-origin setup.
- Cloud Run scales to zero, which keeps cost low, at the price of a short cold start after idle periods. A minimum instance count of 1 on production can be set later if cold starts are annoying, at extra cost.
- Sharing one Cloud SQL instance between staging and production saves money, but a problem that takes down the instance affects both, and heavy staging work could slow production. Acceptable at this size. Revisit if production load grows or if the product is sold.
- Without Terraform, changes to infrastructure must be made by updating the script and its documentation, not by clicking in the console.

## Alternatives considered

- Separate frontend hosting (Firebase Hosting or a CDN) plus an API service: more moving parts and cross-origin cookie complexity for no real benefit at this size.
- A different provider (Azure, Fly.io, Render, Railway): possible later. Staying on Google Cloud avoids learning a new platform during the build, and the container-based design keeps a move cheap.
- Separate Cloud SQL instances for staging and production: better isolation, roughly double the database cost.
- Terraform: more repeatable, but another tool to learn and maintain for a small, rarely changing setup.
