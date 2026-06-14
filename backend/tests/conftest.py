import os
import pytest
from fastapi.testclient import TestClient

# Set testing environment variables before importing app
os.environ["ENVIRONMENT"] = "testing"
os.environ["ALLOW_TEST_OTP"] = "true"
os.environ["DATABASE_URL"] = "postgresql://postgres:sanjuktha@localhost:5432/aura"
os.environ["REDIS_URL"] = "redis://localhost:6379"
os.environ["JWT_SECRET"] = "supersecretkeythatisatleast32characterslong"
os.environ["TOKEN_PRIVATE_KEY_PATH"] = "backend/keys/private.pem"
os.environ["TOKEN_PUBLIC_KEY_PATH"] = "backend/keys/public.pem"

from app.main import app
from app.database import Base, engine, get_db
from app.models.user import User
from app.utils.jwt import create_access_token
from app.deps import get_current_user

TEST_USER_ID = "00000000-0000-0000-0000-000000000001"

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    
    # Seed test user
    from sqlalchemy.orm import Session
    import uuid
    db = Session(bind=engine)
    try:
        user_uuid = uuid.UUID(TEST_USER_ID)
        test_user = db.query(User).filter(User.id == user_uuid).first()
        if not test_user:
            test_user = User(
                id=user_uuid,
                phone_number="+10000000000",
                full_name="Test User",
                phone_verified=True,
                kyc_status="verified",
                is_active=True
            )
            db.add(test_user)
            db.commit()
    except Exception as e:
        print(f"Error seeding test user: {e}")
        db.rollback()
    finally:
        db.close()
        
    yield
    # We might not want to drop all if running multiple times, but for pure unit testing it's good
    # Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

@pytest.fixture
def auth_client(client):
    access_token = create_access_token(user_id=TEST_USER_ID, role="user")
    client.headers["Authorization"] = f"Bearer {access_token}"
    yield client
    if "Authorization" in client.headers:
        del client.headers["Authorization"]
