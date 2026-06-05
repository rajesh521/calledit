import { Prediction, MatchPreset } from './types';

export const WORLD_CUP_MATCHES: MatchPreset[] = [
  // Group A
  {
    id: "g_a1",
    group: "Group A Match 1",
    teamA: "Mexico",
    teamB: "South Africa",
    flagA: "🇲🇽",
    flagB: "🇿🇦",
    date: "June 11, 2026"
  },
  {
    id: "g_a2",
    group: "Group A Match 2",
    teamA: "USA",
    teamB: "Sweden",
    flagA: "🇺🇸",
    flagB: "🇸🇪",
    date: "June 12, 2026"
  },
  // Group B
  {
    id: "g_b1",
    group: "Group B Match 1",
    teamA: "Canada",
    teamB: "Algeria",
    flagA: "🇨🇦",
    flagB: "🇩🇿",
    date: "June 12, 2026"
  },
  {
    id: "g_b2",
    group: "Group B Match 2",
    teamA: "Belgium",
    teamB: "South Korea",
    flagA: "🇧🇪",
    flagB: "🇰🇷",
    date: "June 13, 2026"
  },
  // Group C
  {
    id: "g_c1",
    group: "Group C Match 1",
    teamA: "Argentina",
    teamB: "Slovenia",
    flagA: "🇦🇷",
    flagB: "🇸🇮",
    date: "June 13, 2026"
  },
  {
    id: "g_c2",
    group: "Group C Match 2",
    teamA: "Spain",
    teamB: "Nigeria",
    flagA: "🇪🇸",
    flagB: "🇳🇬",
    date: "June 14, 2026"
  },
  // Group D
  {
    id: "g_d1",
    group: "Group D Match 1",
    teamA: "France",
    teamB: "Saudi Arabia",
    flagA: "🇫🇷",
    flagB: "🇸🇦",
    date: "June 14, 2026"
  },
  {
    id: "g_d2",
    group: "Group D Match 2",
    teamA: "Japan",
    teamB: "Ecuador",
    flagA: "🇯🇵",
    flagB: "🇪🇨",
    date: "June 15, 2026"
  },
  // Group E
  {
    id: "g_e1",
    group: "Group E Match 1",
    teamA: "Brazil",
    teamB: "Germany",
    flagA: "🇧🇷",
    flagB: "🇩🇪",
    date: "June 15, 2026"
  },
  {
    id: "g_e2",
    group: "Group E Match 2",
    teamA: "Egypt",
    teamB: "Norway",
    flagA: "🇪🇬",
    flagB: "🇳🇴",
    date: "June 16, 2026"
  },
  // Group F
  {
    id: "g_f1",
    group: "Group F Match 1",
    teamA: "England",
    teamB: "Cameroon",
    flagA: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    flagB: "🇨🇲",
    date: "June 16, 2026"
  },
  {
    id: "g_f2",
    group: "Group F Match 2",
    teamA: "Portugal",
    teamB: "Costa Rica",
    flagA: "🇵🇹",
    flagB: "🇨🇷",
    date: "June 17, 2026"
  },
  // Group G
  {
    id: "g_g1",
    group: "Group G Match 1",
    teamA: "Netherlands",
    teamB: "Honduras",
    flagA: "🇳🇱",
    flagB: "🇭🇳",
    date: "June 17, 2026"
  },
  {
    id: "g_g2",
    group: "Group G Match 2",
    teamA: "Morocco",
    teamB: "Poland",
    flagA: "🇲🇦",
    flagB: "🇵🇱",
    date: "June 18, 2026"
  },
  // Group H
  {
    id: "g_h1",
    group: "Group H Match 1",
    teamA: "Italy",
    teamB: "Australia",
    flagA: "🇮🇹",
    flagB: "🇦🇺",
    date: "June 18, 2026"
  },
  {
    id: "g_h2",
    group: "Group H Match 2",
    teamA: "Switzerland",
    teamB: "Chile",
    flagA: "🇨🇭",
    flagB: "🇨🇱",
    date: "June 19, 2026"
  },
  // Group I
  {
    id: "g_i1",
    group: "Group I Match 1",
    teamA: "Uruguay",
    teamB: "Ghana",
    flagA: "🇺🇾",
    flagB: "🇬🇭",
    date: "June 19, 2026"
  },
  {
    id: "g_i2",
    group: "Group I Match 2",
    teamA: "Denmark",
    teamB: "Jamaica",
    flagA: "🇩🇰",
    flagB: "🇯🇲",
    date: "June 20, 2026"
  },
  // Group J
  {
    id: "g_j1",
    group: "Group J Match 1",
    teamA: "Colombia",
    teamB: "Iraq",
    flagA: "🇨🇴",
    flagB: "🇮🇶",
    date: "June 20, 2026"
  },
  {
    id: "g_j2",
    group: "Group J Match 2",
    teamA: "Croatia",
    teamB: "Austria",
    flagA: "🇭🇷",
    flagB: "🇦🇹",
    date: "June 21, 2026"
  },
  // Group K
  {
    id: "g_k1",
    group: "Group K Match 1",
    teamA: "Senegal",
    teamB: "Ukraine",
    flagA: "🇸🇳",
    flagB: "🇺🇦",
    date: "June 21, 2026"
  },
  {
    id: "g_k2",
    group: "Group K Match 2",
    teamA: "Peru",
    teamB: "Tunisia",
    flagA: "🇵🇪",
    flagB: "🇹🇳",
    date: "June 22, 2026"
  },
  // Group L
  {
    id: "g_l1",
    group: "Group L Match 1",
    teamA: "Iran",
    teamB: "Panama",
    flagA: "🇮🇷",
    flagB: "🇵🇦",
    date: "June 22, 2026"
  },
  {
    id: "g_l2",
    group: "Group L Match 2",
    teamA: "Turkey",
    teamB: "Wales",
    flagA: "🇹🇷",
    flagB: "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
    date: "June 23, 2026"
  },
  {
    id: "custom",
    group: "Custom Matchup",
    teamA: "Custom Team 1",
    teamB: "Custom Team 2",
    flagA: "⚽",
    flagB: "⚽",
    date: "Any Match Date"
  }
];

