from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity

from app.extensions import db
from app.models.job import Job
from app.models.swipe import Swipe

jobs_bp = Blueprint("jobs", __name__)


@jobs_bp.post("/")
@jwt_required()
def create_job():
    claims = get_jwt()

    if claims.get("role") != "RECRUITER":
        return {
            "success": False,
            "message": "Only recruiters can create jobs"
        }, 403

    data = request.get_json() or {}

    required = [
        "title",
        "company",
        "description",
        "location",
        "skills"
    ]

    if any(not data.get(field) for field in required):
        return {
            "success": False,
            "message": "title, company, description, location and skills are required"
        }, 400

    job = Job(
        recruiter_id=int(get_jwt_identity()),
        title=data["title"],
        company=data["company"],
        description=data["description"],
        location=data["location"],
        skills=data["skills"],
        salary=data.get("salary")
    )

    db.session.add(job)
    db.session.commit()

    return {
        "success": True,
        "message": "Job created successfully",
        "job": job.to_dict()
    }, 201


@jobs_bp.get("/")
def get_jobs():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)

    if page < 1:
        page = 1

    if per_page < 1:
        per_page = 10

    if per_page > 100:
        per_page = 100

    query = Job.query.order_by(Job.id.desc())

    search = request.args.get("search")
    location = request.args.get("location")
    skills = request.args.get("skills")

    if search:
        query = query.filter(
            db.or_(
                Job.title.ilike(f"%{search}%"),
                Job.company.ilike(f"%{search}%"),
                Job.description.ilike(f"%{search}%")
            )
        )

    if location:
        query = query.filter(
            Job.location.ilike(f"%{location}%")
        )

    if skills:
        query = query.filter(
            Job.skills.ilike(f"%{skills}%")
        )

    pagination = query.paginate(
        page=page,
        per_page=per_page,
        error_out=False
    )

    return {
        "success": True,
        "page": page,
        "per_page": per_page,
        "total": pagination.total,
        "jobs": [
            job.to_dict()
            for job in pagination.items
        ]
    }, 200

@jobs_bp.get("/search")
def search_jobs():
    keyword = request.args.get("keyword")
    location = request.args.get("location")
    job_type = request.args.get("job_type")
    experience_level = request.args.get("experience_level")
    skills = request.args.get("skills")

    salary_min = request.args.get("salary_min", type=float)
    salary_max = request.args.get("salary_max", type=float)

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)

    if page < 1:
        page = 1

    if per_page < 1:
        per_page = 10

    if per_page > 100:
        per_page = 100

    if salary_min is not None and salary_min < 0:
        return {
            "success": False,
            "message": "salary_min cannot be negative"
        }, 400

    if salary_max is not None and salary_max < 0:
        return {
            "success": False,
            "message": "salary_max cannot be negative"
        }, 400

    if (
        salary_min is not None
        and salary_max is not None
        and salary_min > salary_max
    ):
        return {
            "success": False,
            "message": "salary_min cannot be greater than salary_max"
        }, 400

    query = Job.query

    if keyword:
        query = query.filter(
            db.or_(
                Job.title.ilike(f"%{keyword}%"),
                Job.company.ilike(f"%{keyword}%"),
                Job.description.ilike(f"%{keyword}%")
            )
        )

    if location:
        query = query.filter(
            Job.location.ilike(f"%{location}%")
        )

    if job_type:
        query = query.filter(
            Job.job_type.ilike(job_type)
        )

    if experience_level:
        query = query.filter(
            Job.experience_level.ilike(experience_level)
        )

    if skills:
        query = query.filter(
            Job.skills.ilike(f"%{skills}%")
        )

    jobs = query.order_by(Job.id.desc()).all()

    def salary_value(salary):
        if not salary:
            return None

        try:
            values = salary.upper().replace("LPA", "").strip()

            if "-" in values:
                minimum, maximum = values.split("-", 1)
                return float(minimum.strip()), float(maximum.strip())

            value = float(values.strip())
            return value, value

        except (ValueError, AttributeError):
            return None

    filtered_jobs = []

    for job in jobs:
        salary_range = salary_value(job.salary)

        if salary_min is not None:
            if salary_range is None:
                continue

            if salary_range[1] < salary_min:
                continue

        if salary_max is not None:
            if salary_range is None:
                continue

            if salary_range[0] > salary_max:
                continue

        filtered_jobs.append(job)

    total = len(filtered_jobs)

    start = (page - 1) * per_page
    end = start + per_page

    paginated_jobs = filtered_jobs[start:end]

    return {
        "success": True,
        "page": page,
        "per_page": per_page,
        "total": total,
        "jobs": [job.to_dict() for job in paginated_jobs]
    }, 200
    
@jobs_bp.get("/<int:job_id>")
def get_job(job_id):
    job = Job.query.get(job_id)

    if not job:
        return {
            "success": False,
            "message": "Job not found"
        }, 404

    return {
        "success": True,
        "job": job.to_dict()
    }, 200
@jobs_bp.put("/<int:job_id>")
@jwt_required()
def update_job(job_id):
    claims = get_jwt()
    user_id = int(get_jwt_identity())

    if claims.get("role") != "RECRUITER":
        return {
            "success": False,
            "message": "Forbidden"
        }, 403

    job = Job.query.get(job_id)

    if not job:
        return {
            "success": False,
            "message": "Job not found"
        }, 404

    if job.recruiter_id != user_id:
        return {
            "success": False,
            "message": "You cannot update this job"
        }, 403

    data = request.get_json() or {}

    allowed_fields = [
        "title",
        "company",
        "description",
        "location",
        "skills",
        "salary"
    ]

    for field in allowed_fields:
        if field in data:
            setattr(job, field, data[field])

    db.session.commit()

    return {
        "success": True,
        "message": "Job updated successfully",
        "job": job.to_dict()
    }, 200

@jobs_bp.delete("/<int:job_id>")
@jwt_required()
def delete_job(job_id):
    claims = get_jwt()
    user_id = int(get_jwt_identity())

    job = Job.query.get(job_id)

    if not job:
        return {
            "success": False,
            "message": "Job not found"
        }, 404

    if claims.get("role") != "RECRUITER" or job.recruiter_id != user_id:
        return {
            "success": False,
            "message": "You cannot delete this job"
        }, 403

    db.session.delete(job)
    db.session.commit()

    return {
        "success": True,
        "message": "Job deleted successfully"
    }, 200


@jobs_bp.get("/swipes")
@jwt_required()
def get_swipe_history():
    user_id = int(get_jwt_identity())

    swipes = Swipe.query.filter_by(
        user_id=user_id
    ).order_by(Swipe.id.desc()).all()

    return {
        "success": True,
        "count": len(swipes),
        "swipes": [
            swipe.to_dict()
            for swipe in swipes
        ]
    }, 200