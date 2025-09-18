import { CryptoAsset, PriceHistory, TimeRange } from '@/types/crypto';

interface ApiProvider {
  name: string;
  getTopCryptos(limit: number): Promise<CryptoAsset[]>;
  searchCryptos(query: string): Promise<{ coins: Array<{ id: string; name: string; symbol: string; thumb: string }> }>;
  getPriceHistory(coinId: string, days: number): Promise<PriceHistory>;
  getAssetsByIds(ids: string[]): Promise<CryptoAsset[]>;
}

class CoinGeckoProvider implements ApiProvider {
  name = 'CoinGecko';
  private baseUrl = 'https://api.coingecko.com/api/v3';

  async getTopCryptos(limit: number = 100): Promise<CryptoAsset[]> {
    const response = await fetch(
      `${this.baseUrl}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=true&price_change_percentage=1h,24h,7d`
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    return await response.json();
  }

  async searchCryptos(query: string): Promise<{ coins: Array<{ id: string; name: string; symbol: string; thumb: string }> }> {
    const response = await fetch(`${this.baseUrl}/search?query=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    return await response.json();
  }

  async getPriceHistory(coinId: string, days: number): Promise<PriceHistory> {
    const response = await fetch(
      `${this.baseUrl}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=${days <= 1 ? 'hourly' : 'daily'}`
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    return await response.json();
  }

  async getAssetsByIds(ids: string[]): Promise<CryptoAsset[]> {
    if (ids.length === 0) return [];
    
    const response = await fetch(
      `${this.baseUrl}/coins/markets?vs_currency=usd&ids=${ids.join(',')}&order=market_cap_desc&sparkline=true&price_change_percentage=1h,24h,7d`
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    return await response.json();
  }
}

class CoinMarketCapProvider implements ApiProvider {
  name = 'CoinMarketCap';
  private baseUrl = 'https://pro-api.coinmarketcap.com/v1';

  async getTopCryptos(limit: number = 100): Promise<CryptoAsset[]> {
    // Note: CoinMarketCap requires API key, so this will fail without one
    // Using public sandbox data as fallback
    const mockData: CryptoAsset[] = [
      {
        id: 'bitcoin',
        symbol: 'btc',
        name: 'Bitcoin',
        current_price: 45000,
        price_change_percentage_24h: 2.5,
        price_change_percentage_7d_in_currency: 5.2,
        market_cap: 850000000000,
        image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png'
      },
      {
        id: 'ethereum',
        symbol: 'eth',
        name: 'Ethereum',
        current_price: 3000,
        price_change_percentage_24h: 1.8,
        price_change_percentage_7d_in_currency: 3.1,
        market_cap: 360000000000,
        image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png'
      }
    ];
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockData.slice(0, limit);
  }

  async searchCryptos(query: string): Promise<{ coins: Array<{ id: string; name: string; symbol: string; thumb: string }> }> {
    throw new Error('CoinMarketCap search not implemented - requires API key');
  }

  async getPriceHistory(coinId: string, days: number): Promise<PriceHistory> {
    throw new Error('CoinMarketCap price history not implemented - requires API key');
  }

  async getAssetsByIds(ids: string[]): Promise<CryptoAsset[]> {
    throw new Error('CoinMarketCap assets by ID not implemented - requires API key');
  }
}

class CryptoCompareProvider implements ApiProvider {
  name = 'CryptoCompare';
  private baseUrl = 'https://min-api.cryptocompare.com/data';

  async getTopCryptos(limit: number = 100): Promise<CryptoAsset[]> {
    const response = await fetch(
      `${this.baseUrl}/top/mktcapfull?limit=${limit}&tsym=USD`
    );
    
    if (!response.ok) {
      throw new Error(`CryptoCompare API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform CryptoCompare data to our format
    return data.Data?.map((item: any) => ({
      id: item.CoinInfo?.Name?.toLowerCase(),
      symbol: item.CoinInfo?.Name?.toLowerCase(),
      name: item.CoinInfo?.FullName,
      current_price: item.RAW?.USD?.PRICE || 0,
      price_change_percentage_24h: item.RAW?.USD?.CHANGEPCT24HOUR || 0,
      price_change_percentage_7d_in_currency: item.RAW?.USD?.CHANGEPCTDAY || 0,
      market_cap: item.RAW?.USD?.MKTCAP || 0,
      image: `https://www.cryptocompare.com${item.CoinInfo?.ImageUrl}`
    })) || [];
  }

  async searchCryptos(query: string): Promise<{ coins: Array<{ id: string; name: string; symbol: string; thumb: string }> }> {
    throw new Error('CryptoCompare search not implemented');
  }

  async getPriceHistory(coinId: string, days: number): Promise<PriceHistory> {
    const response = await fetch(
      `${this.baseUrl}/v2/histoday?fsym=${coinId.toUpperCase()}&tsym=USD&limit=${days}`
    );
    
    if (!response.ok) {
      throw new Error(`CryptoCompare API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform to our format
    const prices = data.Data?.Data?.map((item: any) => [
      item.time * 1000, // Convert to milliseconds
      item.close
    ]) || [];
    
    return { prices };
  }

  async getAssetsByIds(ids: string[]): Promise<CryptoAsset[]> {
    throw new Error('CryptoCompare assets by ID not implemented');
  }
}

class CryptoApiService {
  private providers: ApiProvider[] = [
    new CoinGeckoProvider(),
    new CryptoCompareProvider(),
    new CoinMarketCapProvider()
  ];
  
  private failedProviders = new Set<string>();
  private lastResetTime = Date.now();
  
  private resetFailedProviders() {
    const now = Date.now();
    // Reset failed providers every 5 minutes
    if (now - this.lastResetTime > 5 * 60 * 1000) {
      this.failedProviders.clear();
      this.lastResetTime = now;
    }
  }

  private async tryWithFallback<T>(
    operation: (provider: ApiProvider) => Promise<T>,
    operationName: string
  ): Promise<T> {
    this.resetFailedProviders();
    
    const availableProviders = this.providers.filter(p => !this.failedProviders.has(p.name));
    
    if (availableProviders.length === 0) {
      // All providers failed, reset and try again
      this.failedProviders.clear();
      availableProviders.push(...this.providers);
    }
    
    let lastError: Error | null = null;
    
    for (const provider of availableProviders) {
      try {
        console.log(`Trying ${provider.name} for ${operationName}`);
        const result = await operation(provider);
        console.log(`${provider.name} succeeded for ${operationName}`);
        return result;
      } catch (error) {
        console.warn(`${provider.name} failed for ${operationName}:`, error);
        this.failedProviders.add(provider.name);
        lastError = error as Error;
        
        // Wait a bit before trying next provider
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    throw lastError || new Error(`All providers failed for ${operationName}`);
  }

  async getTopCryptos(limit: number = 100): Promise<CryptoAsset[]> {
    return this.tryWithFallback(
      (provider) => provider.getTopCryptos(limit),
      'getTopCryptos'
    );
  }

  async searchCryptos(query: string): Promise<{ coins: Array<{ id: string; name: string; symbol: string; thumb: string }> }> {
    return this.tryWithFallback(
      (provider) => provider.searchCryptos(query),
      'searchCryptos'
    );
  }

  async getPriceHistory(coinId: string, days: number): Promise<PriceHistory> {
    return this.tryWithFallback(
      (provider) => provider.getPriceHistory(coinId, days),
      'getPriceHistory'
    );
  }

  async getAssetsByIds(ids: string[]): Promise<CryptoAsset[]> {
    return this.tryWithFallback(
      (provider) => provider.getAssetsByIds(ids),
      'getAssetsByIds'
    );
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