import pyodbc

connection_string = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=MANOHAR\\SQLEXPRESS;"
    "DATABASE=SwipeX_DB;"
    "Trusted_Connection=yes;"
)

conn = pyodbc.connect(connection_string)
cursor = conn.cursor()

print("\n=== SQL SERVER TABLES ===")

cursor.execute("""
    SELECT TABLE_NAME
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_TYPE = 'BASE TABLE'
    ORDER BY TABLE_NAME
""")

tables = [row[0] for row in cursor.fetchall()]

for table in tables:
    print(f"\n--- {table} ---")

    cursor.execute("""
        SELECT
            COLUMN_NAME,
            DATA_TYPE,
            IS_NULLABLE,
            CHARACTER_MAXIMUM_LENGTH
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
    """, table)

    for column in cursor.fetchall():
        print(column)

conn.close()

print("\n=== INSPECTION COMPLETE ===")