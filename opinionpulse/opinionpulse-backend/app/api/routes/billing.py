from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.db.models import User
from app.schemas.billing import (
    BillingConfigResponse,
    CheckoutSessionRequest,
    CheckoutSessionResponse,
    CheckoutSessionStatusResponse,
    PortalSessionResponse,
)
from app.services import stripe_service

router = APIRouter(prefix="/api/billing", tags=["billing"])


@router.get("/config", response_model=BillingConfigResponse)
def billing_config():
    from app.core.config import get_settings

    settings = get_settings()
    return BillingConfigResponse(
        configured=stripe_service.is_stripe_configured(),
        publishable_key=settings.stripe_publishable_key or None,
    )


@router.post("/checkout-session", response_model=CheckoutSessionResponse)
def create_checkout_session(
    body: CheckoutSessionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    checkout_url, client_secret, session_id = stripe_service.create_checkout_session(
        db,
        current_user,
        body.plan_id,
        body.interval,
        ui_mode=body.ui_mode,
    )
    return CheckoutSessionResponse(
        checkout_url=checkout_url,
        client_secret=client_secret,
        session_id=session_id,
    )


@router.get("/session/{session_id}", response_model=CheckoutSessionStatusResponse)
def get_checkout_session_status(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = stripe_service.sync_checkout_session(db, current_user, session_id)
    return CheckoutSessionStatusResponse(**result)


@router.post("/portal-session", response_model=PortalSessionResponse)
def create_portal_session(
    current_user: User = Depends(get_current_user),
):
    portal_url = stripe_service.create_portal_session(current_user)
    return PortalSessionResponse(portal_url=portal_url)


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    signature = request.headers.get("stripe-signature")
    if not signature:
        raise HTTPException(status_code=400, detail="Missing Stripe signature.")
    stripe_service.handle_webhook_event(db, payload, signature)
    return {"received": True}
