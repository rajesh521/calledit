import React, { useState, useEffect } from 'react';
import { Plus, Trash, Trophy, Sparkles, ChevronRight, Shuffle, Target, Flame } from 'lucide-react';
import { Prediction, MatchPreset } from '../types';
import { WORLD_CUP_MATCHES, generateTransactionId, formatFriendlyDate, calculateViralIndicators } from '../data';

// The full 40-brag arsenal — pre-written nuclear takes organized by flavor
const TRASH_TALK_POOL = [
  // 🔥 Spicy
  "Mexico's defense is going to fold like a lawn chair.",
  "This goalkeeper couldn't stop a beach ball today.",
  "Their striker has gone cold. I'm calling a blank sheet performance.",
  "Second half collapse incoming. Screen this.",
  "This ref is going to hand them a gift penalty. Watch.",
  "They haven't won in 6 away games. Today is not the day.",
  "Set piece kings. First corner = first goal. Lock it in.",
  "Their captain is injured. Without him they're nothing.",
  // 💣 Nuclear
  "If [Team A] doesn't win by 2, I'll never talk about football again.",
  "Hat-trick incoming. I've staked my reputation on it.",
  "This is a 4-0. I'm so confident it's embarrassing.",
  "Messi is walking away with the Golden Boot. Full stop.",
  "This is the upset of the tournament. Nobody sees it coming except me.",
  "They're going out in the groups. I said it in January.",
  "Penalty shootout. And they're going to miss two. Trust me.",
  "Early red card. Changes everything. I'm calling it now.",
  // 🎯 Confident
  "Vini Jr scores before the 20th minute. It's just physics at this point.",
  "Both teams score. Neither defense deserves to exist.",
  "The favorite wins but only just. Nervy 1-0 after extra time.",
  "My model says 2-1. My model is never wrong.",
  "This team always performs in big tournaments. History says they win.",
  "Top scorer of the tournament has a hat-trick today. Receipted.",
  "Clean sheet. They're the most organized defense I've seen.",
  "Winner decided by a penalty in the 89th minute. Calling it.",
  // 😏 Smug
  "I've been saying this for 6 months. Nobody listened. Screenshot this.",
  "My WhatsApp group is going to owe me so many apologies.",
  "I said this at the start of the tournament. Still saying it.",
  "When I'm right about this — and I will be — feel free to quote-tweet.",
  "Zero upsets today. The chalk wins. Everyone's overthinking this.",
  "My friend bet against me. My friend is about to lose.",
  "Call me when the final whistle blows. I'll be waiting.",
  "This is why you don't bet with your heart. I bet with data.",
  // 🥛 Chaotic
  "I have no idea why I'm so confident. I just am. Receipted.",
  "Scoreless draw. Absolute snoozefest. You'll thank me.",
  "Somebody scores an own goal in this one. Can feel it.",
  "Extra time guaranteed. Neither team wants to win in 90.",
  "Star player gets injured in the warmup. I'm manifesting nothing.",
  "VAR controversy. Two decisions reversed. Chaos.",
  "Commentator jinx activates at minute 75. Classic.",
  "The underdog wins. I'm the only one who called it.",
];

const LANG_OPTIONS = [
  { code: 'en', flag: '🇬🇧', label: 'English', hint: 'Default' },
  { code: 'es', flag: '🇪🇸', label: 'Español', hint: 'WhatsApp ES' },
  { code: 'pt', flag: '🇧🇷', label: 'Português', hint: 'WhatsApp BR' },
  { code: 'te', flag: '🇮🇳', label: 'తెలుగు', hint: 'WhatsApp IN' },
] as const;

interface ReceiptFormProps {
  onSubmit: (prediction: Prediction) => void;
  onUpgradeClick: () => void;
  isGolden: boolean;
  initialPrediction?: Prediction | null;
  t?: (key: string) => string;
}

