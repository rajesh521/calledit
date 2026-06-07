import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import sharp from "sharp";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;
let viteInstance: any = null;

app.use(express.json());

const COUNTRY_LOCALE_MAP: Record<string, string> = {
  MX: 'es-MX',
  ID: 'id',
  SA: 'ar',
  AE: 'ar',
  KE: 'en-KE',
  ZA: 'en-ZA'
};

const LOCALES = ['es-MX', 'id', 'ar', 'en-KE', 'en-ZA'];

// Middleware to detect country and locale based on headers/paths
app.use((req, res, next) => {
  if (req.path.includes('.') || req.path.startsWith('/api')) {
    return next();
  }
  
  const countryHeader = req.headers['x-vercel-ip-country'] || req.headers['X-Vercel-IP-Country'] || req.headers['x-country'];
  const country = typeof countryHeader === 'string' ? countryHeader.trim().toUpperCase() : '';
  
  const pathParts = req.path.split('/');
  const firstPathPart = pathParts[1];
  
  const currentLocale = LOCALES.find(l => l.toLowerCase() === firstPathPart?.toLowerCase());
  
  if (currentLocale) {
    req.url = req.url.replace(new RegExp(`^\\/${firstPathPart}(\\/|\\?|$)`, 'i'), '/$1') || '/';
    (req as any).detectedLocale = currentLocale;
  } else if (req.path === '/' || req.path === '') {
    const resolvedLocale = COUNTRY_LOCALE_MAP[country] || 'en';
    (req as any).detectedLocale = resolvedLocale;
  }
  
  next();
});

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    transport: ws as any,
  },
});

// Seed datasets to make the app alive of startup!
const SEED_PREDICTIONS = [
  {
    id: "pred_seed_1",
    name: "Paul the Octopus V",
    matchId: "g_a1", // Mexico vs South Africa
    predictedScoreA: "2",
    predictedScoreB: "1",
    firstGoalscorer: "Santiago Gimenez",
    boldPredictions: ["Mexico scores inside 15 min", "South Africa receives a red card"],
    isGolden: true,
    goldenMessage: "STAMPED AUTHENTIC PROPHECY",
    timestamp: "06/04/2026 14:10:05 PM",
    barcodeValue: "ROT-MEX-SA-7729",
    tipAmount: 5.00,
    status: "correct",
    outcomeScoreA: "2",
    outcomeScoreB: "1",
    scoreMatched: true,
    goalscorerMatched: true
  },
  {
    id: "pred_seed_2",
    name: "AstroBettor_99",
    matchId: "g_e1", // Brazil vs Germany
    predictedScoreA: "3",
    predictedScoreB: "1",
    firstGoalscorer: "Vinicius Jr",
    boldPredictions: ["Bicycle-kick goal", "German goalie receives yellow card"],
    isGolden: true,
    goldenMessage: "VIP GOLDEN RADAR SIGNAL",
    timestamp: "06/05/2026 09:33:14 AM",
    barcodeValue: "ROT-BRZ-GER-8319",
    tipAmount: 10.00,
    status: "pending"
  },
  {
    id: "pred_seed_3",
    name: "Oracle Pete",
    matchId: "g_a2", // USA vs Sweden
    predictedScoreA: "1",
    predictedScoreB: "0",
    firstGoalscorer: "Christian Pulisic",
    boldPredictions: ["Match resolved by a late penalty", "Sweden gets zero corners in 2nd half"],
    isGolden: false,
    timestamp: "06/05/2026 11:15:22 AM",
    barcodeValue: "ROT-USA-SWE-1049",
    tipAmount: 0,
    status: "pending"
  },
  {
    id: "pred_seed_4",
    name: "TikiTakaHacker",
    matchId: "g_a1", // Mexico vs South Africa
    predictedScoreA: "1",
    predictedScoreB: "1",
    firstGoalscorer: "Percy Tau",
    boldPredictions: ["Boring slow pass opening", "Late penalty controversy"],
    isGolden: false,
    timestamp: "06/03/2026 17:45:00 PM",
    barcodeValue: "ROT-MEX-SA-2394",
    tipAmount: 0,
    status: "incorrect",
    outcomeScoreA: "2",
    outcomeScoreB: "1",
    scoreMatched: false,
    goalscorerMatched: false
  },
  {
    id: "pred_seed_5",
    name: "FutbolNostradamus",
    matchId: "g_c1", // Argentina vs Slovenia
    predictedScoreA: "3",
    predictedScoreB: "0",
    firstGoalscorer: "Lionel Messi",
    boldPredictions: ["Messi direct free-kick goal", "Argentina clean sheet assured"],
    isGolden: true,
    goldenMessage: "AUTHENTIC ORACLE CONFIRMED",
    timestamp: "06/05/2026 12:02:44 PM",
    barcodeValue: "ROT-ARG-SLO-9533",
    tipAmount: 15.00,
    status: "pending"
  }
];

const SEED_OUTCOMES = [
  {
    matchId: "g_a1",
    actualScoreA: "2",
    actualScoreB: "1",
    actualFirstGoalscorer: "Santiago Gimenez",
    resolved: true,
    resolvedAt: "06/05/2026 01:00:00 AM"
  }
];

// Seed Supabase tables if they are entirely empty (clean cold start)
async function seedSupabaseIfEmpty() {
  console.log("Checking if Supabase needs seeding...");
  try {
    const { data: preds, error: predErr } = await supabase.from("predictions").select("id");
    if (predErr) throw predErr;
    if (!preds || preds.length === 0) {
      console.log("Seeding SEED_PREDICTIONS into Supabase `predictions` table...");
      const { error } = await supabase.from("predictions").upsert(SEED_PREDICTIONS);
      if (error) throw error;
    }

    const { data: outcomes, error: outcomeErr } = await supabase.from("outcomes").select("matchId");
    if (outcomeErr) throw outcomeErr;
    if (!outcomes || outcomes.length === 0) {
      console.log("Seeding SEED_OUTCOMES into Supabase `outcomes` table...");
      const { error } = await supabase.from("outcomes").upsert(SEED_OUTCOMES);
      if (error) throw error;
    }
  } catch (err: any) {
    console.error("Error during Supabase seeding:", err);
  }
}

// Helper to safely read predictions from Supabase
async function readPredictions(): Promise<any[]> {
  try {
    const { data, error } = await supabase.from("predictions").select("*");
    if (error) throw error;
    if (!data || data.length === 0) {
      await seedSupabaseIfEmpty();
      const { data: fresh, error: freshErr } = await supabase.from("predictions").select("*");
      if (freshErr) throw freshErr;
      return fresh || SEED_PREDICTIONS;
    }
    return data;
  } catch (err: any) {
    console.error("Error reading predictions from Supabase:", err);
    return SEED_PREDICTIONS;
  }
}

async function writePrediction(pred: any) {
  try {
    const { error } = await supabase.from("predictions").upsert(pred);
    if (error) throw error;
  } catch (err: any) {
    console.error("Error writing prediction to Supabase:", err);
  }
}

// Helper to safely read outcomes from Supabase
async function readOutcomes(): Promise<any[]> {
  try {
    const { data, error } = await supabase.from("outcomes").select("*");
    if (error) throw error;
    if (!data || data.length === 0) {
      await seedSupabaseIfEmpty();
      const { data: fresh, error: freshErr } = await supabase.from("outcomes").select("*");
      if (freshErr) throw freshErr;
      return fresh || SEED_OUTCOMES;
    }
    return data;
  } catch (err: any) {
    console.error("Error reading outcomes from Supabase:", err);
    return SEED_OUTCOMES;
  }
}

async function writeOutcome(outcome: any) {
  try {
    const { error } = await supabase.from("outcomes").upsert(outcome);
    if (error) throw error;
  } catch (err: any) {
    console.error("Error writing outcome to Supabase:", err);
  }
}

