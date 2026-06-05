import React, { useState, useEffect } from 'react';
import { Trophy, ShieldCheck, Sparkles, AlertTriangle, Flame, TrendingUp, DollarSign } from 'lucide-react';
import { Prediction } from './types';
import { decodePrediction, encodePrediction } from './data';
import ReceiptForm from './components/ReceiptForm';
import ReceiptView from './components/ReceiptView';
import SimulationCheckout from './components/SimulationCheckout';
import GlobalHub from './components/GlobalHub';
import { submitPrediction } from './api';

export default function App() {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [viewingShared, setViewingShared] = useState(false);
  const [isGolden, setIsGolden] = useState(false);
  const [challengePreFill, setChallengePreFill] = useState<Prediction | null>(null);
  
  // Checkout simulator state managers
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutType, setCheckoutType] = useState<'gold' | 'tip'>('gold');
  const [checkoutAmount, setCheckoutAmount] = useState(1.99);

  // Audio chime player for successful golden upgrades
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

  // Parse deep share URLs and payment webhook returns on boot
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encodedPayload = params.get('r');
    if (encodedPayload) {
      const decoded = decodePrediction(encodedPayload);
      if (decoded) {
        const paymentSuccess = params.get('payment_success') === 'true';
        const paymentType = params.get('type') || 'gold';
        const customText = params.get('customText') || '';
        const tipAmtStr = params.get('amount') || '0';

        if (paymentSuccess) {
          if (paymentType === 'gold') {
            const updated: Prediction = {
              ...decoded,
              isGolden: true,
              goldenMessage: customText || decoded.goldenMessage || "PROVED TO BE CORRECT"
            };
            setPrediction(updated);
            setIsGolden(true);
            setViewingShared(true);
            setTimeout(() => {
              playGoldChime();
            }, 300);

            // Sync clean URL without transaction metadata
            const newUrl = `${window.location.origin}${window.location.pathname}?r=${encodePrediction(updated)}`;
            window.history.pushState({ path: newUrl }, '', newUrl);
          } else {
            const tipAmt = parseFloat(tipAmtStr);
            const updated: Prediction = {
              ...decoded,
              tipAmount: (decoded.tipAmount || 0) + tipAmt
            };
            setPrediction(updated);
            setViewingShared(true);
            
            const newUrl = `${window.location.origin}${window.location.pathname}?r=${encodePrediction(updated)}`;
            window.history.pushState({ path: newUrl }, '', newUrl);
          }
        } else {
          setPrediction(decoded);
          setViewingShared(true);
          setIsGolden(decoded.isGolden);
        }
      }
    }
  }, []);

  // Update URL search parameters when a new prediction is generated to support organic bookmarking/sharing
  const handlePredictionSubmit = async (newPred: Prediction) => {
    let savedPred: Prediction = newPred;
    try {
      savedPred = await submitPrediction(newPred);
    } catch (e) {
      console.warn("Global database registration failed. Defaulting to client state: ", e);
    }
    setPrediction(savedPred);
    setViewingShared(false);
    setChallengePreFill(null);
    // Sync browser URL history on the client
    const newUrl = `${window.location.origin}${window.location.pathname}?r=${encodePrediction(savedPred)}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  };

  // Convert current view-only or active receipt into Golden Tier
  const handleUpgradeSuccess = (customMessage?: string) => {
    setIsGolden(true);
    if (prediction) {
      const updated: Prediction = {
        ...prediction,
        isGolden: true,
        goldenMessage: customMessage || prediction.goldenMessage || "PROVED TO BE CORRECT"
      };
      setPrediction(updated);
      
      // Update URL search parameter
      const newUrl = `${window.location.origin}${window.location.pathname}?r=${encodePrediction(updated)}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
    }
  };

  const handleTipSuccess = (customMessage?: string, tipAmount?: number) => {
    if (prediction && tipAmount) {
      const updated: Prediction = {
        ...prediction,
        tipAmount: (prediction.tipAmount || 0) + tipAmount
      };
      setPrediction(updated);
      
      const newUrl = `${window.location.origin}${window.location.pathname}?r=${encodePrediction(updated)}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
    }
  };

  const handleBackToForm = () => {
    setPrediction(null);
    setViewingShared(false);
    setIsGolden(false);
    setChallengePreFill(null);
    // Reset URL to base path
    const cleanUrl = `${window.location.origin}${window.location.pathname}`;
    window.history.pushState({ path: cleanUrl }, '', cleanUrl);
  };

  const handleChallenge = (counterPrediction: Prediction) => {
    setChallengePreFill(counterPrediction);
    setPrediction(null);
    setViewingShared(false);
    setIsGolden(false);
    
    const newUrl = `${window.location.origin}${window.location.pathname}?r=${encodePrediction(counterPrediction)}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  };

  const triggerCheckout = (type: 'gold' | 'tip', amount: number) => {
    setCheckoutType(type);
    setCheckoutAmount(amount);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="min-h-screen bg-emerald-600 text-white flex flex-col relative overflow-x-hidden font-sans pb-12">
      {/* Sharing Viewer Global banner */}
      {viewingShared && prediction && (
        <div className="bg-yellow-400 text-black py-3 px-4 text-center text-xs font-black uppercase tracking-wider flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2 relative z-40 border-b-4 border-black">
          <span className="flex items-center justify-center gap-1.5">
            <AlertTriangle size={14} className="animate-pulse" />
            LIVE FOOTBALL RECEIPT FROM: {prediction.name.toUpperCase()}
          </span>
          <button
            onClick={handleBackToForm}
            className="bg-black hover:bg-zinc-900 text-yellow-400 font-extrabold text-[10px] px-3.5 py-1.5 rounded-lg border-2 border-black neo-shadow-sm uppercase tracking-wider cursor-pointer transition-all self-center"
          >
            ❌ Stamp My Own Predictions Card
          </button>
        </div>
      )}

      {/* Header Navigation consistent with design draft */}
      <nav className="h-auto py-4 sm:py-0 sm:h-20 bg-emerald-700 px-4 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-b-4 border-black relative z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-400 border-2 border-black rounded-lg flex items-center justify-center font-black text-black text-xl italic font-sans neo-shadow-sm">
            RT
          </div>
          <span className="text-2xl font-black uppercase tracking-tighter text-white">
            The Receipt of Truth
          </span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="px-3 py-1 bg-black text-yellow-400 text-[10px] sm:text-xs font-black rounded-lg border border-black uppercase tracking-wider">
            World Cup 2026 Edition
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-black text-zinc-100">142,852 MINTED</span>
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border border-black"></div>
          </div>
        </div>
      </nav>

      {/* Main Container Wrapper */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 relative z-10 flex flex-col justify-between">
        {/* Core Header branding */}
        <header className="text-center space-y-4 mb-8 max-w-3xl mx-auto py-2">
          <h1 className="font-sans font-black text-4xl sm:text-6xl tracking-tight leading-none text-white uppercase italic scale-y-105 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            LOCK IN YOUR <span className="text-yellow-400 uppercase">BRAGGING RIGHTS</span>.
          </h1>
          <p className="text-xs sm:text-sm text-stone-100 max-w-2xl mx-auto font-sans font-bold uppercase tracking-wider leading-relaxed">
            Generate digital, time-stamped proof of your football predictions before kickoff. Shut down the revisionists forever.
          </p>
        </header>

        {/* Dynamic content modules */}
        <main className="flex-1 flex flex-col justify-center max-w-4xl w-full mx-auto">
          {prediction ? (
            /* Render active predictions receipt view */
            <div className="animate-[fadeIn_0.4s_ease-out]">
              <ReceiptView
                key={prediction.id}
                prediction={prediction}
                onBackToEdit={handleBackToForm}
                onUpgradeClick={() => triggerCheckout('gold', 1.99)}
                onTipClick={(amount) => triggerCheckout('tip', amount)}
                onChallenge={handleChallenge}
              />
            </div>
          ) : (
            /* Form module and viral telemetry */
            <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
              <ReceiptForm
                onSubmit={handlePredictionSubmit}
                onUpgradeClick={() => triggerCheckout('gold', 1.99)}
                isGolden={isGolden}
                initialPrediction={challengePreFill}
              />

              {/* Holographic Viral Counter boards - Neo Brutalist layout */}
              <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white border-4 border-black p-4 rounded-2xl flex items-center gap-3.5 text-black neo-shadow">
                  <div className="p-2.5 bg-emerald-500/10 text-emerald-700 rounded-xl border-2 border-black">
                    <ShieldCheck size={20} className="stroke-[3]" />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider block">IMMUTABILTY SCORE</span>
                    <span className="text-sm font-black font-mono">100% CRYSTAL VERIFIED</span>
                  </div>
                </div>

                <div className="bg-white border-4 border-black p-4 rounded-2xl flex items-center gap-3.5 text-black neo-shadow">
                  <div className="p-2.5 bg-yellow-400/20 text-yellow-600 rounded-xl border-2 border-black">
                    <Trophy size={20} className="stroke-[3] text-stone-900" />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider block">GLOBAL ESTIMATE</span>
                    <span className="text-sm font-black font-mono">50,251 UPGRADED</span>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* Centralized Global Oracle Board with Search, Analytics, and Real-Time Resolutions */}
          <GlobalHub 
            onSelectPrediction={(pred) => {
              setPrediction(pred);
              setViewingShared(true);
              setIsGolden(pred.isGolden || false);
            }}
            currentPredictionId={prediction?.id}
          />
        </main>
      </div>

      {/* Sticky footer news ticker compatible with the design requirement */}
      <footer className="fixed bottom-0 left-0 right-0 h-12 bg-black flex items-center overflow-hidden border-t-4 border-black z-40">
        <div className="animate-marquee whitespace-nowrap flex items-center gap-16 font-black text-yellow-400 text-xs tracking-widest uppercase">
          <span>LIVE FROM NEW JERSEY: ARGENTINA VS BRAZIL KICKOFF IN T-MINUS 04:22:11</span>
          <span>//</span>
          <span>NEW DIGITAL TRUTH RECEIPT ISSUED FOR FAN_NEYMAR_10</span>
          <span>//</span>
          <span>GOLDEN REVEAL UPGRADES TRENDING VIRALLY ACROSS 44 COUNTRIES</span>
          <span>//</span>
          <span>VERIFIED TIME-STAMPING PRE-MATCH ORACLE ONLINE AND HOSTING SECURE</span>
          <span>//</span>
          <span>LIVE FROM NEW JERSEY: ARGENTINA VS BRAZIL KICKOFF IN T-MINUS 04:22:11</span>
          <span>//</span>
          <span>NEW DIGITAL TRUTH RECEIPT ISSUED FOR FAN_NEYMAR_10</span>
          <span>//</span>
          <span>GOLDEN REVEAL UPGRADES TRENDING VIRALLY ACROSS 44 COUNTRIES</span>
          <span>//</span>
          <span>VERIFIED TIME-STAMPING PRE-MATCH ORACLE ONLINE AND HOSTING SECURE</span>
        </div>
      </footer>

      {/* Simulated Secure Payment Checkout Overlay */}
      <SimulationCheckout
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={
          checkoutType === 'gold' 
            ? (msg) => handleUpgradeSuccess(msg) 
            : (msg, tipAmt) => handleTipSuccess(msg, tipAmt)
        }
        type={checkoutType}
        amount={checkoutAmount}
        predictionPayload={prediction ? encodePrediction(prediction) : ""}
      />
    </div>
  );
}
