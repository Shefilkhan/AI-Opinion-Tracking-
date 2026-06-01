import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

PURPOSE_SUBJECTS = {
    "register_verification": "Verify your OpinionPulse account",
    "login_verification": "Your OpinionPulse login code",
    "password_reset": "Reset your OpinionPulse password",
}

SMTP_TIMEOUT_SECONDS = 8


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
    subject = PURPOSE_SUBJECTS.get(purpose, "Your OpinionPulse verification code")
    plain_body = (
        f"Your OpinionPulse verification code is: {otp_code}\n\n"
        f"This code expires in {settings.otp_expire_minutes} minutes.\n"
        "If you did not request this, please ignore this email."
    )
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #0070f3;">OpinionPulse verification code</h2>
      <p>Your verification code is:</p>
      <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #111111;">{otp_code}</p>
      <p>This code expires in {settings.otp_expire_minutes} minutes.</p>
      <p style="color: #666666; font-size: 12px;">
        If you did not request this, please ignore this email.
      </p>
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