// Function to resolve a prediction against match outcomes
function getResolvedStatus(pred: any, outcomesList: any[]) {
  const matchOutcome = outcomesList.find(o => o.matchId === pred.matchId && o.resolved);
  if (!matchOutcome) {
    return { ...pred, status: 'pending' };
  }
  
  const scoreMatched = String(pred.predictedScoreA).trim() === String(matchOutcome.actualScoreA).trim() && 
                       String(pred.predictedScoreB).trim() === String(matchOutcome.actualScoreB).trim();
                       
  const goalscorerMatched = pred.firstGoalscorer.trim().toLowerCase() === matchOutcome.actualFirstGoalscorer.trim().toLowerCase();
  
  // generous win matching condition (either direct score hit or first goalscorer hit counts as win)
  const correct = scoreMatched || goalscorerMatched;
  
  return {
    ...pred,
    status: correct ? 'correct' : 'incorrect',
    outcomeScoreA: matchOutcome.actualScoreA,
    outcomeScoreB: matchOutcome.actualScoreB,
    scoreMatched,
    goalscorerMatched
  };
}


// REST API endpoints

// Reset simulation data back to fresh seed
app.post("/api/reset-simulation", async (req, res) => {
  try {
    // Delete all existing records from Supabase
    const { error: delPredErr } = await supabase.from("predictions").delete().neq("id", "");
    if (delPredErr) throw delPredErr;

    const { error: delOutcomeErr } = await supabase.from("outcomes").delete().neq("matchId", "");
    if (delOutcomeErr) throw delOutcomeErr;

    // Reseed cleanly
    const { error: seedPredErr } = await supabase.from("predictions").upsert(SEED_PREDICTIONS);
    if (seedPredErr) throw seedPredErr;

    const { error: seedOutcomeErr } = await supabase.from("outcomes").upsert(SEED_OUTCOMES);
    if (seedOutcomeErr) throw seedOutcomeErr;

    res.json({ success: true, message: "Supabase database resynchronized to initial seed conditions!" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch all predictions for the Public Feed & Leaderboard
app.get("/api/predictions", async (req, res) => {
  try {
    const { search, status } = req.query;
    let list = await readPredictions();
    const outcomesList = await readOutcomes();
    
    // Always compute live outcome resolutions
    list = list.map(p => getResolvedStatus(p, outcomesList));
    
    // Always filter out burned predictions from the public feed
    list = list.filter(p => !p.burned);
    
    // Filter by search query (match prophet name, custom team name, etc.)
    if (search) {
      const criteria = String(search).toLowerCase();
      list = list.filter(p => 
        p.name.toLowerCase().includes(criteria) || 
        (p.customMatch && p.customMatch.toLowerCase().includes(criteria)) ||
        p.firstGoalscorer.toLowerCase().includes(criteria)
      );
    }
    
    // Filter by status: pending, correct, incorrect
    if (status) {
      list = list.filter(p => p.status === status);
    }
    
    // Default: Return youngest predictions first (new receipts top)
    list.sort((a, b) => b.id.localeCompare(a.id));
    
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API Route for Tweet Hook (Social screenshots) - Express compatibility
app.get("/api/cron/tweet-hook", async (req, res) => {
  try {
    const matchId = req.query.matchId ? String(req.query.matchId) : null;
    const format = req.query.format ? String(req.query.format) : null;

    let predictions: any[] = [];

    try {
      let query = supabase
        .from('predictions')
        .select('*')
        .eq('isGolden', true)
        .eq('burned', false);

      if (matchId) {
        query = query.eq('matchId', matchId);
      }

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        const mapped = data.map((p: any) => ({
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
          confidence: p.confidence || 80,
          tipAmount: parseFloat(p.tipAmount || '0'),
          ragePotential: p.ragePotential || 75
        }));

        predictions = mapped.sort((a: any, b: any) => {
          const scoreA = (a.tipAmount || 0) * 10 + (a.ragePotential || 0);
          const scoreB = (b.tipAmount || 0) * 10 + (b.ragePotential || 0);
          return scoreB - scoreA;
        }).slice(0, 3);
      }
    } catch (err) {
      console.warn("Express: Error querying Supabase for tweet-hook, falling back to mock data.", err);
    }

    const presets = [
      { id: "g_a1", teamA: "Mexico", teamB: "South Africa", flagA: "🇲🇽", flagB: "🇿🇦" },
      { id: "g_a2", teamA: "USA", teamB: "Sweden", flagA: "🇺🇸", flagB: "🇸🇪" },
      { id: "g_b1", teamA: "Canada", teamB: "Algeria", flagA: "🇨🇦", flagB: "🇩🇿" },
      { id: "g_b2", teamA: "Belgium", teamB: "South Korea", flagA: "🇧🇪", flagB: "🇰🇷" },
      { id: "g_c1", teamA: "Argentina", teamB: "Slovenia", flagA: "🇦🇷", flagB: "🇸🇮" },
      { id: "g_c2", teamA: "Spain", teamB: "Nigeria", flagA: "🇪🇸", flagB: "🇳🇬" },
      { id: "g_d1", teamA: "France", teamB: "Saudi Arabia", flagA: "🇫🇷", flagB: "🇸🇦" },
      { id: "g_d2", teamA: "Japan", teamB: "Ecuador", flagA: "🇯🇵", flagB: "🇪🇨" },
      { id: "g_e1", teamA: "Brazil", teamB: "Germany", flagA: "🇧🇷", flagB: "🇩🇪" },
      { id: "g_e2", teamA: "Egypt", teamB: "Norway", flagA: "🇪🇬", flagB: "🇳🇴" },
      { id: "g_f1", teamA: "England", teamB: "Cameroon", flagA: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", flagB: "🇨🇲" },
      { id: "g_f2", teamA: "Portugal", teamB: "Costa Rica", flagA: "🇵🇹", flagB: "🇨🇷" },
      { id: "g_g1", teamA: "Netherlands", teamB: "Honduras", flagA: "🇳🇱", flagB: "🇭🇳" },
      { id: "g_g2", teamA: "Morocco", teamB: "Poland", flagA: "🇲🇦", flagB: "🇵🇱" },
      { id: "g_h1", teamA: "Italy", teamB: "Australia", flagA: "🇮🇹", flagB: "🇦🇺" },
      { id: "g_h2", teamA: "Switzerland", teamB: "Chile", flagA: "🇨🇭", flagB: "🇨🇱" },
      { id: "g_i1", teamA: "Uruguay", teamB: "Ghana", flagA: "🇺🇾", flagB: "🇬🇭" },
      { id: "g_i2", teamA: "Denmark", teamB: "Jamaica", flagA: "🇩🇰", flagB: "🇯🇲" },
      { id: "g_j1", teamA: "Colombia", teamB: "Iraq", flagA: "🇨🇴", flagB: "🇮🇶" },
      { id: "g_j2", teamA: "Croatia", teamB: "Austria", flagA: "🇭🇷", flagB: "🇦🇹" },
      { id: "g_k1", teamA: "Senegal", teamB: "Ukraine", flagA: "🇸🇳", flagB: "🇺🇦" },
      { id: "g_k2", teamA: "Peru", teamB: "Tunisia", flagA: "🇵🇪", flagB: "🇹🇳" },
      { id: "g_l1", teamA: "Iran", teamB: "Panama", flagA: "🇮🇷", flagB: "🇵🇦" },
      { id: "g_l2", teamA: "Turkey", teamB: "Wales", flagA: "🇹🇷", flagB: "🏴%A7%E2%80%8B%F0%9F%8F%B4%F0%9F%87%AC%F0%9F%87%A7%E2%80%8B" }
    ];

    if (predictions.length === 0) {
      const preset = presets.find(m => m.id === matchId) || presets[4];
      const { teamA, teamB } = preset;
      predictions = [
        {
          id: "pred_live_1",
          name: "TacticalGenius_88",
          matchId: preset.id,
          customMatch: `⚽ ${teamA} vs ${teamB} ⚽`,
          predictedScoreA: "4",
          predictedScoreB: "0",
          firstGoalscorer: "Vinicius Jr",
          boldPredictions: ["Goal inside 10 minutes", "Penalty saved in first half"],
          isGolden: true,
          goldenMessage: "ULTRA GOLD ORACLE SIGNAL",
          timestamp: new Date().toLocaleDateString() + " 15:45:10 PM",
          barcodeValue: "ROT-BRG-8819",
          tipAmount: 25.00,
          status: "pending",
          stakes: "shave my eyebrows off live on Twitch",
          ragePotential: 98
        },
        {
          id: "pred_live_2",
          name: "VAR_Hater_99",
          matchId: preset.id,
          customMatch: `⚽ ${teamA} vs ${teamB} ⚽`,
          predictedScoreA: "0",
          predictedScoreB: "3",
          firstGoalscorer: "K. Havertz",
          boldPredictions: ["VAR disallows two goals", "Rivalry goalie gets yellow card"],
          isGolden: true,
          goldenMessage: "AUTHENTIC SHAME WARNER",
          timestamp: new Date().toLocaleDateString() + " 16:12:34 PM",
          barcodeValue: "ROT-BRG-2284",
          tipAmount: 15.00,
          status: "pending",
          stakes: "eat a whole raw onion like an apple",
          ragePotential: 92
        },
        {
          id: "pred_live_3",
          name: "BallNerd_2026",
          matchId: preset.id,
          customMatch: `⚽ ${teamA} vs ${teamB} ⚽`,
          predictedScoreA: "2",
          predictedScoreB: "2",
          firstGoalscorer: "Neymar Jr",
          boldPredictions: ["Match goes to penalty shootout", "Red card issued in extra time"],
          isGolden: true,
          goldenMessage: "HIGH CONTROVERSY MATRIX",
          timestamp: new Date().toLocaleDateString() + " 17:05:00 PM",
          barcodeValue: "ROT-BRG-5921",
          tipAmount: 10.00,
          status: "pending",
          stakes: "pay for the entire group chat's dinner",
          ragePotential: 85
        }
      ];
    }

    if (format === 'json' || req.headers.accept?.includes('application/json')) {
      return res.json(predictions);
    }

    const targetMatchId = matchId || predictions[0].matchId;
    const matchPreset = presets.find(m => m.id === targetMatchId) || presets[4];
    const matchupLabel = `${matchPreset.flagA} ${matchPreset.teamA.toUpperCase()} VS ${matchPreset.teamB.toUpperCase()} ${matchPreset.flagB}`;
    
    const slugA = matchPreset.teamA.toLowerCase().replace(/\s+/g, '-');
    const slugB = matchPreset.teamB.toLowerCase().replace(/\s+/g, '-');
    const matchSlug = `${slugA}-vs-${slugB}-trash-talk`;

    const cardsHtml = predictions.map((p) => {
      const stakes = p.stakes ? p.stakes : "Shave their head in shame";
      const tip = p.tipAmount && p.tipAmount > 0 ? `$${p.tipAmount.toFixed(2)} Tip` : null;
      const rage = p.ragePotential ? `${p.ragePotential}% Rage` : "80% Rage";

      return `
        <div class="card ${p.isGolden ? 'golden' : ''}">
          <div class="card-header">
            <span class="tier-badge">${p.isGolden ? '✨ GOLD TIER PROPHECY' : 'FREE SLIP'}</span>
            <span class="timestamp">${p.timestamp.split(' ')[0]}</span>
          </div>
          <p class="prophet-name">@${p.name.toUpperCase()} CALLED IT:</p>
          <div class="divider"></div>
          <div>
            <div class="section-title">Prediction Target</div>
            <p class="prediction-text">Score: ${p.predictedScoreA} - ${p.predictedScoreB}</p>
            <p class="prediction-text" style="font-size: 10px; opacity: 0.85;">Scorer: ${p.firstGoalscorer.toUpperCase()}</p>
          </div>
          <div class="divider"></div>
          <div>
            <div class="section-title">Immutable Stakes Consequence</div>
            <p class="consequence-text">"Or they must: ${stakes.toUpperCase()}"</p>
          </div>
          <div class="card-footer">
            <span class="barcode-watermark">||||| | || ${p.id.substring(0, 6).toUpperCase()}</span>
            <div style="display: flex; gap: 6px;">
              ${tip ? `<span class="tip-badge">${tip}</span>` : ''}
              <span class="rage-badge">${rage}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BragMode - Top Live Match Banter Ledger</title>
  <style>
    body {
      background-color: #0c0a09;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      margin: 0;
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      box-sizing: border-box;
    }
    .container {
      width: 100%;
      max-width: 500px;
      background: #1c1917;
      border: 4px solid #000000;
      border-radius: 28px;
      padding: 24px;
      box-shadow: 12px 12px 0px #000000;
      position: relative;
      overflow: hidden;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 4px dashed #292524;
      padding-bottom: 16px;
    }
    .live-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #dc2626;
      color: #ffffff;
      font-size: 9px;
      font-weight: 900;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 6px;
      border: 2px solid #000000;
      box-shadow: 2px 2px 0 #000000;
      letter-spacing: 1.5px;
    }
    .title {
      font-size: 22px;
      font-weight: 900;
      text-transform: uppercase;
      font-style: italic;
      margin: 14px 0 4px;
      letter-spacing: -0.5px;
      color: #fbbf24;
    }
    .subtitle {
      font-size: 10px;
      font-weight: 850;
      text-transform: uppercase;
      color: #d6d3d1;
      letter-spacing: 1.2px;
    }
    .card-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .card {
      background: #ffffff;
      color: #000000;
      border: 3px solid #000000;
      border-radius: 18px;
      padding: 16px;
      position: relative;
      overflow: hidden;
      box-shadow: 4px 4px 0px #fbbf24;
    }
    .card.golden {
      background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
      box-shadow: 4px 4px 0px #ffffff;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .tier-badge {
      font-size: 8px;
      font-weight: 900;
      text-transform: uppercase;
      background: #000000;
      color: #fbbf24;
      padding: 2px 6px;
      border-radius: 4px;
      letter-spacing: 0.5px;
    }
    .card.golden .tier-badge {
      background: #000000;
      color: #ffffff;
    }
    .timestamp {
      font-size: 8px;
      color: #78716c;
      font-weight: 800;
    }
    .card.golden .timestamp {
      color: #44403c;
    }
    .prophet-name {
      font-size: 13px;
      font-weight: 900;
      margin: 0 0 6px;
      letter-spacing: -0.3px;
    }
    .divider {
      border-top: 1.5px dashed rgba(0, 0, 0, 0.2);
      margin: 8px 0;
    }
    .section-title {
      font-size: 8px;
      font-weight: 900;
      color: #57534e;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .prediction-text {
      font-size: 13px;
      font-weight: 900;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: -0.2px;
    }
    .consequence-text {
      font-size: 11px;
      font-weight: 900;
      color: #b91c1c;
      margin: 0;
      text-transform: uppercase;
      line-height: 1.25;
    }
    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 10px;
      padding-top: 8px;
      border-top: 1.5px dashed rgba(0,0,0,0.15);
    }
    .barcode-watermark {
      font-family: monospace;
      font-size: 8px;
      color: #57534e;
      font-weight: 700;
      letter-spacing: 1.5px;
    }
    .rage-badge {
      font-size: 8px;
      font-weight: 900;
      background: #000000;
      color: #ffffff;
      padding: 2.5px 6px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .tip-badge {
      font-size: 8px;
      font-weight: 900;
      background: #b91c1c;
      color: #ffffff;
      padding: 2.5px 6px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .footer-note {
      text-align: center;
      margin-top: 20px;
      font-size: 9px;
      color: #a8a29e;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="live-badge">🔴 LIVE RECEIPTS LEDGER</div>
      <div class="title">${matchupLabel}</div>
      <div class="subtitle">PRE-KICKOFF SHAME PROOFS LOCKED</div>
    </div>
    <div class="card-list">
      ${cardsHtml}
    </div>
    <div class="footer-note">
      LOCK IN YOUR COUNTER-BRAG AT:<br/>
      <span style="color: #fbbf24; font-weight: 900;">BRAGMODE.COM/MATCH/${matchSlug.toUpperCase()}</span>
    </div>
  </div>
</body>
</html>
    `;

    res.setHeader("Content-Type", "text/html");
    return res.send(html);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Submit a new prediction (Mint Receipt)
app.post("/api/predictions", async (req, res) => {
  try {
    const predictionData = req.body;
    if (!predictionData.name || !predictionData.matchId) {
      return res.status(400).json({ error: "Prophet Name and Match selection are mandatory to mint truth." });
    }
    
    const outcomesList = await readOutcomes();
    
    // Formulate a robust record ID
    const newId = `pred_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newRecord = {
      ...predictionData,
      id: newId,
      tipAmount: predictionData.tipAmount || 0,
      isGolden: predictionData.isGolden || false,
      status: "pending"
    };
    
    // Auto-resolve if outcome is already registered in DB
    const resolvedRecord = getResolvedStatus(newRecord, outcomesList);
    
    await writePrediction(resolvedRecord);
    
    res.status(201).json(resolvedRecord);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Retrieve registered match outcomes
app.get("/api/outcomes", async (req, res) => {
  try {
    res.json(await readOutcomes());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Register a real-time matchup result (kickoff result resolver!)
app.post("/api/outcomes", async (req, res) => {
  try {
    const { matchId, actualScoreA, actualScoreB, actualFirstGoalscorer } = req.body;
    if (!matchId || actualScoreA === undefined || actualScoreB === undefined) {
      return res.status(400).json({ error: "Missing score lines or match selection targets." });
    }
    
    const outcomesList = await readOutcomes();
    const index = outcomesList.findIndex(o => o.matchId === matchId);
    
    const outcomeRecord = {
      matchId,
      actualScoreA: String(actualScoreA),
      actualScoreB: String(actualScoreB),
      actualFirstGoalscorer: String(actualFirstGoalscorer || "").trim(),
      resolved: true,
      resolvedAt: new Date().toISOString()
    };
    
    await writeOutcome(outcomeRecord);
    
    // Update outcomesList locally after saving to Firestore
    const updatedOutcomesList = [...outcomesList];
    if (index > -1) {
      updatedOutcomesList[index] = outcomeRecord;
    } else {
      updatedOutcomesList.push(outcomeRecord);
    }
    
    // Instantly update existing predictions as well
    let list = await readPredictions();
    for (const p of list) {
      const resolved = getResolvedStatus(p, updatedOutcomesList);
      await writePrediction(resolved);
    }
    
    res.json({ success: true, outcome: outcomeRecord });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Burn the evidence — Coward's Way Out ($0.99)
// Marks a prediction as burned so it is filtered from the public feed
app.post("/api/burn", async (req, res) => {
  try {
    const { predictionId } = req.body;
    if (!predictionId) {
      return res.status(400).json({ error: "predictionId is required" });
    }
    const list = await readPredictions();
    const pred = list.find(p => p.id === predictionId);
    if (!pred) {
      return res.status(404).json({ error: "Prediction not found" });
    }
    await writePrediction({ ...pred, burned: true });
    res.json({ success: true, message: "Evidence incinerated. Your enemies will never know. 😈" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Global Analytics & Aggregated voting Trends
app.get("/api/analytics", async (req, res) => {
  try {
    const predictions = await readPredictions();
    
    const totalMinted = predictions.length;
    const totalGolden = predictions.filter(p => p.isGolden).length;
    const totalTips = predictions.reduce((sum, p) => sum + (p.tipAmount || 0), 0);
    
    // Aggregate match-level forecast percentages
    const voteAggregates: Record<string, {
      matchId: string;
      teamAVotes: number;
      drawVotes: number;
      teamBVotes: number;
      totalVotes: number;
    }> = {};
    
    predictions.forEach(p => {
      const matchId = p.matchId;
      if (!voteAggregates[matchId]) {
        voteAggregates[matchId] = {
          matchId,
          teamAVotes: 0,
          drawVotes: 0,
          teamBVotes: 0,
          totalVotes: 0
        };
      }
      
      const scoreA = Number(p.predictedScoreA) || 0;
      const scoreB = Number(p.predictedScoreB) || 0;
      
      voteAggregates[matchId].totalVotes += 1;
      if (scoreA > scoreB) {
        voteAggregates[matchId].teamAVotes += 1;
      } else if (scoreA < scoreB) {
        voteAggregates[matchId].teamBVotes += 1;
      } else {
        voteAggregates[matchId].drawVotes += 1;
      }
    });
    
    res.json({
      totalMinted,
      totalGolden,
      totalTips,
      trends: Object.values(voteAggregates)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


function decodePredictionSafe(encodedStr: string): any | null {
  try {
    const decodedUri = decodeURIComponent(encodedStr);
    const binStr = Buffer.from(decodedUri, 'base64').toString('binary');
    const decodedJson = decodeURIComponent(escape(binStr));
    return JSON.parse(decodedJson);
  } catch (error) {
    try {
      const binStr = Buffer.from(encodedStr, 'base64').toString('binary');
      const decodedJson = decodeURIComponent(escape(binStr));
      return JSON.parse(decodedJson);
    } catch (e) {
      console.error("Failed to decode prediction safe:", e);
      return null;
    }
  }
}

function renderSvgBarcode(x: number, y: number, height: number, seedStr: string): string {
  let lines = '';
  const hash = seedStr.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  let currentX = x;
  for (let i = 0; i < 40; i++) {
    const seed = (i * 3 + hash) % 6;
    const widths = [1, 2, 3, 1, 4, 1.5];
    const width = widths[seed];
    const color = seed >= 4 ? 'transparent' : '#1e1c16';
    if (color !== 'transparent') {
      lines += `<rect x="${currentX}" y="${y}" width="${width}" height="${height}" fill="#1e1c16" />`;
    }
    currentX += width + 1.5;
  }
  return lines;
}

function getMatchHeadline(pred: any) {
  if (pred.predictionType === 'player') {
    return `PLAYER PROP: ${pred.playerName || 'MESSI'}`;
  }
  if (pred.predictionType === 'team') {
    return `TEAM DESTINY: ${pred.teamName || 'BRAZIL'}`;
  }
  if (pred.predictionType === 'custom') {
    return `WILD PROPHECY TAKE`;
  }
  
  // Find match preset label or default
  const matchId = pred.matchId;
  const presets = [
    { id: "g_a1", teamA: "Mexico", teamB: "South Africa" },
    { id: "g_a2", teamA: "USA", teamB: "Sweden" },
    { id: "g_b1", teamA: "Canada", teamB: "Algeria" },
    { id: "g_b2", teamA: "Belgium", teamB: "South Korea" },
    { id: "g_c1", teamA: "Argentina", teamB: "Slovenia" },
    { id: "g_c2", teamA: "Spain", teamB: "Nigeria" },
    { id: "g_d1", teamA: "France", teamB: "Saudi Arabia" },
    { id: "g_d2", teamA: "Japan", teamB: "Ecuador" },
    { id: "g_e1", teamA: "Brazil", teamB: "Germany" },
    { id: "g_e2", teamA: "Egypt", teamB: "Norway" },
    { id: "g_f1", teamA: "England", teamB: "Cameroon" },
    { id: "g_f2", teamA: "Portugal", teamB: "Costa Rica" },
    { id: "g_g1", teamA: "Netherlands", teamB: "Honduras" },
    { id: "g_g2", teamA: "Morocco", teamB: "Poland" },
    { id: "g_h1", teamA: "Italy", teamB: "Australia" },
    { id: "g_h2", teamA: "Switzerland", teamB: "Chile" },
    { id: "g_i1", teamA: "Uruguay", teamB: "Ghana" },
    { id: "g_i2", teamA: "Denmark", teamB: "Jamaica" },
    { id: "g_j1", teamA: "Colombia", teamB: "Iraq" },
    { id: "g_j2", teamA: "Croatia", teamB: "Austria" },
    { id: "g_k1", teamA: "Senegal", teamB: "Ukraine" },
    { id: "g_k2", teamA: "Peru", teamB: "Tunisia" },
    { id: "g_l1", teamA: "Iran", teamB: "Panama" },
    { id: "g_l2", teamA: "Turkey", teamB: "Wales" }
  ];
  const p = presets.find(m => m.id === matchId);
  if (p) {
    return `${p.teamA} VS ${p.teamB}`;
  }
  return pred.customMatch || "WORLD CUP MATCH";
}

function generateRedactedReceiptSvg(pred: any, locale: string = 'en'): string {
  const id = pred.id || "BRG-TEMP";

  let headingText = "[ EVIDENCE REDACTED ]";
  let subText = "COWARD'S WAY OUT PROTECTION ACTIVE";
  let descText1 = "This brag aged like milk and was deleted";
  let descText2 = "from the global Wall of Shame.";
  let descText3 = "Your enemies will never find it. The record is clean. 😈";

  if (locale === 'es-MX') {
    headingText = "[ ¡NO MAMES! SE RAJÓ ]";
    subText = "PROTECCIÓN DEL COBARDE ACTIVADA";
    descText1 = "Esta payasada se canceló de la tercera cuerda";
    descText2 = "para evitar la humillación pública.";
    descText3 = "Tu rival nunca sabrá que perdiste la máscara. 😈";
  } else if (locale === 'id') {
    headingText = "[ KENA MENTAL / DI-REDAKSI ]";
    subText = "PROTEKSI DIKONTRAK COWARD";
    descText1 = "Brag ini kena mental dan langsung didelete";
    descText2 = "dari Wall of Shame global.";
    descText3 = "Musuh lu gak bakal nemu buktinya. Aman bos! 😈";
  } else if (locale === 'en-KE') {
    headingText = "[ EVIDENCE IMEREDACTIWA ]";
    subText = "COWARD'S WAY OUT IS ACTIVE, MZEE";
    descText1 = "Hii brag ilienda na maji ikafutwa";
    descText2 = "kwa ile Wall of Shame ya dunia.";
    descText3 = "Maboy wako hawatowahi ipata. Uko safe! 😈";
  } else if (locale === 'en-ZA') {
    headingText = "[ SHAME DELETED, BRU ]";
    subText = "COWARD PROTECTION ACTIVE";
    descText1 = "This prediction choked hard and was deleted";
    descText2 = "from the global Wall of Shame.";
    descText3 = "The chinas will never find it. Clean jol. 😈";
  } else if (locale === 'ar') {
    headingText = "[ تم حرق الدليل ]";
    subText = "تفعيل حماية الهروب من الفضيحة";
    descText1 = "هذا التوقع صاح واعتزل وتم حذفه";
    descText2 = "من جدار العار الكروي العالمي.";
    descText3 = "خصومك لن يعثروا عليه أبدًا. الجبهة سليمة! 😈";
  }

  return `
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="redactGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#140505" />
          <stop offset="100%" stop-color="#050000" />
        </linearGradient>
      </defs>
      <rect width="1080" height="1920" fill="url(#redactGrad)" />
      <rect x="30" y="30" width="1020" height="1860" fill="none" stroke="#EF4444" stroke-width="4" stroke-dasharray="16,12" rx="12" opacity="0.6" />
      <text x="540" y="450" font-family="'Arial Black', sans-serif" font-weight="900" font-size="120" fill="#EF4444" text-anchor="middle">🔥</text>
      <text x="540" y="620" font-family="'Arial Black', sans-serif" font-weight="900" font-size="58" fill="#EF4444" text-anchor="middle" letter-spacing="4">${headingText}</text>
      <text x="540" y="740" font-family="'Courier New', monospace" font-weight="700" font-size="26" fill="#888888" text-anchor="middle" letter-spacing="2">${subText}</text>
      <line x1="100" y1="880" x2="980" y2="880" stroke="#EF4444" stroke-width="4" opacity="0.3" />
      <text x="540" y="1030" font-family="'Courier New', monospace" font-weight="700" font-size="30" fill="#FFFFFF" text-anchor="middle">${descText1}</text>
      <text x="540" y="1090" font-family="'Courier New', monospace" font-weight="700" font-size="30" fill="#FFFFFF" text-anchor="middle">${descText2}</text>
      <text x="540" y="1200" font-family="'Courier New', monospace" font-weight="700" font-size="22" fill="#666666" text-anchor="middle">${descText3}</text>
      <line x1="100" y1="1320" x2="980" y2="1320" stroke="#EF4444" stroke-width="4" opacity="0.3" />
      <text x="540" y="1480" font-family="'Courier New', monospace" font-weight="700" font-size="24" fill="#444444" text-anchor="middle" letter-spacing="4">bragmode.com • BRAGGING RIGHTS ENGINE</text>
      <text x="540" y="1540" font-family="'Courier New', monospace" font-weight="700" font-size="20" fill="#333333" text-anchor="middle">BRG-${id}</text>
    </svg>
  `;
}

function generateReceiptSvg(pred: any, locale: string = 'en'): string {
  if (pred.burned) {
    return generateRedactedReceiptSvg(pred, locale);
  }

  const name = (pred.name || "Anonymous").toUpperCase();
  const timestamp = pred.timestamp || "06/05/2026 12:00:00 PM";
  const id = pred.id || "BRG-TEMP";
  const confidence = pred.confidence || 80;
  const calledOut = pred.calledOut ? pred.calledOut.trim() : null;

  // Decide type of prediction and get text
  let summary = "";
  const typeStr = pred.predictionType || 'match';
  if (typeStr === 'match') {
    summary = `PREDICTED SCORE: ${pred.predictedScoreA} - ${pred.predictedScoreB}`;
  } else if (typeStr === 'player') {
    summary = `${pred.playerName || 'Messi'} ${pred.playerValue || '0'} ${pred.playerMarket || 'Goals'}`;
  } else if (typeStr === 'team') {
    summary = `${pred.teamName || 'Brazil'} ${pred.teamMarket || 'wins'}`;
  } else {
    summary = pred.customTakeText || "Custom Hot Take";
  }

  // Truncate for card readability
  const headline = getMatchHeadline(pred).toUpperCase();
  const summaryShort = summary.length > 52 ? summary.substring(0, 50).toUpperCase() + "..." : summary.toUpperCase();
  const calledOutLine = calledOut ? `@${calledOut.replace(/^@/, '')}` : null;

  // Check state
  const isWrong = pred.status === 'incorrect';
  const isCorrect = pred.status === 'correct';

  // Color palette per state
  const bgColor = isWrong ? '#0f0505' : isCorrect ? '#020f07' : '#080808';
  const accentColor = isWrong ? '#EF4444' : isCorrect ? '#10B981' : '#F59E0B';
  const accentLight = isWrong ? '#FCA5A5' : isCorrect ? '#6EE7B7' : '#FCD34D';
  const borderColor = isWrong ? '#991B1B' : isCorrect ? '#065F46' : '#92400E';

  // Localized Labels for Metadata grid
  let labelProphet = "PROPHET";
  let labelConfidence = "CONFIDENCE";
  let labelSealed = "SEALED";
  let labelBragId = "BRAG ID";
  let footerLine1 = "MAKE YOUR BRAG OFFICIAL — PROOF YOU SAID IT FIRST";
  let footerLine2 = "DO NOT ATTEMPT TO RECONSTRUCT HISTORY";
  let footerLine3 = "AGED LIKE WINE OR AGED LIKE MILK — THE RECORD STANDS.";
  let callOutLabel = "I AM CALLING OUT:";
  let callItLabel = "🔒 I AM CALLING IT:";
  let engineTag = "WORLD CUP 2026 • BRAGGING RIGHTS ENGINE";

  if (locale === 'es-MX') {
    labelProphet = "PROFETIZADOR";
    labelConfidence = "CONFIANZA";
    labelSealed = "SELLADO";
    labelBragId = "ID DEL BRAG";
    footerLine1 = "HAZ OFICIAL TU BRAG — PRUEBA DE QUE LO DIJISTE ANTES";
    footerLine2 = "NO INTENTES CAMBIAR EL PASADO";
    footerLine3 = "COMO VINO O COMO LECHE AGRIA — EL RECORD NO SE MIENTE.";
    callOutLabel = "¡LE CANTO UN TIRO A:";
    callItLabel = "🔒 HAGO LA PREDICCIÓN:";
    engineTag = "COPA MUNDIAL 2026 • EL JALE DE LA RIVALIDAD";
  } else if (locale === 'id') {
    labelProphet = "KING RAMAL";
    labelConfidence = "TINGKAT PD";
    labelSealed = "TERSEGEL";
    labelBragId = "ID BRAG";
    footerLine1 = "BIAR RESMI, NO DEBAT — BUKTI LU YANG PERTAMA NYEBUT";
    footerLine2 = "JANGAN COBA-COBA NGEDIT SEJARAH";
    footerLine3 = "JADI ANGGUR ATAU AMPAS SUSU — REKOR TETEP ABADI.";
    callOutLabel = "NGASIH PAHAM KE:";
    callItLabel = "🔒 KUNCI PREDIKSI GUA:";
    engineTag = "PIALA DUNIA 2026 • MESIN ADU EGO & BACIT";
  } else if (locale === 'en-KE') {
    labelProphet = "MAN NYUMA";
    labelConfidence = "KUDUWAT";
    labelSealed = "IMECHONGWA";
    labelBragId = "BRAG ID";
    footerLine1 = "FANYA BRAG YAKO OFFICIAL — PROOF ULIONGEA KWANZA";
    footerLine2 = "USIJARIBU KUBADILISHA HISTORIA";
    footerLine3 = "KA WINE AMA KA MAWA — MARECORDI ZINASIMAMA.";
    callOutLabel = "NA-CALL OUT HUYU MSEE:";
    callItLabel = "🔒 NILIKUSHOW KWA HUKU:";
    engineTag = "WORLD CUP 2026 • DISKI BRAGGING RIGHTS MACHINE";
  } else if (locale === 'en-ZA') {
    labelProphet = "OU CITIZEN";
    labelConfidence = "SURENESS";
    labelSealed = "JOLLED";
    labelBragId = "BRAG SLIP ID";
    footerLine1 = "MAKE YOUR BRAG OFFICIAL — PROOF YOU JOLLED FIRST";
    footerLine2 = "DON'T TRY SCRUB THE HISTORY, BRU";
    footerLine3 = "LEKKER WINE OR MILK CHOKE — THE SLIP STANDS.";
    callOutLabel = "DISKI CHALLENGE TO:";
    callItLabel = "🔒 LOCKING THIS IN, BRU:";
    engineTag = "WORLD CUP 2026 • THE DISKI JOL";
  } else if (locale === 'ar') {
    labelProphet = "العراف الكروي";
    labelConfidence = "نسبة الهياط";
    labelSealed = "مختوم رسميًا";
    labelBragId = "معرف التفاخر";
    footerLine1 = "وثق هياطك الكروي رسميًا — إثبات أنك قلته أولاً";
    footerLine2 = "لا تحاول التعديل في التاريخ الكروي";
    footerLine3 = "حليب فاسد أو عتيق مثل النبيذ — السجل الكروي لا يرحم.";
    callOutLabel = "أبي أصيحك يا:";
    callItLabel = "🔒 تحدي مباشر لـ:";
    engineTag = "كأس العالم 2026 • محرك الهياط الرسمي";
  }

  // Status stamp text
  let stampLine1 = 'PENDING ⏳';
  let stampLine2 = 'BRAG IN PROGRESS';
  let stampIcon = '🔒';
  if (isCorrect) {
    stampLine1 = 'CASHED 🍷';
    stampLine2 = 'BRAG CONFIRMED';
    stampIcon = '✅';
  } else if (isWrong) {
    stampLine1 = 'AGED LIKE MILK 🥛';
    stampLine2 = 'HALL OF SHAME';
    stampIcon = '❌';
  }

  if (locale === 'es-MX') {
    if (isCorrect) {
      stampLine1 = '¡COBRADÍSIMO! 🍷';
      stampLine2 = 'BRAG COMPROBADO';
    } else if (isWrong) {
      stampLine1 = 'AGRIO COMO LIMÓN 🥛';
      stampLine2 = 'SALÓN DE LA INFAMIA';
    } else {
      stampLine1 = 'PENDIENTE ⏳';
      stampLine2 = 'BRAG EN EL AIRE';
    }
  } else if (locale === 'id') {
    if (isCorrect) {
      stampLine1 = 'CAIR SAMPAI KERING! 🍷';
      stampLine2 = 'BRAG SAH / NO COUNTER';
    } else if (isWrong) {
      stampLine1 = 'BUSUK JADI AMPAS 🥛';
      stampLine2 = 'GOA MALU / SHAME WALL';
    } else {
      stampLine1 = 'PROSES NINGGEL ⏳';
      stampLine2 = 'BRAG OTW BOS';
    }
  } else if (locale === 'en-KE') {
    if (isCorrect) {
      stampLine1 = 'IMEJAA CHROME! 🍷';
      stampLine2 = 'BRAG IMEKUBALI';
    } else if (isWrong) {
      stampLine1 = 'IMEOZA KA MAWA! 🥛';
      stampLine2 = 'SHAME CORNER';
    } else {
      stampLine1 = 'BADO INAPIGA ⏳';
      stampLine2 = 'BRAG INAENDELEA';
    }
  } else if (locale === 'en-ZA') {
    if (isCorrect) {
      stampLine1 = 'LEKKER DOP! 🍷';
      stampLine2 = 'VERIFIED BRAG';
    } else if (isWrong) {
      stampLine1 = 'MILK CHOKE 🥛';
      stampLine2 = 'WALL OF CHOKE';
    } else {
      stampLine1 = 'WAITING BRU ⏳';
      stampLine2 = 'JOL IS ON';
    }
  } else if (locale === 'ar') {
    if (isCorrect) {
      stampLine1 = 'صح الصح! 🍷';
      stampLine2 = 'تم تأكيد الجلد';
    } else if (isWrong) {
      stampLine1 = 'حليب فاسد 🥛';
      stampLine2 = 'جدار الصياح';
    } else {
      stampLine1 = 'انتظار ⏳';
      stampLine2 = 'التفاخر مستمر';
    }
  }

  const barcodeLines = renderSvgBarcode(230, 820, 55, id);

  // Build the bold predictions bullet list (up to 3)
  const boldList = Array.isArray(pred.boldPredictions) ? pred.boldPredictions : [];
  let boldLinesHtml = '';
  const isRtl = locale === 'ar';
  const textX = isRtl ? 1000 : 80;
  const anchor = isRtl ? 'end' : 'start';

  boldList.slice(0, 3).forEach((bp: string, idx: number) => {
    const truncated = bp.length > 40 ? bp.substring(0, 38) + '...' : bp;
    boldLinesHtml += `<text x="${textX}" y="${680 + idx * 44}" font-family="'Courier New', monospace" font-size="22" font-weight="700" fill="${accentLight}" opacity="0.85" text-anchor="${anchor}">${isRtl ? '' : '▸ '}${truncated.toUpperCase()}${isRtl ? ' ◂' : ''}</text>`;
  });

  return `
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${bgColor}" />
          <stop offset="100%" stop-color="#0a0a0a" />
        </linearGradient>
        <linearGradient id="accentGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="${accentColor}" />
          <stop offset="100%" stop-color="${accentLight}" />
        </linearGradient>
      </defs>

      <!-- Background -->
      <rect width="1080" height="1920" fill="url(#bgGrad)" />

      <!-- Top accent bar -->
      <rect x="0" y="0" width="1080" height="14" fill="url(#accentGrad)" />
      <!-- Bottom accent bar -->
      <rect x="0" y="1906" width="1080" height="14" fill="url(#accentGrad)" />

      <!-- Side accent bars -->
      <rect x="0" y="0" width="10" height="1920" fill="url(#accentGrad)" opacity="0.6" />
      <rect x="1070" y="0" width="10" height="1920" fill="url(#accentGrad)" opacity="0.6" />

      <!-- Inner border frame -->
      <rect x="30" y="30" width="1020" height="1860" fill="none" stroke="${accentColor}" stroke-width="3" stroke-dasharray="12,8" rx="4" opacity="0.4" />

      <!-- TOP SECTION: Label -->
      <text x="540" y="100" font-family="'Arial Black', sans-serif" font-weight="900" font-size="22" fill="${accentColor}" text-anchor="middle" letter-spacing="6" opacity="0.9">${engineTag}</text>

      <!-- BRAGMODE branding -->
      <text x="540" y="148" font-family="'Courier New', monospace" font-weight="700" font-size="18" fill="#555555" text-anchor="middle" letter-spacing="3">bragmode.com</text>

      <!-- Divider -->
      <line x1="60" y1="170" x2="1020" y2="170" stroke="${accentColor}" stroke-width="2" opacity="0.3" />

      <!-- CALLOUT line (optional @friend) -->
      ${calledOutLine ? `
      <text x="540" y="230" font-family="'Arial Black', sans-serif" font-weight="900" font-size="36" fill="#888888" text-anchor="middle" letter-spacing="2">${callOutLabel}</text>
      <text x="540" y="295" font-family="'Arial Black', sans-serif" font-weight="900" font-size="58" fill="${accentColor}" text-anchor="middle" letter-spacing="1">${calledOutLine}</text>
      ` : `
      <text x="540" y="250" font-family="'Arial Black', sans-serif" font-weight="900" font-size="36" fill="#888888" text-anchor="middle" letter-spacing="4">${callItLabel}</text>
      `}

      <!-- HERO PREDICTION TEXT -->
      <text x="540" y="${calledOutLine ? 390 : 360}" font-family="'Arial Black', sans-serif" font-weight="900" font-size="28" fill="#888888" text-anchor="middle" letter-spacing="3">${headline}</text>

      <!-- Main brag in huge type -->
      <text x="${isRtl ? 1000 : 80}" y="${calledOutLine ? 495 : 465}" font-family="'Arial Black', sans-serif" font-weight="900" font-size="72" fill="#FFFFFF" letter-spacing="-1" text-anchor="${anchor}" dominant-baseline="auto">${summaryShort.substring(0, 22)}</text>
      ${summaryShort.length > 22 ? `<text x="${isRtl ? 1000 : 80}" y="${calledOutLine ? 575 : 545}" font-family="'Arial Black', sans-serif" font-weight="900" font-size="72" fill="#FFFFFF" letter-spacing="-1" text-anchor="${anchor}">${summaryShort.substring(22, 44)}</text>` : ''}
      ${summaryShort.length > 44 ? `<text x="${isRtl ? 1000 : 80}" y="${calledOutLine ? 655 : 625}" font-family="'Arial Black', sans-serif" font-weight="900" font-size="72" fill="#FFFFFF" letter-spacing="-1" text-anchor="${anchor}">${summaryShort.substring(44)}</text>` : ''}

      <!-- Divider -->
      <line x1="60" y1="640" x2="1020" y2="640" stroke="${accentColor}" stroke-width="2" opacity="0.25" />

      <!-- Bold predictions list -->
      ${boldLinesHtml || `<text x="${textX}" y="700" font-family="'Courier New', monospace" font-size="22" font-weight="700" fill="#555555" text-anchor="${anchor}">▸ NO PARLAY ADDONS</text>`}

      <!-- Divider -->
      <line x1="60" y1="810" x2="1020" y2="810" stroke="${accentColor}" stroke-width="2" opacity="0.25" />

      <!-- METADATA GRID -->
      <text x="${isRtl ? 1000 : 80}" y="880" font-family="'Courier New', monospace" font-weight="700" font-size="22" fill="#666666" letter-spacing="1" text-anchor="${anchor}">${labelProphet}</text>
      <text x="${isRtl ? 1000 : 80}" y="918" font-family="'Arial Black', sans-serif" font-weight="900" font-size="34" fill="${accentLight}" text-anchor="${anchor}">${name}</text>

      <text x="540" y="880" font-family="'Courier New', monospace" font-weight="700" font-size="22" fill="#666666" letter-spacing="1" text-anchor="middle">${labelConfidence}</text>
      <text x="540" y="918" font-family="'Arial Black', sans-serif" font-weight="900" font-size="34" fill="${accentLight}" text-anchor="middle">${confidence}% LOCKED</text>

      <text x="${isRtl ? 1000 : 80}" y="980" font-family="'Courier New', monospace" font-weight="700" font-size="22" fill="#666666" letter-spacing="1" text-anchor="${anchor}">${labelSealed}</text>
      <text x="${isRtl ? 1000 : 80}" y="1018" font-family="'Courier New', monospace" font-weight="700" font-size="26" fill="#AAAAAA" text-anchor="${anchor}">${timestamp}</text>

      <text x="540" y="980" font-family="'Courier New', monospace" font-weight="700" font-size="22" fill="#666666" letter-spacing="1" text-anchor="middle">${labelBragId}</text>
      <text x="540" y="1018" font-family="'Courier New', monospace" font-weight="700" font-size="26" fill="#AAAAAA" text-anchor="middle">BRG-${id.substring(0, 12)}</text>

      <!-- Divider -->
      <line x1="60" y1="1060" x2="1020" y2="1060" stroke="${accentColor}" stroke-width="2" opacity="0.25" />

      <!-- STATUS STAMP SECTION -->
      <rect x="60" y="1090" width="960" height="200" rx="16" fill="${accentColor}" opacity="0.1" stroke="${accentColor}" stroke-width="3" />
      <text x="540" y="1170" font-family="'Arial Black', sans-serif" font-weight="900" font-size="70" fill="${accentColor}" text-anchor="middle" letter-spacing="2">${stampLine1}</text>
      <text x="540" y="1225" font-family="'Courier New', monospace" font-weight="700" font-size="26" fill="${accentLight}" text-anchor="middle" letter-spacing="4" opacity="0.8">${stampLine2}</text>

      <!-- Divider -->
      <line x1="60" y1="1320" x2="1020" y2="1320" stroke="${accentColor}" stroke-width="2" opacity="0.2" />

      <!-- BARCODE SECTION -->
      <rect x="220" y="1340" width="640" height="80" fill="#ffffff" opacity="0.04" />
      ${barcodeLines}
      <text x="540" y="1445" font-family="'Courier New', monospace" font-weight="700" font-size="20" fill="#555555" text-anchor="middle" letter-spacing="2">*BRG-${id}*</text>

      <!-- Footer -->
      <line x1="60" y1="1480" x2="1020" y2="1480" stroke="${accentColor}" stroke-width="1" opacity="0.2" />
      <text x="540" y="1540" font-family="'Courier New', monospace" font-weight="700" font-size="22" fill="#444444" text-anchor="middle" letter-spacing="2">${footerLine1}</text>
      <text x="540" y="1578" font-family="'Courier New', monospace" font-weight="700" font-size="22" fill="#444444" text-anchor="middle">${footerLine2}</text>
      <text x="540" y="1616" font-family="'Courier New', monospace" font-weight="700" font-size="22" fill="#444444" text-anchor="middle">${footerLine3}</text>

      <!-- Big BRAGMODE logo at bottom -->
      <text x="540" y="1700" font-family="'Arial Black', sans-serif" font-weight="900" font-size="64" fill="${accentColor}" text-anchor="middle" letter-spacing="-2" opacity="0.9">BRAGMODE</text>
      <text x="540" y="1745" font-family="'Courier New', monospace" font-weight="700" font-size="22" fill="#555555" text-anchor="middle" letter-spacing="4">bragmode.com</text>
    </svg>
  `;
}

// REST route to serve dynamic prediction receipt image
app.get(["/api/receipt-image", "/api/receipt-image/receipt.png"], async (req, res) => {
  // Allow social media crawlers (Twitter, FB, etc.) to fetch this image cross-origin
  res.setHeader("Access-Control-Allow-Origin", "*");

  const r = req.query.r;
  if (!r) {
    return res.status(400).send("Missing prediction details");
  }
  const pred = decodePredictionSafe(String(r));
  if (!pred) {
    return res.status(404).send("Invalid prediction payload");
  }

  // Query database to check if this prediction ID is burned
  if (pred.id) {
    try {
      const { data: dbPred } = await supabase.from("predictions").select("burned").eq("id", pred.id).maybeSingle();
      if (dbPred?.burned) {
        pred.burned = true;
      }
    } catch (err) {
      console.error("Failed to query burned status for dynamic image:", err);
    }
  }
  
  const locale = String(req.query.locale || pred.locale || 'en').trim();
  const svg = generateReceiptSvg(pred, locale);
  const format = req.query.format || 'png';
  
  if (format === 'svg') {
    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "public, max-age=300");
    return res.send(svg);
  }
  
  try {
    const svgBuffer = Buffer.from(svg, 'utf-8');
    const pngBuffer = await sharp(svgBuffer, { density: 150 })
      .png({ compressionLevel: 6 })
      .toBuffer();
    
    res.setHeader("Content-Type", "image/png");
    // Short cache so status changes (correct/incorrect) are reflected quickly
    res.setHeader("Cache-Control", "public, max-age=300");
    return res.send(pngBuffer);
  } catch (err) {
    console.error("Failed to convert SVG to PNG using sharp, falling back to SVG", err);
    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "public, max-age=300");
    return res.send(svg);
  }
});

// Resolve the canonical public base URL for absolute OG/Twitter image links.
// Priority: APP_URL env var (set by deployment platform) → X-Forwarded headers → req.host fallback.
function getPublicBaseUrl(req: express.Request): string {
  // APP_URL in .env is the authoritative deployed URL (e.g. https://myapp.com)
  if (process.env.APP_URL && !process.env.APP_URL.includes('MY_APP_URL')) {
    return process.env.APP_URL.replace(/\/$/, '');
  }
  // Behind a reverse proxy (Nginx, Cloudflare, etc.) use forwarded headers
  const proto = req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http');
  const host = req.get('x-forwarded-host') || req.get('host') || 'localhost:3000';
  return `${proto}://${host}`;
}

// Capture ROOT request before Vite to output custom metadata crawl cards!
app.get(["/", "/es-MX", "/id", "/ar", "/en-KE", "/en-ZA"], async (req, res, next) => {
  const r = req.query.r;
  let metaTags = "";
  let isBurned = false;

  if (r) {
    const pred = decodePredictionSafe(String(r));
    if (pred) {
      // Check database to see if prediction ID is burned
      isBurned = pred.burned || false;
      if (pred.id && !isBurned) {
        try {
          const { data: dbPred } = await supabase.from("predictions").select("burned").eq("id", pred.id).maybeSingle();
          if (dbPred?.burned) {
            isBurned = true;
          }
        } catch (err) {
          console.error("Failed to query burned status for root html:", err);
        }
      }

      try {
        const base = getPublicBaseUrl(req);
        const nameUpper = (pred.name || "Anonymous").toUpperCase().replace(/"/g, '&quot;');
        const absoluteImageUrl = `${base}/api/receipt-image/receipt.png?r=${encodeURIComponent(String(r))}`;
        const absolutePageUrl = `${base}/?r=${encodeURIComponent(String(r))}`;

        metaTags = isBurned ? `
        <!-- Open Graph / Facebook -->
        <meta property="og:type" content="website" />
        <meta property="og:url" content="${absolutePageUrl}" />
        <meta property="og:title" content="🔥 [EVIDENCE REDACTED] 👀" />
        <meta property="og:description" content="This prediction was incinerated to protect ${nameUpper}'s reputation. Nothing to see here! 😈" />
        <meta property="og:image" content="${absoluteImageUrl}" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1080" />
        <meta property="og:image:height" content="1920" />

        <!-- Twitter / X -->
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="${absolutePageUrl}" />
        <meta name="twitter:title" content="🔥 [EVIDENCE REDACTED]" />
        <meta name="twitter:description" content="This prediction was incinerated to protect ${nameUpper}'s reputation. Nothing to see here! 😈" />
        <meta name="twitter:image" content="${absoluteImageUrl}" />
        ` : `
        <!-- Open Graph / Facebook -->
        <meta property="og:type" content="website" />
        <meta property="og:url" content="${absolutePageUrl}" />
        <meta property="og:title" content="${nameUpper} called it before kickoff 👀 — did they age like wine or milk?" />
        <meta property="og:description" content="They locked in this World Cup 2026 brag BEFORE the match. Tap to see if it aged like wine 🍷 or milk 🥛 — and lock in yours." />
        <meta property="og:image" content="${absoluteImageUrl}" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1080" />
        <meta property="og:image:height" content="1920" />

        <!-- Twitter / X -->
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="${absolutePageUrl}" />
        <meta name="twitter:title" content="${nameUpper} said it before kickoff. Were they right? 🔒" />
        <meta name="twitter:description" content="They locked in this World Cup 2026 brag BEFORE the match. Tap to see if it aged like wine 🍷 or milk 🥛 — and lock in yours." />
        <meta name="twitter:image" content="${absoluteImageUrl}" />
        `;
      } catch (err) {
        console.error("Failed to dynamically generate meta tags:", err);
      }
    }
  }

  try {
    let html = "";
    if (process.env.NODE_ENV !== "production" && viteInstance) {
      const rawHtml = fs.readFileSync(path.join(process.cwd(), "index.html"), "utf-8");
      html = await viteInstance.transformIndexHtml(req.originalUrl || req.url, rawHtml);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      html = fs.readFileSync(path.join(distPath, "index.html"), "utf-8");
    }

    if (metaTags) {
      html = html.replace("<head>", `<head>${metaTags}`);
    }

    // Resolve detected locale and direction from middleware
    const resolvedLocale = (req as any).detectedLocale || 'en';
    const direction = resolvedLocale === 'ar' ? 'rtl' : 'ltr';

    const i18nScript = `
      <script>
        window.__LOCALE__ = "${resolvedLocale}";
        window.__DIRECTION__ = "${direction}";
      </script>
    `;
    html = html.replace("<head>", `<head>${i18nScript}`);

    // Dynamically inject attributes into html tag
    if (direction === 'rtl') {
      html = html.replace('<html lang="en">', '<html lang="ar" dir="rtl">');
      html = html.replace('<html>', '<html lang="ar" dir="rtl">');
    } else {
      html = html.replace('<html lang="en">', `<html lang="${resolvedLocale}" dir="ltr">`);
      html = html.replace('<html>', `<html lang="${resolvedLocale}" dir="ltr">`);
    }

    res.setHeader("Content-Type", "text/html");
    return res.send(html);
  } catch (err) {
    console.error("Failed to dynamically compile index.html:", err);
    return next();
  }
});

// Serve frontend assets
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    viteInstance = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(viteInstance.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
}

export default app;

if (!process.env.VERCEL) {
  setupVite().then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Full-stack server online at http://0.0.0.0:${PORT}`);
    });
  });
}

