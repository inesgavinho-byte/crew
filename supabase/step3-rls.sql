-- ============================================
-- PASSO 3: ROW LEVEL SECURITY (RLS)
-- ============================================
-- Execute depois do PASSO 2
-- ============================================

-- Ativar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE crews ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_items ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Profiles são públicos" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users podem atualizar próprio perfil" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users podem inserir próprio perfil" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- SPOTS
CREATE POLICY "Spots são públicos" ON spots FOR SELECT USING (true);

-- CREWS
CREATE POLICY "Crews visíveis para membros ou públicos" ON crews 
  FOR SELECT USING (
    is_public = true 
    OR id IN (SELECT crew_id FROM crew_members WHERE user_id = auth.uid())
  );
CREATE POLICY "Users podem criar crew" ON crews FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creator pode atualizar crew" ON crews FOR UPDATE USING (auth.uid() = creator_id);

-- CREW MEMBERS
CREATE POLICY "Membros veem outros membros" ON crew_members
  FOR SELECT USING (
    crew_id IN (SELECT crew_id FROM crew_members WHERE user_id = auth.uid())
  );
CREATE POLICY "Users podem juntar-se" ON crew_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users podem atualizar membership" ON crew_members FOR UPDATE USING (auth.uid() = user_id);

-- CREW INVITES
CREATE POLICY "Users veem próprios invites" ON crew_invites FOR SELECT USING (auth.uid() = invited_user_id);
CREATE POLICY "Membros podem convidar" ON crew_invites
  FOR INSERT WITH CHECK (crew_id IN (SELECT crew_id FROM crew_members WHERE user_id = auth.uid()));
CREATE POLICY "Users podem atualizar invites" ON crew_invites FOR UPDATE USING (auth.uid() = invited_user_id);

-- SIGNALS
CREATE POLICY "Membros veem signals" ON signals
  FOR SELECT USING (crew_id IN (SELECT crew_id FROM crew_members WHERE user_id = auth.uid()));
CREATE POLICY "Membros podem criar signals" ON signals
  FOR INSERT WITH CHECK (crew_id IN (SELECT crew_id FROM crew_members WHERE user_id = auth.uid()));

-- BOARDS
CREATE POLICY "Users veem boards" ON boards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users podem criar boards" ON boards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users podem atualizar boards" ON boards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users podem deletar boards" ON boards FOR DELETE USING (auth.uid() = user_id);

-- SESSIONS
CREATE POLICY "Users veem sessions" ON sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users podem criar sessions" ON sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users podem atualizar sessions" ON sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users podem deletar sessions" ON sessions FOR DELETE USING (auth.uid() = user_id);

-- ALERTS
CREATE POLICY "Users veem alerts" ON alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users podem criar alerts" ON alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users podem atualizar alerts" ON alerts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users podem deletar alerts" ON alerts FOR DELETE USING (auth.uid() = user_id);

-- CHAT MESSAGES
CREATE POLICY "Membros veem mensagens" ON chat_messages
  FOR SELECT USING (crew_id IN (SELECT crew_id FROM crew_members WHERE user_id = auth.uid()));
CREATE POLICY "Membros podem enviar" ON chat_messages
  FOR INSERT WITH CHECK (crew_id IN (SELECT crew_id FROM crew_members WHERE user_id = auth.uid()));
CREATE POLICY "Permitir updates para polls" ON chat_messages FOR UPDATE USING (true);

-- CONVERSATIONS
CREATE POLICY "Users veem conversas" ON conversations
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Users podem criar conversas" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- DIRECT MESSAGES
CREATE POLICY "Users veem mensagens" ON direct_messages
  FOR SELECT USING (
    conversation_id IN (SELECT id FROM conversations WHERE user1_id = auth.uid() OR user2_id = auth.uid())
  );
CREATE POLICY "Users podem enviar" ON direct_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users podem marcar lida" ON direct_messages
  FOR UPDATE USING (
    conversation_id IN (SELECT id FROM conversations WHERE user1_id = auth.uid() OR user2_id = auth.uid())
  );

-- MARKET ITEMS
CREATE POLICY "Items públicos" ON market_items FOR SELECT USING (true);
CREATE POLICY "Users podem criar items" ON market_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users podem atualizar items" ON market_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users podem deletar items" ON market_items FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- Se vires "Success" continua para o PASSO 4
-- ============================================
