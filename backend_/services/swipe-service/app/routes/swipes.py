from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity

from app.extensions import db
from app.models.swipe import Swipe


swipes_bp = Blueprint("swipes", __name__)


@swipes_bp.post("/")
@jwt_required()
def create_swipe():
    claims = get_jwt()

    if claims.get("role") != "JOB_SEEKER":
        return {
            "success": False,
            "message": "Forbidden"
        }, 403

    data = request.get_json() or {}

    job_id = data.get("job_id")
    action = data.get("action")

    if not job_id or not action:
        return {
            "success": False,
            "message": "job_id and action are required"
        }, 400

    if action not in ["APPLY", "SAVE", "SKIP"]:
        return {
            "success": False,
            "message": "action must be APPLY, SAVE or SKIP"
        }, 400

    user_id = int(get_jwt_identity())

    swipe = Swipe(
        user_id=user_id,
        job_id=int(job_id),
        action=action
    )

    db.session.add(swipe)
    db.session.commit()

    return {
        "success": True,
        "message": "Swipe recorded successfully",
        "swipe": swipe.to_dict()
    }, 201
