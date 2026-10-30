# Shortcuts for common tasks. Run from the repository root.
# The command behind each target is also listed in CLAUDE.md. Keep both in step.

.PHONY: setup dev test lint format gen-api migrate migration

setup:
	cd backend && uv sync
	cd frontend && npm ci

dev:
	docker compose up

test:
	cd backend && uv run pytest
	cd frontend && npm test

lint:
	cd backend && uv run ruff check
	cd backend && uv run ruff format --check
	cd backend && uv run mypy app tests
	cd frontend && npm run lint
	cd frontend && npm run typecheck

format:
	cd backend && uv run ruff format
	cd frontend && npm run format

gen-api:
	$(error make gen-api arrives with P0-04, the generated API client)

migrate:
	cd backend && uv run alembic upgrade head

migration:
	$(if $(name),,$(error Give the migration a name, for example: make migration name=add_items_table))
	cd backend && uv run alembic revision --autogenerate -m "$(name)"
