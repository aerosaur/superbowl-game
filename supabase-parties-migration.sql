-- Super Bowl LX Predictions - Party System Migration
-- Run this in Supabase SQL Editor AFTER the initial schema

-- ============================================
-- PARTIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sb_parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- PARTY MEMBERS TABLE (many-to-many)
-- ============================================
CREATE TABLE IF NOT EXISTS sb_party_members (
  party_id UUID REFERENCES sb_parties(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (party_id, user_id)
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE sb_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE sb_party_members ENABLE ROW LEVEL SECURITY;

-- Parties: Anyone authenticated can read parties (to join via code)
CREATE POLICY "Authenticated users can read parties"
  ON sb_parties FOR SELECT
  USING (auth.role() = 'authenticated');

-- Parties: Authenticated users can create parties
CREATE POLICY "Authenticated users can create parties"
  ON sb_parties FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = created_by);

-- Parties: Only creator can update their party
CREATE POLICY "Party creators can update their party"
  ON sb_parties FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Parties: Only creator can delete their party
CREATE POLICY "Party creators can delete their party"
  ON sb_parties FOR DELETE
  USING (auth.uid() = created_by);

-- Party Members: Users can see members of parties they're in
CREATE POLICY "Users can read members of their parties"
  ON sb_party_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sb_party_members pm
      WHERE pm.party_id = sb_party_members.party_id
      AND pm.user_id = auth.uid()
    )
  );

-- Party Members: Users can join parties (insert themselves)
CREATE POLICY "Users can join parties"
  ON sb_party_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Party Members: Users can leave parties (delete themselves)
CREATE POLICY "Users can leave parties"
  ON sb_party_members FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_sb_parties_invite_code ON sb_parties(invite_code);
CREATE INDEX IF NOT EXISTS idx_sb_parties_created_by ON sb_parties(created_by);
CREATE INDEX IF NOT EXISTS idx_sb_party_members_user_id ON sb_party_members(user_id);
CREATE INDEX IF NOT EXISTS idx_sb_party_members_party_id ON sb_party_members(party_id);

-- ============================================
-- REALTIME (optional - enable if you want live updates)
-- ============================================
-- ALTER PUBLICATION supabase_realtime ADD TABLE sb_parties;
-- ALTER PUBLICATION supabase_realtime ADD TABLE sb_party_members;

-- ============================================
-- HELPER FUNCTION: Generate invite code
-- ============================================
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;
