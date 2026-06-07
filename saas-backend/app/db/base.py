from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.config import settings

# Master Engine (for writes)
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
)

# Replica Engine (for reads)
replica_engine = create_async_engine(
    settings.DATABASE_REPLICA_URL,
    echo=False,
    pool_size=30,
    max_overflow=20,
    pool_pre_ping=True,
)

# Session makers
async_session_maker = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False, autoflush=False
)

async_replica_session_maker = async_sessionmaker(
    replica_engine, class_=AsyncSession, expire_on_commit=False, autoflush=False
)

Base = declarative_base()

async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for master database session (Writes)"""
    async with async_session_maker() as session:
        yield session

async def get_db_replica_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for replica database session (Reads/Analytics)"""
    async with async_replica_session_maker() as session:
        yield session
