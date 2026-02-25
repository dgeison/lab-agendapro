-- ================================================================
-- Migração 03: Tabela availabilities + Anti Double-Booking Index
--
-- Contexto: Resolve a "Agenda Infinita" — permite que o professor
-- configure seu horário de expediente e impede agendamentos
-- duplicados no mesmo horário.
-- ================================================================

-- ─────────────────────────────────────────────────────────────────
-- 1. TABELA: availabilities (Horário de Expediente do Professor)
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS availabilities (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Dono da agenda (professor)
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Dia da semana: 0=domingo, 1=segunda, 2=terça, ..., 6=sábado
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),

  -- Horário de início e fim do bloco de expediente (sem timezone)
  -- Exemplo: start_time=08:00, end_time=12:00 (manhã)
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,

  -- Flag de ativo (professor pode desativar sem deletar)
  is_active   BOOLEAN DEFAULT TRUE NOT NULL,

  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),

  -- Impede blocos duplicados no mesmo dia/horário para o mesmo professor
  UNIQUE(user_id, day_of_week, start_time, end_time),

  -- Garante que start_time < end_time
  CHECK (start_time < end_time)
);

-- Trigger para updated_at automático
CREATE TRIGGER update_availabilities_updated_at
  BEFORE UPDATE ON availabilities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Índice para queries públicas (buscar disponibilidade de um professor por dia)
CREATE INDEX IF NOT EXISTS idx_avail_user_day
  ON availabilities(user_id, day_of_week)
  WHERE is_active = TRUE;


-- ─────────────────────────────────────────────────────────────────
-- 2. RLS (Row Level Security) para availabilities
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE availabilities ENABLE ROW LEVEL SECURITY;

-- Professor pode ver/criar/editar/deletar suas próprias disponibilidades
CREATE POLICY "Professor manages own availability" ON availabilities
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Qualquer pessoa pode LER disponibilidades (para a página pública)
-- service_role bypass RLS, então essa policy é para o frontend público
CREATE POLICY "Anyone can read availabilities" ON availabilities
  FOR SELECT USING (is_active = TRUE);


-- ─────────────────────────────────────────────────────────────────
-- 3. ANTI DOUBLE-BOOKING — Unique Index Parcial em appointments
-- ─────────────────────────────────────────────────────────────────
-- Impede que dois agendamentos ATIVOS tenham o mesmo professional_id
-- e start_time. Não cobre overlaps parciais, mas impede o caso mais
-- comum de race condition (dois clicks simultâneos no mesmo slot).

CREATE UNIQUE INDEX IF NOT EXISTS idx_no_double_booking
  ON appointments (professional_id, start_time)
  WHERE status NOT IN ('canceled', 'cancelled');


-- ================================================================
-- VERIFICAÇÃO: Listar tabela criada
-- ================================================================
-- Execute separadamente para verificar:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'availabilities'
-- ORDER BY ordinal_position;
