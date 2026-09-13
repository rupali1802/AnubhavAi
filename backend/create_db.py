import pymysql
import sys
import os

# Read credentials from .env or defaults
user = "root"
password = "Tanu@02"
host = "localhost"
port = 3306
db_name = "anubhavai"

print(f"Connecting to MySQL at {host}:{port} as {user}...")

try:
    # Connect without specifying database to create database if not exists
    conn = pymysql.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        charset='utf8mb4'
    )
    cursor = conn.cursor()
    print("Connected to MySQL server successfully!")
    
    # Create database if not exists
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
    print(f"Database '{db_name}' created / verified successfully!")
    
    cursor.close()
    conn.close()
    
    # Now run seed script
    print("Running database tables creation and seeding script...")
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from seed.seed import Base, engine, SessionLocal
    
    Base.metadata.create_all(bind=engine)
    print("All MySQL tables created successfully!")
    
except Exception as e:
    print(f"Error creating/connecting to MySQL database: {e}")
    sys.exit(1)
