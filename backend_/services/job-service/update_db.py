import sqlite3

conn = sqlite3.connect("instance/swipex_jobs.db")
cursor = conn.cursor()

cursor.execute("ALTER TABLE jobs ADD COLUMN posted_time DATETIME")
cursor.execute("ALTER TABLE jobs ADD COLUMN applicant_count INTEGER NOT NULL DEFAULT 0")
cursor.execute("ALTER TABLE jobs ADD COLUMN competition_level VARCHAR(10) NOT NULL DEFAULT 'LOW'")

conn.commit()
conn.close()

print("Database updated successfully")
