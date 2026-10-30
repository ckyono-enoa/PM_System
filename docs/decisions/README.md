# Decision records

Each file records one significant decision: what was decided, why, and what it costs. Decisions are not edited after they are accepted. To change one, write a new record that supersedes it and update the old record's status line.

Write a new record when a change would surprise a future reader: a new major dependency, a new piece of infrastructure, a change to how data, sign-in, permissions, or visibility work, or anything that costs money each month.

## Index

| # | Decision | Status |
|---|---|---|
| 0001 | [Python backend, TypeScript frontend](0001-stack-python-backend-typescript-frontend.md) | Accepted |
| 0002 | [One container on Cloud Run in a dedicated GCP project](0002-hosting-single-container-cloud-run.md) | Accepted |
| 0003 | [OIDC sign-in, invite-only, server-side sessions](0003-auth-oidc-invite-only-server-sessions.md) | Accepted |
| 0004 | [One items table for tickets, projects, and tasks](0004-unified-work-item-model.md) | Accepted |
| 0005 | [Permission-based access and one visibility module](0005-permissions-and-visibility.md) | Accepted |
| 0006 | [Organization ID on every table for future multi-company use](0006-organization-id-for-future-multi-company.md) | Accepted |
| 0007 | [Background jobs through Cloud Scheduler and Postgres tables](0007-background-jobs-scheduler-and-outbox.md) | Accepted |
| 0008 | Email provider | To be decided in Phase 6 (P6-01) |
| 0009 | Edge access gate | To be decided in Phase 9 (P9-03) |

## Template

Copy this into a new file named `NNNN-short-title.md`.

```
# NNNN. Title

Status: Proposed | Accepted | Superseded by NNNN
Date: YYYY-MM-DD

## Context
What situation or problem led to this decision. Facts and constraints.

## Decision
What we decided, stated plainly.

## Consequences
What gets easier, what gets harder, and what we now have to keep doing.

## Alternatives considered
Each option we rejected and the main reason.
```
