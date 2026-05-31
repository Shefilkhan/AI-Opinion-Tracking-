from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.project_deps import get_owned_project
from app.db.database import get_db
from app.db.models import Alert, Project, User
from app.schemas.alert import (
    AlertCreate,
    AlertEvaluationResponse,
    AlertEvaluationResult,
    AlertListResponse,
    AlertResponse,
    AlertUpdate,
)
from app.services import alert_service

router = APIRouter(prefix="/api", tags=["alerts"])


def _get_owned_alert(
    alert_id: int, current_user: User, db: Session
) -> Alert:
    alert = (
        db.query(Alert)
        .join(Project, Alert.project_id == Project.id)
        .filter(Alert.id == alert_id, Project.user_id == current_user.id)
        .first()
    )
    if alert is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found",
        )
    return alert


@router.get(
    "/projects/{project_id}/alerts",
    response_model=AlertListResponse,
)
def list_alerts(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = get_owned_project(project_id, current_user, db)
    alerts = alert_service.list_project_alerts(db, project.id)
    return AlertListResponse(
        alerts=[AlertResponse.model_validate(a) for a in alerts],
        total=len(alerts),
    )


@router.post(
    "/projects/{project_id}/alerts",
    response_model=AlertResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_alert(
    project_id: int,
    body: AlertCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = get_owned_project(project_id, current_user, db)
    try:
        alert = alert_service.create_alert(
            db,
            project.id,
            body.model_dump(),
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    return AlertResponse.model_validate(alert)


@router.put("/alerts/{alert_id}", response_model=AlertResponse)
def update_alert(
    alert_id: int,
    body: AlertUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    alert = _get_owned_alert(alert_id, current_user, db)
    data = body.model_dump(exclude_unset=True)
    if not data:
        return AlertResponse.model_validate(alert)
    try:
        alert = alert_service.update_alert(db, alert, data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    return AlertResponse.model_validate(alert)


@router.delete("/alerts/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_alert_route(
    alert_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    alert = _get_owned_alert(alert_id, current_user, db)
    alert_service.delete_alert(db, alert)
    return None


@router.post(
    "/projects/{project_id}/alerts/evaluate",
    response_model=AlertEvaluationResponse,
)
def evaluate_alerts(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = get_owned_project(project_id, current_user, db)
    data = alert_service.evaluate_project_alerts(db, project.id)
    return AlertEvaluationResponse(
        project_id=data["project_id"],
        evaluated=data["evaluated"],
        triggered=data["triggered"],
        results=[AlertEvaluationResult(**r) for r in data["results"]],
    )
