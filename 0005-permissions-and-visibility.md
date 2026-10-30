# 0005. Permission-based access and one visibility module

Status: Accepted
Date: 2026-10-29

## Context

PM_System starts with two roles, Admin and User, but Chris wants Admins to build custom roles later by checking off permissions. Items hold sensitive information (HR matters, security incidents), and access depends on department membership, assignment, watching, and restricted access lists. Visibility bugs are the most serious kind of bug this system can have.

## Decision

Two separate checks run on every request:

1. Permissions: what kind of action a user may take. Defined as constants with plain-English descriptions in `app/core/permissions.py`. Roles are rows in the database holding a set of permissions. Code checks `require_permission("items.create_project")`, never `user.role == "Admin"`.
2. Scope: which items the user may see or work on. Defined only in `app/core/visibility.py` as `can_view`, `has_work_access`, `can_see_internal_notes`, and the query filter `visible_items`. Every endpoint that returns items or item content uses these functions. No other code decides visibility.

Supporting rules:

- `visible_items` (used for lists) and `can_view` (used for single items) must always agree. A table-driven test checks every rule both ways.
- Asking for an item the user cannot see returns 404, not 403.
- An automated test fails if any route is reachable without signing in, apart from a short allowlist.
- The Admin role is locked with every permission. The organization must always have at least one active Admin.

## Consequences

- The Phase 11 role builder is a screen over data that already exists, not a rewrite.
- Visibility rules can be read in one file and tested exhaustively. Chris can review them directly.
- Every new endpoint must remember to use the visibility module. The Definition of Done and the endpoint tests in Phase 5 enforce this.
- Building visibility into queries (rather than filtering after loading) keeps lists fast and pagination correct.

## Alternatives considered

- Fixed roles checked by name: simplest now, but custom roles would mean touching every check later.
- A policy engine or authorization service (for example OPA, Oso, OpenFGA): powerful, but far more than 30 to 40 users and one set of rules need, and harder for Chris to read.
- Database row-level security: strong, but harder to debug and test, and harder to explain in plain English.
