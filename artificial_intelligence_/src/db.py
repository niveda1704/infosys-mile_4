"""Postgres access for the AI service (psycopg v3). Same database as every other SwipeX service.

DATABASE_URL is read from the environment or the first .env found walking up from this file.
The service owns two tables, created by init_db(): ai_resumes and ai_job_embeddings. Everything
else (users, jobs, swipes, saved_jobs, applications, resumes) is owned by the Flask services and
is only read here.
"""
import os
import threading

import psycopg
from psycopg.rows import dict_row

DEFAULT_URL = "postgresql://postgres:postgres@127.0.0.1:5432/swipex"
_lock = threading.Lock()
_ready = False


def _load_root_env():
    d = os.path.dirname(os.path.abspath(__file__))
    for _ in range(5):
        path = os.path.join(d, ".env")
        if os.path.isfile(path):
            with open(path, encoding="utf-8") as fh:
                for line in fh:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
            return
        d = os.path.dirname(d)


_load_root_env()


def database_url():
    url = os.getenv("DATABASE_URL", DEFAULT_URL)
    for prefix in ("postgresql+psycopg://", "postgresql+psycopg2://", "postgres://"):
        if url.startswith(prefix):
            url = "postgresql://" + url[len(prefix):]
    return url


def connect():
    return psycopg.connect(database_url(), row_factory=dict_row, connect_timeout=5)


def query(sql, params=None):
    """Rows as dicts. Returns [] when the table does not exist yet (other services create them)."""
    try:
        with connect() as con:
            return con.execute(sql, params or ()).fetchall()
    except psycopg.errors.UndefinedTable:
        return []


def execute(sql, params=None):
    with connect() as con:
        con.execute(sql, params or ())


def executemany(sql, rows):
    with connect() as con:
        with con.cursor() as cur:
            cur.executemany(sql, rows)


def ping():
    try:
        with connect() as con:
            con.execute("SELECT 1")
        return True
    except Exception:
        return False


SCHEMA = [
    """CREATE TABLE IF NOT EXISTS ai_resumes (
        id TEXT PRIMARY KEY,
        user_id INTEGER,
        filename TEXT,
        skills JSONB NOT NULL DEFAULT '[]'::jsonb,
        text TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )""",
    "CREATE INDEX IF NOT EXISTS ix_ai_resumes_user ON ai_resumes (user_id, created_at DESC)",
    """CREATE TABLE IF NOT EXISTS ai_job_embeddings (
        job_id INTEGER PRIMARY KEY,
        content_hash TEXT NOT NULL,
        model TEXT NOT NULL,
        dim INTEGER NOT NULL,
        vector DOUBLE PRECISION[] NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )""",
]


def init_db():
    """Idempotent. Safe to call on every start and from several processes."""
    global _ready
    with _lock:
        if _ready:
            return
        with connect() as con:
            con.execute("SELECT pg_advisory_xact_lock(727001)")  # serialise concurrent startups
            for stmt in SCHEMA:
                con.execute(stmt)
        _ready = True
