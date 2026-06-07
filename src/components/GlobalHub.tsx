import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Search, Filter, ShieldCheck, Flame, Users, LineChart, 
  Settings, CheckCircle2, AlertCircle, RefreshCw, Star, Coins, Zap
} from 'lucide-react';
import { Prediction, MatchPreset } from '../types';
import { WORLD_CUP_MATCHES, getMatchLabel, calculateViralIndicators } from '../data';
import { 
  fetchPredictions, fetchAnalytics, fetchOutcomes, 
  resolveMatchOutcome, resetSimulationDB, GlobalAnalytics, MatchOutcome 
} from '../api';

interface GlobalHubProps {
  onSelectPrediction: (pred: Prediction) => void;
  currentPredictionId?: string;
}

export default function GlobalHub({ onSelectPrediction, currentPredictionId }: GlobalHubProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'honor' | 'shame' | 'analytics' | 'referee'>('pending');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [analytics, setAnalytics] = useState<GlobalAnalytics | null>(null);
  const [outcomes, setOutcomes] = useState<MatchOutcome[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Referee input state
  const [refMatchId, setRefMatchId] = useState('g_a1');
  const [refScoreA, setRefScoreA] = useState('2');
  const [refScoreB, setRefScoreB] = useState('1');
  const [refGoalscorer, setRefGoalscorer] = useState('Santiago Gimenez');

  // Load all central global hub states
  const loadHubData = async () => {
    setLoading(true);
    try {
      const preds = await fetchPredictions(searchQuery);
      setPredictions(preds);
      const analyticData = await fetchAnalytics();
      setAnalytics(analyticData);
      const outcomesData = await fetchOutcomes();
      setOutcomes(outcomesData);
    } catch (err: any) {
      console.error("Failed to load hub data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHubData();
  }, [searchQuery]);

  // Periodic automatic polling to feel "real-time" (every 6 seconds)
  useEffect(() => {
    const handler = setInterval(() => {
      Promise.all([
        fetchPredictions(searchQuery).then(setPredictions),
        fetchAnalytics().then(setAnalytics),
        fetchOutcomes().then(setOutcomes)
      ]).catch(err => console.debug("Silent poll error", err));
    }, 6000);
    return () => clearInterval(handler);
  }, [searchQuery]);

  // Format Status Styling
  const getStatusBadge = (status?: string) => {
    if (status === 'correct') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-400 text-black text-[10px] font-black rounded-lg border-2 border-black tracking-wider uppercase">
          <CheckCircle2 size={11} /> WINE 🍷
        </span>
      );
    } else if (status === 'incorrect') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-400 text-white text-[10px] font-black rounded-lg border-2 border-black tracking-wider uppercase">
          <AlertCircle size={11} /> MILK 🥛
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-100 text-black text-[10px] font-black rounded-lg border-2 border-black tracking-wider uppercase">
          <RefreshCw size={11} className="animate-spin text-zinc-600" /> PENDING
        </span>
      );
    }
  };

  // Trigger Match Resolution (Kickoff!)
  const handleResolveMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await resolveMatchOutcome(refMatchId, refScoreA, refScoreB, refGoalscorer);
      setStatusMessage({ text: "Kickoff resolved! Match settled. Public Shame Wall and Honor Roll updated instantly.", type: 'success' });
      loadHubData();
      setTimeout(() => setStatusMessage(null), 6000);
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Failed to submit outcome.", type: 'error' });
    }
  };

  // Factory reset back to seed data
  const handleResetDevDB = async () => {
    if (confirm("Reset predictions back to initial seeds?")) {
      try {
        await resetSimulationDB();
        setStatusMessage({ text: "Immutability base resynchronized successfully!", type: 'success' });
        loadHubData();
        setTimeout(() => setStatusMessage(null), 4000);
      } catch (err: any) {
        setStatusMessage({ text: "Failed to reset.", type: 'error' });
      }
    }
  };

  const calculatePercentages = (presetId: string) => {
    if (!analytics || !analytics.trends) return { aPct: 33, drawPct: 33, bPct: 34, total: 3 };
    const trend = analytics.trends.find(t => t.matchId === presetId);
    if (!trend || trend.totalVotes === 0) return { aPct: 33, drawPct: 33, bPct: 34, total: 3 };
    
    return {
      aPct: Math.round((trend.teamAVotes / trend.totalVotes) * 100),
      drawPct: Math.round((trend.drawVotes / trend.totalVotes) * 100),
      bPct: Math.round((trend.teamBVotes / trend.totalVotes) * 100),
      total: trend.totalVotes
    };
  };

  // 1. FILTER & CATEGORIZATION OF CENTRAL DATA STREAM
  const activePredictions = predictions.filter(p => !p.burned);

  const pendingPredictions = activePredictions.filter(p => !p.status || p.status === 'pending');
  
  const correctPredictions = activePredictions.filter(p => p.status === 'correct');
  
  // Confidently Wrong ones sorted at top of the Milk wall!
  const incorrectPredictions = activePredictions
    .filter(p => p.status === 'incorrect')
    .sort((a, b) => (b.confidence || 80) - (a.confidence || 80));

  return (
    <div id="global-prophet-hub" className="bg-white border-4 border-black p-4 sm:p-8 rounded-3xl text-black neo-shadow-lg w-full mt-10 space-y-6">
      
      {/* Tab Navigation header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between border-b-4 border-black pb-5 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-yellow-400 border border-black font-black text-[10px] rounded-sm uppercase tracking-wider">THE GLOBAL TRASH TALK LEDGER</span>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight font-sans mt-1">
            THE HALL OF PROPHECY
          </h2>
        </div>
        
        {/* Navigation toggles compliant with unneeded features removal (highly specific) */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-2 font-black text-xs uppercase tracking-wider border-2 border-black rounded-xl cursor-pointer transition-all ${
              activeTab === 'pending' 
                ? 'bg-black text-yellow-400 neo-shadow-sm' 
                : 'bg-stone-50 hover:bg-stone-100 text-black'
            }`}
          >
            🔥 Locked Takes ({pendingPredictions.length})
          </button>

          <button
            onClick={() => setActiveTab('honor')}
            className={`px-3 py-2 font-black text-xs uppercase tracking-wider border-2 border-black rounded-xl cursor-pointer transition-all ${
              activeTab === 'honor' 
                ? 'bg-black text-yellow-400 neo-shadow-sm' 
                : 'bg-stone-50 hover:bg-stone-100 text-black'
            }`}
          >
            🍷 Hall of Prophecy ({correctPredictions.length})
          </button>
          
          <button
            onClick={() => setActiveTab('shame')}
            className={`px-3 py-2 font-black text-xs uppercase tracking-wider border-2 border-black rounded-xl cursor-pointer transition-all ${
              activeTab === 'shame' 
                ? 'bg-black text-red-500 neo-shadow-sm' 
                : 'bg-stone-50 hover:bg-stone-100 text-black'
            }`}
          >
            🥛 shame wall ({incorrectPredictions.length})
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-2 font-black text-xs uppercase tracking-wider border-2 border-black rounded-xl cursor-pointer transition-all ${
              activeTab === 'analytics' 
                ? 'bg-black text-blue-500 neo-shadow-sm' 
                : 'bg-stone-50 hover:bg-stone-100 text-black'
            }`}
          >
            📊 sentiment
          </button>
          
          <button
            onClick={() => setActiveTab('referee')}
            className={`px-3 py-2 font-black text-xs uppercase tracking-wider border-2 border-black rounded-xl cursor-pointer transition-all ${
              activeTab === 'referee' 
                ? 'bg-red-500 text-white border-2 border-black neo-shadow-sm' 
                : 'bg-stone-50 hover:bg-stone-100 text-black'
            }`}
          >
            🎛️ kickoff Sim
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className={`p-3.5 border-2 border-black rounded-xl flex items-center gap-2.5 text-xs font-bold leading-tight ${
          statusMessage.type === 'success' ? 'bg-emerald-50 border-emerald-500 text-emerald-900' : 'bg-red-50 text-red-900 border-red-500'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle2 className="shrink-0 text-emerald-700" size={16} /> : <AlertCircle className="shrink-0" size={16} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main Contents based on Tab State */}
      <div className="min-h-[400px]">
        
        {/* VIEW 1: PRE-MATCH LOCKED PREDICTIONS */}
        {activeTab === 'pending' && (
          <div className="space-y-6">
            <div className="bg-stone-50 border-2 border-black p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-sm uppercase">Active Bounties — Locked Before Kickoff</h3>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wide">Put your money where your mouth is. Every take here was locked before the whistle blew. Can't edit it. Can't delete it. It's out there.</p>
              </div>
              <div className="flex gap-4">
                <div className="text-center">
                  <span className="text-[10px] text-zinc-400 font-black tracking-widest block uppercase">LOCKED SECURE</span>
                  <span className="text-lg font-black font-mono">{pendingPredictions.length} MINTED</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 text-zinc-400 stroke-[3]" size={15} />
              <input
                type="text"
                placeholder="Search names, player takes, scores..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-50 border-2 border-black rounded-xl py-3 pl-10 pr-4 text-xs text-black font-bold focus:ring-4 focus:ring-yellow-400 focus:outline-hidden transition-all font-mono uppercase"
              />
            </div>

            {pendingPredictions.length === 0 ? (
              <div className="text-center py-16 bg-stone-50/50 border-2 border-dashed border-zinc-200 rounded-2xl">
                <p className="text-xs text-zinc-500 font-black uppercase tracking-wider">No locked takes yet. Be the first to start some beef. Your mates are watching.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingPredictions.map((pred) => {
                  const indicators = calculateViralIndicators(parseInt(pred.predictedScoreA) || 0, parseInt(pred.predictedScoreB) || 0);
                  const confidence = pred.confidence || 80;
                  return (
                    <div key={pred.id} className="border-4 border-black p-5 rounded-2xl bg-[#fbfaf5] neo-shadow-sm flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-black text-xs uppercase tracking-tight text-black block">{pred.name}</span>
                            <span className="text-[9px] text-zinc-500 font-bold uppercase font-mono tracking-widest block">{pred.barcodeValue} • pre-match</span>
                          </div>
                          <span className="px-2 py-0.5 bg-yellow-400 text-black border border-black rounded text-[9px] font-black uppercase">
                            {confidence}% SURE
                          </span>
                        </div>

                        <div className="bg-white border-2 border-black rounded-xl p-3 mt-3 space-y-1">
                          <span className="text-[10px] bg-stone-100 border border-black px-1.5 py-0.2 rounded font-black text-black">
                            {getMatchLabel(pred).split(' ')[0]}
                          </span>
                          <span className="font-black text-xs block text-stone-900 mt-1">{getMatchLabel(pred).replace(/^[^\s]+\s*/, '')}</span>
                          <div className="flex justify-between items-center mt-2 pt-2 border-t border-dashed border-stone-200">
                            <span className="text-xs font-black text-stone-600 font-mono">SCORES:</span>
                            <span className="font-black font-sans text-sm tracking-widest text-[#1e1c16]">{pred.predictedScoreA} - {pred.predictedScoreB}</span>
                          </div>
                        </div>

                        <div className="mt-3 flex gap-1 flex-wrap">
                          <span className="bg-stone-100 border border-black text-stone-800 text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full font-mono">
                            Take: {pred.hotTakeLabel || indicators.hotTakeLabel}
                          </span>
                          <span className="bg-orange-50 border border-orange-200 text-orange-850 text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full font-mono">
                            🔥 Rage: {pred.ragePotential || indicators.ragePotential}%
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-stone-200">
                        <span className="text-[8.5px] text-zinc-400 font-black tracking-widest font-mono">LOCKED BEFORE KICKOFF — NO EDITS</span>
                        <button
                          onClick={() => {
                            onSelectPrediction(pred);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="px-3.5 py-1 bg-black hover:bg-zinc-800 text-white font-black text-[9px] uppercase rounded-lg border border-black transition-all font-mono"
                        >
                          🔍 VIEW
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: HALL OF PROPHECY (WINE — CASHED BRAGS) */}
        {activeTab === 'honor' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-yellow-400 to-amber-400 border-4 border-black text-black p-4 rounded-xl flex items-center gap-3">
              <Trophy size={28} className="text-black fill-black shrink-0" />
              <div>
                <h3 className="font-extrabold text-sm uppercase flex items-center gap-2">
                  👑 Hall of Prophecy — Cashed Brags
                </h3>
                <p className="text-xs font-bold uppercase tracking-wide opacity-80">Every brag in this section was locked before kickoff and aged like fine wine. These people called it. Permanently pinned.</p>
              </div>
            </div>

            {correctPredictions.length === 0 ? (
              <div className="text-center py-16 bg-stone-50/50 border-2 border-dashed border-zinc-200 rounded-2xl">
                <p className="text-xs text-zinc-500 font-black uppercase tracking-wider">No cashed brags yet. Simulate a match result in Kickoff Sim — and watch the champions emerge.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {correctPredictions.map((pred) => {
                  const confidence = pred.confidence || 80;
                  return (
                    <div key={pred.id} className="border-4 border-yellow-400 p-5 rounded-2xl bg-gradient-to-br from-yellow-50 to-amber-50 neo-shadow flex flex-col justify-between space-y-4 relative overflow-hidden">
                      {/* Crown pin badge */}
                      <div className="absolute top-3 right-3 bg-yellow-400 border-2 border-black text-black px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                        👑 CASHED
                      </div>

                      <div>
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-black text-xs uppercase tracking-tight text-black block">{pred.name}</span>
                            <span className="text-[9px] text-amber-700 font-bold uppercase font-mono tracking-widest block">🍷 AGED LIKE WINE — VERIFIED</span>
                          </div>
                          <span className="px-2 py-0.5 bg-black text-yellow-400 border border-black rounded text-[9px] font-black uppercase">
                            {confidence}% CALLED IT
                          </span>
                        </div>

                        <div className="bg-white border-2 border-yellow-400 rounded-xl p-3 mt-3">
                          <span className="text-xs font-black block text-stone-900 leading-normal">{getMatchLabel(pred).replace(/^[^\s]+\s*/, '')}</span>
                          <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-dashed border-stone-200">
                            <span className="text-xs font-mono font-bold text-zinc-500">CALLED SCORE:</span>
                            <span className="font-extrabold text-yellow-600 text-sm tracking-widest">{pred.predictedScoreA} - {pred.predictedScoreB}</span>
                          </div>
                          <div className="flex justify-between items-center mt-1 text-[10px] text-zinc-600 font-mono">
                            <span>Scorer: <strong className="text-black">{pred.firstGoalscorer}</strong></span>
                            <span className="text-yellow-700 font-black">👑 NAILED IT</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-yellow-300">
                        <span className="text-[8.5px] text-amber-700 font-black tracking-widest font-mono">🔒 PINNED TO HALL OF PROPHECY</span>
                        <button
                          onClick={() => {
                            onSelectPrediction(pred);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="px-3.5 py-1 bg-black hover:bg-zinc-900 text-yellow-400 font-black text-[9px] uppercase rounded-lg border border-black transition-all font-mono"
                        >
                          👑 VIEW BRAG
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: PUBLIC SHAME WALL (MILK) */}
        {activeTab === 'shame' && (
          <div className="space-y-6">
            <div className="bg-red-50 border-2 border-red-500 text-red-950 p-4 rounded-xl">
              <h3 className="font-extrabold text-sm uppercase">🥛 Wall of Shame — Confidently, Embarrassingly Wrong</h3>
              <p className="text-xs font-medium uppercase tracking-wide opacity-90">These people went on record. They were very, very confident. The final whistle did not agree. Sorted by how badly they missed.</p>
            </div>

            {incorrectPredictions.length === 0 ? (
              <div className="text-center py-16 bg-stone-50/50 border-2 border-dashed border-zinc-200 rounded-2xl">
                <p className="text-xs text-zinc-500 font-black uppercase tracking-wider">Clean slate! Nobody has taken an L yet. Simulate some match results to watch the carnage unfold.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {incorrectPredictions.map((pred) => {
                  const confidence = pred.confidence || 80;
                  return (
                    <div key={pred.id} className="border-4 border-red-600 p-5 rounded-2xl bg-red-50/10 neo-shadow-sm flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-black text-xs uppercase tracking-tight text-red-950 block">{pred.name}</span>
                            <span className="text-[9px] text-red-600 font-black uppercase font-mono tracking-widest block">AGED LIKE MILK 🥛</span>
                          </div>
                          <span className="px-2 py-0.5 bg-red-500 text-white border border-black rounded text-[9px] font-black uppercase animate-pulse">
                            🚨 {confidence}% CONFIDENT!!
                          </span>
                        </div>

                        <div className="bg-white border-2 border-red-650 rounded-xl p-3 mt-3">
                          <span className="text-xs font-black block text-stone-900 leading-normal">{getMatchLabel(pred).replace(/^[^\s]+\s*/, '')}</span>
                          <div className="flex justify-between items-center mt-2 pt-2 border-t border-dashed border-stone-200">
                            <span className="text-xs font-mono font-bold text-stone-500">PREDICTION Score:</span>
                            <span className="font-black text-red-500 text-sm tracking-widest">{pred.predictedScoreA} - {pred.predictedScoreB}</span>
                          </div>
                          <div className="flex justify-between items-center mt-1 pt-1 border-t border-stone-100 text-[10px] text-zinc-650 font-mono">
                            <span>Reality: <strong className="text-black">{pred.outcomeScoreA} - {pred.outcomeScoreB}</strong></span>
                            <span className="text-red-700 font-black uppercase">⚠️ MASSIVE CHOKE</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-red-200">
                        <span className="text-[8.5px] text-red-600 font-black tracking-widest font-mono">PUBLIC INDICTMENT VALID</span>
                        <button
                          onClick={() => {
                            onSelectPrediction(pred);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="px-3.5 py-1 bg-black text-white hover:text-yellow-400 font-black text-[9px] uppercase rounded-lg border border-black transition-all font-mono"
                        >
                          🔍 SHAME THEM
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VIEW 4: CROWD TRENDS FORECAST */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-zinc-50 border-2 border-black p-5 rounded-xl">
              <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2 mb-2 text-stone-900">
                <LineChart className="text-black" size={20} />
                LIVE CROWD SENTIMENT FORECASTS
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed font-bold uppercase tracking-wide">
                We aggregate thousands of locked receipts to compile real-time crowd consensus. Find where public opinion resides!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {WORLD_CUP_MATCHES.filter(m => m.id !== 'custom').slice(0, 10).map((match) => {
                const { aPct, drawPct, bPct, total } = calculatePercentages(match.id);
                return (
                  <div key={match.id} className="bg-white border-4 border-black p-4 rounded-2xl neo-shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] bg-stone-100 border border-black px-1.5 py-0.5 rounded-sm font-black text-black uppercase tracking-wider font-mono">
                          {match.group}
                        </span>
                        <h4 className="font-sans font-black text-sm text-black mt-1 uppercase flex items-center gap-1.5">
                          {match.flagA} {match.teamA} <span className="text-zinc-400 font-mono italic text-xs font-normal">vs</span> {match.teamB} {match.flagB}
                        </h4>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black font-mono text-stone-900 block">{total} LOCKS</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="h-5 w-full bg-stone-100 rounded-lg border-2 border-black overflow-hidden flex font-mono text-[9px] font-black text-black">
                        {total === 0 ? (
                          <div className="w-full flex items-center justify-center text-zinc-500 font-sans tracking-wide uppercase">
                            NO FORECAST LOCKS REGISTERED
                          </div>
                        ) : (
                          <>
                            {aPct > 0 && (
                              <div 
                                style={{ width: `${aPct}%` }}
                                className="bg-emerald-450 border-r border-black flex items-center justify-center truncate px-1 transition-all"
                              >
                                {match.teamA.slice(0, 3).toUpperCase()} {aPct}%
                              </div>
                            )}
                            {drawPct > 0 && (
                              <div 
                                style={{ width: `${drawPct}%` }}
                                className="bg-yellow-400 border-r border-black flex items-center justify-center truncate px-1 transition-all"
                              >
                                DRAW {drawPct}%
                              </div>
                            )}
                            {bPct > 0 && (
                              <div 
                                style={{ width: `${bPct}%` }}
                                className="bg-rose-455 flex items-center justify-center truncate px-1 transition-all"
                              >
                                {bPct}% {match.teamB.slice(0, 3).toUpperCase()}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 5: REFEREE OUTCOME CONTROL PANEL */}
        {activeTab === 'referee' && (
          <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-zinc-950 border-4 border-black p-5 rounded-3xl text-emerald-400 neo-shadow">
              <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2 mb-2 text-white">
                <Settings className="animate-spin text-rose-400 stroke-[2.5]" size={20} />
                REGISTRY OFFICIAL RESOLUTIONS
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed font-semibold uppercase tracking-wide">
                Because matches have not yet kicked off, standard users can play the role of the FIFA Official Referee here. Submit final score lines and first goalscorers to trigger immediate outcome checks on the server.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Referee submit layout */}
              <div className="bg-[#fbfaf5] border-4 border-black p-5 rounded-2xl text-black space-y-4">
                <div className="flex items-center gap-1.5 border-b-2 border-black pb-2">
                  <Zap size={18} className="text-yellow-500 fill-yellow-400" />
                  <h4 className="font-sans font-black text-xs uppercase tracking-wider">SET FINAL REFEREE SCORES</h4>
                </div>

                <form onSubmit={handleResolveMatch} className="space-y-4 text-black">
                  <div>
                    <label className="block text-[10px] font-black text-stone-700 uppercase tracking-wider mb-1 font-mono">1. Select Target Matchup</label>
                    <select
                      value={refMatchId}
                      onChange={(e) => setRefMatchId(e.target.value)}
                      className="w-full bg-white border-2 border-black rounded-xl py-2 px-3 text-xs text-black font-bold focus:ring-4 focus:ring-yellow-400 focus:outline-hidden transition-all uppercase font-sans cursor-pointer"
                    >
                      {WORLD_CUP_MATCHES.map((r) => (
                        <option key={r.id} value={r.id}>{r.flagA} {r.teamA} vs {r.teamB} {r.flagB} ({r.group})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-stone-700 uppercase tracking-wider mb-1 font-mono">Team 1 Score</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={refScoreA}
                        onChange={(e) => setRefScoreA(e.target.value)}
                        className="w-full bg-white border-2 border-black rounded-xl py-2 px-3 text-xs text-black font-bold focus:outline-hidden text-center font-mono"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-black text-stone-700 uppercase tracking-wider mb-1 font-mono">Team 2 Score</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={refScoreB}
                        onChange={(e) => setRefScoreB(e.target.value)}
                        className="w-full bg-white border-2 border-black rounded-xl py-2 px-3 text-xs text-black font-bold focus:outline-hidden text-center font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-stone-700 uppercase tracking-wider mb-1 font-mono">First Goalscorer name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Santiago Gimenez"
                      value={refGoalscorer}
                      onChange={(e) => setRefGoalscorer(e.target.value)}
                      className="w-full bg-white border-2 border-black rounded-xl py-2 px-3 text-xs text-black font-bold focus:outline-hidden uppercase font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-red-500 hover:bg-red-400 text-white font-black text-xs py-3 px-4 rounded-xl border-2 border-black cursor-pointer tracking-widest uppercase transition-all flex items-center justify-center gap-2 font-sans"
                  >
                    🚩 SECURE AND SETTLE CODES
                  </button>
                </form>
              </div>

              {/* Solved List */}
              <div className="bg-[#fbfaf5] border-4 border-black p-5 rounded-2xl text-black space-y-4">
                <div className="flex items-center justify-between border-b-2 border-black pb-2 text-black">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck size={18} className="text-emerald-600" />
                    <h4 className="font-sans font-black text-xs uppercase tracking-wider">RESOLVED RESULTS HISTORY</h4>
                  </div>
                  <button
                    onClick={handleResetDevDB}
                    className="bg-black hover:bg-zinc-800 text-yellow-500 font-bold text-[9px] px-2 py-1 rounded border border-black uppercase tracking-wider cursor-pointer"
                  >
                    Reset DB State
                  </button>
                </div>

                {outcomes.length === 0 ? (
                  <p className="text-xs text-stone-500 font-bold text-center py-12 uppercase tracking-wider">No outcomes settled yet. Save referee forms to settle globally!</p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {outcomes.map((o) => {
                      const prematch = WORLD_CUP_MATCHES.find(m => m.id === o.matchId);
                      return (
                        <div key={o.matchId} className="bg-white border-2 border-black p-3 rounded-xl flex items-center justify-between">
                          <div>
                            <span className="text-[8px] bg-stone-100 border border-black px-1 rounded-sm uppercase tracking-wider font-mono font-black">
                              {prematch?.group || "Cup Match"}
                            </span>
                            <span className="text-xs font-black block text-black mt-0.5 uppercase">
                              {prematch ? `${prematch.teamA} vs ${prematch.teamB}` : "World Cup Match"}
                            </span>
                            <span className="text-[9px] text-stone-500 font-bold block uppercase tracking-wider">
                              Scorer: <strong className="text-black uppercase">{o.actualFirstGoalscorer || 'None'}</strong>
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="px-2 py-0.5 bg-black text-white font-mono text-xs rounded-md border border-black">
                              {o.actualScoreA} - {o.actualScoreB}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
