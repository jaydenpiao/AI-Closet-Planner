"""Application settings and environment loading."""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime settings loaded from environment variables."""

    api_prefix: str = "/api"
    gemini_api_key: str | None = Field(default=None, alias="GEMINI_API_KEY")
    gemini_model: str = Field(default="gemini-2.0-flash", alias="GEMINI_MODEL")
    gemini_mock_mode: bool = Field(default=True, alias="GEMINI_MOCK_MODE")
    max_upload_mb: int = Field(default=8, alias="MAX_UPLOAD_MB")
    max_upload_files: int = Field(default=8, alias="MAX_UPLOAD_FILES")
    allowed_origins: str = Field(
        default="http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174",
        alias="ALLOWED_ORIGINS",
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_mb * 1024 * 1024

    @property
    def allowed_origins_list(self) -> list[str]:
        origins: list[str] = []
        seen: set[str] = set()

        for raw_origin in self.allowed_origins.split(","):
            origin = raw_origin.strip().rstrip("/")
            if not origin or origin in seen:
                continue
            seen.add(origin)
            origins.append(origin)

        return origins


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return cached settings instance."""

    return Settings()
