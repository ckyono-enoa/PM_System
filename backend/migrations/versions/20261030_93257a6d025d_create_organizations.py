"""create organizations

Creates the organizations table and adds the one organization, E Noa.

Revision ID: 93257a6d025d
Revises:
Create Date: 2026-10-30 09:42:06
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "93257a6d025d"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    organizations = op.create_table(
        "organizations",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("item_prefix", sa.Text(), nullable=False),
        sa.Column("next_item_number", sa.Integer(), server_default=sa.text("1"), nullable=False),
        sa.Column(
            "time_zone",
            sa.Text(),
            server_default=sa.text("'Pacific/Honolulu'"),
            nullable=False,
        ),
        sa.Column(
            "allowed_domains",
            sa.ARRAY(sa.Text()),
            server_default=sa.text("'{}'::text[]"),
            nullable=False,
        ),
        sa.Column("attachment_max_mb", sa.Integer(), server_default=sa.text("25"), nullable=False),
        sa.Column(
            "sensitive_warning_text",
            sa.Text(),
            server_default=sa.text(
                "'Do not put passwords, card numbers, or other sensitive credentials in tickets.'"
            ),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # Seed: the one organization that exists today. The other columns use their defaults.
    op.bulk_insert(
        organizations,
        [
            {
                "name": "E Noa Corporation",
                "item_prefix": "PM",
                "time_zone": "Pacific/Honolulu",
                "next_item_number": 1,
            }
        ],
    )


def downgrade() -> None:
    op.drop_table("organizations")
