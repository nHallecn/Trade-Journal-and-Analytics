import { Trade } from '../types/trade';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface TradeCalendarProps {
  trades: Trade[];
}

interface DayData {
  date: Date;
  profitLoss: number;
  trades: Trade[];
  isCurrentMonth: boolean;
}

export function TradeCalendar({ trades }: TradeCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date: Date): DayData[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const startingDayOfWeek = firstDay.getDay();
    
    const days: DayData[] = [];
    
    // Add previous month's days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date,
        profitLoss: 0,
        trades: [],
        isCurrentMonth: false,
      });
    }
    
    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const dayTrades = trades.filter(t => t.date === dateStr);
      const profitLoss = dayTrades.reduce((sum, t) => sum + t.profitLoss, 0);
      
      days.push({
        date,
        profitLoss,
        trades: dayTrades,
        isCurrentMonth: true,
      });
    }
    
    // Add next month's days to complete the grid
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        profitLoss: 0,
        trades: [],
        isCurrentMonth: false,
      });
    }
    
    return days;
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const days = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">{monthName}</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={previousMonth}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Week days */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const hasTradeData = day.trades.length > 0;
          const isProfit = day.profitLoss > 0;
          const isLoss = day.profitLoss < 0;
          
          return (
            <div
              key={index}
              className={`
                aspect-square p-1 rounded-lg border transition-all
                ${!day.isCurrentMonth ? 'opacity-30' : ''}
                ${hasTradeData && isProfit ? 'bg-green-100 border-green-300' : ''}
                ${hasTradeData && isLoss ? 'bg-red-100 border-red-300' : ''}
                ${!hasTradeData ? 'bg-white border-gray-200' : ''}
                ${hasTradeData ? 'cursor-pointer hover:shadow-md' : ''}
              `}
            >
              <div className="h-full flex flex-col">
                <div className={`text-xs ${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                  {day.date.getDate()}
                </div>
                {hasTradeData && (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <div className={`text-xs font-semibold ${isProfit ? 'text-green-700' : 'text-red-700'}`}>
                      ${Math.abs(day.profitLoss).toFixed(0)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {day.trades.length} trade{day.trades.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
