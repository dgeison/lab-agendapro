-- =============================================================
-- AgendaPro - Script Completo de Setup do Banco de Dados
-- Execute integralmente no SQL Editor do Supabase
-- Última atualização: Fevereiro 2026
-- =============================================================

-- -------------------------------------------------------------
-- 1. TABELA: profiles
--    Dados públicos dos profissionais, ligada ao auth.users
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name   TEXT,
  avatar_url  TEXT,
  public_slug TEXT UNIQUE NOT NULL,
  bio         TEXT,
  phone       TEXT,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 2. TABELA: services
--    Serviços oferecidos pelos profissionais
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS services (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name             TEXT NOT NULL,
  description      TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  price            NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 3. TABELA: appointments
--    Agendamentos dos clientes
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS appointments (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id              UUID REFERENCES services(id) ON DELETE CASCADE NOT NULL,
  client_name             TEXT NOT NULL,
  client_email            TEXT NOT NULL,
  client_phone            TEXT,
  start_time              TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time                TIMESTAMP WITH TIME ZONE NOT NULL,
  status                  TEXT NOT NULL DEFAULT 'pending_payment'
                            CHECK (status IN ('pending_payment', 'confirmed', 'cancelled', 'completed')),
  stripe_payment_intent_id TEXT,
  google_calendar_event_id TEXT,
  notes                   TEXT,
  created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 4. TABELA: user_google_tokens
--    Tokens OAuth2 do Google Calendar por usuário
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_google_tokens (
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  google_email  TEXT NOT NULL,
  google_name   TEXT,
  access_token  TEXT NOT NULL,
  refresh_token TEXT,
  token_expiry  TIMESTAMP WITH TIME ZONE,
  scopes        TEXT NOT NULL,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================
-- FUNÇÃO: atualizar updated_at automaticamente
-- =============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- TRIGGERS: updated_at
-- =============================================================
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_google_tokens_updated_at
  BEFORE UPDATE ON user_google_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================
-- ÍNDICES: performance
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_public_slug       ON profiles(public_slug);
CREATE INDEX IF NOT EXISTS idx_services_user_id           ON services(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_service_id    ON appointments(service_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time    ON appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status        ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_google_tokens_user_id      ON user_google_tokens(user_id);

-- =============================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================

-- profiles --
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer um pode ver perfis públicos" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Usuários podem inserir o próprio perfil" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar o próprio perfil" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- services --
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer um pode ver serviços" ON services
  FOR SELECT USING (true);

CREATE POLICY "Profissional gerencia os próprios serviços" ON services
  FOR ALL USING (auth.uid() = user_id);

-- appointments --
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clientes podem criar agendamentos" ON appointments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Dono do serviço vê seus agendamentos" ON appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM services
      WHERE services.id = appointments.service_id
        AND services.user_id = auth.uid()
    )
  );

CREATE POLICY "Dono do serviço atualiza agendamentos" ON appointments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM services
      WHERE services.id = appointments.service_id
        AND services.user_id = auth.uid()
    )
  );

-- user_google_tokens --
ALTER TABLE user_google_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários gerenciam os próprios tokens Google" ON user_google_tokens
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================
-- VERIFICAÇÃO FINAL
-- =============================================================
SELECT
  table_name,
  'OK' AS status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'services', 'appointments', 'user_google_tokens')
ORDER BY table_name;
