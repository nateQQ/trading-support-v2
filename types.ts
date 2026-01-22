export interface MarketCoin {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  image: string;
}

export enum TradeDirection {
  LONG = 'Long',
  SHORT = 'Short',
  WAIT = 'Wait',
}

export interface AnalysisResult {
  trend: string;
  direction: TradeDirection;
  entryPrice: string;
  targetPrice: string;
  pnlProjection: string;
  rationale: string;
  confidence: string; // High, Medium, Low
}

export interface AnalysisState {
  isLoading: boolean;
  result: AnalysisResult | null;
  error: string | null;
}

export enum Timeframe {
  M15 = '15m',
  H1 = '1h',
}