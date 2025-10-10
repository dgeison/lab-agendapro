"""
Router para integração com Google Calendar
"""
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from app.core.security import get_current_user
from app.services.google_calendar_service import google_calendar_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/google-calendar", tags=["google-calendar"])


class GoogleConnectionStatus(BaseModel):
    connected: bool
    google_email: str = None
    google_name: str = None


@router.get("/auth-url")
async def get_google_auth_url(current_user: dict = Depends(get_current_user)):
    """Obter URL de autorização do Google."""
    try:
        auth_url = google_calendar_service.get_authorization_url(current_user["id"])
        return {"auth_url": auth_url}
    except Exception as e:
        logger.error(f"Erro ao gerar URL de autorização: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao conectar com Google"
        )


@router.get("/callback")
async def google_oauth_callback_get(code: str, state: str):
    """Processar callback do OAuth2 do Google (GET)."""
    try:
        result = await google_calendar_service.handle_oauth_callback(code, state)
        # Retornar uma página HTML simples indicando sucesso
        html_content = f"""
        <html>
            <head><title>Autorização Concluída</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h2>✅ Autorização Concluída!</h2>
                <p>Sua conta Google foi conectada com sucesso ao AgendaPro.</p>
                <p><strong>Email:</strong> {result.get('google_email', 'N/A')}</p>
                <p>Você pode fechar esta aba e voltar ao AgendaPro.</p>
                <script>
                    // Tentar fechar a aba automaticamente
                    setTimeout(() => {{
                        window.close();
                    }}, 3000);
                </script>
            </body>
        </html>
        """
        return HTMLResponse(content=html_content)
    except Exception as e:
        error_msg = str(e)
        if "invalid_grant" in error_msg:
            html_content = """
            <html>
                <head><title>Código Expirado</title></head>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h2>⚠️ Código de Autorização Expirado</h2>
                    <p>O código de autorização expirou. Isso é normal!</p>
                    <p><strong>Solução:</strong> Volte ao AgendaPro e clique em "Conectar com Google" novamente.</p>
                    <p>Você pode fechar esta aba.</p>
                </body>
            </html>
            """
            return HTMLResponse(content=html_content, status_code=400)
        logger.error(f"Erro no callback OAuth: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao processar autenticação Google"
        )

@router.post("/callback")
async def google_oauth_callback(code: str, state: str):
    """Processar callback do OAuth2 do Google."""
    try:
        result = await google_calendar_service.handle_oauth_callback(code, state)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro no callback OAuth: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao processar autenticação Google"
        )


@router.get("/status", response_model=GoogleConnectionStatus)
async def get_connection_status(current_user: dict = Depends(get_current_user)):
    """Verificar status da conexão com Google Calendar."""
    try:
        from app.core.supabase import supabase_admin
        
        response = supabase_admin.table("user_google_tokens").select("*").eq("user_id", current_user["id"]).execute()
        
        if response.data:
            token_data = response.data[0]
            return GoogleConnectionStatus(
                connected=True,
                google_email=token_data.get('google_email'),
                google_name=token_data.get('google_name')
            )
        else:
            return GoogleConnectionStatus(connected=False)
            
    except Exception as e:
        logger.error(f"Erro ao verificar status da conexão: {str(e)}")
        return GoogleConnectionStatus(connected=False)


@router.delete("/disconnect")
async def disconnect_google_calendar(current_user: dict = Depends(get_current_user)):
    """Desconectar Google Calendar."""
    try:
        success = await google_calendar_service.disconnect_google_calendar(current_user["id"])
        
        if success:
            return {"message": "Google Calendar desconectado com sucesso"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao desconectar Google Calendar"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao desconectar Google Calendar: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno do servidor"
        )