-- Script SQL para criar tabela de tokens do Google Calendar
-- Execute este comando no SQL Editor do Supabase

-- Criar tabela para armazenar tokens do Google
CREATE TABLE IF NOT EXISTS user_google_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  google_email TEXT NOT NULL,
  google_name TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expiry TIMESTAMP WITH TIME ZONE,
  scopes TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Referência para o usuário
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Um usuário pode ter apenas uma conexão Google
  UNIQUE(user_id)
);

-- Criar políticas RLS para tabela user_google_tokens
ALTER TABLE user_google_tokens ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas seus próprios tokens
CREATE POLICY "Users can view own google tokens" ON user_google_tokens
  FOR SELECT USING (auth.uid() = user_id);

-- Sistema pode inserir tokens (usar service role)
CREATE POLICY "System can insert google tokens" ON user_google_tokens
  FOR INSERT WITH CHECK (true);

-- Usuários podem atualizar seus próprios tokens
CREATE POLICY "Users can update own google tokens" ON user_google_tokens
  FOR UPDATE USING (auth.uid() = user_id);

-- Usuários podem deletar seus próprios tokens
CREATE POLICY "Users can delete own google tokens" ON user_google_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- Criar trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_user_google_tokens_updated_at BEFORE UPDATE ON user_google_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Criar índices para melhorar performance
CREATE INDEX idx_user_google_tokens_user_id ON user_google_tokens(user_id);
CREATE INDEX idx_user_google_tokens_google_email ON user_google_tokens(google_email);

-- Verificar se foi criado com sucesso
SELECT 'Tabela user_google_tokens criada com sucesso!' as resultado;