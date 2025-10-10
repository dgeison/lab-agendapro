-- Script para corrigir a tabela services existente
-- Execute este comando no SQL Editor do Supabase

-- 1. Primeiro, remover a constraint da foreign key antiga
ALTER TABLE services DROP CONSTRAINT IF EXISTS services_user_id_fkey;

-- 2. Limpar dados órfãos ANTES de adicionar a nova foreign key
DELETE FROM services 
WHERE user_id NOT IN (SELECT id FROM user_profiles);

-- 3. Verificar quantos registros sobraram
SELECT count(*) as registros_restantes FROM services;

-- 4. Agora adicionar nova foreign key para user_profiles
ALTER TABLE services 
ADD CONSTRAINT services_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- 5. Desabilitar RLS se estiver habilitado (pode estar causando problemas)
ALTER TABLE services DISABLE ROW LEVEL SECURITY;

-- 6. Inserir um serviço de teste para o usuário dgeison.peixoto@gmail.com
INSERT INTO services (user_id, name, description, duration_minutes, price)
VALUES (
  '3161c61d-5c93-40f1-b03e-2067ae29d42c',
  'Consulta Teste',
  'Serviço de teste criado automaticamente',
  60,
  100.00
),
(
  '3161c61d-5c93-40f1-b03e-2067ae29d42c',
  'Aula de Inglês',
  'Aula particular de inglês - 1 hora',
  60,
  80.00
)
ON CONFLICT DO NOTHING;

-- 7. Verificar o resultado
SELECT 
    'Tabela services corrigida com sucesso!' as resultado,
    count(*) as total_servicos
FROM services;

-- 8. Mostrar os serviços existentes
SELECT s.*, up.email as user_email, up.full_name 
FROM services s 
JOIN user_profiles up ON s.user_id = up.id;