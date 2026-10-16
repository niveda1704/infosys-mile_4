from datetime import datetime, timedelta, timezone
import secrets

from flask import Blueprint, request, redirect, url_for
from app.utils.auth import roles_required
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt,
    get_jwt_identity
)
from app.extensions import db, bcrypt, oauth, revoked_tokens
from app.models.user import User
from app.models.password_reset import PasswordResetToken

auth_bp = Blueprint("auth", __name__)

VALID_ROLES = {"JOB_SEEKER", "RECRUITER", "ADMIN"}

@auth_bp.post("/register")
def register():
    data = request.get_json() or {}

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role", "JOB_SEEKER").upper()

    if not name or not email or not password:
        return {
            "success": False,
            "message": "name, email and password are required"
        }, 400

    if role not in VALID_ROLES:
        return {
            "success": False,
            "message": "Invalid role"
        }, 400

    if User.query.filter_by(email=email).first():
        return {
            "success": False,
            "message": "Email already registered"
        }, 409

    user = User(
        name=name,
        email=email,
        password_hash=bcrypt.generate_password_hash(password).decode("utf-8"),
        role=role
    )

    db.session.add(user)
    db.session.commit()

    return {
        "success": True,
        "message": "User registered successfully",
        "user": user.to_dict()
    }, 201


@auth_bp.post("/login")
def login():
    data = request.get_json() or {}

    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()

    if not user or not bcrypt.check_password_hash(
        user.password_hash, password or ""
    ):
        return {
            "success": False,
            "message": "Invalid email or password"
        }, 401

    access_token = create_access_token(
    identity=str(user.id),
    additional_claims={"role": user.role}
    )

    refresh_token = create_refresh_token(
    identity=str(user.id),
    additional_claims={"role": user.role}
    )
    return {
        "success": True,
        "message": "Login successful",
        "access_token": access_token,
	"refresh_token": refresh_token,
        "user": user.to_dict()
    }, 200
@auth_bp.get("/google")
def google_login():
    redirect_uri = request.host_url.rstrip("/") + url_for(
        "auth.google_callback"
    )

    return oauth.google.authorize_redirect(redirect_uri)


@auth_bp.get("/google/callback")
def google_callback():
    token = oauth.google.authorize_access_token()

    user_info = token.get("userinfo")

    if not user_info:
        return {
            "success": False,
            "message": "Unable to retrieve Google user information"
        }, 400

    google_id = user_info.get("sub")
    email = user_info.get("email")
    name = user_info.get("name") or user_info.get("given_name") or "Google User"

    if not email:
        return {
            "success": False,
            "message": "Google account email not available"
        }, 400

    user = User.query.filter_by(email=email).first()

    if not user:
        user = User(
            name=name,
            email=email,
            password_hash=None,
            role="JOB_SEEKER",
            auth_provider="google"
        )

        db.session.add(user)
        db.session.commit()

    else:
        if user.auth_provider == "local":
            return {
                "success": False,
                "message": "An account with this email already exists. Please login using email and password."
            }, 409

    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role}
    )

    refresh_token = create_refresh_token(
        identity=str(user.id),
        additional_claims={"role": user.role}
    )

    return {
        "success": True,
        "message": "Google login successful",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": user.to_dict()
    }, 200
@auth_bp.get("/me")
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()
    claims = get_jwt()

    user = User.query.get(int(user_id))

    if not user:
        return {
            "success": False,
            "message": "User not found"
        }, 404

    return {
        "success": True,
        "user": user.to_dict(),
        "role": claims.get("role")
    }, 200
@auth_bp.get("/admin-test")
@roles_required("ADMIN")
def admin_test():
    return {
        "success": True,
        "message": "Admin access granted"
    }, 200
