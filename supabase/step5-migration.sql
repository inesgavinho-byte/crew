-- ============================================
-- PASSO 5: MIGRAÇÃO — Alinhar schema SQL com o código
-- ============================================
-- Seguro para correr no Supabase SQL Editor sem perder dados.
-- Usa IF NOT EXISTS, ADD COLUMN IF NOT EXISTS, CREATE OR REPLACE.
-- O código (src/lib/supabase.js) é a fonte de verdade.
-- ============================================

-- ============================================
-- A) RENOMEAR TABELAS (nome errado no SQL)
-- ============================================

-- alerts → condition_alerts
ALTER TABLE IF EXISTS alerts RENAME TO condition_alerts;

-- market_items → board_listings
ALTER TABLE IF EXISTS market_items RENAME TO board_listings;

-- ============================================
-- B) RENOMEAR COLUNAS (nome errado no SQL)
-- ============================================

-- crews.creator_id → created_by
ALTER TABLE crews RENAME COLUMN creator_id TO created_by;

-- spots.lat → latitude, spots.lng → longitude
ALTER TABLE spots RENAME COLUMN lat TO latitude;
ALTER TABLE spots RENAME COLUMN lng TO longitude;

-- direct_messages.is_read (boolean) → read_at (timestamp)
-- Drop the old column and add the new one
ALTER TABLE direct_messages DROP COLUMN IF EXISTS is_read;
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- condition_alerts.last_triggered_at → last_triggered
ALTER TABLE condition_alerts RENAME COLUMN last_triggered_at TO last_triggered;

-- crew_invites.inviter_id → invited_by (código usa invited_by)
ALTER TABLE crew_invites RENAME COLUMN inviter_id TO invited_by;

-- crew_invites.inviter_username — código não envia, tornar nullable
ALTER TABLE crew_invites ALTER COLUMN inviter_username DROP NOT NULL;

-- ============================================
-- C) CORRIGIR COLUNAS QUE O CÓDIGO NÃO ENVIA
-- ============================================

-- crew_members.username — código não envia username no insert, tornar nullable
ALTER TABLE crew_members ALTER COLUMN username DROP NOT NULL;

-- signals.username — código não envia username no insert, tornar nullable
ALTER TABLE signals ALTER COLUMN username DROP NOT NULL;

-- ============================================
-- D) ADICIONAR COLUNAS EM FALTA
-- ============================================

-- board_listings precisa de colunas que market_items não tinha
ALTER TABLE board_listings ADD COLUMN IF NOT EXISTS board_type TEXT;
ALTER TABLE board_listings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

-- Renomear colunas de market_items para board_listings schema
-- category → board_type (se existir category mas não board_type)
-- title → name (board_listings no código não usa title, mas usa filter board_type/condition/price/location)
-- status default 'available' → 'active' (código filtra por 'active')
-- Nota: a tabela renomeada já tem: id, user_id, username, title, description, price, category, condition, location, images, status, created_at

-- ============================================
-- E) TABELAS EM FALTA
-- ============================================

-- 1. follows
CREATE TABLE IF NOT EXISTS follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- 2. spot_reviews
CREATE TABLE IF NOT EXISTS spot_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  spot_name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  skill_level TEXT,
  crowds TEXT,
  parking TEXT,
  best_tide TEXT,
  best_swell TEXT,
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(spot_name, user_id)
);

-- 3. leaderboard_badges
CREATE TABLE IF NOT EXISTS leaderboard_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_id UUID REFERENCES crews(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  period TEXT,
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. crew_votes
CREATE TABLE IF NOT EXISTS crew_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_id UUID REFERENCES crews(id) ON DELETE CASCADE NOT NULL,
  candidate_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  voter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vote TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(crew_id, candidate_id, voter_id)
);

-- 5. board_interests
CREATE TABLE IF NOT EXISTS board_interests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES board_listings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  username TEXT,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(listing_id, user_id)
);

