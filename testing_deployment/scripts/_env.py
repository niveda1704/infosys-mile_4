"""Shared helpers for the setup scripts: load the root .env and expose the Postgres URL."""
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def load_env():
    path = os.path.join(ROOT, ".env")
    if os.path.isfile(path):
        with open(path, encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def database_url(plain=True):
    load_env()
    url = os.getenv("DATABASE_URL", "postgresql+psycopg://postgres:postgres@127.0.0.1:5432/swipex")
    if plain:
        for p in ("postgresql+psycopg://", "postgresql+psycopg2://", "postgres://"):
            if url.startswith(p):
                url = "postgresql://" + url[len(p):]
    return url
