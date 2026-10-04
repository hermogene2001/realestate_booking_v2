'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { useTranslation } from '@/context/LanguageContext';
import { useEscrow } from '@/hooks/useEscrow';
import { formatEth, formatDate, formatDateTime, getStatusColor, shortenAddress } from '@/lib/utils';
import { ETHERSCAN_URL, IS_LOCAL_NETWORK, NETWORK, CHAIN_ID, CONTRACT_ADDRESS } from '@/lib/contract';
import toast from 'react-hot-toast';
import Link from 'next/link';

type PaymentChannel = 'ETH' | 'MOMO' | 'CARD';

interface AgreementSignature {
  userId: number;
  name: string;
  email: string;
  role: 'TENANT' | 'OWNER';
  walletAddress: string | null;
  signedAt: string;
  signatureHash: string;
}

interface AgreementData {
  tenantSignature?: AgreementSignature;
  ownerSignature?: AgreementSignature;
  tenantSigned: boolean;
  ownerSigned: boolean;
  fullySigned: boolean;
}

// ── Payment Channel Selector ───────────────────────────────────────────────
function PaymentChannelSelector({
  booking,
  bookingId,
  onSuccess,
}: {
  booking: Record<string, unknown>;
  bookingId: string;
  onSuccess: () => void;
}) {
  const { address, connect, isCorrectNetwork, switchNetwork } = useWallet();
  const { txState, createBooking, resetTx } = useEscrow();
  const [channel, setChannel] = useState<PaymentChannel>('ETH');
  const [momoPhone, setMomoPhone] = useState('');
  const [momoStep, setMomoStep] = useState<'form' | 'confirm'>('form');
  const [momoPaymentId, setMomoPaymentId] = useState<number | null>(null);
  const [momoRef, setMomoRef] = useState('');
  const [cardStep, setCardStep] = useState<'form' | 'confirm'>('form');
  const [cardPaymentId, setCardPaymentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const property = booking.property as Record<string, unknown>;
  const bookingFeeEth = property?.depositEth as string;
  const bookingFeeRwf = Math.round(parseFloat(bookingFeeEth || '0') * 2500 * 1250);

  const remainingAmount = booking.remainingAmount as string;
  const remainingRwf = Math.round(parseFloat(remainingAmount || '0') * 2500 * 1250);

  const channels: { id: PaymentChannel; label: string; icon: string; desc: string }[] = [
    { id: 'ETH', label: 'Ethereum', icon: '⟠', desc: `${bookingFeeEth} ETH via MetaMask` },
    { id: 'MOMO', label: 'Mobile Money', icon: '📱', desc: `≈ ${bookingFeeRwf.toLocaleString()} RWF via MTN MoMo` },
    { id: 'CARD', label: 'Card', icon: '💳', desc: `≈ $${(parseFloat(bookingFeeEth || '0') * 2500).toFixed(2)} USD via Visa/Mastercard` },
  ];

  // ── ETH booking fee ──
  const [ethMode, setEthMode] = useState<'metamask' | 'manual'>('metamask');
  const [manualWallet, setManualWallet] = useState('');

  const handleEthDeposit = async () => {
    if (!bookingFeeEth || parseFloat(bookingFeeEth) <= 0) {
      toast.error('Invalid booking fee amount');
      return;
    }
    const ownerWallet = (property?.owner as Record<string, unknown>)?.walletAddress as string;
    if (!ownerWallet) {
      toast.error('Owner has not linked their wallet yet. Try MoMo or Card instead.');
      return;
    }

    if (ethMode === 'metamask') {
      try {
        if (!address) {
          await connect();
          return;
        }
        if (!isCorrectNetwork) {
          await switchNetwork();
          return;
        }
        const result = await createBooking(
          property.id as number,
          ownerWallet,
          30 * 24 * 60 * 60,
          bookingFeeEth
        );
        await api.patch(`/bookings/${bookingId}/tx`, {
          txHash: result.hash,
          escrowAmount: bookingFeeEth,
          blockchainBookingId: result.bookingId ? parseInt(result.bookingId) : undefined,
        });
        toast.success('Booking fee paid!');
        resetTx();
        onSuccess();
      } catch (err: unknown) {
        const error = err instanceof Error ? err.message : 'Booking fee payment failed';
        console.error('Booking fee error:', err);
        toast.error(error);
      }
    } else {
      if (!manualWallet.trim() || !manualWallet.startsWith('0x')) {
        toast.error('Enter a valid Ethereum address (starts with 0x)');
        return;
      }
      setLoading(true);
      try {
        const { data } = await api.post('/payments/eth/manual', {
          bookingId: parseInt(bookingId),
          walletAddress: manualWallet.trim(),
        });
        window.dispatchEvent(new Event('wallet-linked'));
        toast.success('Booking confirmed! Escrow submitted to blockchain.');
        if (data.txHash) {
          toast.success(`Blockchain tx: ${data.txHash.slice(0, 16)}...`, { duration: 5000 });
        }
        onSuccess();
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: string } } };
        toast.error(e.response?.data?.error || 'Failed to complete booking');
      } finally { setLoading(false); }
    }
  };

  // ── MoMo initiate ──
  const handleMomoInitiate = async () => {
    if (!momoPhone.trim()) { toast.error('Enter your phone number'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/payments/momo/initiate', {
        bookingId: parseInt(bookingId),
        amount: bookingFeeRwf,
        phoneNumber: momoPhone,
      });
      setMomoPaymentId(data.paymentId);
      setMomoStep('confirm');
      toast.success('MoMo request sent! Check your phone.');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error || 'MoMo initiation failed');
    } finally { setLoading(false); }
  };

  // ── MoMo confirm ──
  const handleMomoConfirm = async () => {
    if (!momoRef.trim()) { toast.error('Enter the transaction reference'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/payments/momo/confirm', { paymentId: momoPaymentId, transactionRef: momoRef });
      toast.success(`MoMo payment confirmed! Escrow submitted to blockchain.`);
      if (data.txHash && !data.txHash.startsWith('momo-')) {
        toast.success(`Blockchain tx: ${data.txHash.slice(0, 16)}...`, { duration: 5000 });
      }
      onSuccess();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error || 'Confirmation failed');
    } finally { setLoading(false); }
  };

  // ── Card initiate ──
  const handleCardInitiate = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/payments/card/initiate', {
        bookingId: parseInt(bookingId),
        amount: parseFloat(bookingFeeEth) * 2500,
        currency: 'USD',
      });
      setCardPaymentId(data.paymentId);
      setCardStep('confirm');
      toast.success('Card payment initiated!');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error || 'Card initiation failed');
    } finally { setLoading(false); }
  };

  // ── Card confirm ──
  const handleCardConfirm = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/payments/card/confirm', { paymentId: cardPaymentId });
      toast.success('Card payment confirmed! Escrow submitted to blockchain.');
      if (data.txHash && !data.txHash.startsWith('card-')) {
        toast.success(`Blockchain tx: ${data.txHash.slice(0, 16)}...`, { duration: 5000 });
      }
      onSuccess();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error || 'Confirmation failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      {/* Channel selector */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">Choose payment method</p>
        <div className="grid grid-cols-3 gap-2">
          {channels.map(c => (
            <button key={c.id} onClick={() => { setChannel(c.id); setMomoStep('form'); setCardStep('form'); }}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                channel === c.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}>
              <div className="text-xl mb-1">{c.icon}</div>
              <p className={`text-xs font-semibold ${channel === c.id ? 'text-primary-700' : 'text-gray-800'}`}>{c.label}</p>
              <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{c.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ETH */}
      {channel === 'ETH' && (
        <div className="space-y-3">
          {/* Mode toggle */}
          <div className="flex rounded-xl border border-gray-200 overflow-hidden">
            <button onClick={() => setEthMode('metamask')}
              className={`flex-1 py-2 text-xs font-semibold transition-colors ${ethMode === 'metamask' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              🦊 MetaMask
            </button>
            <button onClick={() => setEthMode('manual')}
              className={`flex-1 py-2 text-xs font-semibold transition-colors ${ethMode === 'manual' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              ✏️ Enter Address
            </button>
          </div>

          {ethMode === 'metamask' ? (
            <>
              {/* Connected wallet display */}
              {address && (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                    <span className="text-xs font-mono text-green-800">
                      {address.slice(0, 8)}...{address.slice(-6)}
                    </span>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isCorrectNetwork ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {isCorrectNetwork ? 'Correct Network' : 'Wrong Network'}
                  </span>
                </div>
              )}

              {txState.status !== 'idle' && (
                <div className={`p-3 rounded-xl text-sm ${
                  txState.status === 'error' ? 'bg-red-50 text-red-700' :
                  txState.status === 'confirmed' ? 'bg-green-50 text-green-700' :
                  'bg-blue-50 text-blue-700'
                }`}>
                  {txState.status === 'pending' && '⏳ Waiting for MetaMask confirmation...'}
                  {txState.status === 'mining' && '⛏ Transaction submitted, confirming...'}
                  {txState.status === 'confirmed' && '✅ Transaction confirmed!'}
                  {txState.status === 'error' && `❌ ${txState.error}`}
                </div>
              )}

              {!address && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                  <p className="font-semibold mb-1">MetaMask setup required:</p>
                  <ol className="list-decimal list-inside space-y-0.5">
                    <li>Install MetaMask browser extension</li>
                    <li>Add network: RPC <code className="bg-amber-100 px-1 rounded">{NETWORK.rpcUrl}</code>, Chain ID <code className="bg-amber-100 px-1 rounded">{CHAIN_ID}</code></li>
                    {IS_LOCAL_NETWORK && <li>Import a Hardhat test account with the private key from the node console</li>}
                    {!IS_LOCAL_NETWORK && <li>Get free test ETH from a Sepolia faucet (e.g. <a href="https://sepoliafaucet.com" target="_blank" className="underline">sepoliafaucet.com</a>)</li>}
                  </ol>
                </div>
              )}

              <button onClick={address && !isCorrectNetwork ? switchNetwork : handleEthDeposit}
                disabled={txState.status === 'pending' || txState.status === 'mining'}
                className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition disabled:opacity-50">
                {!address
                  ? '🦊 Connect MetaMask'
                  : !isCorrectNetwork
                  ? `🔄 Switch to ${NETWORK.chainName}`
                    : `⟠ Pay Booking Fee ${bookingFeeEth} ETH`}
              </button>
            </>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
                Enter any Ethereum wallet address to book without MetaMask. The booking fee of <strong>{bookingFeeEth} ETH</strong> will be submitted by the platform (admin wallet). Your address will be saved to your profile.
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Your Wallet Address</label>
                <input
                  value={manualWallet}
                  onChange={e => setManualWallet(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-[10px] text-gray-400 mt-1">Must start with 0x followed by 40 hex characters</p>
              </div>
              <button onClick={handleEthDeposit} disabled={loading || !manualWallet.trim()}
                className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition disabled:opacity-50">
                {loading ? 'Processing...' : '⟠ Book with This Address'}
              </button>
            </>
          )}
        </div>
      )}

      {/* MoMo */}
      {channel === 'MOMO' && (
        <div className="space-y-3">
          {momoStep === 'form' ? (
            <>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-800">
                You will receive a MoMo prompt on your phone. Booking fee: <strong>{bookingFeeRwf.toLocaleString()} RWF</strong>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">MTN Phone Number</label>
                <input value={momoPhone} onChange={e => setMomoPhone(e.target.value)}
                  placeholder="+250 7XX XXX XXX"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <button onClick={handleMomoInitiate} disabled={loading || !momoPhone.trim()}
                className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-xl transition disabled:opacity-50">
                {loading ? 'Sending...' : '📱 Send MoMo Request'}
              </button>
            </>
          ) : (
            <>
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-800">
                ✅ MoMo request sent to <strong>{momoPhone}</strong>. Approve it then enter the reference below.
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Transaction Reference</label>
                <input value={momoRef} onChange={e => setMomoRef(e.target.value)}
                  placeholder="e.g. MOMO123456789"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <button onClick={handleMomoConfirm} disabled={loading || !momoRef.trim()}
                className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition disabled:opacity-50">
                {loading ? 'Confirming...' : '✅ Confirm Payment'}
              </button>
              <button onClick={() => setMomoStep('form')} className="w-full py-2 text-sm text-gray-500 hover:text-gray-700">
                ← Back
              </button>
            </>
          )}
        </div>
      )}

      {/* Card */}
      {channel === 'CARD' && (
        <div className="space-y-3">
          {cardStep === 'form' ? (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
                Booking fee: <strong>${(parseFloat(bookingFeeEth || '0') * 2500).toFixed(2)} USD</strong> via Visa / Mastercard
              </div>
              <button onClick={handleCardInitiate} disabled={loading}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-50">
                {loading ? 'Processing...' : '💳 Pay with Card'}
              </button>
            </>
          ) : (
            <>
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-800">
                ✅ Card payment initiated. Click confirm to complete.
              </div>
              <button onClick={handleCardConfirm} disabled={loading}
                className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition disabled:opacity-50">
                {loading ? 'Confirming...' : '✅ Confirm Card Payment'}
              </button>
              <button onClick={() => setCardStep('form')} className="w-full py-2 text-sm text-gray-500 hover:text-gray-700">
                ← Back
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function AgreementSection({
  booking,
  bookingId,
  currentUserId,
}: {
  booking: Record<string, unknown>;
  bookingId: string;
  currentUserId?: number;
}) {
  const queryClient = useQueryClient();
  const [signing, setSigning] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['booking-agreement', bookingId],
    queryFn: async () => {
      const { data } = await api.get(`/bookings/${bookingId}/agreement`);
      return data.agreement as AgreementData;
    },
  });

  const property = booking.property as Record<string, unknown>;
  const owner = property?.owner as Record<string, unknown> | undefined;
  const tenant = booking.tenant as Record<string, unknown> | undefined;
  const transactions = (booking.transactions || []) as Record<string, unknown>[];
  const isTenant = booking.tenantId === currentUserId;
  const isOwner = owner?.id === currentUserId || property?.ownerId === currentUserId;
  const mySignature = isTenant ? data?.tenantSignature : isOwner ? data?.ownerSignature : undefined;
  const canSign = (isTenant || isOwner)
    && !mySignature
    && !['REJECTED', 'CANCELLED', 'REFUNDED', 'DISPUTED'].includes(String(booking.status));

  const handleSign = async () => {
    setSigning(true);
    try {
      await api.post(`/bookings/${bookingId}/agreement/sign`);
      toast.success('Agreement signed');
      queryClient.invalidateQueries({ queryKey: ['booking-agreement', bookingId] });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error || 'Failed to sign agreement');
    } finally {
      setSigning(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await api.get(`/bookings/${bookingId}/agreement/download`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `booking-agreement-${bookingId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error || 'Failed to download agreement');
    } finally {
      setDownloading(false);
    }
  };

  const signatureBadge = (signature?: AgreementSignature) => (
    <div className={`rounded-xl border p-3 ${signature ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-gray-500">{signature?.role || 'Pending'}</p>
          <p className="text-sm font-semibold text-gray-900">{signature?.name || 'Not signed yet'}</p>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${signature ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
          {signature ? 'Signed' : 'Pending'}
        </span>
      </div>
      {signature && (
        <div className="mt-2 space-y-1 text-xs text-gray-500">
          <p>{formatDateTime(signature.signedAt)}</p>
          <p className="font-mono break-all">Hash: {signature.signatureHash}</p>
          <p className="font-mono">Wallet: {shortenAddress(signature.walletAddress)}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-5">
        <div>
          <h2 className="text-lg font-semibold">Agreement & Signatures</h2>
          <p className="text-sm text-gray-500">
            Tenant and owner can digitally sign the booking agreement and download a copy with blockchain details.
          </p>
        </div>
        <div className="flex gap-2">
          {canSign && (
            <button
              onClick={handleSign}
              disabled={signing || isLoading}
              className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition disabled:opacity-50"
            >
              {signing ? 'Signing...' : `Sign as ${isTenant ? 'Tenant' : 'Owner'}`}
            </button>
          )}
          <button
            onClick={handleDownload}
            disabled={downloading || isLoading}
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
          >
            {downloading ? 'Downloading...' : 'Download Agreement'}
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3 mb-5">
        {signatureBadge(data?.tenantSignature)}
        {signatureBadge(data?.ownerSignature)}
      </div>

      {data?.fullySigned ? (
        <div className="mb-5 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          Agreement fully signed by both parties.
        </div>
      ) : (
        <div className="mb-5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          Agreement is waiting for {data?.tenantSigned ? 'owner' : data?.ownerSigned ? 'tenant' : 'tenant and owner'} signature.
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl bg-gray-50 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Parties</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-gray-500">Tenant</span>
              <span className="text-right">{tenant?.name as string || 'Tenant'} - <span className="font-mono">{shortenAddress(tenant?.walletAddress as string)}</span></span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-gray-500">Owner</span>
              <span className="text-right">{owner?.name as string || 'Owner'} - <span className="font-mono">{shortenAddress(owner?.walletAddress as string)}</span></span>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-gray-50 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Blockchain Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-gray-500">Contract Booking ID</span>
              <span className="font-mono text-right">{String(booking.blockchainBookingId || 'Not recorded')}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-gray-500">Main Tx Hash</span>
              <span className="font-mono text-right break-all">{booking.txHash ? shortenAddress(booking.txHash as string) : 'Not recorded'}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-gray-500">Payment</span>
              <span className="text-right">{String(booking.paymentMethod || 'Pending')} / {String(booking.paymentStatus || 'PENDING')}</span>
            </div>
          </div>
        </div>
      </div>

      {transactions.length > 0 && (
        <div className="mt-4 rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 text-sm font-semibold text-gray-700">Recorded Transactions</div>
          <div className="divide-y">
            {transactions.map((tx) => (
              <div key={tx.id as number} className="grid md:grid-cols-4 gap-2 px-4 py-3 text-xs">
                <span className="font-semibold text-gray-700">{tx.type as string}</span>
                <span>{tx.amount as string} ETH</span>
                <span className="font-mono text-gray-500">From {shortenAddress(tx.fromAddress as string)}</span>
                <span className="font-mono text-gray-500">Tx {shortenAddress(tx.txHash as string)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookingDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { address, connect, isCorrectNetwork, switchNetwork } = useWallet();
  const { t } = useTranslation();
  const { txState, createBooking, confirmHandover, cancelBooking, raiseDispute, getBookingState, resetTx } = useEscrow();
  const queryClient = useQueryClient();
  const [onChainData, setOnChainData] = useState<Record<string, unknown> | null>(null);
  const [verifying, setVerifying] = useState(false);

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: async () => {
      const { data } = await api.get(`/bookings/${id}`);
      return data.booking;
    },
    refetchInterval: 10000,
  });

  const handleConfirm = async () => {
    try {
      await api.patch(`/bookings/${id}/confirm`);
      toast.success('Booking confirmed!');
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
      resetTx();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Confirmation failed');
    }
  };

  const handleCancel = async () => {
    try {
      if (address && booking.txHash && isCorrectNetwork) {
        try { await cancelBooking(parseInt(id as string)); } catch { /* fallback */ }
      }
      await api.patch(`/bookings/${id}/cancel`);
      toast.success('Booking cancelled');
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
      resetTx();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Cancellation failed');
    }
  };

  const handleVerifyOnChain = async () => {
    try {
      setVerifying(true);
      const chainId = booking.blockchainBookingId ?? parseInt(id as string);
      const raw = await getBookingState(chainId);
      const stateLabels = ['PENDING', 'LOCKED', 'COMPLETED', 'CANCELLED', 'DISPUTED', 'REFUNDED'];
      setOnChainData({
        chainBookingId: chainId,
        propertyId: Number(raw.propertyId),
        tenant: raw.tenant,
        owner: raw.owner,
        amount: raw.amount.toString(),
        state: stateLabels[Number(raw.state)] || `UNKNOWN(${raw.state})`,
        tenantConfirmed: raw.tenantConfirmed,
        ownerConfirmed: raw.ownerConfirmed,
        createdAt: new Date(Number(raw.createdAt) * 1000).toLocaleString(),
        timeoutAt: Number(raw.timeoutAt) > 0 ? new Date(Number(raw.timeoutAt) * 1000).toLocaleString() : 'N/A',
      });
      toast.success('On-chain booking state verified');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('CALL_EXCEPTION') || msg.includes('booking not found')) {
        toast.error('Booking not found on-chain. The escrow may not have been submitted yet, or the on-chain booking ID is missing. Use the Kigali RE Copilot for help.');
      } else {
        toast.error(msg || 'Failed to verify on-chain');
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleDispute = async () => {
    try {
      if (address && booking.txHash && isCorrectNetwork) {
        try { await raiseDispute(parseInt(id as string)); } catch { /* fallback */ }
      }
      await api.patch(`/bookings/${id}/dispute`, { reason: 'Dispute raised via blockchain escrow' });
      toast.success('Dispute raised');
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
      resetTx();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Dispute failed');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
      </div>
    );
  }

  if (!booking) return <div className="max-w-4xl mx-auto px-4 py-20 text-center text-gray-500">Booking not found</div>;

  const isTenant = user?.id === booking.tenantId;
  const isOwner = user?.id === booking.property?.ownerId;

  // State machine steps
  const steps = [
    {
      label: t('booking.pending'),
      active: booking.status === 'PENDING',
      done: !['PENDING', 'REJECTED'].includes(booking.status),
    },
    {
      label: 'Accepted',
      active: booking.status === 'ACCEPTED',
      done: ['LOCKED', 'COMPLETED'].includes(booking.status),
    },
    {
      label: 'Pay Booking Fee',
      active: booking.status === 'ACCEPTED',
      done: ['LOCKED', 'COMPLETED'].includes(booking.status),
    },
    { label: t('booking.completed'), active: booking.status === 'COMPLETED', done: booking.status === 'COMPLETED' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Booking #{booking.id}
      </h1>
      <p className="text-gray-500 mb-8">{booking.property?.title}</p>

      {/* State Timeline */}
      <div className="bg-white rounded-2xl border p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${
                step.done ? 'bg-green-500 text-white' : step.active ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {step.done ? '\u2713' : i + 1}
              </div>
              <span className={`ml-2 text-sm font-medium ${step.active ? 'text-gray-900' : 'text-gray-400'}`}>
                {step.label}
              </span>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${step.done ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(booking.status)}`}>
            {booking.status}
          </span>
        </div>
      </div>

      {/* ── Blockchain Verification ── */}
      {booking.txHash && (
        <div className="bg-white rounded-2xl border border-green-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            <h2 className="text-lg font-semibold">Blockchain Verification</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            This booking is secured by an escrow smart contract on the blockchain. The transaction is confirmed and immutable.
          </p>
          {!booking.blockchainBookingId && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3 text-xs text-amber-800">
              This booking has a transaction hash but was not submitted to the smart contract
              (blockchain booking ID missing). The "Verify On-Chain" button may fail.
            </div>
          )}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Status</span>
              <span className="text-sm font-semibold text-green-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Confirmed on-chain
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Network</span>
              <span className="text-sm font-semibold">{IS_LOCAL_NETWORK ? 'Local (Hardhat)' : 'Sepolia Testnet'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Smart Contract</span>
              <span className="text-xs font-mono text-gray-600">{CONTRACT_ADDRESS || '0x...'}</span>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between items-start">
                <span className="text-sm text-gray-500">Transaction Hash</span>
                <div className="flex items-center gap-2 max-w-[65%]">
                  <span className="text-xs font-mono text-gray-600 break-all">{booking.txHash}</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(booking.txHash); toast.success('txHash copied!'); }}
                    className="text-gray-400 hover:text-gray-600 shrink-0"
                    title="Copy transaction hash"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <button
                onClick={handleVerifyOnChain}
                disabled={verifying}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {verifying ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Verifying...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Verify On-Chain
                  </>
                )}
              </button>
            </div>

            {onChainData && (
              <div className="bg-indigo-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 mb-2">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Smart Contract State (read from chain)
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  <span className="text-gray-500">On-Chain ID</span>
                  <span className="font-mono font-medium text-right">{onChainData.chainBookingId as number}</span>
                  <span className="text-gray-500">Property ID</span>
                  <span className="font-mono font-medium text-right">{onChainData.propertyId as number}</span>
                  <span className="text-gray-500">State</span>
                  <span className={`font-medium text-right ${onChainData.state === booking.status ? 'text-green-600' : 'text-orange-600'}`}>
                    {onChainData.state as string}
                    {onChainData.state !== booking.status && ' (mismatch!)'}
                  </span>
                  <span className="text-gray-500">Tenant</span>
                  <span className="font-mono text-right">{(onChainData.tenant as string).slice(0, 10)}...</span>
                  <span className="text-gray-500">Owner</span>
                  <span className="font-mono text-right">{(onChainData.owner as string).slice(0, 10)}...</span>
                  <span className="text-gray-500">Amount</span>
                  <span className="font-mono text-right">{(Number(onChainData.amount) / 1e18).toFixed(4)} ETH</span>
                  <span className="text-gray-500">Tenant Confirmed</span>
                  <span className="text-right">{onChainData.tenantConfirmed ? '\u2705 Yes' : '\u274C No'}</span>
                  <span className="text-gray-500">Owner Confirmed</span>
                  <span className="text-right">{onChainData.ownerConfirmed ? '\u2705 Yes' : '\u274C No'}</span>
                  <span className="text-gray-500">Created</span>
                  <span className="text-right">{onChainData.createdAt as string}</span>
                  <span className="text-gray-500">Timeout</span>
                  <span className="text-right">{onChainData.timeoutAt as string}</span>
                </div>
                <div className={`mt-2 text-xs text-center font-medium ${onChainData.state === booking.status ? 'text-green-600' : 'text-orange-600'}`}>
                  {onChainData.state === booking.status
                    ? 'Database and blockchain state match'
                    : 'State mismatch — the contract may need to be synced'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <AgreementSection
        booking={booking}
        bookingId={id as string}
        currentUserId={user?.id}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Booking Details */}
        <div className="bg-white rounded-2xl border p-6">
          <h2 className="text-lg font-semibold mb-4">{t('property.details')}</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">{t('property.title')}</span>
              <span className="font-medium">{booking.property?.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('property.location')}</span>
              <span>{booking.property?.location}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('booking.start_date')}</span>
              <span>{formatDate(booking.startDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('booking.end_date')}</span>
              <span>{formatDate(booking.endDate)}</span>
            </div>
            {booking.escrowAmount ? (
              <div className="flex justify-between">
                <span className="text-gray-500">Booking Fee</span>
                <span className="font-semibold text-primary-600">{formatEth(booking.escrowAmount)} ETH</span>
              </div>
            ) : null}
            {booking.totalAmount ? (
              <div className="flex justify-between">
                <span className="text-gray-500">Total Amount</span>
                <span className="font-semibold">{formatEth(booking.totalAmount)} ETH</span>
              </div>
            ) : null}

            {booking.timeoutAt ? (
              <div className="flex justify-between">
                <span className="text-gray-500">{t('booking.timeout')}</span>
                <span>{formatDateTime(booking.timeoutAt)}</span>
              </div>
            ) : null}
            <div className="flex justify-between">
              <span className="text-gray-500">{t('booking.tenant_confirmed')}</span>
              <span className={booking.tenantConfirmed ? 'text-green-600 font-medium' : 'text-gray-400'}>
                {booking.tenantConfirmed ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('booking.owner_confirmed')}</span>
              <span className={booking.ownerConfirmed ? 'text-green-600 font-medium' : 'text-gray-400'}>
                {booking.ownerConfirmed ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Actions</h2>

          <div className="space-y-3">
            {/* Payment channel selector (tenant, PENDING or ACCEPTED) */}
            {isTenant && ['PENDING', 'ACCEPTED'].includes(booking.status) && (
              <PaymentChannelSelector
                booking={booking}
                bookingId={id as string}
                onSuccess={() => queryClient.invalidateQueries({ queryKey: ['booking', id] })}
              />
            )}

            {/* Confirm handover (both parties, LOCKED status) */}
            {(isTenant || isOwner) && booking.status === 'LOCKED' && (
              <>
                {isTenant && !booking.tenantConfirmed && (
                  <button
                    onClick={handleConfirm}
                    disabled={txState.status === 'pending' || txState.status === 'mining'}
                    className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition disabled:opacity-50"
                  >
                    Confirm Booking
                  </button>
                )}
                {isOwner && !booking.ownerConfirmed && (
                  <button
                    onClick={handleConfirm}
                    disabled={txState.status === 'pending' || txState.status === 'mining'}
                    className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition disabled:opacity-50"
                  >
                    Confirm Booking
                  </button>
                )}
              </>
            )}

            {/* Cancel (PENDING, ACCEPTED, LOCKED, or COMPLETED for tenant) */}
            {(isTenant || isOwner) && (['PENDING', 'ACCEPTED', 'LOCKED'].includes(booking.status) || (booking.status === 'COMPLETED' && isTenant)) && (
              <button
                onClick={handleCancel}
                disabled={txState.status === 'pending' || txState.status === 'mining'}
                className="w-full py-3 border border-red-300 text-red-600 font-semibold rounded-xl hover:bg-red-50 transition disabled:opacity-50"
              >
                {t('booking.cancel_booking')}
              </button>
            )}

            {/* Dispute (ACCEPTED or LOCKED) */}
            {(isTenant || isOwner) && ['ACCEPTED', 'LOCKED'].includes(booking.status) && (
              <button
                onClick={handleDispute}
                disabled={txState.status === 'pending' || txState.status === 'mining'}
                className="w-full py-3 border border-orange-300 text-orange-600 font-semibold rounded-xl hover:bg-orange-50 transition disabled:opacity-50"
              >
                {t('booking.raise_dispute')}
              </button>
            )}

            {/* Completed message */}
            {booking.status === 'COMPLETED' && (
              <div className="text-center py-4">
                <div className="text-green-600 text-4xl mb-2">&#10003;</div>
                <p className="text-green-700 font-medium">Booking completed! Funds released.</p>
                {isTenant && booking.remainingAmount && !booking.remainingPaid && (
                  <PayRemainingSection
                    booking={booking}
                    bookingId={id as string}
                    onSuccess={() => queryClient.invalidateQueries({ queryKey: ['booking', id] })}
                  />
                )}
              </div>
            )}

            {booking.status === 'REFUNDED' && (
              <div className="text-center py-4">
                <p className="text-purple-700 font-medium">Funds have been refunded to the tenant.</p>
              </div>
            )}
          </div>

          {/* Transaction history */}
          {booking.transactions?.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Transaction History</h3>
              <div className="space-y-2">
                {booking.transactions.map((tx: Record<string, unknown>) => (
                  <div key={tx.id as number} className="flex justify-between text-sm">
                    <span className="text-gray-500">{tx.type as string}</span>
                    {IS_LOCAL_NETWORK ? (
                      <span className="text-xs font-mono text-gray-500">
                        {(tx.txHash as string)?.slice(0, 14)}...
                      </span>
                    ) : (
                      <a
                        href={`${ETHERSCAN_URL}/tx/${tx.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 font-mono text-xs"
                      >
                        {(tx.txHash as string)?.slice(0, 10)}...
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Review Form (tenant, completed booking) ── */}
      {isTenant && booking.status === 'COMPLETED' && (
        <ReviewForm
          bookingId={booking.id}
          propertyId={booking.property?.id}
          propertyTitle={booking.property?.title}
          existingReview={booking.review}
        />
      )}

      {/* ── Message Owner / Tenant ── */}
      {(isTenant || isOwner) && (
        <div className="mt-6 bg-white rounded-2xl border p-6">
          <h2 className="text-lg font-semibold mb-3">
            {isTenant ? 'Contact Owner' : 'Contact Tenant'}
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            {isTenant
              ? `Have a question about ${booking.property?.title}? Message the owner directly.`
              : `Need to reach your tenant ${booking.tenant?.name}? Send them a message.`}
          </p>
          <Link
            href={`/messages?userId=${isTenant ? booking.property?.owner?.id : booking.tenant?.id}&propertyId=${booking.property?.id}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            {isTenant ? `Message ${booking.property?.owner?.name}` : `Message ${booking.tenant?.name}`}
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Pay Remaining Section (dual-mode: MetaMask or manual address) ─────────
function PayRemainingSection({
  booking,
  bookingId,
  onSuccess,
}: {
  booking: Record<string, unknown>;
  bookingId: string;
  onSuccess: () => void;
}) {
  const { txState } = useEscrow();
  const [mode, setMode] = useState<'metamask' | 'manual'>('metamask');
  const [manualWallet, setManualWallet] = useState('');
  const [loading, setLoading] = useState(false);
  const remaining = booking.remainingAmount as string;

  const handlePay = async (recordWallet?: string) => {
    setLoading(true);
    try {
      const { data } = await api.post('/payments/eth/remaining', {
        bookingId: parseInt(bookingId),
      });
      toast.success(`Remaining amount paid${recordWallet ? ' from ' + recordWallet.slice(0, 8) + '...' : '!'}`);
      if (data.txHash) {
        toast.success(`Tx: ${data.txHash.slice(0, 16)}...`, { duration: 5000 });
      }
      onSuccess();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error || 'Failed to pay remaining');
    } finally { setLoading(false); }
  };

  return (
    <div className="mt-4 space-y-3 text-left">
      <p className="text-sm text-gray-600 text-center">
        Remaining amount: <strong>{parseFloat(remaining).toFixed(4)} ETH</strong>
      </p>

      {/* Mode toggle */}
      <div className="flex rounded-xl border border-gray-200 overflow-hidden">
        <button onClick={() => setMode('metamask')}
          className={`flex-1 py-2 text-xs font-semibold transition-colors ${mode === 'metamask' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
          🦊 MetaMask
        </button>
        <button onClick={() => setMode('manual')}
          className={`flex-1 py-2 text-xs font-semibold transition-colors ${mode === 'manual' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
          ✏️ Enter Address
        </button>
      </div>

      {mode === 'metamask' ? (
        <div className="space-y-3">
          <button onClick={() => handlePay()} disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-50">
            {loading ? 'Processing...' : `⟠ Pay ${parseFloat(remaining).toFixed(4)} ETH`}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
            Enter a wallet address to associate with this payment. The amount will be sent by the platform.
          </div>
          <input
            value={manualWallet}
            onChange={e => setManualWallet(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={() => handlePay(manualWallet)} disabled={loading || !manualWallet.trim()}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-50">
            {loading ? 'Processing...' : `⟠ Pay ${parseFloat(remaining).toFixed(4)} ETH`}
          </button>
        </div>
      )}

      {txState.status === 'error' && (
        <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm">{txState.error}</div>
      )}
    </div>
  );
}

// ── Review Form Component ──────────────────────────────────────────────────
function ReviewForm({ bookingId, propertyId, propertyTitle, existingReview }: {
  bookingId: number;
  propertyId: number;
  propertyTitle: string;
  existingReview?: Record<string, unknown>;
}) {
  const queryClient = useQueryClient();
  const { id } = useParams();
  const [rating, setRating] = useState(existingReview ? (existingReview.rating as number) : 0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState(existingReview ? (existingReview.comment as string) : '');
  const [saving, setSaving] = useState(false);

  if (existingReview) {
    return (
      <div className="mt-6 bg-white rounded-2xl border p-6">
        <h2 className="text-lg font-semibold mb-1">Your Review</h2>
        <p className="text-xs text-gray-400 mb-3">You already reviewed this property</p>
        <div className="flex items-center gap-1 mb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={`text-xl ${i < (existingReview.rating as number) ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
          ))}
        </div>
        <p className="text-sm text-gray-600">{existingReview.comment as string}</p>
      </div>
    );
  }

  const submit = async () => {
    if (rating === 0) { toast.error('Please select a rating'); return; }
    if (!comment.trim()) { toast.error('Please write a comment'); return; }
    setSaving(true);
    try {
      await api.post('/reviews', { propertyId, bookingId, rating, comment: comment.trim() });
      toast.success('Review submitted!');
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error || 'Failed to submit review');
    } finally { setSaving(false); }
  };

  return (
    <div className="mt-6 bg-white rounded-2xl border p-6">
      <h2 className="text-lg font-semibold mb-1">Rate Your Stay</h2>
      <p className="text-sm text-gray-500 mb-5">How was your experience at <span className="font-medium text-gray-700">{propertyTitle}</span>?</p>

      {/* Star Rating */}
      <div className="flex items-center gap-1 mb-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <button key={i}
            onMouseEnter={() => setHovered(i + 1)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(i + 1)}
            className="text-3xl transition-transform hover:scale-110 focus:outline-none"
          >
            <span className={(hovered || rating) > i ? 'text-yellow-400' : 'text-gray-200'}>★</span>
          </button>
        ))}
        {rating > 0 && (
          <span className="ml-2 text-sm font-medium text-gray-600">
            {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
          </span>
        )}
      </div>

      {/* Comment */}
      <textarea value={comment} onChange={e => setComment(e.target.value)} rows={4}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none mb-4"
        placeholder="Share details about your experience — cleanliness, location, communication with the owner..." />

      <button onClick={submit} disabled={saving || rating === 0 || !comment.trim()}
        className="px-6 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors">
        {saving ? 'Submitting...' : 'Submit Review'}
      </button>
    </div>
  );
}
