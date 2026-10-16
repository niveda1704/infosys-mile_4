import psycopg
from concurrent.futures import ThreadPoolExecutor

DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "dbname": "SwipeX_DB",
    "user": "postgres",
    "password": "9392"
}


def insert_swipe(user_id, job_id):
    try:
        conn = psycopg.connect(**DB_CONFIG)
        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT INTO swipes (user_id, job_id, direction)
            VALUES (%s, %s, %s)
            """,
            (user_id, job_id, "RIGHT")
        )

        conn.commit()
        cursor.close()
        conn.close()

        return f"SUCCESS: user {user_id} -> job {job_id}"

    except Exception as e:
        return f"FAILED: user {user_id} -> job {job_id} | {e}"


# 10 different user/job combinations
swipes = [
    (1, 191),
    (2, 192),
    (3, 193),
    (4, 194),
    (5, 195),
    (1, 196),
    (2, 197),
    (3, 198),
    (4, 199),
    (5, 200),
]


print("Starting concurrent swipe test...")

with ThreadPoolExecutor(max_workers=10) as executor:
    results = executor.map(lambda x: insert_swipe(*x), swipes)

for result in results:
    print(result)

print("Concurrent swipe test completed.")