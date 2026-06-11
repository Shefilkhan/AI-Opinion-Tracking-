from pydantic import BaseModel


class SettingsStatusResponse(BaseModel):
    backend_connected: bool = True
    email_configured: bool
    gdelt_available: bool = True
    youtube_configured: bool
    reddit_configured: bool
    environment: str
