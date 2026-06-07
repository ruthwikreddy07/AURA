import sys
from app.database import engine, Base
# Import models to register them with Base.metadata
from app.models import (
    User, Wallet, Token, Transaction, Alert, RiskLog,
    ActivityLog, SyncQueue, UserModePreferences, QRSession, PaymentSession
)

# We only create tables that are NOT managed by Alembic migrations
tables_to_create = [
    User.__table__,
    Wallet.__table__,
    Token.__table__,
    Transaction.__table__,
    PaymentSession.__table__,
    Alert.__table__,
    RiskLog.__table__,
    ActivityLog.__table__,
    SyncQueue.__table__,
    UserModePreferences.__table__,
    QRSession.__table__
]

def main():
    print("Creating core database tables (excluding Alembic-managed ones)...")
    try:
        Base.metadata.create_all(bind=engine, tables=tables_to_create)
        print("✅ Core database tables created successfully.")
    except Exception as e:
        print(f"❌ Error creating core tables: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
