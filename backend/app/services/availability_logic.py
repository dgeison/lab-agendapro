"""
Motor de Disponibilidade (Slot Generation Engine).

Responsável por:
  1. CRUD de blocos de expediente (availabilities)
  2. Geração de slots de horário para a página pública
  3. Cruzamento com agendamentos existentes para marcar ocupados
"""
from typing import List, Optional
from datetime import date, datetime, time, timedelta, timezone
from fastapi import HTTPException, status
from supabase import Client

from app.schemas.availability import (
    AvailabilityCreate,
    AvailabilityResponse,
    TimeSlot,
    SlotsResponse,
)
from app.core.supabase import supabase_admin

import logging

logger = logging.getLogger(__name__)

# Dias da semana em português (para logs legíveis)
DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CRUD — Blocos de Disponibilidade (protegido, professor logado)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


async def list_availabilities(
    db: Client,
) -> List[AvailabilityResponse]:
    """Lista todos os blocos de disponibilidade do professor (RLS filtra)."""
    try:
        response = (
            db.table("availabilities")
            .select("*")
            .order("day_of_week")
            .order("start_time")
            .execute()
        )
        return [AvailabilityResponse(**a) for a in response.data]
    except Exception as e:
        logger.error(f"Erro ao listar disponibilidades: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def create_availability(
    db: Client,
    data: AvailabilityCreate,
    user_id: str,
) -> AvailabilityResponse:
    """Cria um bloco de disponibilidade para o professor."""
    # Validar que start < end
    start_parts = data.start_time.split(":")
    end_parts = data.end_time.split(":")
    start_t = time(int(start_parts[0]), int(start_parts[1]))
    end_t = time(int(end_parts[0]), int(end_parts[1]))

    if start_t >= end_t:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Horário de início deve ser anterior ao horário de fim.",
        )

    try:
        row = {
            "user_id": user_id,
            "day_of_week": data.day_of_week,
            "start_time": data.start_time,
            "end_time": data.end_time,
            "is_active": True,
        }
        response = db.table("availabilities").insert(row).execute()

        if not response.data:
            raise HTTPException(status_code=500, detail="Erro ao criar disponibilidade.")

        logger.info(
            f"Disponibilidade criada: {DIAS_SEMANA[data.day_of_week]} "
            f"{data.start_time}-{data.end_time} (user={user_id})"
        )
        return AvailabilityResponse(**response.data[0])

    except HTTPException:
        raise
    except Exception as e:
        # Postgres unique violation = bloco duplicado
        if "duplicate" in str(e).lower() or "23505" in str(e):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Esse bloco de disponibilidade já existe.",
            )
        logger.error(f"Erro ao criar disponibilidade: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def bulk_replace_availabilities(
    db: Client,
    blocks: List[AvailabilityCreate],
    user_id: str,
) -> List[AvailabilityResponse]:
    """
    Substitui TODOS os blocos do professor de uma vez.
    Usado quando o professor salva toda sua configuração de expediente.

    Fluxo:
      1. Deleta todos os blocos existentes do professor
      2. Insere os novos blocos
    """
    try:
        # 1. Deletar blocos existentes
        db.table("availabilities").delete().eq("user_id", user_id).execute()

        if not blocks:
            return []

        # 2. Inserir novos blocos
        rows = []
        for b in blocks:
            start_parts = b.start_time.split(":")
            end_parts = b.end_time.split(":")
            start_t = time(int(start_parts[0]), int(start_parts[1]))
            end_t = time(int(end_parts[0]), int(end_parts[1]))
            if start_t >= end_t:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Bloco inválido: {b.start_time} >= {b.end_time}",
                )
            rows.append({
                "user_id": user_id,
                "day_of_week": b.day_of_week,
                "start_time": b.start_time,
                "end_time": b.end_time,
                "is_active": True,
            })

        response = db.table("availabilities").insert(rows).execute()

        if not response.data:
            raise HTTPException(status_code=500, detail="Erro ao salvar disponibilidades.")

        logger.info(f"Expediente atualizado: {len(rows)} blocos (user={user_id})")
        return [AvailabilityResponse(**a) for a in response.data]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao substituir disponibilidades: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def delete_availability(
    db: Client,
    availability_id: str,
) -> dict:
    """Remove um bloco de disponibilidade."""
    try:
        response = (
            db.table("availabilities")
            .delete()
            .eq("id", availability_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bloco de disponibilidade não encontrado.",
            )
        return {"message": "Disponibilidade removida com sucesso."}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao deletar disponibilidade: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# MOTOR DE SLOTS — Geração de horários disponíveis (rota pública)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


def _parse_time(t: str) -> time:
    """Converte 'HH:MM:SS' ou 'HH:MM' para time."""
    parts = t.split(":")
    return time(int(parts[0]), int(parts[1]))


async def get_available_slots(
    professional_id: str,
    target_date: date,
    service_id: str,
) -> SlotsResponse:
    """
    Gera a lista de slots para um dia específico.

    Algoritmo:
      1. Busca a duração do serviço na tabela services
      2. Busca os blocos de disponibilidade do professor para o dia da semana
      3. Busca os agendamentos existentes (não cancelados) do dia
      4. Gera slots de N minutos dentro de cada bloco
      5. Marca como indisponível os que conflitam com agendamentos existentes

    Returns:
        SlotsResponse com a lista de TimeSlot
    """
    # 0. Validar que a data não é passada
    today = date.today()
    if target_date < today:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível buscar slots para datas passadas.",
        )

    # 1. Buscar duração do serviço
    try:
        svc_response = (
            supabase_admin.table("services")
            .select("duration_minutes")
            .eq("id", service_id)
            .limit(1)
            .execute()
        )
        if not svc_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Serviço não encontrado.",
            )
        duration_minutes = svc_response.data[0]["duration_minutes"]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar serviço: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    # 2. Buscar disponibilidade do professor para o dia da semana
    # Python: isoweekday() retorna 1=seg..7=dom; convertemos para 0=dom..6=sab
    py_weekday = target_date.isoweekday()  # 1=seg, 7=dom
    db_day_of_week = 0 if py_weekday == 7 else py_weekday  # 0=dom, 1=seg..6=sab

    try:
        avail_response = (
            supabase_admin.table("availabilities")
            .select("start_time, end_time")
            .eq("user_id", professional_id)
            .eq("day_of_week", db_day_of_week)
            .eq("is_active", True)
            .order("start_time")
            .execute()
        )
    except Exception as e:
        logger.error(f"Erro ao buscar disponibilidade: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    # Se não tem disponibilidade nesse dia, retornar vazio
    if not avail_response.data:
        return SlotsResponse(
            date=target_date.isoformat(),
            professional_id=professional_id,
            service_duration_minutes=duration_minutes,
            slots=[],
        )

    # 3. Buscar agendamentos existentes do dia (não cancelados)
    day_start_utc = datetime.combine(target_date, time.min, tzinfo=timezone.utc)
    day_end_utc = datetime.combine(target_date, time.max, tzinfo=timezone.utc)

    try:
        booked_response = (
            supabase_admin.table("appointments")
            .select("start_time, end_time")
            .eq("professional_id", professional_id)
            .neq("status", "canceled")
            .neq("status", "cancelled")
            .gte("start_time", day_start_utc.isoformat())
            .lte("start_time", day_end_utc.isoformat())
            .execute()
        )
        booked = booked_response.data or []
    except Exception as e:
        logger.error(f"Erro ao buscar agendamentos do dia: {e}")
        booked = []

    # 4. Gerar slots de N minutos dentro de cada bloco de disponibilidade
    slots: list[TimeSlot] = []
    duration = timedelta(minutes=duration_minutes)

    for block in avail_response.data:
        block_start = _parse_time(block["start_time"])
        block_end = _parse_time(block["end_time"])

        cursor = datetime.combine(target_date, block_start, tzinfo=timezone.utc)
        block_end_dt = datetime.combine(target_date, block_end, tzinfo=timezone.utc)

        while cursor + duration <= block_end_dt:
            slot_start = cursor
            slot_end = cursor + duration

            # Verificar conflito com agendamentos existentes
            is_free = True
            for b in booked:
                b_start = datetime.fromisoformat(b["start_time"])
                b_end = datetime.fromisoformat(b["end_time"])
                # Overlap: A.start < B.end AND A.end > B.start
                if slot_start < b_end and slot_end > b_start:
                    is_free = False
                    break

            # Se é hoje, não mostrar slots que já passaram
            now_utc = datetime.now(timezone.utc)
            if target_date == today and slot_start <= now_utc:
                cursor += duration
                continue

            slots.append(TimeSlot(
                start=slot_start.isoformat(),
                end=slot_end.isoformat(),
                available=is_free,
            ))

            cursor += duration

    logger.info(
        f"Slots gerados: {len(slots)} slots para {target_date} "
        f"({DIAS_SEMANA[db_day_of_week]}) | prof={professional_id}"
    )

    return SlotsResponse(
        date=target_date.isoformat(),
        professional_id=professional_id,
        service_duration_minutes=duration_minutes,
        slots=slots,
    )
