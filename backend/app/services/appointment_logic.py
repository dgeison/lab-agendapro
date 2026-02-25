"""
Lógica de negócio para Agendamentos (Appointments).

Módulo crítico — implementa:
  - Upsert de estudante (find-or-create by email + professional_id)
  - Prevenção de double-booking via check_availability()
  - Criação pública de agendamento (sem JWT, usa supabase_admin)

As rotas protegidas usam o cliente RLS-aware, enquanto
a rota pública usa supabase_admin.
"""
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import HTTPException, status
from supabase import Client

from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentResponse,
    AppointmentStatusUpdate,
)
from app.core.supabase import supabase_admin
from app.integrations.google_calendar import google_calendar

import logging

logger = logging.getLogger(__name__)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# UPSERT DE ESTUDANTE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


async def upsert_student(
    professional_id: str,
    name: str,
    email: str,
    phone: Optional[str] = None,
) -> str:
    """
    Verifica se já existe um estudante com este email para este
    professional_id. Se não, cria um novo.

    Returns:
        O ID (UUID) do estudante encontrado/criado.
    """
    try:
        # Buscar estudante existente
        response = (
            supabase_admin.table("students")
            .select("id")
            .eq("user_id", professional_id)
            .eq("email", email)
            .limit(1)
            .execute()
        )

        if response.data:
            student_id = response.data[0]["id"]
            logger.info(f"Estudante existente encontrado: {student_id} ({email})")
            return student_id

        # Criar novo estudante
        new_student = {
            "user_id": professional_id,
            "full_name": name,
            "email": email,
            "phone": phone,
        }

        insert_response = (
            supabase_admin.table("students")
            .insert(new_student)
            .execute()
        )

        if not insert_response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao criar estudante.",
            )

        student_id = insert_response.data[0]["id"]
        logger.info(f"Novo estudante criado: {student_id} ({email})")
        return student_id

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro no upsert de estudante: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao processar estudante: {e}")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# VALIDAÇÃO DE CONFLITO (Double-Booking Prevention)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


async def check_availability(
    professional_id: str,
    start_time: datetime,
    end_time: datetime,
    exclude_appointment_id: Optional[str] = None,
) -> bool:
    """
    Verifica se o intervalo [start_time, end_time) está livre
    na agenda do profissional.

    Regra de sobreposição:
        Dois intervalos [A_start, A_end) e [B_start, B_end) se sobrepõem
        quando A_start < B_end AND A_end > B_start.

    Ignora agendamentos com status 'canceled'.
    Opcionalmente exclui um appointment_id (útil para reagendar).

    Raises:
        HTTPException 409: se houver conflito de horário.
    """
    try:
        start_iso = start_time.isoformat()
        end_iso = end_time.isoformat()

        query = (
            supabase_admin.table("appointments")
            .select("id, start_time, end_time, status")
            .eq("professional_id", professional_id)
            .neq("status", "canceled")
            .lt("start_time", end_iso)
            .gt("end_time", start_iso)
        )

        if exclude_appointment_id:
            query = query.neq("id", exclude_appointment_id)

        response = query.execute()

        if response.data:
            conflicting = response.data[0]
            logger.warning(
                f"Conflito de horário detectado para profissional {professional_id}: "
                f"agendamento existente {conflicting['id']} "
                f"({conflicting['start_time']} - {conflicting['end_time']})"
            )
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Horário indisponível. Já existe um agendamento nesse intervalo. "
                       "Por favor, escolha outro horário.",
            )

        return True

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao verificar disponibilidade: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CRIAÇÃO PÚBLICA (aluno agendando pela página pública)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


