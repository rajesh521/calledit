"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Sparkles, Trophy, Flame, ShieldAlert, CreditCard, ShieldCheck, Lock, X, Coins, ArrowRight, RefreshCw, Volume2, CornerDownRight } from 'lucide-react';

// =========================================================================
// SELF-CONTAINED CRYPTO/BASE64 UTILITIES FOR DEEP LINK PASSING & ENCODING
// =========================================================================
function decodePredictionSafe(encodedStr: string) {
  try {
    const decodedUri = decodeURIComponent(encodedStr);
    const binStr = atob(decodedUri);
    const decodedJson = decodeURIComponent(escape(binStr));
    return JSON.parse(decodedJson);
  } catch (error) {
    try {
      const binStr = atob(encodedStr);
      const decodedJson = decodeURIComponent(escape(binStr));
      return JSON.parse(decodedJson);
    } catch (e) {
      return null;
    }
  }
}

function encodePrediction(prediction: any): string {
  try {
    const jsonStr = JSON.stringify(prediction);
    const encoded = btoa(unescape(encodeURIComponent(jsonStr)));
    return encodeURIComponent(encoded);
  } catch (error) {
    return "";
  }
}

// Fallback seed prediction in case organic query parameters are empty
const FALLBACK_PREDICTION = {
  id: "pred_fallback_1",
  name: "G.O.A.T_Predictor",
  matchId: "g_e1", // Brazil vs Germany
  predictedScoreA: "3",
  predictedScoreB: "1",
  firstGoalscorer: "Vinicius Jr",
  boldPredictions: ["Bicycle-kick goal in second half", "Keeper gets yellow card"],
  isGolden: false,
  timestamp: "06/07/2026 21:00:00 PM",
  barcodeValue: "ROT-BRZ-GER-8319",
  calledOut: "GermanFanBoy_99",
  stakes: "wear a Brazil jersey all day at work"
};

