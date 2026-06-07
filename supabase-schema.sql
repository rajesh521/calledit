-- =============================================================
-- BragMode - Supabase Schema
-- Run this once in your Supabase project's SQL Editor
-- =============================================================

-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  "matchId" TEXT NOT NULL,
  "customMatch" TEXT,
  "predictedScoreA" TEXT,
  "predictedScoreB" TEXT,
  "firstGoalscorer" TEXT,
  "boldPredictions" JSONB DEFAULT '[]',
  "isGolden" BOOLEAN DEFAULT FALSE,
  "goldenMessage" TEXT,
  timestamp TEXT,
  "barcodeValue" TEXT,
  "tipAmount" NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending',
  "outcomeScoreA" TEXT,
  "outcomeScoreB" TEXT,
  "scoreMatched" BOOLEAN,
  "goalscorerMatched" BOOLEAN,
  confidence INTEGER,
  consensus INTEGER,
  "ragePotential" INTEGER,
  "hotTakeLabel" TEXT,
  "predictionType" TEXT DEFAULT 'match',
  "playerName" TEXT,
  "playerMarket" TEXT,
  "playerValue" TEXT,
  "teamName" TEXT,
  "teamMarket" TEXT,
  "teamValue" TEXT,
  "customTakeText" TEXT,
  "burned" BOOLEAN DEFAULT FALSE,
  "calledOut" TEXT,
  "notificationEmail" TEXT,
  "stakes" TEXT,
  "shareLanguage" TEXT
);

-- Outcomes table
CREATE TABLE IF NOT EXISTS outcomes (
  "matchId" TEXT PRIMARY KEY,
  "actualScoreA" TEXT,
  "actualScoreB" TEXT,
  "actualFirstGoalscorer" TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  "resolvedAt" TEXT
);

-- Enable Row Level Security (disabled for server-side service role access)
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE outcomes ENABLE ROW LEVEL SECURITY;

-- Allow full access via service role key (used by the Express server)
CREATE POLICY "Service role full access - predictions"
  ON predictions FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access - outcomes"
  ON outcomes FOR ALL
  USING (true)
  WITH CHECK (true);
