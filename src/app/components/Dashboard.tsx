import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { tradeStorage } from '../utils/tradeStorage';
import { Trade, TradeStats } from '../types/trade';
import { ArrowUp, ArrowDown, TrendingUp, Target, DollarSign, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { TradeCalendar } from './TradeCalendar';

export function Dashboard() {
  const [stats, setStats] = useState<TradeStats | null>(null);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [allTrades, setAllTrades] = useState<Trade[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const trades = await tradeStorage.getTrades();
      const calculatedStats = tradeStorage.calculateStats(trades);
      setStats(calculatedStats);
      setRecentTrades(trades.slice(-5).reverse());
      setAllTrades(trades);
    };
    
    loadData();
  }, []);

  if (!stats) {
    return <div>Loading...</div>;
  }

  const statCards = [
    {
      title: 'Total P/L',
      value: `$${stats.totalProfitLoss.toFixed(2)}`,
      icon: DollarSign,
      color: stats.totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: stats.totalProfitLoss >= 0 ? 'bg-green-100' : 'bg-red-100',
    },
    {
      title: 'Win Rate',
      value: `${stats.winRate.toFixed(1)}%`,
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Total Trades',
      value: stats.totalTrades.toString(),
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Avg Win / Loss',
      value: `$${stats.averageWin.toFixed(2)} / $${stats.averageLoss.toFixed(2)}`,
      icon: Award,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div>
        <h2 className="mb-4">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.title}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                      <p className={`text-2xl font-semibold ${card.color}`}>
                        {card.value}
                      </p>
                    </div>
                    <div className={`w-12 h-12 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${card.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Trade Calendar */}
      <Card>
        <CardHeader>
          <CardTitle>Trading Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <TradeCalendar trades={allTrades} />
        </CardContent>
      </Card>

      {/* Win/Loss Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Trade Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm text-gray-600">Winning Trades</span>
                </div>
                <span className="font-semibold">{stats.winningTrades}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm text-gray-600">Losing Trades</span>
                </div>
                <span className="font-semibold">{stats.losingTrades}</span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Profit Factor</span>
                  <span className="font-semibold">
                    {stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Best & Worst</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <ArrowUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">Largest Win</span>
                </div>
                <p className="text-2xl font-semibold text-green-600">
                  ${stats.largestWin.toFixed(2)}
                </p>
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <ArrowDown className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-gray-600">Largest Loss</span>
                </div>
                <p className="text-2xl font-semibold text-red-600">
                  ${stats.largestLoss.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Trades */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Trades</CardTitle>
            <Link 
              to="/history" 
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View All
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentTrades.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No trades recorded yet</p>
              <Link 
                to="/add-trade"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <span>Add Your First Trade</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTrades.map((trade) => (
                <div
                  key={trade.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      trade.direction === 'long' 
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {trade.direction.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{trade.symbol}</p>
                      <p className="text-sm text-gray-500">{trade.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      trade.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${trade.profitLoss.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {trade.profitLossPercent.toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}