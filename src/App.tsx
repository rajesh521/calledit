import React, { useState, useEffect } from 'react';
import { Trophy, ShieldCheck, Sparkles, AlertTriangle, Flame, TrendingUp, DollarSign } from 'lucide-react';
import { Prediction } from './types';
import { decodePrediction, encodePrediction } from './data';
import ReceiptForm from './components/ReceiptForm';
import ReceiptView from './components/ReceiptView';
import SimulationCheckout from './components/SimulationCheckout';
import GlobalHub from './components/GlobalHub';
import { submitPrediction } from './api';
import MatchRoom from './components/MatchRoom';

const TRANSLATIONS: Record<string, Record<string, string>> = {
  'en': {
    heading: 'LOCK IN YOUR "I KNEW IT" MOMENT.',
    subheading: 'Every fan says it after the match. Now you can prove it before kickoff.',
    lockedBrags: 'BRAGS LOCKED',
    engineTag: 'WORLD CUP 2026 • BRAGGING RIGHTS ENGINE',
    proofTitle: 'PROOF BEFORE KICKOFF',
    proofSubtitle: '100% TIME-STAMPED',
    bragTitle: 'BRAG MODE UNLOCKED',
    bragSubtitle: '50,251 FANS BRAGGING',
    lockInBrag: '🔒 LOCK IN MY BRAG',
    generateAnother: '🧾 Generate Another Receipt',
    witnessingTitle: '👀 SOMEONE\'S BRAG IS BEING WITNESSED',
    nameLabel: 'YOUR NAME / HANDLE',
    calledOutLabel: 'CALLING OUT',
    calledOutPlaceholder: 'e.g. @RonaldoFanBoy',
    stakesLabel: 'THE STAKES',
    stakesPlaceholder: 'e.g. wear a Brazil jersey all day',
    callingOutOption: '(optional)',
    stakesOption: '(if wrong, I will...)',
    evidenceRedactedHeading: '[ EVIDENCE REDACTED ]',
    evidenceRedactedDesc: 'This brag has been officially redacted under the Coward\'s Way Out protection act.',
    evidenceRedactedStatus: '🔒 STATUS: SHAME COIL DELETED',
  },
  'es-MX': {
    heading: '¡SÚBETE AL RING Y REGISTRA TU "TE LO DIJE", GÜEY!',
    subheading: 'Cállales el hocico antes del silbatazo. Quítales la máscara en la cancha, sin rajarse.',
    lockedBrags: 'BRAGS EN LA ARENA',
    engineTag: 'COPA MUNDIAL 2026 • EL JALE DE LA RIVALIDAD',
    proofTitle: 'MÁSCARA CONTRA CABELLERA',
    proofSubtitle: '100% TIEMPO OFICIAL DE LUCHA',
    bragTitle: 'MODO PRESUMIDO EN LA TERCERA CUERDA',
    bragSubtitle: '50,251 GUERREROS BRAGGEANDO',
    lockInBrag: '🔒 REGISTRAR MI LLAVE',
    generateAnother: '🧾 Nueva Caída',
    witnessingTitle: '👀 ¡ALGUIEN SE VA A LANZAR DESDE LA TERCERA CUERDA!',
    nameLabel: 'TU APODO / LUCHADOR',
    calledOutLabel: '¡LE CANTO UN TIRO A:',
    calledOutPlaceholder: 'Ej. @RonaldoFanBoy',
    stakesLabel: 'EL RETO DEL PERDEDOR',
    stakesPlaceholder: 'Ej. pagar las chelas y pasear sin máscara',
    callingOutOption: '(opcional)',
    stakesOption: '(si fallo, prometo...)',
    evidenceRedactedHeading: '[ ¡NO MAMES! SE RAJÓ ]',
    evidenceRedactedDesc: 'Esta payasada se canceló de la tercera cuerda para evitar la humillación pública.',
    evidenceRedactedStatus: '🔒 ESTATUS: MÁSCARA SALVADA',
  },
  'id': {
    heading: 'KUNCI MOMEN "KAN GUA BILANG" LU, NO DEBAT!',
    subheading: 'Semua orang bisa bacot pasca-match. Buktiin sekarang sebelum kickoff, no counter!',
    lockedBrags: 'BRAGS ANTI-HYPE GAUL',
    engineTag: 'PIALA DUNIA 2026 • MESIN ADU EGO & BACIT',
    proofTitle: 'BUKTI SEBELUM KICKOFF',
    proofSubtitle: '100% ANTI DEBAT EDITAN',
    bragTitle: 'MODE PAMER SUDAH DI-STEK',
    bragSubtitle: '50,251 FANS NGAJAK REBUTAN',
    lockInBrag: '🔒 KUNCI BRAG LU BOS',
    generateAnother: '🧾 Bikin Resi Baru, Gas!',
    witnessingTitle: '👀 ADA MSEE LAGI MAU NGASIH PAHAM!',
    nameLabel: 'NAMA / HANDLE GAUL LU',
    calledOutLabel: 'NGASIH PAHAM KE:',
    calledOutPlaceholder: 'e.g. @RonaldoFanBoy',
    stakesLabel: 'TARUHANNYA:',
    stakesPlaceholder: 'e.g. joget koplo di lampu merah',
    callingOutOption: '(opsional)',
    stakesOption: '(kalo salah, gua bakal...)',
    evidenceRedactedHeading: '[ KENA MENTAL / DI-REDAKSI ]',
    evidenceRedactedDesc: 'Brag ini resmi dihapus demi kesehatan mental dan keselamatan reputasi lu.',
    evidenceRedactedStatus: '🔒 STATUS: SHAME COIL DIAPUS',
  },
  'ar': {
    heading: 'وثّق هياطك الكروي التاريخي قبل الجلد.',
    subheading: 'كل النواصري والهلايل يهايطون بعد الجلد. أثبت كلامك قبل ركلة البداية ولا تصيح!',
    lockedBrags: 'تفاخر كروي موثق',
    engineTag: 'كأس العالم 2026 • محرك الهياط الرسمي',
    proofTitle: 'إثبات رسمي قبل الجلد',
    proofSubtitle: 'مختوم بالوقت 100% ولا عزاء للصياح',
    bragTitle: 'تم تشغيل وضع الهياط',
    bragSubtitle: '50,251 مشجع يهايطون الآن',
    lockInBrag: '🔒 وثّق هياطك الكروي',
    generateAnother: '🧾 إنشاء إيصال آخر',
    witnessingTitle: '👀 صياح أحدهم قيد التوثيق الآن',
    nameLabel: 'اسم العرّاف / اليوزر',
    calledOutLabel: 'أبي أصيحك يا:',
    calledOutPlaceholder: 'مثال: @RonaldoFanBoy',
    stakesLabel: 'رهان الجلد (لو توقعت خطأ سأقوم بـ...)',
    stakesPlaceholder: 'مثال: ألبس قميص الهلال طوال اليوم',
    callingOutOption: '(اختياري)',
    stakesOption: '(إذا طلع كلامي خرطي سأقوم بـ...)',
    evidenceRedactedHeading: '[ تم حرق الدليل ]',
    evidenceRedactedDesc: 'تم شطب هذا الهياط رسميًا لتجنب الصياح اللانهائي وحفظ ماء الوجه كرويًا.',
    evidenceRedactedStatus: '🔒 الحالة: تم مسح الفضيحة',
  },
  'en-KE': {
    heading: 'LOCK IN DISKI YAKO NI "NILIKUSHOW" MOMENT.',
    subheading: 'Kila jaba man anajua kuongea baada ya mechi. Prove pia wewe kabla ya kickoff, msee.',
    lockedBrags: 'BRAGS ZIMELOCKIWA NDANI',
    engineTag: 'WORLD CUP 2026 • DISKI BRAGGING RIGHTS MACHINE',
    proofTitle: 'UFAHAMU KABLA YA KICKOFF',
    proofSubtitle: '100% NO REVISIONISM, MSEE',
    bragTitle: 'BRAG MODE IMEUNGANISHWA NDANI',
    bragSubtitle: '50,251 FANS WAKO KWA DISKI',
    lockInBrag: '🔒 LOCK IN BRAG YAKO, MZEE',
    generateAnother: '🧾 Tengeneza Receipt Nyingine',
    witnessingTitle: '👀 BRAG YA HUYU BRATHE INASHUHUDIWA',
    nameLabel: 'JINA / HANDLE YAKO',
    calledOutLabel: 'NA-CALL OUT HUYU MSEE:',
    calledOutPlaceholder: 'e.g. @RonaldoFanBoy',
    stakesLabel: 'KITI MOTO:',
    stakesPlaceholder: 'e.g. nitalipa chrome kwa kila msee',
    callingOutOption: '(optional)',
    stakesOption: '(if wrong, nita...)',
    evidenceRedactedHeading: '[ EVIDENCE IMEREDACTIWA ]',
    evidenceRedactedDesc: 'Hii brag ilienda na maji ikafutwa kuzuia aibu ndogo ndogo, msee.',
    evidenceRedactedStatus: '🔒 STATUS: AIBU IMEDELITIWA',
  },
  'en-ZA': {
    heading: 'LOCK IN YOUR DISKI "I KNEW IT" OUKIP MOMENT.',
    subheading: 'Every china talks big after the match. Prove your diski skills before kickoff, no cap.',
    lockedBrags: 'BRAGS LOCKED IN',
    engineTag: 'WORLD CUP 2026 • THE DISKI JOL',
    proofTitle: 'DISKI PROOF BEFORE KICKOFF',
    proofSubtitle: '100% CHOP-CHOP STAMPED',
    bragTitle: 'BRAG MODE IS LEKKER',
    bragSubtitle: '50,251 CHINAS BRAGGING',
    lockInBrag: '🔒 LOCK IN MY BRAG, BRU',
    generateAnother: '🧾 Make Another Slip',
    witnessingTitle: '👀 SOME CHINA\'S BRAG IS BEING WITNESSED',
    nameLabel: 'YOUR NAME / SLIP NAME',
    calledOutLabel: 'DISKI CHALLENGE TO:',
    calledOutPlaceholder: 'e.g. @RonaldoFanBoy',
    stakesLabel: 'THE JOL WAGER:',
    stakesPlaceholder: 'e.g. buy the whole crew Castle Lites',
    callingOutOption: '(optional)',
    stakesOption: '(if wrong, I will...)',
    evidenceRedactedHeading: '[ SHAME DELETED, BRU ]',
    evidenceRedactedDesc: 'This slip was proper incinerated under the Coward\'s Way Out protection act.',
    evidenceRedactedStatus: '🔒 STATUS: CHOKE ERASURE DONE',
  }
};

