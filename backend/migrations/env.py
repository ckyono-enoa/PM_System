"""How Alembic connects to the database and finds the app's tables."""

from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine

from app.core.config import get_settings
from app.core.models import Base

# Import every feature's models here so autogenerate can see their tables.
from app.features.organizations import models as organization_models  # noqa: F401

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name, disable_existing_loggers=False)

target_metadata = Base.metadata


def run_migrations_online() -> None:
    """Run the migrations against the database.

    Tests point Alembic at a throwaway database by setting `sqlalchemy.url`;
    otherwise it uses DATABASE_URL.
    """
    url = config.get_main_option("sqlalchemy.url") or get_settings().database_url
    engine = create_engine(url)
    with engine.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()
    engine.dispose()


run_migrations_online()
