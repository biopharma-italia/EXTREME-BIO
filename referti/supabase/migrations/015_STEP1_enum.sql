-- ============================================================================
-- STEP 1 di 3 — Eseguire QUESTO DA SOLO nel SQL Editor
-- ============================================================================
-- IMPORTANTE: Esegui SOLO questo, poi passa allo STEP 2
-- ============================================================================

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'biologa_laboratorio';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'tecnico_laboratorio';

-- Verifica che i nuovi valori esistano:
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role') 
ORDER BY enumsortorder;