const WORLD_CUP_PRESET_MATCHES: Record<string, { teamA: string; teamB: string; flagA: string; flagB: string }> = {
  g_a1: { teamA: "Mexico", teamB: "South Africa", flagA: "🇲🇽", flagB: "🇿🇦" },
  g_a2: { teamA: "USA", teamB: "Sweden", flagA: "🇺🇸", flagB: "🇸🇪" },
  g_e1: { teamA: "Brazil", teamB: "Germany", flagA: "🇧🇷", flagB: "🇩🇪" },
  g_c1: { teamA: "Argentina", teamB: "Slovenia", flagA: "🇦🇷", flagB: "🇸🇮" },
  g_d1: { teamA: "France", teamB: "Saudi Arabia", flagA: "🇫🇷", flagB: "🇸🇦" },
  g_f1: { teamA: "England", teamB: "Cameroon", flagA: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", flagB: "🇨🇲" }
};

export default function BragLandingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const bragId = params?.id || "ROT-BRG-404";
  
  const [originalPrediction, setOriginalPrediction] = useState<any>(FALLBACK_PREDICTION);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutPhase, setCheckoutPhase] = useState<'idle' | 'processing' | 'success'>('idle');
  const [billingEmail, setBillingEmail] = useState('');
  const [billingName, setBillingName] = useState('');
  const [counterBragActivated, setCounterBragActivated] = useState(false);
  
  // Custom states for simulated card input
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  // Hydrate original prediction from search parameters on mount
  useEffect(() => {
    if (searchParams) {
      const payload = searchParams.get('r');
      if (payload) {
        const decoded = decodePredictionSafe(payload);
        if (decoded) {
          setOriginalPrediction(decoded);
        }
      }
    }
  }, [searchParams]);

  // Audio synthetically generated using Web Audio API for interactive success feedback
  const playGoldChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);
      osc1.frequency.exponentialRampToValueAtTime(1046.50, now + 0.15);
      osc1.frequency.exponentialRampToValueAtTime(1318.51, now + 0.35);
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(261.63, now);
      osc2.frequency.exponentialRampToValueAtTime(523.25, now + 0.2);
      osc2.frequency.exponentialRampToValueAtTime(783.99, now + 0.4);
      
      gainNode.gain.setValueAtTime(0.12, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc1.start();
      osc2.start();
      osc1.stop(now + 0.6);
      osc2.stop(now + 0.6);
    } catch (e) {
      console.warn("Audio Context blocked or not supported", e);
    }
  };

  // Helper to extract teams and flags
  const getMatchDetails = (pred: any) => {
    if (pred.matchId === 'custom' && pred.customMatch) {
      const stripped = pred.customMatch.replace(/⚽/g, '').trim();
      const parts = stripped.split(/\s+vs\s+/gi);
      return {
        teamA: parts[0] || "Team A",
        teamB: parts[1] || "Team B",
        flagA: "⚽",
        flagB: "⚽"
      };
    }
    const preset = WORLD_CUP_PRESET_MATCHES[pred.matchId];
    return preset || { teamA: "Brazil", teamB: "Germany", flagA: "🇧🇷", flagB: "🇩🇪" };
  };

  const match = getMatchDetails(originalPrediction);

  // Formulate the dynamic counter brag prediction payload
  const getCounterPrediction = () => {
    // Reverse scores
    const reversedScoreA = originalPrediction.predictedScoreB || '0';
    const reversedScoreB = originalPrediction.predictedScoreA || '0';

    return {
      ...originalPrediction,
      id: `CHALLENGE-${Math.floor(1000 + Math.random() * 9000)}`,
      name: billingName.trim() || 'Challenger',
      calledOut: originalPrediction.name,
      predictedScoreA: reversedScoreA,
      predictedScoreB: reversedScoreB,
      boldPredictions: ['Original take is certified milk', 'Counter-brag will dominate the group chat'],
      status: undefined,
      isGolden: true, // Challenge card goes premium!
      timestamp: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
      barcodeValue: `ROT-CTR-${Math.floor(100000 + Math.random() * 900000)}`
    };
  };

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutPhase('processing');
    
    // Simulate transaction delay
    setTimeout(() => {
      setCheckoutPhase('success');
      playGoldChime();
      
      // Keep success page visible for a moment then activate counter card
      setTimeout(() => {
        setIsCheckoutOpen(false);
        setCounterBragActivated(true);
        setCheckoutPhase('idle');
      }, 1500);
    }, 2000);
  };

  const handleFreeCounterClick = () => {
    const counter = getCounterPrediction();
    counter.isGolden = false; // Free brag mode
    // Redirect back to base app routing prefilled with counter values
    if (typeof window !== 'undefined') {
      window.location.href = `/?r=${encodePrediction(counter)}`;
    }
  };

  const prophetName = originalPrediction.name ? originalPrediction.name.toUpperCase() : 'ANONYMOUS';
  const opponentName = originalPrediction.calledOut ? originalPrediction.calledOut.toUpperCase() : 'THE WHOLE CHAT';
  const stakesConsequence = originalPrediction.stakes ? originalPrediction.stakes : 'shave their head in shame';

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col justify-between font-sans pb-16 relative overflow-x-hidden">
      {/* Decorative Matrix Background Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0.9)_70%,rgba(0,0,0,0.95))] pointer-events-none z-0" />
      
      {/* Radioactive Warning Ribbon Header */}
      <div className="relative z-10 w-full bg-red-600 text-white text-xs font-black uppercase text-center py-2.5 border-b-4 border-black tracking-widest select-none animate-pulse">
        ⚠️ ALERT: YOU HAVE LANDED IN A VERIFIED BRAG TRAP ZONE ⚠️
      </div>

      <main className="relative z-10 max-w-lg w-full mx-auto px-4 py-8 flex-1 flex flex-col justify-center space-y-8">
        
        {/* =========================================================================
           TOP VIEW: ORIGINAL USER'S HYPE CARD (THE TRAP FOCUS)
           ========================================================================= */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-[10px] font-black uppercase text-zinc-400 tracking-widest">
            <span>ORIGINAL PROPHET SLIP</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
              LOCKED LEDGER
            </span>
          </div>

          {/* Brutalist Thermal Ticket Replica */}
          <div className={`w-full font-mono relative overflow-hidden transition-all duration-500 border-4 border-black rounded-xl bg-[#fbfaf5] text-[#1e1c16] px-6 py-7 leading-snug neo-shadow`}>
            {/* Stamp diagonal */}
            <div className="absolute top-[40%] left-[55%] -translate-x-1/2 -translate-y-1/2 -rotate-12 border-4 border-red-500 text-red-500 bg-white/95 px-4 py-2 font-black text-xs uppercase tracking-widest rounded-xl select-none pointer-events-none z-20 font-sans shadow-md flex flex-col items-center justify-center opacity-90">
              <span className="text-[7px] opacity-75">ORACLE STATUS</span>
              <span className="text-[11px] font-black tracking-widest my-0.5">TRASH TALK</span>
              <span className="text-[6.5px] font-mono tracking-normal opacity-85">PROOF ENFORCED</span>
            </div>

            <div className="text-center space-y-0.5 mb-4 border-b border-dashed border-stone-400 pb-4">
              <h3 className="font-sans font-black text-lg tracking-tighter uppercase leading-none">
                THE RECEIPT OF TRUTH
              </h3>
              <p className="text-[9px] tracking-wider uppercase font-black opacity-80">
                *** IMMUTABLE FOOTBALL RECORD ***
              </p>
              <p className="text-[8px] opacity-75 pt-1">
                ID: {bragId} · TIMESTAMP: {originalPrediction.timestamp}
              </p>
            </div>

            <div className="space-y-3.5 text-xs text-black">
              <div className="flex justify-between font-extrabold border-b border-dashed pb-1.5 border-stone-300">
                <span>DESCRIPTION</span>
                <span>STATE</span>
              </div>

              <div className="space-y-0.5">
                <div className="flex justify-between font-bold text-[11px]">
                  <span>1 x MATCH TARGET</span>
                  <span className="text-emerald-700">LOCKED</span>
                </div>
                <p className="text-xs font-black pl-3 block uppercase text-stone-900 leading-tight">
                  {match.flagA} {match.teamA} vs {match.teamB} {match.flagB}
                </p>
              </div>

              <div className="flex justify-between items-center text-[11px]">
                <span className="font-bold">1 x PREDICTED EXACT SCORE</span>
                <span className="font-black text-sm tracking-widest">{originalPrediction.predictedScoreA} - {originalPrediction.predictedScoreB}</span>
              </div>

              <div className="flex justify-between items-center text-[11px]">
                <span className="font-bold">1 x FIRST GOALSCORER</span>
                <span className="font-black uppercase">{originalPrediction.firstGoalscorer.toUpperCase()}</span>
              </div>

              <div className="flex justify-between items-start text-[11px]">
                <span className="font-bold">1 x STAKES CONSEQUENCE</span>
                <span className="font-black text-red-650 text-right max-w-[180px] break-words">"{stakesConsequence.toUpperCase()}"</span>
              </div>
            </div>

            {/* Procedural Barcode */}
            <div className="flex flex-col items-center justify-center mt-6">
              <div className="h-8 flex items-stretch gap-[1.5px] opacity-95">
                {Array.from({ length: 32 }).map((_, i) => {
                  const seed = (i * 3 + bragId.toString().charCodeAt(i % 3)) % 5;
                  const widths = ['w-[1px]', 'w-[2px]', 'w-[3px]', 'w-[1.5px]', 'w-[4px]'];
                  const color = seed >= 3 ? 'bg-transparent' : 'bg-[#1e1c16]';
                  return <div key={i} className={`h-full ${widths[seed]} ${color}`} />;
                })}
              </div>
              <span className="text-[7.5px] mt-1 opacity-80 font-bold">*{originalPrediction.barcodeValue || bragId}*</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
           CONVERSION TRAP: HIGH CONTRAST CHALLENGE CONTAINER
           ========================================================================= */}
        <div className="bg-yellow-400 border-4 border-black p-5 text-black font-black uppercase tracking-tight rounded-2xl neo-shadow relative overflow-hidden group">
          {/* Warning diagonal border lines */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-black/10 flex overflow-hidden">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="w-4 h-full bg-black -skew-x-12 mx-1 opacity-20" />
            ))}
          </div>
          
          <div className="relative z-10 flex flex-col items-center space-y-2 text-center">
            <span className="bg-black text-yellow-400 text-[8px] font-mono px-2 py-0.5 rounded tracking-widest mb-1">EGO CHECK</span>
            <p className="text-sm md:text-base leading-snug tracking-tighter">
              🚨 @{prophetName} has locked this take into the global ledger against @{opponentName}. Do you let them get away with this trash talk?
            </p>
          </div>
        </div>

        {/* =========================================================================
           AGGRESSIVE CTAs: PULSING PREMIUM VS FREE CHAINS
           ========================================================================= */}
        <div className="space-y-4 pt-2">
          
          {/* BUTTON A: PULSING PREMIUM GOLD CARD */}
          <button
            onClick={() => setIsCheckoutOpen(true)}
            className="w-full relative flex items-center justify-center gap-2 py-4 px-6 font-sans font-black text-sm uppercase text-black bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 hover:brightness-110 border-4 border-black rounded-2xl cursor-pointer neo-shadow active:scale-[0.98] transition-all select-none animate-[pulse_1.5s_infinite]"
            style={{ animationDuration: '1.2s' }}
            title="Invert team colors and purchase premium counter-brag card"
          >
            <Sparkles size={16} className="animate-spin-slow" />
            <span>⚡ CHALLENGE THIS TAKE ($1.99)</span>
            <ArrowRight size={16} className="stroke-[3]" />
          </button>

          {/* BUTTON B: SLEEK SECURE FREE LINK */}
          <button
            onClick={handleFreeCounterClick}
            className="w-full py-3.5 px-6 font-sans font-black text-xs uppercase text-zinc-350 hover:text-white bg-neutral-900 hover:bg-neutral-800 border-2 border-zinc-800 rounded-xl cursor-pointer transition-all select-none"
            title="Generate a free counter-take slip"
          >
            🐔 OR CREATE A FREE COUNTER-TAKE
          </button>
        </div>

        {/* =========================================================================
           DYNAMIC COUNTER-BRAG OUTPUT (REVEALED ON PAYMENT SUCCESS)
           ========================================================================= */}
        {counterBragActivated && (
          <div className="border-4 border-yellow-400 bg-black/60 rounded-3xl p-5 md:p-6 neo-shadow space-y-4 animate-[fadeIn_0.5s_ease-out]">
            <div className="text-center space-y-1">
              <span className="bg-yellow-400 text-black font-mono text-[8px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-md border border-black animate-bounce inline-block">
                🔥 PREMIUM COUNTER-BRAG ACTIVE 🔥
              </span>
              <h4 className="font-sans font-black text-lg tracking-tighter uppercase leading-none pt-1">
                RIVALRY CARD DEPLOYED
              </h4>
            </div>

            {/* Simulated Animated Gold Counter Card (Inverted rival team colors) */}
            <div className="relative border-4 border-black rounded-2xl p-6 overflow-hidden bg-gradient-to-br from-[#CD9B1D] via-[#2c2201] to-[#CD9B1D] text-[#FFFBD4] golden-shimmer-overlay shadow-2xl">
              <div className="absolute inset-0 bg-radial-gradient from-yellow-500/10 to-transparent pointer-events-none" />
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="font-mono text-[8px] uppercase tracking-widest leading-none font-bold">RIVALRY INVERTED TIER</p>
                  <p className="font-sans font-black text-base mt-0.5">COUNTER PROPHECY</p>
                </div>
                <Trophy className="h-7 w-7 text-yellow-400 opacity-90 animate-[spin_4s_linear_infinite]" />
              </div>

              <div className="space-y-4 font-mono text-[10px] text-zinc-200">
                <div className="border-b border-yellow-500/30 pb-2 flex justify-between font-bold text-yellow-400">
                  <span>INVERTED FIXTURE</span>
                  <span>RIVAL SHIELD</span>
                </div>
                
                {/* Matchup with inverted sequence */}
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-tight text-white leading-none">
                    {match.flagB} {match.teamB} vs {match.teamA} {match.flagA}
                  </p>
                  <p className="text-[8.5px] opacity-75">MATCHUP INVERTED FROM ORIGINAL TICKET</p>
                </div>

                <div className="flex justify-between items-center border-t border-dashed border-yellow-500/20 pt-2 text-[10px]">
                  <span>COUNTER EXPECTED SCORE:</span>
                  <span className="font-black text-sm text-yellow-300">{originalPrediction.predictedScoreB} - {originalPrediction.predictedScoreA}</span>
                </div>

                <div className="flex justify-between items-center text-[10px]">
                  <span>TARGETED COWARD CONTEXT:</span>
                  <span className="font-black text-red-400">@{prophetName}</span>
                </div>
              </div>

              {/* Holographic Footer branding */}
              <div className="border-t border-yellow-500/30 pt-4 mt-6 flex justify-between items-center">
                <div className="h-6 w-32 bg-yellow-400/20 rounded flex items-center justify-center font-mono text-[8px] text-yellow-300 tracking-wider">
                  |||||| ||| |||||
                </div>
                <span className="text-[8px] font-black text-yellow-400">SECURE GOLD MINT</span>
              </div>
            </div>

            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider text-center leading-normal">
              ✅ Rivalry counter-brag has been permanently added to the global ledger. Share this gold card URL back to the group chat to destroy their ego.
            </p>
          </div>
        )}

      </main>

      {/* =========================================================================
         DODO SIMULATOR PAYMENT CHECKOUT OVERLAY
         ========================================================================= */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs transition-opacity duration-300">
          <div className="w-full max-w-md bg-white border-4 border-black text-black rounded-3xl shadow-2xl overflow-hidden relative neo-shadow">
            
            {/* Header line */}
            <div className="absolute top-0 inset-x-0 h-2 bg-yellow-400" />

            {checkoutPhase === 'idle' ? (
              <form onSubmit={handlePaySubmit} className="p-6">
                
                {/* Close Button */}
                <button 
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="absolute top-4 right-4 text-black hover:bg-stone-100 p-1.5 border-2 border-black rounded-full cursor-pointer transition-colors"
                  aria-label="Close"
                >
                  <X size={16} className="stroke-[3]" />
                </button>

                <div className="flex items-center gap-3.5 mb-5 mt-2">
                  <div className="p-2.5 rounded-xl border-2 border-black bg-yellow-400 text-black shrink-0">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h3 className="font-sans font-black text-xl text-black uppercase tracking-tight">
                      Deploy Counter Challenge
                    </h3>
                    <p className="text-xs text-zinc-650 font-bold uppercase tracking-wide mt-0.5">
                      Instantly generate a premium, color-inverted rivalry card. Lock it in for <span className="text-yellow-600 font-black">$1.99.</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-black uppercase tracking-wider mb-1">Billing Email</label>
                    <input
                      type="email"
                      required
                      value={billingEmail}
                      onChange={(e) => setBillingEmail(e.target.value)}
                      placeholder="fan@worldcup2026.com"
                      className="w-full bg-stone-50 border-2 border-black rounded-xl py-2 px-3 text-sm text-black placeholder-zinc-400 font-bold focus:ring-4 focus:ring-yellow-400 focus:outline-hidden transition-all font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-black uppercase tracking-wider mb-1">Your Challenger Handle</label>
                    <input
                      type="text"
                      required
                      value={billingName}
                      onChange={(e) => setBillingName(e.target.value)}
                      placeholder="e.g. Challenger_Bru"
                      className="w-full bg-stone-50 border-2 border-black rounded-xl py-2 px-3 text-sm text-black placeholder-zinc-400 font-bold focus:ring-4 focus:ring-yellow-400 focus:outline-hidden transition-all font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-black uppercase tracking-wider mb-1">Card Number (Simulator Only)</label>
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4000 1234 5678 9010"
                      className="w-full bg-stone-50 border-2 border-black rounded-xl py-2 px-3 text-sm text-black placeholder-zinc-400 font-bold focus:ring-4 focus:ring-yellow-400 focus:outline-hidden transition-all font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-black uppercase tracking-wider mb-1">Expiration</label>
                      <input
                        type="text"
                        required
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        placeholder="MM/YY"
                        className="w-full bg-stone-50 border-2 border-black rounded-xl py-2 px-3 text-sm text-black placeholder-zinc-400 font-bold focus:ring-4 focus:ring-yellow-400 focus:outline-hidden transition-all font-mono text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-black uppercase tracking-wider mb-1">CVC</label>
                      <input
                        type="password"
                        required
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value)}
                        placeholder="•••"
                        className="w-full bg-stone-50 border-2 border-black rounded-xl py-2 px-3 text-sm text-black placeholder-zinc-400 font-bold focus:ring-4 focus:ring-yellow-400 focus:outline-hidden transition-all font-mono text-center"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-6 py-4 px-4 font-sans font-black uppercase text-sm rounded-2xl cursor-pointer border-4 border-black bg-yellow-400 hover:bg-yellow-300 text-black neo-shadow hover:brightness-110 transition-all select-none"
                >
                  🔓 UNLOCK COUNTER-BRAG — $1.99
                </button>

                <div className="flex items-center justify-center gap-1 mt-4 text-[9px] text-zinc-550 font-bold font-sans uppercase">
                  <Lock size={10} className="text-black" />
                  <span>SECURE GATEWAY ACTIVE</span>
                  <span className="text-black font-black">•</span>
                  <ShieldCheck size={10} className="text-black" />
                  <span>DODO SIMULATION GATE</span>
                </div>
              </form>
            ) : checkoutPhase === 'processing' ? (
              <div className="p-10 flex flex-col items-center justify-center text-center min-h-[360px] text-black">
                <div className="relative flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-full border-4 border-stone-200 border-t-yellow-400 animate-spin" />
                  <CreditCard className="absolute top-1/2 left-1/2 -ml-3 -mt-3 text-black animate-pulse" size={24} />
                </div>
                <h4 className="text-lg font-black font-sans tracking-wide">PROCESSING CHALLENGE</h4>
                <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-mono font-bold">STAMPING RIVALRY CARDS IN LEDGER...</p>
              </div>
            ) : (
              <div className="p-10 flex flex-col items-center justify-center text-center min-h-[360px] text-black">
                <div className="w-16 h-16 rounded-full bg-green-100 border-4 border-black flex items-center justify-center neo-shadow-sm mb-6 animate-bounce">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="text-2xl font-black font-sans uppercase tracking-tight text-green-600">
                  CHALLENGE ACTIVATED!
                </h4>
                <p className="text-xs text-zinc-600 mt-2 uppercase tracking-widest font-mono font-black">
                  RIVALRY PRE-MATCH RECORD INJECTED.
                </p>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Ticker Footer */}
      <footer className="fixed bottom-0 left-0 right-0 h-12 bg-black flex items-center overflow-hidden border-t-4 border-black z-10">
        <div className="animate-marquee whitespace-nowrap flex items-center gap-16 font-black text-yellow-400 text-xs tracking-widest uppercase">
          <span>🚨 LIVE EGO WALL RIVALRIES COMBUSTING IN 44 COUNTRIES</span>
          <span>//</span>
          <span>🔒 DON'T LET THEIR TRASH TALK GO UNCHALLENGED</span>
          <span>//</span>
          <span>🍷 PREMIUM BRAG CODES MATURING PRE-KICKOFF</span>
          <span>//</span>
          <span>🚨 LOCK IN YOUR RIVAL CARD BEFORE WHISTLE BLOWS</span>
        </div>
      </footer>
    </div>
  );
}
