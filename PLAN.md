# PM_System Plan

Status: Approved for build
Owner: Chris (E Noa Corporation IT)
Last updated: 2026-10-29

This is the source of truth for what PM_System is and how it is built. The phased work lives in [BACKLOG.md](BACKLOG.md). The reasons behind major choices live in [decisions/](decisions/README.md). If code and this document disagree, this document wins until it is updated on purpose, in the same pull request as the code change.

---

## 1. Purpose

PM_System is an internal web app for E Noa Corporation that replaces Spiceworks Cloud Help Desk. It does two jobs:

1. IT help desk: staff submit tickets, IT works them, everyone can see where things stand.
2. Cross-department work tracking: any department can track projects and tasks, including work that spans departments (for example, onboarding a new hire touches management, accounting, and IT).

Any ticket can be turned into a project with tasks and a kanban board. Projects can also be created directly.

### Why build it

- Full control over features and workflow, so it can be customized as E Noa's needs change.
- No recurring help desk subscription.
- If it works well internally, it may later be sold to other small firms. The design keeps that door open without building for it yet (see section 9.6).

### Success criteria

- Every active Spiceworks ticket has been moved over and Spiceworks is no longer used.
- Management and key staff use PM_System for cross-department projects instead of email threads and side spreadsheets.
- Chris can read and adjust the business rules himself (they live in plain, well-commented Python).
- Claude Code can pick up the next story from the backlog and finish it without needing extra context.

### Scale

- 30 to 40 office staff in total. Launch is invite-only, starting with management and key people.
- At least 20 IT tickets a month, plus project and task volume from other departments.
- Three locations: Main Office, Accounting Office, Waikiki Shopping Plaza kiosk.

This is a small system. Choose the simplest design that works at this scale. Do not add caches, queues, microservices, or other infrastructure "for scale."

---

## 2. Glossary

| Term | Meaning |
|---|---|
| Item | Any trackable piece of work. Every item is one of three kinds: Ticket, Project, or Task. |
| Ticket | A request or issue someone submits, usually to IT, but any department can receive tickets. |
| Project | A larger piece of work with tasks and a kanban board. Created directly or converted from a ticket. |
| Task | A piece of work inside a project. "Subtask" in conversation means the same thing. |
| Department | A group such as IT, Accounting, or Management. Every item belongs to exactly one department. Users can belong to several. |
| Queue | The open tickets belonging to one department. |
| Board | A kanban view. Each project has its own board with editable columns. A department's ticket queue also has a board view. |
| Requester | The person a ticket is for. Usually the person who submitted it. |
| Assignee | A person responsible for an item. Items can have several assignees. |
| Watcher | A person who follows an item and gets notified about it. |
| Restricted | A flag that limits an item to a named list of people (plus Admins). Used for HR matters and security incidents. |
| Public reply | A comment visible to everyone who can see the item, including the requester. |
| Internal note | A comment visible only to people with work access to the item (see 4.4). |
| Organization | The company that owns the data. There is only one (E Noa) for now. See section 9.6. |

---

## 3. Users and access

### 3.1 Invite-only

- Nobody can sign in unless an Admin has invited their email address, even if they have a valid company Google or Microsoft account.
- An Admin invites someone by email address and chooses their role and departments.
- Invites expire after 7 days. Admins can revoke or re-send them.
- Users who leave are deactivated, never deleted, so their history stays intact. Deactivating someone ends their sessions immediately.
- The system must never be left without at least one active Admin.

### 3.2 Sign-in

- Google sign-in at launch. Microsoft Entra sign-in comes later (Phase 14). Both use standard OpenID Connect (OIDC).
- PM_System never stores passwords. MFA is enforced by the identity provider (Google or Microsoft), not by the app.
- Only verified email addresses on allowed company domains are accepted. Allowed domains are an organization setting.
- The first Admin is created from configuration (`BOOTSTRAP_ADMIN_EMAIL`) the first time the app starts with no Admin.

### 3.3 Roles and permissions

There are two built-in roles at launch: Admin and User. A role builder comes later (Phase 11) so Admins can create custom roles by checking off permissions.

To make that possible later without a rewrite, the code checks permissions, never role names. A role is just a named set of permissions.

Initial permissions:

