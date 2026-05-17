def test_request_otp(client):
    response = client.post(
        "/auth/request-otp",
        json={"phone_number": "+10000000000"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "OTP requested" in data["message"]

def test_verify_otp_new_user(client):
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
    assert data["profile_completion_required"] is True