// Reconstruct a specific match name or return custom string
export function getMatchLabel(prediction: Prediction): string {
  if (prediction.predictionType === 'player') {
    return `🏃 Player: ${prediction.playerName} — ${prediction.playerMarket}: ${prediction.playerValue}`;
  }
  if (prediction.predictionType === 'team') {
    return `🏆 Team: ${prediction.teamName} — ${prediction.teamMarket}`;
  }
  if (prediction.predictionType === 'custom') {
    return `🔮 Custom: ${prediction.customTakeText}`;
  }
  if (prediction.matchId === 'custom') {
    return prediction.customMatch || 'Custom Matchup';
  }
  const preset = WORLD_CUP_MATCHES.find(m => m.id === prediction.matchId);
  if (preset) {
    return `${preset.flagA} ${preset.teamA} vs ${preset.teamB} ${preset.flagB}`;
  }
  return 'FIFA World Cup 2026 Match';
}

// Encode prediction to url parameter safe base64
export function encodePrediction(prediction: Prediction): string {
  try {
    const jsonStr = JSON.stringify(prediction);
    // Safe base64 handling for unicode characters
    const encoded = btoa(unescape(encodeURIComponent(jsonStr)));
    return encodeURIComponent(encoded);
  } catch (error) {
    console.error("Failed to encode prediction", error);
    return "";
  }
}

// Decode prediction from url parameter
export function decodePrediction(encodedStr: string): Prediction | null {
  try {
    const decodedUri = decodeURIComponent(encodedStr);
    const decodedJson = decodeURIComponent(escape(atob(decodedUri)));
    return JSON.parse(decodedJson) as Prediction;
  } catch (error) {
    console.error("Failed to decode prediction share link", error);
    return null;
  }
}

// Realistic transaction id generator
export function generateTransactionId(): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let id = 'ROT-';
  for (let i = 0; i < 4; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  id += '-';
  for (let i = 0; i < 4; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

// Generate receipt-style lines of specified length
export function fillLine(char: string = '=', length: number = 32): string {
  return char.repeat(length);
}

// Format date to thermal-receipt style: MM/DD/YYYY  HH:MM:SS PM
export function formatFriendlyDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const strHours = String(hours).padStart(2, '0');
  return `${month}/${day}/${year} ${strHours}:${minutes}:${seconds} ${ampm}`;
}

// Calculate highly specific parameters based on the prediction teams & scores
export function calculateViralIndicators(scoreA: number, scoreB: number, teamA: string = "", teamB: string = "") {
  // Let's decide how "wild" the take is:
  const absDiff = Math.abs(scoreA - scoreB);
  const totalGoals = scoreA + scoreB;
  
  // Severe outcome or high goalcount means it's a hot take
  let consensus = 0;
  let ragePotential = 0;
  let hotTakeLabel: 'MILD' | 'HOT' | 'NUCLEAR' = 'MILD';

  // Seeded math so it's stable per exact score prediction details
  const scoreSeed = (scoreA * 7 + scoreB * 13) % 20;

  if (totalGoals >= 5 || absDiff >= 4) {
    hotTakeLabel = "NUCLEAR";
    consensus = 3 + (scoreSeed % 6); // 3% to 8%
    ragePotential = 88 + (scoreSeed % 11); // 88% to 98%
  } else if (totalGoals >= 3 || absDiff >= 2 || (scoreA === 0 && scoreB === 0)) {
    hotTakeLabel = "HOT";
    consensus = 11 + (scoreSeed % 18); // 11% to 28%
    ragePotential = 61 + (scoreSeed % 21); // 61% to 81%
  } else {
    hotTakeLabel = "MILD";
    consensus = 52 + (scoreSeed % 28); // 52% to 79%
    ragePotential = 14 + (scoreSeed % 35); // 14% to 48%
  }

  return {
    consensus,
    ragePotential,
    hotTakeLabel
  };
}
