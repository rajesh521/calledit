import React, { useState, useEffect } from 'react';
import { Sparkles, X, Check, CreditCard, ShieldCheck, HelpCircle, Loader2 } from 'lucide-react';
import { Prediction } from '../types';

interface CheckoutUpsellProps {
  prediction: Prediction;
  locale: string;
  onUpgradeClick: (customText?: string, amount?: number) => void;
}

interface PricingInfo {
  price: string;
  currency: string;
  amount: number;
  paymentMethods: string[];
}

export default function CheckoutUpsell({ prediction, locale, onUpgradeClick }: CheckoutUpsellProps) {
  const [loading, setLoading] = useState(true);
  const [pricing, setPricing] = useState<PricingInfo | null>(null);
  const [customText, setCustomText] = useState('');

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

  const country = getCountryFromLocale(locale);

  // Fetch localized pricing on mount / locale change
  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/dodo/pricing?country=${country}`)
      .then(res => res.json())
      .then(data => {
        if (active) {
          setPricing(data);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error("Failed fetching pricing:", err);
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [country]);

  // Dynamic payment button labeling and badge renderers
  const getPaymentCTADetails = () => {
    switch (country) {
      case 'MX':
        return {
          text: `MINT GOLD TIER WITH OXXO — ${pricing?.price || '$39 MXN'}`,
          icon: (
            <span className="bg-red-600 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded tracking-tighter border border-black inline-flex items-center">
              OXXO
            </span>
          ),
          note: "Pay offline at any OXXO branch in Mexico"
        };
      case 'ID':
        return {
          text: `MINT GOLD TIER WITH GRABPAY — ${pricing?.price || 'Rp 30.000'}`,
          icon: (
            <span className="bg-emerald-600 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded tracking-tight inline-flex items-center gap-1">
              🟢 GrabPay
            </span>
          ),
          note: "Supports GrabPay, ShopeePay & Local Bank Transfers"
        };
      case 'KE':
        return {
          text: `PAY WITH M-PESA — ${pricing?.price || 'KSh 260'}`,
          icon: (
            <span className="bg-emerald-500 text-white font-black text-[9px] px-1.5 py-0.5 rounded tracking-widest inline-flex items-center uppercase">
              M-Pesa
            </span>
          ),
          note: "Direct STK Push checkouts via M-Pesa Kenya"
        };
      case 'ZA':
        return {
          text: `SECURE TIER WITH CARD — ${pricing?.price || 'R 37 ZAR'}`,
          icon: (
            <div className="flex gap-1">
              <span className="bg-blue-800 text-white font-bold text-[8px] px-1 py-0.5 rounded">VISA</span>
              <span className="bg-orange-600 text-white font-bold text-[8px] px-1 py-0.5 rounded">MC</span>
            </div>
          ),
          note: "Supports South African local card debit networks"
        };
      case 'SA':
        return {
          text: `MINT TIER WITH MADA — ${pricing?.price || '7.50 SAR'}`,
          icon: (
            <span className="bg-blue-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded inline-flex items-center italic">
              mada
            </span>
          ),
          note: "Direct checkouts using Saudi mada cards & Apple Pay"
        };
      default:
        return {
          text: `UPGRADE TO GOLD TIER — ${pricing?.price || '$1.99 USD'}`,
          icon: <CreditCard size={14} className="stroke-[2.5]" />,
          note: "Secured checkout powered by Dodo Payments"
        };
    }
  };

  const cta = getPaymentCTADetails();

  const handleUpgrade = () => {
    const finalMessage = customText.trim() || "CERTIFIED ORACLE PROPHECY";
    const finalAmount = pricing ? pricing.amount : 1.99;
    onUpgradeClick(finalMessage, finalAmount);
  };

  return (
    <div className="bg-white text-black border-4 border-black rounded-3xl p-5 sm:p-6 neo-shadow space-y-5 relative overflow-hidden">
      {/* Decorative shimmer tag */}
      <div className="absolute -top-8 -right-8 bg-yellow-400 text-black font-black text-[10px] uppercase py-10 px-8 rotate-45 border-b-4 border-black select-none pointer-events-none flex items-center justify-center">
        VERIFIED
      </div>

      <div className="space-y-1.5">
        <h3 className="font-sans font-black text-xl italic tracking-tight uppercase flex items-center gap-1.5 text-black">
          <Sparkles className="text-yellow-500 fill-yellow-400 animate-spin" style={{ animationDuration: '4s' }} size={20} />
          Upgrade to Gold Tier
        </h3>
        <p className="text-xs text-zinc-650 font-bold uppercase tracking-wider">
          Immortalize your brag before kickoff in the global ledger.
        </p>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-2 gap-3 border-2 border-black rounded-2xl overflow-hidden bg-stone-50">
        
        {/* Basic free column */}
        <div className="p-3.5 border-r-2 border-black space-y-3">
          <div className="text-center pb-2 border-b border-zinc-200">
            <span className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest block">TIER 1</span>
            <span className="text-xs font-black text-zinc-500 uppercase tracking-tight">Boring / Basic</span>
          </div>
          
          <ul className="space-y-2 text-[10px] font-bold text-zinc-600 uppercase">
            <li className="flex items-start gap-1.5">
              <X size={11} className="text-red-500 shrink-0 mt-0.5 stroke-[3]" />
              <span>Standard Gray Slip</span>
            </li>
            <li className="flex items-start gap-1.5">
              <X size={11} className="text-red-500 shrink-0 mt-0.5 stroke-[3]" />
              <span>Hidden from Feed</span>
            </li>
            <li className="flex items-start gap-1.5">
              <X size={11} className="text-red-500 shrink-0 mt-0.5 stroke-[3]" />
              <span>Basic Share Link</span>
            </li>
            <li className="flex items-start gap-1.5">
              <X size={11} className="text-red-500 shrink-0 mt-0.5 stroke-[3]" />
              <span>Watermark Overlay</span>
            </li>
          </ul>
        </div>

        {/* Premium Gold column */}
        <div className="p-3.5 bg-yellow-50/70 space-y-3 relative">
          <div className="text-center pb-2 border-b border-yellow-200">
            <span className="text-[10px] font-mono font-black text-yellow-600 uppercase tracking-widest block">TIER 2</span>
            <span className="text-xs font-black text-amber-700 uppercase tracking-tight flex items-center justify-center gap-0.5">
              👑 Verified / Elite
            </span>
          </div>

          <ul className="space-y-2 text-[10px] font-bold text-amber-950 uppercase">
            <li className="flex items-start gap-1.5">
              <Check size={11} className="text-green-600 shrink-0 mt-0.5 stroke-[3]" />
              <span>24K Golden Receipt</span>
            </li>
            <li className="flex items-start gap-1.5">
              <Check size={11} className="text-green-600 shrink-0 mt-0.5 stroke-[3]" />
              <span>Pinned on Global Wall</span>
            </li>
            <li className="flex items-start gap-1.5">
              <Check size={11} className="text-green-600 shrink-0 mt-0.5 stroke-[3]" />
              <span>Ad-Free Clean Hype</span>
            </li>
            <li className="flex items-start gap-1.5">
              <Check size={11} className="text-green-600 shrink-0 mt-0.5 stroke-[3]" />
              <span>Victory Gold Chime</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Custom golden message input */}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-black text-zinc-700 uppercase tracking-wider">
          Custom Seal Message (Stamped on Gold Slip)
        </label>
        <input
          type="text"
          maxLength={30}
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          placeholder="e.g. STAMPED AUTHENTIC PROPHECY"
          className="w-full bg-stone-50 border-2 border-black rounded-xl px-3 py-2 text-xs font-mono font-bold text-black uppercase focus:outline-none focus:border-yellow-400 placeholder:text-zinc-400"
        />
      </div>

      {/* Localized checkout button */}
      <div className="space-y-1.5">
        <button
          type="button"
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:bg-stone-100 disabled:text-zinc-400 text-black border-4 border-black py-3 px-4 rounded-xl font-sans font-black text-xs uppercase flex items-center justify-center gap-2 cursor-pointer neo-shadow-sm active:scale-[0.98] transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin text-black" size={14} />
              <span>Retrieving Local Price...</span>
            </>
          ) : (
            <>
              <span>{cta.text}</span>
              {cta.icon}
            </>
          )}
        </button>
        
        {!loading && (
          <div className="flex justify-between items-center text-[9px] text-zinc-500 font-bold uppercase tracking-wide px-1">
            <span>{cta.note}</span>
            <span className="flex items-center gap-0.5 text-green-700 font-black">
              <ShieldCheck size={11} /> 100% SECURE
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
