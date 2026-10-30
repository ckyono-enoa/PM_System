# 0007. Background jobs through Cloud Scheduler and Postgres tables

Status: Accepted
Date: 2026-10-29

## Context

Some work should not happen during a web request: sending emails, daily due-date reminders, and creating recurring items (Phase 13). Cloud Run services can scale to zero and may stop background threads when no request is active, so in-process schedulers are unreliable. The volume is tiny: tens of emails a day.

## Decision

- Use the "outbox" pattern: when something happens that needs an email, the request writes a row to `email_outbox` in the same database transaction as the change. If the change rolls back, so does the email.
- Cloud Scheduler calls `POST /api/internal/jobs/run` every minute with a Google-signed OIDC token for a dedicated service account. The endpoint rejects anything else.
- The job runner processes due work: sends queued emails with retries and backoff, runs the daily reminder once per day, and creates recurring items when due. It records each run in `job_runs`.
- Every job is safe to run twice. Rows are claimed with `SELECT ... FOR UPDATE SKIP LOCKED`, and daily or recurring work records what has already been done.
- Locally, `make jobs` runs the job runner once, and email goes to Mailpit.

## Consequences

- No Redis, Celery, Pub/Sub, or worker service to run, pay for, or monitor.
- Emails are delayed by up to about a minute. Fine for notifications.
- An alert is needed if the job runner stops succeeding (PLAN 11.8), since nothing else would make that visible.
- If volume ever grows a lot, the same tables can feed a dedicated worker without changing how jobs are queued.

## Alternatives considered

- Celery or RQ with Redis: standard in Python, but adds infrastructure that this volume does not need.
- Cloud Tasks or Pub/Sub: reliable and managed, but more Google-specific setup and code paths, and harder to run locally.
- Sending email during the request: simplest, but slow requests and lost emails if the provider fails, and emails could be sent for changes that later roll back.
