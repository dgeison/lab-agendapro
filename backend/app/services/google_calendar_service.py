"""
Serviço de integração com Google Calendar
"""
import json
import requests
from typing import Optional, List, Dict
from datetime import datetime, timedelta
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from fastapi import HTTPException, status
from app.core.supabase import supabase_admin
from app.core.google_config import GOOGLE_SCOPES, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, TIMEZONE
import logging

logger = logging.getLogger(__name__)


class GoogleCalendarService:
    def __init__(self):
        self.scopes = GOOGLE_SCOPES
        self.client_config = {
            "web": {
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [GOOGLE_REDIRECT_URI]
            }
        }

    def get_authorization_url(self, user_id: str) -> str:
        """Gerar URL de autorização OAuth2 do Google."""
        try:
            flow = Flow.from_client_config(
                self.client_config,
                scopes=self.scopes,
                redirect_uri=GOOGLE_REDIRECT_URI
            )
            
            authorization_url, state = flow.authorization_url(
                access_type='offline',
                include_granted_scopes='true',
                state=user_id  # Incluir user_id no state para identificar depois
            )
            
            logger.info(f"URL de autorização gerada para usuário {user_id}")
            return authorization_url
            
        except Exception as e:
            logger.error(f"Erro ao gerar URL de autorização: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao conectar com Google"
            )

    async def handle_oauth_callback(self, code: str, state: str) -> Dict:
        """Processar callback do OAuth2 e salvar tokens."""
        try:
            logger.info(f"Processando callback OAuth2 - state: {state}, code: {code[:20]}...")
            user_id = state  # O state contém o user_id
            
            logger.info(f"Criando flow OAuth2 com redirect_uri: {GOOGLE_REDIRECT_URI}")
            flow = Flow.from_client_config(
                self.client_config,
                scopes=self.scopes,
                redirect_uri=GOOGLE_REDIRECT_URI
            )
            
            logger.info("Trocando código por tokens...")
            # Trocar código por tokens usando abordagem direta
            try:
                # Método direto sem validação de scope
                from google.oauth2.credentials import Credentials
                from google.auth.transport.requests import Request
                import requests
                
                # Fazer requisição direta para trocar código por tokens
                token_url = "https://oauth2.googleapis.com/token"
                token_data = {
                    'client_id': GOOGLE_CLIENT_ID,
                    'client_secret': GOOGLE_CLIENT_SECRET,
                    'code': code,
                    'grant_type': 'authorization_code',
                    'redirect_uri': GOOGLE_REDIRECT_URI
                }
                
                logger.info("Fazendo requisição direta para tokens...")
                response = requests.post(token_url, data=token_data)
                response.raise_for_status()
                token_response = response.json()
                
                logger.info("Tokens obtidos com sucesso via requisição direta")
                
                # Criar credenciais a partir da resposta
                credentials = Credentials(
                    token=token_response['access_token'],
                    refresh_token=token_response.get('refresh_token'),
                    token_uri=token_url,
                    client_id=GOOGLE_CLIENT_ID,
                    client_secret=GOOGLE_CLIENT_SECRET,
                    scopes=self.scopes
                )
                
            except Exception as e:
                logger.error(f"Erro ao obter tokens via requisição direta: {str(e)}")
                raise
            
            # Obter informações do usuário Google
            try:
                logger.info("Obtendo informações do usuário Google...")
                service = build('oauth2', 'v2', credentials=credentials)
                user_info = service.userinfo().get().execute()
                logger.info(f"Informações do usuário obtidas: {user_info.get('email')}")
            except Exception as e:
                logger.error(f"Erro ao obter informações do usuário: {str(e)}")
                raise
            
            # Salvar tokens no banco
            try:
                logger.info("Salvando tokens no banco de dados...")
                token_data = {
                    'user_id': user_id,
                    'google_email': user_info.get('email'),
                    'google_name': user_info.get('name'),
                    'access_token': credentials.token,
                    'refresh_token': credentials.refresh_token,
                    'token_expiry': credentials.expiry.isoformat() if credentials.expiry else None,
                    'scopes': json.dumps(self.scopes)
                }
                
                logger.info(f"Dados do token: user_id={user_id}, email={user_info.get('email')}")
                
                # Verificar se já existe token para este usuário
                existing = supabase_admin.table("user_google_tokens").select("*").eq("user_id", user_id).execute()
                logger.info(f"Tokens existentes encontrados: {len(existing.data) if existing.data else 0}")
                
                if existing.data:
                    # Atualizar token existente
                    result = supabase_admin.table("user_google_tokens").update(token_data).eq("user_id", user_id).execute()
                    logger.info("Token atualizado com sucesso")
                else:
                    # Inserir novo token
                    result = supabase_admin.table("user_google_tokens").insert(token_data).execute()
                    logger.info("Novo token inserido com sucesso")
                
                logger.info(f"Tokens Google salvos para usuário {user_id}")
            except Exception as e:
                logger.error(f"Erro ao salvar no banco: {str(e)}")
                raise
            
            return {
                "message": "Google Calendar conectado com sucesso",
                "google_email": user_info.get('email'),
                "google_name": user_info.get('name')
            }
            
        except Exception as e:
            logger.error(f"Erro no callback OAuth: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao processar autenticação Google"
            )

    async def get_credentials(self, user_id: str) -> Optional[Credentials]:
        """Obter credenciais válidas do Google para um usuário."""
        try:
            # Buscar token do usuário
            response = supabase_admin.table("user_google_tokens").select("*").eq("user_id", user_id).execute()
            
            if not response.data:
                return None
            
            token_data = response.data[0]
            
            # Criar credenciais
            credentials = Credentials(
                token=token_data['access_token'],
                refresh_token=token_data['refresh_token'],
                token_uri="https://oauth2.googleapis.com/token",
                client_id=GOOGLE_CLIENT_ID,
                client_secret=GOOGLE_CLIENT_SECRET,
                scopes=json.loads(token_data['scopes'])
            )
            
            # Verificar se o token expirou e renovar se necessário
            if credentials.expired and credentials.refresh_token:
                credentials.refresh(Request())
                
                # Atualizar token no banco
                update_data = {
                    'access_token': credentials.token,
                    'token_expiry': credentials.expiry.isoformat() if credentials.expiry else None
                }
                supabase_admin.table("user_google_tokens").update(update_data).eq("user_id", user_id).execute()
                
                logger.info(f"Token Google renovado para usuário {user_id}")
            
            return credentials
            
        except Exception as e:
            logger.error(f"Erro ao obter credenciais Google: {str(e)}")
            return None

    async def create_calendar_event(self, user_id: str, appointment_data: Dict) -> Optional[str]:
        """Criar evento no Google Calendar."""
        try:
            credentials = await self.get_credentials(user_id)
            if not credentials:
                logger.warning(f"Credenciais Google não encontradas para usuário {user_id}")
                return None
            
            service = build('calendar', 'v3', credentials=credentials)
            
            # Criar evento
            event = {
                'summary': f"AgendaPro: {appointment_data['service_name']}",
                'description': f"Cliente: {appointment_data['client_name']}\nEmail: {appointment_data['client_email']}\nTelefone: {appointment_data.get('client_phone', 'N/A')}",
                'start': {
                    'dateTime': appointment_data['start_datetime'],
                    'timeZone': TIMEZONE,
                },
                'end': {
                    'dateTime': appointment_data['end_datetime'],
                    'timeZone': TIMEZONE,
                },
                'attendees': [
                    {'email': appointment_data['client_email']},
                ],
                'reminders': {
                    'useDefault': False,
                    'overrides': [
                        {'method': 'email', 'minutes': 24 * 60},  # 1 dia antes
                        {'method': 'popup', 'minutes': 30},       # 30 min antes
                    ],
                },
            }
            
            created_event = service.events().insert(calendarId='primary', body=event).execute()
            event_id = created_event.get('id')
            
            logger.info(f"Evento criado no Google Calendar: {event_id}")
            return event_id
            
        except HttpError as e:
            logger.error(f"Erro HTTP do Google Calendar: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Erro ao criar evento no calendário: {str(e)}")
            return None

    async def update_calendar_event(self, user_id: str, event_id: str, appointment_data: Dict) -> bool:
        """Atualizar evento no Google Calendar."""
        try:
            credentials = await self.get_credentials(user_id)
            if not credentials:
                return False
            
            service = build('calendar', 'v3', credentials=credentials)
            
            # Buscar evento existente
            event = service.events().get(calendarId='primary', eventId=event_id).execute()
            
            # Atualizar dados
            event['summary'] = f"AgendaPro: {appointment_data['service_name']}"
            event['description'] = f"Cliente: {appointment_data['client_name']}\nEmail: {appointment_data['client_email']}\nTelefone: {appointment_data.get('client_phone', 'N/A')}"
            event['start'] = {
                'dateTime': appointment_data['start_datetime'],
                'timeZone': TIMEZONE,
            }
            event['end'] = {
                'dateTime': appointment_data['end_datetime'],
                'timeZone': TIMEZONE,
            }
            
            service.events().update(calendarId='primary', eventId=event_id, body=event).execute()
            
            logger.info(f"Evento atualizado no Google Calendar: {event_id}")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao atualizar evento: {str(e)}")
            return False

    async def delete_calendar_event(self, user_id: str, event_id: str) -> bool:
        """Deletar evento do Google Calendar."""
        try:
            credentials = await self.get_credentials(user_id)
            if not credentials:
                return False
            
            service = build('calendar', 'v3', credentials=credentials)
            service.events().delete(calendarId='primary', eventId=event_id).execute()
            
            logger.info(f"Evento deletado do Google Calendar: {event_id}")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao deletar evento: {str(e)}")
            return False

    async def check_availability(self, user_id: str, start_datetime: str, end_datetime: str) -> bool:
        """Verificar se horário está disponível no Google Calendar."""
        try:
            credentials = await self.get_credentials(user_id)
            if not credentials:
                return True  # Se não tem Google Calendar, considera disponível
            
            service = build('calendar', 'v3', credentials=credentials)
            
            # Buscar eventos no período
            events_result = service.events().list(
                calendarId='primary',
                timeMin=start_datetime,
                timeMax=end_datetime,
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            
            events = events_result.get('items', [])
            
            # Se há eventos no período, não está disponível
            return len(events) == 0
            
        except Exception as e:
            logger.error(f"Erro ao verificar disponibilidade: {str(e)}")
            return True  # Em caso de erro, considera disponível

    async def disconnect_google_calendar(self, user_id: str) -> bool:
        """Desconectar Google Calendar."""
        try:
            # Deletar tokens do banco
            supabase_admin.table("user_google_tokens").delete().eq("user_id", user_id).execute()
            
            logger.info(f"Google Calendar desconectado para usuário {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao desconectar Google Calendar: {str(e)}")
            return False


# Instância global do serviço
google_calendar_service = GoogleCalendarService()