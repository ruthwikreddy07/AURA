import sys
from sqlalchemy import text
from app.database import engine
from app.utils.hashing import hash_password

def seed():
    print("Seeding Admin User...")
    admin_pwd = hash_password("aura_admin")
    stmt = f"""
        INSERT INTO users (email, password_hash, full_name, is_admin) 
        VALUES ('admin@aura.network', '{admin_pwd}', 'AURA Admin', true)
        ON CONFLICT (email) DO NOTHING;
    """
    try:
        with engine.connect() as conn:
            conn.execute(text(stmt))
            conn.commit()
        print("✅ Admin user seeded successfully: admin@aura.network / aura_admin")
    except Exception as e:
        print(f"❌ Failed to seed admin user: {e}")
        sys.exit(1)

if __name__ == "__main__":
    seed()
