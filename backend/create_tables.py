import sys
from sqlalchemy import inspect
from app.database import engine, Base
import alembic.config
import alembic.command

# Import all models to register them with Base.metadata
import app.models

def main():
    inspector = inspect(engine)
    
    # Check if alembic_version table exists
    has_alembic = inspector.has_table("alembic_version")
    
    if not has_alembic:
        print("Alembic version table missing. Initializing schema from models and stamping head...")
        try:
            # Create all tables from SQLAlchemy models
            Base.metadata.create_all(bind=engine)
            print("✅ All database tables created/verified from models.")
            
            # Stamp the migrations as head
            print("Stamping database with latest migration version (head)...")
            alembic_cfg = alembic.config.Config("alembic.ini")
            alembic.command.stamp(alembic_cfg, "head")
            print("✅ Database stamped successfully.")
        except Exception as e:
            print(f"❌ Error during database initialization: {e}")
            sys.exit(1)
    else:
        print("Database already initialized. Checking and running pending migrations...")
        try:
            alembic_cfg = alembic.config.Config("alembic.ini")
            alembic.command.upgrade(alembic_cfg, "head")
            print("✅ Pending migrations applied successfully.")
        except Exception as e:
            print(f"❌ Error applying migrations: {e}")
            sys.exit(1)

if __name__ == "__main__":
    main()
