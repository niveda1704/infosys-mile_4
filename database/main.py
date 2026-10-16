from fastapi import FastAPI
from pydantic import BaseModel
import psycopg
from datetime import datetime


app = FastAPI(
    title="SwipeX Job API",
    description="SwipeX Job & Data Intelligence API",
    version="2.0.0"
)


# =========================================================
# POSTGRESQL DATABASE CONNECTION
# =========================================================

def get_db_connection():
    conn = psycopg.connect(
        host="localhost",
        port=5432,
        dbname="SwipeX_DB",
        user="postgres",
        password="9392"
    )
    return conn


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():
    return {
        "message": "SwipeX Job API is running successfully"
    }


# =========================================================
# TEST DATABASE
# =========================================================

@app.get("/test-db")
def test_db():

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM jobs")
        total_jobs = cursor.fetchone()[0]

        cursor.close()
        conn.close()

        return {
            "message": "Database connected successfully",
            "total_jobs": total_jobs
        }

    except Exception as e:

        return {
            "error": str(e)
        }


# =========================================================
# GET ALL JOBS
# =========================================================

@app.get("/jobs")
def get_jobs():

    try:

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
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
            FROM jobs
            ORDER BY job_id
            LIMIT 20
        """)

        rows = cursor.fetchall()

        jobs = []

        for row in rows:

            jobs.append({
                "job_id": row[0],
                "job_title": row[1],
                "job_description": row[2],
                "company_id": row[3],
                "location": row[4],
                "job_type": row[5],
                "remote": row[6],
                "salary_min": row[7],
                "salary_max": row[8],
                "experience_level": row[9],
                "posted_at": row[10]
            })

        cursor.close()
        conn.close()

        return {
            "total_jobs": len(jobs),
            "jobs": jobs
        }

    except Exception as e:

        return {
            "error": str(e)
        }


# =========================================================
# GET JOB BY ID
# =========================================================

@app.get("/jobs/{job_id}")
def get_job_by_id(job_id: int):

    try:

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
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
            FROM jobs
            WHERE job_id = %s
        """, (job_id,))

        row = cursor.fetchone()

        cursor.close()
        conn.close()

        if row is None:
            return {
                "message": "Job not found"
            }

        return {
            "job_id": row[0],
            "job_title": row[1],
            "job_description": row[2],
            "company_id": row[3],
            "location": row[4],
            "job_type": row[5],
            "remote": row[6],
            "salary_min": row[7],
            "salary_max": row[8],
            "experience_level": row[9],
            "posted_at": row[10]
        }

    except Exception as e:

        return {
            "error": str(e)
        }


# =========================================================
# JOB SEARCH / FILTER
# =========================================================

@app.get("/jobs/filter/search")
def search_jobs(
    keyword: str = "",
    location: str = "",
    job_type: str = "",
    experience_level: str = ""
):

    try:

        conn = get_db_connection()
        cursor = conn.cursor()

        query = """
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
            FROM jobs
            WHERE 1 = 1
        """

        parameters = []

        # Keyword search
        if keyword:

            query += """
                AND (
                    job_title ILIKE %s
                    OR job_description ILIKE %s
                )
            """

            search_value = f"%{keyword}%"

            parameters.append(search_value)
            parameters.append(search_value)

        # Location filter
        if location:

            query += """
                AND location ILIKE %s
            """

            parameters.append(f"%{location}%")

        # Job type filter
        if job_type:

            query += """
                AND job_type ILIKE %s
            """

            parameters.append(f"%{job_type}%")

        # Experience filter
        if experience_level:

            query += """
                AND experience_level ILIKE %s
            """

            parameters.append(f"%{experience_level}%")

        query += """
            ORDER BY job_id
            LIMIT 50
        """

        cursor.execute(query, parameters)

        rows = cursor.fetchall()

        jobs = []

        for row in rows:

            jobs.append({
                "job_id": row[0],
                "job_title": row[1],
                "job_description": row[2],
                "company_id": row[3],
                "location": row[4],
                "job_type": row[5],
                "remote": row[6],
                "salary_min": row[7],
                "salary_max": row[8],
                "experience_level": row[9],
                "posted_at": row[10]
            })

        cursor.close()
        conn.close()

        return {
            "total_results": len(jobs),
            "jobs": jobs
        }

    except Exception as e:

        return {
            "error": str(e)
        }


