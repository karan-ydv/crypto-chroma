import { CryptoAsset, PortfolioAsset, PortfolioMetrics, ChartDataPoint, TimeRange } from '@/types/crypto';

export const calculatePortfolioMetrics = (
  assets: PortfolioAsset[],
  totalPortfolioValue: number
): PortfolioMetrics => {
  if (assets.length === 0) {
    return {
      totalValue: 0,
      totalReturn: 0,
      totalReturnPercentage: 0,
      volatility: 0,
    };
  }

  // Calculate weighted average return (24h)
  const totalWeightedReturn = assets.reduce((sum, asset) => {
    const weight = asset.allocation / 100;
    return sum + (asset.price_change_percentage_24h * weight);
  }, 0);

  // Calculate volatility (simplified - using 24h change as proxy)
  const returns = assets.map(asset => asset.price_change_percentage_24h);
  const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance);

  // Estimate total return in dollars (simplified calculation)
  const totalReturn = (totalWeightedReturn / 100) * totalPortfolioValue;

  return {
    totalValue: totalPortfolioValue,
    totalReturn,
    totalReturnPercentage: totalWeightedReturn,
    volatility,
  };
};

export const createPortfolioAssets = (
  assets: CryptoAsset[],
  allocations: Record<string, number>,
  totalPortfolioValue: number
): PortfolioAsset[] => {
  return assets.map(asset => {
    const allocation = allocations[asset.id] || 0;
    const value = (allocation / 100) * totalPortfolioValue;
    
    return {
      ...asset,
      allocation,
      value,
    };
  });
};

export const combineChartData = (
  assetsData: Array<{ id: string; prices: [number, number][] }>,
  assets: Array<{ id: string; symbol: string; name: string }>
): ChartDataPoint[] => {
  if (!assetsData.length || !assetsData[0]?.prices.length) return [];

  // Get all timestamps from the first asset (assuming all have same timestamps)
  const timestamps = assetsData[0].prices.map(([timestamp]) => timestamp);

  return timestamps.map(timestamp => {
    const dataPoint: ChartDataPoint = {
      timestamp,
      date: new Date(timestamp).toISOString(),
    };

    // Add price data for each asset
    assetsData.forEach(assetData => {
      const priceEntry = assetData.prices.find(([ts]) => ts === timestamp);
      if (priceEntry) {
        dataPoint[assetData.id] = priceEntry[1];
      }
    });

    return dataPoint;
  });
};

export const getChartColors = (assets: Array<{ id: string; name: string; symbol: string }>): Array<{ id: string; name: string; symbol: string; color: string }> => {
  const colors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ];

  return assets.map((asset, index) => ({
    ...asset,
    color: colors[index % colors.length],
  }));
};

export const sortAssets = (
  assets: PortfolioAsset[],
  sortBy: 'name' | 'price' | 'change_24h' | 'change_7d' | 'market_cap',
  sortOrder: 'asc' | 'desc'
): PortfolioAsset[] => {
  return [...assets].sort((a, b) => {
    let valueA: number | string;
    let valueB: number | string;

    switch (sortBy) {
      case 'name':
        valueA = a.name.toLowerCase();
        valueB = b.name.toLowerCase();
        break;
      case 'price':
        valueA = a.current_price;
        valueB = b.current_price;
        break;
      case 'change_24h':
        valueA = a.price_change_percentage_24h;
        valueB = b.price_change_percentage_24h;
        break;
      case 'change_7d':
        valueA = a.price_change_percentage_7d_in_currency || 0;
        valueB = b.price_change_percentage_7d_in_currency || 0;
        break;
      case 'market_cap':
        valueA = a.market_cap;
        valueB = b.market_cap;
        break;
      default:
        return 0;
    }

    if (typeof valueA === 'string' && typeof valueB === 'string') {
      const comparison = valueA.localeCompare(valueB);
      return sortOrder === 'asc' ? comparison : -comparison;
    }

    const comparison = (valueA as number) - (valueB as number);
    return sortOrder === 'asc' ? comparison : -comparison;
  });
};