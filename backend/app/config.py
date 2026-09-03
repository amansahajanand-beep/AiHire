from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "HireAI Dashboard API"
    app_env: str = "development"
    secret_key: str = "hireai-dev-secret"
    access_token_expire_minutes: int = 60 * 24
    database_url: str = "sqlite:///./hireai.db"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    n8n_resume_webhook_url: str = "https://xbm.app.n8n.cloud/webhook/resume-upload"
    n8n_api_key: str = "hireai-n8n-internal-key"
    max_resume_uploads: int = 5

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
