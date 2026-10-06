from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "HireAI Dashboard API"
    app_env: str = "development"
    secret_key: str = "hireai-dev-secret"
    access_token_expire_minutes: int = 60 * 24
    database_url: str = "sqlite:///./hireai.db"
    cors_origins: str = (
        "http://localhost:5173,http://127.0.0.1:5173,"
        "https://ai-hire-theta.vercel.app,https://ai-hire-9or8.vercel.app"
    )
    n8n_resume_webhook_url: str = "https://xbm.app.n8n.cloud/webhook/resume-upload"
    n8n_api_key: str = "hireai-n8n-internal-key"
    max_resume_uploads: int = 5
    supabase_url: str = "https://othkmsnxujuoqajrkrap.supabase.co"
    supabase_service_role_key: str = ""
    supabase_resume_bucket: str = "Resume"
    # Redis (Upstash) cache. Empty REDIS_URL or CACHE_ENABLED=false turns caching off.
    redis_url: str = ""
    cache_enabled: bool = True
    cache_ttl_dashboard: int = 45
    cache_ttl_signed_url: int = 3600
    redis_key_prefix: str = "aihire:"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
