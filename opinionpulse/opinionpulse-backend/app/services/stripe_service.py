"""Stripe Checkout, Customer Portal, and subscription sync."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Literal, Optional

import stripe
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.models import User
from app.services.notification_service import create_user_notification
from app.services.plan_service import get_plan_config, load_plans

logger = logging.getLogger(__name__)

BillingInterval = Literal["monthly", "annual"]
PaidPlanId = Literal["starter", "pro", "enterprise"]

VALID_PAID_PLANS = frozenset({"starter", "pro", "enterprise"})


def _configure_stripe() -> None:
    settings = get_settings()
    if settings.stripe_secret_key:
        stripe.api_key = settings.stripe_secret_key


def is_stripe_configured() -> bool:
    """True when checkout can start (keys present). Webhook secret is optional for local dev."""
    settings = get_settings()
    return bool(settings.stripe_secret_key and settings.stripe_publishable_key)


def _require_stripe() -> None:
    settings = get_settings()
    if not settings.stripe_secret_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payments are not configured yet. Add STRIPE_SECRET_KEY to the backend environment.",
        )
    _configure_stripe()


def get_price_id(plan_id: str, interval: BillingInterval) -> Optional[str]:
    settings = get_settings()
    mapping = {
        ("starter", "monthly"): settings.stripe_price_starter_monthly,
        ("starter", "annual"): settings.stripe_price_starter_annual,
        ("pro", "monthly"): settings.stripe_price_pro_monthly,
        ("pro", "annual"): settings.stripe_price_pro_annual,
        ("enterprise", "monthly"): settings.stripe_price_enterprise_monthly,
        ("enterprise", "annual"): settings.stripe_price_enterprise_annual,
    }
    price_id = mapping.get((plan_id, interval), "").strip()
    return price_id or None


def plan_id_from_price(price_id: Optional[str]) -> Optional[str]:
    """Reverse-map a Stripe price id to our plan id (either interval)."""
    if not price_id:
        return None
    settings = get_settings()
    reverse = {
        (settings.stripe_price_starter_monthly or "").strip(): "starter",
        (settings.stripe_price_starter_annual or "").strip(): "starter",
        (settings.stripe_price_pro_monthly or "").strip(): "pro",
        (settings.stripe_price_pro_annual or "").strip(): "pro",
        (settings.stripe_price_enterprise_monthly or "").strip(): "enterprise",
        (settings.stripe_price_enterprise_annual or "").strip(): "enterprise",
    }
    reverse.pop("", None)  # ignore unconfigured (empty) price ids
    return reverse.get(price_id.strip())


def _price_id_from_subscription(subscription: dict) -> Optional[str]:
    items = (subscription.get("items") or {}).get("data") or []
    if items:
        return (items[0].get("price") or {}).get("id")
    return None


def get_or_create_customer(db: Session, user: User) -> str:
    _require_stripe()
    if user.stripe_customer_id:
        return user.stripe_customer_id

    customer = stripe.Customer.create(
        email=user.email,
        name=user.name or user.email,
        metadata={"user_id": str(user.id)},
    )
    user.stripe_customer_id = customer.id
    db.commit()
    db.refresh(user)
    return customer.id


def create_checkout_session(
    db: Session,
    user: User,
    plan_id: PaidPlanId,
    interval: BillingInterval,
    *,
    ui_mode: str = "hosted",
) -> tuple[Optional[str], Optional[str], str]:
    _require_stripe()

    if plan_id not in VALID_PAID_PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan.")

    price_id = get_price_id(plan_id, interval)
    if not price_id:
        raise HTTPException(
            status_code=400,
            detail=f"Stripe price is not configured for {plan_id} ({interval}).",
        )

    customer_id = get_or_create_customer(db, user)
    settings = get_settings()
    frontend = settings.frontend_url.rstrip("/")
    metadata = {
        "user_id": str(user.id),
        "plan_id": plan_id,
        "interval": interval,
    }

    session_kwargs: dict = {
        "customer": customer_id,
        "mode": "subscription",
        "line_items": [{"price": price_id, "quantity": 1}],
        "client_reference_id": str(user.id),
        "metadata": metadata,
        "subscription_data": {"metadata": metadata},
        "allow_promotion_codes": True,
    }

    if ui_mode == "embedded":
        session_kwargs.update(
            {
                "ui_mode": "embedded",
                "return_url": f"{frontend}/billing/success?session_id={{CHECKOUT_SESSION_ID}}",
            }
        )
    else:
        session_kwargs.update(
            {
                "success_url": f"{frontend}/billing/success?session_id={{CHECKOUT_SESSION_ID}}",
                "cancel_url": f"{frontend}/billing/cancel?plan={plan_id}",
            }
        )

    session = stripe.checkout.Session.create(**session_kwargs)

    if ui_mode == "embedded":
        if not session.client_secret:
            raise HTTPException(
                status_code=500,
                detail="Could not create embedded checkout session.",
            )
        return None, session.client_secret, session.id

    if not session.url:
        raise HTTPException(
            status_code=500,
            detail="Could not create Stripe checkout session.",
        )

    return session.url, None, session.id


def create_portal_session(user: User) -> str:
    _require_stripe()
    if not user.stripe_customer_id:
        raise HTTPException(
            status_code=400,
            detail="No billing account found. Subscribe to a plan first.",
        )

    settings = get_settings()
    frontend = settings.frontend_url.rstrip("/")
    portal = stripe.billing_portal.Session.create(
        customer=user.stripe_customer_id,
        return_url=f"{frontend}/settings#billing",
    )
    return portal.url


def _apply_subscription_to_user(
    db: Session,
    user: User,
    *,
    subscription_id: str,
    plan_id: str,
    status_value: str,
    renews_at: Optional[datetime],
) -> None:
    if plan_id not in VALID_PAID_PLANS:
        logger.warning("Ignoring unknown plan_id %s for user %s", plan_id, user.id)
        return

    user.stripe_subscription_id = subscription_id
    user.plan_id = plan_id
    user.plan_status = status_value
    if user.plan_started_at is None:
        user.plan_started_at = datetime.now(timezone.utc)
    user.plan_renews_at = renews_at
    db.commit()
    load_plans(db)


def _downgrade_to_starter(db: Session, user: User) -> None:
    user.stripe_subscription_id = None
    user.plan_id = "starter"
    user.plan_status = "active"
    user.plan_renews_at = None
    db.commit()
    load_plans(db)


def _parse_renews_at(subscription: dict) -> Optional[datetime]:
    end = subscription.get("current_period_end")
    if not end:
        # Stripe API 2025+ moved current_period_end onto the subscription items.
        items = (subscription.get("items") or {}).get("data") or []
        if items:
            end = items[0].get("current_period_end")
    if not end:
        return None
    return datetime.fromtimestamp(int(end), tz=timezone.utc)


def _subscription_status_label(stripe_status: str) -> str:
    if stripe_status in ("active", "trialing"):
        return "active"
    if stripe_status in ("past_due", "unpaid"):
        return "past_due"
    if stripe_status in ("canceled", "incomplete_expired"):
        return "canceled"
    return stripe_status


def sync_subscription_for_user(
    db: Session,
    user: User,
    subscription: dict,
) -> None:
    metadata = subscription.get("metadata") or {}
    # Prefer the plan implied by the ACTUAL price on the subscription so a plan
    # switch made in the Stripe Customer Portal is honored (metadata.plan_id is
    # only written at checkout and goes stale). Fall back to metadata, then the
    # user's current plan.
    plan_id = (
        plan_id_from_price(_price_id_from_subscription(subscription))
        or metadata.get("plan_id")
        or user.plan_id
    )
    status_value = _subscription_status_label(subscription.get("status", "active"))
    renews_at = _parse_renews_at(subscription)

    if subscription.get("status") in ("canceled", "incomplete_expired"):
        _downgrade_to_starter(db, user)
        return

    _apply_subscription_to_user(
        db,
        user,
        subscription_id=subscription["id"],
        plan_id=plan_id,
        status_value=status_value,
        renews_at=renews_at,
    )


def sync_checkout_session(db: Session, user: User, session_id: str) -> dict:
    _require_stripe()
    session = stripe.checkout.Session.retrieve(
        session_id,
        expand=["subscription"],
    )

    session_user_id = session.metadata.get("user_id") or session.client_reference_id
    if str(user.id) != str(session_user_id):
        raise HTTPException(status_code=403, detail="Checkout session does not belong to this user.")

    plan_id = session.metadata.get("plan_id")
    synced = False

    if session.payment_status == "paid" and session.subscription:
        subscription = session.subscription
        if isinstance(subscription, str):
            subscription = stripe.Subscription.retrieve(subscription)
        sync_subscription_for_user(db, user, subscription)
        db.refresh(user)
        synced = True
        plan_id = user.plan_id

    plan_name = get_plan_config(plan_id or user.plan_id)["name"] if plan_id or user.plan_id else None
    return {
        "status": session.status or "unknown",
        "plan_id": plan_id or user.plan_id,
        "plan_name": plan_name,
        "synced": synced,
    }


def handle_webhook_event(db: Session, payload: bytes, signature: str) -> None:
    settings = get_settings()
    if not settings.stripe_webhook_secret:
        raise HTTPException(status_code=503, detail="Stripe webhook secret is not configured.")

    _configure_stripe()
    try:
        event = stripe.Webhook.construct_event(
            payload, signature, settings.stripe_webhook_secret
        )
    except stripe.error.SignatureVerificationError as exc:
        raise HTTPException(status_code=400, detail="Invalid Stripe webhook signature.") from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid webhook payload.") from exc

    event_type = event["type"]
    data_object = event["data"]["object"]

    if event_type == "checkout.session.completed":
        _handle_checkout_completed(db, data_object)
    elif event_type == "customer.subscription.updated":
        _handle_subscription_updated(db, data_object)
    elif event_type == "customer.subscription.deleted":
        _handle_subscription_deleted(db, data_object)


def _get_user_for_subscription(db: Session, subscription: dict) -> Optional[User]:
    metadata = subscription.get("metadata") or {}
    user_id = metadata.get("user_id")
    if user_id:
        user = db.get(User, int(user_id))
        if user:
            return user

    customer_id = subscription.get("customer")
    if customer_id:
        return (
            db.query(User)
            .filter(User.stripe_customer_id == customer_id)
            .first()
        )
    return None


def _handle_checkout_completed(db: Session, session: dict) -> None:
    user_id = session.get("metadata", {}).get("user_id") or session.get("client_reference_id")
    if not user_id:
        return
    user = db.get(User, int(user_id))
    if not user:
        return

    subscription_id = session.get("subscription")
    if not subscription_id:
        return

    subscription = stripe.Subscription.retrieve(subscription_id)
    sync_subscription_for_user(db, user, subscription)
    db.refresh(user)
    create_user_notification(
        db,
        user_id=user.id,
        type="subscription_active",
        title="Subscription active",
        message=f"Your {get_plan_config(user.plan_id)['name']} plan is now active. Thank you for subscribing!",
        href="/settings#billing",
    )
    db.commit()
    logger.info("Checkout completed for user %s plan %s", user.id, user.plan_id)


def _handle_subscription_updated(db: Session, subscription: dict) -> None:
    user = _get_user_for_subscription(db, subscription)
    if not user:
        return
    sync_subscription_for_user(db, user, subscription)
    logger.info("Subscription updated for user %s status %s", user.id, user.plan_status)


def _handle_subscription_deleted(db: Session, subscription: dict) -> None:
    user = _get_user_for_subscription(db, subscription)
    if not user:
        return
    _downgrade_to_starter(db, user)
    logger.info("Subscription deleted; user %s downgraded to starter", user.id)
