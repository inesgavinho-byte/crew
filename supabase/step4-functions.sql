-- ============================================
-- PASSO 4: FUNÇÕES, TRIGGERS E DADOS
-- ============================================
-- Execute depois do PASSO 3
-- ============================================

-- FUNÇÃO: Gerar código de convite
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- FUNÇÃO: Definir código de convite no crew
CREATE OR REPLACE FUNCTION set_crew_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invite_code IS NULL THEN
    NEW.invite_code := generate_invite_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGER: Gerar código ao criar crew
CREATE TRIGGER generate_crew_invite_code
  BEFORE INSERT ON crews
  FOR EACH ROW EXECUTE FUNCTION set_crew_invite_code();

-- FUNÇÃO: Criar perfil automaticamente
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TRIGGER: Criar perfil ao registar
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- INSERIR SPOTS INICIAIS
INSERT INTO spots (name, lat, lng, type, difficulty) VALUES
  ('Coxos', 38.9833, -9.4167, 'reef', 'advanced'),
  ('Ribeira d''Ilhas', 38.9875, -9.4208, 'beach', 'intermediate'),
  ('Foz do Lizandro', 38.9417, -9.4167, 'beach', 'beginner'),
  ('São Lourenço', 38.9583, -9.4167, 'beach', 'intermediate'),
  ('Praia Grande', 38.8167, -9.4833, 'beach', 'intermediate'),
  ('Guincho', 38.7333, -9.4833, 'beach', 'intermediate'),
  ('Costa da Caparica', 38.6333, -9.2333, 'beach', 'beginner'),
  ('Carcavelos', 38.6833, -9.3333, 'beach', 'beginner'),
  ('Supertubos', 39.35, -9.3667, 'beach', 'advanced'),
  ('Baleal', 39.3833, -9.35, 'beach', 'intermediate'),
  ('Peniche', 39.3667, -9.3833, 'beach', 'intermediate'),
  ('Ericeira', 38.9667, -9.4167, 'point', 'intermediate'),
  ('Nazaré', 39.6, -9.0667, 'beach', 'advanced');

-- CRIAR ÍNDICES
CREATE INDEX idx_crew_members_crew_id ON crew_members(crew_id);
CREATE INDEX idx_crew_members_user_id ON crew_members(user_id);
CREATE INDEX idx_signals_crew_id ON signals(crew_id);
CREATE INDEX idx_signals_created_at ON signals(created_at DESC);
CREATE INDEX idx_chat_messages_crew_id ON chat_messages(crew_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_date ON sessions(session_date DESC);
CREATE INDEX idx_direct_messages_conversation ON direct_messages(conversation_id);
CREATE INDEX idx_direct_messages_created_at ON direct_messages(created_at DESC);

-- ============================================
-- ✅ CONCLUÍDO!
-- Tudo está configurado e pronto a usar!
-- ============================================
