-- Script SQL para criar tabela de serviços
-- Execute este comando no SQL Editor do Supabase

-- Criar tabela de serviços
CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Referência para o usuário
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

-- Criar políticas RLS para tabela services
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver seus próprios serviços
CREATE POLICY "Users can view own services" ON services
  FOR SELECT USING (auth.uid() = user_id);

-- Usuários podem inserir seus próprios serviços
CREATE POLICY "Users can insert own services" ON services
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar seus próprios serviços
CREATE POLICY "Users can update own services" ON services
  FOR UPDATE USING (auth.uid() = user_id);

-- Usuários podem deletar seus próprios serviços
CREATE POLICY "Users can delete own services" ON services
  FOR DELETE USING (auth.uid() = user_id);

-- Serviços podem ser visualizados por todos (para booking page)
CREATE POLICY "Services viewable by all" ON services
  FOR SELECT USING (true);

-- Criar trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Criar índices para melhorar performance
CREATE INDEX idx_services_user_id ON services(user_id);
CREATE INDEX idx_services_name ON services(name);

-- Verificar se foi criado com sucesso
SELECT 'Tabela services criada com sucesso!' as resultado;