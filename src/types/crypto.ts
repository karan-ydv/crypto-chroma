export interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency: number;
  market_cap: number;
  image: string;
  sparkline_in_7d?: {
    price: number[];
  };
}

export interface PriceHistory {
  prices: [number, number][];
}

export interface PortfolioAsset extends CryptoAsset {
  allocation: number; // percentage
  value: number; // allocation * total portfolio value
}

export interface PortfolioMetrics {
  totalValue: number;
  totalReturn: number;
  totalReturnPercentage: number;
  volatility: number;
}

export type TimeRange = '1D' | '7D' | '30D' | '90D' | '1Y';

export interface ChartDataPoint {
  timestamp: number;
  date: string;
  [key: string]: number | string; // For dynamic asset prices
}