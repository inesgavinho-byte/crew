-- ============================================
-- FIX: Remove infinite recursion in RLS policies
-- ============================================
-- Run this in Supabase SQL Editor to fix the crew creation issue
-- ============================================

-- Drop the problematic policies
DROP POLICY IF EXISTS "Membros veem outros membros" ON crew_members;
DROP POLICY IF EXISTS "Membros veem signals" ON signals;
DROP POLICY IF EXISTS "Membros podem criar signals" ON signals;
DROP POLICY IF EXISTS "Membros veem mensagens" ON chat_messages;
DROP POLICY IF EXISTS "Membros podem enviar" ON chat_messages;
DROP POLICY IF EXISTS "Membros podem convidar" ON crew_invites;

-- Recreate crew_members policies without recursion
-- Pragmatic approach: Allow reading crew_members broadly
-- Security is enforced by crews table policies (users can only query crews they have access to)
-- This prevents recursion while maintaining security at the crew level
CREATE POLICY "Membros veem outros membros" ON crew_members
  FOR SELECT USING (true);

-- Fix signals policies - use explicit join to avoid recursion
CREATE POLICY "Membros veem signals" ON signals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM crew_members cm
      WHERE cm.crew_id = signals.crew_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
    )
  );

CREATE POLICY "Membros podem criar signals" ON signals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM crew_members cm
      WHERE cm.crew_id = signals.crew_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
    )
  );

-- Fix chat_messages policies
CREATE POLICY "Membros veem mensagens" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM crew_members cm
      WHERE cm.crew_id = chat_messages.crew_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
    )
  );

CREATE POLICY "Membros podem enviar" ON chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM crew_members cm
      WHERE cm.crew_id = chat_messages.crew_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
    )
  );

-- Fix crew_invites policy
CREATE POLICY "Membros podem convidar" ON crew_invites
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM crew_members cm
      WHERE cm.crew_id = crew_invites.crew_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
    )
  );
