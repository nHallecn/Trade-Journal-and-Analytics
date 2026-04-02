import { useState } from 'react';
import { useNavigate } from 'react-router';
import { tradeStorage } from '../utils/tradeStorage';
import { Trade } from '../types/trade';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Upload, X } from 'lucide-react';

export function AddTrade() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    symbol: '',
    direction: 'long' as 'long' | 'short',
    entryPrice: '',
    exitPrice: '',
    shares: '',
    strategy: '',
    notes: '',
  });
  const [setupImage, setSetupImage] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setSetupImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSetupImage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const entryPrice = parseFloat(formData.entryPrice);
    const exitPrice = parseFloat(formData.exitPrice);
    const shares = parseFloat(formData.shares);

    if (!formData.symbol || !formData.entryPrice || !formData.exitPrice || !formData.shares) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Calculate P/L
    let profitLoss: number;
    if (formData.direction === 'long') {
      profitLoss = (exitPrice - entryPrice) * shares;
    } else {
      profitLoss = (entryPrice - exitPrice) * shares;
    }

    const profitLossPercent = ((profitLoss / (entryPrice * shares)) * 100);

    const trade: Trade = {
      id: Date.now().toString(),
      date: formData.date,
      symbol: formData.symbol.toUpperCase(),
      direction: formData.direction,
      entryPrice,
      exitPrice,
      shares,
      profitLoss,
      profitLossPercent,
      strategy: formData.strategy || undefined,
      notes: formData.notes || undefined,
      setupImage: setupImage || undefined,
    };

    tradeStorage.addTrade(trade);
    toast.success('Trade added successfully!');
    navigate('/');
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Add New Trade</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date and Symbol */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="symbol">Symbol *</Label>
                <Input
                  id="symbol"
                  type="text"
                  placeholder="e.g., AAPL, SPY"
                  value={formData.symbol}
                  onChange={(e) => handleChange('symbol', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Direction */}
            <div>
              <Label htmlFor="direction">Direction *</Label>
              <Select
                value={formData.direction}
                onValueChange={(value) => handleChange('direction', value)}
              >
                <SelectTrigger id="direction">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="long">Long</SelectItem>
                  <SelectItem value="short">Short</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Entry, Exit, Shares */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="entryPrice">Entry Price *</Label>
                <Input
                  id="entryPrice"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.entryPrice}
                  onChange={(e) => handleChange('entryPrice', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="exitPrice">Exit Price *</Label>
                <Input
                  id="exitPrice"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.exitPrice}
                  onChange={(e) => handleChange('exitPrice', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="shares">Shares/Contracts *</Label>
                <Input
                  id="shares"
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={formData.shares}
                  onChange={(e) => handleChange('shares', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Strategy */}
            <div>
              <Label htmlFor="strategy">Strategy</Label>
              <Input
                id="strategy"
                type="text"
                placeholder="e.g., Breakout, Reversal, Scalping"
                value={formData.strategy}
                onChange={(e) => handleChange('strategy', e.target.value)}
              />
            </div>

            {/* Setup Image Upload */}
            <div>
              <Label htmlFor="setupImage">Trade Setup Screenshot</Label>
              <div className="mt-2">
                {!setupImage ? (
                  <label
                    htmlFor="setupImage"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Click to upload setup image</span>
                    <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</span>
                    <Input
                      id="setupImage"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="relative">
                    <img
                      src={setupImage}
                      alt="Trade setup"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={removeImage}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this trade..."
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={4}
              />
            </div>

            {/* Buttons */}
            <div className="flex space-x-3">
              <Button type="submit" className="flex-1">
                Add Trade
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}