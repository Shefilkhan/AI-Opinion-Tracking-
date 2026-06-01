from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.db.models import User
from app.schemas.settings import SettingsStatusResponse

router = APIRouter(prefix="/api/settings", tags=["settings"])
app_settings = get_settings()


@router.get("/status", response_model=SettingsStatusResponse)
def get_settings_status(current_user: User = Depends(get_current_user)):
    return SettingsStatusResponse(
        backend_connected=True,
        email_configured=app_settings.email_configured,
        gdelt_available=True,
        youtube_configured=bool(app_settings.youtube_api_key),
        reddit_configured=bool(
            app_settings.reddit_client_id
            and app_settings.reddit_client_secret
            and app_settings.reddit_username
        ),
        environment=app_settings.app_env,
    )
