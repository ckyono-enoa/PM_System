"""App configuration, read from environment variables."""

from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Every setting the app reads from its environment.

    Each field is read from the environment variable of the same name in capitals,
    for example `git_commit` comes from `GIT_COMMIT`.
    """

    # The git commit the running image was built from. The Docker build sets it;
    # anywhere else it stays "dev".
    git_commit: str = "dev"

    # Where the database is. The default matches the Postgres container that
    # `make dev` starts, as seen from your own computer. Staging and production
    # set DATABASE_URL from Secret Manager.
    database_url: str = "postgresql+psycopg://pm_system:pm_system@localhost:5432/pm_system"


@lru_cache
def get_settings() -> Settings:
    """Return the settings, read once when first asked for."""
    return Settings()
