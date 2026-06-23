from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.db.models import User
from app.schemas.ai import (
    AiDebateRequest,
    AiDebateResponse,
    AiInsightOfTheDayResponse,
    AiPredictRequest,
    AiPredictResponse,
    AiStatusResponse,
    AiSummarizeRequest,
    AiSummarizeResponse,
    AiCrisisResponseRequest,
    AiCrisisResponseResponse,
)
from app.schemas.risk import RiskAnalysisRequest, RiskAnalysisResponse, PersonRiskRequest, PersonRiskResponse
from app.services.ai_service import (
    ai_available,
    analyze_debate,
    analyze_person_risk,
    analyze_risk_profile,
    generate_insight_of_the_day,
    generate_opinion_summary,
    predict_opinion_trend,
    generate_crisis_response,
)
from app.services.plan_limits import check_ai_feature_access
from app.services.plan_service import increment_usage

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.get("/status", response_model=AiStatusResponse)
def ai_status(current_user: User = Depends(get_current_user)):
    return AiStatusResponse(enabled=ai_available())


@router.post("/summarize", response_model=AiSummarizeResponse)
async def summarize_opinion(
    body: AiSummarizeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not ai_available():
        raise HTTPException(
            status_code=503,
            detail="Add ANTHROPIC_API_KEY to enable AI features",
        )
    check_ai_feature_access(current_user.id, "ai_opinion_summary", db)
    if not body.query.strip() or len(body.results) == 0:
        raise HTTPException(status_code=400, detail="No data to summarize")

    summary = await generate_opinion_summary(
        body.query.strip(),
        body.results,
        body.sentiment_summary,
    )
    increment_usage(current_user.id, "ai_summary_calls", db)
    return AiSummarizeResponse(summary=summary, ai_enabled=True)


@router.post("/debate", response_model=AiDebateResponse)
async def analyze_debate_endpoint(
    body: AiDebateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not ai_available():
        raise HTTPException(
            status_code=503,
            detail="Add ANTHROPIC_API_KEY to enable AI features",
        )
    check_ai_feature_access(current_user.id, "ai_debate_analysis", db)
    if not body.topic.strip():
        raise HTTPException(status_code=400, detail="Topic required")

    analysis = await analyze_debate(body.topic.strip(), body.results)
    increment_usage(current_user.id, "ai_debate_calls", db)
    return AiDebateResponse(debate=analysis, ai_enabled=True)


@router.post("/predict", response_model=AiPredictResponse)
async def predict_trend(
    body: AiPredictRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not ai_available():
        raise HTTPException(
            status_code=503,
            detail="Add ANTHROPIC_API_KEY to enable AI features",
        )
    check_ai_feature_access(current_user.id, "ai_trend_prediction", db)
    if not body.query.strip() or len(body.results) < 3:
        raise HTTPException(
            status_code=400, detail="Not enough data for prediction"
        )

    prediction = await predict_opinion_trend(
        body.query.strip(),
        body.results,
        body.sentiment_summary,
        body.time_range,
    )
    increment_usage(current_user.id, "ai_trend_calls", db)
    return AiPredictResponse(prediction=prediction, ai_enabled=True)


@router.get("/insight-of-the-day", response_model=AiInsightOfTheDayResponse)
async def insight_of_the_day(
    current_user: User = Depends(get_current_user),
):
    if not ai_available():
        return AiInsightOfTheDayResponse(enabled=False, insight=None)

    insight = await generate_insight_of_the_day()
    return AiInsightOfTheDayResponse(enabled=True, insight=insight)


@router.post("/crisis-response", response_model=AiCrisisResponseResponse)
async def ai_crisis_response(
    body: AiCrisisResponseRequest,
    current_user: User = Depends(get_current_user),
):
    if not ai_available():
        pass # allow fallback for demo

    if not body.topic.strip() or len(body.results) == 0:
        raise HTTPException(status_code=400, detail="Topic and results required")

    response = await generate_crisis_response(body.topic.strip(), body.results)
    return AiCrisisResponseResponse(response=response, ai_enabled=ai_available())


@router.post("/risk-analysis", response_model=RiskAnalysisResponse)
async def risk_analysis(
    body: RiskAnalysisRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Analyse a piece of social-media content and return structured risk signals
    plus a deterministic risk level computed outside the LLM.
    """
    result = await analyze_risk_profile(
        mention_context=body.content.strip(),
        hours_on_social_media=body.social_media_usage_hours,
    )
    return RiskAnalysisResponse(**result, ai_enabled=ai_available())


@router.post("/person-risk", response_model=PersonRiskResponse)
async def person_risk(
    body: PersonRiskRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Aggregate risk analysis across multiple content items for the same subject.
    Returns a person-level verdict (aggregate_risk_level) plus per-item detail.
    """
    effective_hours = body.social_media_usage_hours if body.social_media_usage_hours is not None else 3.0
    contents = [item.content for item in body.items]

    result = await analyze_person_risk(
        contents=contents,
        hours_on_social_media=effective_hours,
    )
    return PersonRiskResponse(
        subject_handle=body.subject_handle,
        **result,
        ai_enabled=ai_available(),
    )
