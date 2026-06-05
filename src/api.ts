import { Prediction } from './types';

export interface MatchOutcome {
  matchId: string;
  actualScoreA: string;
  actualScoreB: string;
  actualFirstGoalscorer: string;
  resolved: boolean;
  resolvedAt?: string;
}

export interface MatchTrend {
  matchId: string;
  teamAVotes: number;
  drawVotes: number;
  teamBVotes: number;
  totalVotes: number;
}

export interface GlobalAnalytics {
  totalMinted: number;
  totalGolden: number;
  totalTips: number;
  trends: MatchTrend[];
}

export async function fetchPredictions(search?: string, status?: string): Promise<Prediction[]> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (status) params.append('status', status);
  
  const response = await fetch(`/api/predictions?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to retrieve predictions.');
  }
  return response.json();
}

export async function submitPrediction(prediction: Omit<Prediction, 'id'>): Promise<Prediction> {
  const response = await fetch('/api/predictions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prediction)
  });
  if (!response.ok) {
    throw new Error('Failed to mint truth receipt.');
  }
  return response.json();
}

export async function fetchOutcomes(): Promise<MatchOutcome[]> {
  const response = await fetch('/api/outcomes');
  if (!response.ok) {
    throw new Error('Failed to fetch match outcomes.');
  }
  return response.json();
}

export async function resolveMatchOutcome(
  matchId: string,
  actualScoreA: string,
  actualScoreB: string,
  actualFirstGoalscorer: string
): Promise<{ success: boolean; outcome: MatchOutcome }> {
  const response = await fetch('/api/outcomes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      matchId,
      actualScoreA,
      actualScoreB,
      actualFirstGoalscorer
    })
  });
  if (!response.ok) {
    throw new Error('Failed to submit kickoff resolution.');
  }
  return response.json();
}

export async function fetchAnalytics(): Promise<GlobalAnalytics> {
  const response = await fetch('/api/analytics');
  if (!response.ok) {
    throw new Error('Failed to load global metrics.');
  }
  return response.json();
}

export async function resetSimulationDB(): Promise<{ success: boolean; message: string }> {
  const response = await fetch('/api/reset-simulation', {
    method: 'POST'
  });
  if (!response.ok) {
    throw new Error('Failed to clear database state.');
  }
  return response.json();
}
