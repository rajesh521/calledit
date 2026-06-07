import React, { useState, useRef, useEffect } from 'react';
import { Download, Share2, Copy, Sparkles, Check, Twitter, ArrowLeft, ArrowUpRight, Award, Coffee, Eye, Bell, RefreshCw, Flame, HelpCircle, RefreshCcw, Smile, ShieldAlert } from 'lucide-react';
import { Prediction } from '../types';
import { getMatchLabel, encodePrediction, calculateViralIndicators, WORLD_CUP_MATCHES } from '../data';
import CheckoutUpsell from './CheckoutUpsell';

interface ReceiptViewProps {
  key?: React.Key;
  prediction: Prediction;
  locale: string;
  onBackToEdit: () => void;
  onUpgradeClick: (customText?: string, amount?: number) => void;
  onBurnClick?: () => void;
  onTipClick: (amount: number) => void;
  onChallenge: (counterPrediction: Prediction) => void;
  t?: (key: string) => string;
}

interface RoastLine {
  text: string;
  level: 'clean' | 'light' | 'savage';
}

const ROAST_LINES: RoastLine[] = [
  // Clean roasts
  { text: "The vision was clear. The result was not.", level: 'clean' },
  { text: "This prophecy has been officially retired.", level: 'clean' },
  { text: "The crowd believed. The scoreboard disagreed.", level: 'clean' },
  { text: "We regret to inform you that reality had other plans.", level: 'clean' },
  { text: "A brave effort, but the mathematics of football had other ideas.", level: 'clean' },
  { text: "The prediction looked good on paper. Sadly, paper doesn't play.", level: 'clean' },
  { text: "VAR checked. Prediction missed by a whisker.", level: 'clean' },
  
  // Light roast (Default)
  { text: "Confidence was high. Accuracy was not.", level: 'light' },
  { text: "The football gods said no.", level: 'light' },
  { text: "This take needs a timeout.", level: 'light' },
  { text: "VAR checked. Reality confirmed. Wrong.", level: 'light' },
  { text: "The receipt survived. The prediction didn't.", level: 'light' },
  { text: "Bold take. Brutal outcome.", level: 'light' },
  { text: "The football gods reviewed your application and declined.", level: 'light' },
  { text: "Confidence level: 99%. Accuracy level: under investigation.", level: 'light' },
  { text: "You called it. Unfortunately, nobody answered.", level: 'light' },
  { text: "This take has been relegated.", level: 'light' },
  { text: "Your crystal ball may require a software update.", level: 'light' },
  { text: "Certified Cold Take™. Better luck next kickoff.", level: 'light' },
  
  // Savage roasts
  { text: "This prediction entered the match confident and left on a stretcher.", level: 'savage' },
  { text: "Prediction status: Sent to the shadow realm.", level: 'savage' },
  { text: "That aged faster than milk in the summer sun.", level: 'savage' },
  { text: "This receipt is now a historical artifact of overconfidence.", level: 'savage' },
  { text: "The prediction looked dangerous. Mostly to itself.", level: 'savage' },
  { text: "An ambitious forecast. A memorable collapse.", level: 'savage' },
  { text: "We checked the tape. It somehow got worse.", level: 'savage' },
  { text: "Bold prediction. Brutal reality.", level: 'savage' },
  { text: "Delete this before your friends find your account.", level: 'savage' },
  { text: "Please consult an optometrist before your next prediction.", level: 'savage' }
];

const FAILURE_LABELS = [
  "Aged Like Milk",
  "Receipt Rejected",
  "Prediction Missed",
  "Cold Take",
  "Confidence: Overcooked",
  "Called It Wrong",
  "This Did Not Age Well"
];

