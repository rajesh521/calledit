import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { DodoPayments } from "dodopayments";
import dotenv from "dotenv";
import fs from "fs";
import { initializeApp } from "firebase/app";
import { initializeFirestore, collection, doc, getDocs, setDoc, deleteDoc } from "firebase/firestore";
import sharp from "sharp";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;
let viteInstance: any = null;

app.use(express.json());

// Initialize Firestore from config json
const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));

const firebaseApp = initializeApp(firebaseConfig);
const db = initializeFirestore(firebaseApp, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: any, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

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

// Seed firestore collections if they are entirely blank (clean system cold start)
async function seedFirestoreIfEmpty() {
  console.log("Checking if Firestore needs seeding...");
  try {
    const predSnap = await getDocs(collection(db, "predictions"));
    if (predSnap.empty) {
      console.log("Seeding SEED_PREDICTIONS into Firestore `predictions` collection...");
      for (const pred of SEED_PREDICTIONS) {
        await setDoc(doc(db, "predictions", pred.id), pred);
      }
    }
    const outcomeSnap = await getDocs(collection(db, "outcomes"));
    if (outcomeSnap.empty) {
      console.log("Seeding SEED_OUTCOMES into Firestore `outcomes` collection...");
      for (const outcome of SEED_OUTCOMES) {
        await setDoc(doc(db, "outcomes", outcome.matchId), outcome);
      }
    }
  } catch (err: any) {
    if (err && (err.code === "permission-denied" || String(err).includes("permission") || String(err).includes("Permission"))) {
      handleFirestoreError(err, OperationType.GET, "predictions");
    }
    console.error("Error during Firestore seeding:", err);
  }
}

// Helper to safely read from Firestore
async function readPredictions(): Promise<any[]> {
  try {
    const snap = await getDocs(collection(db, "predictions"));
    if (snap.empty) {
      await seedFirestoreIfEmpty();
      const freshSnap = await getDocs(collection(db, "predictions"));
      return freshSnap.docs.map(d => d.data());
    }
    return snap.docs.map(d => d.data());
  } catch (err: any) {
    if (err && (err.code === "permission-denied" || String(err).includes("permission") || String(err).includes("Permission"))) {
      handleFirestoreError(err, OperationType.LIST, "predictions");
    }
    console.error("Error reading predictions from Firestore:", err);
    return SEED_PREDICTIONS;
  }
}

async function writePrediction(pred: any) {
  try {
    await setDoc(doc(db, "predictions", pred.id), pred);
  } catch (err: any) {
    if (err && (err.code === "permission-denied" || String(err).includes("permission") || String(err).includes("Permission"))) {
      handleFirestoreError(err, OperationType.WRITE, `predictions/${pred.id}`);
    }
    console.error("Error writing prediction to Firestore:", err);
  }
}

// Helper to safely read outcomes from Firestore
async function readOutcomes(): Promise<any[]> {
  try {
    const snap = await getDocs(collection(db, "outcomes"));
    if (snap.empty) {
      await seedFirestoreIfEmpty();
      const freshSnap = await getDocs(collection(db, "outcomes"));
      return freshSnap.docs.map(d => d.data());
    }
    return snap.docs.map(d => d.data());
  } catch (err: any) {
    if (err && (err.code === "permission-denied" || String(err).includes("permission") || String(err).includes("Permission"))) {
      handleFirestoreError(err, OperationType.LIST, "outcomes");
    }
    console.error("Error reading outcomes from Firestore:", err);
    return SEED_OUTCOMES;
  }
}

async function writeOutcome(outcome: any) {
  try {
    await setDoc(doc(db, "outcomes", outcome.matchId), outcome);
  } catch (err: any) {
    if (err && (err.code === "permission-denied" || String(err).includes("permission") || String(err).includes("Permission"))) {
      handleFirestoreError(err, OperationType.WRITE, `outcomes/${outcome.matchId}`);
    }
    console.error("Error writing outcome to Firestore:", err);
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

// Lazy-initialized Dodo Payments Client
let dodoClient: DodoPayments | null = null;
function getDodoClient(): DodoPayments | null {
  if (!dodoClient) {
    const key = process.env.DODO_PAYMENTS_API_KEY;
    if (!key) {
      console.warn("DODO_PAYMENTS_API_KEY environment variable is missing. Falling back to sandbox simulator mode.");
      return null;
    }
    dodoClient = new DodoPayments({
      bearerToken: key,
      environment: process.env.DODO_PAYMENTS_ENV === "live" ? "live_mode" : "test_mode"
    });
  }
  return dodoClient;
}

// REST API endpoints

// Reset simulation data back to fresh seed
app.post("/api/reset-simulation", async (req, res) => {
  try {
    // Delete existing records to perform a true system reset in Firestore
    const predSnap = await getDocs(collection(db, "predictions"));
    for (const d of predSnap.docs) {
      await deleteDoc(doc(db, "predictions", d.id));
    }
    const outcomeSnap = await getDocs(collection(db, "outcomes"));
    for (const d of outcomeSnap.docs) {
      await deleteDoc(doc(db, "outcomes", d.id));
    }
    
    // Seed them cleanly
    for (const pred of SEED_PREDICTIONS) {
      await setDoc(doc(db, "predictions", pred.id), pred);
    }
    for (const outcome of SEED_OUTCOMES) {
      await setDoc(doc(db, "outcomes", outcome.matchId), outcome);
    }
    
    res.json({ success: true, message: "Firestore database resynchronized to initial seed conditions!" });
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

// REST API endpoint to create a Dodo checkout session
app.post("/api/dodo/create-checkout", async (req, res) => {
  try {
    const { type, amount, email, country, customText, predictionPayload } = req.body;
    const client = getDodoClient();

    if (!client) {
      // Return a simulated URL path if API KEY is missing so the app is 100% interactive for previews
      const redirectUrl = `/checkout-simulation?type=${type}&amount=${amount}&email=${encodeURIComponent(email || "")}&country=${country || "US"}&customText=${encodeURIComponent(customText || "")}&r=${encodeURIComponent(predictionPayload || "")}`;
      return res.json({ url: redirectUrl, isSimulated: true });
    }

    // Product IDs from environment or standard placeholders
    const productId = type === "gold"
      ? (process.env.DODO_PAYMENTS_GOLD_PRODUCT_ID || "p_gold_parlay")
      : (process.env.DODO_PAYMENTS_TIP_PRODUCT_ID || "p_coffee_tip");

    // The return_url leads back to our application. We append payment success metadata and the original prediction payload!
    const returnUrl = `${req.headers.origin}/?r=${encodeURIComponent(predictionPayload || "")}&payment_success=true&type=${type}&customText=${encodeURIComponent(customText || "")}&amount=${amount}`;

    console.log(`Creating real Dodo checkout session for product ${productId}...`);
    
    // In Dodo Payments, checkouts are created under checkoutSessions.
    const session = await client.checkoutSessions.create({
      customer: {
        email: email || "customer@example.com",
        name: "WC G.O.A.T Prophet"
      },
      billing_address: {
        country: (country || "US") as any,
      },
      product_cart: [
        {
          product_id: productId,
          quantity: 1,
          amount: amount ? Math.round(amount * 100) : null // lowest denomination: cents for USD
        }
      ],
      metadata: {
        type,
        amount: String(amount),
        customText: customText || "",
        predictionPayload: predictionPayload || ""
      },
      return_url: returnUrl
    });

    res.json({ url: session.checkout_url || "", isSimulated: false });
  } catch (error: any) {
    console.error("Dodo Payments session creation error:", error);
    res.status(500).json({ error: error.message || "Failed to create Dodo checkout" });
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

function generateReceiptSvg(pred: any): string {
  const name = (pred.name || "Anonymous").toUpperCase();
  const timestamp = pred.timestamp || "06/05/2026 12:00:00 PM";
  const id = pred.id || "ROT-TEMP";
  const confidence = pred.confidence || 80;
  
  // Decide type of prediction and get text
  let summary = "";
  const typeStr = pred.predictionType || 'match';
  if (typeStr === 'match') {
    summary = `PREDICTED SCORE: ${pred.predictedScoreA} - ${pred.predictedScoreB}`;
  } else if (typeStr === 'player') {
    summary = `${pred.playerName || 'Messi'} to get ${pred.playerValue || '0'} ${pred.playerMarket || 'Goals'}`;
  } else if (typeStr === 'team') {
    summary = `${pred.teamName || 'Brazil'} to get ${pred.teamMarket || 'Victory'}`;
  } else {
    summary = pred.customTakeText || "Custom Prophecy Take";
  }

  // Check state
  const isWrong = pred.status === 'incorrect';
  const isCorrect = pred.status === 'correct';
  
  let stampHtml = "";
  let paperBg = "#fbfaf5";
  let borderStroke = "#1c1917";
  
  if (isWrong) {
    // Red rejected rubber stamp
    stampHtml = `
      <g transform="translate(420, 260) rotate(-15)">
        <rect x="-100" y="-35" width="200" height="70" rx="10" fill="none" stroke="#EF4444" stroke-width="4" stroke-dasharray="2,2" opacity="0.85" />
        <rect x="-96" y="-31" width="192" height="62" rx="8" fill="none" stroke="#EF4444" stroke-width="2" opacity="0.85" />
        <text x="0" y="-4" font-family="'Space Grotesk', sans-serif" font-weight="900" font-size="18" fill="#EF4444" text-anchor="middle" opacity="0.85">REJECTED</text>
        <text x="0" y="16" font-family="'JetBrains Mono', monospace" font-weight="800" font-size="9" fill="#EF4444" text-anchor="middle" letter-spacing="1" opacity="0.85">AGED LIKE MILK 🥛</text>
      </g>
    `;
  } else if (isCorrect) {
    // Emerald green verified stamp
    stampHtml = `
      <g transform="translate(420, 260) rotate(-12)">
        <rect x="-100" y="-35" width="200" height="70" rx="10" fill="none" stroke="#10B981" stroke-width="4" stroke-dasharray="2,2" opacity="0.85" />
        <rect x="-96" y="-31" width="192" height="62" rx="8" fill="none" stroke="#10B981" stroke-width="2" opacity="0.85" />
        <text x="0" y="-4" font-family="'Space Grotesk', sans-serif" font-weight="900" font-size="16" fill="#10B981" text-anchor="middle" opacity="0.85">AGED LIKE WINE</text>
        <text x="0" y="16" font-family="'JetBrains Mono', monospace" font-weight="800" font-size="9" fill="#10B981" text-anchor="middle" letter-spacing="1" opacity="0.85">🍷 100% CORRECT</text>
      </g>
    `;
  } else {
    // Pending yellow/orange stamp
    stampHtml = `
      <g transform="translate(420, 260) rotate(-8)">
        <rect x="-100" y="-35" width="200" height="70" rx="10" fill="none" stroke="#F59E0B" stroke-width="4" opacity="0.8" />
        <text x="0" y="2" font-family="'Space Grotesk', sans-serif" font-weight="900" font-size="15" fill="#F59E0B" text-anchor="middle">ACTIVE ORACLE</text>
        <text x="0" y="18" font-family="'JetBrains Mono', monospace" font-weight="800" font-size="9" fill="#F59E0B" text-anchor="middle" letter-spacing="1">⏳ UNRESOLVED</text>
      </g>
    `;
  }

  // Safe check bold predictions
  const boldList = Array.isArray(pred.boldPredictions) ? pred.boldPredictions : [];
  let boldLines = "";
  boldList.slice(0, 2).forEach((bp, idx) => {
    const truncatedBp = bp.length > 36 ? bp.substring(0, 34) + "..." : bp;
    boldLines += `<text x="80" y="${460 + idx * 25}" class="mono" font-size="12">• ${truncatedBp.toUpperCase()}</text>`;
  });

  const barcodeLines = renderSvgBarcode(190, 620, 45, id);

  return `
    <svg width="600" height="800" viewBox="0 0 600 800" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style type="text/css">
          @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700;900&amp;family=JetBrains+Mono:wght@500;800&amp;display=swap');
          .title { font-family: 'Space Grotesk', sans-serif; font-weight: 900; fill: #1c1917; }
          .mono { font-family: 'JetBrains Mono', monospace; font-weight: 500; fill: #2c2927; }
          .mono-bold { font-family: 'JetBrains Mono', monospace; font-weight: 800; fill: #1c1917; }
          .mono-muted { font-family: 'JetBrains Mono', monospace; font-weight: 500; fill: #78716c; }
        </style>
      </defs>
      
      <!-- Dark container border/background -->
      <rect width="600" height="800" fill="#0c0a09" />
      
      <!-- Inner decorative strobe lights for social design -->
      <rect x="15" y="15" width="570" height="770" fill="none" stroke="${isWrong ? '#EF4444' : isCorrect ? '#10B981' : '#F59E0B'}" stroke-width="4" rx="10" />

      <!-- Thermal Paper Background -->
      <g transform="translate(40, 40)">
        <!-- Paper Shadow -->
        <rect x="4" y="4" width="512" height="712" rx="4" fill="#000000" opacity="0.5" />
        <!-- Paper Body -->
        <rect width="512" height="712" rx="4" fill="${paperBg}" />

        <!-- Thermal scalloped edges top and bottom -->
        <path d="M 0,0 L 512,0" stroke="${borderStroke}" stroke-width="4" stroke-dasharray="10,10" />
        <path d="M 0,712 L 512,712" stroke="${borderStroke}" stroke-width="4" stroke-dasharray="10,10" />

        <!-- Header -->
        <text x="256" y="55" class="title" font-size="24" text-anchor="middle" letter-spacing="1">THE RECEIPT OF TRUTH</text>
        <text x="256" y="80" class="mono-bold" font-size="10" text-anchor="middle" opacity="0.8">*** IMMUTABLE FOOTBALL RECORD ***</text>

        <!-- Divider line -->
        <line x1="40" y1="105" x2="472" y2="105" stroke="${borderStroke}" stroke-width="2" stroke-dasharray="4,4" />

        <!-- Info details -->
        <text x="40" y="135" class="mono" font-size="12">TX STAMP:</text>
        <text x="140" y="135" class="mono-bold" font-size="12">ID-${id}</text>

        <text x="40" y="160" class="mono" font-size="12">TIME:</text>
        <text x="140" y="160" class="mono" font-size="12">${timestamp}</text>

        <text x="40" y="185" class="mono" font-size="12">NAME:</text>
        <text x="140" y="185" class="mono-bold" font-size="12" fill="#d97706">${name}</text>

        <text x="40" y="210" class="mono" font-size="12">CONFIDENCE:</text>
        <text x="140" y="210" class="mono-bold" font-size="12">${confidence}%</text>

        <!-- Divider line -->
        <line x1="40" y1="235" x2="472" y2="235" stroke="${borderStroke}" stroke-width="2" />

        <!-- QTY DESC HEADERS -->
        <text x="40" y="255" class="mono-bold" font-size="11">QTY DESCRIPTION</text>
        <text x="472" y="255" class="mono-bold" font-size="11" text-anchor="end">VAL</text>
        <line x1="40" y1="265" x2="472" y2="265" stroke="${borderStroke}" stroke-width="1" stroke-dasharray="2,2" />

        <!-- Prediction block -->
        <text x="40" y="295" class="mono-bold" font-size="12">1 x PROPHECY MATCHUP</text>
        <text x="472" y="295" class="mono-bold" font-size="12" text-anchor="end">${isWrong ? 'FAIL' : 'OK'}</text>
        <text x="60" y="320" class="mono-bold" font-size="14" fill="#000000">${getMatchHeadline(pred).toUpperCase()}</text>
        <text x="60" y="342" class="mono-muted" font-size="12">${summary.toUpperCase()}</text>

        <!-- Bold specs -->
        <text x="40" y="380" class="mono-bold" font-size="12">1 x OUTCOME PARLAYS ACTIVE</text>
        <text x="472" y="380" class="mono-bold" font-size="12" text-anchor="end">OK</text>
        <line x1="60" y1="395" x2="452" y2="395" stroke="${borderStroke}" stroke-width="0.5" stroke-dasharray="2,2" />
        
        <!-- Render bold bullet points -->
        ${boldLines || '<text x="80" y="420" class="mono-muted" font-size="12">• NO PARLAY ADDONS ATTACHED</text>'}

        <!-- Stamp injection -->
        ${stampHtml}

        <line x1="40" y1="520" x2="472" y2="520" stroke="${borderStroke}" stroke-width="2" />
        
        <!-- Main liability block -->
        <text x="40" y="550" class="mono-bold" font-size="13">TOTAL LIABILITY:</text>
        <text x="472" y="550" class="mono-bold" font-size="14" text-anchor="end">${pred.isGolden ? 'GOLD PREMIUM' : 'VERIFIED PROOF'}</text>
        <text x="40" y="575" class="mono-muted" font-size="10">IMMUTABLE LOGGED UNDER CRYPTOGRAPHIC LOGIC UNIT 2026</text>

        <!-- Barcode background block -->
        <rect x="150" y="610" width="212" height="65" fill="#ffffff" opacity="0" />
        
        <!-- Barcode line render -->
        ${barcodeLines}
        
        <text x="256" y="688" class="mono-bold" font-size="10" text-anchor="middle">*ID-${id}*</text>
        <text x="256" y="702" class="mono-muted" font-size="8" text-anchor="middle">DO NOT ATTEMPT TO RECONSTRUCT HISTORY</text>
      </g>
    </svg>
  `;
}

// REST route to serve dynamic prediction receipt image
app.get(["/api/receipt-image", "/api/receipt-image/receipt.png"], async (req, res) => {
  const r = req.query.r;
  if (!r) {
    return res.status(400).send("Missing prediction details");
  }
  const pred = decodePredictionSafe(String(r));
  if (!pred) {
    return res.status(404).send("Invalid prediction payload");
  }
  
  const svg = generateReceiptSvg(pred);
  const format = req.query.format || 'png';
  
  if (format === 'svg') {
    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return res.send(svg);
  }
  
  try {
    const svgBuffer = Buffer.from(svg);
    const pngBuffer = await sharp(svgBuffer)
      .png()
      .toBuffer();
    
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return res.send(pngBuffer);
  } catch (err) {
    console.error("Failed to convert SVG to PNG using sharp, falling back to SVG", err);
    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return res.send(svg);
  }
});

// Capture ROOT request before Vite to output custom metadata crawl cards!
app.get("/", async (req, res, next) => {
  const r = req.query.r;
  if (!r) {
    return next();
  }
  
  const pred = decodePredictionSafe(String(r));
  if (!pred) {
    return next();
  }
  
  try {
    const host = req.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    
    // Escape quote values safely for HTML structures
    const nameUpper = (pred.name || "Anonymous").toUpperCase().replace(/"/g, '&quot;');
    const summary = (getMatchHeadline(pred) + " Prediction").replace(/"/g, '&quot;');
    
    const absoluteImageUrl = `${protocol}://${host}/api/receipt-image/receipt.png?r=${encodeURIComponent(String(r))}`;
    const absolutePageUrl = `${protocol}://${host}/?r=${encodeURIComponent(String(r))}`;
    
    const metaTags = `
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${absolutePageUrl}" />
    <meta property="og:title" content="Receipt of Truth: ${nameUpper}'s Prediction" />
    <meta property="og:description" content="Did this World Cup 2026 prediction age like wine 🍷 or spoil like milk 🥛? Tap to inspect the verified record card!" />
    <meta property="og:image" content="${absoluteImageUrl}" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="600" />
    <meta property="og:image:height" content="800" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${absolutePageUrl}" />
    <meta name="twitter:title" content="Receipt of Truth: ${nameUpper}'s Locked-In Prophecy" />
    <meta name="twitter:description" content="Did this World Cup 2026 prediction age like wine 🍷 or spoil like milk 🥛? Tap to inspect the verified record card!" />
    <meta name="twitter:image" content="${absoluteImageUrl}" />
    `;

    let html = "";
    if (process.env.NODE_ENV !== "production" && viteInstance) {
      const rawHtml = fs.readFileSync(path.join(process.cwd(), "index.html"), "utf-8");
      html = await viteInstance.transformIndexHtml(req.originalUrl || req.url, rawHtml);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      html = fs.readFileSync(path.join(distPath, "index.html"), "utf-8");
    }

    // Insert metatags seamlessly into index.html
    html = html.replace("<head>", `<head>${metaTags}`);
    
    res.setHeader("Content-Type", "text/html");
    return res.send(html);
  } catch (err) {
    console.error("Failed to dynamically inject meta tags:", err);
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

setupVite().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Full-stack server online at http://0.0.0.0:${PORT}`);
  });
});
