'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useWallet } from '@/context/WalletContext';
import { getPropertyTokenContract } from '@/lib/contract';
import api from '@/lib/api';
import toast from 'react-hot-toast';

function formatEth(wei: string) {
  const val = parseFloat(wei) / 1e18;
  return val.toFixed(6);
}

export default function SharesSection({ propertyId, ownerId, currentUserId }: { propertyId: number; ownerId: number; currentUserId?: number }) {
  const { signer, connect } = useWallet();
  const queryClient = useQueryClient();
  const [buyCount, setBuyCount] = useState(1);
  const [buying, setBuying] = useState(false);

  const { data: shareData, isLoading } = useQuery({
    queryKey: ['property-shares', propertyId],
    queryFn: async () => {
      const { data } = await api.get(`/tokens/property/${propertyId}`);
      return data as { share: Record<string, unknown> | null; totalSupply: string; pricePerShare: string; availableShares: number };
    },
  });

  const handleBuyShares = async () => {
    if (!signer) {
      await connect();
      return;
    }
    if (!shareData?.share) {
      toast.error('No shares available for this property');
      return;
    }

    setBuying(true);
    try {
      const contract = getPropertyTokenContract(signer);
      const tokenId = shareData.share.tokenId as number;
      const totalPrice = BigInt(shareData.pricePerShare) * BigInt(buyCount);

      const tx = await contract.buyShares(tokenId, buyCount, { value: totalPrice });
      await tx.wait();

      await api.post('/tokens/buy', {
        propertyShareId: shareData.share.id as number,
        shareCount: buyCount,
        txHash: tx.hash,
      });

      toast.success(`Bought ${buyCount} share(s)!`);
      queryClient.invalidateQueries({ queryKey: ['property-shares', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['my-shares'] });
    } catch (err: unknown) {
      const error = err as { reason?: string; message?: string };
      toast.error(error.reason || error.message || 'Transaction failed');
    } finally {
      setBuying(false);
    }
  };

  if (isLoading) return <p className="text-sm text-gray-400">Loading shares...</p>;

  if (!shareData?.share) {
    return <p className="text-sm text-gray-400">Fractional shares not available yet for this property.</p>;
  }

  const isOwner = currentUserId === ownerId;
  const available = shareData.availableShares;

  return (
    <div>
      <div className="flex items-center gap-4 mb-3 flex-wrap">
        <div className="bg-indigo-50 rounded-xl px-3 py-1.5">
          <span className="text-xs text-gray-500">Price per share</span>
          <p className="font-semibold text-indigo-700">{formatEth(shareData.pricePerShare)} ETH</p>
        </div>
        <div className="bg-indigo-50 rounded-xl px-3 py-1.5">
          <span className="text-xs text-gray-500">Total supply</span>
          <p className="font-semibold text-indigo-700">{formatEth(shareData.totalSupply)} ETH</p>
        </div>
        <div className="bg-indigo-50 rounded-xl px-3 py-1.5">
          <span className="text-xs text-gray-500">Available</span>
          <p className="font-semibold text-indigo-700">{available} shares</p>
        </div>
      </div>

      {!isOwner && available > 0 && (
        <div className="flex items-center gap-3 mt-4">
          <div className="flex items-center border rounded-lg">
            <button onClick={() => setBuyCount(Math.max(1, buyCount - 1))} className="px-2 py-1 text-sm hover:bg-gray-100">-</button>
            <span className="px-3 py-1 text-sm font-medium">{buyCount}</span>
            <button onClick={() => setBuyCount(Math.min(available, buyCount + 1))} className="px-2 py-1 text-sm hover:bg-gray-100">+</button>
          </div>
          <button
            onClick={handleBuyShares}
            disabled={buying}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {buying ? 'Buying...' : `Buy ${buyCount} Share${buyCount > 1 ? 's' : ''}`}
          </button>
        </div>
      )}

      {isOwner && (
        <p className="text-sm text-gray-400 mt-2">You own this property. Go to the owner dashboard to manage shares.</p>
      )}
    </div>
  );
}
