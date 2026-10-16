"""companies and jobs

Revision ID: 0002_companies_jobs
Revises: 0001_initial_identity
Create Date: 2025-01-01 00:00:01
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0002_companies_jobs"
down_revision: Union[str, None] = "0001_initial_identity"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "companies",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False, unique=True),
        sa.Column("slug", sa.String(220), nullable=False, unique=True),
        sa.Column("about", sa.Text(), nullable=True),
        sa.Column("logo_url", sa.String(500), nullable=True),
        sa.Column("website", sa.String(500), nullable=True),
        sa.Column("size_range", sa.String(50), nullable=True),
        sa.Column("industry", sa.String(120), nullable=True),
        sa.Column("company_type", sa.String(32), nullable=False, server_default="startup"),
        sa.Column("is_newly_founded", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("founded_year", sa.Integer(), nullable=True),
        sa.Column("headquarters", sa.String(200), nullable=True),
        sa.Column("owner_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_companies_company_type", "companies", ["company_type"])
    op.create_index("ix_companies_is_newly_founded", "companies", ["is_newly_founded"])
    op.create_index("ix_companies_industry", "companies", ["industry"])
    op.execute(
        "CREATE INDEX ix_companies_name_trgm ON companies USING gin (name gin_trgm_ops)"
    )

    op.create_table(
        "jobs",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("posted_by_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("job_type", sa.String(32), nullable=False, server_default="full_time"),
        sa.Column("work_mode", sa.String(32), nullable=False, server_default="onsite"),
        sa.Column("is_remote", sa.Boolean(), nullable=False, server_default=sa.text("false"), index=True),
        sa.Column("location", sa.String(200), nullable=True),
        sa.Column("salary_min", sa.Integer(), nullable=True),
        sa.Column("salary_max", sa.Integer(), nullable=True),
        sa.Column("salary_currency", sa.String(8), nullable=False, server_default="INR"),
        sa.Column("experience_level", sa.String(32), nullable=False, server_default="mid"),
        sa.Column("min_experience_years", sa.Integer(), nullable=True),
        sa.Column("skills", postgresql.ARRAY(sa.String()), nullable=False, server_default="{}"),
        sa.Column("required_skills", postgresql.ARRAY(sa.String()), nullable=False, server_default="{}"),
        sa.Column("keywords", postgresql.ARRAY(sa.String()), nullable=False, server_default="{}"),
        sa.Column("tags", postgresql.ARRAY(sa.String()), nullable=False, server_default="{}"),
        sa.Column("is_fresher_friendly", sa.Boolean(), nullable=False, server_default=sa.text("false"), index=True),
        sa.Column("posted_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now(), index=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true"), index=True),
        sa.Column("applicant_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("competition_level", sa.String(16), nullable=False, server_default="low", index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("applicant_count >= 0", name="ck_jobs_applicant_count_non_negative"),
        sa.CheckConstraint(
            "salary_min IS NULL OR salary_max IS NULL OR salary_max >= salary_min",
            name="ck_jobs_salary_range_valid",
        ),
    )
    op.create_index("ix_jobs_active_posted", "jobs", ["is_active", "posted_at"])
    op.create_index("ix_jobs_company_active", "jobs", ["company_id", "is_active"])
    op.create_index("ix_jobs_competition_posted", "jobs", ["competition_level", "posted_at"])
    op.execute("CREATE INDEX ix_jobs_title_trgm ON jobs USING gin (title gin_trgm_ops)")
    op.execute("CREATE INDEX ix_jobs_description_trgm ON jobs USING gin (description gin_trgm_ops)")
    op.execute("CREATE INDEX ix_jobs_location_trgm ON jobs USING gin (location gin_trgm_ops)")
    op.execute("CREATE INDEX ix_jobs_skills_gin ON jobs USING gin (skills)")
    op.execute("CREATE INDEX ix_jobs_required_skills_gin ON jobs USING gin (required_skills)")
    op.execute("CREATE INDEX ix_jobs_keywords_gin ON jobs USING gin (keywords)")
    op.execute("CREATE INDEX ix_jobs_tags_gin ON jobs USING gin (tags)")


def downgrade() -> None:
    op.drop_index("ix_jobs_tags_gin", table_name="jobs")
    op.drop_index("ix_jobs_keywords_gin", table_name="jobs")
    op.drop_index("ix_jobs_required_skills_gin", table_name="jobs")
    op.drop_index("ix_jobs_skills_gin", table_name="jobs")
    op.drop_index("ix_jobs_location_trgm", table_name="jobs")
    op.drop_index("ix_jobs_description_trgm", table_name="jobs")
    op.drop_index("ix_jobs_title_trgm", table_name="jobs")
    op.drop_index("ix_jobs_competition_posted", table_name="jobs")
    op.drop_index("ix_jobs_company_active", table_name="jobs")
    op.drop_index("ix_jobs_active_posted", table_name="jobs")
    op.drop_table("jobs")
    op.drop_index("ix_companies_name_trgm", table_name="companies")
    op.drop_index("ix_companies_industry", table_name="companies")
    op.drop_index("ix_companies_is_newly_founded", table_name="companies")
    op.drop_index("ix_companies_company_type", table_name="companies")
    op.drop_table("companies")