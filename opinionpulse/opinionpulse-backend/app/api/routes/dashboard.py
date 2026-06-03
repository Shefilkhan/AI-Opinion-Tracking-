from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.db.models import User
from app.schemas.dashboard import DashboardOverviewResponse
from app.services.dashboard_overview_service import get_dashboard_overview

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/overview", response_model=DashboardOverviewResponse)
def dashboard_overview(current_user: User = Depends(get_current_user)):
    return DashboardOverviewResponse(**get_dashboard_overview())
