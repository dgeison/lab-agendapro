-- ================================================================
-- Migração: Adicionar colunas faltantes à tabela appointments
-- 
-- Contexto: A tabela foi criada originalmente com um schema mais
-- simples. O backend precisa de professional_id, student_id, e
-- google_event_id. Também precisamos ajustar o CHECK constraint
-- de status para os valores que o backend usa.
-- ================================================================

-- 1. Adicionar coluna professional_id (referência ao user do Supabase)
ALTER TABLE appointments 
  ADD COLUMN IF NOT EXISTS professional_id UUID REFERENCES auth.users(id);

-- 2. Adicionar coluna student_id (referência à tabela students)
ALTER TABLE appointments 
  ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES students(id);

-- 3. Adicionar coluna google_event_id (para integração Google Calendar)
ALTER TABLE appointments 
  ADD COLUMN IF NOT EXISTS google_event_id TEXT;

-- 4. Tornar client_name e client_email opcionais (podem vir do student)
ALTER TABLE appointments 
  ALTER COLUMN client_name DROP NOT NULL;

ALTER TABLE appointments 
  ALTER COLUMN client_email DROP NOT NULL;

-- 5. Ajustar CHECK constraint de status para os valores do backend
--    Antigo: ('pending_payment', 'confirmed', 'cancelled', 'completed')
--    Novo:   ('pending', 'pending_payment', 'confirmed', 'canceled', 'cancelled', 'completed')
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE appointments ADD CONSTRAINT appointments_status_check 
  CHECK (status IN ('pending', 'pending_payment', 'confirmed', 'canceled', 'cancelled', 'completed'));

-- 6. Índice para queries por professional_id (muito usado nas listagens)
CREATE INDEX IF NOT EXISTS idx_appointments_professional_id ON appointments(professional_id);

-- 7. Índice para queries por student_id
CREATE INDEX IF NOT EXISTS idx_appointments_student_id ON appointments(student_id);

-- 8. RLS: permitir que o profissional veja seus próprios agendamentos
--    (complementa as policies existentes baseadas em service_id)
DO $$
BEGIN
  -- Drop política antiga se existir (para evitar conflito)
  DROP POLICY IF EXISTS "Professional can view own appointments" ON appointments;
  DROP POLICY IF EXISTS "Professional can update own appointments" ON appointments;
  DROP POLICY IF EXISTS "Anyone can insert appointments" ON appointments;
  
  -- Profissional pode ver seus agendamentos
  CREATE POLICY "Professional can view own appointments" ON appointments
    FOR SELECT USING (
      professional_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM services 
        WHERE services.id = appointments.service_id 
        AND services.user_id = auth.uid()
      )
    );
  
  -- Profissional pode atualizar seus agendamentos
  CREATE POLICY "Professional can update own appointments" ON appointments
    FOR UPDATE USING (
      professional_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM services 
        WHERE services.id = appointments.service_id 
        AND services.user_id = auth.uid()
      )
    );
  
  -- Qualquer pessoa pode criar agendamento (rota pública usa service_role)
  CREATE POLICY "Anyone can insert appointments" ON appointments
    FOR INSERT WITH CHECK (true);
END $$;

-- ================================================================
-- VERIFICAÇÃO: Listar colunas da tabela após migração
-- ================================================================
-- Execute separadamente para verificar:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'appointments' 
-- ORDER BY ordinal_position;