| Permission | What it allows | Admin | User |
|---|---|---|---|
| `items.create_ticket` | Submit a ticket to any department | Yes | Yes |
| `items.create_project` | Create a project in a department you belong to (any department if you also have `items.view_all`) | Yes | Yes |
| `items.view_all` | See every non-restricted item regardless of department | Yes | No |
| `items.view_restricted` | See every restricted item | Yes | No |
| `items.edit_any` | Edit any item you can see | Yes | No |
| `items.delete` | Soft-delete items | Yes | No |
| `users.manage` | Change roles and departments, deactivate and reactivate users | Yes | No |
| `invites.manage` | Create, revoke, and re-send invites | Yes | No |
| `departments.manage` | Manage departments, categories, and locations | Yes | No |
| `roles.manage` | Manage roles (used from Phase 11) | Yes | No |
| `settings.manage` | Change organization settings | Yes | No |
| `audit.view` | View and export the audit log | Yes | No |
| `reports.view` | View reports (used from Phase 10) | Yes | No |

Permissions say what kind of action someone can take. Scope rules (section 4.4) say which items they can take it on. Both are checked on every request.

The Admin role is locked: it always has every permission and cannot be edited or deleted.

---

## 4. Work items

### 4.1 One model, three kinds

Tickets, projects, and tasks are stored in one `items` table with a `kind` column. They share numbering, assignees, watchers, comments, attachments, the activity timeline, notifications, and visibility rules. Converting a ticket into a project changes its kind. It keeps its number, history, comments, and attachments. See [ADR 0004](decisions/0004-unified-work-item-model.md).

Every item gets a number that is unique within the organization and shown with a prefix, for example `PM-42`. The prefix is an organization setting.

### 4.2 Tickets

Fields:

