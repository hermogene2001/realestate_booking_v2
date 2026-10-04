'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

function StarRating({ average }: { average: number }) {
  const stars = Math.round(average / 100);
  return (
    <span className="text-yellow-500 text-sm">
      {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
    </span>
  );
}

export default function ReputationBadge({ userId, size = 'sm' }: { userId: number; size?: 'sm' | 'md' | 'lg' }) {
  const { data, isLoading } = useQuery({
    queryKey: ['reputation', userId],
    queryFn: async () => {
      const { data } = await api.get(`/reputation/user/${userId}`);
      return data.reputation as { average: number; count: number };
    },
  });

  if (isLoading) return <span className="text-xs text-gray-400">Loading...</span>;
  if (!data || data.count === 0) return <span className="text-xs text-gray-400">No ratings yet</span>;

  const sizeClass = size === 'lg' ? 'text-base' : 'text-xs';

  return (
    <span className={`inline-flex items-center gap-1 ${sizeClass}`} title={`${(data.average / 100).toFixed(2)} avg from ${data.count} review(s)`}>
      <StarRating average={data.average} />
      <span className="text-gray-500 font-medium">({data.count})</span>
    </span>
  );
}
