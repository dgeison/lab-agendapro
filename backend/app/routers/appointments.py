from typing import List
from fastapi import APIRouter, HTTPException, Depends
from app.schemas.appointments import AppointmentCreate, AppointmentResponse, TimeSlot
from app.services.appointments_service import (
    get_available_slots,
    create_appointment,
    confirm_payment
)
from app.core.security import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/appointments", tags=["appointments"])


# Endpoints públicos (sem autenticação)
@router.get("/available-slots/{service_id}/{date}", response_model=List[TimeSlot])
async def get_service_available_slots(service_id: str, date: str):
    """Buscar horários disponíveis para um serviço em uma data específica."""
    logger.info(f"Buscando horários disponíveis para serviço {service_id} na data {date}")
    return await get_available_slots(service_id, date)


@router.post("/", response_model=AppointmentResponse)
async def create_new_appointment(appointment_data: AppointmentCreate):
    """Criar novo agendamento (público)."""
    logger.info(f"Criando agendamento público para serviço {appointment_data.service_id}")
    return await create_appointment(appointment_data)


@router.post("/{appointment_id}/confirm-payment", response_model=AppointmentResponse)
async def confirm_appointment_payment(appointment_id: str, payment_data: dict):
    """Confirmar pagamento do agendamento."""
    logger.info(f"Confirmando pagamento do agendamento {appointment_id}")
    payment_intent_id = payment_data.get("payment_intent_id")
    if not payment_intent_id:
        raise HTTPException(status_code=400, detail="payment_intent_id é obrigatório")
    
    return await confirm_payment(appointment_id, payment_intent_id)


# Endpoints protegidos (para profissionais)
@router.get("/my-appointments", response_model=List[AppointmentResponse])
async def get_my_appointments(current_user: dict = Depends(get_current_user)):
    """Listar agendamentos do profissional atual."""
    # TODO: Implementar busca de agendamentos do profissional
    logger.info(f"Buscando agendamentos do profissional {current_user['id']}")
    return []