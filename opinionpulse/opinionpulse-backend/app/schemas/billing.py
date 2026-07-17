from typing import Literal, Optional

from pydantic import BaseModel

BillingInterval = Literal["monthly", "annual"]
PaidPlanId = Literal["starter", "pro", "enterprise"]
CheckoutUiMode = Literal["hosted", "embedded"]


class CheckoutSessionRequest(BaseModel):
    plan_id: PaidPlanId
    interval: BillingInterval = "monthly"
    ui_mode: CheckoutUiMode = "hosted"


class CheckoutSessionResponse(BaseModel):
    session_id: str
    checkout_url: Optional[str] = None
    client_secret: Optional[str] = None


class PortalSessionResponse(BaseModel):
    portal_url: str


class BillingConfigResponse(BaseModel):
    configured: bool
    publishable_key: Optional[str] = None


class CheckoutSessionStatusResponse(BaseModel):
    status: str
    plan_id: Optional[str] = None
    plan_name: Optional[str] = None
    synced: bool = False
