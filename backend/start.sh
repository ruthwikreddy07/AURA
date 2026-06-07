#!/bin/sh
# Create core database tables first if they don't exist
echo "Initializing core database tables..."
python create_tables.py

# Run database migrations
echo "Running database migrations..."
python -m alembic upgrade head

# Start uvicorn server
echo "Starting FastAPI server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
