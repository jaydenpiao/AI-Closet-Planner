"""FastAPI application entrypoint."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.closet import router as closet_router
from app.api.routes.health import router as health_router
from app.api.routes.me import router as me_router
from app.api.routes.outfits import router as outfits_router
from app.core.config import get_settings

settings = get_settings()
app = FastAPI(title="Closet Planner AI API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix=settings.api_prefix)
app.include_router(closet_router, prefix=settings.api_prefix)
app.include_router(outfits_router, prefix=settings.api_prefix)
app.include_router(me_router, prefix=settings.api_prefix)