# =========================================================
# SWIPE MODEL
# =========================================================

class SwipeRequest(BaseModel):

    user_id: int
    job_id: int
    direction: str


# =========================================================
# CREATE SWIPE
# =========================================================

@app.post("/swipe")
def create_swipe(swipe: SwipeRequest):

    try:

        direction = swipe.direction.upper()

        if direction not in ["LEFT", "RIGHT"]:

            return {
                "error": "direction must be LEFT or RIGHT"
            }

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO swipes (
                user_id,
                job_id,
                direction,
                swiped_at
            )
            VALUES (%s, %s, %s, CURRENT_TIMESTAMP)
            RETURNING swipe_id
        """, (
            swipe.user_id,
            swipe.job_id,
            direction
        ))

        swipe_id = cursor.fetchone()[0]

        conn.commit()

        cursor.close()
        conn.close()

        return {
            "message": "Swipe recorded successfully",
            "swipe_id": swipe_id,
            "user_id": swipe.user_id,
            "job_id": swipe.job_id,
            "direction": direction
        }

    except psycopg.errors.UniqueViolation:

        return {
            "error": "User has already swiped this job"
        }

    except Exception as e:

        return {
            "error": str(e)
        }


# =========================================================
# GET USER SWIPE HISTORY
# =========================================================

@app.get("/swipes/{user_id}")
def get_user_swipes(user_id: int):

    try:

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                swipe_id,
                user_id,
                job_id,
                direction,
                swiped_at
            FROM swipes
            WHERE user_id = %s
            ORDER BY swiped_at DESC
        """, (user_id,))

        rows = cursor.fetchall()

        swipes = []

        for row in rows:

            swipes.append({
                "swipe_id": row[0],
                "user_id": row[1],
                "job_id": row[2],
                "direction": row[3],
                "swiped_at": row[4]
            })

        cursor.close()
        conn.close()

        return {
            "user_id": user_id,
            "total_swipes": len(swipes),
            "swipes": swipes
        }

    except Exception as e:

        return {
            "error": str(e)
        }


# =========================================================
# GET ALL USERS
# =========================================================

@app.get("/users")
def get_users():

    try:

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                user_id,
                name,
                email,
                created_at
            FROM users
            ORDER BY user_id
        """)

        rows = cursor.fetchall()

        users = []

        for row in rows:

            users.append({
                "user_id": row[0],
                "name": row[1],
                "email": row[2],
                "created_at": row[3]
            })

        cursor.close()
        conn.close()

        return {
            "total_users": len(users),
            "users": users
        }

    except Exception as e:

        return {
            "error": str(e)
        }


# =========================================================
# SEARCH USERS
# =========================================================

@app.get("/users/search")
def search_users(name: str):

    try:

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                user_id,
                name,
                email,
                created_at
            FROM users
            WHERE name ILIKE %s
            ORDER BY user_id
        """, (f"%{name}%",))

        rows = cursor.fetchall()

        users = []

        for row in rows:

            users.append({
                "user_id": row[0],
                "name": row[1],
                "email": row[2],
                "created_at": row[3]
            })

        cursor.close()
        conn.close()

        return {
            "total_users": len(users),
            "users": users
        }

    except Exception as e:

        return {
            "error": str(e)
        }


# =========================================================
# GET USER BY ID
# =========================================================

@app.get("/users/{user_id}")
def get_user_by_id(user_id: int):

    try:

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                user_id,
                name,
                email,
                created_at
            FROM users
            WHERE user_id = %s
        """, (user_id,))

        row = cursor.fetchone()

        cursor.close()
        conn.close()

        if row is None:

            return {
                "message": "User not found"
            }

        return {
            "user_id": row[0],
            "name": row[1],
            "email": row[2],
            "created_at": row[3]
        }

    except Exception as e:

        return {
            "error": str(e)
        }







































































































































