export default function ReceiptForm({ onSubmit, onUpgradeClick, isGolden, initialPrediction, t = (k) => k }: ReceiptFormProps) {
  const [wantsGolden, setWantsGolden] = React.useState(false);
  const [name, setName] = useState('');
  const [calledOut, setCalledOut] = useState('');
  const [stakes, setStakes] = useState('');
  const [shareLanguage, setShareLanguage] = useState<'en' | 'es' | 'pt' | 'te'>('en');
  const [matchId, setMatchId] = useState(WORLD_CUP_MATCHES[0].id);
  const [customTeamA, setCustomTeamA] = useState('');
  const [customTeamB, setCustomTeamB] = useState('');

  // Trash Talk Arsenal state
  const [roulettePool, setRoulettePool] = useState<string[]>(() => [...TRASH_TALK_POOL].sort(() => Math.random() - 0.5).slice(0, 12));
  const [pulsedIndex, setPulsedIndex] = useState<number | null>(null);
  const shuffleRoulette = () => {
    setRoulettePool([...TRASH_TALK_POOL].sort(() => Math.random() - 0.5).slice(0, 12));
  };
  const applyBrag = (text: string, idx: number) => {
    setCustomTakeText(text);
    setPulsedIndex(idx);
    setTimeout(() => setPulsedIndex(null), 600);
  };
  
  const [scoreA, setScoreA] = useState('2');
  const [scoreB, setScoreB] = useState('1');
  const [firstGoalscorer, setFirstGoalscorer] = useState('L. Messi');
  const [confidence, setConfidence] = useState<number>(80);
  
  const [boldText, setBoldText] = useState('');
  const [boldPredictions, setBoldPredictions] = useState<string[]>([
    "Score first within thirty minutes",
    "Goalkeeper makes 5+ spectacular saves",
  ]);

  // Dynamic Prediction Modes States
  const [predictionType, setPredictionType] = useState<'match' | 'player' | 'team' | 'custom'>('match');
  const [playerName, setPlayerName] = useState('L. Messi');
  const [playerMarket, setPlayerMarket] = useState('total goals');
  const [playerValue, setPlayerValue] = useState('10');
  const [teamName, setTeamName] = useState('Brazil');
  const [teamMarket, setTeamMarket] = useState('wins the tournament');
  const [customTakeText, setCustomTakeText] = useState('Japan surprises everyone and reaches the quarterfinals');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('test') === 'true') {
      const path = window.location.pathname.toLowerCase();
      const isAr = path.includes('/ar') || (window as any).__LOCALE__ === 'ar';
      if (isAr) {
        setName('العرّاف');
        setCalledOut('نواصري');
        setStakes('ألبس قميص الهلال طوال اليوم');
        setFirstGoalscorer('سالم الدوسري');
        setScoreA('2');
        setScoreB('0');
      }
    }
  }, []);

  useEffect(() => {
    if (initialPrediction) {
      setName(initialPrediction.name || '');
      setCalledOut(initialPrediction.calledOut || '');
      setStakes(initialPrediction.stakes || '');
      setPredictionType(initialPrediction.predictionType || 'match');
      setMatchId(initialPrediction.matchId || WORLD_CUP_MATCHES[0].id);
      setScoreA(initialPrediction.predictedScoreA || '0');
      setScoreB(initialPrediction.predictedScoreB || '0');
      setFirstGoalscorer(initialPrediction.firstGoalscorer || '');
      setConfidence(initialPrediction.confidence || 80);
      setBoldPredictions(initialPrediction.boldPredictions || []);
      
      setPlayerName(initialPrediction.playerName || 'L. Messi');
      setPlayerMarket(initialPrediction.playerMarket || 'total goals');
      setPlayerValue(initialPrediction.playerValue || '10');
      setTeamName(initialPrediction.teamName || 'Brazil');
      setTeamMarket(initialPrediction.teamMarket || 'wins the tournament');
      setCustomTakeText(initialPrediction.customTakeText || '');
      
      // Handle custom match details if applicable
      if (initialPrediction.matchId === 'custom' && initialPrediction.customMatch) {
        // Strip emoji and vs to estimate team name pre-fills
        const stripped = initialPrediction.customMatch.replace(/⚽/g, '').trim();
        const parts = stripped.split(/\s+vs\s+/gi);
        if (parts.length === 2) {
          setCustomTeamA(parts[0].trim());
          setCustomTeamB(parts[1].trim());
        } else {
          setCustomTeamA('Team I');
          setCustomTeamB('Team II');
        }
      }
    }
  }, [initialPrediction]);

  const addBoldPrediction = () => {
    if (!boldText.trim()) return;
    if (boldPredictions.length >= 3) return; // limit to 3 to avoid visual overflow
    setBoldPredictions([...boldPredictions, boldText.trim()]);
    setBoldText('');
  };

  const removeBoldPrediction = (index: number) => {
    setBoldPredictions(boldPredictions.filter((_, i) => i !== index));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let customMatchStr = "";
    let finalMatchId = matchId;
    let finalScoreA = scoreA || '0';
    let finalScoreB = scoreB || '0';
    let finalFirstGoalscorer = firstGoalscorer.trim() || 'No scorer';

    if (predictionType === 'match') {
      if (matchId === 'custom') {
        customMatchStr = `⚽ ${customTeamA || 'Team I'} vs ${customTeamB || 'Team II'} ⚽`;
      }
    } else {
      // Non-match modes default to custom matchId so that the server-side validator is happy
      finalMatchId = 'custom';
      if (predictionType === 'player') {
        customMatchStr = `🏃 ${playerName} — ${playerValue} ${playerMarket}`;
        finalFirstGoalscorer = playerName;
      } else if (predictionType === 'team') {
        customMatchStr = `🏆 ${teamName} — ${teamMarket}`;
      } else if (predictionType === 'custom') {
        customMatchStr = `🔮 Custom Take: ${customTakeText.substring(0, 45)}...`;
      }
    }

    // Determine hot take indicators dynamically per mode
    let consensus = 45;
    let ragePotential = 35;
    let hotTakeLabel: 'MILD' | 'HOT' | 'NUCLEAR' = 'MILD';

    if (predictionType === 'match') {
      const numScoreA = parseInt(scoreA) || 0;
      const numScoreB = parseInt(scoreB) || 0;
      const teamA = matchId === 'custom' ? (customTeamA || 'Team I') : (activeMatch?.teamA || 'Team A');
      const teamB = matchId === 'custom' ? (customTeamB || 'Team II') : (activeMatch?.teamB || 'Team B');
      const indicators = calculateViralIndicators(numScoreA, numScoreB, teamA, teamB);
      consensus = indicators.consensus;
      ragePotential = indicators.ragePotential;
      hotTakeLabel = indicators.hotTakeLabel;
    } else if (predictionType === 'player') {
      const valNum = parseInt(playerValue) || 0;
      if (valNum >= 7 || playerMarket.toLowerCase().includes('hat-trick') || playerValue.toLowerCase().includes('golden boot')) {
        hotTakeLabel = 'NUCLEAR';
        consensus = 6;
        ragePotential = 94;
      } else if (valNum >= 4 || playerMarket.toLowerCase().includes('goals')) {
        hotTakeLabel = 'HOT';
        consensus = 18;
        ragePotential = 72;
      } else {
        hotTakeLabel = 'MILD';
        consensus = 45;
        ragePotential = 28;
      }
    } else if (predictionType === 'team') {
      const criteriaStr = teamMarket.toLowerCase();
      if (criteriaStr.includes('win') || criteriaStr.includes('champion') || criteriaStr.includes('cup') || criteriaStr.includes('unbeaten')) {
        hotTakeLabel = 'NUCLEAR';
        consensus = 8;
        ragePotential = 89;
      } else if (criteriaStr.includes('semifinal') || criteriaStr.includes('final')) {
        hotTakeLabel = 'HOT';
        consensus = 24;
        ragePotential = 65;
      } else {
        hotTakeLabel = 'MILD';
        consensus = 60;
        ragePotential = 20;
      }
    } else if (predictionType === 'custom') {
      const criteriaStr = customTakeText.toLowerCase();
      if (criteriaStr.includes('shock') || criteriaStr.includes('upset') || criteriaStr.includes('conspiracy') || criteriaStr.includes('flop') || criteriaStr.includes('legendary')) {
        hotTakeLabel = 'NUCLEAR';
        consensus = 4;
        ragePotential = 98;
      } else {
        hotTakeLabel = 'HOT';
        consensus = 15;
        ragePotential = 78;
      }
    }

    const newPrediction: Prediction = {
      id: generateTransactionId(),
      name: name.trim() || 'Anonymous',
      matchId: finalMatchId,
      customMatch: customMatchStr || undefined,
      predictedScoreA: finalScoreA,
      predictedScoreB: finalScoreB,
      firstGoalscorer: finalFirstGoalscorer,
      boldPredictions,
      isGolden,
      timestamp: formatFriendlyDate(),
      barcodeValue: `ROT-${Math.floor(100000 + Math.random() * 900005)}`,
      confidence,
      consensus,
      ragePotential,
      hotTakeLabel,
      
      // Mode extra fields
      predictionType,
      playerName: predictionType === 'player' ? playerName.trim() : undefined,
      playerMarket: predictionType === 'player' ? playerMarket.trim() : undefined,
      playerValue: predictionType === 'player' ? playerValue.trim() : undefined,
      teamName: predictionType === 'team' ? teamName.trim() : undefined,
      teamMarket: predictionType === 'team' ? teamMarket.trim() : undefined,
      customTakeText: predictionType === 'custom' ? customTakeText.trim() : undefined,

      // Brag social fields
      calledOut: calledOut.trim() || undefined,
      stakes: stakes.trim() || undefined,
      shareLanguage,
    };

    onSubmit(newPrediction);
    // If user wants golden, open the checkout immediately after generating the receipt
    if (wantsGolden && !isGolden) {
      setTimeout(() => onUpgradeClick(), 200);
    }
  };

  const activeMatch = WORLD_CUP_MATCHES.find(m => m.id === matchId);

  return (
    <div className="bg-white border-4 border-black rounded-3xl p-6 relative overflow-hidden text-black neo-shadow">
      {/* Decorative ambient backdrop */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl pointer-events-none" />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-4 border-black pb-5 mb-6 gap-4">
        <div>
          <h2 className="font-sans font-black text-2xl tracking-tight text-black flex items-center gap-2">
            <Trophy className="text-yellow-500 h-6 w-6 stroke-[3]" />
            LOCK IN YOUR BRAG
          </h2>
          <p className="text-xs text-zinc-650 mt-0.5 font-bold uppercase tracking-wide">Seal your prediction before kickoff. Make it official.</p>
        </div>
        {isGolden ? (
          <span className="flex items-center gap-1.5 text-xs font-black uppercase text-yellow-600 bg-yellow-400/20 px-3 py-1.5 border-2 border-black rounded-xl animate-[pulse_2s_infinite]">
            <Sparkles size={13} /> Gold Activated
          </span>
        ) : (
          <button
            type="button"
            onClick={onUpgradeClick}
            className="flex items-center gap-1.5 text-xs font-black uppercase text-black bg-yellow-400 hover:bg-yellow-300 px-3 py-1.5 border-2 border-black rounded-xl cursor-pointer neo-shadow-sm transition-all"
          >
            <Sparkles size={13} className="animate-spin-slow" /> Go Gold ($1.99)
          </button>
        )}
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* Name + Call Out + Stakes row — the social layer */}
        <div className="space-y-3">
          {/* Your Name */}
          <div>
            <label className="block text-xs font-black text-black uppercase tracking-wider mb-2">
              {t('nameLabel')} <span className="text-zinc-500 font-normal text-[10px] lowercase">{t('callingOutOption')}</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Messi_Fan_99"
              maxLength={20}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-stone-50 border-2 border-black rounded-xl px-4 py-3 text-sm text-black placeholder-zinc-400 font-bold focus:ring-4 focus:ring-yellow-400 focus:outline-hidden transition-all font-mono"
            />
          </div>

          {/* Call Out field — who are you calling out? */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-black uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Target size={12} className="stroke-[3]" /> {t('calledOutLabel')}
                <span className="text-zinc-500 font-normal text-[10px] lowercase normal-case">{t('callingOutOption')}</span>
              </label>
              <input
                type="text"
                placeholder={t('calledOutPlaceholder')}
                maxLength={25}
                value={calledOut}
                onChange={(e) => setCalledOut(e.target.value)}
                className="w-full bg-stone-50 border-2 border-black rounded-xl px-4 py-3 text-sm text-black placeholder-zinc-400 font-bold focus:ring-4 focus:ring-red-400 focus:outline-hidden transition-all font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-black uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Flame size={12} className="stroke-[3]" /> {t('stakesLabel')}
                <span className="text-zinc-500 font-normal text-[10px] lowercase normal-case">{t('stakesOption')}</span>
              </label>
              <input
                type="text"
                placeholder={t('stakesPlaceholder')}
                maxLength={50}
                value={stakes}
                onChange={(e) => setStakes(e.target.value)}
                className="w-full bg-stone-50 border-2 border-black rounded-xl px-4 py-3 text-sm text-black placeholder-zinc-400 font-bold focus:ring-4 focus:ring-orange-400 focus:outline-hidden transition-all font-mono"
              />
            </div>
          </div>
        </div>

        {/* STEP 1: PICK PREDICTION TYPE */}
        <div className="border-t-2 border-dashed border-zinc-300 pt-4">
          <label className="block text-xs font-black text-black uppercase tracking-wider mb-2">
            STEP 1: SELECT PREDICTION TYPE
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { id: 'match', label: '🏟️ Match', desc: 'Core match outcomes' },
              { id: 'player', label: '🏃 Player', desc: 'Goals, assists & stats' },
              { id: 'team', label: '🏆 Team', desc: 'Tournament stages' },
              { id: 'custom', label: '🔮 Custom Take', desc: 'Wild hot takes' }
            ].map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setPredictionType(type.id as any)}
                className={`p-3 border-2 border-black rounded-xl text-left cursor-pointer transition-all duration-150 flex flex-col justify-between h-20 ${
                  predictionType === type.id
                    ? 'bg-black text-yellow-400 scale-[1.02] neo-shadow-sm'
                    : 'bg-stone-50 text-black hover:bg-stone-100'
                }`}
              >
                <span className="font-sans font-black text-xs">{type.label}</span>
                <span className={`text-[10px] block leading-none font-bold ${predictionType === type.id ? 'text-yellow-200' : 'text-zinc-500'}`}>
                  {type.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* STEP 2: RELEVANT FIELDS */}
        <div className="border-t-2 border-dashed border-zinc-300 pt-4 space-y-4">
          <label className="block text-xs font-black text-black uppercase tracking-wider">
            STEP 2: FILL OUT PREDICTION DETAILS
          </label>

          {/* MODE: MATCH PREDICTION */}
          {predictionType === 'match' && (
            <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
              {/* Fixture Selector */}
              <div>
                <label className="block text-[10px] font-black text-zinc-750 uppercase tracking-widest mb-1.5">
                  FIFA WORLD CUP 2026 MATCH
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <select
                    value={matchId}
                    onChange={(e) => setMatchId(e.target.value)}
                    className="w-full bg-stone-50 border-2 border-black rounded-xl px-4 py-3 text-sm text-black font-bold focus:ring-4 focus:ring-yellow-400 focus:outline-hidden transition-all cursor-pointer font-sans appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`, backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25em' }}
                  >
                    {WORLD_CUP_MATCHES.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.group === 'Custom Matchup' ? '⚽ Custom Matchup' : `${m.flagA} ${m.teamA} vs ${m.teamB} ${m.flagB} (${m.group})`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Custom Match Details */}
              {matchId === "custom" && (
                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-yellow-400/10 border-2 border-black animate-[fadeIn_0.2s_ease-out]">
                  <div>
                    <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1.5">TEAM A</label>
                    <input
                      type="text"
                      placeholder="e.g. France"
                      required={predictionType === 'match'}
                      maxLength={20}
                      value={customTeamA}
                      onChange={(e) => setCustomTeamA(e.target.value)}
                      className="w-full bg-stone-50 border-2 border-black rounded-lg px-3 py-2 text-xs text-black font-bold placeholder-stone-400 focus:ring-2 focus:ring-yellow-400 focus:outline-hidden transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1.5">TEAM B</label>
                    <input
                      type="text"
                      placeholder="e.g. Brazil"
                      required={predictionType === 'match'}
                      maxLength={20}
                      value={customTeamB}
                      onChange={(e) => setCustomTeamB(e.target.value)}
                      className="w-full bg-stone-50 border-2 border-black rounded-lg px-3 py-2 text-xs text-black font-bold placeholder-stone-400 focus:ring-2 focus:ring-yellow-400 focus:outline-hidden transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Predict Score Panel */}
              <div>
                <label className="block text-[10px] font-black text-zinc-750 uppercase tracking-widest mb-2">
                  PREDICTED SCORE {activeMatch && matchId !== 'custom' && `(${activeMatch.teamA} vs ${activeMatch.teamB})`}
                </label>
                <div className="flex items-center gap-3 bg-stone-50 border-2 border-black rounded-xl px-4 py-1.5 max-w-[200px]">
                  <input
                    type="number"
                    min="0"
                    max="9"
                    required={predictionType === 'match'}
                    placeholder="0"
                    value={scoreA}
                    onChange={(e) => setScoreA(e.target.value.substring(0, 1))}
                    className="w-full text-center text-xl font-mono font-black bg-transparent text-black focus:outline-hidden"
                  />
                  <span className="text-black font-mono font-black">:</span>
                  <input
                    type="number"
                    min="0"
                    max="9"
                    required={predictionType === 'match'}
                    placeholder="0"
                    value={scoreB}
                    onChange={(e) => setScoreB(e.target.value.substring(0, 1))}
                    className="w-full text-center text-xl font-mono font-black bg-transparent text-black focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Kickoff Scorer */}
              <div>
                <label className="block text-xs font-black text-black uppercase tracking-wider mb-2">
                  FIRST TOTAL GOALSCORER
                </label>
                <input
                  type="text"
                  required={predictionType === 'match'}
                  placeholder="e.g. Vinícius Júnior, Christian Pulisic"
                  maxLength={25}
                  value={firstGoalscorer}
                  onChange={(e) => setFirstGoalscorer(e.target.value)}
                  className="w-full bg-stone-50 border-2 border-black rounded-xl px-4 py-3 text-sm text-black placeholder-zinc-400 font-bold focus:ring-4 focus:ring-yellow-400 focus:outline-hidden transition-all font-mono"
                />
              </div>
            </div>
          )}

          {/* MODE: PLAYER PREDICTION */}
          {predictionType === 'player' && (
            <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
              <div>
                <label className="block text-[10px] font-black text-zinc-750 uppercase tracking-widest mb-1.5">
                  PLAYER NAME
                </label>
                <input
                  type="text"
                  required={predictionType === 'player'}
                  placeholder="e.g. L. Messi, K. Mbappé, Erling Haaland"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full bg-stone-50 border-2 border-black rounded-xl px-4 py-3 text-sm text-black font-mono font-bold focus:ring-4 focus:ring-yellow-400 focus:outline-hidden transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-zinc-750 uppercase tracking-widest mb-1.5">
                    MARKET / STAT TYPE
                  </label>
                  <input
                    type="text"
                    required={predictionType === 'player'}
                    placeholder="e.g. total goals, assists, golden boot winner"
                    value={playerMarket}
                    onChange={(e) => setPlayerMarket(e.target.value)}
                    className="w-full bg-stone-50 border-2 border-black rounded-xl px-4 py-3 text-sm text-black font-bold focus:ring-4 focus:ring-yellow-400 focus:outline-hidden transition-all"
                  />
                  {/* Market Quick Suggests */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {['total goals', 'assists', 'matches scored in', 'yellow cards', 'minutes played'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPlayerMarket(m)}
                        className="text-[9px] font-black uppercase bg-zinc-100 hover:bg-zinc-200 border border-black px-1.5 py-0.5 rounded cursor-pointer"
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-zinc-750 uppercase tracking-widest mb-1.5">
                    VALUE / TARGET
                  </label>
                  <input
                    type="text"
                    required={predictionType === 'player'}
                    placeholder="e.g. 10, 5, 3"
                    value={playerValue}
                    onChange={(e) => setPlayerValue(e.target.value)}
                    className="w-full bg-stone-50 border-2 border-black rounded-xl px-4 py-3 text-sm text-black font-mono font-bold focus:ring-4 focus:ring-yellow-400 focus:outline-hidden transition-all"
                  />
                  {/* Value quick suggests */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {['3', '5', '8', '10', '1+ (Golden Boot)'].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setPlayerValue(val)}
                        className="text-[9px] font-black bg-zinc-100 hover:bg-zinc-200 border border-black px-1.5 py-0.5 rounded cursor-pointer"
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODE: TEAM PREDICTION */}
          {predictionType === 'team' && (
            <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
              <div>
                <label className="block text-[10px] font-black text-zinc-750 uppercase tracking-widest mb-1.5">
                  TEAM NAME
                </label>
                <select
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full bg-stone-50 border-2 border-black rounded-xl px-4 py-3 text-sm text-black font-bold focus:ring-4 focus:ring-yellow-400 focus:outline-hidden transition-all cursor-pointer font-sans appearance-none"
                  style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`, backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25em' }}
                >
                  {['Brazil', 'Argentina', 'USA', 'Mexico', 'France', 'England', 'Germany', 'Spain', 'Portugal', 'Japan', 'Morocco', 'Italy', 'Canada'].map((team) => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-zinc-750 uppercase tracking-widest mb-1.5">
                  TOURNAMENT TARGET / ACHIEVEMENT
                </label>
                <input
                  type="text"
                  required={predictionType === 'team'}
                  placeholder="e.g. wins the tournament, reaches semifinals, scores 8+ goals in group stage"
                  value={teamMarket}
                  onChange={(e) => setTeamMarket(e.target.value)}
                  className="w-full bg-stone-50 border-2 border-black rounded-xl px-4 py-3 text-sm text-black font-bold focus:ring-4 focus:ring-yellow-400 focus:outline-hidden transition-all"
                />
                {/* Team targets quick suggests */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {['wins the tournament', 'reaches semifinals', 'scores 8+ goals in group stage', 'wins Group Stage unbeaten', 'gets knocked out in RO16'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTeamMarket(t)}
                      className="text-[9px] font-black uppercase bg-zinc-100 hover:bg-zinc-200 border border-black px-1.5 py-0.5 rounded cursor-pointer"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MODE: CUSTOM TAKE — with Trash Talk Arsenal */}
          {predictionType === 'custom' && (
            <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
              {/* Trash Talk Arsenal Roulette */}
              <div className="rounded-2xl border-2 border-black bg-stone-950 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400">🔥 TRASH TALK ARSENAL — TAP TO LOAD</span>
                  <button
                    type="button"
                    onClick={shuffleRoulette}
                    className="flex items-center gap-1 text-[10px] font-black uppercase text-zinc-400 hover:text-yellow-400 border border-zinc-700 hover:border-yellow-400 px-2 py-1 rounded-lg cursor-pointer transition-all"
                  >
                    <Shuffle size={11} /> Shuffle
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-1.5 max-h-64 overflow-y-auto pr-1">
                  {roulettePool.map((brag, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applyBrag(brag, idx)}
                      className={`w-full text-left text-[11px] font-bold px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                        pulsedIndex === idx
                          ? 'bg-yellow-400 border-black text-black scale-[1.02] font-black'
                          : customTakeText === brag
                            ? 'bg-zinc-800 border-yellow-500 text-yellow-300'
                            : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-500 hover:text-white'
                      }`}
                    >
                      {brag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom text area */}
              <div>
                <label className="block text-[10px] font-black text-zinc-750 uppercase tracking-widest mb-1.5">
                  YOUR BRAG TEXT <span className="text-zinc-400 font-normal normal-case">(tap above or write your own)</span>
                </label>
                <textarea
                  required={predictionType === 'custom'}
                  placeholder="e.g. Messi gets a hat-trick and Argentina wins 3-0. I've been saying this for months."
                  value={customTakeText}
                  onChange={(e) => setCustomTakeText(e.target.value)}
                  maxLength={120}
                  rows={3}
                  className="w-full bg-stone-50 border-2 border-black rounded-xl px-4 py-3 text-xs text-black font-bold placeholder-zinc-400 focus:ring-4 focus:ring-yellow-400 focus:outline-hidden transition-all"
                />
                <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono mt-1">
                  <span>Keep it punchy for maximum shareable impact.</span>
                  <span>{customTakeText.length}/120</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Confidence level selector */}
        <div>
          <label className="block text-xs font-black text-black uppercase tracking-wider mb-2 flex justify-between">
            <span>HOW CONFIDENT ARE YOU?</span>
            <span className="text-emerald-700 font-mono text-xs font-black">{confidence}% CONFIDENT</span>
          </label>
          <div className="grid grid-cols-6 gap-1.5">
            {[50, 60, 70, 80, 90, 99].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setConfidence(val)}
                className={`py-2 px-1 border-2 border-black rounded-lg text-xs font-black font-mono transition-all duration-150 cursor-pointer ${
                  confidence === val
                    ? 'bg-black text-yellow-400 scale-105'
                    : 'bg-stone-50 text-black hover:bg-stone-100'
                }`}
              >
                {val}%
              </button>
            ))}
          </div>
          <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1.5 font-mono">
            {confidence === 99 ? '💀 WARNING: Extreme overconfidence detected. Highly shareable if wrong.' : 'Lock in your certainty level.'}
          </p>
        </div>

        {/* First Goalscorer */}
        <div>
          <label className="block text-xs font-black text-black uppercase tracking-wider mb-2">
            FIRST TOTAL GOALSCORER
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Vinícius Júnior, Christian Pulisic"
            maxLength={25}
            value={firstGoalscorer}
            onChange={(e) => setFirstGoalscorer(e.target.value)}
            className="w-full bg-stone-50 border-2 border-black rounded-xl px-4 py-3 text-sm text-black placeholder-zinc-400 font-bold focus:ring-4 focus:ring-yellow-400 focus:outline-hidden transition-all font-mono"
          />
        </div>

        {/* Dynamic Bold Predictions List */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-xs font-black text-black uppercase tracking-wider">
              BOLD OUTCOMES / PARLAYS <span className="text-zinc-500 font-normal">({boldPredictions.length}/3)</span>
            </label>
            <span className="text-[10px] text-zinc-650 font-sans italic font-bold uppercase">Boosts virality 🚀</span>
          </div>

          <div className="space-y-2 mb-3">
            {boldPredictions.map((pred, i) => (
              <div key={i} className="flex items-center justify-between bg-stone-100 border-2 border-black rounded-xl py-2 px-3 text-xs font-mono font-bold text-black shadow-sm">
                <span className="truncate pr-4">• {pred}</span>
                <button
                  type="button"
                  onClick={() => removeBoldPrediction(i)}
                  className="text-stone-500 hover:text-red-600 p-1 rounded-md cursor-pointer transition-colors"
                  title="Remove prediction row"
                >
                  <Trash size={13} />
                </button>
              </div>
            ))}
          </div>

          {boldPredictions.length < 3 ? (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Penalty scored, Red card issued"
                maxLength={45}
                value={boldText}
                onChange={(e) => setBoldText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addBoldPrediction();
                  }
                }}
                className="flex-1 bg-stone-50 border-2 border-black rounded-xl px-3 py-2.5 text-xs text-black placeholder-stone-400 font-bold focus:ring-2 focus:ring-yellow-400 focus:outline-hidden transition-all"
              />
              <button
                type="button"
                onClick={addBoldPrediction}
                className="bg-black hover:bg-stone-900 text-yellow-400 p-3 rounded-xl border-2 border-black cursor-pointer shadow-sm transition-all flex items-center justify-center font-black"
                title="Add to receipt"
              >
                <Plus size={16} className="stroke-[3]" />
              </button>
            </div>
          ) : (
            <p className="text-[10px] text-zinc-500 font-sans font-bold uppercase text-center">
              Maximum items reached. Remove a line to add a new bold prediction.
            </p>
          )}

          {/* Quick Brag chips — available for all prediction types */}
          {boldPredictions.length < 3 && (
            <div className="mt-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1.5">🎯 Quick add brags</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'First goal inside 20 min',
                  'Red card issued',
                  'Penalty scored',
                  'Clean sheet',
                  'Hat-trick',
                  'VAR reversal',
                  'Injury before HT',
                  'Extra time',
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      if (boldPredictions.length < 3 && !boldPredictions.includes(chip)) {
                        setBoldPredictions([...boldPredictions, chip]);
                      }
                    }}
                    className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                      boldPredictions.includes(chip)
                        ? 'bg-black text-yellow-400 border-black'
                        : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-700 hover:border-black'
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Golden Toggle — shown only when user is not already golden */}
        {!isGolden && (
          <label
            htmlFor="golden-toggle"
            className="flex items-center justify-between gap-3 p-4 rounded-2xl border-2 border-black bg-gradient-to-r from-yellow-50 to-amber-50 cursor-pointer hover:bg-yellow-100/60 transition-all group mt-2"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 border-black transition-colors ${
                wantsGolden ? 'bg-yellow-400 text-black' : 'bg-white text-zinc-400'
              }`}>
                <Sparkles size={18} className={wantsGolden ? 'animate-pulse' : ''} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-black leading-none">Unlock Brag Mode — Gold Card</p>
                <p className="text-[10px] text-zinc-500 font-bold mt-0.5">+$1.99 · Why send paper to the group chat when you can send a 24k gold card?</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase text-amber-700 bg-yellow-200 border border-yellow-400 px-1.5 py-0.5 rounded-full tracking-wider">POPULAR</span>
              <div
                className={`relative w-11 h-6 rounded-full border-2 border-black transition-colors ${
                  wantsGolden ? 'bg-yellow-400' : 'bg-zinc-200'
                }`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-black transition-all ${
                  wantsGolden ? 'left-[22px]' : 'left-0.5'
                }`} />
              </div>
            </div>
            <input
              id="golden-toggle"
              type="checkbox"
              className="sr-only"
              checked={wantsGolden}
              onChange={(e) => setWantsGolden(e.target.checked)}
            />
          </label>
        )}

        {/* === LANGUAGE SELECTOR — Regional WhatsApp Virality Toggle === */}
        <div className="border-2 border-black rounded-2xl p-4 bg-stone-950 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400">🌍 SHARE LANGUAGE — WHATSAPP MULTIPLIER</span>
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Pick your group chat</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {LANG_OPTIONS.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setShareLanguage(lang.code)}
                className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border-2 transition-all cursor-pointer ${
                  shareLanguage === lang.code
                    ? 'bg-yellow-400 border-black text-black scale-[1.02]'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500'
                }`}
              >
                <span className="text-xl leading-none">{lang.flag}</span>
                <span className="text-[10px] font-black uppercase tracking-wider leading-none">{lang.label}</span>
                <span className={`text-[8px] font-bold uppercase leading-none ${shareLanguage === lang.code ? 'text-black/60' : 'text-zinc-600'}`}>{lang.hint}</span>
              </button>
            ))}
          </div>
          {shareLanguage !== 'en' && (
            <p className="text-[9px] text-yellow-400 font-black uppercase tracking-wider text-center animate-[fadeIn_0.2s_ease-out]">
              ✅ Share text will be generated in {LANG_OPTIONS.find(l => l.code === shareLanguage)?.label} — max WhatsApp impact
            </p>
          )}
        </div>

        {/* === UPSELL COMPARISON — Free vs Gold, right before the mint button === */}
        {!isGolden && !wantsGolden && (
          <div className="border-2 border-zinc-200 rounded-2xl overflow-hidden">
            <div className="bg-zinc-50 px-4 py-2 border-b border-zinc-200">
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 text-center">WHAT HITS DIFFERENT IN THE GROUP CHAT</p>
            </div>
            <div className="grid grid-cols-2 divide-x divide-zinc-200">
              {/* Free receipt preview */}
              <div className="p-4 space-y-2">
                <p className="text-[9px] font-black uppercase tracking-wider text-zinc-500 text-center mb-2">FREE</p>
                <div className="bg-stone-100 border border-stone-300 rounded-lg p-3 space-y-1.5">
                  <div className="h-2 bg-zinc-300 rounded w-3/4" />
                  <div className="h-1.5 bg-zinc-200 rounded w-full" />
                  <div className="h-1.5 bg-zinc-200 rounded w-5/6" />
                  <div className="h-1.5 bg-zinc-200 rounded w-2/3" />
                  <div className="border-t border-dashed border-zinc-300 mt-2 pt-2 flex gap-1">
                    <div className="h-1.5 bg-zinc-300 rounded flex-1" />
                    <div className="h-1.5 bg-zinc-200 rounded w-1/3" />
                  </div>
                </div>
                <p className="text-[8px] text-zinc-400 text-center font-bold uppercase">Paper receipt. Boring.</p>
              </div>
              {/* Gold card preview */}
              <div className="p-4 space-y-2 bg-amber-50">
                <p className="text-[9px] font-black uppercase tracking-wider text-amber-700 text-center mb-2">✨ GOLD $1.99</p>
                <div className="relative bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 border-2 border-black rounded-lg p-3 space-y-1.5 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-[shimmer_2s_ease-in-out_infinite]" />
                  <div className="h-2 bg-black/30 rounded w-3/4" />
                  <div className="h-1.5 bg-black/20 rounded w-full" />
                  <div className="h-1.5 bg-black/20 rounded w-5/6" />
                  <div className="h-1.5 bg-black/20 rounded w-2/3" />
                  <div className="border-t border-black/20 mt-2 pt-2 flex gap-1">
                    <div className="h-1.5 bg-black/25 rounded flex-1" />
                    <div className="h-3 w-3 bg-black/40 rounded-full" />
                  </div>
                </div>
                <p className="text-[8px] text-amber-700 text-center font-black uppercase">24k gold. Group chat domination.</p>
              </div>
            </div>
          </div>
        )}

        {/* Generate Receipt CTA */}
        <button
          type="submit"
          className={`w-full cursor-pointer py-4 px-6 text-sm font-sans font-black uppercase rounded-2xl border-4 border-black neo-shadow transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 mt-2 ${
            wantsGolden && !isGolden
              ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black hover:brightness-110'
              : 'text-black bg-yellow-400 hover:bg-yellow-300'
          }`}
        >
          {wantsGolden && !isGolden ? (
            <>
              <Sparkles size={16} className="animate-pulse" />
              <span>🔓 UNLOCK BRAG MODE — $1.99</span>
              <ChevronRight size={18} className="stroke-[3]" />
            </>
          ) : (
            <>
              <span>🔒 LOCK IN MY BRAG</span>
              <ChevronRight size={18} className="stroke-[3]" />
            </>
          )}
        </button>
        {wantsGolden && !isGolden && (
          <p className="text-center text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
            Secure payment • Only $1.99 during World Cup 2026
          </p>
        )}
      </form>
    </div>
  );
}
