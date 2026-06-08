"""
Test configuration and fixtures.
Uses an in-process SQLite or test PostgreSQL database.
All models are created fresh per test session, then dropped.
"""
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.main import app
from app.db.base import get_db_session, get_db_replica_session, Base
from app.config import settings

# Use the configured DATABASE_URL (ensure ENVIRONMENT=test points to a test DB)
test_engine = create_async_engine(settings.DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


@pytest.fixture(scope="session", autouse=True)
async def prepare_database():
    """Create all tables once per test session, drop them after."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def db_session():
    """Provide a transactional test database session."""
    async with TestSessionLocal() as session:
        yield session


@pytest.fixture
async def test_client(db_session):
    """
    HTTP test client with DB session overrides for both master and replica.
    Kafka consumer is disabled via ENVIRONMENT=test (see main.py lifespan).
    """
    async def override_get_db_session():
        yield db_session

    async def override_get_replica_session():
        yield db_session  # Use same session for tests

    app.dependency_overrides[get_db_session] = override_get_db_session
    app.dependency_overrides[get_db_replica_session] = override_get_replica_session

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client

    app.dependency_overrides.clear()
