-- =============================================================
-- AgendaPro — Script Definitivo: Trigger de Signup
-- Execute integralmente no SQL Editor do Supabase
-- =============================================================

-- =============================================================
-- PASSO 0: LIMPEZA DE USUÁRIOS FANTASMAS
-- Descomente e execute MANUALMENTE se precisar limpar
-- usuários que ficaram em auth.users sem perfil em profiles.
-- =============================================================

-- DELETE FROM auth.users
-- WHERE id NOT IN (SELECT id FROM public.profiles);

-- =============================================================
-- PASSO 1: GARANTIR ESTRUTURA DA TABELA profiles
-- Adiciona colunas faltantes sem destruir dados existentes.
-- =============================================================

-- Garante coluna email
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'profiles'
      AND column_name  = 'email'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT;
  END IF;
END $$;

-- Garante coluna asaas_api_key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'profiles'
      AND column_name  = 'asaas_api_key'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN asaas_api_key TEXT;
  END IF;
END $$;

-- =============================================================
-- PASSO 2: REMOVER TRIGGER ANTIGO (se existir)
-- =============================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- =============================================================
-- PASSO 3: CRIAR FUNÇÃO DO TRIGGER
--
-- Geração do slug:
--   parte-antes-do-arroba (sanitizada) + "-" + 5 primeiros chars do UUID
--   Exemplo: email "joao.silva@gmail.com", id "a1b2c3d4-..."
--            → slug = "joao-silva-a1b2c"
--
-- SEM EXCEPTION WHEN OTHERS: se falhar, o signup é revertido
-- integralmente (auth.users + profiles), sem fantasmas.
-- =============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug  TEXT;
  final_slug TEXT;
BEGIN
  -- 1. Extrair parte antes do @ e sanitizar
  base_slug := lower(split_part(NEW.email, '@', 1));
  base_slug := regexp_replace(base_slug, '[^a-z0-9]', '-', 'g');  -- só letras/números
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');          -- colapsar hífens
  base_slug := trim(BOTH '-' FROM base_slug);                      -- remover hífens nas pontas

  IF base_slug = '' THEN
    base_slug := 'user';
  END IF;

  -- 2. Concatenar com prefixo do UUID para unicidade determinística
  final_slug := base_slug || '-' || substr(NEW.id::text, 1, 5);

  -- 3. Inserir perfil (sem try/catch — falha = rollback do signup inteiro)
  INSERT INTO public.profiles (id, full_name, email, public_slug)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email,
    final_slug
  );

  RETURN NEW;
END;
$$;

-- =============================================================
-- PASSO 4: CRIAR TRIGGER
-- =============================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================================
-- PASSO 5: VERIFICAÇÃO
-- =============================================================

SELECT
  'Trigger on_auth_user_created' AS objeto,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'on_auth_user_created'
  ) THEN '✅ OK' ELSE '❌ FALHOU' END AS status

UNION ALL

SELECT
  'Coluna profiles.email',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN '✅ OK' ELSE '❌ FALHOU' END

UNION ALL

SELECT
  'Coluna profiles.asaas_api_key',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'asaas_api_key'
  ) THEN '✅ OK' ELSE '❌ FALHOU' END;
