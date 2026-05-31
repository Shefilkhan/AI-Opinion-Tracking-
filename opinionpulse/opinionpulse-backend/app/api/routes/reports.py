from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.project_deps import get_owned_project
from app.db.database import get_db
from app.db.models import Project, Report, User
from app.schemas.report import (
    ReportDetailResponse,
    ReportGenerateRequest,
    ReportListItem,
    ReportListResponse,
    ReportSummarySection,
    SourceSentimentReportItem,
    TopMentionReportItem,
)
from app.services import report_service

router = APIRouter(prefix="/api", tags=["reports"])


def _get_owned_report(
    report_id: int, current_user: User, db: Session
) -> Report:
    report = (
        db.query(Report)
        .join(Project, Report.project_id == Project.id)
        .filter(Report.id == report_id, Project.user_id == current_user.id)
        .first()
    )
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )
    return report


def _detail_to_response(data: dict) -> ReportDetailResponse:
    return ReportDetailResponse(
        id=data["id"],
        project_id=data["project_id"],
        project_name=data["project_name"],
        report_type=data["report_type"],
        summary=data["summary"],
        generated_at=data["generated_at"],
        overview=ReportSummarySection(**data.get("overview", {})),
        source_breakdown=[
            SourceSentimentReportItem(**item) for item in data.get("source_breakdown", [])
        ],
        top_positive=[
            TopMentionReportItem(**item) for item in data.get("top_positive", [])
        ],
        top_negative=[
            TopMentionReportItem(**item) for item in data.get("top_negative", [])
        ],
        keyword_hints=data.get("keyword_hints", []),
        themes_positive=data.get("themes_positive", []),
        themes_negative=data.get("themes_negative", []),
    )


@router.post(
    "/projects/{project_id}/reports/generate",
    response_model=ReportDetailResponse,
)
def generate_report(
    project_id: int,
    body: ReportGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = get_owned_project(project_id, current_user, db)
    data = report_service.generate_project_report(
        db, project.id, body.report_type
    )
    return _detail_to_response(data)


@router.get(
    "/projects/{project_id}/reports",
    response_model=ReportListResponse,
)
def list_reports(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = get_owned_project(project_id, current_user, db)
    items = report_service.list_project_reports(db, project.id)
    return ReportListResponse(
        reports=[ReportListItem(**item) for item in items]
    )


@router.get(
    "/reports/{report_id}",
    response_model=ReportDetailResponse,
)
def get_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = _get_owned_report(report_id, current_user, db)
    data = report_service.get_project_report(db, report.id)
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )
    return _detail_to_response(data)


@router.delete(
    "/reports/{report_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = _get_owned_report(report_id, current_user, db)
    report_service.delete_project_report(db, report.id)
    return None


@router.get("/projects/{project_id}/reports/export/mentions.csv")
def export_mentions_csv(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = get_owned_project(project_id, current_user, db)
    csv_content = report_service.build_mentions_csv(db, project.id)
    filename = f"opinionpulse_mentions_project_{project.id}.csv"
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/projects/{project_id}/reports/export/sentiment.csv")
def export_sentiment_csv(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = get_owned_project(project_id, current_user, db)
    csv_content = report_service.build_sentiment_csv(db, project.id)
    filename = f"opinionpulse_sentiment_project_{project.id}.csv"
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