export default function App() {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [viewingShared, setViewingShared] = useState(false);
  const [isGolden, setIsGolden] = useState(false);
  const [challengePreFill, setChallengePreFill] = useState<Prediction | null>(null);
  const [isRoomView, setIsRoomView] = useState(false);
  
  // Checkout simulator state managers
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutType, setCheckoutType] = useState<'gold' | 'tip' | 'burn'>('gold');
  const [checkoutAmount, setCheckoutAmount] = useState(1.99);
  const [checkoutCustomText, setCheckoutCustomText] = useState('');
  const [checkoutCountry, setCheckoutCountry] = useState('US');

  // Resolve country code from active locale
  const getCountryFromLocale = (loc: string): string => {
    const l = loc.toLowerCase();
    if (l.includes('mx')) return 'MX';
    if (l.includes('id')) return 'ID';
    if (l.includes('ke')) return 'KE';
    if (l.includes('za')) return 'ZA';
    if (l.includes('ar')) return 'SA';
    return 'US';
  };

  // Localization states
  const [locale, setLocale] = useState<string>(() => {
    // 1. Check path prefix
    const path = window.location.pathname.replace(/\/$/, '');
    const pathLocale = ['/es-mx', '/id', '/ar', '/en-ke', '/en-za'].find(l => path.toLowerCase().startsWith(l));
    if (pathLocale) {
      if (pathLocale.toLowerCase() === '/es-mx') return 'es-MX';
      if (pathLocale.toLowerCase() === '/en-ke') return 'en-KE';
      if (pathLocale.toLowerCase() === '/en-za') return 'en-ZA';
      return pathLocale.replace('/', '');
    }
    
    // 2. Check window.__LOCALE__ injected by server
    if ((window as any).__LOCALE__) return (window as any).__LOCALE__;
    
    return 'en';
  });

  const [shengActive, setShengActive] = useState(true);

  // Dynamically set document language and direction
  useEffect(() => {
    const direction = locale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = direction;
    document.documentElement.lang = locale;
  }, [locale]);

  const handleLocaleChange = (newLocale: string) => {
    setLocale(newLocale);
    
    // Update path prefix
    const params = new URLSearchParams(window.location.search);
    const rParam = params.get('r');
    const queryStr = rParam ? `?r=${encodeURIComponent(rParam)}` : '';
    
    const localePath = newLocale === 'en' ? '/' : `/${newLocale}`;
    window.history.pushState({ path: localePath + queryStr }, '', localePath + queryStr);
  };

  const t = (key: string) => {
    if (locale === 'en-KE' && !shengActive) {
      return TRANSLATIONS['en'][key];
    }
    return TRANSLATIONS[locale]?.[key] || TRANSLATIONS['en'][key];
  };

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
    
    // Check if path is a room path
    const path = window.location.pathname.toLowerCase();
    const isRoom = path.includes('/room/') || path.endsWith('/room');
    if (isRoom) {
      setIsRoomView(true);
    }

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
            
            // Persist the success state to the database
            submitPrediction(updated).catch(e => console.warn("Failed to persist gold card upgrade:", e));

            setTimeout(() => {
              playGoldChime();
            }, 300);

            // Sync clean URL without transaction metadata
            const newUrl = isRoom 
              ? `${window.location.origin}/room/${updated.id}` 
              : `${window.location.origin}/brag/${updated.id}`;
            window.history.pushState({ path: newUrl }, '', newUrl);
          } else {
            const tipAmt = parseFloat(tipAmtStr);
            const updated: Prediction = {
              ...decoded,
              tipAmount: (decoded.tipAmount || 0) + tipAmt
            };
            setPrediction(updated);
            setViewingShared(true);
            
            // Persist the success state to the database
            submitPrediction(updated).catch(e => console.warn("Failed to persist tip:", e));
            
            const newUrl = isRoom 
              ? `${window.location.origin}/room/${updated.id}` 
              : `${window.location.origin}/brag/${updated.id}`;
            window.history.pushState({ path: newUrl }, '', newUrl);
          }
        } else {
          setPrediction(decoded);
          setViewingShared(true);
          setIsGolden(decoded.isGolden);
        }
      }
    } else {
      // Pathname parser (e.g. /brag/ROT-ABCD or /es-MX/brag/ROT-ABCD)
      let cleanPath = window.location.pathname;
      const pathLocale = ['/es-mx', '/id', '/ar', '/en-ke', '/en-za'].find(l => cleanPath.toLowerCase().startsWith(l));
      if (pathLocale) {
        cleanPath = cleanPath.substring(pathLocale.length);
      }
      
      const parts = cleanPath.split('/').filter(Boolean);
      if (parts.length >= 2) {
        const type = parts[0].toLowerCase();
        const id = parts[1];
        if (type === 'brag' || type === 'room') {
          fetch(`/api/predictions/${id}`)
            .then(res => {
              if (!res.ok) throw new Error("Not found");
              return res.json();
            })
            .then(pred => {
              setPrediction(pred);
              setViewingShared(true);
              setIsGolden(pred.isGolden || false);
              if (type === 'room') {
                setIsRoomView(true);
              }
            })
            .catch(err => {
              console.error("Failed to fetch prediction from database:", err);
            });
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
    const newUrl = isRoomView 
      ? `${window.location.origin}/room/${savedPred.id}` 
      : `${window.location.origin}/brag/${savedPred.id}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  };

  // Convert current view-only or active receipt into Golden Tier
  const handleUpgradeSuccess = async (customMessage?: string) => {
    setIsGolden(true);
    if (prediction) {
      const updated: Prediction = {
        ...prediction,
        isGolden: true,
        goldenMessage: customMessage || prediction.goldenMessage || "PROVED TO BE CORRECT"
      };
      setPrediction(updated);
      try {
        await submitPrediction(updated);
      } catch (e) {
        console.error("Failed to save gold upgrade in database:", e);
      }
      
      // Update URL search parameter
      const newUrl = isRoomView 
        ? `${window.location.origin}/room/${updated.id}` 
        : `${window.location.origin}/brag/${updated.id}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
    }
  };

  const handleTipSuccess = async (customMessage?: string, tipAmount?: number) => {
    if (prediction && tipAmount) {
      const updated: Prediction = {
        ...prediction,
        tipAmount: (prediction.tipAmount || 0) + tipAmount
      };
      setPrediction(updated);
      try {
        await submitPrediction(updated);
      } catch (e) {
        console.error("Failed to save tip in database:", e);
      }
      
      const newUrl = isRoomView 
        ? `${window.location.origin}/room/${updated.id}` 
        : `${window.location.origin}/brag/${updated.id}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
    }
  };

  const handleTipSuccessCallback = (customMessage?: string, tipAmount?: number) => {
    handleTipSuccess(customMessage, tipAmount);
  };

  const handleBurnSuccess = async () => {
    if (prediction) {
      const updated: Prediction = {
        ...prediction,
        burned: true
      };
      setPrediction(updated);
      try {
        await submitPrediction(updated);
      } catch (e) {
        console.error("Failed to save burn in database:", e);
      }
      
      const newUrl = isRoomView 
        ? `${window.location.origin}/room/${updated.id}` 
        : `${window.location.origin}/brag/${updated.id}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
    }
  };

  const handleBackToForm = () => {
    setPrediction(null);
    setViewingShared(false);
    setIsGolden(false);
    setChallengePreFill(null);
    setIsRoomView(false);
    // Reset URL to base path
    const cleanUrl = window.location.origin;
    window.history.pushState({ path: cleanUrl }, '', cleanUrl);
  };

  const handleChallenge = (counterPrediction: Prediction) => {
    setChallengePreFill(counterPrediction);
    setPrediction(null);
    setViewingShared(false);
    setIsGolden(false);
    setIsRoomView(false);
    
    const newUrl = `${window.location.origin}/?r=${encodePrediction(counterPrediction)}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  };

  const triggerCheckout = (type: 'gold' | 'tip' | 'burn', amount: number, customText?: string, country?: string) => {
    setCheckoutType(type);
    setCheckoutAmount(amount);
    setCheckoutCustomText(customText || '');
    setCheckoutCountry(country || getCountryFromLocale(locale));
    setIsCheckoutOpen(true);
  };

  return (
    <div className="min-h-screen bg-emerald-600 text-white flex flex-col relative overflow-x-hidden font-sans pb-12">
      {/* Sharing Viewer Global banner */}
      {viewingShared && prediction && (
        <div className="bg-yellow-400 text-black py-3 px-4 text-center text-xs font-black uppercase tracking-wider flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2 relative z-40 border-b-4 border-black">
          <span className="flex items-center justify-center gap-1.5">
            <AlertTriangle size={14} className="animate-pulse" />
            {t('witnessingTitle')} — {prediction.name.toUpperCase()} CALLED IT BEFORE KICKOFF
          </span>
          <button
            onClick={handleBackToForm}
            className="bg-black hover:bg-zinc-900 text-yellow-400 font-extrabold text-[10px] px-3.5 py-1.5 rounded-lg border-2 border-black neo-shadow-sm uppercase tracking-wider cursor-pointer transition-all self-center"
          >
            {t('lockInBrag')}
          </button>
        </div>
      )}

      {/* Header Navigation consistent with design draft */}
      <nav className="h-auto py-4 sm:py-0 sm:h-20 bg-emerald-700 px-4 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-b-4 border-black relative z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-400 border-2 border-black rounded-lg flex items-center justify-center font-black text-black text-xl italic font-sans neo-shadow-sm">
            BM
          </div>
          <span className="text-2xl font-black uppercase tracking-tighter text-white">
            BragMode
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-1.5">
            <select 
              value={locale} 
              onChange={(e) => handleLocaleChange(e.target.value)}
              className="bg-black text-yellow-400 text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg border-2 border-black focus:outline-none cursor-pointer hover:bg-zinc-900 transition-all"
            >
              <option value="en">🇺🇸 EN</option>
              <option value="es-MX">🇲🇽 ES (MX)</option>
              <option value="id">🇮🇩 ID</option>
              <option value="ar">🇸🇦 AR (RTL)</option>
              <option value="en-KE">🇰🇪 SHENG (KE)</option>
              <option value="en-ZA">🇿🇦 LEKKER (ZA)</option>
            </select>

            {locale === 'en-KE' && (
              <button 
                type="button"
                onClick={() => setShengActive(!shengActive)}
                className="bg-yellow-400 text-black text-[9px] font-black uppercase px-2 py-1 rounded border border-black cursor-pointer hover:bg-yellow-300 transition-all whitespace-nowrap"
              >
                {shengActive ? 'Sheng 🇰🇪' : 'Eng 🇬🇧'}
              </button>
            )}
          </div>

          <div className="px-3 py-1 bg-black text-yellow-400 text-[10px] font-black rounded-lg border border-black uppercase tracking-wider">
            {t('engineTag')}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-zinc-100">142,852 {t('lockedBrags')}</span>
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border border-black"></div>
          </div>
        </div>
      </nav>

      {/* Main Container Wrapper */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 relative z-10 flex flex-col justify-between">
        {/* Core Header branding */}
        <header className="text-center space-y-4 mb-8 max-w-3xl mx-auto py-2">
          <div className="inline-block text-[10px] sm:text-xs font-black uppercase tracking-widest text-yellow-400 bg-black/40 border border-yellow-400/30 px-3 py-1 rounded-full mb-1">
            {t('engineTag')}
          </div>
          <h1 className="font-sans font-black text-3xl sm:text-5xl tracking-tight leading-none text-white uppercase italic scale-y-105 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            {t('heading')}
          </h1>
          <p className="text-xs sm:text-sm text-stone-100 max-w-2xl mx-auto font-sans font-bold uppercase tracking-wider leading-relaxed">
            {t('subheading')}
          </p>
        </header>

        {/* Dynamic content modules */}
        <main className="flex-1 flex flex-col justify-center max-w-4xl w-full mx-auto">
          {isRoomView && prediction ? (
            /* Render active match room view */
            <MatchRoom
              prediction={prediction}
              locale={locale}
              onChallenge={handleChallenge}
              onBack={handleBackToForm}
            />
          ) : prediction ? (
            /* Render active predictions receipt view */
            <div className="animate-[fadeIn_0.4s_ease-out]">
              <ReceiptView
                key={prediction.id}
                prediction={prediction}
                locale={locale}
                onBackToEdit={handleBackToForm}
                onUpgradeClick={(customText, amount) => triggerCheckout('gold', amount ?? 1.99, customText, getCountryFromLocale(locale))}
                onBurnClick={() => triggerCheckout('burn', 0.99)}
                onTipClick={(amount) => triggerCheckout('tip', amount)}
                onChallenge={handleChallenge}
                t={t}
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
                t={t}
              />

              {/* Holographic Viral Counter boards - Neo Brutalist layout */}
              <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white border-4 border-black p-4 rounded-2xl flex items-center gap-3.5 text-black neo-shadow">
                  <div className="p-2.5 bg-emerald-500/10 text-emerald-700 rounded-xl border-2 border-black">
                    <ShieldCheck size={20} className="stroke-[3]" />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider block">{t('proofTitle')}</span>
                    <span className="text-sm font-black font-mono">{t('proofSubtitle')}</span>
                  </div>
                </div>

                <div className="bg-white border-4 border-black p-4 rounded-2xl flex items-center gap-3.5 text-black neo-shadow">
                  <div className="p-2.5 bg-yellow-400/20 text-yellow-600 rounded-xl border-2 border-black">
                    <Trophy size={20} className="stroke-[3] text-stone-900" />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider block">{t('bragTitle')}</span>
                    <span className="text-sm font-black font-mono">{t('bragSubtitle')}</span>
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
          <span>🔴 LIVE: ARGENTINA VS BRAZIL • NEW JERSEY • KICKOFF T-MINUS 04:22:11</span>
          <span>//</span>
          <span>🔒 FAN_NEYMAR_10 JUST LOCKED IN THEIR "I KNEW IT" BRAG — PRE-KICKOFF PROOF SEALED</span>
          <span>//</span>
          <span>🍷 AGED LIKE WINE: 1,247 BRAGS CONFIRMED CORRECT TODAY • HALL OF FAME MATERIAL</span>
          <span>//</span>
          <span>🥛 HALL OF SHAME: COLD TAKE DETECTED IN 44 COUNTRIES — BRAG MODE ACTIVATED ANYWAY</span>
          <span>//</span>
          <span>🔒 LOCK IN YOUR BRAG BEFORE KICKOFF • PROOF YOU SAID IT FIRST • bragmode.com</span>
          <span>//</span>
          <span>🔴 LIVE: ARGENTINA VS BRAZIL • NEW JERSEY • KICKOFF T-MINUS 04:22:11</span>
          <span>//</span>
          <span>🔒 FAN_NEYMAR_10 JUST LOCKED IN THEIR "I KNEW IT" BRAG — PRE-KICKOFF PROOF SEALED</span>
          <span>//</span>
          <span>🍷 AGED LIKE WINE: 1,247 BRAGS CONFIRMED CORRECT TODAY • HALL OF FAME MATERIAL</span>
          <span>//</span>
          <span>🥛 HALL OF SHAME: COLD TAKE DETECTED IN 44 COUNTRIES — BRAG MODE ACTIVATED ANYWAY</span>
        </div>
      </footer>

      {/* Simulated Secure Payment Checkout Overlay */}
      <SimulationCheckout
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={
          checkoutType === 'gold' 
            ? (msg) => handleUpgradeSuccess(msg) 
            : checkoutType === 'burn'
              ? () => handleBurnSuccess()
              : (msg, tipAmt) => handleTipSuccess(msg, tipAmt)
        }
        type={checkoutType}
        amount={checkoutAmount}
        predictionPayload={prediction ? encodePrediction(prediction) : ""}
        country={checkoutCountry}
        initialCustomText={checkoutCustomText}
      />
    </div>
  );
}
