import React from 'react';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import { WORLD_CUP_MATCHES } from '../../../src/data';
import { Prediction } from '../../../src/types';
import BanterMatchClient from './BanterMatchClient';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey, {
      realtime: {
        transport: ws as any,
      },
    })
  : null;

// Parse slug to extract readable team names and preset match ID
function getMatchDetailsFromSlug(slug: string) {
  // 1. Try to find match details from preset combinations
  const preset = WORLD_CUP_MATCHES.find(m => {
    if (m.id === 'custom') return false;
    const slugA = m.teamA.toLowerCase().replace(/\s+/g, '-');
    const slugB = m.teamB.toLowerCase().replace(/\s+/g, '-');
    const expected = `${slugA}-vs-${slugB}-trash-talk`;
    return expected === slug;
  });

  if (preset) {
    return {
      teamA: preset.teamA,
      teamB: preset.teamB,
      presetId: preset.id,
    };
  }

  // 2. Fallback parser if dynamic/custom slug is requested
  const clean = slug.replace(/-trash-talk$/, '');
  const parts = clean.split('-vs-');
  
  const titleCase = (str: string) => 
    str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  const teamA = parts[0] ? titleCase(parts[0]) : 'Team A';
  const teamB = parts[1] ? titleCase(parts[1]) : 'Team B';

  return {
    teamA,
    teamB,
    presetId: 'custom',
  };
}

// Generate static params for all 24 World Cup match presets
export function generateStaticParams() {
  return WORLD_CUP_MATCHES
    .filter(m => m.id !== 'custom')
    .map(m => {
      const slugA = m.teamA.toLowerCase().replace(/\s+/g, '-');
      const slugB = m.teamB.toLowerCase().replace(/\s+/g, '-');
      return {
        slug: `${slugA}-vs-${slugB}-trash-talk`,
      };
    });
}

// Generate dynamic metadata for dynamic SEO keywords targeting match banter search queries
export async function generateMetadata({ params }: { params: { slug: string } | Promise<{ slug: string }> }) {
  const resolvedParams = 'then' in params ? await (params as any) : params;
  const { slug } = resolvedParams;
  const { teamA, teamB } = getMatchDetailsFromSlug(slug);

  return {
    title: `${teamA} vs ${teamB} Trash Talk & Predictions Ledger | BragMode`,
    description: `Lock in your pre-match receipts for ${teamA} vs ${teamB}. Don't just tweet your takes—mint them before kickoff and silence the group chat.`,
  };
}

// Fetch initial predictions matching this fixture from Supabase with a mock fallback
async function getPredictionsForMatch(teamA: string, teamB: string, presetId: string): Promise<Prediction[]> {
  if (!supabase) {
    console.warn("Supabase credentials missing. Returning mock predictions for offline compilation.");
    return getMockPredictions(teamA, teamB);
  }

  try {
    const { data, error } = await supabase
      .from("predictions")
      .select("*")
      .eq("burned", false);

    if (error) {
      console.warn("Failed to fetch predictions from Supabase. Returning mock fallback. Error:", error.message);
      return getMockPredictions(teamA, teamB);
    }

    if (!data || data.length === 0) {
      return getMockPredictions(teamA, teamB);
    }

    const matched = data.filter((p: any) => {
      if (presetId !== 'custom' && p.matchId === presetId) {
        return true;
      }
      const label = (p.customMatch || '').toLowerCase();
      return label.includes(teamA.toLowerCase()) && label.includes(teamB.toLowerCase());
    });

    if (matched.length === 0) {
      return getMockPredictions(teamA, teamB);
    }

    return matched.map((p: any) => ({
      id: p.id,
      name: p.name,
      matchId: p.matchId,
      customMatch: p.customMatch,
      predictedScoreA: p.predictedScoreA || '0',
      predictedScoreB: p.predictedScoreB || '0',
      firstGoalscorer: p.firstGoalscorer || 'None',
      boldPredictions: Array.isArray(p.boldPredictions) 
        ? p.boldPredictions 
        : (typeof p.boldPredictions === 'string' 
            ? JSON.parse(p.boldPredictions || '[]') 
            : []),
      isGolden: !!p.isGolden,
      goldenMessage: p.goldenMessage,
      timestamp: p.timestamp || new Date().toLocaleString(),
      barcodeValue: p.barcodeValue || `ROT-CTR-${Math.floor(100000 + Math.random() * 900000)}`,
      calledOut: p.calledOut,
      stakes: p.stakes,
      status: p.status || 'pending',
      confidence: p.confidence
    })).sort((a, b) => b.id.localeCompare(a.id));
  } catch (err: any) {
    console.warn("Error resolving predictions from Supabase. Returning mock fallback. Error:", err.message || err);
    return getMockPredictions(teamA, teamB);
  }
}

// Generate fallback predictions to populate the crawlable UGC ledger
function getMockPredictions(teamA: string, teamB: string): Prediction[] {
  return [
    {
      id: "pred_mock_1",
      name: "BallKnowr_99",
      matchId: "custom",
      customMatch: `⚽ ${teamA} vs ${teamB} ⚽`,
      predictedScoreA: "3",
      predictedScoreB: "1",
      firstGoalscorer: "S. Gimenez",
      boldPredictions: ["Goal inside first 20 minutes", "Match resolved by penalty"],
      isGolden: true,
      goldenMessage: "STAMPED AUTHENTIC PROPHECY",
      timestamp: new Date().toLocaleDateString() + " 18:30:00 PM",
      barcodeValue: `ROT-CTR-${Math.floor(100000 + Math.random() * 900000)}`,
      calledOut: "Ball_Coward",
      stakes: "post an apology video on Twitter",
      status: "pending"
    },
    {
      id: "pred_mock_2",
      name: "OracleNostradamus",
      matchId: "custom",
      customMatch: `⚽ ${teamA} vs ${teamB} ⚽`,
      predictedScoreA: "1",
      predictedScoreB: "2",
      firstGoalscorer: "Vinicius Jr",
      boldPredictions: ["Rivalry team receives a red card", "Goal in extra time"],
      isGolden: false,
      timestamp: new Date().toLocaleDateString() + " 19:45:12 PM",
      barcodeValue: `ROT-CTR-${Math.floor(100000 + Math.random() * 900000)}`,
      calledOut: "TheWholeChat",
      stakes: "wear the rival jersey to work tomorrow",
      status: "pending"
    }
  ];
}

// Next.js dynamic routing landing page component
export default async function MatchBanterPage({ params }: { params: { slug: string } | Promise<{ slug: string }> }) {
  const resolvedParams = 'then' in params ? await (params as any) : params;
  const { slug } = resolvedParams;
  const { teamA, teamB, presetId } = getMatchDetailsFromSlug(slug);

  const initialPredictions = await getPredictionsForMatch(teamA, teamB, presetId);

  return (
    <BanterMatchClient
      teamA={teamA}
      teamB={teamB}
      slug={slug}
      initialPredictions={initialPredictions}
    />
  );
}
