"""
Configurações do Google Calendar API
"""
from typing import Optional
from app.core.config import settings

# Google Calendar API settings
GOOGLE_CLIENT_ID = settings.google_client_id
GOOGLE_CLIENT_SECRET = settings.google_client_secret
GOOGLE_REDIRECT_URI = "http://localhost:8000/api/v1/google-calendar/callback"

# Scopes necessários para o Google Calendar
GOOGLE_SCOPES = [
    'openid',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
]

# Configurações do calendário
DEFAULT_CALENDAR_NAME = "AgendaPro"
TIMEZONE = "America/Sao_Paulo"