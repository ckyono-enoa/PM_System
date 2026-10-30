"""Creates the FastAPI app: the API under /api, and the built frontend for every other path."""

from pathlib import Path

from fastapi import APIRouter, FastAPI, HTTPException
from fastapi.responses import FileResponse

from app.features.health.routes import router as health_router

# The Docker build copies the built frontend here. In local development it is
# usually missing, because the Vite dev server serves the frontend instead.
STATIC_DIR = Path(__file__).parent / "static"


def create_app(static_dir: Path = STATIC_DIR) -> FastAPI:
    """Build the app. Tests pass their own `static_dir`."""
    app = FastAPI(
        title="PM_System",
        openapi_url="/api/openapi.json",
        docs_url="/api/docs",
        redoc_url=None,
    )

    api = APIRouter(prefix="/api")
    api.include_router(health_router)
    app.include_router(api)

    if (static_dir / "index.html").is_file():
        _serve_frontend(app, static_dir)

    return app


def _serve_frontend(app: FastAPI, static_dir: Path) -> None:
    """Serve the built React app for every path that is not under /api.

    - A path that matches a real file (for example /favicon.svg) gets that file.
    - Files under /assets/ have content hashes in their names, so browsers may
      cache them forever. A missing one is a 404, not the app page.
    - Any other path is a client route (for example /queues/it), so it gets
      index.html and React Router takes over. index.html is never cached, so
      a new deploy is picked up on the next page load.
    - Unknown /api paths stay a 404 instead of returning the app page.
    """
    root = static_dir.resolve()
    index = root / "index.html"

    @app.get("/{path:path}", include_in_schema=False)
    def frontend(path: str) -> FileResponse:
        if path == "api" or path.startswith("api/"):
            raise HTTPException(status_code=404)

        file = (root / path).resolve()
        if file.is_relative_to(root) and file.is_file():
            if path.startswith("assets/"):
                return FileResponse(
                    file, headers={"Cache-Control": "public, max-age=31536000, immutable"}
                )
            return FileResponse(file)

        if path.startswith("assets/"):
            raise HTTPException(status_code=404)

        return FileResponse(index, headers={"Cache-Control": "no-cache"})


app = create_app()
