# The one production image (ADR 0002): the React frontend is built first, then
# copied into the Python backend, which serves it next to the API.

# Stage 1: build the frontend.
FROM node:24-slim AS frontend
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json frontend/.npmrc ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: the backend, serving the API and the built frontend.
FROM python:3.14-slim
COPY --from=ghcr.io/astral-sh/uv:0.13.6 /uv /bin/uv

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install dependencies before copying the code, so this layer is reused until uv.lock changes.
COPY backend/pyproject.toml backend/uv.lock backend/.python-version ./
RUN uv sync --locked --no-dev

COPY backend/ ./
COPY --from=frontend /frontend/dist ./app/static

# Run as an unprivileged user.
RUN useradd --system --uid 10001 app
USER app

# The deploy workflow passes the git commit, and /api/health reports it.
ARG GIT_COMMIT=dev
ENV GIT_COMMIT=$GIT_COMMIT \
    PATH="/app/.venv/bin:$PATH"

# Cloud Run sets PORT.
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
