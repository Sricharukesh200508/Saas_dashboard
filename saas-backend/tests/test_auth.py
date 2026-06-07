import pytest

@pytest.mark.asyncio
async def test_login_invalid_credentials(test_client):
    response = await test_client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "wrongpassword"
    })
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"
