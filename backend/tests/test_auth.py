import os

# Set testing environment variables before importing app
os.environ["ENVIRONMENT"] = "testing"
os.environ["ALLOW_TEST_OTP"] = "true"
os.environ["DATABASE_URL"] = "postgresql://postgres:CHANGE_ME@localhost:5432/aura"
os.environ["REDIS_URL"] = "redis://localhost:6379"
os.environ["JWT_SECRET"] = "supersecretkeythatisatleast32characterslong"
os.environ["TOKEN_PRIVATE_KEY_PATH"] = "backend/keys/private.pem"
os.environ["TOKEN_PUBLIC_KEY_PATH"] = "backend/keys/public.pem"

from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine

# Create tables in test db
Base.metadata.create_all(bind=engine)

client = TestClient(app)

def test_request_otp():
    response = client.post(
        "/auth/request-otp",
        json={"phone_number": "+10000000000"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "OTP requested" in data["message"]

def test_verify_otp_new_user():
    # Setup test OTP
    from app.services import otp_store
    otp_store.store_otp("+10000000000", "123456")

    response = client.post(
        "/auth/verify-otp",
        json={
            "phone_number": "+10000000000",
            "otp": "123456",
            "device_id": "test_device",
            "device_public_key": "test_key"
        }
    )
    assert response.status_code == 200
    data = response.json()
    # It should say profile completion required
    assert data["profile_completion_required"] is True
