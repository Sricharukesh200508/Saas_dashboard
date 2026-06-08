"""
Auth flow tests — registration, login, RBAC.
"""
import pytest


@pytest.mark.asyncio
async def test_login_invalid_credentials(test_client):
    response = await test_client.post("/api/v1/auth/login", json={
        "email": "nonexistent@example.com",
        "password": "wrongpassword"
    })
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"


@pytest.mark.asyncio
async def test_register_tenant_success(test_client):
    response = await test_client.post("/api/v1/auth/register-tenant", json={
        "tenant_name": "Acme Corp",
        "tenant_slug": "acme-corp",
        "owner_email": "owner@acme.com",
        "owner_password": "SecurePass123!"
    })
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_register_tenant_duplicate_slug(test_client):
    # First registration
    await test_client.post("/api/v1/auth/register-tenant", json={
        "tenant_name": "First Corp",
        "tenant_slug": "duplicate-slug",
        "owner_email": "first@corp.com",
        "owner_password": "SecurePass123!"
    })
    # Duplicate slug
    response = await test_client.post("/api/v1/auth/register-tenant", json={
        "tenant_name": "Second Corp",
        "tenant_slug": "duplicate-slug",
        "owner_email": "second@corp.com",
        "owner_password": "SecurePass123!"
    })
    assert response.status_code == 400
    assert "slug" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_register_and_login(test_client):
    """Register a tenant then immediately log in with the same credentials."""
    await test_client.post("/api/v1/auth/register-tenant", json={
        "tenant_name": "Login Test Corp",
        "tenant_slug": "login-test-corp",
        "owner_email": "login@testcorp.com",
        "owner_password": "MyPassword99!"
    })

    response = await test_client.post("/api/v1/auth/login", json={
        "email": "login@testcorp.com",
        "password": "MyPassword99!"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()


@pytest.mark.asyncio
async def test_register_user_requires_auth(test_client):
    """Adding a user to a tenant requires a valid JWT."""
    response = await test_client.post("/api/v1/auth/register-user", json={
        "email": "newuser@example.com",
        "password": "pass",
        "role": "viewer"
    })
    # No Authorization header → 401
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_register_user_success(test_client):
    """Owner can add a new user to their tenant."""
    # Register tenant + get token
    reg = await test_client.post("/api/v1/auth/register-tenant", json={
        "tenant_name": "Team Corp",
        "tenant_slug": "team-corp",
        "owner_email": "owner@team.com",
        "owner_password": "OwnerPass123!"
    })
    token = reg.json()["access_token"]

    response = await test_client.post(
        "/api/v1/auth/register-user",
        json={
            "email": "member@team.com",
            "password": "MemberPass123!",
            "role": "member"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "member@team.com"
    assert data["role"] == "member"


@pytest.mark.asyncio
async def test_logout(test_client):
    response = await test_client.post("/api/v1/auth/logout")
    assert response.status_code == 200
    assert response.json()["message"] == "Successfully logged out"
