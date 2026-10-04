'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@/context/LanguageContext';
import api from '@/lib/api';

export default function MarketPriceSection({ district, bedrooms, bathrooms, area, amenities, actualPrice }: {
  district: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  amenities: string[];
  actualPrice: string;
}) {
  const { t } = useTranslation();

  const { data: predData, isLoading: predLoading } = useQuery({
    queryKey: ['detail-prediction', district, bedrooms, bathrooms, area, amenities?.join(',')],
    queryFn: async () => {
      const { data } = await api.post('/ai/predict-price', { district, bedrooms, bathrooms, area, amenities: amenities || [] });
      return data.prediction as {
        predictedPriceEth: number;
        predictedPriceUsd: number;
        predictedPriceRwf: number;
        confidence: number;
        comparableCount: number;
        aiAdjusted: boolean;
        source: string;
      };
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const { data: trendData } = useQuery({
    queryKey: ['market-trend', district],
    queryFn: async () => {
      const { data } = await api.get(`/ai/market-trends/${district}`);
      return data.trends as {
        avgPrice: number;
        minPrice: number;
        maxPrice: number;
        bookingCount: number;
        totalRevenue: number;
        trend: string;
        prediction: string;
      };
    },
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  if (predLoading) return <p className="text-sm text-gray-400 animate-pulse">Analyzing market data...</p>;

  if (!predData || !predData.comparableCount) {
    return <p className="text-sm text-gray-400">Not enough data to analyze pricing for {district} yet. List your property to help build the market.</p>;
  }

  const actual = parseFloat(actualPrice);
  const predicted = Number(predData.predictedPriceEth);
  if (isNaN(predicted)) {
    return <p className="text-sm text-gray-400">Unable to calculate market price estimate right now.</p>;
  }
  const rangeLow = predicted * 0.85;
  const rangeHigh = predicted * 1.15;
  const pctDiff = ((actual - predicted) / predicted * 100);
  const inRange = actual >= rangeLow && actual <= rangeHigh;

  return (
    <div className="space-y-4">
      {/* Price Comparison */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-500">Listed Price</p>
          <p className="text-lg font-bold text-gray-900">{actual.toFixed(4)} ETH</p>
        </div>
        <div className="bg-indigo-50 rounded-xl p-3">
          <p className="text-xs text-gray-500">AI Estimated Market Price</p>
          <p className="text-lg font-bold text-indigo-700">{predicted.toFixed(4)} ETH</p>
          {predData.confidence !== undefined && (
            <div className="flex items-center gap-1 mt-1">
              <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, predData.confidence * 100)}%` }} />
              </div>
              <span className="text-[10px] text-gray-400">{(predData.confidence * 100).toFixed(0)}% confidence</span>
            </div>
          )}
        </div>
      </div>

      {/* Fair Range Bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Cheaper ({rangeLow.toFixed(4)} ETH)</span>
          <span>Pricier ({rangeHigh.toFixed(4)} ETH)</span>
        </div>
        <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="absolute inset-y-0 left-0 bg-green-300 rounded-full" style={{ width: '15%' }} />
          <div className="absolute inset-y-0 bg-green-500 rounded-full" style={{ left: '15%', width: '70%' }} />
          <div className="absolute inset-y-0 right-0 bg-amber-300 rounded-full" style={{ width: '15%' }} />
          {inRange && (
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-indigo-600 rounded-full shadow"
              style={{ left: `${Math.max(5, Math.min(85, 15 + ((actual - rangeLow) / (rangeHigh - rangeLow)) * 70))}%` }}
            />
          )}
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className={`font-medium ${actual < rangeLow ? 'text-blue-600' : 'text-gray-400'}`}>Great Deal</span>
          <span className={`font-medium ${inRange ? 'text-green-600' : 'text-gray-400'}`}>Fair Range</span>
          <span className={`font-medium ${actual > rangeHigh ? 'text-amber-600' : 'text-gray-400'}`}>Above Market</span>
        </div>
      </div>

      <div className={`text-sm px-3 py-2 rounded-lg ${inRange ? 'bg-green-50 text-green-700' : actual < rangeLow ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
        {inRange
          ? `This property is priced within market range (${pctDiff > 0 ? '+' : ''}${pctDiff.toFixed(0)}% vs. average).`
          : actual < rangeLow
            ? `This property is ${Math.abs(pctDiff).toFixed(0)}% below market average — a great deal!`
            : `This property is ${Math.abs(pctDiff).toFixed(0)}% above market average.`}
      </div>

      <p className="text-xs text-gray-400">
        Based on {predData.comparableCount} comparable {predData.comparableCount === 1 ? 'property' : 'properties'} in {district}.
        {predData.aiAdjusted ? ' AI-adjusted.' : ''}
      </p>

      {/* Market Trends */}
      {trendData && (() => {
        const avgPrice = Number(trendData.avgPrice);
        const minPrice = Number(trendData.minPrice);
        const maxPrice = Number(trendData.maxPrice);
        return (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm font-semibold text-gray-700 mb-2">{district} Market Overview</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-xs text-gray-500">Avg Price</p>
              <p className="text-sm font-bold text-gray-900">{avgPrice.toFixed(4)} ETH</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Range</p>
              <p className="text-sm font-bold text-gray-900">{minPrice.toFixed(4)} - {maxPrice.toFixed(4)} ETH</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Bookings</p>
              <p className="text-sm font-bold text-gray-900">{trendData.bookingCount}</p>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            <span className="font-medium">Trend:</span> {trendData.trend}
          </div>
        </div>
        );
      })()}
    </div>
  );
}