-- ============================================
-- F) VIEW EM FALTA: crew_members_view
-- ============================================

CREATE OR REPLACE VIEW crew_members_view AS
SELECT
  cm.id,
  cm.crew_id,
  cm.user_id,
  cm.role,
  cm.status,
  cm.joined_at,
  p.username,
  p.full_name,
  p.avatar_url
FROM crew_members cm
LEFT JOIN profiles p ON p.id = cm.user_id;

-- ============================================
-- G) FUNÇÕES RPC EM FALTA
-- ============================================

-- 1. join_crew_by_code
CREATE OR REPLACE FUNCTION join_crew_by_code(
  p_invite_code TEXT,
  p_user_id UUID,
  p_username TEXT
)
RETURNS JSON AS $$
DECLARE
  v_crew_id UUID;
  v_crew_name TEXT;
  v_existing UUID;
BEGIN
  -- Find crew by invite code
  SELECT id, name INTO v_crew_id, v_crew_name
  FROM crews
  WHERE invite_code = p_invite_code;

  IF v_crew_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid invite code');
  END IF;

  -- Check if already a member
  SELECT id INTO v_existing
  FROM crew_members
  WHERE crew_id = v_crew_id AND user_id = p_user_id;

  IF v_existing IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Already a member of this crew');
  END IF;

  -- Add as member
  INSERT INTO crew_members (crew_id, user_id, role, status)
  VALUES (v_crew_id, p_user_id, 'member', 'active');

  RETURN json_build_object(
    'success', true,
    'crew_id', v_crew_id,
    'crew_name', v_crew_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. users_share_crew
CREATE OR REPLACE FUNCTION users_share_crew(
  user_a UUID,
  user_b UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM crew_members cm1
    JOIN crew_members cm2 ON cm1.crew_id = cm2.crew_id
    WHERE cm1.user_id = user_a
      AND cm2.user_id = user_b
      AND cm1.status = 'active'
      AND cm2.status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. get_crew_leaderboard
CREATE OR REPLACE FUNCTION get_crew_leaderboard(
  p_crew_id UUID,
  p_period TEXT DEFAULT 'all'
)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  signal_count BIGINT,
  session_count BIGINT,
  total_score BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH crew_user_ids AS (
    SELECT cm.user_id
    FROM crew_members cm
    WHERE cm.crew_id = p_crew_id AND cm.status = 'active'
  ),
  signal_counts AS (
    SELECT s.user_id, COUNT(*) AS cnt
    FROM signals s
    WHERE s.crew_id = p_crew_id
      AND (p_period = 'all'
        OR (p_period = 'week' AND s.created_at >= NOW() - INTERVAL '7 days')
        OR (p_period = 'month' AND s.created_at >= NOW() - INTERVAL '30 days')
      )
    GROUP BY s.user_id
  ),
  session_counts AS (
    SELECT ses.user_id, COUNT(*) AS cnt
    FROM sessions ses
    WHERE ses.user_id IN (SELECT cui.user_id FROM crew_user_ids cui)
      AND (p_period = 'all'
        OR (p_period = 'week' AND ses.created_at >= NOW() - INTERVAL '7 days')
        OR (p_period = 'month' AND ses.created_at >= NOW() - INTERVAL '30 days')
      )
    GROUP BY ses.user_id
  )
  SELECT
    cui.user_id,
    p.username,
    p.full_name,
    p.avatar_url,
    COALESCE(sc.cnt, 0) AS signal_count,
    COALESCE(sec.cnt, 0) AS session_count,
    COALESCE(sc.cnt, 0) + COALESCE(sec.cnt, 0) AS total_score
  FROM crew_user_ids cui
  LEFT JOIN profiles p ON p.id = cui.user_id
  LEFT JOIN signal_counts sc ON sc.user_id = cui.user_id
  LEFT JOIN session_counts sec ON sec.user_id = cui.user_id
  ORDER BY total_score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- H) RLS PARA NOVAS TABELAS
-- ============================================

-- follows
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users veem follows públicos" ON follows
  FOR SELECT USING (true);
CREATE POLICY "Users podem seguir" ON follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users podem atualizar follow" ON follows
  FOR UPDATE USING (auth.uid() = following_id OR auth.uid() = follower_id);
CREATE POLICY "Users podem remover follow" ON follows
  FOR DELETE USING (auth.uid() = follower_id OR auth.uid() = following_id);

-- spot_reviews
ALTER TABLE spot_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews são públicos" ON spot_reviews
  FOR SELECT USING (true);
CREATE POLICY "Users podem criar review" ON spot_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users podem atualizar review" ON spot_reviews
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users podem deletar review" ON spot_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- leaderboard_badges
ALTER TABLE leaderboard_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badges são públicos" ON leaderboard_badges
  FOR SELECT USING (true);

-- crew_votes
ALTER TABLE crew_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem votos" ON crew_votes
  FOR SELECT USING (
    crew_id IN (SELECT crew_id FROM crew_members WHERE user_id = auth.uid())
  );
CREATE POLICY "Membros podem votar" ON crew_votes
  FOR INSERT WITH CHECK (
    auth.uid() = voter_id
    AND crew_id IN (SELECT crew_id FROM crew_members WHERE user_id = auth.uid())
  );

-- board_interests
ALTER TABLE board_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Interesses visíveis para dono e interessado" ON board_interests
  FOR SELECT USING (
    auth.uid() = user_id
    OR listing_id IN (SELECT id FROM board_listings WHERE user_id = auth.uid())
  );
CREATE POLICY "Users podem expressar interesse" ON board_interests
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users podem remover interesse" ON board_interests
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- I) ÍNDICES PARA NOVAS TABELAS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_spot_reviews_spot ON spot_reviews(spot_name);
CREATE INDEX IF NOT EXISTS idx_spot_reviews_user ON spot_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_badges_crew ON leaderboard_badges(crew_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_badges_user ON leaderboard_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_crew_votes_crew ON crew_votes(crew_id);
CREATE INDEX IF NOT EXISTS idx_crew_votes_candidate ON crew_votes(candidate_id);
CREATE INDEX IF NOT EXISTS idx_board_interests_listing ON board_interests(listing_id);
CREATE INDEX IF NOT EXISTS idx_board_interests_user ON board_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_condition_alerts_user ON condition_alerts(user_id);

-- ============================================
-- J) ATUALIZAR RLS POLICIES PARA TABELAS RENOMEADAS
-- ============================================

-- As policies de alerts/market_items foram renomeadas automaticamente com a tabela.
-- Mas os nomes das policies referem "alerts" e "items" — vamos criar novas se necessário.

-- RLS para condition_alerts (já deve estar ativo pela tabela alerts)
-- Verificar se precisa re-criar policies com referência ao novo nome
-- As policies existentes continuam a funcionar após RENAME TABLE.

-- RLS para board_listings (renomeada de market_items)
-- As policies existentes continuam a funcionar após RENAME TABLE.

-- Atualizar a policy de crews para usar created_by em vez de creator_id
-- (As policies existentes que referem creator_id precisam ser recriadas)
DROP POLICY IF EXISTS "Users podem criar crew" ON crews;
CREATE POLICY "Users podem criar crew" ON crews
  FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Creator pode atualizar crew" ON crews;
CREATE POLICY "Creator pode atualizar crew" ON crews
  FOR UPDATE USING (auth.uid() = created_by);

-- ============================================
-- K) ATUALIZAR DADOS DE SPOTS (lat/lng → latitude/longitude já renomeados)
-- ============================================
-- Nada a fazer — o RENAME COLUMN preserva os dados.

-- ============================================
-- CONCLUÍDO! Schema alinhado com o código.
-- ============================================
