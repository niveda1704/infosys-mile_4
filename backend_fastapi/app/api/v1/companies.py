"""Company endpoints."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import (
    CurrentUser,
    PaginationDep,
    get_db,
)
from app.models.enums import CompanyType, UserRole
from app.schemas.common import Page
from app.schemas.company import CompanyCreate, CompanyResponse, CompanyUpdate
from app.schemas.job import JobCardResponse
from app.services.company_service import CompanyService
from app.services.job_service import JobService
from app.api.v1.jobs import _job_card

router = APIRouter(prefix="/companies", tags=["companies"])


def _company_response(company) -> CompanyResponse:
    return CompanyResponse(
        id=str(company.id),
        name=company.name,
        slug=company.slug,
        about=company.about,
        logo_url=company.logo_url,
        website=company.website,
        size_range=company.size_range,
        industry=company.industry,
        company_type=CompanyType(company.company_type),
        is_newly_founded=company.is_newly_founded,
        founded_year=company.founded_year,
        headquarters=company.headquarters,
        owner_user_id=str(company.owner_user_id) if company.owner_user_id else None,
        created_at=company.created_at,
        updated_at=company.updated_at,
    )


@router.get("", response_model=Page[CompanyResponse], summary="List companies")
async def list_companies(
    db: AsyncSession = Depends(get_db),
    pagination: PaginationDep = None,  # type: ignore[assignment]
    company_type: CompanyType | None = Query(default=None),
    is_newly_founded: bool | None = Query(default=None),
    industry: str | None = Query(default=None, max_length=120),
    q: str | None = Query(default=None, max_length=200),
) -> Page[CompanyResponse]:
    rows, total = await CompanyService(db).list(
        company_type=company_type.value if company_type else None,
        is_newly_founded=is_newly_founded,
        industry=industry,
        q=q,
        page=pagination.page,
        page_size=pagination.page_size,
    )
    pages = (
        (total + pagination.page_size - 1) // pagination.page_size
        if pagination.page_size
        else 0
    )
    return Page[CompanyResponse](
        items=[_company_response(c) for c in rows],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=pages,
    )


@router.get("/{company_id}", response_model=CompanyResponse, summary="Get company")
async def get_company(
    company_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> CompanyResponse:
    company = await CompanyService(db).get(company_id)
    return _company_response(company)


@router.get(
    "/{company_id}/jobs",
    response_model=Page[JobCardResponse],
    summary="List a company's active jobs",
)
async def list_company_jobs(
    company_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    pagination: PaginationDep = None,  # type: ignore[assignment]
) -> Page[JobCardResponse]:
    rows, total = await JobService(db).list_by_company(
        company_id, page=pagination.page, page_size=pagination.page_size
    )
    pages = (
        (total + pagination.page_size - 1) // pagination.page_size
        if pagination.page_size
        else 0
    )
    return Page[JobCardResponse](
        items=[_job_card(j) for j in rows],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=pages,
    )


@router.post(
    "",
    response_model=CompanyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a company (recruiter/admin)",
)
async def create_company(
    payload: CompanyCreate,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> CompanyResponse:
    if user.role not in (UserRole.recruiter.value, UserRole.admin.value):
        from app.core.exceptions import ForbiddenError

        raise ForbiddenError("Requires recruiter or admin role")
    company = await CompanyService(db).create(user, payload)
    return _company_response(company)


@router.patch(
    "/{company_id}",
    response_model=CompanyResponse,
    summary="Update a company (owner recruiter or admin)",
)
async def update_company(
    company_id: uuid.UUID,
    payload: CompanyUpdate,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> CompanyResponse:
    company = await CompanyService(db).update(user, company_id, payload)
    return _company_response(company)


@router.delete(
    "/{company_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    summary="Delete a company (admin only)",
)
async def delete_company(
    company_id: uuid.UUID,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> Response:
    await CompanyService(db).delete(user, company_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)