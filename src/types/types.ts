export interface CoinPrice {
    id: string;
    symbol: string;
    name: string;
    current_price: number;
  }
  
  export interface CoinGeckoResponse {
    [key: string]: {
      usd: number;
      eur?: number;
      rub?: number;
    };
  }
  
  export interface CacheData {
    data: any;
    timestamp: number;
  }
  
  export interface PriceResponse {
    success: boolean;
    data?: CoinPrice[];
    error?: string;
  }