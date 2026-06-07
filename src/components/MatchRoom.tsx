import React, { useState } from 'react';
import { ShieldCheck, Flame, Trophy, AlertTriangle, Play, HelpCircle, Volume2, Copy, Check, ArrowRight, CornerDownRight } from 'lucide-react';
import { Prediction } from '../types';
import { getMatchLabel, encodePrediction, WORLD_CUP_MATCHES } from '../data';

interface MatchRoomProps {
  prediction: Prediction;
  locale: string;
  onChallenge: (counterPrediction: Prediction) => void;
  onBack: () => void;
}

const LOCALIZED_ROOM_STRINGS: Record<string, Record<string, string>> = {
  'en': {
    title: 'EGO BATTLE MATCH-ROOM',
    subtitle: 'THE GLOVE HAS BEEN THROWN. ARE YOU GOING TO TAKE THIS LYING DOWN?',
    vs: 'VS',
    prophetLabel: 'THE PROPHECY CREATOR',
    opponentLabel: 'CHALLENGER TARGET',
    awaitingDefense: '⚡ AWAITING DEFENSE ⚡',
    predictionTitle: 'THE PROPHECY',
    consequenceTitle: 'CONSEQUENCE STAKES',
    consequenceDesc: 'If wrong, they must:',
    lockInCounter: '⚔️ LOCK IN COUNTER-BRAG',
    callCoward: '🐔 CALL THEM A COWARD',
    cowardToast: '🐔 COWARD STAMP COPIED! Paste it in the group chat to destroy their ego.',
    supportProphecy: '🍷 AGREE WITH THIS TAKE',
    supportToast: '🍷 Prophecy supported! Let the group chat know you stand with them.',
    agreeSoundTitle: 'AGREE',
    cowardSoundTitle: 'CLUCK',
    egoText: 'They locked in this receipt of truth. If they are wrong, they are doomed. If you stay silent, they win by default.',
    cowardClipText: '🐔 [Prophet] is a certified coward who doesn\'t know ball! They predicted [Summary] or they\'ll [Stakes]. Challenge them or call their bluff here: [Link]'
  },
  'es-MX': {
    title: 'RING DE PELEA K.O.',
    subtitle: '¡TE CANTARON UN TIRO! ¿TE VAS A RAJAR O VAS A PONERTE LA MÁSCARA?',
    vs: 'VS',
    prophetLabel: 'EL INICIADOR',
    opponentLabel: 'EL RETADO',
    awaitingDefense: '⚡ A LA ESPERA DE RESPUESTA ⚡',
    predictionTitle: 'LA PROFECÍA',
    consequenceTitle: 'APUESTA DEL PERDEDOR',
    consequenceDesc: 'Si falla, promete:',
    lockInCounter: '⚔️ REGISTRAR CONTRA-RETORNO',
    callCoward: '🐔 GRITARLE COBARDE (¡RAJAO!)',
    cowardToast: '🐔 ¡MÁSCARA DE GALLINA COPIADA! Pégala en el chat para humillarlo.',
    supportProphecy: '🍷 APOYAR LA CAUSA',
    supportToast: '🍷 ¡Apoyo registrado! El orgullo está en juego.',
    egoText: 'Registró su llave en la arena. Si falla, perderá la cabellera. Si te callas, te ganará sin luchar.',
    cowardClipText: '🐔 ¡[Prophet] se está rajando con su predicción de cartón! Dijo [Summary] o promete [Stakes]. Rétalo o dile cobarde aquí: [Link]'
  },
  'id': {
    title: 'ARENA ADU BACIT & EGO',
    subtitle: 'TANTANGAN SUDAH DIKUNCI. MAU DIEM AJA KAYA PENGECUT ATAU LAWAN?',
    vs: 'VS',
    prophetLabel: 'KING RAMAL',
    opponentLabel: 'TARGET LAWAN',
    awaitingDefense: '⚡ MENUNGGU BALASAN ⚡',
    predictionTitle: 'RAMALAN',
    consequenceTitle: 'HUKUMAN KENA MENTAL',
    consequenceDesc: 'Kalo salah, kudu:',
    lockInCounter: '⚔️ KUNCI PREDiksi tandingan',
    callCoward: '🐔 SEBUT MEREKA PENGECUT',
    cowardToast: '🐔 LABEL PENGECUT DISALIN! Tebar di grup chat biar mentalnya runtuh.',
    supportProphecy: '🍷 GUA SETUJU SAMA INI',
    supportToast: '🍷 Mantap! Dukungan lu telah terekam di sejarah.',
    egoText: 'Mereka udah bikin resi anti-debat. Kalo salah, mereka joget koplo. Kalo lu diem aja, lu dianggap ciut.',
    cowardClipText: '🐔 Si [Prophet] bacotnya gede banget tapi prediksi ampas! Katanya [Summary] klo gk [Stakes]. Buktiin dia salah di sini: [Link]'
  },
  'ar': {
    title: 'غرفة صراع الهياط الكروي',
    subtitle: 'لقد ألقى القفاز في وجهك! هل ستصمت كرويًا أم ستثبت أنه لا يفهم الكرة؟',
    vs: 'VS',
    prophetLabel: 'صاحب الهياط الأول',
    opponentLabel: 'المتحدي المستهدف',
    awaitingDefense: '⚡ في انتظار الرد والجلد ⚡',
    predictionTitle: 'التوقع الكروي',
    consequenceTitle: 'شرط الهزيمة (رهان الهياط)',
    consequenceDesc: 'إذا خسر، سيلتزم بـ:',
    lockInCounter: '⚔️ سجل توقعك المضاد الآن',
    callCoward: '🐔 انعتهم بالصياح والجبن',
    cowardToast: '🐔 تم نسخ وسم الجبن! انشره في القروب لتبكيهم.',
    supportProphecy: '🍷 أتفق مع هذا الهياط الكروي',
    supportToast: '🍷 تم تسجيل الدعم! المجد الكروي يقترب.',
    egoText: 'لقد وثق هذا الإيصال التاريخي. لو أخطأ فستلحقه الفضيحة للأبد. صمتك يعني فوزه التلقائي!',
    cowardClipText: '🐔 [Prophet] يهايط بتوقع خرطي ولا يفهم كورة! يقول [Summary] وإلا [Stakes]. اتحداه أو خله يصيح هنا: [Link]'
  },
  'en-KE': {
    title: 'KITI MOTO MATCH-ROOM',
    subtitle: 'MSUU AMEKURUSHIA CHECHE. UTAKAA CHONJO AMA UTALALA KI-MZEE?',
    vs: 'VS',
    prophetLabel: 'MAN NYUMA KICKOFF',
    opponentLabel: 'MSEE ANA-CALLIWA OUT',
    awaitingDefense: '⚡ BADO HAJA-RESPOND ⚡',
    predictionTitle: 'DISKI PREDICTION',
    consequenceTitle: 'KITI MOTO WAGER',
    consequenceDesc: 'Kama amedunda, lazima:',
    lockInCounter: '⚔️ LOCK IN COUNTER-BRAG YAKO',
    callCoward: '🐔 MWAMBIE NI MWOGA (COWARD)',
    cowardToast: '🐔 COWARD STAMP IMELOCKIWA CLIPBOARD! Ipate kwa group chat uwa-aibishe.',
    supportProphecy: '🍷 GONGANA NA HII TAKE',
    supportToast: '🍷 Ume-support! Inakunywa vizuri.',
    egoText: 'Huyu msee amelock brag yake na receipt. Kama amedunda, aibu itamfunika. Usipocheza, amekushinda bila mechi kuanza.',
    cowardClipText: '🐔 Huyu [Prophet] ni mwoga anapiga kelele jaba! Amesema [Summary] ama ata [Stakes]. M-show ana-choke hapa: [Link]'
  },
  'en-ZA': {
    title: 'THE DISKI BATTLE CAGE',
    subtitle: 'THE SLIP IS FILED, BRU. ARE YOU GOING TO CHOKE OR CHALLENGE THE CHINA?',
    vs: 'VS',
    prophetLabel: 'ORIGINAL JOL PROPHECY',
    opponentLabel: 'CHALLENGER TARGET',
    awaitingDefense: '⚡ AWAITING DEFENSE ⚡',
    predictionTitle: 'THE PROPHECY SLIP',
    consequenceTitle: 'THE JOL CONSEQUENCE',
    consequenceDesc: 'If incorrect, this china will:',
    lockInCounter: '⚔️ LOCK IN COUNTER-BRAG, BRU',
    callCoward: '🐔 CALL THEM A CHOKE COWARD',
    cowardToast: '🐔 CHOKE COWARD STAMP COPIED! Paste in the WhatsApp Jol crew to finish them.',
    supportProphecy: '🍷 CHOP-CHOP AGREE WITH THIS',
    supportToast: '🍷 Agree registered, proper Castle Lite jol incoming!',
    egoText: 'This citizen locked in their proof. If they are wrong, they pay the wager. Stand up and file a counter-slip, no cap.',
    cowardClipText: '🐔 [Prophet] is proper choking with this trash slip! They predicted [Summary] or they\'ll [Stakes]. Show this bru who owns the jol here: [Link]'
  }
};

