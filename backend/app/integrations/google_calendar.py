"""
Google Calendar Integration — Interface (Mock).

Classe de integração com o Google Calendar.
Por enquanto retorna um mock_event_id. A API real será plugada depois.
"""
import logging
import uuid

logger = logging.getLogger(__name__)


class GoogleCalendarService:
    """
    Serviço de integração com Google Calendar.

    Métodos:
        create_event  — cria evento no Google Calendar
        delete_event  — remove evento do Google Calendar
    """

    async def create_event(self, appointment_data: dict) -> str:
        """
        Cria um evento no Google Calendar (MOCK).

        Args:
            appointment_data: dict contendo start_time, end_time, service_name, etc.

        Returns:
            str: O ID do evento criado (mock por enquanto).
        """
        mock_event_id = f"gcal_mock_{uuid.uuid4().hex[:12]}"

        logger.info(
            f"[GoogleCalendar MOCK] Evento criado: {mock_event_id} | "
            f"Início: {appointment_data.get('start_time')} | "
            f"Fim: {appointment_data.get('end_time')} | "
            f"Serviço: {appointment_data.get('service_name', 'N/A')}"
        )

        return mock_event_id

    async def delete_event(self, event_id: str) -> bool:
        """
        Remove um evento do Google Calendar (MOCK).

        Args:
            event_id: ID do evento a ser removido.

        Returns:
            bool: True se removido com sucesso.
        """
        logger.info(f"[GoogleCalendar MOCK] Evento removido: {event_id}")
        return True


# Instância singleton para uso em toda a aplicação
google_calendar = GoogleCalendarService()
