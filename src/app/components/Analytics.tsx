import { useEffect, useState } from 'react';
import { tradeStorage } from '../utils/tradeStorage';
import { Trade } from '../types/trade';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ArrowUpDown } from 'lucide-react';

export function Analytics() {
  const [allTrades, setAllTrades] = useState<Trade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [cumulativePL, setCumulativePL] = useState<any[]>([]);
  const [winLossData, setWinLossData] = useState<any[]>([]);
  const [symbolData, setSymbolData] = useState<any[]>([]);
  const [strategyData, setStrategyData] = useState<any[]>([]);
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all');
  const [strategyFilter, setStrategyFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');
  const [availableStrategies, setAvailableStrategies] = useState<string[]>([]);

  useEffect(() => {
    const trades = tradeStorage.getTrades();
    setAllTrades(trades);
    
    // Get unique strategies
    const strategies = [...new Set(trades.map(t => t.strategy || 'No Strategy'))];
    setAvailableStrategies(strategies);
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [allTrades, outcomeFilter, strategyFilter, sortBy]);

  const applyFiltersAndSort = () => {
    let filtered = [...allTrades];

    // Filter by outcome
    if (outcomeFilter === 'profits') {
      filtered = filtered.filter(t => t.profitLoss > 0);
    } else if (outcomeFilter === 'losses') {
      filtered = filtered.filter(t => t.profitLoss < 0);
    }

    // Filter by strategy
    if (strategyFilter !== 'all') {
      filtered = filtered.filter(t => {
        const tradeStrategy = t.strategy || 'No Strategy';
        return tradeStrategy === strategyFilter;
      });
    }

    // Sort trades
    if (sortBy === 'profitHigh') {
      filtered.sort((a, b) => b.profitLoss - a.profitLoss);
    } else if (sortBy === 'profitLow') {
      filtered.sort((a, b) => a.profitLoss - b.profitLoss);
    } else if (sortBy === 'date') {
      filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    setFilteredTrades(filtered);
    processChartData(filtered);
  };

  const processChartData = (trades: Trade[]) => {
    // Cumulative P/L over time
    let cumulative = 0;
    const cumulativeData = trades.map((trade, index) => {
      cumulative += trade.profitLoss;
      return {
        trade: index + 1,
        profitLoss: parseFloat(cumulative.toFixed(2)),
        date: trade.date,
      };
    });
    setCumulativePL(cumulativeData);

    // Win/Loss distribution
    const wins = trades.filter(t => t.profitLoss > 0).length;
    const losses = trades.filter(t => t.profitLoss < 0).length;
    setWinLossData([
      { name: 'Wins', value: wins, color: '#10b981' },
      { name: 'Losses', value: losses, color: '#ef4444' },
    ]);

    // P/L by Symbol
    const symbolMap = new Map<string, number>();
    trades.forEach(trade => {
      const current = symbolMap.get(trade.symbol) || 0;
      symbolMap.set(trade.symbol, current + trade.profitLoss);
    });
    const symbolChartData = Array.from(symbolMap.entries())
      .map(([symbol, pl]) => ({ symbol, profitLoss: parseFloat(pl.toFixed(2)) }))
      .sort((a, b) => b.profitLoss - a.profitLoss)
      .slice(0, 10);
    setSymbolData(symbolChartData);

    // P/L by Strategy
    const strategyMap = new Map<string, number>();
    trades.forEach(trade => {
      const strategy = trade.strategy || 'No Strategy';
      const current = strategyMap.get(strategy) || 0;
      strategyMap.set(strategy, current + trade.profitLoss);
    });
    const strategyChartData = Array.from(strategyMap.entries())
      .map(([strategy, pl]) => ({ strategy, profitLoss: parseFloat(pl.toFixed(2)) }))
      .sort((a, b) => b.profitLoss - a.profitLoss);
    setStrategyData(strategyChartData);
  };

  if (allTrades.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500">No trades available for analytics</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <ArrowUpDown className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Filter & Sort:</span>
            </div>
            
            <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Trades</SelectItem>
                <SelectItem value="profits">Profits Only</SelectItem>
                <SelectItem value="losses">Losses Only</SelectItem>
              </SelectContent>
            </Select>

            <Select value={strategyFilter} onValueChange={setStrategyFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Strategies</SelectItem>
                {availableStrategies.map(strategy => (
                  <SelectItem key={strategy} value={strategy}>
                    {strategy}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Sort by Date</SelectItem>
                <SelectItem value="profitHigh">Highest Profit</SelectItem>
                <SelectItem value="profitLow">Lowest Profit</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-gray-500">
              Showing {filteredTrades.length} of {allTrades.length} trades
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cumulative P/L Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Cumulative Profit/Loss</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={cumulativePL}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="trade" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => `$${value.toFixed(2)}`}
                labelFormatter={(label) => `Trade #${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="profitLoss" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ r: 3 }}
                name="P/L"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Win/Loss Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Win/Loss Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={winLossData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {winLossData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* P/L by Strategy */}
        <Card>
          <CardHeader>
            <CardTitle>P/L by Strategy</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={strategyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="strategy" />
                <YAxis />
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                <Bar dataKey="profitLoss" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* P/L by Symbol */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Symbols by P/L</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={symbolData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="symbol" type="category" />
              <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
              <Bar dataKey="profitLoss">
                {symbolData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.profitLoss >= 0 ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Month</th>
                  <th className="text-right py-2">Trades</th>
                  <th className="text-right py-2">Wins</th>
                  <th className="text-right py-2">Losses</th>
                  <th className="text-right py-2">Win Rate</th>
                  <th className="text-right py-2">P/L</th>
                </tr>
              </thead>
              <tbody>
                {getMonthlyStats(filteredTrades).map((month, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{month.month}</td>
                    <td className="text-right">{month.trades}</td>
                    <td className="text-right text-green-600">{month.wins}</td>
                    <td className="text-right text-red-600">{month.losses}</td>
                    <td className="text-right">{month.winRate.toFixed(1)}%</td>
                    <td className={`text-right font-semibold ${
                      month.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${month.profitLoss.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getMonthlyStats(trades: Trade[]) {
  const monthMap = new Map<string, Trade[]>();
  
  trades.forEach(trade => {
    const date = new Date(trade.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, []);
    }
    monthMap.get(monthKey)!.push(trade);
  });

  return Array.from(monthMap.entries())
    .map(([monthKey, trades]) => {
      const wins = trades.filter(t => t.profitLoss > 0).length;
      const losses = trades.filter(t => t.profitLoss < 0).length;
      const profitLoss = trades.reduce((sum, t) => sum + t.profitLoss, 0);
      
      return {
        month: monthKey,
        trades: trades.length,
        wins,
        losses,
        winRate: trades.length > 0 ? (wins / trades.length) * 100 : 0,
        profitLoss,
      };
    })
    .sort((a, b) => b.month.localeCompare(a.month));
}