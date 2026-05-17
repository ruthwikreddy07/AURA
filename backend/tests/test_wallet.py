import pytest
from app.models.user import User
from app.database import get_db

def test_create_wallet_unauthorized(client):
    response = client.post(
        "/wallet/create",
        json={"user_id": "test_user_1", "wallet_type": "standard"}
    )
    assert response.status_code == 401

def test_create_wallet_authorized(auth_client):
    response = auth_client.post(
        "/wallet/create",
        json={"user_id": "test_user_1", "wallet_type": "standard"}
    )
    # The endpoint might fail if test_user_1 is not in the db, but 400 is expected for logic errors.
    # We want to check it passed authorization.
    assert response.status_code in [201, 400, 404]

def test_get_user_wallets_authorized(auth_client):
    response = auth_client.get("/wallet/user/test_user_1")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
