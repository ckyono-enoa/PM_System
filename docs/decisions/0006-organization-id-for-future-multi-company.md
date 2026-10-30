# 0006. Organization ID on every table for future multi-company use

Status: Accepted
Date: 2026-10-29

## Context

PM_System is strictly internal for now, but Chris may sell it to other small firms if it works well. Adding company separation to an existing single-company database later usually means touching every table, query, and test. Building full multi-company features now would slow down the internal launch for a market that is not yet proven.

## Decision

- Create an `organizations` table now, holding one row for E Noa.
- Put `org_id` on every business table, with a foreign key and an index.
- Scope every query to the signed-in user's organization through helpers in `app/core/org.py`. The organization always comes from the session, never from the request.
- Keep anything that would differ between companies (name, number prefix, time zone, allowed sign-in domains, attachment limits, sensitive-data warning) in organization settings, not in code or environment variables.
- Do not build organization creation, switching, per-company identity providers, or billing.

## Consequences

- Turning PM_System into a multi-company product later is mostly new screens and onboarding, not a data migration.
- A small, constant cost: every new table needs `org_id` and every query uses the scoping helper. A test should check that every business table has `org_id`.
- There is a risk of forgetting the scope in a hand-written query. The helpers and code review keep this in check.

## Alternatives considered

- No organization concept until it is needed: least work now, most expensive later.
- A separate database per company: strongest isolation, but needs provisioning and per-database migrations. Can still be chosen later if a customer requires it, since `org_id` does not prevent it.
- Full multi-company support now: delays the internal launch for a product decision that has not been made.
