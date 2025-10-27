import axios from 'axios';
import { CoinPrice, PriceResponse } from '../types/types';

const BASE_URL = 'https://api.coingecko.com/api/v3';

export class CoinGeckoAPI {
  private static instance: CoinGeckoAPI;
  private requestCount: number = 0;
  private lastUpdate: Date | null = null;

  private constructor() {}

  public static getInstance(): CoinGeckoAPI {
    if (!CoinGeckoAPI.instance) {
      CoinGeckoAPI.instance = new CoinGeckoAPI();
    }
    return CoinGeckoAPI.instance;
  }

  private logRequest(): void {
    this.requestCount++;
    this.lastUpdate = new Date();
    console.log(`Request #${this.requestCount} at ${this.lastUpdate.toISOString()}`);
  }

  public getStats(): { requestCount: number; lastUpdate: Date | null } {
    return {
      requestCount: this.requestCount,
      lastUpdate: this.lastUpdate
    };
  }

  async getPrices(coinIds: string[], currency: string = 'usd'): Promise<PriceResponse> {
    try {
      this.logRequest();

      const response = await axios.get(`${BASE_URL}/coins/markets`, {
        params: {
          vs_currency: currency,
          ids: coinIds.join(','),
          price_change_percentage: '24h'
        },
        timeout: 10000
      });

      const coins: CoinPrice[] = response.data.map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        current_price: coin.current_price
      }));

      return { success: true, data: coins };
    } catch (error) {
      console.error('CoinGecko API error:', error);

      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          return { success: false, error: 'Request timeout' };
        }
        if (error.response?.status === 429) {
          return { success: false, error: 'Rate limit exceeded. Please try again later.' };
        }
      }

      return { success: false, error: 'Failed to fetch prices from CoinGecko API' };
    }
  }
}