"""Newsletter / Connect with us signup."""

from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.models import NewsletterSubscriber
from app.services.email_service import (
    EmailSendError,
    send_newsletter_admin_notification,
    send_newsletter_welcome_email,
)

logger = logging.getLogger(__name__)


def _deliver_signup_emails(email_lower: str, *, is_new: bool) -> bool:
    """Send welcome email (best-effort); admin alert only for new signups.

    Email delivery must never fail the signup: the subscriber row is already
    committed, so an SMTP error degrades to email_sent=False rather than a 503.
    """
    try:
        welcome_sent = send_newsletter_welcome_email(email_lower)
    except EmailSendError as exc:
        logger.warning("Newsletter welcome email failed for %s: %s", email_lower, exc)
        welcome_sent = False

    if is_new:
        admin_email = get_settings().newsletter_admin_email
        if admin_email:
            try:
                send_newsletter_admin_notification(email_lower, admin_email)
            except EmailSendError as exc:
                logger.warning(
                    "Newsletter admin alert failed for %s: %s", email_lower, exc
                )

    return welcome_sent


def join_newsletter(db: Session, email: str) -> dict[str, str | bool]:
    """
    Register an email for updates.
    Sends welcome email to subscriber and notification to admin on new signups.
    """
    email_lower = email.lower().strip()
    existing = (
        db.query(NewsletterSubscriber)
        .filter(NewsletterSubscriber.email == email_lower)
        .first()
    )

    try:
        if existing:
            welcome_sent = _deliver_signup_emails(email_lower, is_new=False)
            if welcome_sent:
                message = "Welcome email sent again — please check your inbox (and spam folder)."
            else:
                message = (
                    "You're already subscribed. Email delivery is not configured on the server yet."
                )
            return {
                "success": True,
                "message": message,
                "email": email_lower,
                "is_new": False,
                "email_sent": welcome_sent,
            }

        subscriber = NewsletterSubscriber(email=email_lower)
        db.add(subscriber)
        db.commit()
        db.refresh(subscriber)

        welcome_sent = _deliver_signup_emails(email_lower, is_new=True)
        if welcome_sent:
            message = "Welcome aboard! Check your inbox (and spam folder) for a greeting from us."
        else:
            message = "Thanks for joining! You're on the list — email delivery will be enabled soon."

        return {
            "success": True,
            "message": message,
            "email": email_lower,
            "is_new": True,
            "email_sent": welcome_sent,
        }
    except EmailSendError as exc:
        logger.error("Newsletter email failed for %s: %s", email_lower, exc)
        raise
