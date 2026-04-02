export interface Trade {
  id: string;
  date: string;
  symbol: string;
  direction: 'long' | 'short';
  entryPrice: number;
  exitPrice: number;
  shares: number;
  profitLoss: number;
  profitLossPercent: number;
  strategy?: string;
  notes?: string;
  tags?: string[];
  setupImage?: string;
}

export interface TradeStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfitLoss: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  profitFactor: number;
  expectancy: number;
}