-- Script SQL para criar tabela de perfis de usuário independente
-- Execute este comando no SQL Editor do Supabase

-- Criar tabela de perfis de usuários (independente da tabela users do Auth)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  public_slug TEXT UNIQUE NOT NULL,
  bio TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Referência para as credenciais
  FOREIGN KEY (id) REFERENCES user_credentials(id) ON DELETE CASCADE
);

-- Criar políticas RLS para tabela user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver seus próprios perfis
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Sistema pode inserir perfis (usar service role)
CREATE POLICY "System can insert profiles" ON user_profiles
  FOR INSERT WITH CHECK (true);

-- Usuários podem atualizar seus próprios perfis
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Perfis públicos podem ser visualizados por todos (para booking page)
CREATE POLICY "Public profiles viewable by all" ON user_profiles
  FOR SELECT USING (true);

-- Criar trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Criar índices para melhorar performance
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_public_slug ON user_profiles(public_slug);