@auth_bp.put("/me")
@jwt_required()
def update_current_user():
    user_id = get_jwt_identity()

    user = User.query.get(int(user_id))

    if not user:
        return {
            "success": False,
            "message": "User not found"
        }, 404

    data = request.get_json() or {}

    name = data.get("name")
    email = data.get("email")

    if name:
        user.name = name

    if email:
        existing_user = User.query.filter(
            User.email == email,
            User.id != int(user_id)
        ).first()

        if existing_user:
            return {
                "success": False,
                "message": "Email already registered"
            }, 409

        user.email = email

    if not name and not email:
        return {
            "success": False,
            "message": "At least name or email is required"
        }, 400

    db.session.commit()

    return {
        "success": True,
        "message": "Profile updated successfully",
        "user": user.to_dict()
    }, 200
@auth_bp.put("/change-password")
@jwt_required()
def change_password():
    user_id = get_jwt_identity()

    user = User.query.get(int(user_id))

    if not user:
        return {
            "success": False,
            "message": "User not found"
        }, 404

    data = request.get_json() or {}

    current_password = data.get("current_password")
    new_password = data.get("new_password")

    if not current_password or not new_password:
        return {
            "success": False,
            "message": "current_password and new_password are required"
        }, 400

    if not bcrypt.check_password_hash(
        user.password_hash,
        current_password
    ):
        return {
            "success": False,
            "message": "Current password is incorrect"
        }, 401

    if current_password == new_password:
        return {
            "success": False,
            "message": "New password must be different from current password"
        }, 400

    if len(new_password) < 8:
        return {
            "success": False,
            "message": "New password must be at least 8 characters"
        }, 400

    user.password_hash = bcrypt.generate_password_hash(
        new_password
    ).decode("utf-8")

    db.session.commit()

    return {
        "success": True,
        "message": "Password changed successfully"
    }, 200
@auth_bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()
    claims = get_jwt()

    new_access_token = create_access_token(
        identity=str(user_id),
        additional_claims={
            "role": claims.get("role")
        }
    )

    return {
        "success": True,
        "message": "Access token refreshed successfully",
        "access_token": new_access_token
    }, 200
@auth_bp.post("/logout")
@jwt_required()
def logout():
    jti = get_jwt().get("jti")

    revoked_tokens.add(jti)

    return {
        "success": True,
        "message": "Logout successful"
    }, 200
@auth_bp.post("/forgot-password")
def forgot_password():
    data = request.get_json() or {}

    email = data.get("email")

    if not email:
        return {
            "success": False,
            "message": "Email is required"
        }, 400

    user = User.query.filter_by(email=email).first()

    if not user:
        return {
            "success": False,
            "message": "If the email exists, a password reset token has been generated"
        }, 200

    # Invalidate previous unused tokens
    old_tokens = PasswordResetToken.query.filter_by(
        user_id=user.id,
        used=False
    ).all()

    for old_token in old_tokens:
        old_token.used = True

    # Generate secure reset token
    reset_token = secrets.token_urlsafe(32)

    token = PasswordResetToken(
        user_id=user.id,
        token=reset_token,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=15)
    )

    db.session.add(token)
    db.session.commit()

    return {
        "success": True,
        "message": "Password reset token generated",
        "reset_token": reset_token
    }, 200
@auth_bp.post("/reset-password")
def reset_password():
    data = request.get_json() or {}

    token_value = data.get("token")
    new_password = data.get("new_password")

    if not token_value or not new_password:
        return {
            "success": False,
            "message": "token and new_password are required"
        }, 400

    if len(new_password) < 8:
        return {
            "success": False,
            "message": "New password must be at least 8 characters"
        }, 400

    reset_token = PasswordResetToken.query.filter_by(
        token=token_value,
        used=False
    ).first()

    if not reset_token:
        return {
            "success": False,
            "message": "Invalid or already used reset token"
        }, 400

    if reset_token.is_expired():
        reset_token.used = True
        db.session.commit()

        return {
            "success": False,
            "message": "Reset token has expired"
        }, 400

    user = User.query.get(reset_token.user_id)

    if not user:
        return {
            "success": False,
            "message": "User not found"
        }, 404

    user.password_hash = bcrypt.generate_password_hash(
        new_password
    ).decode("utf-8")

    reset_token.used = True

    db.session.commit()

    return {
        "success": True,
        "message": "Password reset successfully"
    }, 200