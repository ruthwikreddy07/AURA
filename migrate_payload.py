"""Add missing 'payload' column to the tokens table."""
from sqlalchemy import create_engine, text

engine = create_engine("postgresql://postgres:sanjuktha@localhost:5432/aura")

with engine.connect() as conn:
    conn.execute(text(
        "ALTER TABLE tokens ADD COLUMN IF NOT EXISTS payload JSONB NOT NULL DEFAULT '{}'::jsonb"
    ))
    conn.commit()
    print("Done – 'payload' column added to tokens table.")
