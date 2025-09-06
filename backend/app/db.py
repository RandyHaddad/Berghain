import asyncio
import json
import os
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from .config import settings


class Base(DeclarativeBase):
    pass


engine = create_async_engine(settings.DATABASE_URL_ASYNC, future=True, echo=False)
SessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)


async def init_db() -> None:
    # Ensure data directory exists for SQLite
    if settings.DATABASE_URL_ASYNC.startswith("sqlite+aiosqlite:///./"):
        os.makedirs("./data", exist_ok=True)
    # Import models here to register metadata
    from . import models  # noqa: F401
    from . import models_v2  # noqa: F401
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session

