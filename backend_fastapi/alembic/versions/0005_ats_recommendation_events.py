"""ats_scores and recommendation_events

Revision ID: 0005_ats_recommendation_events
Revises: 0004_resumes
Create Date: 2025-01-01 00:00:04
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0005_ats_recommendation_events"
down_revision: Union[str, None] = "0004_resumes"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "ats_scores",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("resume_version_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("resume_versions.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("job_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("match_score", sa.Float(), nullable=False),
        sa.Column("keyword_score", sa.Float(), nullable=False),
        sa.Column("semantic_score", sa.Float(), nullable=True),
        sa.Column("missing_skills", postgresql.JSONB(), nullable=False, server_default="[]"),
        sa.Column("missing_keywords", postgresql.JSONB(), nullable=False, server_default="[]"),
        sa.Column("suggestions", postgresql.JSONB(), nullable=False, server_default="[]"),
        sa.Column("suggestion_source", sa.String(32), nullable=False, server_default="rule_based"),
        sa.Column("generated_by", sa.String(64), nullable=False, server_default="heuristic-v0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("resume_version_id", "job_id", name="uq_ats_scores_version_job"),
    )
    op.create_index("ix_ats_scores_user_created", "ats_scores", ["user_id", "created_at"])

    op.create_table(
        "recommendation_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("job_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("match_score", sa.Float(), nullable=False),
        sa.Column("reason_tags", postgresql.JSONB(), nullable=False, server_default="[]"),
        sa.Column("generated_by", sa.String(64), nullable=False, server_default="heuristic-v0"),
        sa.Column("shown_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now(), index=True),
    )


def downgrade() -> None:
    op.drop_table("recommendation_events")
    op.drop_index("ix_ats_scores_user_created", table_name="ats_scores")
    op.drop_table("ats_scores")