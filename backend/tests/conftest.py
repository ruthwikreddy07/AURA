import os
import pytest
from fastapi.testclient import TestClient

# Set testing environment variables before importing app
os.environ["ENVIRONMENT"] = "testing"
os.environ["ALLOW_TEST_OTP"] = "true"
os.environ["DATABASE_URL"] = "postgresql://postgres:CHANGE_ME@localhost:5432/aura"
os.environ["REDIS_URL"] = "redis://localhost:6379"
os.environ["JWT_SECRET"] = "supersecretkeythatisatleast32characterslong"
os.environ["TOKEN_PRIVATE_KEY_PATH"] = "backend/keys/private.pem"
os.environ["TOKEN_PUBLIC_KEY_PATH"] = "backend/keys/public.pem"

from app.main import app
from app.database import Base, engine, get_db
from app.models.user import User
from app.utils.jwt import create_access_token
from app.deps import get_current_user

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    # We might not want to drop all if running multiple times, but for pure unit testing it's good
    # Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

@pytest.fixture
def auth_client(client):
    # Create a mock user in DB if needed, or override dependency
    access_token = create_access_token({"sub": "test_user_1", "role": "user"})
    client.headers = {
        **client.headers,
        "Authorization": f"Bearer {access_token}"
    }
    return client
