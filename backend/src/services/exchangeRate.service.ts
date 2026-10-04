import https from 'https';

export interface ExchangeRates {
  ETH_USD: number;
  USD_RWF: number;
  fetchedAt: Date;
}

// Hardcoded fallback rates used when APIs are unreachable and no cache exists
const FALLBACK_RATES: ExchangeRates = {
  ETH_USD: 3000,
  USD_RWF: 1300,
  fetchedAt: new Date(0),
};

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export class ExchangeRateClient {
  private static cache: ExchangeRates | null = null;

  static async getRates(): Promise<ExchangeRates> {
    // Return cached rates if still fresh
    if (ExchangeRateClient.cache && Date.now() - ExchangeRateClient.cache.fetchedAt.getTime() < CACHE_TTL_MS) {
      return ExchangeRateClient.cache;
    }

    try {
      const [ethUsd, usdRwf] = await Promise.all([
        ExchangeRateClient.fetchEthUsd(),
        ExchangeRateClient.fetchUsdRwf(),
      ]);

      const rates: ExchangeRates = { ETH_USD: ethUsd, USD_RWF: usdRwf, fetchedAt: new Date() };
      ExchangeRateClient.cache = rates;
      return rates;
    } catch (err) {
      console.warn('[ExchangeRateClient] Failed to fetch live rates:', err);
      if (ExchangeRateClient.cache) {
        return ExchangeRateClient.cache;
      }
      console.warn('[ExchangeRateClient] No cache available, using fallback rates');
      return FALLBACK_RATES;
    }
  }

  private static fetchEthUsd(): Promise<number> {
    return new Promise((resolve, reject) => {
      const url = 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd';
      https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            const rate = parsed?.ethereum?.usd;
            if (typeof rate !== 'number' || rate <= 0) throw new Error('Invalid ETH/USD rate');
            resolve(rate);
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });
  }

  private static fetchUsdRwf(): Promise<number> {
    return new Promise((resolve, reject) => {
      const apiKey = process.env.EXCHANGE_RATE_API_KEY;
      const url = apiKey
        ? `https://v6.exchangerate-api.com/v6/${apiKey}/pair/USD/RWF`
        : 'https://open.er-api.com/v6/latest/USD';

      https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            // exchangerate-api.com format
            const rate = parsed?.conversion_rate ?? parsed?.rates?.RWF;
            if (typeof rate !== 'number' || rate <= 0) throw new Error('Invalid USD/RWF rate');
            resolve(rate);
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });
  }

  /** Reset cache — useful for testing */
  static resetCache(): void {
    ExchangeRateClient.cache = null;
  }
}
