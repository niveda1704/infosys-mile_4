from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from authlib.integrations.flask_client import OAuth

db = SQLAlchemy()
bcrypt = Bcrypt()
jwt = JWTManager()
oauth = OAuth()

# Store revoked JWT IDs
revoked_tokens = set()
