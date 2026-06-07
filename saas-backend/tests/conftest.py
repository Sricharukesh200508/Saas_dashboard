import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.main import app
from app.db.base import get_db_session, Base
from app.config import settings

# Test database URL (should be a separate db or a suffix)
# Assume settings.DATABASE_URL is used for test db when running in test mode
test_engine = create_async_engine(settings.DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(autocommit=False, autoflush=False, bind=test_engine, class_=AsyncSession)

@pytest.fixture(scope="session", autouse=True)
async def prepare_database():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture
async def db_session():
    async with TestSessionLocal() as session:
        yield session

@pytest.fixture
async def test_client(db_session):
    async def override_get_db_session():
        yield db_session
    app.dependency_overrides[get_db_session] = override_get_db_session
    
    # Use ASGITransport instead of raw app to avoid deprecation warnings
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client
