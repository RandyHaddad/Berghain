from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import init_db
from .router_public import router as public_router
from .router_v2 import router_v2

# Import models to register with SQLAlchemy Base
from . import models  # noqa: F401
from . import models_v2  # noqa: F401


app = FastAPI(title="Berghain Challenge Backend", version="0.1.0")

# CORS
origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup() -> None:
    await init_db()


app.include_router(public_router)
app.include_router(router_v2)

