-- ============================================
-- PASSO 1: LIMPAR TUDO (VERSÃO SEGURA)
-- ============================================
-- Este script ignora erros se as tabelas não existirem
-- ============================================

-- Desativar verificações temporariamente
SET client_min_messages TO WARNING;

-- Apagar triggers (ignora se não existirem)
DO $$ 
BEGIN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
EXCEPTION WHEN OTHERS THEN 
    NULL;
END $$;

DO $$ 
BEGIN
    DROP TRIGGER IF EXISTS generate_crew_invite_code ON crews CASCADE;
EXCEPTION WHEN OTHERS THEN 
    NULL;
END $$;

-- Apagar funções (ignora se não existirem)
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS set_crew_invite_code() CASCADE;
DROP FUNCTION IF EXISTS generate_invite_code() CASCADE;

-- Apagar tabelas (ignora se não existirem)
DROP TABLE IF EXISTS market_items CASCADE;
DROP TABLE IF EXISTS direct_messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS boards CASCADE;
DROP TABLE IF EXISTS signals CASCADE;
DROP TABLE IF EXISTS crew_invites CASCADE;
DROP TABLE IF EXISTS crew_members CASCADE;
DROP TABLE IF EXISTS crews CASCADE;
DROP TABLE IF EXISTS spots CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Reativar mensagens
SET client_min_messages TO NOTICE;

-- ============================================
-- ✅ PRONTO! Agora executa o PASSO 2
-- ============================================
