"""resumes, resume_versions, resume_skills

Revision ID: 0004_resumes
Revises: 0003_swipes_applications
Create Date: 2025-01-01 00:00:03
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0004_resumes"
down_revision: Union[str, None] = "0003_swipes_applications"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "resumes",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "resume_versions",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("resume_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("version_number", sa.Integer(), nullable=False),
        sa.Column("original_filename", sa.String(300), nullable=False),
        sa.Column("content_type", sa.String(100), nullable=False),
        sa.Column("file_size_bytes", sa.Integer(), nullable=False),
        sa.Column("storage_key", sa.String(500), nullable=False),
        sa.Column("checksum_sha256", sa.String(64), nullable=False),
        sa.Column("parsed_text", sa.Text(), nullable=True),
        sa.Column("parsed_experience", postgresql.JSONB(), nullable=True),
        sa.Column("parse_status", sa.String(16), nullable=False, server_default="pending"),
        sa.Column("parse_error", sa.Text(), nullable=True),
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("resume_id", "version_number", name="uq_resume_versions_number"),
    )
    op.create_index(
        "uq_resume_versions_default_per_user",
        "resume_versions",
        ["user_id"],
        unique=True,
        postgresql_where=sa.text("is_default = true"),
    )

    op.create_table(
        "resume_skills",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("resume_version_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("resume_versions.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("skill_name", sa.String(120), nullable=False),
        sa.Column("normalized_name", sa.String(120), nullable=False, index=True),
        sa.Column("category", sa.String(64), nullable=True),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column("years", sa.Integer(), nullable=True),
        sa.UniqueConstraint("resume_version_id", "normalized_name", name="uq_resume_skills_version_name"),
    )

    # Now that resume_versions exists, add the FK on applications.resume_version_id
    op.create_foreign_key(
        "fk_applications_resume_version_id",
        "applications",
        "resume_versions",
        ["resume_version_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_applications_resume_version_id", "applications", type_="foreignkey")
    op.drop_table("resume_skills")
    op.drop_index("uq_resume_versions_default_per_user", table_name="resume_versions")
    op.drop_table("resume_versions")
    op.drop_table("resumes")