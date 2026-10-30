# PM_System Backlog

This is the ordered list of work. What the system is and how it works is in [PLAN.md](PLAN.md). This file says what to build next.

---

## How to work this backlog

For Claude Code, every session:

1. Find the current phase: the first phase in the status table below that is not Done.
2. Take the first unchecked story in that phase. Stories within a phase are in dependency order.
3. Read the story, the PLAN.md sections it links, and any decision records it mentions, before writing code.
4. If the story will not fit in one session and one pull request, split it here first (for example P3-05a and P3-05b), commit the split, then do the first part.
5. Work on a branch named after the story, for example `p3-05-ticket-lists`.
6. Meet the Definition of Done below, tick the story's box in this file in the same pull request, and open the pull request.
7. When every story in the phase is ticked, set the phase to "Ready for demo" and stop. Chris runs the phase's demo checklist on staging. When he approves, the phase is promoted to production and marked Done.
8. Do not start stories from a later phase unless Chris asks.
9. Ideas, bugs, and "we should also..." go in the Inbox at the bottom. Do not build them inside an unrelated story.

Phases are ordered so that the app is usable after each one. There are no sprints or story points. One story is about one Claude Code session and one pull request.

## Definition of Done (every story)

- [ ] Every acceptance criterion is met.
- [ ] New and changed behavior has tests. All tests, linters, and type checks pass in CI.
- [ ] Database changes come with an Alembic migration that works against the currently deployed version (add first, remove later).
- [ ] The generated API client is up to date (`make gen-api`, no diff in CI).
- [ ] Every write records an audit event. From Phase 5 on, every endpoint that returns items or item content goes through `app/core/visibility.py`.
- [ ] UI changes work at phone width (360px) and on a computer, in light and dark themes, and with a keyboard.
- [ ] PLAN.md or a decision record is updated if behavior or a decision changed.
- [ ] The pull request description has: story ID, what changed and why, how to test it, and screenshots for UI changes.
- [ ] Merged to `main` and deployed to staging without errors.

## Phase status

| Phase | Name | Status |
|---|---|---|
| 0 | Foundations | Not started |
| 1 | Sign-in and users | Not started |
| 2 | Admin settings | Not started |
| 3 | Tickets | Not started |
| 4 | Comments, attachments, and timeline | Not started |
| 5 | Visibility and restricted items | Not started |
| 6 | Notifications | Not started |
| 7 | Projects and tasks | Not started |
| 8 | Kanban boards | Not started |
| 9 | Go-live and cutover | Not started |
| 10 | Reports | Not started |
| 11 | Custom roles | Not started |
| 12 | Project templates | Not started |
| 13 | Recurring items | Not started |
| 14 | Microsoft sign-in | Not started |

Statuses: Not started, In progress, Ready for demo, Done.

Phases 0 to 9 come before leaving Spiceworks. Phases 10 to 14 come after.

---

## Phase 0: Foundations

Goal: an empty but real app runs locally, in CI, on staging, and in production. Nothing useful for users yet.

Related: PLAN 9, 12, 13. ADR 0001, 0002.

### [ ] P0-01 Repository scaffold and local development

As a developer, I want the project skeleton and a one-command local setup, so that every later story starts from the same place.

Acceptance criteria:
- Folder layout matches PLAN 9.2.
- Backend: FastAPI app with `GET /api/health` returning `{"status": "ok", "version": "<git commit or 'dev'>"}`. Dependencies managed with uv and pinned.
- Frontend: Vite, React, and TypeScript app that shows a placeholder page and calls `/api/health`.
- `docker-compose.yml` starts Postgres, Mailpit, and the app with hot reload for both backend and frontend.
- `Makefile` has `setup`, `dev`, `test`, `lint`, `format`, `gen-api`, `migrate`, and `migration name=...` targets. Each target's underlying command is also listed in CLAUDE.md.
- Linters and formatters configured: ruff (lint and format) and mypy for Python; ESLint, Prettier, and `tsc --noEmit` for TypeScript.
- `.gitignore`, `.editorconfig`, and a short README covering how to run locally.
- `Dockerfile` (multi-stage) builds the frontend, copies it into `backend/app/static`, and runs the backend, which serves the frontend for every non-`/api` path (with a fallback to `index.html` for client routes).

### [ ] P0-02 Database, migrations, and the organization table

As a developer, I want the database connection, migrations, and test setup ready, so that features can add tables safely.

Acceptance criteria:
- SQLAlchemy 2 set up with a session per request. Configuration via pydantic-settings, read from environment variables, with a `.env.example`.
- Alembic configured. First migration creates `organizations` (PLAN 10) and a seed step inserts E Noa with prefix `PM`, time zone `Pacific/Honolulu`, and next number 1.
- `app/core/org.py` provides the helper that scopes queries to the current organization. Until sign-in exists, it uses the single seeded organization.
- Base model mixin adds `id` (UUID), `created_at`, `updated_at`.
- pytest fixture creates a test database, runs migrations once, and wraps each test in a rolled-back transaction.
- A test proves migrations run from empty to latest and back down one step.

### [ ] P0-03 Frontend shell and themes

As a user, I want a clean layout that works on my phone and computer in light or dark mode, so that every screen built later looks consistent.

