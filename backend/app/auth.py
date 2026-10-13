from datetime import datetime, timedelta
import hashlib
import secrets

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import get_settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
settings = get_settings()
ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(subject: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    return jwt.encode({"sub": subject, "exp": expire}, settings.secret_key, algorithm=ALGORITHM)


def decode_access_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        if payload.get("purpose"):  # reset tokens must not work as login tokens
            return None
        sub = payload.get("sub")
        return str(sub) if sub else None
    except JWTError:
        return None


def _password_fingerprint(hashed_password: str) -> str:
    return hashlib.sha256(hashed_password.encode()).hexdigest()[:16]


def create_password_reset_token(user_id: str, hashed_password: str) -> str:
    """Single-use by design: the token embeds a fingerprint of the current password hash,
    so it stops working the moment the password changes."""
    expire = datetime.utcnow() + timedelta(minutes=settings.password_reset_expire_minutes)
    claims = {"sub": user_id, "purpose": "pwd_reset", "pf": _password_fingerprint(hashed_password), "exp": expire}
    return jwt.encode(claims, settings.secret_key, algorithm=ALGORITHM)


def decode_password_reset_token(token: str) -> tuple[str, str] | None:
    """Returns (user_id, password_fingerprint) for a valid reset token, else None."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
    except JWTError:
        return None
    if payload.get("purpose") != "pwd_reset" or not payload.get("sub") or not payload.get("pf"):
        return None
    return str(payload["sub"]), str(payload["pf"])


def password_fingerprint_matches(hashed_password: str, fingerprint: str) -> bool:
    return secrets.compare_digest(_password_fingerprint(hashed_password), fingerprint)


def generate_client_id() -> str:
    return f"CLI-{secrets.token_hex(4).upper()}"


def generate_job_code() -> str:
    return f"JOB-{secrets.token_hex(3).upper()}"
