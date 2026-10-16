import os


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret")

    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "sqlite:///swipex_auth.db"
    )

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
    GOOGLE_REDIRECT_URI = os.getenv(
        "GOOGLE_REDIRECT_URI",
        "http://127.0.0.1:5001/api/v1/auth/google/callback"
    )
