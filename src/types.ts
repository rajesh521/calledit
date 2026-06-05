export interface Prediction {
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
  tipAmount?: number;
  status?: 'pending' | 'correct' | 'incorrect';
  outcomeScoreA?: string;
  outcomeScoreB?: string;
  scoreMatched?: boolean;
  goalscorerMatched?: boolean;
  confidence?: number;
  consensus?: number;
  ragePotential?: number;
  hotTakeLabel?: 'MILD' | 'HOT' | 'NUCLEAR';
  
  // Custom Prediction modes fields
  predictionType?: 'match' | 'player' | 'team' | 'custom';
  playerName?: string;
  playerMarket?: string;
  playerValue?: string;
  teamName?: string;
  teamMarket?: string;
  teamValue?: string;
  customTakeText?: string;
}

export interface MatchPreset {
  id: string;
  group: string;
  teamA: string;
  teamB: string;
  flagA: string;
  flagB: string;
  date: string;
}