export default function ReceiptView({
  prediction,
  locale,
  onBackToEdit,
  onUpgradeClick,
  onBurnClick,
  onTipClick,
  onChallenge,
  t = (k) => k
}: ReceiptViewProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<'receipt' | 'social'>('receipt');
  const [reminded, setReminded] = useState(false);
  const [simulatedStatus, setSimulatedStatus] = useState<'pending' | 'correct' | 'incorrect'>(prediction.status || 'pending');
  const [displayOutcome, setDisplayOutcome] = useState<'right' | 'wrong'>(prediction.status === 'incorrect' ? 'wrong' : 'right');
  const [roastLevel, setRoastLevel] = useState<'clean' | 'light' | 'savage'>('light');
  const [selectedFailureLabel, setSelectedFailureLabel] = useState<string>('Aged Like Milk');
  const [customActualResult, setCustomActualResult] = useState<string>('');
  const [roastIndex, setRoastIndex] = useState<number>(0);
  
  const receiptRef = useRef<HTMLDivElement>(null);

  // Derive viral attributes safely
  const numScoreA = parseInt(prediction.predictedScoreA) || 0;
  const numScoreB = parseInt(prediction.predictedScoreB) || 0;
  const indicators = calculateViralIndicators(numScoreA, numScoreB);

  const hotTake = prediction.hotTakeLabel || indicators.hotTakeLabel;
  const consensus = prediction.consensus !== undefined ? prediction.consensus : indicators.consensus;
  const ragePotential = prediction.ragePotential !== undefined ? prediction.ragePotential : indicators.ragePotential;
  const confidence = prediction.confidence || 80;

  // Sync state whenever the prediction changes (e.g., when clicking "Shame them" on global wall)
  useEffect(() => {
    const defaultStatus = prediction.status || 'pending';
    setSimulatedStatus(defaultStatus);
    setDisplayOutcome(defaultStatus === 'incorrect' ? 'wrong' : 'right');
    setRoastIndex(Math.floor(Math.random() * 5));
    
    // Set typical fallback outcome
    const typeStr = prediction.predictionType || 'match';
    if (prediction.outcomeScoreA !== undefined && prediction.outcomeScoreB !== undefined) {
      setCustomActualResult(`${prediction.outcomeScoreA} - ${prediction.outcomeScoreB}`);
    } else if (typeStr === 'match') {
      const pA = parseInt(prediction.predictedScoreA) || 0;
      const pB = parseInt(prediction.predictedScoreB) || 0;
      setCustomActualResult(`${pB} - ${pA + 1}`); // Opposite/different score
    } else if (typeStr === 'player') {
      setCustomActualResult(`0 goals / went missing`);
    } else if (typeStr === 'team') {
      setCustomActualResult(`Eliminated in Groups`);
    } else {
      setCustomActualResult(`Reality said absolutely not`);
    }
  }, [prediction.id, prediction.status]);

  // Handle outcome toggle
  const handleOutcomeChange = (mode: 'right' | 'wrong') => {
    setDisplayOutcome(mode);
    if (mode === 'wrong' && simulatedStatus === 'pending') {
      // Temporarily simulate incorrect to sync stamps
      setSimulatedStatus('incorrect');
    } else if (mode === 'right' && simulatedStatus === 'incorrect' && !prediction.status) {
      setSimulatedStatus('pending');
    }
  };

  // Safe wrapper for roasts filter
  const activeRoasts = ROAST_LINES.filter(r => r.level === roastLevel);
  const currentRoast = activeRoasts[roastIndex % activeRoasts.length]?.text || "Reality had other plans.";

  // Calculate prediction string summary
  const getPredictionSummary = () => {
    const typeStr = prediction.predictionType || 'match';
    if (typeStr === 'match') {
      return `${getMatchLabel(prediction).replace(/^[^\s]+\s*/, '')}: Predicted ${prediction.predictedScoreA}-${prediction.predictedScoreB}`;
    } else if (typeStr === 'player') {
      return `${prediction.playerName} to get ${prediction.playerValue} ${prediction.playerMarket}`;
    } else if (typeStr === 'team') {
      return `${prediction.teamName} -> ${prediction.teamMarket}`;
    } else {
      return prediction.customTakeText || "Custom Prophecy Take";
    }
  };

  // Get miss tier classification
  const getMissTierAndColor = () => {
    if (selectedFailureLabel === 'Cold Take') {
      return { tier: 'Cold Take', color: 'bg-yellow-400 text-black border-2 border-black', text: '🟡 Cold Take (Close)' };
    }
    if (confidence >= 95 || prediction.isGolden) {
      return { tier: 'Hall of Shame', color: 'bg-red-950 text-red-500 border-2 border-red-500 font-mono animate-pulse', text: '☠️ Hall of Shame (Legendary Miss)' };
    }
    const typeStr = prediction.predictionType || 'match';
    if (typeStr === 'match') {
      const predDiff = Math.abs(numScoreA - numScoreB);
      if (predDiff >= 3) {
        return { tier: 'Aged Like Milk', color: 'bg-red-500 text-white border-2 border-black', text: '🔴 Aged Like Milk (Disaster)' };
      }
    }
    return { tier: 'Frozen Receipt', color: 'bg-orange-500 text-white border-2 border-black', text: '🟠 Frozen Receipt (Way Off)' };
  };

  const missTier = getMissTierAndColor();

  // Deep Link reconstruction URL including sharing state metadata
  const shareUrl = `${window.location.origin}${window.location.pathname}?r=${encodePrediction({
    ...prediction,
    status: displayOutcome === 'wrong' ? 'incorrect' : 'correct'
  })}`;

  const imageUrl = `${window.location.origin}/api/receipt-image/receipt.png?r=${encodeURIComponent(encodePrediction({
    ...prediction,
    status: displayOutcome === 'wrong' ? 'incorrect' : simulatedStatus === 'correct' ? 'correct' : 'pending'
  }))}&locale=${locale}`;

  const handleBurnEvidence = async () => {
    if (!prediction.id) return;
    try {
      await fetch('/api/burn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ predictionId: prediction.id })
      });
    } catch (e) {
      // Optimistically continue
    }
    if (onBurnClick) onBurnClick();
    else onUpgradeClick();
  };

  const getViralShareText = () => {
    const pSummary = getPredictionSummary();
    const nameUpper = prediction.name.trim() ? prediction.name.toUpperCase() : 'ANONYMOUS';
    
    if (displayOutcome === 'wrong') {
      return `❌ YOU CALLED IT… WRONG! 🥛
----------------------------------------
🧾 THE RECEIPT OF TRUTH: REJECTED STATE
----------------------------------------
👤 NAME: ${nameUpper}
🎯 PROPHECY TAKE: ${pSummary}
🏆 REALITY SCORE: ${customActualResult || 'FAILED'}
🥛 VERDICT TIER: ${missTier.tier.toUpperCase()}
🔥 VERDICT ROAST: "${currentRoast}"

👉 Print your own immutable receipt of truth or roast my prediction here:
🔗 ${shareUrl}`;
    } else {
      const maturityStatus = simulatedStatus === 'correct' ? '🍷 MATURED: IMMUNE TO REVISIONISM (AGED LIKE WINE)' : '⏳ PRE-MATCH PREDICTION';
      return `🧾 THE RECEIPT OF TRUTH
----------------------------------------
✨ ${maturityStatus} ✨
----------------------------------------
👤 NAME: ${nameUpper}
🎯 PROPHECY: ${pSummary}
🔥 CONFIDENCE: ${confidence}%
🚀 TAKE TIER: ${hotTake} TAKE

👉 Lock in your own immutable receipt of truth before kickoff:
🔗 ${shareUrl}`;
    }
  };

  const handleCopyLink = async () => {
    try {
      const viralText = getViralShareText();
      await navigator.clipboard.writeText(viralText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy link', err);
    }
  };

  const handleShareTwitter = () => {
    const pSummary = getPredictionSummary();
    const nameUpper = prediction.name.trim() ? prediction.name.toUpperCase() : 'ANONYMOUS';
    let customText = "";
    if (displayOutcome === 'wrong') {
      customText = `OMG, my World Cup prediction aged like milk 🥛.

👤 NAME: ${nameUpper}
🎯 PROPHECY: ${pSummary}
🔥 VERDICT: "${currentRoast}"

Lock in yours or roast me here:`;
    } else if (simulatedStatus === 'correct') {
      customText = `Aged like absolute wine 🍷. Behold my verified immune-to-revisionism proof:

👤 NAME: ${nameUpper}
🎯 PROPHECY: ${pSummary}

Lock in yours before kickoff:`;
    } else {
      customText = `Just locked in my Prediction Receipt for the World Cup on The Receipt of Truth. 

👤 NAME: ${nameUpper}
🎯 PROPHECY: ${pSummary}
🔥 CONFIDENCE: ${confidence}%

Lock in yours before kickoff:`;
    }
    const hashtags = 'ReceiptOfTruth,WorldCup,Banter';
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(customText)}&url=${encodeURIComponent(shareUrl)}&hashtags=${encodeURIComponent(hashtags)}`, '_blank');
  };

  // Opposite counterprediction challenge
  const handleChallengeCounter = () => {
    const typeStr = prediction.predictionType || 'match';
    const reversedScoreA = prediction.predictedScoreB;
    const reversedScoreB = prediction.predictedScoreA;
    
    let counterPredType = typeStr;
    let counterPlayerName = prediction.playerName;
    let counterPlayerMarket = prediction.playerMarket;
    let counterPlayerValue = prediction.playerValue;
    let counterTeamName = prediction.teamName;
    let counterTeamMarket = prediction.teamMarket;
    let counterCustomTakeText = prediction.customTakeText;

    if (typeStr === 'player') {
      counterPlayerMarket = `${prediction.playerMarket || 'total goals'} (CHOKED / UNDER)`;
      const currentValNum = parseInt(prediction.playerValue || '0');
      counterPlayerValue = currentValNum > 0 ? String(Math.max(1, Math.floor(currentValNum / 2))) : '0';
    } else if (typeStr === 'team') {
      counterTeamMarket = `${prediction.teamMarket || 'wins'} (FAILED)`;
    } else if (typeStr === 'custom') {
      counterCustomTakeText = `Challenging "${prediction.name || 'User'}"'s take: This will fail completely.`;
    }

    const counterPrediction: Prediction = {
      ...prediction,
      id: `CHALLENGE-${Math.floor(1000 + Math.random() * 9000)}`,
      name: `Challenger of ${prediction.name || 'Anonymous'}`,
      predictedScoreA: reversedScoreA,
      predictedScoreB: reversedScoreB,
      firstGoalscorer: typeStr === 'player' ? (prediction.playerName || 'Messi') : 'Counter Scorer',
      boldPredictions: ['Opponent take is certified milk', 'Absolute lock on reality'],
      status: undefined,
      timestamp: new Date().toLocaleDateString(),
      predictionType: counterPredType,
      playerName: counterPlayerName,
      playerMarket: counterPlayerMarket,
      playerValue: counterPlayerValue,
      teamName: counterTeamName,
      teamMarket: counterTeamMarket,
      customTakeText: counterCustomTakeText
    };

    onChallenge(counterPrediction);
  };

  // Helper utility for wrapping text on Canvas
  const wrapTextOnCanvas = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
    return currentY;
  };

  // HTML Canvas Exporter - Supporting Right & Wrong outputs for Social/Thermal!
  const handleDownloadPNG = async () => {
    setDownloading(true);
    
    if (activeTab === 'social') {
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        const downloadLink = document.createElement('a');
        downloadLink.href = blobUrl;
        downloadLink.download = `receipt_of_brag_${prediction.id.toLowerCase()}_${displayOutcome}_social.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(blobUrl);
      } catch (e) {
        console.error('Failed to download backend social card PNG directly:', e);
      } finally {
        setDownloading(false);
      }
      return;
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 1050;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      setDownloading(false);
      return;
    }

    try {
      if (displayOutcome === 'wrong') {
        // ==========================================
        //  DRAW POST-FAILURE "YOU CALLED IT... WRONG" COMEDY CARD
        // ==========================================
        if (activeTab === 'social') {
          // Dark brutal slate canvas
          ctx.fillStyle = '#09090b';
          ctx.fillRect(0, 0, 640, 1050);

          // Danger strobe lights
          ctx.strokeStyle = '#EF4444';
          ctx.lineWidth = 14;
          ctx.strokeRect(20, 20, 600, 1010);

          // Warning zebra lines header
          ctx.fillStyle = '#EF4444';
          for (let i = 0; i < 12; i++) {
            ctx.beginPath();
            ctx.moveTo(30 + i * 50, 20);
            ctx.lineTo(60 + i * 50, 20);
            ctx.lineTo(20 + i * 50, 70);
            ctx.lineTo(-10 + i * 50, 70);
            ctx.closePath();
            ctx.fill();
          }

          // Header
          ctx.fillStyle = '#FFFFFF';
          ctx.textAlign = 'center';
          ctx.font = '900 36px "Space Grotesk", sans-serif';
          ctx.fillText('YOU CALLED IT... WRONG', 320, 140);

          // Failure Label Badge
          ctx.fillStyle = '#EF4444';
          ctx.fillRect(170, 180, 300, 44);
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 18px monospace';
          ctx.fillText(selectedFailureLabel.toUpperCase(), 320, 208);

          // Prediction Summary Box
          ctx.fillStyle = '#18181b';
          ctx.fillRect(50, 260, 540, 150);
          ctx.strokeStyle = '#3f3f46';
          ctx.lineWidth = 3;
          ctx.strokeRect(50, 260, 540, 150);

          ctx.textAlign = 'left';
          ctx.fillStyle = '#a1a1aa';
          ctx.font = 'bold 12px monospace';
          ctx.fillText('YOUR SO-CALLED PROPHECY:', 70, 295);
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '900 20px "Space Grotesk", sans-serif';
          const pSummary = getPredictionSummary();
          wrapTextOnCanvas(ctx, pSummary, 70, 330, 500, 28);

          // Actual Reality Box
          ctx.fillStyle = '#450a0a';
          ctx.fillRect(50, 440, 540, 155);
          ctx.strokeStyle = '#991b1b';
          ctx.strokeRect(50, 440, 540, 155);

          ctx.textAlign = 'left';
          ctx.fillStyle = '#fca5a5';
          ctx.font = 'bold 12px monospace';
          ctx.fillText('REALITY SCOREBOARD:', 70, 475);
          ctx.fillStyle = '#EF4444';
          ctx.font = '900 24px "Space Grotesk", sans-serif';
          ctx.fillText((customActualResult || 'FAILED').toUpperCase(), 70, 515);
          ctx.fillStyle = '#fca5a5';
          ctx.font = 'bold 12px monospace';
          ctx.fillText(`Mismatured outcome recorded under UTC logic`, 70, 555);

          // Verdict Section
          ctx.fillStyle = '#18181b';
          ctx.fillRect(50, 630, 540, 190);
          ctx.strokeStyle = '#f59e0b';
          ctx.strokeRect(50, 630, 540, 190);

          ctx.textAlign = 'center';
          ctx.fillStyle = '#f59e0b';
          ctx.font = 'bold 14px monospace';
          ctx.fillText(`VERDICT TIER: ${missTier.tier.toUpperCase()} (${roastLevel.toUpperCase()})`, 320, 665);
          
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold italic 20px "Space Grotesk", sans-serif';
          wrapTextOnCanvas(ctx, `"${currentRoast}"`, 320, 715, 480, 28);

          // Stamp watermark
          ctx.save();
          ctx.translate(500, 920);
          ctx.rotate(-0.15);
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.lineWidth = 4;
          ctx.strokeRect(-90, -30, 180, 60);
          ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.font = '900 14px "Space Grotesk", sans-serif';
          ctx.fillText('SPOILED MILK', 0, 5);
          ctx.restore();

          // Footer info
          ctx.fillStyle = '#52525b';
          ctx.textAlign = 'center';
          ctx.font = 'bold 11px monospace';
          ctx.fillText(`IMMUTABLE RECEIPT ID: ROT-${prediction.id}`, 320, 880);
          ctx.fillText(`PROPHECY LOG DATE: ${prediction.timestamp}`, 320, 905);
          ctx.fillText(`LEVEL OF CONFIDENCE WAS: ${confidence}%`, 320, 930);
          ctx.fillText(`DO NOT ATTEMPT TO REWRITE HISTORY`, 320, 955);
        } else {
          // Thermal receipt with huge rejected stamps
          ctx.fillStyle = '#fbfaf5';
          ctx.fillRect(0, 0, 640, 1050);

          // Borders
          ctx.fillStyle = '#eae7dd';
          ctx.fillRect(0, 0, 8, 1050);
          ctx.fillRect(632, 0, 8, 1050);

          ctx.fillStyle = '#1c1917';
          for (let x = 0; x < 640; x += 16) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x + 8, 10);
            ctx.lineTo(x + 16, 0);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(x, 1050);
            ctx.lineTo(x + 8, 1040);
            ctx.lineTo(x + 16, 1050);
            ctx.closePath();
            ctx.fill();
          }

          ctx.fillStyle = '#1e1c16';
          ctx.textAlign = 'center';
          ctx.font = '900 36px monospace';
          ctx.fillText('THE RECEIPT OF TRUTH', 320, 90);

          ctx.font = '900 14px monospace';
          ctx.fillText('*** PREDICTOR RECOVERY SLIP ***', 320, 130);

          ctx.textAlign = 'left';
          ctx.font = 'bold 16px monospace';
          ctx.fillText(`TX STAMP ID-ROT-${prediction.id}`, 80, 180);
          ctx.fillText(`TIME: ${prediction.timestamp}`, 80, 210);
          ctx.fillText(`NAME: ${prediction.name.toUpperCase()}`, 80, 240);
          ctx.fillText(`VERDICT TIER: ${missTier.tier.toUpperCase()}`, 80, 270);

          ctx.fillText('========================================', 85, 310);
          ctx.fillText('QTY DESCRIPTION                      VAL', 85, 340);
          ctx.fillText('----------------------------------------', 85, 365);

          ctx.fillText('1 x UNCORRECTED CLAIM                FAIL', 85, 400);
          ctx.font = '900 15px monospace';
          const pSum = getPredictionSummary();
          ctx.fillText(`    EXPECTED: ${pSum.substring(0, 28).toUpperCase()}`, 85, 430);
          if (pSum.length > 28) {
            ctx.fillText(`    ${pSum.substring(28, 56).toUpperCase()}`, 85, 455);
          }

          ctx.font = 'bold 16px monospace';
          ctx.fillText('1 x ACTUAL VERIFIED OUTCOME          CHOKE', 85, 500);
          ctx.font = '900 18px monospace';
          ctx.fillText(`    REALITY: ${(customActualResult || 'FAILED').toUpperCase()}`, 85, 530);

          ctx.font = 'bold 16px monospace';
          ctx.fillText('1 x SYSTEM ROAST LEVEL VERDICT       OK', 85, 580);
          ctx.font = '900 15px monospace';
          wrapTextOnCanvas(ctx, `"${currentRoast.toUpperCase()}"`, 115, 615, 420, 22);

          // Large diag reject stamp
          ctx.save();
          ctx.translate(460, 480);
          ctx.rotate(-0.25);
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
          ctx.lineWidth = 5;
          ctx.strokeRect(-120, -40, 240, 80);
          ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
          ctx.font = '900 24px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('REJECTED', 0, 5);
          ctx.font = 'bold 12px monospace';
          ctx.fillText(selectedFailureLabel.toUpperCase(), 0, 25);
          ctx.restore();

          ctx.font = 'bold 16px monospace';
          ctx.fillText('----------------------------------------', 85, 780);
          ctx.fillText(`STATUS:                    SPOILED COMEDY`, 85, 810);
          ctx.fillText('========================================', 85, 840);

          // Barcodes
          ctx.fillStyle = '#1e1c16';
          for (let i = 0; i < 46; i++) {
            const seed = (i * 3 + prediction.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % 6;
            const widths = [2, 4, 6, 2, 8, 3];
            const color = seed >= 4 ? 'rgba(0,0,0,0)' : '#1e1c16';
            ctx.fillStyle = color;
            ctx.fillRect(140 + i * 8, 875, widths[seed], 50);
          }

          ctx.textAlign = 'center';
          ctx.font = 'bold 12px monospace';
          ctx.fillText(`*ROT-WRONG-SHAME*`, 320, 945);
          ctx.fillText('IMMUTABLE HISTORIC COLLAPSE LOGGED', 320, 975);
        }
      } else {
        // ==========================================
        //  DRAW REGULAR (RIGHT / BRAG) CARD LAYOUT
        // ==========================================
        if (activeTab === 'social') {
          ctx.fillStyle = '#0a0a0a';
          ctx.fillRect(0, 0, 640, 1050);

          const glowRad = ctx.createRadialGradient(320, 525, 40, 320, 525, 450);
          if (simulatedStatus === 'correct') {
            glowRad.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
            glowRad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          } else {
            glowRad.addColorStop(0, 'rgba(241, 196, 15, 0.2)');
            glowRad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          }
          ctx.fillStyle = glowRad;
          ctx.fillRect(0, 0, 640, 1050);

          ctx.strokeStyle = '#F1C40F';
          ctx.lineWidth = 14;
          ctx.strokeRect(20, 20, 600, 1010);

          ctx.textAlign = 'center';
          ctx.fillStyle = '#888888';
          ctx.font = 'bold 16px monospace';
          ctx.fillText(simulatedStatus === 'correct' ? 'VERIFIED MATURED RECEIPT' : 'LOCKED PRE-MATCH PREDICTION', 320, 90);

          const badgeColor = hotTake === 'NUCLEAR' ? '#EF4444' : hotTake === 'HOT' ? '#F97316' : '#71717A';
          ctx.fillStyle = badgeColor;
          ctx.fillRect(200, 130, 240, 50);
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '900 20px "Space Grotesk", sans-serif';
          ctx.fillText(`${hotTake} TAKE`, 320, 162);

          ctx.fillStyle = '#FFFFFF';
          ctx.font = '900 24px monospace';
          ctx.fillText('THE RECEIPT OF TRUTH', 320, 250);

          ctx.font = '900 36px "Space Grotesk", sans-serif';
          const typeStr = prediction.predictionType || 'match';
          if (typeStr === 'match') {
            ctx.fillText(getMatchLabel(prediction).replace(/^[^\s]+\s*/, ''), 320, 310);
          } else if (typeStr === 'player') {
            ctx.fillText(`PLAYER: ${(prediction.playerName || 'Messi').toUpperCase()}`, 320, 310);
          } else if (typeStr === 'team') {
            ctx.fillText(`TEAM: ${(prediction.teamName || 'Brazil').toUpperCase()}`, 320, 310);
          } else if (typeStr === 'custom') {
            ctx.fillText('WILD TAKE PROPHECY', 320, 310);
          }

          ctx.fillStyle = '#171717';
          ctx.fillRect(80, 380, 480, 250);
          ctx.strokeStyle = '#333333';
          ctx.lineWidth = 4;
          ctx.strokeRect(80, 380, 480, 250);

          if (typeStr === 'match') {
            ctx.font = '900 130px "Space Grotesk", sans-serif';
            ctx.fillStyle = '#F1C40F';
            ctx.fillText(`${prediction.predictedScoreA} - ${prediction.predictedScoreB}`, 320, 530);

            ctx.font = 'bold 18px monospace';
            ctx.fillStyle = '#CCCCCC';
            ctx.fillText(`SCORER: ${prediction.firstGoalscorer.toUpperCase()}`, 320, 595);
          } else if (typeStr === 'player') {
            ctx.fillStyle = '#F1C40F';
            ctx.font = 'bold 18px monospace';
            ctx.fillText('TARGET STAT LINE DETECTED', 320, 435);

            ctx.fillStyle = '#FFFFFF';
            ctx.font = '950 36px "Space Grotesk", sans-serif';
            ctx.fillText(`${prediction.playerName || ''}`, 320, 490);

            ctx.fillStyle = '#F1C40F';
            ctx.font = '900 28px "Space Grotesk", sans-serif';
            ctx.fillText(`${prediction.playerValue || '0'} ${prediction.playerMarket?.toUpperCase() || ''}`, 320, 550);
          } else if (typeStr === 'team') {
            ctx.fillStyle = '#F1C40F';
            ctx.font = 'bold 18px monospace';
            ctx.fillText('TEAM ACHIEVEMENT DETECTED', 320, 435);

            ctx.fillStyle = '#FFFFFF';
            ctx.font = '950 36px "Space Grotesk", sans-serif';
            ctx.fillText(`${prediction.teamName || ''}`, 320, 490);

            ctx.fillStyle = '#F1C40F';
            ctx.font = '900 22px monospace';
            ctx.fillText(`${prediction.teamMarket?.toUpperCase() || ''}`, 320, 550);
          } else if (typeStr === 'custom') {
            ctx.fillStyle = '#F1C40F';
            ctx.font = 'bold 18px monospace';
            ctx.fillText('WILD TRUTH SPELL CAST', 320, 435);

            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 18px monospace';
            const text = prediction.customTakeText || 'Custom Hot Take';
            wrapTextOnCanvas(ctx, text, 320, 495, 420, 24);
          }

          ctx.fillStyle = '#222222';
          ctx.fillRect(120, 670, 400, 54);
          ctx.fillStyle = '#FFFBD4';
          ctx.font = 'bold 18px monospace';
          ctx.fillText(`This fan is ${confidence}% confident.`, 320, 703);

          if (simulatedStatus === 'correct') {
            ctx.fillStyle = '#10B981';
            ctx.fillRect(80, 770, 480, 80);
            ctx.fillStyle = '#000000';
            ctx.font = '900 28px sans-serif';
            ctx.fillText('This aged like wine 🍷', 320, 820);
          } else {
            ctx.fillStyle = '#262626';
            ctx.fillRect(80, 770, 480, 80);
            ctx.fillStyle = '#F1C40F';
            ctx.font = '900 20px monospace';
            ctx.fillText('⏳ PENDING KICKOFF OUTCOME', 320, 818);
          }

          ctx.fillStyle = '#555555';
          ctx.font = 'bold 12px monospace';
          ctx.fillText(`TX EVENT ID-${prediction.id}`, 320, 920);
          ctx.fillText(`STAMP: NAME ${prediction.name.toUpperCase()}`, 320, 945);
          ctx.fillText(`MINT RECORD COPIED SECURELY`, 320, 970);
        } else {
          // Traditional thermal receipt
          if (prediction.isGolden) {
            const goldGrad = ctx.createLinearGradient(0, 0, 640, 1050);
            goldGrad.addColorStop(0, '#FFF5C3');
            goldGrad.addColorStop(0.3, '#F1C40F');
            goldGrad.addColorStop(0.6, '#D4AC0D');
            goldGrad.addColorStop(1, '#9A7D0A');
            ctx.fillStyle = goldGrad;
            ctx.fillRect(0, 0, 640, 1050);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            for (let i = -1000; i < 1000; i += 120) {
              ctx.beginPath();
              ctx.moveTo(i, 0);
              ctx.lineTo(i + 60, 0);
              ctx.lineTo(i + 400, 1050);
              ctx.lineTo(i + 340, 1050);
              ctx.closePath();
              ctx.fill();
            }

            ctx.strokeStyle = '#785F05';
            ctx.lineWidth = 14;
            ctx.strokeRect(15, 15, 610, 1020);
          } else {
            ctx.fillStyle = '#fbfaf5';
            ctx.fillRect(0, 0, 640, 1050);

            ctx.fillStyle = '#eae7dd';
            ctx.fillRect(0, 0, 8, 1050);
            ctx.fillRect(632, 0, 8, 1050);
          }

          const textFillStyle = prediction.isGolden ? '#2c2201' : '#1e1c16';
          ctx.fillStyle = textFillStyle;

          ctx.fillStyle = '#1c1917';
          for (let x = 0; x < 640; x += 16) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x + 8, 10);
            ctx.lineTo(x + 16, 0);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(x, 1050);
            ctx.lineTo(x + 8, 1040);
            ctx.lineTo(x + 16, 1050);
            ctx.closePath();
            ctx.fill();
          }

          ctx.fillStyle = textFillStyle;
          ctx.textAlign = 'center';
          ctx.font = '900 36px monospace';
          ctx.fillText('THE RECEIPT OF TRUTH', 320, 90);

          ctx.font = '900 14px monospace';
          ctx.fillText('*** IMMUTABLE FOOTBALL RECORD ***', 320, 130);

          ctx.textAlign = 'left';
          ctx.font = 'bold 16px monospace';
          ctx.fillText(`TX STAMP ID-${prediction.id}`, 80, 180);
          ctx.fillText(`TIME: ${prediction.timestamp}`, 80, 210);
          ctx.fillText(`NAME: ${prediction.name.toUpperCase()}`, 80, 240);
          ctx.fillText(`CONFIDENCE LEVEL: ${confidence}%`, 80, 270);

          ctx.fillText('========================================', 85, 310);
          ctx.fillText('QTY DESCRIPTION                      VAL', 85, 340);
          ctx.fillText('----------------------------------------', 85, 365);

          const typeStr = prediction.predictionType || 'match';

          if (typeStr === 'match') {
            ctx.fillText('1 x PREDICTOR FIXTURE                OK', 85, 400);
            ctx.font = '900 18px monospace';
            ctx.fillText(`    ${getMatchLabel(prediction).toUpperCase()}`, 85, 430);

            ctx.font = 'bold 16px monospace';
            ctx.fillText('1 x PREDICTED EXACT SCORE            OK', 85, 475);
            ctx.font = '900 24px monospace';
            ctx.fillText(`    ${prediction.predictedScoreA} - ${prediction.predictedScoreB}`, 85, 510);

            ctx.font = 'bold 16px monospace';
            ctx.fillText('1 x FIRST TOTAL GOALSCORER           OK', 85, 555);
            ctx.font = '900 18px monospace';
            ctx.fillText(`    ${prediction.firstGoalscorer.toUpperCase()}`, 85, 585);
          } else if (typeStr === 'player') {
            ctx.fillText('1 x PLAYER STAT PROPHECY             OK', 85, 400);
            ctx.font = '900 18px monospace';
            ctx.fillText(`    ${(prediction.playerName || 'Messi').toUpperCase()}`, 85, 430);

            ctx.font = 'bold 16px monospace';
            ctx.fillText('1 x MARKET STAT TARGET               OK', 85, 475);
            ctx.font = '900 18px monospace';
            ctx.fillText(`    ${(prediction.playerMarket || '').toUpperCase()}`, 85, 510);

            ctx.font = 'bold 16px monospace';
            ctx.fillText('1 x STAT TARGET VALUE                OK', 85, 555);
            ctx.font = '900 24px monospace';
            ctx.fillText(`    ${prediction.playerValue || ''}`, 85, 585);
          } else if (typeStr === 'team') {
            ctx.fillText('1 x TOURNAMENT TEAM STAMP            OK', 85, 400);
            ctx.font = '900 18px monospace';
            ctx.fillText(`    ${(prediction.teamName || 'Brazil').toUpperCase()}`, 85, 430);

            ctx.font = 'bold 16px monospace';
            ctx.fillText('1 x ACHIEVEMENT DESTINY              OK', 85, 475);
            ctx.font = '900 18px monospace';
            ctx.fillText(`    ${(prediction.teamMarket || '').toUpperCase()}`, 85, 510);
          } else {
            ctx.fillText('1 x WILD CUSTOM PROPHECY CAST        OK', 85, 400);
            ctx.font = '900 15px monospace';
            wrapTextOnCanvas(ctx, `"${prediction.customTakeText || 'Hot Take'}"`, 115, 430, 420, 22);
          }

          ctx.font = 'bold 16px monospace';
          ctx.fillText('1 x OUTCOME PARLAYS ACTIVE           OK', 85, 630);
          let bulletY = 660;
          prediction.boldPredictions.forEach((bp) => {
            ctx.font = 'bold 14px monospace';
            ctx.fillText(`  • ${bp.toUpperCase()}`, 85, bulletY);
            bulletY += 24;
          });

          if (simulatedStatus === 'correct') {
            ctx.save();
            ctx.translate(450, 460);
            ctx.rotate(-0.2);
            ctx.fillStyle = 'rgba(16, 185, 129, 0.85)';
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.85)';
            ctx.lineWidth = 4;
            ctx.strokeRect(-90, -35, 180, 70);
            ctx.font = '900 18px Courier, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('AGED LIKE WINE', 0, 0);
            ctx.font = 'bold 11px Courier';
            ctx.fillText('🍷 100% CORRECT', 0, 20);
            ctx.restore();
          }

          ctx.font = 'bold 16px monospace';
          ctx.fillText('----------------------------------------', 85, bulletY + 10);
          ctx.fillText(`TOTAL LIABILITY:               ${prediction.isGolden ? 'GOLD PREMIUM' : 'VERIFIED PROOF'}`, 85, bulletY + 40);
          ctx.fillText('========================================', 85, bulletY + 70);

          // Barcode drawing
          ctx.fillStyle = textFillStyle;
          const bY = bulletY + 100;
          for (let i = 0; i < 46; i++) {
            const seed = (i * 3 + prediction.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % 6;
            const widths = [2, 4, 6, 2, 8, 3];
            const color = seed >= 4 ? 'rgba(0,0,0,0)' : textFillStyle;
            ctx.fillStyle = color;
            ctx.fillRect(140 + i * 8, bY, widths[seed], 50);
          }

          ctx.textAlign = 'center';
          ctx.font = 'bold 12px monospace';
          ctx.fillText(`*ROT-${prediction.barcodeValue}*`, 320, bY + 74);
          ctx.fillText('DO NOT ATTEMPT TO RECONSTRUCT HISTORY', 320, bY + 110);
        }
      }

      // Convert and download png link
      const imageURL = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = imageURL;
      downloadLink.download = `receipt_of_truth_${prediction.id.toLowerCase()}_${displayOutcome}_${activeTab}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (e) {
      console.error('Failed drawing PNG image format', e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action rail */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <button
          onClick={onBackToEdit}
          className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-black bg-white border-2 border-black px-4 py-2.5 rounded-xl cursor-pointer hover:bg-stone-50 transition-all w-fit neo-shadow-sm"
        >
          <ArrowLeft size={14} className="stroke-[3]" /> Generate Another Receipt
        </button>
        
        <div className="flex gap-2">
          {/* Challenge Loop Button */}
          <button
            onClick={handleChallengeCounter}
            className="flex items-center gap-1.5 text-xs font-black uppercase text-white bg-red-650 hover:bg-red-500 border-2 border-black px-4 py-2.5 rounded-xl cursor-pointer neo-shadow-sm transition-all"
          >
            ⚔️ Challenge this prediction
          </button>

          {!prediction.isGolden && (
            <button
              onClick={onUpgradeClick}
              className="flex items-center gap-1.5 text-xs font-black uppercase text-black bg-yellow-400 hover:bg-yellow-300 px-4 py-2.5 rounded-xl cursor-pointer neo-shadow-sm transition-all border-2 border-black"
            >
              <Sparkles size={13} className="animate-pulse" /> Gold Upgrade ($1.99)
            </button>
          )}
        </div>
      </div>

      {/* Main split dashboard context */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* VIEW PORT SECTOR - Column 1 - Left */}
        <div className="md:col-span-7 flex flex-col items-center space-y-4">
          
          {/* DOUBLE DECKER BRUTALIST PILLS: Tab Switches & Brag vs Roast switcher */}
          <div className="w-full max-w-[380px] space-y-2">
            {/* 1. LAYOUT TARGET TYPE Selector */}
            <div className="flex border-4 border-black rounded-2xl overflow-hidden bg-white neo-shadow-sm">
              <button
                type="button"
                onClick={() => setActiveTab('receipt')}
                className={`flex-1 py-2 text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'receipt' ? 'bg-black text-yellow-400' : 'bg-white text-zinc-700 hover:bg-stone-50'
                }`}
              >
                🧾 Thermal Slip
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('social')}
                className={`flex-1 py-2 text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'social' ? 'bg-black text-yellow-400' : 'bg-white text-zinc-700 hover:bg-stone-50'
                }`}
              >
                📱 Social Card
              </button>
            </div>

            {/* 2. BRAG (RIGHT) vs ROAST (WRONG) Selector */}
            <div className="flex border-4 border-black rounded-2xl overflow-hidden bg-white neo-shadow-sm">
              <button
                type="button"
                onClick={() => handleOutcomeChange('right')}
                className={`flex-1 py-2 text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  displayOutcome === 'right' ? 'bg-emerald-600 text-white font-black border-r-2 border-black' : 'bg-white text-zinc-700 hover:bg-stone-50'
                }`}
              >
                🍷 Brag ("I was right")
              </button>
              <button
                type="button"
                onClick={() => handleOutcomeChange('wrong')}
                className={`flex-1 py-2 text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  displayOutcome === 'wrong' ? 'bg-red-600 text-white font-black' : 'bg-white text-zinc-700 hover:bg-stone-50'
                }`}
              >
                🥛 Roast ("I was wrong")
              </button>
            </div>
          </div>

          <div 
            ref={receiptRef}
            className="w-full max-w-[380px] font-mono relative transition-all duration-500 rounded-sm shrink-0"
          >
            {prediction.burned ? (
              // ==========================================
              //   RENDER REDACTED COWARD'S WAY OUT CARD
              // ==========================================
              <div className="w-full bg-[#0a0202] text-white border-4 border-red-700 rounded-3xl p-6 relative flex flex-col justify-between aspect-[4/5] neo-shadow overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1.5 bg-red-650 animate-pulse" />
                <div className="space-y-4 relative z-10 text-center flex flex-col justify-center items-center h-full">
                  <div className="text-5xl animate-bounce">🔥</div>
                  <h2 className="font-sans font-black text-2xl tracking-tight text-red-500 uppercase italic">
                    {t('evidenceRedactedHeading')}
                  </h2>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider max-w-xs leading-normal">
                    {t('evidenceRedactedDesc')}
                  </p>
                  <div className="border border-red-900/40 bg-red-950/40 px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold text-red-400 uppercase tracking-widest mt-2">
                    {t('evidenceRedactedStatus')}
                  </div>
                </div>
                {/* Simulated barcode at the bottom */}
                <div className="border-t border-red-900/20 pt-4 flex flex-col items-center opacity-30">
                  <div className="w-48 h-6 bg-red-950/80 rounded-sm flex items-center justify-center font-mono text-[9px] text-red-400 select-none tracking-widest">
                    ||||| | |||| || ||| | ||| |||| |
                  </div>
                </div>
              </div>
            ) : displayOutcome === 'wrong' ? (
              // ==========================================
              //   RENDER ROT-COMEDY "YOU CALLED IT... WRONG" CARD
              // ==========================================
              activeTab === 'social' ? (
                <div className="w-full bg-stone-950 border-4 border-black rounded-3xl p-1.5 relative flex flex-col justify-between aspect-[9/16] neo-shadow overflow-hidden">
                  <img 
                    src={imageUrl} 
                    alt="Dynamic Social Card" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain rounded-2xl"
                    loading="lazy"
                  />
                </div>
              ) : (
                // Thermal wrong card with custom rubber stamp indicators
                <div className="w-full font-mono relative overflow-hidden transition-all duration-500 border-4 border-black bg-[#fbfaf5] text-[#1e1c16] px-6 py-8 leading-snug">
                  {/* Jagged thermal cuts */}
                  <div className="absolute top-0 inset-x-0 h-2 bg-radial-gradient flex overflow-hidden">
                    {Array.from({ length: 42 }).map((_, i) => (
                      <div key={i} className="w-4 h-2 bg-zinc-950 rotate-45 transform -translate-y-1 origin-top-left flex-shrink-0" />
                    ))}
                  </div>

                  {/* Gigantic Distressed RED RUBBER SHAME stamp */}
                  <div className="absolute top-[48%] left-[55%] -translate-x-1/2 -translate-y-1/2 -rotate-12 border-4 border-red-500 text-red-500 bg-[#fbfaf5] px-4 py-2 font-black text-[11px] uppercase tracking-widest rounded-xl select-none pointer-events-none z-30 font-sans shadow-sm flex flex-col items-center justify-center opacity-90">
                    <span className="text-[8px] opacity-75">COMMUNITY OUTCRY</span>
                    <span className="text-xs font-black tracking-widest my-0.5">{selectedFailureLabel.toUpperCase()}</span>
                    <span className="text-[6.5px] font-mono tracking-normal opacity-85">{missTier.tier.toUpperCase()} LEVEL DETECTED</span>
                  </div>

                  <div className="text-center space-y-1 mb-5">
                    <h3 className="font-sans font-black text-xl tracking-tighter uppercase leading-none text-[#1e1c16]">
                      THE RECEIPT OF TRUTH
                    </h3>
                    <p className="text-[9px] tracking-wider uppercase font-black opacity-80">
                      *** PREDICTOR RECOVERY SLIP ***
                    </p>
                    <div className="text-[9px] opacity-75 pt-1">
                      <p>TX EVENT ID-ROT-{prediction.id}</p>
                      <p>TIME: {prediction.timestamp}</p>
                      <p className="font-bold">NAME: {prediction.name.toUpperCase()}</p>
                    </div>
                  </div>

                  <div className="text-xs mb-4 select-none opacity-80">
                    ======================================
                  </div>

                  <div className="space-y-3 font-mono text-xs text-black">
                    <div className="flex justify-between text-[9px] font-black opacity-90 border-b border-dashed pb-1.5 border-stone-300">
                      <span>QTY DESCRIPTION</span>
                      <span>STATUS</span>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex justify-between font-extrabold">
                        <span>1 x EXPECTED PROPHECY</span>
                        <span className="text-red-600">FAILED</span>
                      </div>
                      <p className="text-[10px] pl-4 font-black text-rose-950 uppercase break-all">
                        {getPredictionSummary()}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex justify-between font-extrabold">
                        <span>1 x ACTUAL PLAYGROUND REALITY</span>
                        <span className="font-black">CHOKED</span>
                      </div>
                      <p className="text-[11px] pl-4 font-black uppercase text-stone-900">
                        VALUE: {customActualResult || 'FAILED'}
                      </p>
                    </div>

                    <div className="space-y-1 py-1 bg-stone-100 rounded-lg px-2 border border-zinc-200">
                      <span className="font-mono text-[9px] font-black text-amber-700 block uppercase">1 x BANTER ROAST VERDICT:</span>
                      <p className="text-[10px] font-black leading-tight text-neutral-800 italic uppercase">
                        "{currentRoast}"
                      </p>
                    </div>

                    <div className="flex justify-between items-center pt-1.5 border-t border-dashed border-stone-300">
                      <span className="font-extrabold">ESTIMATED REPUTATION LIABILITY</span>
                      <span className="font-black text-red-600">SPOILED MILK</span>
                    </div>
                  </div>

                  <div className="text-xs my-4 select-none opacity-80">
                    ======================================
                  </div>

                  {/* Procedural Barcode */}
                  <div className="flex flex-col items-center justify-center my-4">
                    <div className="h-8 flex items-stretch gap-[1.5px] opacity-90">
                      {Array.from({ length: 42 }).map((_, i) => {
                        const seed = (i * 3 + prediction.id.charCodeAt(i % 4)) % 6;
                        const widths = ['w-[1px]', 'w-[2px]', 'w-[3px]', 'w-[1px]', 'w-[4px]', 'w-[1.5px]'];
                        const color = seed >= 4 ? 'bg-transparent' : 'bg-[#1e1c16]';
                        return <div key={i} className={`h-full ${widths[seed]} ${color}`} />;
                      })}
                    </div>
                    <span className="text-[8px] mt-1 opacity-80 font-bold">*ROT-WRONG-SHAME*</span>
                  </div>

                  <div className="text-center text-[7.5px] leading-relaxed opacity-75 font-bold">
                    <p>IMMUTABLE RECONSTRUCTION OF HISTORY CHOKED</p>
                    <p>LOSE ALL FOOTBALL DIALOG RIGHTS INDEFINITELY</p>
                  </div>

                  <div className="absolute bottom-0 inset-x-0 h-2 bg-radial-gradient flex overflow-hidden">
                    {Array.from({ length: 42 }).map((_, i) => (
                      <div key={i} className="w-4 h-2 bg-zinc-950 rotate-45 transform translate-y-1 origin-bottom-left flex-shrink-0" />
                    ))}
                  </div>
                </div>
              )
            ) : (
              // ==========================================
              //   RENDER STANDARD PASS/BRAG PRE-MATCH CARD
              // ==========================================
              activeTab === 'social' ? (
                <div className="w-full bg-stone-950 border-4 border-black rounded-3xl p-1.5 relative flex flex-col justify-between aspect-[9/16] neo-shadow overflow-hidden">
                  <img 
                    src={imageUrl} 
                    alt="Dynamic Social Card" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain rounded-2xl"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div 
                  className={`w-full font-mono relative overflow-hidden transition-all duration-500 border-4 border-black neo-shadow ${
                    prediction.isGolden 
                      ? 'bg-gradient-to-br from-[#FFFBD4] via-[#F4D03F] to-[#CD9B1D] text-[#2c2201]' 
                      : 'bg-[#fbfaf5] text-[#1e1c16]'
                  }`}
                >
                  {prediction.isGolden && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent pointer-events-none -translate-x-full animate-[shimmer_5s_infinite]" />
                  )}

                  <div className="absolute top-0 inset-x-0 h-2 bg-radial-gradient flex overflow-hidden">
                    {Array.from({ length: 42 }).map((_, i) => (
                      <div key={i} className="w-4 h-2 bg-zinc-950 rotate-45 transform -translate-y-1 origin-top-left flex-shrink-0" />
                    ))}
                  </div>

                  <div className="px-6 py-8 relative">
                    {simulatedStatus === 'correct' && (
                      <div className="absolute top-[42%] left-[55%] -translate-x-1/2 -translate-y-1/2 -rotate-12 border-4 border-emerald-600 text-emerald-600 bg-white/95 px-4 py-2.5 font-black text-xs uppercase tracking-widest rounded-xl select-none pointer-events-none z-30 font-sans shadow-md flex flex-col items-center justify-center opacity-95">
                        <span className="text-[8px] opacity-75 leading-none">ORACLE STAMP</span>
                        <span className="text-xs font-black tracking-widest my-0.5">PASSED (WINE 🍷)</span>
                        <span className="text-[7px] font-mono tracking-normal leading-none opacity-85">MATURED RECORD VERIFIED</span>
                      </div>
                    )}

                    <div className="text-center space-y-1 mb-6">
                      <h3 className="font-sans font-black text-2xl tracking-tighter uppercase leading-none">
                        THE RECEIPT OF TRUTH
                      </h3>
                      <p className="text-[10px] tracking-wider uppercase font-black opacity-80">
                        *** IMMUTABLE FOOTBALL RECORD ***
                      </p>
                      <div className="text-[10px] leading-relaxed opacity-75 pt-1 space-y-0.5">
                        <p>STAMP: WORLD CUP 2026 HUB</p>
                        <p className="font-bold">TX: ID-{prediction.id}</p>
                        <p>TIME: {prediction.timestamp}</p>
                        <p className="font-bold">NAME: {prediction.name.toUpperCase()}</p>
                      </div>
                    </div>

                    <div className="text-xs mb-6 select-none opacity-80 z-20">
                      ======================================
                    </div>

                    <div className="space-y-4 font-mono text-xs text-black">
                      <div className="flex justify-between text-[10px] font-black opacity-90 border-b border-dashed pb-1.5 border-current">
                        <span>QTY DESCRIPTION</span>
                        <span>VALUE</span>
                      </div>

                      {(!prediction.predictionType || prediction.predictionType === 'match') ? (
                        <>
                          <div className="space-y-0.5">
                            <div className="flex justify-between items-start gap-4">
                              <span className="font-extrabold">1 x MATCH FIXTURE</span>
                              <span className="font-black text-right">SECURED</span>
                            </div>
                            <div className="text-[11px] font-black pl-4 block uppercase tracking-tight text-stone-900">
                              {getMatchLabel(prediction)}
                            </div>
                          </div>

                          <div className="flex justify-between items-center gap-4">
                            <span className="font-extrabold">1 x PREDICTED EXACT SCORE</span>
                            <span className="font-black text-sm tracking-widest">{prediction.predictedScoreA} - {prediction.predictedScoreB}</span>
                          </div>

                          <div className="flex justify-between items-start gap-4">
                            <span className="font-extrabold">1 x FIRST TOTAL GOALSCORER</span>
                            <span className="font-black uppercase text-right">{prediction.firstGoalscorer.toUpperCase()}</span>
                          </div>
                        </>
                      ) : prediction.predictionType === 'player' ? (
                        <>
                          <div className="space-y-0.5">
                            <div className="flex justify-between items-start gap-4">
                              <span className="font-extrabold">1 x PLAYER PROPHECY</span>
                              <span className="font-black text-right">ACTIVE</span>
                            </div>
                            <div className="text-[11px] font-black pl-4 block uppercase tracking-tight text-stone-900">
                              {prediction.playerName}
                            </div>
                          </div>

                          <div className="flex justify-between items-center gap-4">
                            <span className="font-extrabold">1 x MARKET TYPE</span>
                            <span className="font-black uppercase text-xs text-right">{prediction.playerMarket}</span>
                          </div>

                          <div className="flex justify-between items-center gap-4">
                            <span className="font-extrabold">1 x QUANTITY VALUE</span>
                            <span className="font-black text-right">{prediction.playerValue}</span>
                          </div>
                        </>
                      ) : prediction.predictionType === 'team' ? (
                        <>
                          <div className="space-y-0.5">
                            <div className="flex justify-between items-start gap-4">
                              <span className="font-extrabold">1 x TEAM ACHIEVEMENT DESTINY</span>
                              <span className="font-black text-right">BOUND</span>
                            </div>
                            <div className="text-[11px] font-black pl-4 block uppercase tracking-tight text-stone-900">
                              {prediction.teamName}
                            </div>
                          </div>

                          <div className="flex justify-between items-center gap-4">
                            <span className="font-extrabold">1 x TARGET OBJECTIVE</span>
                            <span className="font-black uppercase text-[10px] text-right max-w-[180px] break-words">{prediction.teamMarket}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="space-y-0.5">
                            <div className="flex justify-between items-start gap-4">
                              <span className="font-extrabold">1 x WILD CUSTOM SPELL CAST</span>
                              <span className="font-black text-right">LOCKED</span>
                            </div>
                            <div className="text-[11px] font-black pl-4 block uppercase tracking-tight text-stone-900 break-words max-w-[280px]">
                              "{prediction.customTakeText}"
                            </div>
                          </div>
                        </>
                      )}

                      <div className="space-y-1">
                        <div className="flex justify-between items-center gap-4">
                          <span className="font-extrabold">1 x BOLD OUTCOME PARLAYS</span>
                          <span className="font-black text-xs text-stone-700">VERIFIED</span>
                        </div>
                        <div className="text-[10px] font-black pl-4 space-y-0.5 block uppercase">
                          {prediction.boldPredictions.map((bp, index) => (
                            <p key={index}>• {bp}</p>
                          ))}
                        </div>
                      </div>

                      {prediction.tipAmount && (
                        <div className="flex justify-between items-center gap-4">
                          <span className="font-extrabold">1 x CREATOR COFFEE TIP</span>
                          <span className="font-black text-right">${prediction.tipAmount.toFixed(2)}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center gap-4">
                        <span className="font-extrabold">    GOLD PREMIUM TIER</span>
                        <span className="font-black text-right">{prediction.isGolden ? 'GOLD AUTH' : '$0.00'}</span>
                      </div>
                    </div>

                    <div className="text-xs my-5 select-none opacity-80">
                      --------------------------------------
                    </div>

                    <div className="space-y-1 text-xs font-mono">
                      <div className="flex justify-between items-center text-black">
                        <span className="font-black">TOTAL LIABILITY</span>
                        <span className="text-sm font-black">
                          {prediction.isGolden ? 'GOLD PREMIUM' : 'VERIFIED PROOF'}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs my-5 select-none opacity-80">
                      ======================================
                    </div>

                    <div className="flex flex-col items-center justify-center my-6">
                      <div className="h-10 flex items-stretch gap-[1.5px] opacity-90 bg-transparent">
                        {Array.from({ length: 42 }).map((_, i) => {
                          const seed = (i * 3 + prediction.id.charCodeAt(i % 4)) % 6;
                          const widths = ['w-[1px]', 'w-[2px]', 'w-[3px]', 'w-[1px]', 'w-[4px]', 'w-[1.5px]'];
                          const color = seed >= 4 ? 'bg-transparent' : prediction.isGolden ? 'bg-[#211a01]' : 'bg-[#1e1c16]';
                          return <div key={i} className={`h-full ${widths[seed]} ${color}`} />;
                        })}
                      </div>
                      <span className="text-[9px] mt-1.5 opacity-80 font-bold">*{prediction.barcodeValue}*</span>
                    </div>

                    <div className="text-center text-[8px] leading-relaxed opacity-75 font-bold space-y-0.5">
                      <p>IMMUTABLE TRUTH PROTOCOL ENFORCED</p>
                      <p>DO NOT ATTEMPT TO RECONSTRUCT HISTORY</p>
                      <p>LOSE ALL BRAGGING RIGHTS IF INCORRECT.</p>
                    </div>
                  </div>

                  <div className="absolute bottom-0 inset-x-0 h-2 bg-radial-gradient flex overflow-hidden">
                    {Array.from({ length: 42 }).map((_, i) => (
                      <div key={i} className="w-4 h-2 bg-zinc-950 rotate-45 transform translate-y-1 origin-bottom-left flex-shrink-0" />
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* CONTROLS & VIRALITY ENGINE PANEL - Column 2 - Right */}
        <div className="md:col-span-5 space-y-6">
          
          {!prediction.isGolden && (
            <CheckoutUpsell
              prediction={prediction}
              locale={locale}
              onUpgradeClick={onUpgradeClick}
            />
          )}
          
          {/* ===================================================
              INTERACTIVE POST-FAILURE COMEDY / ROAST CONTROLLER
              =================================================== */}
          {displayOutcome === 'wrong' && (
            <div className="bg-red-950 text-white border-4 border-black rounded-3xl p-5 neo-shadow space-y-4 animate-[fadeIn_0.2s_ease-out]">
              <div>
                <h3 className="font-sans font-black text-base uppercase text-red-500 tracking-tight flex items-center gap-1.5">
                  <Smile size={18} className="animate-spin text-yellow-500" />
                  Comedy Roast Engine
                </h3>
                <p className="text-[10px] text-zinc-300 leading-normal font-bold uppercase mt-1">
                  Adjust the parameters to shape the perfect self-deprecating comedy card before sharing!
                </p>
              </div>

              {/* 1. TONE LEVEL SELECT Pills */}
              <div className="space-y-1.5">
                <span className="text-[9px] text-red-300 font-extrabold uppercase tracking-wider block">TOUGHNESS TONE LEVEL:</span>
                <div className="flex border-2 border-black rounded-xl overflow-hidden bg-white text-black text-[10px] font-black uppercase">
                  {(['clean', 'light', 'savage'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setRoastLevel(lvl)}
                      className={`flex-1 py-1.5 text-center transition-all cursor-pointer ${
                        roastLevel === lvl 
                          ? 'bg-amber-500 text-stone-950 font-black' 
                          : 'bg-stone-50 hover:bg-stone-100 text-stone-700'
                      }`}
                    >
                      {lvl === 'clean' ? 'Clean 🧼' : lvl === 'light' ? 'Light Roast ☕' : 'Savage 🔥'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. FAILURE LABEL DROPDOWN */}
              <div className="space-y-1.5">
                <label className="text-[9px] text-red-300 font-extrabold uppercase tracking-wider block">CHOOSE FAILURE LABEL:</label>
                <select
                  value={selectedFailureLabel}
                  onChange={(e) => setSelectedFailureLabel(e.target.value)}
                  className="w-full bg-stone-900 border-2 border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white uppercase focus:outline-none focus:border-red-500"
                >
                  {FAILURE_LABELS.map((lbl) => (
                    <option key={lbl} value={lbl}>
                      {lbl.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. ACTUAL OUTCOME SIMULATOR PREFILL */}
              <div className="space-y-1.5">
                <label className="text-[9px] text-red-300 font-extrabold uppercase tracking-wider block flex justify-between">
                  <span>EDIT ACTUAL RESULT MATCH OUTCOME:</span>
                  <span className="text-zinc-400">EDITABLE</span>
                </label>
                <input
                  type="text"
                  value={customActualResult}
                  onChange={(e) => setCustomActualResult(e.target.value)}
                  placeholder="e.g. 1 - 7 disgrace"
                  className="w-full bg-stone-900 border-2 border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white uppercase focus:outline-none focus:border-red-500"
                />
              </div>

              {/* 4. VERDICT SELECT AND SHUFFLE */}
              <div className="bg-stone-900/60 p-3 rounded-xl border border-red-900/40 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-zinc-400 font-mono font-bold uppercase">PREVIEWING VERDICT COMEDY:</span>
                  <button
                    type="button"
                    onClick={() => setRoastIndex(prev => prev + 1)}
                    className="flex items-center gap-1 text-[9px] font-black uppercase text-yellow-400 hover:text-yellow-300 transition-all font-mono"
                  >
                    <RefreshCcw size={10} /> Next Banter
                  </button>
                </div>
                <p className="text-xs font-bold text-stone-200 italic">
                  "{currentRoast}"
                </p>
              </div>

              {/* Coward's Way Out - Burn Evidence */}
              <div className="pt-3 border-t border-red-900/40">
                <button
                  type="button"
                  onClick={handleBurnEvidence}
                  className="w-full bg-red-750 hover:bg-red-700 text-white font-black text-xs py-3 px-4 rounded-xl border-2 border-black neo-shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>🔥 BURN THE EVIDENCE — $0.99</span>
                </button>
                <p className="text-[9.5px] text-red-300 font-bold uppercase mt-1 leading-normal text-center">
                  Your brag aged like milk. Pay $0.99 to delete it from the global Wall of Shame before your friends find it.
                </p>
              </div>
            </div>
          )}

          {/* TELEMETRY METRIC CONVENIENCE DISPLAY */}
          <div className="bg-black text-white border-4 border-black rounded-3xl p-5 neo-shadow space-y-4">
            <h3 className="font-sans font-black text-lg uppercase tracking-tight text-yellow-400 flex items-center gap-1.5">
              <Flame size={20} className="animate-bounce text-orange-500" />
              Viral Receipt Telemetry
            </h3>

            {/* Hot Take indicator */}
            <div className="bg-stone-900 border-2 border-zinc-800 rounded-2xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-wider block">HOT TAKE CLASSIFICATION</span>
                <span className="text-sm font-black text-white font-mono">{hotTake} TAKE</span>
              </div>
              <span className={`px-2.5 py-1 text-[10px] font-black rounded border ${
                hotTake === 'NUCLEAR' ? 'bg-red-500 border-red-500 text-black animate-pulse' :
                hotTake === 'HOT' ? 'bg-orange-500 border-orange-500 text-white' :
                'bg-zinc-700 border-zinc-650 text-zinc-100'
              }`}>
                {hotTake === 'NUCLEAR' ? '☢️ EXTREME' : hotTake === 'HOT' ? '🔥 HIGH HEAT' : '🍃 CHILL'}
              </span>
            </div>

            {/* Percentage Consensus rating */}
            <div className="bg-stone-900 border-2 border-zinc-800 rounded-2xl p-3.5 space-y-1.5">
              <div className="flex justify-between items-center text-[9px] text-zinc-500 font-extrabold uppercase">
                <span>CONTRARIAN CONSENSUS RATE</span>
                <span className="text-yellow-400 font-mono text-xs">{consensus}% AGREE</span>
              </div>
              <div className="h-3 bg-stone-950 border border-zinc-800 rounded-full overflow-hidden relative">
                <div 
                  className="h-full bg-yellow-400 rounded-full transition-all duration-1000"
                  style={{ width: `${consensus}%` }}
                />
              </div>
              <p className="text-[10px] text-zinc-300 font-bold leading-snug">
                {consensus < 15 ? (
                  <>🎯 <strong className="text-yellow-400">Only {consensus}% of fans</strong> agree with your take. You are a true contrarian prophet!</>
                ) : (
                  <>📊 <strong className="text-stone-100">{consensus}% of fans</strong> agree with this take. Safe, steady, but less viral value.</>
                )}
              </p>
            </div>

            {/* Rage Meter index */}
            <div className="bg-stone-900 border-2 border-zinc-800 rounded-2xl p-3.5 space-y-1.5">
              <div className="flex justify-between items-center text-[9px] text-zinc-500 font-extrabold uppercase">
                <span>🔥 FAN RAGE POTENTIAL</span>
                <span className="text-red-500 font-mono font-black text-xs">{ragePotential}% RAGE</span>
              </div>
              <div className="h-3 bg-stone-950 border border-zinc-800 rounded-full overflow-hidden relative">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-red-600 rounded-full transition-all duration-1000"
                  style={{ width: `${ragePotential}%` }}
                />
              </div>
              <p className="text-[10px] text-zinc-300 font-bold">
                Rage estimate: <strong className="text-red-400">{ragePotential}%</strong>. Your comments will combust on Reddit if this lands.
              </p>
            </div>
          </div>

          {/* CLIMATIC TIMELINE SIMULATOR MODULE */}
          <div className="bg-white text-black border-4 border-black rounded-3xl p-5 neo-shadow space-y-4">
            <div>
              <h4 className="font-sans font-black text-sm uppercase tracking-wider text-black flex items-center justify-between">
                <span>🕒 PRE-MATCH AGING PROTOCOL</span>
                <span className="text-xs text-zinc-500 font-mono font-extrabold">{prediction.status ? 'MATURED' : 'PENDING'}</span>
              </h4>
              <p className="text-[11px] text-zinc-600 mt-1 leading-snug font-bold">
                Most football users are wrong. We double the action: bragging rights if correct, public shaming if sour milk. Place your bookmark or simulate!
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {/* REMIND ME AFTER THE MATCH */}
              <button
                type="button"
                onClick={() => setReminded(!reminded)}
                className={`w-full border-2 border-black py-2.5 rounded-xl font-sans font-black text-xs uppercase flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  reminded 
                    ? 'bg-black text-yellow-500 py-3' 
                    : 'bg-stone-50 hover:bg-stone-100 text-black'
                }`}
              >
                <Bell size={14} className={reminded ? 'fill-yellow-500 animate-pulse' : ''} />
                {reminded ? '🔔 REMINDER SET! SLIDING INTO DM INBOX' : 'REMIND ME AFTER THE MATCH'}
              </button>

              {/* Fast Forward Kickoff Simulator */}
              <div className="border bg-stone-50 rounded-xl p-3 border-zinc-200">
                <p className="text-[9px] font-mono font-black text-zinc-500 uppercase tracking-widest block mb-1.5 text-center">
                  🛠️ TIMELINE SIMULATOR (TEST WINE VS MILK)
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSimulatedStatus('correct');
                      setDisplayOutcome('right');
                    }}
                    className={`text-[10px] font-black uppercase py-1.5 px-0.5 rounded border transition-all ${
                      simulatedStatus === 'correct' && displayOutcome === 'right'
                        ? 'bg-emerald-600 text-white border-black font-black scale-102' 
                        : 'bg-white text-zinc-650 border-zinc-350 hover:bg-stone-50'
                    }`}
                  >
                    Wine 🍷 (Win)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSimulatedStatus('incorrect');
                      setDisplayOutcome('wrong');
                    }}
                    className={`text-[10px] font-black uppercase py-1.5 px-0.5 rounded border transition-all ${
                      simulatedStatus === 'incorrect' && displayOutcome === 'wrong'
                        ? 'bg-red-650 text-white border-black font-black scale-102' 
                        : 'bg-white text-zinc-650 border-zinc-350 hover:bg-stone-50'
                    }`}
                  >
                    Milk 🥛 (Choke)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSimulatedStatus('pending');
                      setDisplayOutcome('right');
                    }}
                    className={`text-[10px] font-black uppercase py-1.5 px-0.5 rounded border transition-all ${
                      simulatedStatus === 'pending' 
                        ? 'bg-zinc-800 text-yellow-400 border-black font-black' 
                        : 'bg-white text-zinc-650 border-zinc-350 hover:bg-stone-50'
                    }`}
                  >
                    Reset ⏳
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* EXPORT AND DEEP LINKING ACTIONS */}
          <div className="bg-white border-4 border-black rounded-3xl p-6 text-black neo-shadow space-y-4">
            <div>
              <h3 className="font-sans font-black text-xl italic text-black tracking-tight flex items-center gap-2">
                <Share2 className="text-yellow-500 h-6 w-6 stroke-[3]" />
                SHARE BANTER & PROOF
              </h3>
              <p className="text-xs text-zinc-650 mt-1 font-bold">Copy or Tweet your comedy receipt text card along with the deep-link link to gain virality!</p>
            </div>

            {/* Dynamic Receipt Photo Preview */}
            <div className="border bg-zinc-50 border-zinc-200 p-4 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group">
              <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2.5 flex items-center gap-1.5 self-start">
                <Sparkles size={11} className="text-yellow-500 animate-spin" style={{ animationDuration: '3s' }} />
                <span>DYNAMIC RECEIPT PHOTO (PNG)</span>
              </div>
              <div className="relative w-full max-w-[280px] bg-stone-900 border-2 border-black rounded-xl p-2 flex items-center justify-center min-h-[360px] neo-shadow-sm transition-transform duration-300 hover:scale-[1.01]">
                <img 
                  src={imageUrl} 
                  alt="Dynamic Receipt Proof" 
                  referrerPolicy="no-referrer"
                  className="w-full h-auto aspect-[3/4] object-contain rounded-lg border border-black shadow-lg"
                  loading="lazy"
                />
              </div>
              <span className="mt-2.5 bg-black text-stone-100 border border-zinc-700 px-2.5 py-1 text-[9px] font-bold rounded-lg uppercase tracking-wider shadow-xs opacity-90 text-center">
                Right-Click or Hold Image to Save/Copy
              </span>
              <p className="text-[10px] text-zinc-500 font-bold mt-1.5 text-center leading-normal">
                This image updates dynamically with the timeline simulator above. Show it on Twitter/Reddit to prove your sports prophecy!
              </p>
            </div>

            {/* Link Copy display */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-zinc-700 uppercase tracking-widest">Shareable Deep-Link & Text Card</label>
              <div className="flex gap-2">
                <div className="flex-1 bg-stone-50 border-2 border-black px-3 py-2.5 rounded-xl text-xs text-black truncate font-semibold font-mono select-all">
                  {shareUrl}
                </div>
                <button
                  onClick={handleCopyLink}
                  className="bg-black hover:bg-zinc-900 text-yellow-400 px-4 flex items-center justify-center gap-1.5 rounded-xl border-2 border-black cursor-pointer neo-shadow-sm transition-all text-xs font-black uppercase whitespace-nowrap"
                  title="Copy receipt card text and link"
                >
                  {copied ? (
                    <>
                      <Check className="text-green-500 stroke-[3]" size={14} />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy Viral Card</span>
                    </>
                  )}
                </button>
              </div>
              {copied && (
                <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider flex items-center gap-1 animate-pulse">
                  <Check size={11} className="stroke-[3]" /> Complete formatted receipt card & link copied to clipboard!
                </p>
              )}
            </div>

            {/* PNG Save action / Tweet action */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleShareTwitter}
                className="bg-[#1DA1F2] hover:bg-[#1a94e0] text-white border-2 border-black py-3 px-4 rounded-xl font-sans font-black text-xs uppercase flex items-center justify-center gap-2 cursor-pointer neo-shadow-sm active:scale-95 transition-all"
              >
                <Twitter size={14} /> Tweet Take
              </button>
              
              <button
                onClick={handleDownloadPNG}
                disabled={downloading}
                className="bg-yellow-400 hover:bg-yellow-300 text-black border-2 border-black disabled:bg-zinc-250 disabled:text-zinc-500 py-3 px-4 rounded-xl font-sans font-black text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer neo-shadow-sm active:scale-95 transition-all"
              >
                {downloading ? (
                  <>
                    <div className="w-3 h-3 rounded-full border-2 border-black border-t-transparent animate-spin" />
                    <span>Drawing...</span>
                  </>
                ) : (
                  <>
                    <Download size={14} className="stroke-[3]" />
                    <span>Save PNG</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
