from flask import Blueprint

from app.models.company import Company

companies_bp = Blueprint("companies", __name__)


@companies_bp.get("/")
def get_companies():
    companies = Company.query.order_by(Company.id.asc()).all()

    return {
        "success": True,
        "companies": [
            company.to_dict()
            for company in companies
        ]
    }, 200


@companies_bp.get("/<int:company_id>")
def get_company(company_id):
    company = Company.query.get(company_id)

    if not company:
        return {
            "success": False,
            "message": "Company not found"
        }, 404

    return {
        "success": True,
        "company": company.to_dict()
    }, 200