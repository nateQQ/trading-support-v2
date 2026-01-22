import { MarketCoin } from '../types';

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false';

export const fetchTopCoins = async (): Promise<MarketCoin[]> => {
  try {
    const response = await fetch(COINGECKO_API_URL);
    if (!response.ok) {
      throw new Error(`Market data fetch failed: ${response.statusText}`);
    }
    const data = await response.json();
    return data as MarketCoin[];
  } catch (error) {
    console.error("Failed to fetch market data:", error);
    // Return empty array or throw depending on desired error handling
    return [];
  }
};