Acceptance criteria:
- Tailwind CSS and shadcn/ui set up. Colors defined only as theme tokens.
- Theme switcher with Light, Dark, and Match System. The choice is remembered in the browser.
- Responsive app shell: left navigation on computers, collapsible menu on phones, top bar with app name, a placeholder "New" button, and a user menu placeholder.
- React Router with placeholder pages for My Work, My Requests, Queues, Projects, and Admin.
- TanStack Query set up with sensible defaults and a shared error display.
- Works at 360px wide with no horizontal scrolling.

### [ ] P0-04 Generated API client

As a developer, I want the frontend's API types generated from the backend, so that the two never drift apart.

Acceptance criteria:
- `make gen-api` exports the backend's OpenAPI schema and generates `frontend/src/api/schema.d.ts` with openapi-typescript.
- A thin client in `frontend/src/api/client.ts` using openapi-fetch, with cookies included and the shared error format (PLAN 9.3) handled in one place.
- The placeholder page's health call uses the generated client.
- `frontend/src/api/` is marked "generated, do not edit" in a README in that folder (except `client.ts`).

### [ ] P0-05 Continuous integration

As Chris, I want every pull request checked automatically, so that broken code never reaches `main`.

Acceptance criteria:
- `.github/workflows/ci.yml` runs on every pull request and on pushes to `main`.
- Jobs: Python lint, format check, and mypy; pytest with a Postgres service container; ESLint, Prettier check, tsc, and Vitest; API client drift check (regenerate and fail on diff); Docker image build.
- `pip-audit` and `npm audit --omit=dev` fail the build on high or critical issues.
- Dependabot configured for pip, npm, and GitHub Actions, weekly.
- Branch protection on `main` is documented in `docs/ops/github.md` for Chris to turn on: CI must pass, pull request required.

### [ ] P0-06 GCP setup script

As Chris, I want a script I can read and run that sets up Google Cloud, so that hosting is repeatable and documented.

Acceptance criteria:
- `infra/setup-gcp.sh` uses `gcloud` and is safe to run more than once. Every step has a plain-English comment. Values like project ID and region are variables at the top.
- It creates or configures, in one dedicated GCP project: required APIs, Artifact Registry repository, one Cloud SQL Postgres instance (smallest workable size, automated backups and point-in-time recovery on, 14-day retention), databases `pm_system_staging` and `pm_system_prod` with a separate database user for each, Cloud Storage buckets per environment (private, versioning and soft delete on), Secret Manager secrets per environment, runtime service accounts per environment with least privilege, and Workload Identity Federation for GitHub Actions.
- `docs/ops/gcp-setup.md` explains what the script does, what it costs roughly at this size, and what Chris must do by hand (billing account, budget alert, domain).
- A budget alert for the project is part of the instructions.
- Claude Code writes the script. Chris runs it.

### [ ] P0-07 Deploy to staging on merge

As Chris, I want every merge to `main` deployed to staging automatically, so that I can always see the latest version.

Acceptance criteria:
- `.github/workflows/deploy.yml` on push to `main`: builds the image, tags it with the commit SHA, pushes to Artifact Registry, runs migrations as a Cloud Run Job, then deploys `pm-system-staging`.
- Authenticates to GCP with Workload Identity Federation. No service account key files.
- Secrets come from Secret Manager at runtime. Nothing secret appears in logs.
- `/api/health` on staging shows the deployed commit.
- `docs/ops/deploy.md` explains the flow and how to roll back to a previous image.

### [ ] P0-08 Promote to production

As Chris, I want to push a tested staging version to production on purpose, so that production only changes when I decide.

Acceptance criteria:
- A manually triggered workflow takes a commit SHA (default: what staging is running), runs migrations against production, and deploys that same image to `pm-system-prod`. No rebuild.
- The production custom domain is mapped and uses HTTPS. The domain is recorded in PLAN 15 and in the Phase 0 notes below.
- `docs/ops/deploy.md` updated with the promote and rollback steps.

Phase 0 demo checklist (Chris, on staging and production):
- [ ] The app loads at both URLs and shows the shell with the deployed commit.
- [ ] The theme switcher works, and the layout is usable on a phone.
- [ ] A pull request with a deliberately failing test is blocked by CI.
- [ ] A merge to `main` shows up on staging without manual steps.

Phase 0 notes (filled in during the phase): production domain, GCP project ID, region.

---

## Phase 1: Sign-in and users

Goal: only invited people can sign in, Chris can manage users, and every change is audited.

Related: PLAN 3, 8.2, 11.1, 11.2. ADR 0003, 0005.

### [ ] P1-01 Users, sessions, and development sign-in

As a developer, I want users and sessions in place, so that every later feature knows who is acting.

Acceptance criteria:
- Tables `users`, `user_identities`, and `sessions` (PLAN 10).
- Session cookie and expiry exactly as PLAN 11.1. Only a hash of the token is stored.
- `current_user` dependency returns the signed-in, active user or responds 401.
- `POST /api/auth/logout` revokes the current session. `GET /api/auth/me` returns the current user.
- Origin check on unsafe methods (PLAN 11.1).
- Development sign-in available only when `APP_ENV=local`. The app refuses to start if it is enabled in any other environment, and a test proves it.
- A test lists every route and fails if any route is reachable without a session, except an explicit allowlist (health, sign-in routes, job endpoint).
- Frontend: signed-out users see a sign-in page. Signed-in users see their name and a sign-out option in the user menu.

