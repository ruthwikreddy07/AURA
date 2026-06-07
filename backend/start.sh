#!/bin/sh
# Initialize database schema and run migrations
echo "Initializing database..."
python create_tables.py

# Start uvicorn server
echo "Starting FastAPI server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
