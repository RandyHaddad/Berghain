import os
from pydantic import BaseModel, Field


class Settings(BaseModel):
    PLAYER_ID: str = Field(
        default="52f442c7-f52a-4f71-a671-0a127aaeb1ae",
        description="Player ID for external API",
    )
    EXTERNAL_API_BASE: str = Field(
        default="https://berghain.challenges.listenlabs.ai",
        description="Base URL of the external API",
    )
    DATABASE_URL: str = Field(
        default="sqlite:///./data/db.sqlite3",
        description="SQLAlchemy database URL (sync-style)",
    )
    CORS_ORIGINS: str = Field(
        default="http://localhost:5173",
        description="Comma-separated origins allowed for CORS",
    )
    CAPACITY_REQUIRED: int = 1000

    @property
    def DATABASE_URL_ASYNC(self) -> str:
        url = self.DATABASE_URL
        # Convert sqlite URL to aiosqlite driver if needed
        if url.startswith("sqlite+aiosqlite:"):
            return url
        if url.startswith("sqlite:///"):
            return url.replace("sqlite:///", "sqlite+aiosqlite:///")
        if url.startswith("sqlite:////"):
            return url.replace("sqlite:////", "sqlite+aiosqlite:////")
        # Default fallback
        return url


def load_settings() -> Settings:
    # Support .env in backend root or repo root
    # We keep it simple: rely on environment variables if present
    return Settings(
        PLAYER_ID=os.getenv("PLAYER_ID", "52f442c7-f52a-4f71-a671-0a127aaeb1ae"),
        EXTERNAL_API_BASE=os.getenv("EXTERNAL_API_BASE", "https://berghain.challenges.listenlabs.ai"),
        DATABASE_URL=os.getenv("DATABASE_URL", "sqlite:///./data/db.sqlite3"),
        CORS_ORIGINS=os.getenv("CORS_ORIGINS", "http://localhost:5173"),
        CAPACITY_REQUIRED=int(os.getenv("CAPACITY_REQUIRED", "1000")),
    )


settings = load_settings()

