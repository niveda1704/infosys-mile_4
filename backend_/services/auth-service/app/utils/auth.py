from functools import wraps

from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt


def roles_required(*allowed_roles):
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            claims = get_jwt()
            user_role = claims.get("role")

            if user_role not in allowed_roles:
                return jsonify({
                    "success": False,
                    "message": "You do not have permission to access this resource"
                }), 403

            return fn(*args, **kwargs)

        return wrapper

    return decorator