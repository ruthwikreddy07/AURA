"""
Comprehensive schema fix — adds ALL missing columns across ALL tables.
Run: py -3.12 fix_schema.py
"""
from app.database import engine
from sqlalchemy import text

# Each statement uses IF NOT EXISTS (Postgres 9.6+) so it's safe to re-run.
STMTS = [
    # ═══ USERS ═══
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS transaction_pin_hash VARCHAR(255)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20) UNIQUE",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT false",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(32) NOT NULL DEFAULT 'pending'",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS app_lock_enabled BOOLEAN NOT NULL DEFAULT false",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS device_id VARCHAR(255) UNIQUE",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS device_public_key VARCHAR(2048)",
    "ALTER TABLE users ALTER COLUMN email DROP NOT NULL",
    "ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL",

    # ═══ TOKENS ═══
    "ALTER TABLE tokens ADD COLUMN IF NOT EXISTS remaining_value NUMERIC(18,2) NOT NULL DEFAULT 0",
    "ALTER TABLE tokens ADD COLUMN IF NOT EXISTS sync_status VARCHAR(32) NOT NULL DEFAULT 'pending'",
    "ALTER TABLE tokens ADD COLUMN IF NOT EXISTS nonce BIGINT",
    "ALTER TABLE tokens ADD COLUMN IF NOT EXISTS payload JSONB NOT NULL DEFAULT '{}'",
    "ALTER TABLE tokens ADD COLUMN IF NOT EXISTS signature TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE tokens ADD COLUMN IF NOT EXISTS hash TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE tokens ADD COLUMN IF NOT EXISTS spent_at TIMESTAMPTZ",

    # ═══ BANK_ACCOUNTS ═══ (table might not exist yet)
    """DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='bank_accounts') THEN
            CREATE TABLE bank_accounts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                bank_name VARCHAR(255) NOT NULL,
                account_name VARCHAR(255) NOT NULL DEFAULT '',
                account_number_masked VARCHAR(32) NOT NULL DEFAULT '',
                ifsc_code VARCHAR(32),
                upi_id VARCHAR(255),
                is_primary BOOLEAN NOT NULL DEFAULT false,
                verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                created_at TIMESTAMPTZ NOT NULL DEFAULT now()
            );
            CREATE INDEX idx_bank_accounts_user_id ON bank_accounts(user_id);
        END IF;
    END $$""",
    "ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS account_name VARCHAR(255) NOT NULL DEFAULT ''",
    "ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS ifsc_code VARCHAR(32)",
    "ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS upi_id VARCHAR(255)",
    "ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT false",
    "ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ DEFAULT now()",
    "ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now()",

    # ═══ TRANSACTIONS ═══
    "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS txn_hash TEXT NOT NULL DEFAULT ''",

    # ═══ PAYMENT_SESSIONS ═══
    "ALTER TABLE payment_sessions ADD COLUMN IF NOT EXISTS sender_motion_hash VARCHAR(128)",
    "ALTER TABLE payment_sessions ADD COLUMN IF NOT EXISTS receiver_motion_hash VARCHAR(128)",
    "ALTER TABLE payment_sessions ADD COLUMN IF NOT EXISTS motion_verified BOOLEAN DEFAULT false",

    # ═══ RISK_LOGS ═══  (table might not exist yet)
    """DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='risk_logs') THEN
            CREATE TABLE risk_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
                risk_score FLOAT NOT NULL,
                decision VARCHAR(32) NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT now()
            );
        END IF;
    END $$""",

    # ═══ ACTIVITY_LOGS ═══ (table might not exist yet)
    """DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='activity_logs') THEN
            CREATE TABLE activity_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                type VARCHAR(64) NOT NULL,
                description TEXT NOT NULL,
                severity VARCHAR(16) NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT now()
            );
        END IF;
    END $$""",

    # ═══ SYNC_QUEUE ═══ (table might not exist yet)
    """DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='sync_queue') THEN
            CREATE TABLE sync_queue (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                token_id UUID NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                status VARCHAR(32) NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT now()
            );
        END IF;
    END $$""",

    # ═══ USER_MODE_PREFERENCES ═══ (table might not exist yet)
    """DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='user_mode_preferences') THEN
            CREATE TABLE user_mode_preferences (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
                ble_enabled BOOLEAN NOT NULL DEFAULT true,
                qr_enabled BOOLEAN NOT NULL DEFAULT true,
                sound_enabled BOOLEAN NOT NULL DEFAULT false,
                light_enabled BOOLEAN NOT NULL DEFAULT false,
                nfc_enabled BOOLEAN NOT NULL DEFAULT true,
                manual_override BOOLEAN NOT NULL DEFAULT false
            );
        END IF;
    END $$""",

    # ═══ QR_SESSIONS ═══
    """DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='qr_sessions') THEN
            CREATE TABLE qr_sessions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                status VARCHAR(32) NOT NULL DEFAULT 'pending',
                created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                expires_at TIMESTAMPTZ NOT NULL
            );
        END IF;
    END $$""",
]

if __name__ == "__main__":
    with engine.connect() as conn:
        for i, stmt in enumerate(STMTS, 1):
            label = stmt.strip().split("\n")[0][:70]
            print(f"[{i}/{len(STMTS)}] {label}")
            try:
                conn.execute(text(stmt))
            except Exception as e:
                print(f"  ⚠ Skipped: {e}")
        conn.commit()
        
        # Seed Admin User
        try:
            from app.utils.hashing import hash_password
            admin_pwd = hash_password("aura_admin")
            conn.execute(text(f"""
                INSERT INTO users (email, password_hash, full_name, is_admin) 
                VALUES ('admin@aura.network', '{admin_pwd}', 'AURA Admin', true)
                ON CONFLICT (email) DO NOTHING;
            """))
            conn.commit()
            print("[+] Admin user seeded: admin@aura.network")
        except Exception as e:
            print(f"  ⚠ Failed to seed admin: {e}")
            
    print(f"\n✅ Schema sync complete — {len(STMTS)} statements executed.")
