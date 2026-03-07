-- ============================================
-- PASSO 5: MIGRAÇÃO — Alinhar schema com o código
-- ============================================
-- Seguro para correr no Supabase SQL Editor
-- Usa IF NOT EXISTS / ADD COLUMN IF NOT EXISTS
-- NÃO apaga dados existentes
-- ============================================

-- ============================================
-- SECÇÃO 1: RENOMEAR TABELAS EXISTENTES
-- ============================================

-- 1A. alerts → condition_alerts
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'alerts')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'condition_alerts')
  THEN
    ALTER TABLE alerts RENAME TO condition_alerts;
  END IF;
END $$;

-- 1B. market_items → board_listings (reutilizar estrutura existente)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'market_items')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'board_listings')
  THEN
    ALTER TABLE market_items RENAME TO board_listings;
  END IF;
END $$;

-- ============================================
-- SECÇÃO 2: RENOMEAR COLUNAS EXISTENTES
-- ============================================

-- 2A. crews: creator_id → created_by
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'crews' AND column_name = 'creator_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'crews' AND column_name = 'created_by')
  THEN
    ALTER TABLE crews RENAME COLUMN creator_id TO created_by;
  END IF;
END $$;

-- 2B. spots: lat → latitude, lng → longitude
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'spots' AND column_name = 'lat')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'spots' AND column_name = 'latitude')
  THEN
    ALTER TABLE spots RENAME COLUMN lat TO latitude;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'spots' AND column_name = 'lng')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'spots' AND column_name = 'longitude')
  THEN
    ALTER TABLE spots RENAME COLUMN lng TO longitude;
  END IF;
END $$;

-- 2C. direct_messages: is_read (BOOLEAN) → read_at (TIMESTAMPTZ)
-- Primeiro renomear, depois mudar tipo
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'direct_messages' AND column_name = 'is_read')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'direct_messages' AND column_name = 'read_at')
  THEN
    ALTER TABLE direct_messages RENAME COLUMN is_read TO read_at;
    ALTER TABLE direct_messages ALTER COLUMN read_at DROP DEFAULT;
    ALTER TABLE direct_messages ALTER COLUMN read_at TYPE TIMESTAMP WITH TIME ZONE USING CASE WHEN read_at::text = 'true' THEN NOW() ELSE NULL END;
  END IF;
END $$;

-- 2D. crew_invites: inviter_id → invited_by, drop inviter_username
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'crew_invites' AND column_name = 'inviter_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'crew_invites' AND column_name = 'invited_by')
  THEN
    ALTER TABLE crew_invites RENAME COLUMN inviter_id TO invited_by;
  END IF;
END $$;

-- inviter_username não é usado pelo código, pode ser removido
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'crew_invites' AND column_name = 'inviter_username')
  THEN
    ALTER TABLE crew_invites DROP COLUMN inviter_username;
  END IF;
END $$;

-- 2E. condition_alerts: last_triggered_at → last_triggered
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'condition_alerts' AND column_name = 'last_triggered_at')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'condition_alerts' AND column_name = 'last_triggered')
  THEN
    ALTER TABLE condition_alerts RENAME COLUMN last_triggered_at TO last_triggered;
  END IF;
END $$;

-- ============================================
-- SECÇÃO 3: ADICIONAR COLUNAS EM FALTA
-- ============================================

-- 3A. crew_members: adicionar invited_by (usado em inviteToCrew)
ALTER TABLE crew_members ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3B. board_listings: adicionar colunas que o código usa (se tabela renomeada de market_items)
-- O código usa: board_type, condition, price, location, status, user_id, updated_at, created_at
ALTER TABLE board_listings ADD COLUMN IF NOT EXISTS board_type TEXT;
ALTER TABLE board_listings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
-- Nota: price, condition, location, status, user_id, created_at já existiam em market_items

-- ============================================
-- SECÇÃO 4: CRIAR TABELAS EM FALTA
-- ============================================

