import pytest
from app.models.user import User
from app.database import get_db
from tests.conftest import TEST_USER_ID

def test_create_wallet_unauthorized(client):
    response = client.post(
        "/api/v1/wallet/create",
        json={"user_id": TEST_USER_ID, "wallet_type": "standard"}
    )
    assert response.status_code == 401

def test_create_wallet_authorized(auth_client):
    response = auth_client.post(
        "/api/v1/wallet/create",
        json={"user_id": TEST_USER_ID, "wallet_type": "standard"}
    )
    # The endpoint might fail if user is not in the db, but 400/404 is expected for logic errors.
    # We want to check it passed authorization.
    assert response.status_code in [201, 400, 404]

def test_get_user_wallets_authorized(auth_client):
    response = auth_client.get(f"/api/v1/wallet/user/{TEST_USER_ID}")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
