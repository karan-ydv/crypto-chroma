import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { PortfolioAsset } from '@/types/crypto';

interface PortfolioChartsProps {
  assets: PortfolioAsset[];
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export const PortfolioCharts: React.FC<PortfolioChartsProps> = ({ assets }) => {
  const pieData = assets
    .filter(asset => asset.allocation > 0)
    .map((asset, index) => ({
      name: asset.symbol.toUpperCase(),
      value: asset.allocation,
      color: COLORS[index % COLORS.length],
      fullName: asset.name,
      portfolioValue: asset.value,
    }));

  const barData = assets
    .filter(asset => asset.allocation > 0)
    .sort((a, b) => b.value - a.value)
    .map((asset, index) => ({
      name: asset.symbol.toUpperCase(),
      value: asset.value,
      allocation: asset.allocation,
      color: COLORS[index % COLORS.length],
    }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card/95 border border-border/50 rounded-lg p-3 shadow-lg backdrop-blur-sm">
          <p className="font-medium">{data.fullName || data.name}</p>
          <p className="text-success">
            Value: ${data.portfolioValue?.toLocaleString() || data.value?.toLocaleString()}
          </p>
          <p className="text-primary">
            Allocation: {data.value || data.allocation}%
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Don't show labels for slices < 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (assets.length === 0 || pieData.length === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="gradient-card border-border/50">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Portfolio Allocation</h3>
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <div className="text-lg mb-2">No allocation data</div>
                <div className="text-sm">Set allocation percentages to view charts</div>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="gradient-card border-border/50">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Asset Distribution</h3>
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <div className="text-lg mb-2">No distribution data</div>
                <div className="text-sm">Set allocation percentages to view charts</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Pie Chart */}
      <Card className="gradient-card border-border/50">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Portfolio Allocation</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={CustomLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            {pieData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm font-medium">{entry.name}</span>
                <span className="text-sm text-muted-foreground ml-auto">
                  {entry.value.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Bar Chart */}
      <Card className="gradient-card border-border/50">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Asset Distribution by Value</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>
    </div>
  );
};