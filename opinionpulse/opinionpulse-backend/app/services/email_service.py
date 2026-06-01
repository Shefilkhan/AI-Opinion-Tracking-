import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

PURPOSE_SUBJECTS = {
    "register_verification": "Your verification code is {otp}",
    "login_verification": "Your verification code is {otp}",
    "password_reset": "Your verification code is {otp}",
}

SMTP_TIMEOUT_SECONDS = 8


def _format_otp_display(otp_code: str) -> str:
    return " ".join(list(otp_code.strip()))


def send_email(to_email: str, subject: str, html_body: str, plain_body: str) -> bool:
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
            settings.smtp_host, settings.smtp_port, timeout=SMTP_TIMEOUT_SECONDS
        ) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(from_email, [to_email], msg.as_string())
        logger.info("[OpinionPulse] OTP email sent to %s", to_email)
        return True
    except Exception as exc:
        logger.warning("Failed to send email to %s: %s", to_email, exc)
        return False


def send_otp_email(to_email: str, otp_code: str, purpose: str) -> bool:
    spaced = _format_otp_display(otp_code)
    subject_template = PURPOSE_SUBJECTS.get(
        purpose, "Your verification code is {otp}"
    )
    subject = subject_template.format(otp=otp_code)
    plain_body = (
        f"Your one-time passcode for {settings.app_name} is: {otp_code}\n\n"
        f"This code expires in {settings.otp_expire_minutes} minutes.\n\n"
        "If you didn't request this, please ignore this email and your account "
        "remains secure.\n\n"
        "Never share this code with anyone.\n"
    )
    html_body = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <div style="font-weight: 700; font-size: 18px; color: #0070f3; margin-bottom: 24px;">{settings.app_name}</div>
      <h1 style="font-size: 22px; color: #111111; margin: 0 0 12px;">Your one-time passcode</h1>
      <p style="color: #444444; font-size: 15px;">Enter this code to continue:</p>
      <p style="font-size: 36px; font-weight: 700; letter-spacing: 12px; color: #111111; margin: 24px 0;">{spaced}</p>
      <p style="color: #444444; font-size: 14px;">This code expires in <strong>{settings.otp_expire_minutes} minutes</strong>.</p>
      <p style="color: #666666; font-size: 13px; margin-top: 24px;">
        If you didn't request this, please ignore this email and your account remains secure.
      </p>
      <p style="color: #b45309; font-size: 13px; font-weight: 600;">Never share this code with anyone.</p>
      <hr style="border: none; border-top: 1px solid #eeeeee; margin: 32px 0 16px;" />
      <p style="color: #999999; font-size: 12px;">{settings.app_name}</p>
    </div>
    """
    sent = send_email(to_email, subject, html_body, plain_body)
    if not sent:
        logger.info(
            "[OpinionPulse DEV OTP] email=%s purpose=%s code=%s",
            to_email,
            purpose,
            otp_code,
        )
    return sent
