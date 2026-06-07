import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import { WORLD_CUP_MATCHES } from '../../../../src/data';
import { Prediction } from '../../../../src/types';

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

// Generate fallback predictions to populate the crawlable UGC ledger
function getMockTweetHookPredictions(matchId: string | null): Prediction[] {
  // Find match details
  const preset = WORLD_CUP_MATCHES.find(m => m.id === matchId) || WORLD_CUP_MATCHES[4]; // Brazil vs Germany as default
  const { teamA, teamB } = preset;

  return [
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get('matchId');
  const format = searchParams.get('format');

  let predictions: Prediction[] = [];

  if (supabase) {
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
        // Map fields to standard types
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

        // Sort by controversy and highly-staked score
        // score = (tipAmount * 10) + ragePotential
        predictions = mapped.sort((a, b) => {
          const scoreA = (a.tipAmount || 0) * 10 + (a.ragePotential || 0);
          const scoreB = (b.tipAmount || 0) * 10 + (b.ragePotential || 0);
          return scoreB - scoreA;
        }).slice(0, 3);
      }
    } catch (err) {
      console.warn("Error querying Supabase in tweet-hook api, falling back to mock data.", err);
    }
  }

  // Fallback if no premium predictions matching the query were found
  if (predictions.length === 0) {
    predictions = getMockTweetHookPredictions(matchId).slice(0, 3);
  }

  // Return JSON if requested explicitly
  if (format === 'json' || request.headers.get('accept')?.includes('application/json')) {
    return NextResponse.json(predictions);
  }

  // Find target match details to display in visual heading
  const targetMatchId = matchId || predictions[0].matchId;
  const matchPreset = WORLD_CUP_MATCHES.find(m => m.id === targetMatchId) || WORLD_CUP_MATCHES[4];
  const matchupLabel = `${matchPreset.flagA} ${matchPreset.teamA.toUpperCase()} VS ${matchPreset.teamB.toUpperCase()} ${matchPreset.flagB}`;
  
  // Format slug for dynamic redirection
  const slugA = matchPreset.teamA.toLowerCase().replace(/\s+/g, '-');
  const slugB = matchPreset.teamB.toLowerCase().replace(/\s+/g, '-');
  const matchSlug = `${slugA}-vs-${slugB}-trash-talk`;

  // Construct styled screenshot HTML
  const cardsHtml = predictions.map((p, idx) => {
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

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