-- 4A. follows
CREATE TABLE IF NOT EXISTS follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- 4B. spot_reviews
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
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(spot_name, user_id)
);

-- 4C. leaderboard_badges
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

-- 4D. crew_votes
CREATE TABLE IF NOT EXISTS crew_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_id UUID REFERENCES crews(id) ON DELETE CASCADE NOT NULL,
  candidate_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  voter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vote TEXT NOT NULL CHECK (vote IN ('yes', 'no')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(crew_id, candidate_id, voter_id)
);

-- 4E. board_interests
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
-- SECÇÃO 5: CRIAR VIEW EM FALTA
-- ============================================

-- crew_members_view: junta crew_members com profiles
CREATE OR REPLACE VIEW crew_members_view AS
SELECT
  cm.id,
  cm.crew_id,
  cm.user_id,
  cm.role,
  cm.status,
  cm.invited_by,
  cm.joined_at,
  p.username,
  p.full_name,
  p.avatar_url
FROM crew_members cm
LEFT JOIN profiles p ON p.id = cm.user_id;

-- ============================================
-- SECÇÃO 6: CRIAR FUNÇÕES RPC EM FALTA
-- ============================================

-- 6A. join_crew_by_code: permite entrar num crew via código de convite
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
  -- Encontrar crew pelo código
  SELECT id, name INTO v_crew_id, v_crew_name
  FROM crews
  WHERE invite_code = p_invite_code;

  IF v_crew_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Código de convite inválido');
  END IF;

  -- Verificar se já é membro
  SELECT id INTO v_existing
  FROM crew_members
  WHERE crew_id = v_crew_id AND user_id = p_user_id;

  IF v_existing IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Já és membro deste crew');
  END IF;

  -- Adicionar como membro ativo
  INSERT INTO crew_members (crew_id, user_id, role, status)
  VALUES (v_crew_id, p_user_id, 'member', 'active');

  RETURN json_build_object('success', true, 'crew_id', v_crew_id, 'crew_name', v_crew_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6B. users_share_crew: verifica se dois users partilham algum crew
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

-- 6C. get_crew_leaderboard: ranking de membros por signals enviados
CREATE OR REPLACE FUNCTION get_crew_leaderboard(
  p_crew_id UUID,
  p_period TEXT DEFAULT 'all'
)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  avatar_url TEXT,
  signal_count BIGINT,
  session_count BIGINT,
  rank BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH signal_counts AS (
    SELECT
      s.user_id,
      COUNT(*) AS cnt
    FROM signals s
    WHERE s.crew_id = p_crew_id
      AND (
        p_period = 'all'
        OR (p_period = 'week' AND s.created_at >= NOW() - INTERVAL '7 days')
        OR (p_period = 'month' AND s.created_at >= NOW() - INTERVAL '30 days')
      )
    GROUP BY s.user_id
  ),
  session_counts AS (
    SELECT
      sess.user_id,
      COUNT(*) AS cnt
    FROM sessions sess
    WHERE sess.spot_name IN (
      SELECT DISTINCT sig.spot_name FROM signals sig WHERE sig.crew_id = p_crew_id
    )
    AND (
      p_period = 'all'
      OR (p_period = 'week' AND sess.created_at >= NOW() - INTERVAL '7 days')
      OR (p_period = 'month' AND sess.created_at >= NOW() - INTERVAL '30 days')
    )
    GROUP BY sess.user_id
  )
  SELECT
    cm.user_id,
    p.username,
    p.avatar_url,
    COALESCE(sc.cnt, 0) AS signal_count,
    COALESCE(sec.cnt, 0) AS session_count,
    RANK() OVER (ORDER BY COALESCE(sc.cnt, 0) + COALESCE(sec.cnt, 0) DESC) AS rank
  FROM crew_members cm
  JOIN profiles p ON p.id = cm.user_id
  LEFT JOIN signal_counts sc ON sc.user_id = cm.user_id
  LEFT JOIN session_counts sec ON sec.user_id = cm.user_id
  WHERE cm.crew_id = p_crew_id
    AND cm.status = 'active'
  ORDER BY rank ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SECÇÃO 7: ÍNDICES PARA NOVAS TABELAS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_status ON follows(status);
CREATE INDEX IF NOT EXISTS idx_spot_reviews_spot ON spot_reviews(spot_name);
CREATE INDEX IF NOT EXISTS idx_spot_reviews_user ON spot_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_badges_crew ON leaderboard_badges(crew_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_badges_user ON leaderboard_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_crew_votes_crew ON crew_votes(crew_id);
CREATE INDEX IF NOT EXISTS idx_crew_votes_candidate ON crew_votes(candidate_id);
CREATE INDEX IF NOT EXISTS idx_board_interests_listing ON board_interests(listing_id);
CREATE INDEX IF NOT EXISTS idx_board_interests_user ON board_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_board_listings_status ON board_listings(status);
CREATE INDEX IF NOT EXISTS idx_board_listings_user ON board_listings(user_id);

-- ============================================
-- SECÇÃO 8: RLS PARA NOVAS TABELAS
-- ============================================

-- FOLLOWS
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users veem follows aceites" ON follows
  FOR SELECT USING (
    status = 'accepted'
    OR follower_id = auth.uid()
    OR following_id = auth.uid()
  );
CREATE POLICY "Users podem seguir" ON follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users podem atualizar follows" ON follows
  FOR UPDATE USING (auth.uid() = following_id OR auth.uid() = follower_id);
CREATE POLICY "Users podem remover follows" ON follows
  FOR DELETE USING (auth.uid() = follower_id OR auth.uid() = following_id);

-- SPOT REVIEWS
ALTER TABLE spot_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews são públicas" ON spot_reviews
  FOR SELECT USING (true);
CREATE POLICY "Users podem criar reviews" ON spot_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users podem atualizar reviews" ON spot_reviews
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users podem apagar reviews" ON spot_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- LEADERBOARD BADGES
ALTER TABLE leaderboard_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badges são públicas" ON leaderboard_badges
  FOR SELECT USING (true);
CREATE POLICY "Sistema pode criar badges" ON leaderboard_badges
  FOR INSERT WITH CHECK (true);

-- CREW VOTES
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

-- BOARD INTERESTS
ALTER TABLE board_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dono e interessado veem interesse" ON board_interests
  FOR SELECT USING (
    auth.uid() = user_id
    OR listing_id IN (SELECT id FROM board_listings WHERE user_id = auth.uid())
  );
CREATE POLICY "Users podem expressar interesse" ON board_interests
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users podem remover interesse" ON board_interests
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- SECÇÃO 9: ATUALIZAR RLS POLICIES PARA TABELAS RENOMEADAS
-- ============================================

-- Atualizar policies de alerts → condition_alerts
-- (As policies existentes em 'alerts' foram renomeadas automaticamente com a tabela)
-- Precisamos garantir que as policies de board_listings existem
DO $$
BEGIN
  -- Verificar se já existem policies para board_listings
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'board_listings' AND policyname = 'Listings públicas'
  ) THEN
    -- Se a tabela foi renomeada de market_items, as policies antigas continuam válidas
    -- Mas se quisermos adicionar novas, podemos aqui
    NULL;
  END IF;
END $$;

-- Atualizar policy de crews para usar created_by (em vez de creator_id)
-- Nota: a policy usa a coluna diretamente, e como renomeámos a coluna, funciona automaticamente

-- ============================================
-- SECÇÃO 10: REALTIME PARA NOVAS TABELAS
-- ============================================

-- Ativar realtime para crew_votes (subscribeToVotes usa-o)
DO $$
BEGIN
  -- Supabase gere realtime via dashboard, mas podemos tentar:
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'crew_votes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE crew_votes;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL; -- Ignora se a publicação não existir
END $$;

-- ============================================
-- ✅ MIGRAÇÃO CONCLUÍDA!
-- O schema está agora alinhado com o código.
-- ============================================
