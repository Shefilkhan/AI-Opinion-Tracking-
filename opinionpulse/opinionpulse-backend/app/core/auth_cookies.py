from fastapi import Response

from app.core.config import get_settings

settings = get_settings()


def set_auth_cookie(response: Response, token: str) -> None:
    max_age = settings.access_token_expire_days * 24 * 60 * 60
    response.set_cookie(
        key=settings.auth_cookie_name,
        value=token,
        httponly=True,
        secure=settings.auth_cookie_secure or settings.app_env == "production",
        samesite="lax",
        max_age=max_age,
        path="/",
    )


def clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.auth_cookie_name,
        path="/",
        httponly=True,
        secure=settings.auth_cookie_secure or settings.app_env == "production",
        samesite="lax",
    )
