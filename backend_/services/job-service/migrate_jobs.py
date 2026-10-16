import sqlite3

conn = sqlite3.connect("instance/swipex_jobs.db")
cursor = conn.cursor()

cursor.execute("""
ALTER TABLE jobs
ADD COLUMN job_type VARCHAR(50) NOT NULL DEFAULT 'FULL_TIME'
""")

cursor.execute("""
ALTER TABLE jobs
ADD COLUMN experience_level VARCHAR(50) NOT NULL DEFAULT 'ENTRY_LEVEL'
""")

conn.commit()

print("Columns added successfully")

conn.close()
