"""Load the sample jobs.csv into the shared Postgres `jobs` and `companies` tables (idempotent).
The CSV's "Company Type" (MNC / Startup / ...) becomes companies.category, which drives the startup alert
and the startup-vs-MNC analytics.

    python scripts/seed_jobs.py --limit 300

Jobs need an owning recruiter. The script uses --recruiter-id, else the first RECRUITER account,
else creates demo.recruiter@swipex.dev / Recruiter@123 so you can log in and manage applicants.
"""
import argparse
import ast
import csv
import os
import sys

import psycopg

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _env import ROOT, database_url  # noqa: E402

CSV = os.path.join(ROOT, "artificial_intelligence_meghana", "data", "jobs.csv")


def skills_str(raw):
    try:
        val = ast.literal_eval(raw)
        if isinstance(val, (list, tuple)):
            return ", ".join(str(s).strip() for s in val)
    except (ValueError, SyntaxError):
        pass
    return str(raw).strip("[]").replace("'", "")


def recruiter(con, rid):
    if rid:
        return rid
    row = con.execute("SELECT id FROM users WHERE role = 'RECRUITER' ORDER BY id LIMIT 1").fetchone()
    if row:
        return row[0]
    import bcrypt
    pw = bcrypt.hashpw(b"Recruiter@123", bcrypt.gensalt()).decode()
    row = con.execute(
        "INSERT INTO users (name, email, password_hash, role, auth_provider, skills, profile_completion, "
        "company_name) VALUES ('Demo Recruiter','demo.recruiter@swipex.dev',%s,'RECRUITER','local','[]'::json,50,"
        "'SwipeX Demo') ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email RETURNING id", (pw,)).fetchone()
    print("created demo recruiter demo.recruiter@swipex.dev / Recruiter@123")
    return row[0]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=300)
    ap.add_argument("--recruiter-id", type=int, default=None)
    ap.add_argument("--csv", default=CSV)
    args = ap.parse_args()
    added = skipped = 0
    with psycopg.connect(database_url()) as con:
        rid = recruiter(con, args.recruiter_id)
        with open(args.csv, newline="", encoding="utf-8-sig") as fh:
            for row in csv.DictReader(fh):
                if added >= args.limit:
                    break
                title, company, loc = row["Job Title"], row["Company"], row["Location"]
                ctype = (row.get("Company Type") or "").strip() or "Other"
                con.execute(
                    "INSERT INTO companies (name, category, industry, location, tech_stack, benefits) "
                    "VALUES (%s,%s,%s,%s,'[]'::json,'[]'::json) "
                    "ON CONFLICT (name) DO NOTHING", (company, ctype, "Technology", loc))
                if con.execute("SELECT 1 FROM jobs WHERE title=%s AND company=%s AND location=%s",
                               (title, company, loc)).fetchone():
                    skipped += 1
                    continue
                remote = str(row.get("Remote", "")).strip().lower() == "yes"
                con.execute(
                    "INSERT INTO jobs (recruiter_id, title, company, description, location, skills, salary, "
                    "employment_type, experience_level, work_mode, status) "
                    "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'Active')",
                    (rid, title, company, row.get("Job Description") or f"{title} at {company}", loc,
                     skills_str(row["Required Skills"]), row.get("Salary"), row.get("Job Type"),
                     row.get("Experience"), "Remote" if remote else "On-site"))
                added += 1
    print(f"seeded {added} jobs ({skipped} already present)")


if __name__ == "__main__":
    main()
