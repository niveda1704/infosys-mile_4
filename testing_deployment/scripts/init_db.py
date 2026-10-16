"""Create the `swipex` database (if missing) and every table of every service.

    python scripts/init_db.py

Each Flask service has its own package called `app`, so each one creates its tables in its own
subprocess. Order matters only for foreign keys: auth -> job -> resume -> AI.
"""
import os
import subprocess
import sys
from urllib.parse import urlparse

import psycopg
from psycopg import sql

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _env import ROOT, database_url  # noqa: E402

SERVICES = ["auth-service", "job-service", "resume-service"]


def ensure_database(url):
    u = urlparse(url)
    name = u.path.lstrip("/")
    admin = url.rsplit("/", 1)[0] + "/postgres"
    with psycopg.connect(admin, autocommit=True) as con:
        if not con.execute("SELECT 1 FROM pg_database WHERE datname = %s", (name,)).fetchone():
            con.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(name)))
            print(f"created database {name}")
        else:
            print(f"database {name} exists")


def main():
    url = database_url()
    ensure_database(url)
    env = dict(os.environ)
    for svc in SERVICES:
        cwd = os.path.join(ROOT, "backend_jayashree", "services", svc)
        code = "from app import create_app; create_app(); print('tables ready')"
        r = subprocess.run([sys.executable, "-c", code], cwd=cwd, env=env, capture_output=True, text=True)
        print(f"[{svc}] {r.stdout.strip() or r.stderr.strip()[-400:]}")
        if r.returncode:
            sys.exit(r.returncode)
    ai = os.path.join(ROOT, "artificial_intelligence_meghana")
    r = subprocess.run([sys.executable, "-c", "from src import db; db.init_db(); print('tables ready')"],
                       cwd=ai, env=env, capture_output=True, text=True)
    print(f"[ai-service] {r.stdout.strip() or r.stderr.strip()[-400:]}")
    sys.exit(r.returncode)


if __name__ == "__main__":
    main()
