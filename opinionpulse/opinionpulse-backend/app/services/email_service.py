import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class EmailSendError(Exception):
    """Raised when SMTP is configured but delivery fails."""

    def __init__(self, message: str = "Failed to send verification email. Please try again."):
        super().__init__(message)
        self.message = message


PURPOSE_LABELS = {
    "register_verification": "verification",
    "login_verification": "login",
    "password_reset": "password reset",
}


def _format_otp_display(otp_code: str) -> str:
    return " ".join(list(otp_code.strip()))


def _build_otp_email(otp_code: str, purpose: str) -> tuple[str, str, str]:
    settings = get_settings()
    spaced = _format_otp_display(otp_code)
    app = settings.app_name
    subject = f"Your verification code — {app}"
    plain_body = (
        f"Your one-time passcode for {app} is: {otp_code}\n\n"
        f"This code expires in {settings.otp_expire_minutes} minutes.\n\n"
        "If you didn't request this, ignore this email.\n\n"
        "Never share this code with anyone.\n"
    )
    html_body = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <div style="font-weight: 700; font-size: 18px; color: #0070f3; margin-bottom: 24px;">{app}</div>
      <h1 style="font-size: 22px; color: #111111; margin: 0 0 12px;">Your one-time passcode</h1>
      <p style="color: #444444; font-size: 15px;">Use this code to complete {PURPOSE_LABELS.get(purpose, "verification")}:</p>
      <p style="font-size: 36px; font-weight: 700; letter-spacing: 12px; color: #111111; margin: 24px 0;">{spaced}</p>
      <p style="color: #444444; font-size: 14px;">This code expires in <strong>{settings.otp_expire_minutes} minutes</strong>.</p>
      <p style="color: #666666; font-size: 13px; margin-top: 24px;">
        If you didn't request this, ignore this email.
      </p>
      <p style="color: #b45309; font-size: 13px; font-weight: 600;">Never share this code with anyone.</p>
      <hr style="border: none; border-top: 1px solid #eeeeee; margin: 32px 0 16px;" />
      <p style="color: #999999; font-size: 12px;">{app}</p>
    </div>
    """
    return subject, html_body, plain_body


def send_email(to_email: str, subject: str, html_body: str, plain_body: str) -> bool:
    """
    Send via Gmail SMTP (smtp.gmail.com:587, STARTTLS).
    Returns True on success, False if SMTP is not configured.
    Raises EmailSendError if configured but delivery fails.
    """
    settings = get_settings()
    if not settings.email_configured:
        logger.info(
            "[OpinionPulse] SMTP not configured — email not sent to %s. Subject: %s",
            to_email,
            subject,
        )
        return False

    from_email = settings.smtp_from_email or settings.smtp_user
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.smtp_from_name} <{from_email}>"
    msg["To"] = to_email
    msg.attach(MIMEText(plain_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(
            settings.smtp_host,
            settings.smtp_port,
            timeout=12,
        ) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(from_email, [to_email], msg.as_string())
        logger.info("[OpinionPulse] OTP email sent to %s", to_email)
        return True
    except Exception as exc:
        logger.error("EMAIL ERROR: failed to send to %s — %s", to_email, exc)
        raise EmailSendError(
            "Failed to send verification email. Please try again."
        ) from exc


def deliver_otp_email(to_email: str, otp_code: str, purpose: str) -> None:
    """
    Send OTP email when SMTP is configured; otherwise log for local dev only.
    Raises EmailSendError when configured but send fails.
    """
    settings = get_settings()
    subject, html_body, plain_body = _build_otp_email(otp_code, purpose)

    if not settings.email_configured:
        logger.info(
            "[OpinionPulse DEV OTP] email=%s purpose=%s code=%s (configure EMAIL_USER + EMAIL_APP_PASSWORD in .env)",
            to_email,
            purpose,
            otp_code,
        )
        return

    send_email(to_email, subject, html_body, plain_body)


def send_otp_email(to_email: str, otp_code: str, purpose: str) -> bool:
    """Legacy helper; prefer deliver_otp_email for auth flows."""
    try:
        deliver_otp_email(to_email, otp_code, purpose)
        return get_settings().email_configured
    except EmailSendError:
        return False
