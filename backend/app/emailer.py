import logging
import smtplib
from email.message import EmailMessage

from app.config import get_settings

logger = logging.getLogger("hireai.email")


def send_password_reset_email(to_email: str, name: str, reset_url: str) -> None:
    """Sends the reset link via SMTP. Without SMTP_HOST (local dev) the link is only logged."""
    s = get_settings()
    if not s.smtp_host:
        logger.warning("SMTP not configured; password reset link for %s: %s", to_email, reset_url)
        return

    msg = EmailMessage()
    msg["Subject"] = "Reset your HireAI password"
    msg["From"] = s.smtp_from or s.smtp_user
    msg["To"] = to_email
    msg.set_content(
        f"Hi {name},\n\nWe received a request to reset your HireAI password. "
        f"Use the link below within {s.password_reset_expire_minutes} minutes:\n\n{reset_url}\n\n"
        "If you didn't request this, you can ignore this email; your password won't change.\n"
    )
    try:
        if s.smtp_port == 465:
            server = smtplib.SMTP_SSL(s.smtp_host, s.smtp_port, timeout=15)
        else:
            server = smtplib.SMTP(s.smtp_host, s.smtp_port, timeout=15)
            server.starttls()
        with server:
            if s.smtp_user:
                server.login(s.smtp_user, s.smtp_password)
            server.send_message(msg)
    except Exception:
        logger.exception("Failed to send password reset email to %s", to_email)
