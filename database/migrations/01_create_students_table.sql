-- =============================================================
-- Migration: Create Students Table
-- Execute no SQL Editor do Supabase
-- =============================================================

CREATE TABLE IF NOT EXISTS students (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name   TEXT NOT NULL,
  email       TEXT,
  phone       TEXT,
  notes       TEXT,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para updated_at (assumindo que a função update_updated_at_column já existe)
DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Índices
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_email   ON students(email);

-- RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Política única: O profissional (dono) pode fazer tudo (CRUD) nos seus próprios alunos
DROP POLICY IF EXISTS "Profissional gerencia seus alunos" ON students;
CREATE POLICY "Profissional gerencia seus alunos" ON students
  FOR ALL USING (auth.uid() = user_id);
