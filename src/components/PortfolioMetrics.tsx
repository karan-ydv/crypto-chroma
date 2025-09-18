import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Activity, Target, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PortfolioMetrics as PortfolioMetricsType, PortfolioAsset } from '@/types/crypto';

interface PortfolioMetricsProps {
  assets: PortfolioAsset[];
  totalPortfolioValue: number;
  metrics: PortfolioMetricsType | null;
}

export const PortfolioMetrics: React.FC<PortfolioMetricsProps> = ({
  assets,
  totalPortfolioValue,
  metrics,
}) => {
  const totalAllocation = assets.reduce((sum, asset) => sum + asset.allocation, 0);
  const hasUnbalancedAllocation = Math.abs(totalAllocation - 100) > 0.1;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number, showSign: boolean = true) => {
    const sign = showSign && value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const getReturnColor = (value: number) => {
    if (value > 0) return 'text-success';
    if (value < 0) return 'text-destructive';
    return 'text-muted-foreground';
  };

  const getRiskLevel = (volatility: number) => {
    if (volatility < 20) return { level: 'Low', color: 'text-success', bg: 'bg-success/10' };
    if (volatility < 40) return { level: 'Medium', color: 'text-warning', bg: 'bg-warning/10' };
    return { level: 'High', color: 'text-destructive', bg: 'bg-destructive/10' };
  };

  const riskData = metrics ? getRiskLevel(metrics.volatility) : null;

  return (
    <div className="space-y-6">
      {/* Allocation Warning */}
      {hasUnbalancedAllocation && (
        <Card className="border-warning/50 bg-warning/5">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <div>
                <div className="font-medium text-warning">Allocation Imbalance</div>
                <div className="text-sm text-muted-foreground">
                  Total allocation: {totalAllocation.toFixed(1)}% (should be 100%)
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Portfolio Value */}
        <Card className="gradient-card border-border/50">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Portfolio Value</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(totalPortfolioValue)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>
        </Card>

        {/* Total Return */}
        <Card className="gradient-card border-border/50">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Return</p>
                <p className={`text-2xl font-bold ${getReturnColor(metrics?.totalReturn || 0)}`}>
                  {metrics ? formatCurrency(metrics.totalReturn) : '--'}
                </p>
                <p className={`text-sm ${getReturnColor(metrics?.totalReturnPercentage || 0)}`}>
                  {metrics ? formatPercentage(metrics.totalReturnPercentage) : '--'}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${(metrics?.totalReturn || 0) >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                {(metrics?.totalReturn || 0) >= 0 ? 
                  <TrendingUp className="h-6 w-6 text-success" /> : 
                  <TrendingDown className="h-6 w-6 text-destructive" />
                }
              </div>
            </div>
          </div>
        </Card>

        {/* Risk/Volatility */}
        <Card className="gradient-card border-border/50">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Volatility</p>
                <p className="text-2xl font-bold">
                  {metrics ? `${metrics.volatility.toFixed(1)}%` : '--'}
                </p>
                {riskData && (
                  <Badge variant="secondary" className={`${riskData.bg} ${riskData.color} border-0`}>
                    {riskData.level} Risk
                  </Badge>
                )}
              </div>
              <div className="p-3 rounded-lg bg-secondary/10">
                <Activity className="h-6 w-6 text-secondary-foreground" />
              </div>
            </div>
          </div>
        </Card>

        {/* Number of Assets */}
        <Card className="gradient-card border-border/50">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Assets</p>
                <p className="text-2xl font-bold">{assets.length}</p>
                <p className="text-sm text-muted-foreground">
                  {assets.filter(a => a.allocation > 0).length} allocated
                </p>
              </div>
              <div className="p-3 rounded-lg bg-accent/10">
                <Target className="h-6 w-6 text-accent" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Top Performers */}
      {assets.length > 0 && (
        <Card className="gradient-card border-border/50">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Top Performers (24h)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Best Performer */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-success">Best Performer</h4>
                {(() => {
                  const best = assets
                    .filter(asset => asset.allocation > 0)
                    .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)[0];
                  
                  return best ? (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-success/5 border border-success/20">
                      <img src={best.image} alt={best.symbol} className="w-8 h-8 rounded-full" />
                      <div className="flex-1">
                        <div className="font-medium">{best.symbol.toUpperCase()}</div>
                        <div className="text-sm text-muted-foreground">{best.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm">{formatCurrency(best.current_price)}</div>
                        <div className="text-sm text-success font-medium">
                          +{best.price_change_percentage_24h.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">No assets allocated</div>
                  );
                })()}
              </div>

              {/* Worst Performer */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-destructive">Worst Performer</h4>
                {(() => {
                  const worst = assets
                    .filter(asset => asset.allocation > 0)
                    .sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h)[0];
                  
                  return worst ? (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                      <img src={worst.image} alt={worst.symbol} className="w-8 h-8 rounded-full" />
                      <div className="flex-1">
                        <div className="font-medium">{worst.symbol.toUpperCase()}</div>
                        <div className="text-sm text-muted-foreground">{worst.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm">{formatCurrency(worst.current_price)}</div>
                        <div className="text-sm text-destructive font-medium">
                          {worst.price_change_percentage_24h.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">No assets allocated</div>
                  );
                })()}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};