-- Script SQL alternativo para tabela de serviços (sem RLS)
-- Execute este comando no SQL Editor do Supabase se o primeiro não funcionar

-- Deletar tabela existente se houver problemas
DROP TABLE IF EXISTS services CASCADE;

-- Criar tabela de serviços SEM RLS
CREATE TABLE services (
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

-- NÃO habilitar RLS por enquanto para simplificar
-- ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_services_updated_at 
    BEFORE UPDATE ON services
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Criar índices para melhorar performance
CREATE INDEX idx_services_user_id ON services(user_id);
CREATE INDEX idx_services_name ON services(name);

-- Inserir um serviço de teste
INSERT INTO services (user_id, name, description, duration_minutes, price)
VALUES (
  (SELECT id FROM user_profiles WHERE email = 'dgeison.peixoto@gmail.com' LIMIT 1),
  'Consulta Teste',
  'Serviço de teste criado automaticamente',
  60,
  100.00
);

-- Verificar se foi criado com sucesso
SELECT 'Tabela services criada com sucesso!' as resultado;
SELECT * FROM services LIMIT 5;