- Title (required), description (Markdown)
- Requester (defaults to the submitter; can be set to someone else by people with work access)
- Department (required) and category (from that department's category list)
- Location: Main Office, Accounting Office, Waikiki Kiosk (admin-editable list)
- Priority: Low, Normal (default), High, Urgent
- Status: New, Open, Waiting on Requester, Waiting on Vendor, Resolved, Closed
- Assignees (zero or more), watchers (zero or more), tags
- Due date (optional, date only)
- Restricted flag and access list (section 4.5)
- Attachments and comments

Status rules:

- New tickets start as New. Assigning someone or adding a public reply from someone with work access moves it to Open automatically.
- Resolved means the work is done but the requester can still reopen. Closed is final; a closed ticket can only be reopened by someone with work access.
- `resolved_at` and `closed_at` are recorded and cleared on reopen. They feed reports.
- No SLA timers. Priority and due date are the only urgency signals.

What a requester can do on their own ticket: view it, add public replies and attachments, edit the title and description while it is still New, mark it Resolved, and reopen it while it is Resolved.

A form-level warning appears on every ticket, comment, and attachment form: do not put passwords, card numbers, or other sensitive credentials in tickets.

### 4.3 Projects and tasks

Projects:

- Created directly ("New project") or by converting a ticket ("Convert to project").
- Fields: title, description, owning department, assignees (project owners), watchers, start date, due date, priority, tags, restricted flag.
- Status: Active, On Hold, Completed, Cancelled.
- Progress is calculated from tasks: done tasks divided by total tasks.

Converting a ticket into a project:

- Allowed for anyone with work access to the ticket.
- The item keeps its number, comments, attachments, and history. The timeline records the conversion.
- The requester stays the requester and is notified. To the requester it shows as "In project" with a progress summary (for example "3 of 7 tasks done"). They do not need to see every task.
- When the project is Completed, the requester is notified.

Tasks:

- Always belong to exactly one project. One level only: tasks do not have their own subtasks. (A simple checklist inside a task can be added later if needed.)
- Fields: title, description, assignees (any active user, from any department), watchers, priority, due date, board column, position in column.
- Tasks inherit the project's department and restricted flag.
- Tasks have comments and attachments, same as any item.
- A task's status comes from its board column (section 4.6).

### 4.4 Visibility and work access

These rules are implemented in exactly one module and used by every endpoint that returns items, comments, attachments, search results, boards, notifications, or reports. See [ADR 0005](decisions/0005-permissions-and-visibility.md).

A user can see (view) an item if any of these is true:

1. They have `items.view_all` (and the item is not restricted), or
2. They are a member of the item's department (and the item is not restricted), or
3. They are the requester, an assignee, or a watcher of the item, or
4. They are an assignee or watcher of any task in a project, which lets them see that project and its tasks, or
5. The item is restricted and they are on its access list, or they have `items.view_restricted`.

For restricted items, only rule 5 applies. The requester is always on the access list, and assignees and watchers must be on it (section 4.5).

A user has work access to an item (can edit fields, change status, write internal notes, add assignees and watchers, convert to project) if they can see it and any of these is true:

- They have `items.edit_any`, or
- They are a member of the item's department, or
- They are an assignee of the item, or of its parent project.

Internal notes are visible only to people with work access. A requester or watcher without work access never sees internal notes.

Until Phase 5 is finished, these rules are not enforced and every signed-in user can see every item. Do not invite anyone other than Admins to production until Phase 5 is done.

### 4.5 Restricted items

- Anyone with work access can mark an item restricted and manage its access list. Admins can always see restricted items.
- Restricted items are hidden from department queues, boards, search, and reports for anyone not on the access list.
- When an item is restricted, its requester, assignees, and watchers are added to the access list automatically. The requester cannot be removed from the list while they are the requester.
- Adding an assignee to a restricted item prompts to add them to the access list. Adding a watcher who is not on the list is blocked.
- Every view of a restricted item is recorded in the audit log, not just changes.
- Notification emails about restricted items never include the title or any content (section 6.2).
- Tasks inherit their project's restricted flag and access list.

### 4.6 Kanban boards

Project boards:

- Every new project gets default columns: Backlog, To Do, In Progress, Blocked, Done.
- Columns can be added, renamed, reordered, and deleted by anyone with work access to the project. A column must be empty before it can be deleted.
- Every column has a category: Not Started, In Progress, or Done. Progress and reports use the category, not the column name. A board must always have at least one Done column.
- Tasks are moved by drag and drop on computers. On phones, the board shows one column at a time with a column switcher, and each card has a "Move to" menu instead of drag and drop.

Ticket queue board:

- A department's ticket queue can be shown as a board. The columns are the ticket statuses, and they are not editable.
- Dragging a ticket to a column changes its status, following the status rules in 4.2.

### 4.7 Comments, attachments, and timeline

- Comments are Markdown, either public replies or internal notes. Internal notes look clearly different in the UI.
- Authors can edit their own comments (an "edited" marker is shown) and delete them (soft delete, with the deletion recorded in the audit log).
- Attachments can be added to an item or a comment. The default size limit is 25 MB per file, set in organization settings. Allowed types: common images, PDF, Office documents, text, CSV, and ZIP.
- Attachments are stored in private storage and downloaded only through the app after a permission check. Image previews are shown inline.
- Every item has an activity timeline that merges comments with changes (status, assignees, fields, conversion). Internal-only events are hidden from people without work access.
- @mentions in comments notify the mentioned person. The autocomplete only offers people who can see the item. Mentioning someone who cannot see it shows a warning and does not notify them.

---

## 5. Departments, categories, and locations

- Admins manage departments. Departments are archived, never deleted. Archived departments cannot receive new items.
- Users can belong to several departments.
- Each department has its own category list (for example IT: Hardware, Software, Account Access, Network, Security, Purchase Request).
- Locations are one shared list. Seeded with Main Office, Accounting Office, Waikiki Kiosk.

---

## 6. Notifications

### 6.1 In-app

- A notification bell with an unread count, a list of notifications, mark-as-read, and mark-all-read. Clicking a notification opens the item.

### 6.2 Email

- Sent through a transactional email provider on E Noa's domain, with SPF, DKIM, and DMARC set up. The provider is chosen in Phase 6 and recorded as a decision.
- Emails contain the item number, title, a short description of what changed, and a link. They never include item descriptions or internal notes.
- For restricted items, emails say only "A restricted item you have access to was updated" with a link.
- Invites are sent by email once email is available. Before then, Admins copy the invite link and send it themselves.

### 6.3 Events and defaults

| Event | Who is notified | In-app | Email |
|---|---|---|---|
| You were assigned | The new assignee | On | On |
| You were mentioned | The mentioned person | On | On |
| New public reply | Requester, assignees, watchers (not the author) | On | On |
| New internal note | Assignees and watchers with work access | On | Off |
| Status changed on your request | Requester | On | On |
| Your ticket became a project / project completed | Requester | On | On |
| New ticket in your department's queue | Department members | On | Off |
| Due tomorrow / overdue | Assignees | On | On (daily digest) |

Each user can turn each event on or off per channel. Due and overdue reminders run once a day at 7:00 AM Hawaii time.

### 6.4 Later

Google Chat and Microsoft Teams notifications are a later phase.

---

## 7. Reports (Phase 10)

Reports are lower priority than daily use and come after cutover. Initial set:

- Opened vs. closed over time (by week)
- Counts by department, category, assignee, and location
- Average time to resolve, by department and category
- Overdue items
- CSV export of any item list or report

Reports respect visibility rules: people only see numbers for items they can see. Access requires `reports.view`.

---

## 8. Admin and audit

### 8.1 Admin screens

- Users: list, change role, change departments, deactivate and reactivate.
- Invites: create, list pending, revoke, re-send.
- Departments, categories, and locations.
- Organization settings: organization name, item number prefix, allowed sign-in domains, attachment size limit, time zone (default Pacific/Honolulu), sensitive-data warning text.
- Audit log viewer.

### 8.2 Audit log

- Every create, update, delete, status change, assignment, sign-in, failed or denied sign-in, invite action, role or permission change, and settings change writes an audit event in the same database transaction as the change itself.
- Views of restricted items are also recorded.
- Each event records: organization, actor, action, entity type and ID, what changed (before and after for changed fields), IP address, user agent, and time.
- The audit table is append-only. The database user the app runs as can insert and read audit events but cannot update or delete them.
- Admins can filter the log by user, action, item, and date range, and export it as CSV.
- Audit events are kept indefinitely.

---

## 9. Architecture

### 9.1 Overview

```
 Browser (React app)
      |
      |  HTTPS, session cookie
      v
 Edge access gate (Phase 9: GCP IAP or Cloudflare Access)
      |
      v
 Cloud Run service: one container
   - FastAPI backend under /api
   - Serves the built React app for every other path
      |                     |                    |
      v                     v                    v
 Cloud SQL (Postgres)   Cloud Storage         Email provider
                        (attachments)         (Phase 6)

 Cloud Scheduler --(signed request)--> /api/internal/jobs/run
   (sends queued emails, due reminders, recurring items)
```

Key points:

- One repository, one container, one Cloud Run service per environment. See [ADR 0002](decisions/0002-hosting-single-container-cloud-run.md).
- The backend is Python (FastAPI). The frontend is TypeScript (React). See [ADR 0001](decisions/0001-stack-python-backend-typescript-frontend.md).
- The frontend's API client and types are generated from the backend's OpenAPI schema. Nobody hand-writes API types.
- No Redis, no task queue, no separate worker service. Background work is done by a job endpoint that Cloud Scheduler calls every minute, working through tables in Postgres. See [ADR 0007](decisions/0007-background-jobs-scheduler-and-outbox.md).

### 9.2 Repository layout

```
pm_system/
  CLAUDE.md
  docs/
    PLAN.md
    BACKLOG.md
    decisions/
    ops/                  runbooks: deploy, restore, GCP setup
  backend/
    pyproject.toml
    app/
      main.py             creates the FastAPI app, mounts routers and static files
      core/               config, database, security, permissions, audit, visibility
      features/
        auth/
        users/
        invites/
        departments/
        items/
        comments/
        attachments/
        boards/
        notifications/
        reports/
        jobs/
      static/             built frontend copied here in the container (git-ignored)
    migrations/           Alembic
    tests/
  frontend/
    package.json
    src/
      api/                generated schema and client (do not edit by hand)
      app/                routing, layout, theme, providers
      components/         shared UI components
      features/           one folder per feature, matching the backend
  infra/                  GCP setup script and Cloud Scheduler config
  Dockerfile
  docker-compose.yml      local Postgres, Mailpit, and the app
  .github/workflows/      ci.yml, deploy.yml
  Makefile                shortcuts for common commands
```

### 9.3 Backend

- Python 3.12 or newer, FastAPI, SQLAlchemy 2 (typed ORM), Alembic for migrations, Pydantic for request and response models, pydantic-settings for configuration, Authlib for OIDC, psycopg 3, uv for dependency management. Use the latest stable versions at the start of Phase 0 and pin them.
- Each feature folder has the same four parts:
  - `routes.py`: HTTP endpoints. Thin. Parse input, call a service, return output.
  - `service.py`: the business rules. This is the code Chris reads and edits. Every function has a plain-English docstring explaining the rule, and rules are written as straightforwardly as possible.
  - `models.py`: database tables (SQLAlchemy).
  - `schemas.py`: request and response shapes (Pydantic).
- Shared rules live in `app/core/`:
  - `permissions.py`: the list of permissions and `require_permission(...)`.
  - `visibility.py`: `can_view(user, item)`, `has_work_access(user, item)`, and `visible_items(user)` (a query filter). The only place visibility rules exist.
  - `audit.py`: `record_audit(...)`.
  - `org.py`: helpers that scope every query to the current organization.
- API conventions:
  - All endpoints under `/api`. JSON in and out.
  - List endpoints are paginated (`page`, `page_size`, default 50, max 200) and return `items` and `total`.
  - Errors return `{"error": {"code": "...", "message": "..."}}` with the right HTTP status. Messages are written for end users.
  - Times are stored in UTC and returned as ISO 8601 with time zone. Due dates are plain dates. The UI shows times in the organization's time zone (Pacific/Honolulu).
- Markdown is rendered on the frontend and sanitized. Raw HTML in Markdown is not allowed.

### 9.4 Frontend

- TypeScript, React, Vite, React Router, TanStack Query for server data, Tailwind CSS with shadcn/ui components, dnd-kit for drag and drop, openapi-typescript and openapi-fetch for the generated API client.
- Light, dark, and "match system" themes, chosen per user and remembered in the browser. All colors come from theme tokens.
- Mobile-first and responsive. Every screen must work on a phone (360px wide) and a computer. No native app.
- Accessible basics: keyboard navigation for all actions, visible focus, labels on form fields, sufficient color contrast in both themes.
- Main navigation: My Work, My Requests, Queues (one per department the user belongs to), Projects, All Items (if allowed), Admin (if allowed). A "New" button for ticket or project is always visible.

### 9.5 Background jobs and email

- Emails are not sent during the web request. The request writes a row to an `email_outbox` table in the same transaction as the change. The job runner sends queued emails, with retries and backoff, and marks them sent or failed.
- Cloud Scheduler calls `POST /api/internal/jobs/run` every minute with a Google-signed OIDC token. The endpoint only accepts requests signed for the scheduler's service account. It runs: send queued email, due and overdue reminders (once a day), and recurring items (Phase 13).
- Jobs must be safe to run twice. Use row locking (`SELECT ... FOR UPDATE SKIP LOCKED`) so overlapping runs never send the same email twice.
- Locally, email goes to Mailpit (a local inbox in Docker Compose) and jobs can be run with a command.

### 9.6 Ready for more than one company (not built yet)

PM_System may be sold to other small firms later. To keep that cheap without building it now (see [ADR 0006](decisions/0006-organization-id-for-future-multi-company.md)):

- An `organizations` table exists and holds one row: E Noa.
- Every business table has an `org_id` column, and every query is scoped to the current user's organization through the helpers in `app/core/org.py`.
- Settings that would differ per company (name, number prefix, time zone, allowed domains, attachment limits) live in organization settings, not in code or environment variables.
- There is no UI for creating or switching organizations, and no per-organization billing. Those are future work.

---

## 10. Data model

All tables have `id` (UUID), `created_at`, and `updated_at`. All business tables also have `org_id`. Soft-deleted rows have `deleted_at` and are excluded by default.

| Table | Purpose and key columns |
|---|---|
| `organizations` | `name`, `item_prefix`, `next_item_number`, `time_zone`, `allowed_domains`, `attachment_max_mb`, `sensitive_warning_text` |
| `users` | `email` (unique per org, stored lowercase), `name`, `avatar_url`, `role_id`, `is_active`, `last_sign_in_at`, `theme_preference` |
| `user_identities` | `user_id`, `provider` (google, microsoft), `subject` (the provider's user ID). Lets one user sign in with Google now and Microsoft later. |
| `sessions` | `user_id`, `token_hash`, `expires_at`, `last_seen_at`, `ip`, `user_agent`, `revoked_at`. Only a hash of the session token is stored. |
| `roles` | `name`, `description`, `is_builtin`, `is_locked` |
| `role_permissions` | `role_id`, `permission` (string from `permissions.py`) |
| `invites` | `email`, `role_id`, `department_ids`, `invited_by`, `expires_at`, `accepted_at`, `revoked_at` |
| `departments` | `name`, `description`, `archived_at` |
| `department_members` | `department_id`, `user_id` |
| `categories` | `department_id`, `name`, `position`, `archived_at` |
| `locations` | `name`, `position`, `archived_at` |
| `items` | `number`, `kind` (ticket, project, task), `title`, `description`, `department_id`, `category_id`, `location_id`, `priority`, `status`, `requester_id`, `created_by`, `parent_id` (task's project), `board_column_id`, `position`, `start_date`, `due_date`, `is_restricted`, `converted_at`, `converted_by`, `resolved_at`, `closed_at`, `deleted_at` |
| `item_assignees` | `item_id`, `user_id` |
| `item_watchers` | `item_id`, `user_id` |
| `item_access` | `item_id`, `user_id`. The access list for restricted items. |
| `tags`, `item_tags` | Tag names per organization, and which items have them |
| `comments` | `item_id`, `author_id`, `body`, `visibility` (public, internal), `edited_at`, `deleted_at` |
| `attachments` | `item_id`, `comment_id` (optional), `storage_key`, `filename`, `content_type`, `size_bytes`, `uploaded_by`, `deleted_at` |
| `board_columns` | `project_id`, `name`, `category` (not_started, in_progress, done), `position` |
| `notifications` | `user_id`, `event`, `item_id`, `actor_id`, `summary`, `read_at` |
| `notification_preferences` | `user_id`, `event`, `in_app`, `email` |
| `email_outbox` | `to_email`, `subject`, `body_text`, `body_html`, `status`, `attempts`, `next_attempt_at`, `sent_at`, `last_error` |
| `audit_events` | `actor_id`, `action`, `entity_type`, `entity_id`, `changes` (JSON), `ip`, `user_agent`, `created_at`. Append-only. |
| `job_runs` | `job`, `started_at`, `finished_at`, `status`, `details`. For seeing what background jobs did. |

Later phases add: `item_templates` and `template_tasks` (Phase 12), `recurrences` (Phase 13), and tables for approvals, knowledge base, and integrations when those are scheduled.

Rules the database enforces, not just the code:

- `items.kind = 'task'` requires `parent_id` pointing to a project. Other kinds must have no `parent_id`.
- `items.number` is unique per organization. Numbers come from `organizations.next_item_number`, incremented under a row lock in the same transaction that creates the item.
- Foreign keys everywhere, with indexes on every foreign key and on the columns used by the main lists: `(org_id, department_id, status)`, `(org_id, kind, parent_id)`, `(org_id, due_date)`.

---

## 11. Security

PM_System will hold internal operational details, HR matters, and security incidents. It is treated as holding confidential data under E Noa's security program.

### 11.1 Authentication and sessions

- Sign-in only through OIDC (Google now, Microsoft later). Use the Authorization Code flow with PKCE, and validate `state`, `nonce`, issuer, audience, and token signatures.
- Accept only verified emails on allowed domains, then require a matching active user or a valid, unexpired invite.
- Sessions are server-side. The browser gets a random session token in a cookie named `__Host-session` with `Secure`, `HttpOnly`, `SameSite=Lax`, and `Path=/`. The database stores only a hash of the token.
- Sessions expire after 24 hours of inactivity and 7 days in total, both configurable. Users and Admins can sign out sessions. Deactivating a user revokes all their sessions.
- Unsafe requests (POST, PUT, PATCH, DELETE) must carry an `Origin` header matching the app's own origin. This, together with `SameSite=Lax`, protects against cross-site request forgery.
- A development-only sign-in (pick a seeded user, no password) exists for local work and automated tests. It is enabled only when `APP_ENV=local`, and the app refuses to start if it is enabled in any other environment.

### 11.2 Authorization

- Every endpoint requires a signed-in user except health checks, the sign-in routes, and the job endpoint (which requires the scheduler's signed token).
- An automated test lists every route and fails if a route lacks authentication, unless it is on a short, explicit allowlist.
- Permission checks use `require_permission(...)`. Scope checks use `app/core/visibility.py`. Both are tested.
- `org_id` and user identity always come from the session, never from the request body or URL.
- When a user asks for an item they cannot see, the API returns 404, not 403, so the item's existence is not revealed.

### 11.3 Data handling

- Ticket forms warn against entering passwords, card numbers, or other credentials. This matters because card data must stay out of systems not built for it.
- Logs never contain session tokens, OIDC tokens, item descriptions, comment bodies, or attachment contents. Log IDs instead.
- Attachments: private bucket, random storage keys, served with `Content-Disposition: attachment` (images previewed inline from the same permission-checked endpoint), `X-Content-Type-Options: nosniff`, type allowlist, size limit, and filenames sanitized.
- Markdown is sanitized when rendered. No raw HTML.
- Secrets live in GCP Secret Manager and are injected at runtime. No secrets in the repository, in images, or in GitHub Actions logs.

### 11.4 Web security headers

Set on every response: a strict Content Security Policy (scripts and styles from the app's own origin only, `frame-ancestors 'none'`), `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy` turning off camera, microphone, and location.

### 11.5 Edge access gate

Before cutover, production goes behind an identity-aware gate (GCP Identity-Aware Proxy or Cloudflare Access) as a second layer in front of the app's own sign-in. The choice is made in Phase 9 and recorded as a decision. The job endpoint must still be reachable by Cloud Scheduler.

### 11.6 Dependencies and supply chain

- CI runs `pip-audit` and `npm audit` and fails on high or critical issues in production dependencies.
- GitHub Dependabot (or Renovate) opens weekly update pull requests.
- GitHub Actions authenticates to GCP with Workload Identity Federation. No long-lived service account keys.

### 11.7 Backups and recovery

- Cloud SQL automated daily backups with point-in-time recovery, kept for at least 14 days.
- The attachments bucket has object versioning and soft delete turned on.
- A restore is tested before cutover (Phase 9) and the steps are written in `docs/ops/restore.md`.
- Targets: lose at most 15 minutes of data, and be back up within 4 business hours.

### 11.8 Monitoring

- Structured JSON logs to Cloud Logging, with a request ID on every log line.
- Error Reporting for unhandled exceptions.
- An uptime check on `/api/health` that emails Chris if it fails.
- An alert if the job runner has not completed successfully for 15 minutes.

---

## 12. Environments and deployment

| Environment | Where | How it gets updated |
|---|---|---|
| Local | Docker Compose: Postgres, Mailpit, app with hot reload | Developer runs it |
| Staging | Cloud Run service `pm-system-staging`, database `pm_system_staging` | Automatically on every merge to `main` |
| Production | Cloud Run service `pm-system-prod`, database `pm_system_prod` | Manually, by promoting the exact image already tested on staging |

- Everything lives in one dedicated GCP project so its costs can be seen on their own.
- One Cloud SQL Postgres instance (smallest size that works) holds both the staging and production databases, to keep costs down. Each environment has its own database user that can only reach its own database. See [ADR 0002](decisions/0002-hosting-single-container-cloud-run.md).
- Separate Cloud Storage buckets and secrets per environment.
- Images are stored in Artifact Registry and tagged with the git commit.
- Database migrations run as a Cloud Run Job before the new version receives traffic. Migrations must be backward compatible with the version currently running (add first, remove later).
- `infra/setup-gcp.sh` documents and runs the one-time GCP setup with `gcloud`. It can be run again safely. No Terraform.

---

## 13. Testing

- Backend: pytest against a real Postgres (Docker locally, a service container in CI). Each test runs in a transaction that is rolled back.
- Every business rule in a service has tests. Visibility and work access have a full table of test cases (each rule in 4.4 and 4.5, each in both directions: allowed and denied).
- The route-authentication test from 11.2.
- Frontend: Vitest and Testing Library for components with logic (forms, boards, permission-driven UI).
- End-to-end: Playwright smoke tests of the main flows (Phase 9), run against the local stack using the development sign-in.
- CI also checks that the generated API client matches the backend schema.

---

## 14. Out of scope until scheduled

These are deliberately not being built now. Some are planned for later phases (see the backlog).

- SLA timers and time tracking (not wanted)
- Email-to-ticket (rarely used in Spiceworks; later phase)
- Approvals, knowledge base, AI triage and summaries, NinjaOne device links, Google Chat and Teams notifications (later phases)
- Asset inventory (NinjaOne already does this; link to it instead of duplicating it)
- Multi-company features, billing, public signup
- Native mobile apps
- Importing Spiceworks history. Active tickets are re-entered by hand at cutover; the rest of the history is exported and kept as a read-only archive.

---

## 15. Deferred decisions

| Decision | When | Notes |
|---|---|---|
| Email provider | Phase 6 | Options include Google Workspace SMTP relay, Postmark, SendGrid, Resend, Amazon SES. Consider the planned move to Microsoft. |
| Edge access gate | Phase 9 | GCP IAP or Cloudflare Access. Must work with Microsoft sign-in later and allow Cloud Scheduler through. |
| Production domain name | Phase 0 | For example a subdomain of E Noa's domain. Needed for cookies, OIDC redirect URLs, and email. |
