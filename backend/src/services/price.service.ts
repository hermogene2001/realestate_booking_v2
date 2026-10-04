interface PriceData {
  eth_usd: number;
  eth_rwf: number;
  updated_at: string;
}

let cachedPrice: PriceData | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export class PriceService {
  static async getEthPrice(): Promise<PriceData> {
    if (cachedPrice && Date.now() - cacheTime < CACHE_TTL) {
      return cachedPrice;
    }

    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
      );
      const data = await response.json() as { ethereum?: { usd?: number } };
      const ethUsd = data.ethereum?.usd || 0;

      // RWF conversion (approximate rate: 1 USD = ~1350 RWF)
      const usdToRwf = 1350;

      cachedPrice = {
        eth_usd: ethUsd,
        eth_rwf: ethUsd * usdToRwf,
        updated_at: new Date().toISOString(),
      };
      cacheTime = Date.now();

      return cachedPrice;
    } catch {
      // Return fallback if API fails
      if (cachedPrice) return cachedPrice;
      return {
        eth_usd: 3000,
        eth_rwf: 3000 * 1350,
        updated_at: new Date().toISOString(),
      };
    }
  }
}
