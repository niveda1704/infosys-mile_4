import pyodbc
import psycopg
from getpass import getpass


# ============================================
# SQL SERVER CONNECTION
# ============================================

sql_server_connection = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=MANOHAR\\SQLEXPRESS;"
    "DATABASE=SwipeX_DB;"
    "Trusted_Connection=yes;"
)


# ============================================
# POSTGRESQL CONNECTION
# ============================================

postgres_password = getpass("Enter PostgreSQL password: ")

postgres_connection = psycopg.connect(
    host="localhost",
    port=5432,
    dbname="SwipeX_DB",
    user="postgres",
    password=postgres_password
)


# ============================================
# CONNECT
# ============================================

sql_conn = pyodbc.connect(sql_server_connection)
sql_cursor = sql_conn.cursor()

pg_cursor = postgres_connection.cursor()


print("\n================================")
print("SQL SERVER → POSTGRESQL MIGRATION")
print("================================\n")


# ============================================
# 1. COMPANIES
# ============================================

print("Migrating Companies...")

sql_cursor.execute("""
    SELECT
        company_id,
        company_name,
        company_type,
        location,
        website,
        description,
        founded_year,
        created_at,
        company_size,
        industry,
        newly_founded
    FROM Companies
""")

rows = [tuple(row) for row in sql_cursor.fetchall()]

pg_cursor.executemany("""
    INSERT INTO companies (
        company_id,
        company_name,
        company_type,
        location,
        website,
        description,
        founded_year,
        created_at,
        company_size,
        industry,
        newly_founded
    )
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
""", rows)

print(f"Companies migrated: {len(rows)}")


# ============================================
# 2. USERS
# ============================================

print("Migrating Users...")

sql_cursor.execute("""
    SELECT
        user_id,
        name,
        email,
        created_at
    FROM Users
""")

rows = [tuple(row) for row in sql_cursor.fetchall()]
pg_cursor.executemany("""
    INSERT INTO users (
        user_id,
        name,
        email,
        created_at
    )
    VALUES (%s, %s, %s, %s)
""", rows)

print(f"Users migrated: {len(rows)}")


# ============================================
# 3. SKILLS
# ============================================

print("Migrating Skills...")

sql_cursor.execute("""
    SELECT
        skill_id,
        skill_name
    FROM Skills
""")

rows = [tuple(row) for row in sql_cursor.fetchall()]

pg_cursor.executemany("""
    INSERT INTO skills (
        skill_id,
        skill_name
    )
    VALUES (%s, %s)
""", rows)

print(f"Skills migrated: {len(rows)}")


# ============================================
# 4. JOBS
# ============================================

print("Migrating Jobs...")

sql_cursor.execute("""
    SELECT
        job_id,
        job_title,
        job_description,
        company_id,
        location,
        job_type,
        remote,
        salary_min,
        salary_max,
        experience_level,
        posted_at
    FROM Jobs
""")

rows = [tuple(row) for row in sql_cursor.fetchall()]
pg_cursor.executemany("""
    INSERT INTO jobs (
        job_id,
        job_title,
        job_description,
        company_id,
        location,
        job_type,
        remote,
        salary_min,
        salary_max,
        experience_level,
        posted_at
    )
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
""", rows)

print(f"Jobs migrated: {len(rows)}")


# ============================================
# 5. JOB SKILLS
# ============================================

print("Migrating Job_Skills...")

sql_cursor.execute("""
    SELECT
        job_id,
        skill_id
    FROM Job_Skills
""")

rows = [tuple(row) for row in sql_cursor.fetchall()]
pg_cursor.executemany("""
    INSERT INTO job_skills (
        job_id,
        skill_id
    )
    VALUES (%s, %s)
""", rows)

print(f"Job_Skills migrated: {len(rows)}")


# ============================================
# 6. SWIPES
# ============================================

print("Migrating Swipes...")

sql_cursor.execute("""
    SELECT
        swipe_id,
        user_id,
        job_id,
        direction,
        swiped_at
    FROM Swipes
""")

rows = [
    (
        row[0],
        row[1],
        row[2],
        str(row[3]).upper(),
        row[4]
    )
    for row in sql_cursor.fetchall()
]

pg_cursor.executemany("""
    INSERT INTO swipes (
        swipe_id,
        user_id,
        job_id,
        direction,
        swiped_at
    )
    VALUES (%s, %s, %s, %s, %s)
""", rows)

print(f"Swipes migrated: {len(rows)}")


# ============================================
# 7. ORIGINAL 200 JOB DATASET
# ============================================

print("Migrating original 200-job dataset...")

sql_cursor.execute("""
    SELECT
        Job_ID,
        Job_Title,
        Company,
        Company_Type,
        Location,
        Remote,
        Required_Skills,
        Experience,
        Salary,
        Job_Type,
        Job_Description
    FROM [SwipeX_200_Job_Dataset (1)]
""")

rows = [tuple(row) for row in sql_cursor.fetchall()]
pg_cursor.executemany("""
    INSERT INTO "SwipeX_200_Job_Dataset" (
        "Job_ID",
        "Job_Title",
        "Company",
        "Company_Type",
        "Location",
        "Remote",
        "Required_Skills",
        "Experience",
        "Salary",
        "Job_Type",
        "Job_Description"
    )
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
""", rows)

print(f"Original dataset migrated: {len(rows)}")


# ============================================
# COMMIT
# ============================================

postgres_connection.commit()


# ============================================
# RESET IDENTITY SEQUENCES
# ============================================

print("\nUpdating PostgreSQL identity sequences...")

sequence_tables = [
    ("companies", "company_id"),
    ("users", "user_id"),
    ("skills", "skill_id"),
    ("jobs", "job_id"),
    ("swipes", "swipe_id"),
]

for table, column in sequence_tables:

    pg_cursor.execute(
        f'SELECT MAX("{column}") FROM "{table}"'
    )

    max_id = pg_cursor.fetchone()[0]

    if max_id is not None:

        pg_cursor.execute(
            "SELECT setval(pg_get_serial_sequence(%s, %s), %s, true)",
            (f"public.{table}", column, max_id)
        )


postgres_connection.commit()


# ============================================
# CLOSE CONNECTIONS
# ============================================

pg_cursor.close()
sql_cursor.close()

postgres_connection.close()
sql_conn.close()


print("\n================================")
print("MIGRATION COMPLETED SUCCESSFULLY")
print("================================")