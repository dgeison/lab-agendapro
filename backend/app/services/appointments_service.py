from typing import List
from datetime import datetime, timedelta
from fastapi import HTTPException, status
from app.core.supabase import supabase_admin
from app.schemas.appointments import AppointmentCreate, AppointmentResponse, TimeSlot, PublicProfile
import logging

logger = logging.getLogger(__name__)


async def get_public_profile(slug: str) -> PublicProfile:
    """Buscar perfil público do profissional pelo slug."""
    try:
        logger.info(f"Buscando perfil público para slug: {slug}")
        
        response = supabase_admin.table("user_profiles").select("*").eq("public_slug", slug).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profissional não encontrado"
            )
        
        profile = response.data[0]
        return PublicProfile(**profile)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar perfil público: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno do servidor"
        )


async def get_available_slots(service_id: str, date: str) -> List[TimeSlot]:
    """Buscar horários disponíveis para um serviço em uma data específica."""
    try:
        logger.info(f"Buscando horários disponíveis para serviço {service_id} na data {date}")
        
        # Buscar informações do serviço
        service_response = supabase_admin.table("services").select("duration_minutes").eq("id", service_id).execute()
        
        if not service_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Serviço não encontrado"
            )
        
        duration_minutes = service_response.data[0]["duration_minutes"]
        
        # Buscar agendamentos existentes para a data
        start_date = f"{date}T00:00:00"
        end_date = f"{date}T23:59:59"
        
        appointments_response = supabase_admin.table("appointments").select("start_time, end_time").eq("service_id", service_id).gte("start_time", start_date).lte("start_time", end_date).eq("status", "confirmed").execute()
        
        existing_appointments = appointments_response.data
        
        # Gerar slots disponíveis (8h às 18h, intervalos de acordo com duração do serviço)
        slots = []
        target_date = datetime.fromisoformat(date)
        
        # Horário comercial: 8h às 18h
        start_hour = 8
        end_hour = 18
        
        current_time = target_date.replace(hour=start_hour, minute=0, second=0, microsecond=0)
        end_time = target_date.replace(hour=end_hour, minute=0, second=0, microsecond=0)
        
        while current_time + timedelta(minutes=duration_minutes) <= end_time:
            slot_start = current_time
            slot_end = current_time + timedelta(minutes=duration_minutes)
            
            # Verificar se o slot conflita com algum agendamento existente
            is_available = True
            for appointment in existing_appointments:
                appointment_start = datetime.fromisoformat(appointment["start_time"].replace("Z", "+00:00"))
                appointment_end = datetime.fromisoformat(appointment["end_time"].replace("Z", "+00:00"))
                
                # Verificar sobreposição
                if (slot_start < appointment_end and slot_end > appointment_start):
                    is_available = False
                    break
            
            # Verificar se não é no passado
            if slot_start <= datetime.now():
                is_available = False
            
            slots.append(TimeSlot(
                start=slot_start,
                end=slot_end,
                available=is_available
            ))
            
            # Próximo slot (intervalo de 30 minutos ou duração do serviço, o que for menor)
            interval = min(30, duration_minutes)
            current_time += timedelta(minutes=interval)
        
        logger.info(f"Encontrados {len(slots)} slots, {len([s for s in slots if s.available])} disponíveis")
        return slots
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar horários disponíveis: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno do servidor"
        )


async def create_appointment(appointment_data: AppointmentCreate) -> AppointmentResponse:
    """Criar novo agendamento."""
    try:
        logger.info(f"Criando agendamento para serviço {appointment_data.service_id}")
        
        # Verificar se o serviço existe
        service_response = supabase_admin.table("services").select("id").eq("id", appointment_data.service_id).execute()
        
        if not service_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Serviço não encontrado"
            )
        
        # Verificar se o horário ainda está disponível
        existing_appointment = supabase_admin.table("appointments").select("id").eq("service_id", appointment_data.service_id).eq("start_time", appointment_data.start_time.isoformat()).neq("status", "cancelled").execute()
        
        if existing_appointment.data:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Este horário não está mais disponível"
            )
        
        # Preparar dados para inserção
        appointment_dict = {
            "service_id": appointment_data.service_id,
            "client_name": appointment_data.client_name,
            "client_email": appointment_data.client_email,
            "start_time": appointment_data.start_time.isoformat(),
            "end_time": appointment_data.end_time.isoformat(),
            "status": "pending_payment"  # Status inicial
        }
        
        # Inserir no banco
        response = supabase_admin.table("appointments").insert(appointment_dict).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao criar agendamento"
            )
        
        appointment = response.data[0]
        logger.info(f"Agendamento criado com sucesso: {appointment['id']}")
        
        return AppointmentResponse(**appointment)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao criar agendamento: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno: {str(e)}"
        )


async def confirm_payment(appointment_id: str, payment_intent_id: str) -> AppointmentResponse:
    """Confirmar pagamento e atualizar status do agendamento."""
    try:
        logger.info(f"Confirmando pagamento para agendamento {appointment_id}")
        
        # Atualizar status do agendamento
        update_data = {
            "status": "confirmed",
            "stripe_payment_intent_id": payment_intent_id
        }
        
        response = supabase_admin.table("appointments").update(update_data).eq("id", appointment_id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agendamento não encontrado"
            )
        
        appointment = response.data[0]
        logger.info(f"Pagamento confirmado para agendamento: {appointment_id}")
        
        return AppointmentResponse(**appointment)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao confirmar pagamento: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno: {str(e)}"
        )