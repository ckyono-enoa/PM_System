# PM_System

E Noa Corporation's internal web app for IT tickets and cross-department projects, tasks, and kanban boards. It replaces Spiceworks.

- What it is and how it works: [docs/PLAN.md](docs/PLAN.md)
- What gets built next: [docs/BACKLOG.md](docs/BACKLOG.md)
- Why major choices were made: [docs/decisions/](docs/decisions/README.md)
- How to work in this repository (for people and Claude Code): [CLAUDE.md](CLAUDE.md)

## Run it locally

You need Docker Desktop, [uv](https://docs.astral.sh/uv/), Node.js 24 or newer, and `make`. On Windows:

```
winget install Docker.DockerDesktop astral-sh.uv OpenJS.NodeJS.LTS ezwinports.make
```

Then, from the repository root:

```
make setup   # install dependencies on your computer (for your editor, tests, and linters)
make dev     # start Postgres, Mailpit, the backend, and the frontend
```

| What | Where |
|---|---|
| The app | http://localhost:5173 |
| API health check | http://localhost:8000/api/health |
| API docs | http://localhost:8000/api/docs |
| Local email inbox (Mailpit) | http://localhost:8025 |

Code changes reload automatically. Stop everything with Ctrl+C.

The database is empty until you run `make migrate`, which creates the tables and adds E Noa as the organization. `make test` needs the Postgres container running (`make dev`); it creates and removes its own throwaway databases and never touches your development data.

Other everyday commands: `make test`, `make lint`, and `make format`. The full list, with what each one runs, is in [CLAUDE.md](CLAUDE.md#commands).