export default function MatchRoom({ prediction, locale, onChallenge, onBack }: MatchRoomProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeReaction, setActiveReaction] = useState<'coward' | 'agree' | null>(null);

  const t = (key: string): string => {
    return LOCALIZED_ROOM_STRINGS[locale]?.[key] || LOCALIZED_ROOM_STRINGS['en']?.[key] || key;
  };

  const getPredictionSummary = () => {
    const typeStr = prediction.predictionType || 'match';
    if (typeStr === 'match') {
      let teamA = "Team A";
      let teamB = "Team B";
      if (prediction.matchId === 'custom' && prediction.customMatch) {
        const stripped = prediction.customMatch.replace(/⚽/g, '').trim();
        const parts = stripped.split(/\s+vs\s+/gi);
        if (parts.length === 2) {
          teamA = parts[0].trim();
          teamB = parts[1].trim();
        }
      } else {
        const preset = WORLD_CUP_MATCHES.find(m => m.id === prediction.matchId);
        if (preset) {
          teamA = preset.teamA;
          teamB = preset.teamB;
        }
      }
      return `${teamA} vs ${teamB} (${prediction.predictedScoreA}-${prediction.predictedScoreB})`;
    }
    if (prediction.predictionType === 'player') {
      return `${prediction.playerName} to get ${prediction.playerValue} ${prediction.playerMarket}`;
    }
    if (prediction.predictionType === 'team') {
      return `${prediction.teamName} to ${prediction.teamMarket}`;
    }
    return prediction.customTakeText || 'Custom Hot Take';
  };

  // Web Audio Synth for Chicken Cluck Cluck
  const playChickenCluck = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const cluck = (time: number, freqStart: number, freqEnd: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        // Triangle wave gives a woody, animalistic cluck sound
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freqStart, time);
        osc.frequency.exponentialRampToValueAtTime(freqEnd, time + duration * 0.2);
        osc.frequency.exponentialRampToValueAtTime(freqStart * 0.6, time + duration);
        
        gainNode.gain.setValueAtTime(0.25, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start(time);
        osc.stop(time + duration);
      };
      
      const now = audioCtx.currentTime;
      // High pitch cluck sequence
      cluck(now, 450, 750, 0.14);
      cluck(now + 0.18, 480, 800, 0.12);
      cluck(now + 0.35, 380, 650, 0.22);
    } catch (e) {
      console.warn("Synth failed", e);
    }
  };

  // Web Audio Synth for Agree / Win chime
  const playAgreeChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880.00, now + 0.12); // A5
      osc.frequency.setValueAtTime(1174.66, now + 0.24); // D6
      
      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.start(now);
      osc.stop(now + 0.65);
    } catch (e) {
      console.warn("Synth failed", e);
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCallCoward = () => {
    playChickenCluck();
    setActiveReaction('coward');
    setTimeout(() => setActiveReaction(null), 1000);

    const shareLink = `${window.location.origin}/room/${prediction.id}`;
    const summary = getPredictionSummary();
    const stakesText = prediction.stakes ? prediction.stakes : "admit they know nothing about football";
    const prophetName = prediction.name ? prediction.name : "Anonymous";

    let template = t('cowardClipText');
    template = template
      .replace('[Prophet]', prophetName)
      .replace('[Summary]', summary)
      .replace('[Stakes]', stakesText)
      .replace('[Link]', shareLink);

    navigator.clipboard.writeText(template)
      .then(() => showToast(t('cowardToast')))
      .catch(err => console.error("Clipboard copy failed", err));
  };

  const handleSupportTake = () => {
    playAgreeChime();
    setActiveReaction('agree');
    setTimeout(() => setActiveReaction(null), 1000);

    const shareLink = `${window.location.origin}/room/${prediction.id}`;
    const prophetName = prediction.name ? prediction.name : "Anonymous";

    const text = `🍷 I stand with ${prophetName}'s bold prophecy! They locked in: "${getPredictionSummary()}". Check the battle details here: ${shareLink}`;
    
    navigator.clipboard.writeText(text)
      .then(() => showToast(t('supportToast')))
      .catch(err => console.error("Clipboard copy failed", err));
  };

  const triggerCounterBrag = () => {
    // Inverse the scores if it's a match prediction
    const reversedScoreA = prediction.predictedScoreB || '0';
    const reversedScoreB = prediction.predictedScoreA || '0';
    
    let counterPlayerMarket = prediction.playerMarket;
    let counterPlayerValue = prediction.playerValue;
    let counterTeamMarket = prediction.teamMarket;
    let counterCustomText = prediction.customTakeText;

    if (prediction.predictionType === 'player') {
      counterPlayerMarket = `${prediction.playerMarket || 'total goals'} (CHOKED)`;
      const currentValNum = parseInt(prediction.playerValue || '0');
      counterPlayerValue = currentValNum > 0 ? String(Math.max(1, Math.floor(currentValNum / 2))) : '0';
    } else if (prediction.predictionType === 'team') {
      counterTeamMarket = `${prediction.teamMarket || 'wins'} (FAILED)`;
    } else if (prediction.predictionType === 'custom') {
      counterCustomText = `Counter-brag: "${prediction.name || 'Prophet'}"'s take is certified garbage, it will crash.`;
    }

    const counterPrediction: Prediction = {
      ...prediction,
      id: `COUNTER-${Math.floor(1000 + Math.random() * 9000)}`,
      name: `Challenger`,
      calledOut: prediction.name, // call out the original creator
      predictedScoreA: reversedScoreA,
      predictedScoreB: reversedScoreB,
      boldPredictions: ['They are 100% wrong', 'Group chat will witness the collapse'],
      status: undefined,
      timestamp: new Date().toLocaleDateString(),
      playerMarket: counterPlayerMarket,
      playerValue: counterPlayerValue,
      teamMarket: counterTeamMarket,
      customTakeText: counterCustomText
    };

    onChallenge(counterPrediction);
  };

  const originalProphet = prediction.name ? prediction.name.toUpperCase() : 'ANONYMOUS';
  const targetOpponent = prediction.calledOut ? prediction.calledOut.toUpperCase().replace(/^@/, '') : 'YOU?';
  const stakesConsequence = prediction.stakes ? prediction.stakes : 'admit they know absolutely nothing about football';

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-[fadeIn_0.4s_ease-out]">
      {/* Upper Back Rail */}
      <div className="flex justify-between items-center bg-black border-4 border-black p-3.5 rounded-2xl text-white neo-shadow-sm">
        <span className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-yellow-400">
          <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border border-black" />
          {t('title')}
        </span>
        <button
          onClick={onBack}
          className="bg-white hover:bg-zinc-150 text-black font-extrabold text-[10px] px-3.5 py-1.5 rounded-lg border-2 border-black neo-shadow-sm uppercase tracking-wider cursor-pointer transition-all"
        >
          🧾 CREATE MY OWN
        </button>
      </div>

      {/* Main Neo-Brutalist Battle card */}
      <div className="relative border-4 border-black bg-white text-black rounded-3xl p-6 md:p-8 neo-shadow overflow-hidden">
        {/* Blinking radioactive stripes */}
        <div className="absolute top-0 inset-x-0 h-3 bg-red-500 overflow-hidden flex">
          <div className="w-full h-full bg-gradient-to-r from-red-500 via-yellow-400 to-red-500 animate-[marquee_12s_linear_infinite] opacity-80" />
        </div>

        {/* Localized Banner Header */}
        <div className="text-center mt-3 mb-8 space-y-1">
          <span className="bg-red-600 text-white font-mono text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-md border border-black animate-bounce inline-block">
            🚨 EGO CHALLENGE INJECTED 🚨
          </span>
          <h2 className="font-sans font-black text-2xl md:text-4xl tracking-tighter uppercase italic leading-none drop-shadow-sm pt-2">
            {t('subtitle')}
          </h2>
        </div>

        {/* Split Screen Battle Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-11 gap-6 items-center border-4 border-black p-6 rounded-2xl bg-zinc-50 relative">
          
          {/* LEFT DECK: THE PROPHET */}
          <div className="md:col-span-5 bg-white border-2 border-black rounded-2xl p-4 space-y-3 neo-shadow-sm">
            <span className="bg-emerald-600 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-black block w-fit">
              {t('prophetLabel')}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-sans font-black text-emerald-600 tracking-tight block">
                👑 @{originalProphet}
              </span>
            </div>
            
            <div className="border-t-2 border-dashed border-zinc-200 pt-3">
              <span className="text-[9px] text-zinc-500 font-extrabold uppercase block tracking-wider mb-1">{t('predictionTitle')}:</span>
              <p className="text-base font-black text-black leading-tight uppercase font-sans">
                {getPredictionSummary()}
              </p>
            </div>
            
            <div className="border-t-2 border-dashed border-zinc-200 pt-3">
              <span className="text-[9px] text-zinc-500 font-extrabold uppercase block tracking-wider mb-1">{t('consequenceTitle')}:</span>
              <div className="flex items-start gap-1.5 bg-red-50 p-2 rounded-lg border border-red-200">
                <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5 stroke-[3]" />
                <p className="text-xs font-bold text-red-950 uppercase leading-snug">
                  {t('consequenceDesc')} <span className="font-black italic">"{stakesConsequence}"</span>
                </p>
              </div>
            </div>
          </div>

          {/* MIDDLE COLUMN: VS BADGE */}
          <div className="md:col-span-1 flex justify-center py-2 md:py-0">
            <div className="w-14 h-14 bg-black text-yellow-400 rounded-full border-4 border-black flex items-center justify-center font-black text-xl italic neo-shadow-sm select-none shrink-0 animate-[pulse_1.5s_infinite]">
              {t('vs')}
            </div>
          </div>

          {/* RIGHT DECK: THE OPPONENT */}
          <div className={`md:col-span-5 bg-white border-2 border-black rounded-2xl p-4 space-y-3 neo-shadow-sm min-h-[200px] flex flex-col justify-between transition-all duration-300 ${activeReaction === 'coward' ? 'border-red-500 scale-[1.01] bg-red-50' : ''}`}>
            <div>
              <span className="bg-red-650 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-black block w-fit">
                {t('opponentLabel')}
              </span>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-2xl font-sans font-black text-red-650 tracking-tight block">
                  🎯 @{targetOpponent}
                </span>
              </div>
            </div>

            <div className="border-2 border-dashed border-red-500/40 bg-red-500/5 p-4 rounded-xl text-center space-y-2 animate-pulse mt-4">
              <span className="text-xs font-black text-red-650 block animate-live-pulse tracking-wide uppercase">
                {t('awaitingDefense')}
              </span>
              <p className="text-[10px] text-zinc-650 font-bold uppercase leading-tight">
                {t('egoText')}
              </p>
            </div>
          </div>
        </div>

        {/* Bannering alert toast notification */}
        {toastMessage && (
          <div className="mt-4 bg-yellow-400 text-black border-2 border-black p-3 rounded-xl font-bold text-xs font-sans text-center uppercase tracking-wide neo-shadow-sm animate-[fadeIn_0.2s_ease-out] flex items-center justify-center gap-1.5">
            <ShieldCheck size={14} className="stroke-[3]" />
            {toastMessage}
          </div>
        )}

        {/* EGO BANTER ACTIONS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-8 pt-6 border-t-4 border-black">
          
          {/* Action 1: Call Coward */}
          <button
            onClick={handleCallCoward}
            className="flex items-center justify-center gap-2 text-xs font-black uppercase text-white bg-red-650 hover:bg-red-500 border-2 border-black py-4 px-4 rounded-xl cursor-pointer neo-shadow-sm active:scale-95 transition-all w-full select-none"
            title="Play cluck cluck audio and copy provocative challenge roast payload to clipboard"
          >
            <Volume2 size={14} className="stroke-[3]" />
            <span>{t('callCoward')}</span>
          </button>

          {/* Action 2: Lock Counter Brag */}
          <button
            onClick={triggerCounterBrag}
            className="flex items-center justify-center gap-2 text-xs font-black uppercase text-black bg-yellow-400 hover:bg-yellow-300 border-2 border-black py-4 px-4 rounded-xl cursor-pointer neo-shadow active:scale-95 transition-all w-full select-none"
            title="Lock in a reverse/counter-brag"
          >
            <span>{t('lockInCounter')}</span>
            <ArrowRight size={14} className="stroke-[3]" />
          </button>

          {/* Action 3: Support Prophecy */}
          <button
            onClick={handleSupportTake}
            className="flex items-center justify-center gap-2 text-xs font-black uppercase text-zinc-700 bg-stone-100 hover:bg-stone-200 border-2 border-black py-4 px-4 rounded-xl cursor-pointer neo-shadow-sm active:scale-95 transition-all w-full select-none"
            title="Agree with take and copy supportive link"
          >
            <Trophy size={14} className="stroke-[3] text-stone-600" />
            <span>{t('supportProphecy')}</span>
          </button>

        </div>
      </div>

      {/* Real-time commentary feed for matches */}
      <div className="bg-black text-white border-4 border-black rounded-3xl p-5 neo-shadow space-y-4">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400">🚨 LIVE MATCH-ROOM CHATTER</span>
          <span className="text-[9px] bg-red-600 text-white px-2 py-0.5 rounded font-mono font-black uppercase animate-pulse">1.2K FANS IN ROOM</span>
        </div>
        <div className="space-y-3.5 max-h-56 overflow-y-auto font-mono text-[11px] leading-relaxed text-zinc-350 pr-2">
          <div className="flex gap-2">
            <span className="text-yellow-400 font-extrabold shrink-0">[21:01] @NeymarSuperFan:</span>
            <p>"{originalProphet} has completely lost their mind. {getPredictionSummary()} is the worst take I have ever heard in my life."</p>
          </div>
          <div className="flex gap-2">
            <span className="text-emerald-500 font-extrabold shrink-0">[21:02] @TacticalMike:</span>
            <p>"Actually, the metrics support it. If they win by that, it's historical. Supporting this prophecy! 🍷"</p>
          </div>
          <div className="flex gap-2">
            <span className="text-red-500 font-extrabold shrink-0">[21:03] @ChokePatrol:</span>
            <p>"If they choke this, that consequence stake is going to hit like a truck. Shaking my head."</p>
          </div>
          <div className="flex gap-2">
            <span className="text-zinc-500 font-extrabold shrink-0">[21:04] @SystemOracle:</span>
            <p>"Room prediction consensus: 12% AGREE · 88% CHOKE RISK."</p>
          </div>
        </div>
      </div>
    </div>
  );
}
