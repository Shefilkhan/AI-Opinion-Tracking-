from app.db.models import Mention
from app.schemas.mention import MentionResponse
from app.schemas.sentiment import SentimentBrief


def build_mention_response(mention: Mention) -> MentionResponse:
    sentiment = None
    if mention.sentiment_result is not None:
        sr = mention.sentiment_result
        sentiment = SentimentBrief(
            sentiment_label=sr.sentiment_label,
            sentiment_score=sr.sentiment_score,
            confidence=sr.confidence,
            model_name=sr.model_name,
        )
    return MentionResponse(
        id=mention.id,
        project_id=mention.project_id,
        source=mention.source,
        source_item_id=mention.source_item_id,
        source_parent_id=mention.source_parent_id,
        author=mention.author,
        text=mention.text,
        cleaned_text=mention.cleaned_text,
        url=mention.url,
        published_at=mention.published_at,
        engagement_score=mention.engagement_score,
        created_at=mention.created_at,
        sentiment=sentiment,
    )