### [ ] P1-02 Audit log foundation

As Chris, I want every change recorded, so that I can always see who did what.

Acceptance criteria:
- `audit_events` table (PLAN 10) and `record_audit(...)` in `app/core/audit.py`, written in the same transaction as the change.
- A migration sets database grants so the app's database user can insert and read audit events but cannot update or delete them. A test proves an update fails.
- Sign-in, sign-out, and session revocation are recorded.
- IP address and user agent are captured from the request.

### [ ] P1-03 Roles, permissions, and the first Admin

As Chris, I want permission-based access from day one, so that custom roles can be added later without a rewrite.

Acceptance criteria:
- `permissions.py` defines every permission in PLAN 3.3 with a plain-English description.
- Tables `roles` and `role_permissions`. Built-in roles Admin (locked, all permissions) and User (the permissions in PLAN 3.3) are seeded.
- `require_permission("...")` dependency. Code never checks role names.
- On startup, if there is no active Admin and `BOOTSTRAP_ADMIN_EMAIL` is set, an Admin user is created for that email, and this is audited.
- Tests cover: Admin has every permission, User lacks admin permissions, an unknown permission name is an error at startup.

### [ ] P1-04 Google sign-in with invite check

As an invited staff member, I want to sign in with my company Google account, so that I do not need another password.

Acceptance criteria:
- OIDC Authorization Code flow with PKCE using Authlib, validating state, nonce, issuer, audience, and signatures.
- Only verified emails on allowed domains are accepted (domains from organization settings; until Phase 2, from configuration).
- Sign-in succeeds only for an active existing user or an email with a valid, unexpired invite. Accepting an invite creates the user with the invite's role and departments and marks the invite accepted.
- Uninvited, expired, revoked, and deactivated cases each show a clear, friendly page and are recorded in the audit log as denied sign-ins.
- The Google identity is stored in `user_identities`, and later sign-ins match on it.
- `docs/ops/google-oauth.md` explains how to create the OAuth client and set redirect URLs for local, staging, and production.

### [ ] P1-05 Invites

As an Admin, I want to invite people by email, so that I control exactly who can get in.

Acceptance criteria:
- Admin screen: create an invite (email, role), list pending invites, revoke, and re-send (which resets the 7-day expiry).
- Inviting an email that already has an active user is refused with a clear message.
- Until email exists (Phase 6), the screen shows a copyable sign-in link and the text to send.
- Requires `invites.manage`. Every action is audited.
- Department selection on invites is added in P2-01.

### [ ] P1-06 User management

As an Admin, I want to manage users, so that access stays correct as people join, change jobs, and leave.

Acceptance criteria:
- Admin screen: list users (name, email, role, active, last sign-in) with search.
- Change a user's role. Deactivate and reactivate. Deactivating revokes all their sessions immediately.
- Cannot deactivate yourself, and cannot remove or deactivate the last active Admin. Both are enforced in the service, with tests.
- Users can see and sign out their own active sessions.
- Requires `users.manage` (except managing your own sessions). Every action is audited.

### [ ] P1-07 Audit log viewer

As an Admin, I want to browse and export the audit log, so that I can investigate issues and show evidence for security reviews.

Acceptance criteria:
- Admin screen listing audit events newest first, filterable by user, action, entity, and date range, paginated.
- Each event shows a readable summary and an expandable view of what changed.
- CSV export of the filtered results.
- Requires `audit.view`.

Phase 1 demo checklist:
- [ ] Chris signs in to staging with Google as the bootstrap Admin.
- [ ] A Google account that has not been invited is refused, and the refusal appears in the audit log.
- [ ] Chris invites a second account, signs in with it, and it lands as a User without Admin screens.
- [ ] Deactivating that account signs it out immediately.
- [ ] The audit log shows every step and exports to CSV.

---

## Phase 2: Admin settings

Goal: departments, categories, locations, and organization settings are configurable.

Related: PLAN 5, 8.1.

### [ ] P2-01 Departments and membership

As an Admin, I want to set up departments and who belongs to them, so that work can be routed and seen by the right people.

Acceptance criteria:
- Tables `departments` and `department_members`.
- Admin screen: create, rename, describe, archive, and restore departments. Archived departments are hidden from new-item forms.
- Add and remove members. A user can belong to several departments.
- Invites gain a department selection, applied when the invite is accepted. The user management screen can change a user's departments.
- Seed one department: IT, with Chris as a member.
- Requires `departments.manage` (membership changes on the user screen require `users.manage`). Audited.

### [ ] P2-02 Categories and locations

As an Admin, I want per-department categories and a shared list of locations, so that items can be classified for routing and reports.

Acceptance criteria:
- Tables `categories` (per department) and `locations`.
- Admin screens to add, rename, reorder, archive, and restore both.
- Seed IT categories: Hardware, Software, Account Access, Network, Security, Purchase Request, Other. Seed locations: Main Office, Accounting Office, Waikiki Kiosk.
- Requires `departments.manage`. Audited.

### [ ] P2-03 Organization settings

As an Admin, I want company-wide settings in the app, so that I can change them without a code change.

