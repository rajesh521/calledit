"use client";

import React, { useState, useEffect } from 'react';
import { Flame, Trophy, AlertTriangle, ArrowRight, ShieldCheck, RefreshCw, MessageSquare } from 'lucide-react';
import { encodePrediction } from '../../../src/data';

interface Prediction {
  id: string;
  name: string;
  matchId: string;
  customMatch?: string;
  predictedScoreA: string;
  predictedScoreB: string;
  firstGoalscorer: string;
  boldPredictions: string[];
  isGolden: boolean;
  goldenMessage?: string;
  timestamp: string;
  barcodeValue: string;
  calledOut?: string;
  stakes?: string;
  status?: string;
  confidence?: number;
}

interface BanterMatchClientProps {
  teamA: string;
  teamB: string;
  slug: string;
  initialPredictions: Prediction[];
}

export default function BanterMatchClient({ teamA, teamB, slug, initialPredictions }: BanterMatchClientProps) {
  const [predictions, setPredictions] = useState<Prediction[]>(initialPredictions);
  const [isSyncing, setIsSyncing] = useState(false);

  // Poll for new live brags matching this matchup every 6 seconds to create a real-time banter wall
  useEffect(() => {
    const fetchFreshBanter = async () => {
      setIsSyncing(true);
      try {
        const response = await fetch(`/api/predictions?search=${encodeURIComponent(teamA)}`);
        if (response.ok) {
          const data = await response.json();
          // Filter predictions to ensure they contain both Team A and Team B context
          const matched = data.filter((p: any) => {
            const label = (p.customMatch || '').toLowerCase();
            return label.includes(teamA.toLowerCase()) && label.includes(teamB.toLowerCase());
          });
          
          if (matched.length > 0) {
            // Merge and de-duplicate by ID, keeping younger predictions first
            setPredictions(prev => {
              const all = [...matched, ...prev];
              const unique = all.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
              return unique.sort((a, b) => b.id.localeCompare(a.id));
            });
          }
        }
      } catch (err) {
        console.warn("Client polling failed, relying on static pre-renders.", err);
      } finally {
        setIsSyncing(false);
      }
    };

    const interval = setInterval(fetchFreshBanter, 6000);
    return () => clearInterval(interval);
  }, [teamA, teamB]);

  // Navigate to main creation form prefilled with this match context
  const handleLockInBrag = () => {
    const dummyPrediction = {
      name: '',
      matchId: 'custom',
      customMatch: `⚽ ${teamA} vs ${teamB} ⚽`,
      predictedScoreA: '2',
      predictedScoreB: '1',
      firstGoalscorer: '',
      boldPredictions: ['Scores inside 30 mins', 'Match outcome resolved by penalty'],
      timestamp: new Date().toLocaleDateString(),
      barcodeValue: `ROT-CTR-${Math.floor(100000 + Math.random() * 900000)}`
    };

    if (typeof window !== 'undefined') {
      window.location.href = `/?r=${encodePrediction(dummyPrediction as any)}`;
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto px-4 py-8 relative z-10">
      
      {/* Header Board */}
      <div className="bg-black border-4 border-black p-6 rounded-3xl neo-shadow flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse border border-black" />
            <span className="text-[10px] text-zinc-400 font-mono font-black uppercase tracking-widest">LIVE BANTER ENGINE RESOLVING</span>
          </div>
          <h2 className="font-sans font-black text-2xl md:text-3xl text-white uppercase italic leading-none pt-1">
            🔥 {teamA} VS {teamB} TRASH TALK
          </h2>
          <p className="text-[10px] text-zinc-300 font-bold uppercase tracking-wider">
            MINTED PRE-MATCH PROPHECIES LOGGED SECURELY IN THE LEDGER.
          </p>
        </div>

        <button
          onClick={handleLockInBrag}
          className="bg-yellow-400 hover:bg-yellow-300 text-black font-sans font-black text-xs uppercase py-3.5 px-6 rounded-xl border-2 border-black neo-shadow-sm select-none cursor-pointer active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap self-stretch md:self-auto justify-center"
        >
          <span>🔒 LOCK IN MY BRAG</span>
          <ArrowRight size={14} className="stroke-[3]" />
        </button>
      </div>

      {/* Dynamic UGC Banter Wall */}
      <div className="space-y-4">
        <div className="flex justify-between items-center text-[10px] font-black uppercase text-zinc-400 tracking-widest px-1">
          <span>PUBLIC TAKES LEDGER ({predictions.length})</span>
          {isSyncing ? (
            <span className="flex items-center gap-1.5 text-yellow-400">
              <RefreshCw size={10} className="animate-spin" />
              Syncing Feed...
            </span>
          ) : (
            <span className="text-zinc-550">Realtime Sync Active</span>
          )}
        </div>

        {predictions.length === 0 ? (
          <div className="border-4 border-dashed border-zinc-800 rounded-3xl p-12 text-center space-y-4 bg-neutral-900/40">
            <MessageSquare size={36} className="mx-auto text-zinc-650 animate-bounce" />
            <p className="text-sm font-sans font-black uppercase text-zinc-500">NO RECEIPTS LOCKED FOR THIS FIXTURE YET</p>
            <p className="text-xs font-bold text-zinc-400 uppercase max-w-sm mx-auto leading-normal">
              Be the first to call the outcome. Lock in your predictions now and own the bragging rights.
            </p>
            <button
              onClick={handleLockInBrag}
              className="bg-white hover:bg-stone-100 text-black font-sans font-black text-xs uppercase py-2.5 px-5 rounded-lg border-2 border-black neo-shadow-sm cursor-pointer select-none transition-all inline-block"
            >
              🚀 MINT THE FIRST SLIP
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {predictions.map((p) => {
              const opponent = p.calledOut ? p.calledOut.trim() : 'THE CHAT';
              const stakesConsequence = p.stakes ? p.stakes.trim() : 'admit they know nothing about ball';

              return (
                <div 
                  key={p.id}
                  className={`border-4 border-black rounded-2xl p-5 leading-normal relative overflow-hidden transition-all duration-300 hover:scale-[1.01] ${
                    p.isGolden 
                      ? 'bg-gradient-to-br from-yellow-400 via-amber-400 to-yellow-500 text-black neo-shadow' 
                      : 'bg-white text-black neo-shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[8px] font-mono font-black uppercase tracking-widest px-2 py-0.5 rounded border border-black ${
                      p.isGolden ? 'bg-black text-yellow-400' : 'bg-zinc-150 text-zinc-700'
                    }`}>
                      {p.isGolden ? '✨ GOLD TIER' : 'FREE SLIP'}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-550 font-bold">{p.timestamp.split(' ')[0]}</span>
                  </div>

                  <p className="text-xs font-black font-mono tracking-wide uppercase opacity-75 leading-none">PROPHET HANDLE:</p>
                  <h4 className="text-base font-sans font-black uppercase tracking-tight leading-none mb-3 pt-0.5">@{p.name}</h4>

                  <div className={`border-t border-dashed my-2.5 ${p.isGolden ? 'border-black/30' : 'border-zinc-300'}`} />

                  <div className="space-y-1">
                    <span className="text-[9px] font-mono font-black uppercase opacity-70 block">PREDICTION TARGET:</span>
                    <p className="text-sm font-sans font-black uppercase tracking-tight leading-tight">
                      Predicted Score: {p.predictedScoreA} - {p.predictedScoreB}
                    </p>
                    <p className="text-xs font-bold uppercase opacity-85">Goalscorer: {p.firstGoalscorer}</p>
                  </div>

                  <div className="space-y-1 mt-3">
                    <span className="text-[9px] font-mono font-black uppercase opacity-70 block">CONSEQUENCE STAKES:</span>
                    <p className="text-xs font-black uppercase tracking-tight text-red-650 leading-tight">
                      Or they must: "{stakesConsequence}"
                    </p>
                  </div>

                  {/* QR / Barcode indicator watermark at bottom */}
                  <div className="flex justify-between items-center mt-5 pt-3 border-t border-dashed border-black/10">
                    <span className="text-[8px] font-mono font-bold opacity-60">ID: {p.id.substring(0, 10)}</span>
                    <span className="text-[7px] font-mono font-bold opacity-75 tracking-widest">||||| | |||</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
