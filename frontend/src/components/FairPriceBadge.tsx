'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function FairPriceBadge({ district, bedrooms, bathrooms, area, amenities, actualPrice }: {
  district: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  amenities: string[] | string;
  actualPrice: string;
}) {
  const parsed: string[] = Array.isArray(amenities)
    ? amenities
    : typeof amenities === 'string'
      ? (() => { try { return JSON.parse(amenities); } catch { return []; } })()
      : [];
  const { data, isLoading } = useQuery({
    queryKey: ['fair-price', district, bedrooms, bathrooms, area, ...parsed],
    queryFn: async () => {
      const { data } = await api.post('/ai/predict-price', { district, bedrooms, bathrooms, area, amenities: parsed });
      return data.prediction as { predictedPriceEth: string; confidence: number; comparableCount: number };
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  if (isLoading) return <span className="text-[10px] text-gray-400">Checking price...</span>;
  if (!data || !data.comparableCount) return null;

  const actual = parseFloat(actualPrice);
  const predicted = parseFloat(data.predictedPriceEth);
  const rangeLow = predicted * 0.85;
  const rangeHigh = predicted * 1.15;
  const withinRange = actual >= rangeLow && actual <= rangeHigh;
  const pctOff = ((actual - predicted) / predicted * 100);

  let color: string;
  let label: string;
  if (withinRange) {
    color = 'text-green-700 bg-green-50 border-green-200';
    label = 'Fair Price';
  } else if (actual < rangeLow) {
    color = 'text-blue-700 bg-blue-50 border-blue-200';
    label = 'Great Deal';
  } else {
    color = 'text-amber-700 bg-amber-50 border-amber-200';
    label = 'Above Market';
  }

  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${color}`} title={`Market avg: ${predicted.toFixed(4)} ETH (${pctOff > 0 ? '+' : ''}${pctOff.toFixed(0)}% vs listing)`}>
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
      {label}
    </span>
  );
}
