import { Trade, TradeStats } from '../types/trade';

const STORAGE_KEY = 'trading_journal_trades';

export const tradeStorage = {
  getTrades(): Trade[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading trades:', error);
      return [];
    }
  },

  saveTrades(trades: Trade[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
    } catch (error) {
      console.error('Error saving trades:', error);
    }
  },

  addTrade(trade: Trade): void {
    const trades = this.getTrades();
    trades.push(trade);
    this.saveTrades(trades);
  },

  updateTrade(id: string, updatedTrade: Trade): void {
    const trades = this.getTrades();
    const index = trades.findIndex(t => t.id === id);
    if (index !== -1) {
      trades[index] = updatedTrade;
      this.saveTrades(trades);
    }
  },

  deleteTrade(id: string): void {
    const trades = this.getTrades();
    const filtered = trades.filter(t => t.id !== id);
    this.saveTrades(filtered);
  },

  calculateStats(trades: Trade[]): TradeStats {
    if (trades.length === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        totalProfitLoss: 0,
        averageWin: 0,
        averageLoss: 0,
        largestWin: 0,
        largestLoss: 0,
        profitFactor: 0,
        expectancy: 0,
      };
    }

    const winningTrades = trades.filter(t => t.profitLoss > 0);
    const losingTrades = trades.filter(t => t.profitLoss < 0);
    
    const totalProfitLoss = trades.reduce((sum, t) => sum + t.profitLoss, 0);
    const totalWins = winningTrades.reduce((sum, t) => sum + t.profitLoss, 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.profitLoss, 0));
    
    const averageWin = winningTrades.length > 0 ? totalWins / winningTrades.length : 0;
    const averageLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;
    
    const largestWin = winningTrades.length > 0 
      ? Math.max(...winningTrades.map(t => t.profitLoss)) 
      : 0;
    const largestLoss = losingTrades.length > 0 
      ? Math.min(...losingTrades.map(t => t.profitLoss)) 
      : 0;

    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;
    const expectancy = trades.length > 0 ? totalProfitLoss / trades.length : 0;

    return {
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0,
      totalProfitLoss,
      averageWin,
      averageLoss,
      largestWin,
      largestLoss,
      profitFactor,
      expectancy,
    };
  },
};
