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
        logger.info("[OpinionPulse] Email sent to %s — %s", to_email, subject)
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


def _build_welcome_email(subscriber_email: str) -> tuple[str, str, str]:
    settings = get_settings()
    app = settings.app_name
    frontend = settings.frontend_url.rstrip("/")
    subject = f"Welcome to {app} — glad you're here!"
    plain_body = (
        f"Hi there,\n\n"
        f"Thanks for joining {app}! You're now on our updates list.\n\n"
        f"We'll share product news, opinion-tracking tips, and platform highlights.\n\n"
        f"Explore the app: {frontend}\n\n"
        f"— The {app} Team\n"
    )
    html_body = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
      <div style="font-weight: 700; font-size: 18px; color: #1a4d3e; margin-bottom: 24px;">{app}</div>
      <h1 style="font-size: 24px; color: #111111; margin: 0 0 12px;">Welcome — great to have you!</h1>
      <p style="color: #444444; font-size: 15px; line-height: 1.6;">
        Thanks for joining us at <strong>{subscriber_email}</strong>.
        You're on our list for product updates, opinion-tracking insights, and platform news.
      </p>
      <p style="margin: 28px 0;">
        <a href="{frontend}" style="display: inline-block; background: #1a4d3e; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">
          Open OpinionPulse
        </a>
      </p>
      <p style="color: #666666; font-size: 13px;">We're excited to have you on board.</p>
      <hr style="border: none; border-top: 1px solid #eeeeee; margin: 32px 0 16px;" />
      <p style="color: #999999; font-size: 12px;">{app}</p>
    </div>
    """
    return subject, html_body, plain_body


def _build_admin_signup_email(subscriber_email: str) -> tuple[str, str, str]:
    settings = get_settings()
    app = settings.app_name
    subject = f"New {app} newsletter signup"
    plain_body = (
        f"A new person joined your {app} updates list.\n\n"
        f"Email: {subscriber_email}\n\n"
        f"Sent automatically from the Connect with us form.\n"
    )
    html_body = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h1 style="font-size: 20px; color: #111111;">New newsletter signup</h1>
      <p style="color: #444444; font-size: 15px;">
        Someone joined <strong>{app}</strong> via Connect with us:
      </p>
      <p style="font-size: 18px; font-weight: 600; color: #1a4d3e;">{subscriber_email}</p>
      <p style="color: #666666; font-size: 13px;">This alert was sent from your landing page signup form.</p>
    </div>
    """
    return subject, html_body, plain_body


def send_newsletter_welcome_email(subscriber_email: str) -> bool:
    """Send welcome email. Returns True if SMTP delivery was attempted successfully."""
    settings = get_settings()
    subject, html_body, plain_body = _build_welcome_email(subscriber_email)

    if not settings.email_configured:
        logger.warning(
            "[OpinionPulse] Welcome email NOT sent to %s — configure EMAIL_USER + EMAIL_APP_PASSWORD in .env.local",
            subscriber_email,
        )
        return False

    send_email(subscriber_email, subject, html_body, plain_body)
    return True


def send_newsletter_admin_notification(subscriber_email: str, admin_email: str) -> bool:
    settings = get_settings()
    subject, html_body, plain_body = _build_admin_signup_email(subscriber_email)

    if not settings.email_configured:
        logger.warning(
            "[OpinionPulse] Admin notify NOT sent for %s (SMTP not configured)",
            subscriber_email,
        )
        return False

    send_email(admin_email, subject, html_body, plain_body)
    return True
