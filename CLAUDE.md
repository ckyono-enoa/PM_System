# CLAUDE.md

PM_System is E Noa Corporation's internal web app for IT tickets and cross-department projects, tasks, and kanban boards. It replaces Spiceworks. Chris (IT) owns it, reviews every pull request, and sometimes edits the Python himself.

## Sources of truth

Read these before working. They outrank anything else, including existing code.

- `docs/PLAN.md`: what the system is and how it works (requirements, architecture, data model, security).
- `docs/BACKLOG.md`: what to build next, story by story, plus the Definition of Done. Follow "How to work this backlog" at the top.
- `docs/decisions/`: why major choices were made. Do not reverse a decision without writing a new record that supersedes it.

If code and these documents disagree, the documents win. If a story needs the documents to change, change them in the same pull request and say so in the description.

## How to work

- One story per branch and pull request. Branch name: story ID plus a short slug, for example `p3-05-ticket-lists`.
- Before coding, read the story and every PLAN section and decision record it links.
- If a story will not fit in one session, split it in BACKLOG.md first (P3-05a, P3-05b) and do the first part.
- Stay inside the story. Put anything else you notice in the Inbox at the bottom of BACKLOG.md.
- Tick the story's checkbox in BACKLOG.md in the same pull request, once the Definition of Done is met.
- When a phase's stories are all ticked, set the phase to "Ready for demo" and stop. Chris approves each phase.

Stop and ask Chris before:

- Adding a significant new dependency (anything beyond what PLAN 9.3 and 9.4 list), or any new paid service.
- Changing sign-in, sessions, permissions, visibility, or the audit log beyond what the story says.
- Changing the data model beyond what the story needs.
- Anything in GCP that creates resources or costs money. Write scripts and docs; Chris runs them.
- Editing or deleting a migration that has already run on staging or production. Write a new migration instead.

## Code conventions

Backend (Python, FastAPI) in `backend/app/`:

- Each feature folder has `routes.py` (thin), `service.py` (business rules), `models.py` (tables), and `schemas.py` (request and response shapes).
- Business rules live only in `service.py` and `app/core/`. Every service function has a docstring that explains the rule in plain English. Chris reads these. Prefer clear, boring code over clever code.
- Type hints everywhere. ruff for linting and formatting, mypy for types.
- Every query is scoped to the organization through `app/core/org.py`. `org_id` and the current user come from the session, never from the request body or URL.
- Every write calls `record_audit(...)` in the same transaction.
- Permission checks use `require_permission(...)` from `app/core/permissions.py`. Never check role names.
- Anything that decides who can see or edit an item goes through `app/core/visibility.py`. Do not write visibility logic anywhere else. Items a user cannot see return 404.
- Emails are queued in `email_outbox`, never sent during a request.
- Store times in UTC. Due dates are plain dates. Display in the organization's time zone (Pacific/Honolulu).
- Use SQLAlchemy for queries. No string-built SQL.

Frontend (TypeScript, React) in `frontend/src/`:

- Never hand-edit `src/api/` except `client.ts`. Run `make gen-api` after any backend API change.
- Server data goes through TanStack Query hooks in each feature folder.
- Colors only from theme tokens. Every screen must work at 360px wide and on a computer, in light and dark themes, and with a keyboard.
- The frontend shows and hides actions based on the `permissions` block the API returns. It never decides permissions itself.
- Render Markdown sanitized, with raw HTML disabled.

## Security rules (always)

- Never log session tokens, OIDC tokens, item descriptions, comment bodies, or attachment contents. Log IDs.
- Never commit secrets. Configuration comes from environment variables (see `.env.example`), and secrets come from Secret Manager in staging and production.
- The development sign-in works only when `APP_ENV=local`. Keep the startup check that refuses to run otherwise.
- Emails never include item descriptions or internal notes, and say nothing about restricted items beyond "a restricted item was updated".
- New routes require a signed-in user. The only exceptions are on the allowlist in the route-authentication test. Do not add to it without asking.

## Commands

Run from the repository root. The Makefile target is listed first, then what it runs.

| Task | Command |
|---|---|
| First-time setup | `make setup` (installs Python deps with `uv sync` in `backend/` and npm deps with `npm ci` in `frontend/`) |
| Run everything locally | `make dev` (`docker compose up`: Postgres, Mailpit, backend with reload, frontend dev server) |
| All tests | `make test` (`uv run pytest` in `backend/`, `npm test` in `frontend/`) |
| Lint and type check | `make lint` (`uv run ruff check`, `uv run ruff format --check`, `uv run mypy app`, `npm run lint`, `npm run typecheck`) |
| Auto-format | `make format` (`uv run ruff format`, `npm run format`) |
| Regenerate API client | `make gen-api` |
| New migration | `make migration name=add_items_table` (`uv run alembic revision --autogenerate -m ...`) |
| Apply migrations | `make migrate` (`uv run alembic upgrade head`) |
| Run background jobs once | `make jobs` (from Phase 6) |
| Local email inbox | Mailpit at http://localhost:8025 |

Keep this table accurate whenever commands change.

## Pull request description

```
Story: P3-05 Ticket lists and queues

What changed and why:
...

How to test:
1. ...

Screenshots (UI changes): phone and computer, light and dark

Docs updated: PLAN.md section ... / decision record ... / none
```
