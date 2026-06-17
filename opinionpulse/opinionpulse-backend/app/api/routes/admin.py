from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin_user
from app.db.database import get_db
from app.db.models import Plan, User
from app.schemas.usage import AdminSetPlanRequest
from app.services.plan_service import get_plan_config, load_plans

router = APIRouter(prefix="/api/admin", tags=["admin"])

VALID_PLANS = frozenset({"starter", "pro", "enterprise"})


@router.post("/set-plan")
def admin_set_plan(
    body: AdminSetPlanRequest,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    if body.plan_id not in VALID_PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan_id")
    if not db.get(Plan, body.plan_id):
        raise HTTPException(status_code=400, detail="Plan not configured")

    target = db.get(User, body.user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    target.plan_id = body.plan_id
    target.plan_status = "active"
    db.commit()
    load_plans(db)
    return {
        "success": True,
        "user_id": target.id,
        "plan_id": target.plan_id,
        "plan_name": get_plan_config(target.plan_id)["name"],
    }
