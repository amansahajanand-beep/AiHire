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
    max_resume_uploads: int = 5
    supabase_url: str = "https://othkmsnxujuoqajrkrap.supabase.co"
    supabase_service_role_key: str = ""
    supabase_resume_bucket: str = "Resume"
    # RAG screening: resumes are scored by vector similarity (Gemini embeddings + pgvector).
    gemini_api_key: str = ""
    gemini_embed_model: str = "gemini-embedding-001"
    gemini_chat_model: str = "gemini-3.1-flash-lite"
    embed_dim: int = 768
    # Upstash QStash: delivers one message per resume to POST {backend_public_url}/api/internal/screen-resume.
    backend_public_url: str = ""
    qstash_url: str = "https://qstash.upstash.io"
    qstash_token: str = ""
    qstash_current_signing_key: str = ""
    qstash_next_signing_key: str = ""
    # Redis (Upstash) cache. Empty REDIS_URL or CACHE_ENABLED=false turns caching off.
    redis_url: str = ""
    cache_enabled: bool = True
    cache_ttl_dashboard: int = 45
    cache_ttl_signed_url: int = 3600
    redis_key_prefix: str = "aihire:"

    # Where the React app is served; used to build links in emails (and checkout returns).
    frontend_url: str = "http://localhost:5173"
    # Outgoing email (password reset). Leave SMTP_HOST empty in dev: the reset link is logged instead.
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = ""
    password_reset_expire_minutes: int = 30

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
