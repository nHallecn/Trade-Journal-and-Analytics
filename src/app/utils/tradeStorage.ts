import { Trade, TradeStats } from '../types/trade';
import { supabase } from './supabaseClient';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const STORAGE_KEY = 'trading_journal_trades';

export const tradeStorage = {
  async getTrades(): Promise<Trade[]> {
    try {
      // Try to get from Supabase first
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b9e0526f/trades`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          return data.trades || [];
        }
      }

      // Fallback to localStorage if not authenticated
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading trades:', error);
      // Fallback to localStorage on error
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    }
  },

  saveTrades(trades: Trade[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
    } catch (error) {
      console.error('Error saving trades:', error);
    }
  },

  async addTrade(trade: Trade): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b9e0526f/trades`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(trade),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('Error adding trade to Supabase:', error);
          throw new Error(error.error || 'Failed to add trade');
        }
        return;
      }

      // Fallback to localStorage if not authenticated
      const trades = await this.getTrades();
      trades.push(trade);
      this.saveTrades(trades);
    } catch (error) {
      console.error('Error adding trade:', error);
      throw error;
    }
  },

  async updateTrade(id: string, updatedTrade: Trade): Promise<void> {
    const trades = await this.getTrades();
    const index = trades.findIndex(t => t.id === id);
    if (index !== -1) {
      trades[index] = updatedTrade;
      this.saveTrades(trades);
    }
  },

  async deleteTrade(id: string): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b9e0526f/trades/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('Error deleting trade from Supabase:', error);
          throw new Error(error.error || 'Failed to delete trade');
        }
        return;
      }

      // Fallback to localStorage if not authenticated
      const trades = await this.getTrades();
      const filtered = trades.filter(t => t.id !== id);
      this.saveTrades(filtered);
    } catch (error) {
      console.error('Error deleting trade:', error);
      throw error;
    }
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