Acceptance criteria:
- Admin screen for: organization name, item number prefix, allowed sign-in domains, attachment size limit (MB), time zone, and the sensitive-data warning text (with a sensible default).
- Sign-in uses allowed domains from here, replacing the Phase 1 configuration value.
- Changing the prefix only changes how numbers are displayed, not stored numbers.
- Requires `settings.manage`. Audited, with before and after values.

Phase 2 demo checklist:
- [ ] Chris creates departments (for example Management and Accounting), adds himself and a test user to them, and archives one.
- [ ] Categories and locations can be edited and reordered.
- [ ] Changing allowed domains blocks sign-in from a removed domain.

---

## Phase 3: Tickets

Goal: tickets can be created, worked, and found. Visibility is not enforced yet, so production stays Admins-only until Phase 5.

Related: PLAN 4.1, 4.2. ADR 0004.

### [ ] P3-01 Item model and creating a ticket

As a staff member, I want to submit a ticket, so that my request is tracked.

Acceptance criteria:
- `items` table with every column in PLAN 10 (projects and tasks use them later), plus the database constraints and indexes listed there.
- Item numbers come from `organizations.next_item_number` under a row lock. A test creates tickets concurrently and checks numbers never repeat.
- "New ticket" form: title, description (Markdown with preview), department, category (filtered by the chosen department), location, priority (default Normal), due date. Requester defaults to the current user.
- The sensitive-data warning from organization settings is shown on the form.
- Creating a ticket requires `items.create_ticket`. It starts as New and is audited.
- After creating, the user lands on the ticket's page.

### [ ] P3-02 Ticket page and editing

As someone working a ticket, I want to see and edit all its details on one page, so that it stays accurate.