async def create_public_appointment(
    data: AppointmentCreate,
) -> AppointmentResponse:
    """
    Cria agendamento a partir da Public Booking Page.
    Usa supabase_admin pois não há token de usuário.

    Fluxo:
        1. Valida que start_time < end_time
        2. Converte para UTC
        3. Upsert do estudante (find-or-create by email)
        4. Verifica disponibilidade (check_availability)
        5. Insere agendamento com status 'pending'
        6. Dispara criação no Google Calendar (mock)
    """
    # 1. Validações básicas
    if data.start_time >= data.end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_time deve ser anterior a end_time.",
        )

    # 2. Garantir UTC
    start_utc = data.start_time.astimezone(timezone.utc)
    end_utc = data.end_time.astimezone(timezone.utc)

    # 3. Upsert do estudante
    student_id = await upsert_student(
        professional_id=data.professional_id,
        name=data.student_name,
        email=data.student_email,
        phone=data.student_phone,
    )

    # 4. Verificar conflitos
    await check_availability(data.professional_id, start_utc, end_utc)

    # 5. Montar dados para inserção
    appointment_dict = {
        "professional_id": data.professional_id,
        "service_id": data.service_id,
        "student_id": student_id,
        "client_name": data.student_name,
        "client_email": data.student_email,
        "start_time": start_utc.isoformat(),
        "end_time": end_utc.isoformat(),
        "status": "pending",
    }

    try:
        response = (
            supabase_admin.table("appointments")
            .insert(appointment_dict)
            .execute()
        )
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao criar agendamento.",
            )

        appointment = response.data[0]

        # 6. Google Calendar (mock)
        try:
            event_id = await google_calendar.create_event({
                "start_time": str(start_utc),
                "end_time": str(end_utc),
                "service_id": data.service_id,
                "professional_id": data.professional_id,
            })
            supabase_admin.table("appointments").update(
                {"google_event_id": event_id}
            ).eq("id", appointment["id"]).execute()
            appointment["google_event_id"] = event_id
        except Exception as gcal_err:
            logger.warning(f"Falha ao criar evento no Google Calendar: {gcal_err}")

        logger.info(f"Agendamento criado: {appointment['id']} | student: {student_id}")
        return AppointmentResponse(**appointment)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao criar agendamento: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# LISTAGEM (profissional autenticado, RLS-aware)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


async def list_appointments(
    db: Client,
    status_filter: Optional[str] = None,
) -> List[AppointmentResponse]:
    """
    Lista agendamentos do profissional autenticado.
    O RLS filtra automaticamente por professional_id.
    """
    try:
        query = (
            db.table("appointments")
            .select("*")
            .order("start_time", desc=False)
        )

        if status_filter:
            query = query.eq("status", status_filter)

        response = query.execute()
        return [AppointmentResponse(**a) for a in response.data]

    except Exception as e:
        logger.error(f"Erro ao listar agendamentos: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# BUSCAR POR ID (profissional autenticado, RLS-aware)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


async def get_appointment(
    db: Client, appointment_id: str
) -> AppointmentResponse:
    """Busca um agendamento por ID (RLS filtra por profissional)."""
    try:
        response = (
            db.table("appointments")
            .select("*")
            .eq("id", appointment_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agendamento não encontrado.",
            )
        return AppointmentResponse(**response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar agendamento: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ATUALIZAR STATUS (confirmar / cancelar)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


async def update_appointment_status(
    db: Client,
    appointment_id: str,
    data: AppointmentStatusUpdate,
) -> AppointmentResponse:
    """
    Atualiza o status de um agendamento (confirmed / canceled).
    Se cancelar, tenta remover o evento do Google Calendar.
    """
    existing = await get_appointment(db, appointment_id)

    if existing.status == "canceled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível alterar um agendamento cancelado.",
        )

    try:
        response = (
            db.table("appointments")
            .update({"status": data.status})
            .eq("id", appointment_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agendamento não encontrado.",
            )

        appointment = response.data[0]

        if data.status == "canceled" and existing.google_event_id:
            try:
                await google_calendar.delete_event(existing.google_event_id)
            except Exception as gcal_err:
                logger.warning(f"Falha ao remover evento do Google Calendar: {gcal_err}")

        logger.info(f"Agendamento {appointment_id} → status: {data.status}")
        return AppointmentResponse(**appointment)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar status: {e}")
        raise HTTPException(status_code=500, detail=str(e))
