from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

from .config import Config
from .extensions import db, jwt
from .models import Swipe
from .routes.swipes import swipes_bp


load_dotenv()


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    jwt.init_app(app)
    CORS(app)

    app.register_blueprint(
        swipes_bp,
        url_prefix="/api/v1/swipes"
    )

    with app.app_context():
        db.create_all()

    @app.get("/health")
    def health():
        return {
            "success": True,
            "service": "swipe-service"
        }

    return app
