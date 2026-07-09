from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.auth_errors import raise_auth_error
from app.db.database import get_db
from app.schemas.newsletter import NewsletterJoinRequest, NewsletterJoinResponse
from app.services.auth_rate_limit import rate_limit_by_email, rate_limit_by_ip
from app.services.newsletter_service import join_newsletter

router = APIRouter(prefix="/api/newsletter", tags=["newsletter"])


@router.post("/join", response_model=NewsletterJoinResponse)
def newsletter_join(
    body: NewsletterJoinRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """Public signup for Connect with us / newsletter updates."""
    rate_limit_by_ip(request, "newsletter_join", max_requests=10, window_seconds=3600)
    rate_limit_by_email(body.email, "newsletter_join", max_requests=3, window_seconds=3600)

    try:
        result = join_newsletter(db, body.email)
        return NewsletterJoinResponse(
            success=bool(result["success"]),
            message=str(result["message"]),
            email=str(result["email"]),
            email_sent=bool(result.get("email_sent", False)),
        )
    except Exception as exc:
        raise_auth_error(exc, context="newsletter_join")
