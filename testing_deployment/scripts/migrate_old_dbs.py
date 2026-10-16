"""Optional: copy data from the three old SQLite files into the shared Postgres.

    python scripts/migrate_old_dbs.py            # looks in each service's instance/ folder

Copies users, jobs, swipes, saved_jobs, applications and resumes. Only columns that exist on both sides
are copied, ids are preserved, and rows that already exist are skipped. Run init_db.py first.
"""
import json
import os
import sqlite3
import sys

import psycopg

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _env import ROOT, database_url  # noqa: E402

SVC = os.path.join(ROOT, "backend_jayashree", "services")
PLAN = [
    ("auth-service/instance/swipex_auth.db", ["users"]),
    ("job-service/instance/swipex_jobs.db", ["jobs", "swipes", "saved_jobs", "applications", "companies"]),
    ("resume-service/instance/swipex_resumes.db", ["resumes"]),
]
JSON_COLS = {"users": {"skills"}}


def main():
    with psycopg.connect(database_url()) as pg:
        for rel, tables in PLAN:
            path = os.path.join(SVC, rel)
            if not os.path.exists(path):
                print(f"skip {rel} (not found)")
                continue
            lite = sqlite3.connect(path)
            lite.row_factory = sqlite3.Row
            for t in tables:
                try:
                    rows = [dict(r) for r in lite.execute(f"SELECT * FROM {t}")]
                except sqlite3.Error:
                    continue
                cols = {r[0] for r in pg.execute(
                    "SELECT column_name FROM information_schema.columns WHERE table_name = %s", (t,))}
                n = 0
                for r in rows:
                    data = {k: v for k, v in r.items() if k in cols}
                    for jc in JSON_COLS.get(t, ()):
                        if jc in data and not isinstance(data[jc], str):
                            data[jc] = json.dumps(data[jc] or [])
                    if not data:
                        continue
                    names = ", ".join(data)
                    ph = ", ".join(["%s"] * len(data))
                    cur = pg.execute(f"INSERT INTO {t} ({names}) VALUES ({ph}) ON CONFLICT DO NOTHING",
                                     list(data.values()))
                    n += cur.rowcount
                if "id" in cols:
                    pg.execute(f"SELECT setval(pg_get_serial_sequence('{t}', 'id'), "
                               f"GREATEST((SELECT COALESCE(MAX(id), 1) FROM {t}), 1))")
                print(f"{t}: {n}/{len(rows)} rows copied")
    print("done")


if __name__ == "__main__":
    main()
