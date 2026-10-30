# 0001. Python backend, TypeScript frontend

Status: Accepted
Date: 2026-10-29

## Context

PM_System is built mostly by Claude Code, with Chris reviewing and sometimes editing code himself. Chris reads Python more comfortably than TypeScript. He also wants the project to be straightforward to hand off to another developer, and does not want it overcomplicated.

The browser side has to be JavaScript or TypeScript regardless. The question was the backend.

## Decision

- Backend: Python with FastAPI, SQLAlchemy 2, Alembic, and Pydantic.
- Frontend: TypeScript with React and Vite.
- PostgreSQL database.
- The frontend's API types and client are generated from the backend's OpenAPI schema, so the backend is the single definition of the API.
- Both live in one repository and ship as one container (see 0002).

To keep two languages from becoming complicated:

- Business rules live only in the backend's `service.py` files and `app/core/`. The frontend displays data and calls the API. It does not re-implement rules.
- Nobody hand-writes API types. `make gen-api` regenerates them and CI fails if they are stale.
- One set of commands (the Makefile) covers both halves.

## Consequences

- The parts Chris is most likely to read and change (permissions, visibility, status rules, notifications, reports, future AI features) are all in Python.
- FastAPI with React is a common, well-documented pairing, which helps both hand-off and Claude Code.
- Two toolchains (uv and npm) and two sets of linters. The Makefile and CI hide most of this.
- Any change to the API requires regenerating the client, which CI enforces.

## Alternatives considered

- TypeScript everywhere (for example Next.js). One language and shared types, but the business logic would be in TypeScript, which Chris finds harder to read and edit.
- Python everywhere with server-rendered pages (for example Django templates or HTMX). Simpler, but a kanban board with drag and drop and a polished mobile experience are much easier with React.
- Django instead of FastAPI. Batteries included (admin, ORM, auth), but heavier, and its built-in admin and auth would be partly bypassed anyway because of OIDC-only sign-in and custom permissions.
