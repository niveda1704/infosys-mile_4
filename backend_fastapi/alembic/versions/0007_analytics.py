"""daily_job_stats and skill_demand_daily

Revision ID: 0007_analytics
Revises: 0006_notifications
Create Date: 2025-01-01 00:00:06
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0007_analytics"
down_revision: Union[str, None] = "0006_notifications"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "daily_job_stats",
        sa.Column("date", sa.Date(), primary_key=True),
        sa.Column("company_type", sa.String(32), primary_key=True),
        sa.Column("jobs_posted", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("applications_count", sa.Integer(), nullable=False, server_default="0"),
    )

    op.create_table(
        "skill_demand_daily",
        sa.Column("date", sa.Date(), primary_key=True),
        sa.Column("skill", sa.String(120), primary_key=True),
        sa.Column("job_count", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_index("ix_skill_demand_daily_date", "skill_demand_daily", ["date"])


def downgrade() -> None:
    op.drop_index("ix_skill_demand_daily_date", table_name="skill_demand_daily")
    op.drop_table("skill_demand_daily")
    op.drop_table("daily_job_stats")