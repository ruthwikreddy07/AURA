"""
Run this from the backend/ directory:
  python diagnose.py
It will trace every import in the request chain and show exactly which one fails.
"""
import sys

steps = [
    ("config",              "from app.config import settings"),
    ("database",            "from app.database import Base, engine, get_db"),
    ("model: user",         "from app.models.user import User"),
    ("model: wallet",       "from app.models.wallet import Wallet"),
    ("model: token",        "from app.models.token import Token"),
    ("model: transaction",  "from app.models.transaction import Transaction"),
    ("model: risk",         "from app.models.risk import RiskLog"),
    ("model: sync",         "from app.models.sync import SyncQueue"),
    ("model: activity",     "from app.models.activity import ActivityLog"),
    ("model: mode_prefs",   "from app.models.user_mode_preferences import UserModePreferences"),
    ("util: hashing",       "from app.utils.hashing import hash_password, hash_token, hash_transaction"),
    ("util: crypto",        "from app.utils.crypto import sign_token, verify_token"),
    ("util: token_gen",     "from app.utils.token_generator import generate_signed_token"),
    ("ai: risk_engine",     "from app.ai.risk_engine import evaluate_transaction"),
    ("service: auth",       "from app.services.auth_service import create_user, authenticate_user"),
    ("service: wallet",     "from app.services.wallet_service import create_wallet"),
    ("service: token",      "from app.services.token_service import issue_token"),
    ("service: transaction","from app.services.transaction_service import create_transaction, get_user_transactions"),
    ("service: sync",       "from app.services.sync_service import enqueue_token_for_sync"),
    ("service: risk",       "from app.services.risk_service import log_risk_event"),
    ("service: analytics",  "from app.services.analytics_service import get_monthly_transaction_volume"),
    ("service: mode",       "from app.services.mode_service import set_user_mode_preferences"),
    ("route: auth",         "from app.routes.auth import router"),
    ("route: wallet",       "from app.routes.wallet import router"),
    ("route: tokens",       "from app.routes.tokens import router"),
    ("route: transactions", "from app.routes.transactions import router"),
    ("route: sync",         "from app.routes.sync import router"),
    ("route: analytics",    "from app.routes.analytics import router"),
    ("route: risk",         "from app.routes.risk import router"),
    ("route: mode",         "from app.routes.mode import router"),
    ("main app",            "from app.main import app"),
]

print("=" * 60)
print("AURA Import Chain Diagnostic")
print("=" * 60)

failed = False
for label, stmt in steps:
    try:
        exec(stmt)
        print(f"  OK   {label}")
    except Exception as e:
        print(f"\n  FAIL {label}")
        print(f"       Statement : {stmt}")
        print(f"       Error     : {type(e).__name__}: {e}")
        failed = True
        break

print("=" * 60)
if not failed:
    print("All imports resolved. The crash is at runtime, not import time.")
    print("Check DB connection and table existence next.")
else:
    print("Fix the FAIL above first, then re-run this script.")
print("=" * 60)