Acceptance criteria:
- Ticket page showing number, title, description (rendered and sanitized Markdown), requester, department, category, location, priority, status, due date, created and updated times (in the organization's time zone).
- Inline editing of each field. The requester field can be changed.
- The requester can edit the title and description only while the ticket is New (enforced in the service).
- Each field change is audited with before and after values.
- Layout works well on a phone.

### [ ] P3-03 Ticket status changes

As someone working a ticket, I want clear status rules, so that everyone knows where it stands.

Acceptance criteria:
- Status rules exactly as PLAN 4.2, written in one service function with a docstring that reads like the rules.
- `resolved_at` and `closed_at` set and cleared correctly, including on reopen.
- The requester can mark their own ticket Resolved and reopen it while Resolved. Reopening a Closed ticket requires work access (for now: any signed-in non-requester; tightened in Phase 5).
- Tests cover every allowed and blocked transition.

### [ ] P3-04 Assignees, watchers, and tags

As someone working a ticket, I want to assign it to one or more people and add watchers and tags, so that responsibility and interest are clear.

Acceptance criteria:
- Tables `item_assignees`, `item_watchers`, `tags`, `item_tags`.
- Add and remove multiple assignees (any active user), "Assign to me", add and remove watchers, "Watch" and "Unwatch" for yourself, add and remove tags (with autocomplete of existing tags).
- Assigning someone to a New ticket moves it to Open (PLAN 4.2).
- Every change is audited.

### [ ] P3-05 Ticket lists and queues

As a user, I want lists of the work that matters to me, so that I can find things fast.

Acceptance criteria:
- My Work: open items assigned to me. My Requests: tickets where I am the requester. Queues: one per department I belong to, showing that department's open tickets. All Items: every item, shown only with `items.view_all`.
- Each list shows number, title, status, priority, assignees, department, due date, and last updated, with overdue items highlighted.
- Sorting by updated, created, due date, and priority. Paginated (PLAN 9.3).
- On phones, rows become compact cards.

### [ ] P3-06 Filters and search

As a user, I want to filter and search lists, so that I can narrow down quickly.

Acceptance criteria:
- Filters on every list: status, priority, department, category, location, assignee, requester, tag, due (overdue, this week, none).
- Search box matching item number (with or without prefix) and words in the title.
- Filters and search are reflected in the URL so a filtered list can be bookmarked or shared.

Phase 3 demo checklist:
- [ ] Chris submits a ticket from his phone and works it from his computer.
- [ ] Two people are assigned. Status moves through Open, Waiting on Vendor, Resolved, reopened, and Closed.
- [ ] My Work, My Requests, the IT queue, and filters all show the right tickets.
- [ ] The audit log shows each change.

---

## Phase 4: Comments, attachments, and timeline

Goal: conversations, files, and history live on the ticket.

Related: PLAN 4.7, 11.3.

### [ ] P4-01 Public replies and internal notes

As someone working a ticket, I want to reply to the requester and also leave notes only my team sees, so that the conversation and the behind-the-scenes work are both captured.

Acceptance criteria:
- `comments` table. Markdown body with preview. Choose Public reply or Internal note when writing. Internal notes are visually distinct in both themes.
- Authors can edit (shows "edited") and delete (soft delete) their own comments. Audited.
- A public reply by someone other than the requester on a New ticket moves it to Open.
- Internal notes are hidden from the requester (the full work-access rule comes in Phase 5).
- The sensitive-data warning is shown in the comment box.

### [ ] P4-02 Attachment storage and upload

As a user, I want to attach screenshots and files, so that the problem is clear.

Acceptance criteria:
- `attachments` table and a storage interface with two implementations: local disk (local development and tests) and Cloud Storage (staging and production).
- Upload to an item or a comment, with drag and drop on computers and the file picker on phones (including the camera on phones).
- Enforced in the service: size limit from organization settings, type allowlist (PLAN 4.7), sanitized filenames, random storage keys.
- Check the upload size against Cloud Run's request limits and note the result in the pull request.
- Audited.

### [ ] P4-03 Attachment download and previews

As a user, I want to open attachments safely, so that files are only seen by the right people.

Acceptance criteria:
- Downloads go through a permission-checked app endpoint, with `Content-Disposition: attachment` and `X-Content-Type-Options: nosniff`.
- Images show inline previews through the same checked endpoint.
- Attachments can be soft-deleted by the uploader or by someone with work access. Audited.

### [ ] P4-04 Activity timeline

As a user, I want one timeline of everything that happened on a ticket, so that I do not have to piece history together.

Acceptance criteria:
- The ticket page shows comments and changes (status, assignees, watchers, field edits, attachments) in one chronological timeline, built from comments and audit events.
- Change entries read naturally, for example "Chris changed status from Open to Waiting on Vendor".
- Entries about internal notes are hidden from people who cannot see internal notes.

Phase 4 demo checklist:
- [ ] A requester sees public replies but not internal notes.
- [ ] Screenshots upload from a phone and preview on a computer.
- [ ] An oversized or disallowed file is rejected with a clear message.
- [ ] The timeline tells the ticket's story start to finish.

---

## Phase 5: Visibility and restricted items

Goal: people only see what they should. After this phase, non-Admin users can be invited to production.

Related: PLAN 4.4, 4.5, 11.2. ADR 0005.

### [ ] P5-01 Visibility module and tests

As Chris, I want the visibility rules written once and tested thoroughly, so that nobody sees something they should not.

Acceptance criteria:
- `app/core/visibility.py` implements `can_view(user, item)`, `has_work_access(user, item)`, `can_see_internal_notes(user, item)`, and `visible_items(user)` (a query filter), exactly per PLAN 4.4. Rule 4 (task assignees) is included but will only matter in Phase 7.
- Each function has a docstring that restates the rules in plain English.
- A table-driven test covers every rule in both directions, for tickets, projects, and tasks, and checks that `visible_items` and `can_view` always agree.

### [ ] P5-02 Enforce visibility everywhere

As a user, I want lists, pages, searches, and files to respect visibility, so that hidden items stay hidden.

Acceptance criteria:
- Every endpoint that returns items, comments, attachments, timeline entries, or counts uses the visibility module.
- Asking for an item you cannot see returns 404.
- Department queues only show departments the user belongs to (or all, with `items.view_all`).
- A test calls every item-related endpoint as a user without access and checks nothing leaks.

### [ ] P5-03 Enforce work access

As Chris, I want editing limited to the right people, so that requesters and watchers cannot change things they should not.

Acceptance criteria:
- Field edits, status changes (beyond the requester's own rights in PLAN 4.2), assignee and watcher management, internal notes, and conversion (later) all require work access, per PLAN 4.4.
- The UI hides or disables actions the user cannot take, using a `permissions` block returned with each item (for example `can_edit`, `can_comment_internal`).
- Tests cover requester-only, watcher-only, department member, assignee, and Admin.

### [ ] P5-04 Restricted items

As someone handling an HR matter or a security incident, I want to limit an item to named people, so that sensitive work stays private.

Acceptance criteria:
- `item_access` table. People with work access can mark an item restricted, and add or remove people on its access list.
- Restricted items behave exactly as PLAN 4.5: the requester, assignees, and watchers are added to the list when an item is restricted; hidden from queues, lists, search, and counts for anyone not on the list; adding an assignee prompts to add them to the list; adding a watcher not on the list is blocked.
- Every view of a restricted item writes an audit event.
- A clear "Restricted" badge on the item and in lists for those who can see it.

Phase 5 demo checklist:
- [ ] A test user in Accounting sees Accounting's items and their own requests, but not IT's queue.
- [ ] As a requester, the test user cannot edit fields or see internal notes.
- [ ] A restricted item is invisible to a department member who is not on its access list, even by direct link.
- [ ] Viewing the restricted item as Chris shows up in the audit log.
- [ ] After approval: non-Admin users may now be invited to production.

---

## Phase 6: Notifications

Goal: people hear about what matters to them, in the app and by email.

Related: PLAN 6, 9.5. ADR 0007.

### [ ] P6-01 Email outbox and job runner

As a developer, I want reliable background sending, so that emails go out even if a request is slow or the provider has a hiccup.

Acceptance criteria:
- Decision record choosing the email provider (PLAN 15), including SPF, DKIM, and DMARC setup steps for E Noa's domain.
- `email_outbox` and `job_runs` tables. A helper queues an email in the same transaction as the change that caused it.
- `POST /api/internal/jobs/run` accepts only Google-signed OIDC tokens for the scheduler's service account (tests cover rejecting unsigned and wrong-account requests). It sends queued email with retries and backoff, using `FOR UPDATE SKIP LOCKED`, and records a `job_runs` row.
- Local development sends to Mailpit. `make jobs` runs the job runner once locally.

### [ ] P6-02 Scheduler wiring

As Chris, I want the job runner called automatically, so that background work happens without me.

Acceptance criteria:
- `infra/` has the commands to create a Cloud Scheduler job per environment calling the endpoint every minute with an OIDC token, and `docs/ops/gcp-setup.md` is updated.
- Staging sends a real test email end to end.

### [ ] P6-03 In-app notifications

As a user, I want a notification bell, so that I see what changed without checking every item.

Acceptance criteria:
- `notifications` table. Created for each event in PLAN 6.3, never for the person who made the change, and only for people who can see the item.
- Bell with unread count in the top bar, a list (newest first), mark as read, mark all as read. Clicking opens the item.
- The unread count refreshes at least every 60 seconds and when the window regains focus.

### [ ] P6-04 Email notifications and preferences

As a user, I want email for the important things and control over the rest, so that I am informed but not flooded.

Acceptance criteria:
- `notification_preferences` table with the defaults in PLAN 6.3.
- Preferences screen: each event with In-app and Email switches.
- Emails follow PLAN 6.2 exactly: number, title, what changed, and a link; never descriptions or internal notes; restricted items get the generic message only. Tests check the restricted case.
- Invites are now emailed automatically, with the copyable link kept as a fallback.

### [ ] P6-05 @mentions

As a user, I want to @mention someone in a comment, so that they are pulled in directly.

Acceptance criteria:
- Typing @ in a comment suggests people who can see the item.
- Mentioning someone who cannot see the item shows a warning before posting and does not notify them or give them access.
- Mentioned people get the "You were mentioned" notification.

### [ ] P6-06 Due and overdue reminders

As an assignee, I want a reminder before and after something is due, so that deadlines are not missed.

Acceptance criteria:
- Once a day at 7:00 AM in the organization's time zone, assignees get one digest listing their items due tomorrow and overdue, as in-app notifications and one email (per preferences).
- Running the job twice on the same day does not send twice (tested).
- Closed, resolved, completed, and cancelled items are excluded.

Phase 6 demo checklist:
- [ ] Assigning a test user triggers an in-app notification and an email.
- [ ] Turning off an event's email in preferences stops those emails.
- [ ] Notifications about a restricted item contain no details.
- [ ] A due-tomorrow item produces one morning digest.

---

## Phase 7: Projects and tasks

Goal: tickets can become projects, projects can be created directly, and tasks can go to anyone in any department.

Related: PLAN 4.3, 4.4. ADR 0004.

### [ ] P7-01 Create a project and project list

As a manager, I want to create a project for my department, so that bigger work has a home.

Acceptance criteria:
- "New project" form: title, description, owning department (only departments the user belongs to, or any with `items.view_all`), assignees (owners), start date, due date, priority, tags.
- Requires `items.create_project`. Project status starts Active. Audited.
- `board_columns` table. Every new project gets the default columns from PLAN 4.6 (Backlog, To Do, In Progress, Blocked, Done) with their categories. Editing columns comes in P8-01.
- Projects page listing projects the user can see, with status, owners, department, due date, and progress (0 until tasks exist), with filters and search.
- The project page reuses the item page (fields, comments, attachments, timeline) and adds a tasks area.

### [ ] P7-02 Convert a ticket into a project

As someone working a ticket that turned out to be big, I want to convert it into a project, so that I can break it into tasks without losing its history.

Acceptance criteria:
- "Convert to project" action for people with work access. Asks for start and due dates.
- The item keeps its number, comments, attachments, and history. `kind`, `converted_at`, and `converted_by` are set. The timeline shows the conversion.
- The requester is notified and sees "In project" with a progress summary instead of a ticket status.
- Conversion is one-way (no converting back). Audited.

### [ ] P7-03 Tasks

As a project owner, I want to add tasks and assign them to people in any department, so that cross-department work is tracked in one place.

Acceptance criteria:
- Add, edit, and delete (soft) tasks in a project: title, description, multiple assignees (any active user), watchers, priority, due date.
- Tasks inherit the project's department and restricted settings.
- Task detail opens as a side panel on computers and a full screen on phones, with comments, attachments, and timeline.
- New tasks start in the project's first Not Started column. A task's status is changed with a dropdown of the project's columns.
- Tasks appear on the project page as a list grouped by column category (the board comes in Phase 8).

### [ ] P7-04 Cross-department access for tasks

As someone in Accounting assigned a task on an IT project, I want to see that project and its tasks, so that I have context for my part.

Acceptance criteria:
- Visibility rule 4 (PLAN 4.4) is active and covered by the P5-01 test table, including restricted projects (rule 4 does not apply).
- Task assignees have work access to their tasks and can view the parent project. They can comment on the project (public replies) but cannot edit project fields unless they otherwise have work access.
- Assigning a task notifies the assignee with the project's name.

### [ ] P7-05 Progress and My Work for tasks

As a user, I want my tasks across all projects in one place and project progress at a glance, so that I know what to do next.

Acceptance criteria:
- Project progress (done tasks over total, by column category) shown on the project page and in the project list.
- My Work includes tasks assigned to me, grouped by project, sortable by due date.
- When a project is marked Completed, the requester (if converted from a ticket) and watchers are notified.

Phase 7 demo checklist:
- [ ] A ticket is converted into a project and keeps its full history.
- [ ] A task on an IT project is assigned to an Accounting test user, who can see the project and do their task but not edit the project.
- [ ] The original requester sees "In project" with progress, and is notified when the project is completed.

---

## Phase 8: Kanban boards

Goal: boards for every project and for ticket queues.

Related: PLAN 4.6.

### [ ] P8-01 Board columns

As a project owner, I want to shape my project's columns, so that the board matches how the work flows.

Acceptance criteria:
- People with work access can add, rename, reorder, set the category of, and delete columns. A column must be empty to delete. At least one Done column must remain (enforced in the service, tested).
- Audited.

### [ ] P8-02 Project board on computers

As a project team member, I want to drag tasks across a board, so that updating progress is quick.

Acceptance criteria:
- Board view on the project page with columns and task cards (title, assignee avatars, due date, priority).
- Drag and drop between and within columns with dnd-kit. Moves save immediately and roll back with a message on failure.
- Keyboard users can move cards (dnd-kit keyboard support or a "Move to" menu).
- Card positions are stored so order is kept for everyone. Concurrent moves by two users do not corrupt order (tested in the service).

### [ ] P8-03 Project board on phones

As a user on my phone, I want a board I can actually use, so that I can update tasks away from my desk.

Acceptance criteria:
- At phone width the board shows one column at a time with a column switcher and swipe between columns.
- Each card has a "Move to" menu instead of drag and drop.

### [ ] P8-04 Board filters

As a team member, I want to filter the board, so that I can focus on my work.

Acceptance criteria:
- Filters: assignee, "only mine", priority, due (overdue, this week), tag. Reflected in the URL.

### [ ] P8-05 Ticket queue board

As IT, I want to see my queue as a board, so that I can triage visually.

Acceptance criteria:
- A board toggle on department queues. Columns are the ticket statuses (not editable).
- Dragging a ticket changes its status, following PLAN 4.2. Disallowed moves are refused with a message.
- Works on phones the same way as P8-03.

Phase 8 demo checklist:
- [ ] Columns are customized on a project and the Done rule cannot be broken.
- [ ] Tasks are dragged on a computer and moved with the menu on a phone.
- [ ] The IT queue board changes ticket status by drag and drop.

---

## Phase 9: Go-live and cutover

Goal: PM_System is hardened, recoverable, and replaces Spiceworks.

Related: PLAN 11, 12, 14.

### [ ] P9-01 Security review

As Chris, I want a structured security pass before real data goes in, so that obvious gaps are closed first.

Acceptance criteria:
- Walk through PLAN 11 point by point and record the result of each in `docs/ops/security-review.md` (met, fixed, or accepted with a reason).
- Security headers from PLAN 11.4 are set and tested.
- Light rate limiting on sign-in routes.
- Findings fixed in this story or added as new stories in this phase.

### [ ] P9-02 Monitoring and alerts

As Chris, I want to be told when something breaks, so that I hear about it before staff do.

Acceptance criteria:
- Structured JSON logs with request IDs, Error Reporting, an uptime check on production `/api/health` emailing Chris, and an alert if the job runner has not succeeded for 15 minutes (PLAN 11.8).
- `docs/ops/monitoring.md` says where to look and what each alert means.

### [ ] P9-03 Edge access gate

As Chris, I want a second lock in front of production, so that the app is not exposed to anyone who has not signed in to the company identity provider.

Acceptance criteria:
- Decision record choosing GCP Identity-Aware Proxy or Cloudflare Access (PLAN 11.5), including how it will work with Microsoft sign-in later.
- Production placed behind it. Staff only see one extra sign-in prompt at most.
- Cloud Scheduler can still reach the job endpoint (tested).

### [ ] P9-04 Backup and restore drill

As Chris, I want proof that I can restore, so that backups are not just assumed to work.

Acceptance criteria:
- Restore the production database to a new temporary instance from a point in time, connect a staging build to it, and confirm data is intact. Then delete the temporary instance.
- Restore a deleted attachment from bucket versioning.
- `docs/ops/restore.md` written step by step, with how long it took.

### [ ] P9-05 End-to-end smoke tests

As a developer, I want the main flows tested in a real browser, so that big regressions are caught automatically.

Acceptance criteria:
- Playwright tests against the local stack using development sign-in: submit a ticket, assign and reply, convert to project, add a task, move it on the board, check visibility for a second user.
- Run in CI on every pull request.

### [ ] P9-06 Cutover from Spiceworks

As Chris, I want a clean switchover, so that nothing is lost and staff know where to go.

Acceptance criteria:
- `docs/ops/cutover.md` checklist covering: production departments, categories, locations, and settings configured; initial users invited; active Spiceworks tickets re-entered by hand (with the old Spiceworks number noted in each description); Spiceworks history exported and archived read-only; a one-page quick-start guide for staff (`docs/user-guide.md`); announcement sent; Spiceworks closed.
- Claude Code prepares the checklist and guide. Chris carries out the cutover.

Phase 9 demo checklist:
- [ ] Security review document is complete with no open high-risk items.
- [ ] A test alert reaches Chris.
- [ ] Production is behind the edge gate and background jobs still run.
- [ ] The restore drill is documented.
- [ ] Cutover checklist is complete. Spiceworks is retired.

---

## Phase 10: Reports

Related: PLAN 7.

### [ ] P10-01 Reports page

As a manager, I want key numbers about our work, so that I can see workload and trends.

Acceptance criteria:
- Reports page (requires `reports.view`) with: opened vs. closed by week, counts by department, category, assignee, and location, average time to resolve by department and category, and overdue items.
- Date range and department filters.
- Numbers respect visibility and restricted rules (tested).
- Charts readable in both themes and on phones.

### [ ] P10-02 CSV export

As a manager, I want to export lists and reports, so that I can use the data elsewhere.

Acceptance criteria:
- CSV export from every item list (with current filters) and every report.
- Exports respect visibility. Exports are audited.

---

## Phase 11: Custom roles

Related: PLAN 3.3. ADR 0005.

### [ ] P11-01 Role builder

As an Admin, I want to create roles by checking off permissions, so that access fits each person's job.

Acceptance criteria:
- Admin screen (requires `roles.manage`) to create, rename, describe, and delete roles. Permissions are grouped by area, each with its plain-English description from `permissions.py`.
- Admin is locked. User can be edited but not deleted. A role in use cannot be deleted until its users are moved.
- Audited with before and after permission lists.

### [ ] P11-02 Assign custom roles safely

As an Admin, I want to assign custom roles without locking myself out, so that changes are safe.

Acceptance criteria:
- Custom roles appear in user management and invites.
- No change can leave the organization without at least one active Admin (tested).

### [ ] P11-03 Access overview

As an Admin, I want to see who can do what, so that I can review access periodically.

Acceptance criteria:
- A screen listing each user with their role and effective permissions, filterable by permission, exportable to CSV.

---

## Phase 12: Project templates

### [ ] P12-01 Template management

As a manager, I want reusable project templates, so that repeat processes like onboarding are consistent.

Acceptance criteria:
- `item_templates` and `template_tasks` tables. Screen to create and edit templates: name, department, description, tasks with relative due dates (start date plus N days), and default assignees or "assign when used".
- Who can manage templates is a new permission, `templates.manage` (Admin by default). Add it to PLAN 3.3.

### [ ] P12-02 Create a project from a template

As a manager, I want to start a project from a template, so that setup takes seconds.

Acceptance criteria:
- "New project from template" asks for title, start date, and any "assign when used" assignees, then creates the project and its tasks with calculated due dates.

### [ ] P12-03 Save a project as a template

As a project owner, I want to turn a finished project into a template, so that good processes are reused.

Acceptance criteria:
- "Save as template" copies the project's tasks and converts their due dates to offsets from the project's start date.

---

## Phase 13: Recurring items

### [ ] P13-01 Recurrence rules and job

As IT, I want routine work created automatically, so that monthly patching and quarterly access reviews never get forgotten.

Acceptance criteria:
- `recurrences` table. A recurrence creates either a ticket (from saved fields) or a project (from a template) on a schedule: daily, weekly (chosen days), monthly (day of month or "first Monday"), quarterly, or yearly, in the organization's time zone.
- The job runner creates due items exactly once per occurrence (tested, including running twice).
- Each created item notes which recurrence made it. Audited.

### [ ] P13-02 Recurrence management

As IT, I want to see and control recurring work, so that the schedule stays right.

Acceptance criteria:
- Screen listing recurrences with next run date, last created item, and pause, resume, edit, and delete actions.

---

## Phase 14: Microsoft sign-in

Related: PLAN 3.2. ADR 0003.

### [ ] P14-01 Microsoft Entra sign-in

As a staff member with a company Microsoft account, I want to sign in with it, so that I can use PM_System as the company moves to Microsoft.

Acceptance criteria:
- Microsoft Entra ID OIDC provider for E Noa's tenant (single tenant), with the same validation, domain, and invite rules as Google.
- Organization settings choose which providers are enabled.
- `docs/ops/microsoft-entra.md` explains the app registration and redirect URLs.

### [ ] P14-02 Linking Google and Microsoft identities

As a staff member moving from Google to Microsoft, I want my existing account to carry over, so that I keep my history.

Acceptance criteria:
- A signed-in user can link a second provider from their profile by completing that provider's sign-in.
- A first-time Microsoft sign-in with an email matching an existing user is not linked automatically. The user is told to sign in with Google first and link from their profile, or an Admin links it. This prevents account takeover.
- Admins can see and remove linked identities. Audited.

---

## Later (not yet scheduled)

Epics to break into stories when they are scheduled:

- Approvals: tasks or tickets that need a named approver's sign-off before moving on.
- Knowledge base: self-help articles linked from tickets.
- AI triage and summaries: suggested category, priority, and assignee for new tickets; summaries of long timelines. Python service. Must respect visibility and keep restricted items out unless a decision record says otherwise.
- NinjaOne link: attach devices from NinjaOne to tickets.
- Google Chat and Microsoft Teams notifications.
- Email-to-ticket.
- Full-text search across descriptions and comments (Postgres full-text search).
- Attachment malware scanning.
- Multi-company: organization management, per-company identity providers, billing (PLAN 9.6).

---

## Inbox

New ideas, bugs, and requests go here with a date and who raised them. Chris decides where they go.

- (empty)
