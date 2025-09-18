import { CryptoAsset, PortfolioAsset, PortfolioMetrics, ChartDataPoint, TimeRange } from '@/types/crypto';

export const calculatePortfolioMetrics = (
  assets: PortfolioAsset[],
  totalPortfolioValue: number,
  chartData?: ChartDataPoint[],
  timeRange?: TimeRange
): PortfolioMetrics => {
  if (assets.length === 0) {
    return {
      totalValue: 0,
      totalReturn: 0,
      totalReturnPercentage: 0,
      volatility: 0,
    };
  }

  let totalWeightedReturn = 0;
  let returns: number[] = [];

  // If we have chart data, calculate returns from historical data
  if (chartData && chartData.length > 1 && timeRange) {
    const firstDataPoint = chartData[0];
    const lastDataPoint = chartData[chartData.length - 1];
    
    let portfolioStartValue = 0;
    let portfolioEndValue = 0;
    
    assets.forEach(asset => {
      const weight = asset.allocation / 100;
      const startPrice = firstDataPoint[asset.id] as number || 0;
      const endPrice = lastDataPoint[asset.id] as number || 0;
      
      if (startPrice > 0) {
        const assetReturn = ((endPrice - startPrice) / startPrice) * 100;
        totalWeightedReturn += assetReturn * weight;
        returns.push(assetReturn);
        
        portfolioStartValue += startPrice * weight * totalPortfolioValue / asset.current_price;
        portfolioEndValue += endPrice * weight * totalPortfolioValue / asset.current_price;
      }
    });
  } else {
    // Fallback to 24h data
    totalWeightedReturn = assets.reduce((sum, asset) => {
      const weight = asset.allocation / 100;
      return sum + (asset.price_change_percentage_24h * weight);
    }, 0);
    
    returns = assets.map(asset => asset.price_change_percentage_24h);
  }

  // Calculate volatility
  const avgReturn = returns.length > 0 ? returns.reduce((sum, ret) => sum + ret, 0) / returns.length : 0;
  const variance = returns.length > 0 ? returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length : 0;
  const volatility = Math.sqrt(variance);

  // Calculate total return in dollars
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
  assets: Array<{ id: string; symbol: string; name: string }>,
  portfolioAssets?: PortfolioAsset[]
): ChartDataPoint[] => {
  if (!assetsData.length || !assetsData[0]?.prices.length) return [];

  // Get all timestamps from the first asset (assuming all have same timestamps)
  const timestamps = assetsData[0].prices.map(([timestamp]) => timestamp);

  return timestamps.map(timestamp => {
    const dataPoint: ChartDataPoint = {
      timestamp,
      date: new Date(timestamp).toISOString(),
    };

    let portfolioValue = 0;

    // Add price data for each asset
    assetsData.forEach(assetData => {
      const priceEntry = assetData.prices.find(([ts]) => ts === timestamp);
      if (priceEntry) {
        dataPoint[assetData.id] = priceEntry[1];
        
        // Calculate portfolio value if we have allocation data
        if (portfolioAssets) {
          const portfolioAsset = portfolioAssets.find(pa => pa.id === assetData.id);
          if (portfolioAsset && portfolioAsset.allocation > 0) {
            const weight = portfolioAsset.allocation / 100;
            const assetValue = priceEntry[1] * weight * portfolioAsset.value / portfolioAsset.current_price;
            portfolioValue += assetValue;
          }
        }
      }
    });

    // Add combined portfolio value
    if (portfolioAssets && portfolioValue > 0) {
      dataPoint.portfolioValue = portfolioValue;
    }

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