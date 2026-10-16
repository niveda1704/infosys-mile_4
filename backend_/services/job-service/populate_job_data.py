import sqlite3
from datetime import datetime

conn = sqlite3.connect("instance/swipex_jobs.db")
cursor = conn.cursor()

now = datetime.utcnow().isoformat()

cursor.execute("""
    UPDATE jobs
    SET posted_time = ?
    WHERE posted_time IS NULL
""", (now,))

conn.commit()

print("Updated jobs:", cursor.rowcount)

conn.close()
