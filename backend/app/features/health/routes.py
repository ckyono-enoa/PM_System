from fastapi import APIRouter

from app.core.config import get_settings
from app.features.health.schemas import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> HealthResponse:
    """Say the app is up, and which git commit is running."""
    return HealthResponse(status="ok", version=get_settings().git_commit)
