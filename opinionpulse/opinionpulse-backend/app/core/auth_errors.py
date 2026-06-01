import logging
from typing import NoReturn

from fastapi import HTTPException, status
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import get_settings
from app.services.email_service import EmailSendError

logger = logging.getLogger(__name__)
settings = get_settings()


def raise_auth_error(exc: Exception, *, context: str) -> NoReturn:
    """Log and return a client-safe HTTP error (detailed in development)."""
    if isinstance(exc, HTTPException):
        raise exc

    if isinstance(exc, EmailSendError):
        logger.error("EMAIL ERROR [%s]: %s", context, exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=exc.message,
        )

    if isinstance(exc, SQLAlchemyError):
        logger.exception("DATABASE ERROR [%s]: %s", context, exc)
        detail = (
            f"Database error: {exc}"
            if settings.app_env == "development"
            else "Database error. Please try again later."
        )
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail)

    logger.exception("AUTH ERROR [%s]: %s", context, exc)
    detail = (
        str(exc)
        if settings.app_env == "development"
        else "Something went wrong. Please try again."
    )
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail)
