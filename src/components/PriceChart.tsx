import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TimeRange, ChartDataPoint } from '@/types/crypto';

interface PriceChartProps {
  data: ChartDataPoint[];
  assets: Array<{ id: string; name: string; symbol: string; color: string }>;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  isLoading: boolean;
}

const timeRanges: TimeRange[] = ['1D', '7D', '30D', '90D', '1Y'];

export const PriceChart: React.FC<PriceChartProps> = ({
  data,
  assets,
  timeRange,
  onTimeRangeChange,
  isLoading,
}) => {
  const formatPrice = (value: number) => {
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    if (value >= 1) return `$${value.toFixed(2)}`;
    return `$${value.toFixed(4)}`;
  };

  const formatDate = (value: string) => {
    const date = new Date(value);
    switch (timeRange) {
      case '1D':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case '7D':
      case '30D':
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      case '90D':
      case '1Y':
        return date.toLocaleDateString([], { month: 'short', year: '2-digit' });
      default:
        return date.toLocaleDateString();
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/95 border border-border/50 rounded-lg p-3 shadow-lg backdrop-blur-sm">
          <p className="text-sm text-muted-foreground mb-2">
            {new Date(label).toLocaleString()}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
              {entry.name}: {formatPrice(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="gradient-card border-border/50">
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
          <h3 className="text-lg font-semibold mb-4 sm:mb-0">Price History</h3>
          <div className="flex flex-wrap gap-2">
            {timeRanges.map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => onTimeRangeChange(range)}
                className={timeRange === range ? "gradient-primary text-primary-foreground" : ""}
              >
                {range}
              </Button>
            ))}
          </div>
        </div>

        <div className="h-80">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-muted-foreground">Loading chart data...</div>
            </div>
          ) : data.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <div className="text-lg mb-2">No data available</div>
                <div className="text-sm">Select assets to view price history</div>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="date"
                  tickFormatter={formatDate}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  tickFormatter={formatPrice}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {assets.map((asset) => (
                  <Line
                    key={asset.id}
                    type="monotone"
                    dataKey={asset.id}
                    stroke={asset.color}
                    strokeWidth={2}
                    dot={false}
                    name={asset.symbol.toUpperCase()}
                    connectNulls={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </Card>
  );
};