-- Script SQL para adicionar tabela de credenciais de usuário
-- Execute este comando no SQL Editor do Supabase

-- Criar tabela de credenciais de usuários
CREATE TABLE user_credentials (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar políticas RLS para tabela user_credentials
ALTER TABLE user_credentials ENABLE ROW LEVEL SECURITY;

-- Apenas usuários logados podem ver suas próprias credenciais
CREATE POLICY "Users can view own credentials" ON user_credentials
  FOR SELECT USING (auth.uid() = id);

-- Apenas o sistema pode inserir credenciais (usar service role)
CREATE POLICY "System can insert credentials" ON user_credentials
  FOR INSERT WITH CHECK (true);

-- Usuários podem atualizar suas próprias credenciais
CREATE POLICY "Users can update own credentials" ON user_credentials
  FOR UPDATE USING (auth.uid() = id);

-- Criar trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_user_credentials_updated_at BEFORE UPDATE ON user_credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Criar índice para melhorar performance de busca por email
CREATE INDEX idx_user_credentials_email ON user_credentials(email);