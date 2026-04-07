import { useEffect, useState } from 'react';
import { tradeStorage } from '../utils/tradeStorage';
import { Trade } from '../types/trade';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Trash2, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export function TradeHistory() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [filterDirection, setFilterDirection] = useState<string>('all');
  const [filterOutcome, setFilterOutcome] = useState<string>('all');

  useEffect(() => {
    loadTrades();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [trades, filterDirection, filterOutcome]);

  const loadTrades = async () => {
    const allTrades = await tradeStorage.getTrades();
    setTrades(allTrades.reverse());
  };

  const applyFilters = () => {
    let filtered = [...trades];

    if (filterDirection !== 'all') {
      filtered = filtered.filter(t => t.direction === filterDirection);
    }

    if (filterOutcome !== 'all') {
      if (filterOutcome === 'win') {
        filtered = filtered.filter(t => t.profitLoss > 0);
      } else if (filterOutcome === 'loss') {
        filtered = filtered.filter(t => t.profitLoss < 0);
      }
    }

    setFilteredTrades(filtered);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this trade?')) {
      tradeStorage.deleteTrade(id);
      loadTrades();
      toast.success('Trade deleted successfully');
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Trade History</CardTitle>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <Select value={filterDirection} onValueChange={setFilterDirection}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Trades</SelectItem>
                  <SelectItem value="long">Long Only</SelectItem>
                  <SelectItem value="short">Short Only</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterOutcome} onValueChange={setFilterOutcome}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Results</SelectItem>
                  <SelectItem value="win">Wins Only</SelectItem>
                  <SelectItem value="loss">Losses Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTrades.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No trades found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead>Entry</TableHead>
                    <TableHead>Exit</TableHead>
                    <TableHead>Shares</TableHead>
                    <TableHead>P/L</TableHead>
                    <TableHead>%</TableHead>
                    <TableHead>Strategy</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrades.map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell className="text-sm">{trade.date}</TableCell>
                      <TableCell className="font-medium">{trade.symbol}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          trade.direction === 'long'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {trade.direction.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">${trade.entryPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-sm">${trade.exitPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-sm">{trade.shares}</TableCell>
                      <TableCell className={`font-semibold ${
                        trade.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${trade.profitLoss.toFixed(2)}
                      </TableCell>
                      <TableCell className={`text-sm ${
                        trade.profitLossPercent >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {trade.profitLossPercent.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-sm">{trade.strategy || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(trade.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trade Details */}
      {(filteredTrades.some(t => t.notes) || filteredTrades.some(t => t.setupImage)) && (
        <Card>
          <CardHeader>
            <CardTitle>Trade Notes & Setup Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {filteredTrades
                .filter(t => t.notes || t.setupImage)
                .map(trade => (
                  <div key={trade.id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium">{trade.symbol}</span>
                      <span className="text-sm text-gray-500">{trade.date}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        trade.profitLoss >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        ${trade.profitLoss.toFixed(2)}
                      </span>
                    </div>
                    {trade.notes && (
                      <p className="text-sm text-gray-700 mb-2">{trade.notes}</p>
                    )}
                    {trade.setupImage && (
                      <div className="mt-2">
                        <img
                          src={trade.setupImage}
                          alt={`${trade.symbol} setup`}
                          className="max-w-md rounded-lg border border-gray-200"
                        />
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}