from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

from .extensions import db, bcrypt, jwt, oauth, revoked_tokens
from .routes.auth import auth_bp

load_dotenv()


def create_app():
    app = Flask(__name__)

    app.config.from_object("app.config.Config")

    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)

    oauth.init_app(app)

    oauth.register(
        name="google",
        client_id=app.config.get("GOOGLE_CLIENT_ID"),
        client_secret=app.config.get("GOOGLE_CLIENT_SECRET"),
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={
            "scope": "openid email profile"
        }
    )

    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        return jwt_payload.get("jti") in revoked_tokens

    CORS(app)

    app.register_blueprint(auth_bp, url_prefix="/api/v1/auth")

    with app.app_context():
        db.create_all()

    @app.get("/health")
    def health():
        return {
            "success": True,
            "service": "auth-service"
        }

    return app
