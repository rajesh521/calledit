import React, { useState, useEffect } from 'react';
import { CreditCard, ShieldCheck, Lock, X, Sparkles, Coins, Trophy, Heart } from 'lucide-react';

interface SimulationCheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (customMessage?: string, tipAmount?: number) => void;
  type: 'gold' | 'tip' | 'burn';
  amount: number;
  predictionPayload?: string;
  country?: string;
  initialCustomText?: string;
}

export default function SimulationCheckout({
  isOpen,
  onClose,
  onSuccess,
  type,
  amount,
  predictionPayload = "",
  country = "US",
  initialCustomText = ""
}: SimulationCheckoutProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardName, setCardName] = useState('');
  const [customWord, setCustomWord] = useState('');
  const [billingEmail, setBillingEmail] = useState('');
  const [bundleMode, setBundleMode] = useState<'single' | 'bundle'>('single');
  
  // Effective price depends on bundle mode
  const effectiveAmount = type === 'gold' && bundleMode === 'bundle' ? 4.99 : amount;
  
  // Payment phases: 'idle' | 'submitting' | 'verifying' | 'stamping' | 'success'
  const [phase, setPhase] = useState<'idle' | 'submitting' | 'verifying' | 'stamping' | 'success'>('idle');
  const [stepTimer, setStepTimer] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCustomWord(initialCustomText);
    } else {
      setPhase('idle');
      setCardNumber('');
      setExpiry('');
      setCvc('');
      setCardName('');
      setCustomWord('');
      setBillingEmail('');
      setStepTimer(0);
    }
  }, [isOpen, initialCustomText]);

  // Audio synthetically generated using Web Audio API for a perfect retro arcade success sound
  const playGoldChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;
      
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(1046.50, now + 0.15); // C6
      osc1.frequency.exponentialRampToValueAtTime(1318.51, now + 0.35); // E6
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(261.63, now); // C4
      osc2.frequency.exponentialRampToValueAtTime(523.25, now + 0.2); // C5
      osc2.frequency.exponentialRampToValueAtTime(783.99, now + 0.4); // G5
      
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

  useEffect(() => {
    let timerIdx: NodeJS.Timeout;
    if (phase === 'submitting') {
      timerIdx = setTimeout(() => {
        setPhase('verifying');
      }, 1200);
    } else if (phase === 'verifying') {
      timerIdx = setTimeout(() => {
        setPhase('stamping');
      }, 1000);
    } else if (phase === 'stamping') {
      timerIdx = setTimeout(() => {
        setPhase('success');
        playGoldChime();
      }, 1000);
    } else if (phase === 'success') {
      timerIdx = setTimeout(() => {
        onSuccess(customWord, type === 'tip' ? amount : undefined);
        onClose();
      }, 1500);
    }
    return () => clearTimeout(timerIdx);
  }, [phase]);

  if (!isOpen) return null;

  // Auto layout spacing for formatted card strings
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 16) val = val.substring(0, 16);
    let chunks = val.match(/.{1,4}/g) || [];
    setCardNumber(chunks.join(' '));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 4) val = val.substring(0, 4);
    if (val.length > 2) {
      setExpiry(`${val.substring(0, 2)}/${val.substring(2)}`);
    } else {
      setExpiry(val);
    }
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 3) val = val.substring(0, 3);
    setCvc(val);
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phase !== 'idle') return;
    
    setPhase('submitting');

    try {
      const response = await fetch('/api/dodo/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          amount,
          email: billingEmail || "customer@example.com",
          country: country,
          customText: customWord,
          predictionPayload: predictionPayload
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url && !data.isSimulated) {
          // Real checkout redirect
          window.location.href = data.url;
          return;
        }
      }
    } catch (err) {
      console.warn("Backend Dodo Payments endpoint not configured or error. Falling back to the robust offline simulator flow.", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs transition-opacity duration-300">
      <div 
        id="checkout-modal-card" 
        className="w-full max-w-md bg-white border-4 border-black text-black rounded-3xl shadow-2xl overflow-hidden relative neo-shadow"
      >
        {/* Header background accents */}
        <div className={`absolute top-0 inset-x-0 h-2 ${type === 'gold' ? 'bg-yellow-400' : type === 'burn' ? 'bg-red-600' : 'bg-red-500'}`} />
        
        {/* Close Button */}
        {phase === 'idle' && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-black hover:bg-stone-100 p-1.5 border-2 border-black rounded-full cursor-pointer transition-colors"
            aria-label="Close"
          >
            <X size={16} className="stroke-[3]" />
          </button>
        )}

        {phase === 'idle' ? (
          <form onSubmit={handlePaySubmit} className="p-6">
            <div className="flex items-center gap-3.5 mb-5 mt-2">
              <div className={`p-2.5 rounded-xl border-2 border-black ${type === 'gold' ? 'bg-yellow-400 text-black' : type === 'burn' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-500'}`}>
                {type === 'gold' ? <Sparkles size={24} /> : type === 'burn' ? <span className="text-2xl">🔥</span> : <Coins size={24} />}
              </div>
              <div>
                <h3 className="font-sans font-black text-xl text-black uppercase tracking-tight">
                  {type === 'gold' ? 'Unlock Brag Mode' : type === 'burn' ? '🔥 Burn the Evidence' : 'Tip the Creator'}
                </h3>
                <p className="text-xs text-zinc-650 font-bold uppercase tracking-wide mt-0.5">
                  {type === 'gold' ? 'Lock in your "I Knew It" moment. Official proof for only' : type === 'burn' ? 'Remove your brag from the public Wall of Shame before your friends find it.' : 'Support the single-day World Cup builder!'} {type !== 'burn' && `$${effectiveAmount.toFixed(2)}`}
                  {type === 'burn' && <span className="ml-1 text-red-600 font-black">Only $0.99.</span>}
                </p>
              </div>
            </div>

            {/* Bundle Tier Selector (Gold only) */}
            {type === 'gold' && (
              <div className="flex border-2 border-black rounded-xl overflow-hidden mb-4 text-xs font-black uppercase">
                <button
                  type="button"
                  onClick={() => setBundleMode('single')}
                  className={`flex-1 py-2.5 px-2 relative flex flex-col items-center transition-all cursor-pointer ${
                    bundleMode === 'single' ? 'bg-yellow-400 text-black' : 'bg-stone-50 text-zinc-600 hover:bg-stone-100'
                  }`}
                >
                  <span className="leading-none">1 Golden</span>
                  <span className="font-mono text-[10px] mt-0.5 opacity-80">$1.99</span>
                  {bundleMode === 'single' && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-black text-yellow-400 text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider whitespace-nowrap">Most Popular</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setBundleMode('bundle')}
                  className={`flex-1 py-2.5 px-2 flex flex-col items-center transition-all cursor-pointer border-l-2 border-black relative ${
                    bundleMode === 'bundle' ? 'bg-yellow-400 text-black' : 'bg-stone-50 text-zinc-600 hover:bg-stone-100'
                  }`}
                >
                  <span className="leading-none">3 Bundle</span>
                  <span className="font-mono text-[10px] mt-0.5 opacity-80">$4.99</span>
                  {bundleMode === 'bundle' && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider whitespace-nowrap">Best Value</span>
                  )}
                </button>
              </div>
            )}

            {/* Social Proof Counter */}
            {type === 'gold' && (
              <div className="flex items-center justify-center gap-2 bg-stone-50 border border-zinc-200 rounded-xl py-2 px-3 mb-4">
                <div className="flex -space-x-1">
                  {['🍷','🔥','🥛','🏆'].map((e, i) => <span key={i} className="text-sm">{e}</span>)}
                </div>
                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-wider">
                  <strong className="text-yellow-600">1,247</strong> fans unlocked Brag Mode today
                </span>
              </div>
            )}

            {/* Glowing card display mockup */}
            <div className={`relative rounded-2xl p-5 mb-5 overflow-hidden border-2 border-black ${type === 'gold' ? 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 text-black shadow-lg shadow-yellow-500/10' : 'bg-gradient-to-br from-stone-100 to-stone-200 text-black'} shadow-sm`}>
              {/* Shimmer element */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="font-mono text-[9px] uppercase text-black font-black tracking-widest leading-none">OFFICIAL BRAG CARD</p>
                  <p className="font-sans font-black text-base tracking-tight text-black mt-0.5">{type === 'gold' ? 'BRAG MODE ACTIVATED' : 'CREATOR SUPPORT'}</p>
                </div>
                <Trophy className={`h-8 w-8 ${type === 'gold' ? 'text-black' : 'text-stone-500'} opacity-80`} />
              </div>

              <div className="mb-4">
                <p className="font-mono text-lg text-black font-black tracking-widest">
                  {cardNumber || '•••• •••• •••• ••••'}
                </p>
              </div>

              <div className="flex justify-between items-end">
                <div>
                  <p className="font-mono text-[8px] text-black/60 uppercase tracking-wider font-extrabold">HOLDER LABEL</p>
                  <p className="font-mono text-xs uppercase tracking-wide text-black font-black max-w-[200px] truncate">
                    {cardName || 'YOUR FOOTBALL NAME'}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[8px] text-black/60 uppercase tracking-wider font-extrabold">EXPIRY</p>
                  <p className="font-mono text-xs text-black font-black">{expiry || 'MM/YY'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Premium Receipt custom text input */}
              {type === 'gold' && (
                <div>
                  <label className="block text-xs font-black text-black uppercase tracking-wider mb-1.5">
                    Your Custom Brag Line (Optional)
                  </label>
                  <input
                    type="text"
                    required={false}
                    placeholder='e.g. "Argentina wins 2-1, I called it before kickoff."'
                    maxLength={40}
                    value={customWord}
                    onChange={(e) => setCustomWord(e.target.value)}
                    className="w-full bg-stone-50 border-2 border-black rounded-xl py-2 px-3 text-sm text-black placeholder-zinc-450 font-bold focus:ring-4 focus:ring-yellow-400 focus:outline-hidden transition-all"
                  />
                  <span className="text-[10px] text-stone-500 block text-right font-bold mt-1 uppercase">
                    {customWord.length}/40 characters (Brag Mode perk)
                  </span>
                </div>
              )}

              {/* Real-world Simulator Card Inputs */}
              <div>
                <label className="block text-xs font-black text-black uppercase tracking-wider mb-1.5 font-sans">Billing Email</label>
                <input
                  type="email"
                  required
                  placeholder="fan@worldcup2026.com"
                  value={billingEmail}
                  onChange={(e) => setBillingEmail(e.target.value)}
                  className="w-full bg-stone-50 border-2 border-black rounded-xl py-2 px-3 text-sm text-black placeholder-zinc-400 font-bold focus:ring-4 focus:ring-yellow-400 focus:outline-hidden transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-black uppercase tracking-wider mb-1.5 font-sans">Name on Signature Card</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. G.O.A.T Fan"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="w-full bg-stone-50 border-2 border-black rounded-xl py-2 px-3 text-sm text-black placeholder-zinc-400 font-bold focus:ring-4 focus:ring-yellow-400 focus:outline-hidden transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-black uppercase tracking-wider mb-1.5 font-sans">Card Number (Simulator Only)</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={19}
                    placeholder="4000 1234 5678 9010"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    className="w-full bg-stone-50 border-2 border-black rounded-xl py-2 px-3 pr-10 text-sm text-black placeholder-zinc-400 font-bold focus:ring-4 focus:ring-yellow-400 focus:outline-hidden transition-all font-mono"
                  />
                  <div className="absolute right-3 top-2.5 text-black">
                    <CreditCard size={18} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-black uppercase tracking-wider mb-1.5">Expiration</label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={handleExpiryChange}
                    className="w-full bg-stone-50 border-2 border-black rounded-xl py-2 px-3 text-sm text-black placeholder-zinc-450 font-bold focus:ring-4 focus:ring-yellow-400 focus:outline-hidden transition-all font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-black uppercase tracking-wider mb-1.5">CVC Code</label>
                  <input
                    type="password"
                    required
                    maxLength={3}
                    placeholder="•••"
                    value={cvc}
                    onChange={handleCvcChange}
                    className="w-full bg-stone-50 border-2 border-black rounded-xl py-2 px-3 text-sm text-black placeholder-stone-400 font-bold focus:ring-4 focus:ring-yellow-400 focus:outline-hidden transition-all font-mono text-center"
                  />
                </div>
              </div>
            </div>

            {/* Simulated Payment Button */}
            <button
              type="submit"
              className={`w-full mt-6 py-4 px-4 font-sans font-black uppercase text-sm rounded-2xl cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 transition-all border-4 border-black neo-shadow ${
                type === 'gold' 
                  ? 'bg-yellow-400 text-black shadow-yellow-500/10 hover:brightness-110'
                  : type === 'burn'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-red-500 text-white'
              }`}
            >
              {type === 'gold' 
                ? `🔓 Unlock Brag Mode — $${effectiveAmount.toFixed(2)}${bundleMode === 'bundle' ? ' (3 Brag Cards)' : ''}` 
                : type === 'burn'
                  ? `🔥 Burn The Evidence — $0.99`
                  : `Process Voluntary Tip $${effectiveAmount.toFixed(2)}`}
            </button>

            {/* Credentials / Security indicators */}
            <div className="flex items-center justify-center gap-1.5 mt-4 text-[9px] text-zinc-500 font-bold font-sans uppercase">
              <Lock size={11} className="text-black" />
              <span>STRICT 256-BIT SANDBOX SECURITY GATEWAY</span>
              <span className="text-black font-black">•</span>
              <ShieldCheck size={11} className="text-black" />
              <span>TESTNET INTEGRATION ACTIVE</span>
            </div>
          </form>
        ) : (
          /* Processing Phases */
          <div className="p-10 flex flex-col items-center justify-center text-center min-h-[420px] text-black">
            {phase === 'submitting' && (
              <div className="space-y-6">
                <div className="relative flex justify-center">
                  <div className="w-16 h-16 rounded-full border-4 border-stone-200 border-t-black animate-spin" />
                  <CreditCard className="absolute top-1/2 left-1/2 -ml-3 -mt-3 text-black" size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-black font-sans tracking-wide">CONNECTING GATEWAY</h4>
                  <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-mono font-bold">INITIATING DIGITAL TRANSACTION SHIELD...</p>
                </div>
              </div>
            )}

            {phase === 'verifying' && (
              <div className="space-y-6 animate-pulse">
                <div className="relative flex justify-center">
                  <div className={`w-16 h-16 rounded-full border-4 border-stone-200 ${type === 'burn' ? 'border-t-red-600' : 'border-t-yellow-400'} animate-[spin_0.6s_linear_infinite]`} />
                  <ShieldCheck className="absolute top-1/2 left-1/2 -ml-3 -mt-3 text-yellow-550" size={24} opacity={0.9} />
                </div>
                <div>
                  <h4 className="text-lg font-black font-sans tracking-wide">
                    {type === 'burn' ? '🔥 INCINERATING EVIDENCE…' : 'LOCKING IN YOUR BRAG'}
                  </h4>
                  <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-mono font-bold">
                    {type === 'burn' ? 'ERASING FROM PUBLIC WALL OF SHAME…' : 'SEALING PROOF BEFORE KICKOFF…'}
                  </p>
                </div>
              </div>
            )}

            {phase === 'stamping' && (
              <div className="space-y-6">
                <div className="relative flex justify-center scale-110">
                  <div className={`w-16 h-16 rounded-full ${type === 'burn' ? 'bg-red-500' : 'bg-yellow-400'} animate-ping absolute opacity-40`} />
                  <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center border-2 border-black">
                    {type === 'burn' ? (
                      <span className="text-2xl animate-bounce">🔥</span>
                    ) : (
                      <Trophy className="text-yellow-400 animate-bounce" size={28} />
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-black font-sans tracking-wide">
                    {type === 'burn' ? '🔥 ERASING EVIDENCE' : '🔒 LOCKING YOUR I KNEW IT MOMENT'}
                  </h4>
                  <p className="text-xs text-black mt-1 uppercase font-black tracking-widest font-mono">
                    {type === 'gold' ? 'STAMPING YOUR OFFICIAL BRAG CARD…' : type === 'burn' ? 'DELINKING FROM PUBLIC SHAME WALL...' : 'CREDITING CREATOR COFFEE POOL...'}
                  </p>
                </div>
              </div>
            )}

            {phase === 'success' && (
              <div className="space-y-6 animate-[scaleIn_0.3s_cubic-bezier(0.16,1,0.3,1)]">
                <div className={`w-16 h-16 rounded-full ${type === 'burn' ? 'bg-red-100 border-red-600' : 'bg-green-100'} border-4 border-black flex items-center justify-center neo-shadow-sm`}>
                  {type === 'burn' ? (
                    <span className="text-3xl">🔥</span>
                  ) : (
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div>
                  <h4 className={`text-2xl font-black font-sans uppercase tracking-tight ${type === 'burn' ? 'text-red-600' : 'text-green-600'}`}>
                    {type === 'gold' ? '🔒 BRAG MODE ACTIVATED!' : type === 'burn' ? 'GONE. 🔥 INCINERATED.' : 'TIP APPRECIATED!'}
                  </h4>
                  <p className="text-xs text-zinc-650 mt-2 uppercase tracking-widest font-mono font-black">
                    {type === 'gold' ? '🍷 YOUR "I KNEW IT" MOMENT IS NOW SEALED.' : type === 'burn' ? 'Your enemies will never know. 😈' : 'GOD-MODE INSIGHTS ACCREDITED.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
