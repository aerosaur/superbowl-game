-- Super Bowl LX Predictions Game Schema
-- Run this in Supabase SQL Editor
-- Uses sb_ prefix to avoid conflicts with Grammy game tables

-- Predictions table
CREATE TABLE IF NOT EXISTS sb_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  selection TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, category)
);

-- Results table
CREATE TABLE IF NOT EXISTS sb_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT UNIQUE NOT NULL,
  selection TEXT NOT NULL,
  announced_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE sb_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sb_results ENABLE ROW LEVEL SECURITY;

-- Predictions policies
CREATE POLICY "Users can read own predictions"
  ON sb_predictions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own predictions"
  ON sb_predictions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own predictions"
  ON sb_predictions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own predictions"
  ON sb_predictions FOR DELETE
  USING (auth.uid() = user_id);

-- Results policies (public read, authenticated write for admin)
CREATE POLICY "Anyone can read results"
  ON sb_results FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage results"
  ON sb_results FOR ALL
  USING (auth.role() = 'authenticated');

-- Enable realtime for results table
ALTER PUBLICATION supabase_realtime ADD TABLE sb_results;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sb_predictions_user_id ON sb_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_sb_predictions_category ON sb_predictions(category);
