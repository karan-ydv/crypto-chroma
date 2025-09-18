import { CryptoAsset, PriceHistory, TimeRange } from '@/types/crypto';

const BASE_URL = 'https://api.coingecko.com/api/v3';

class CryptoApiService {
  async getTopCryptos(limit: number = 100): Promise<CryptoAsset[]> {
    try {
      const response = await fetch(
        `${BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=true&price_change_percentage=1h,24h,7d`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching crypto data:', error);
      throw error;
    }
  }

  async searchCryptos(query: string): Promise<{ coins: Array<{ id: string; name: string; symbol: string; thumb: string }> }> {
    try {
      const response = await fetch(`${BASE_URL}/search?query=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error searching cryptos:', error);
      throw error;
    }
  }

  async getPriceHistory(coinId: string, days: number): Promise<PriceHistory> {
    try {
      const response = await fetch(
        `${BASE_URL}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=${days <= 1 ? 'hourly' : 'daily'}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching price history:', error);
      throw error;
    }
  }

  async getAssetsByIds(ids: string[]): Promise<CryptoAsset[]> {
    if (ids.length === 0) return [];
    
    try {
      const response = await fetch(
        `${BASE_URL}/coins/markets?vs_currency=usd&ids=${ids.join(',')}&order=market_cap_desc&sparkline=true&price_change_percentage=1h,24h,7d`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching assets by IDs:', error);
      throw error;
    }
  }

  getTimeRangeDays(range: TimeRange): number {
    switch (range) {
      case '1D': return 1;
      case '7D': return 7;
      case '30D': return 30;
      case '90D': return 90;
      case '1Y': return 365;
      default: return 7;
    }
  }
}

export const cryptoApi = new CryptoApiService();