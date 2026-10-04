'use client';

import { useState, useCallback } from 'react';
import { Contract, parseEther } from 'ethers';
import { useWallet } from '@/context/WalletContext';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '@/lib/contract';

interface TxState {
  status: 'idle' | 'pending' | 'mining' | 'confirmed' | 'error';
  hash: string | null;
  error: string | null;
}

export function useEscrow() {
  const { signer, isCorrectNetwork } = useWallet();
  const [txState, setTxState] = useState<TxState>({ status: 'idle', hash: null, error: null });

  const getContract = useCallback(() => {
    if (!signer) throw new Error('Wallet not connected');
    if (!isCorrectNetwork) throw new Error('Wrong network');
    if (!CONTRACT_ADDRESS) throw new Error('Contract address not configured');
    return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  }, [signer, isCorrectNetwork]);

  const createBooking = useCallback(async (
    propertyId: number,
    ownerAddress: string,
    timeoutDuration: number,
    depositEth: string
  ) => {
    setTxState({ status: 'pending', hash: null, error: null });
    try {
      const contract = getContract();
      const tx = await contract.createBooking(
        propertyId,
        ownerAddress,
        timeoutDuration,
        { value: parseEther(depositEth) }
      );
      setTxState({ status: 'mining', hash: tx.hash, error: null });

      const receipt = await tx.wait();
      setTxState({ status: 'confirmed', hash: receipt.hash, error: null });

      // Extract bookingId from event
      const event = receipt.logs.find((log: { fragment?: { name: string } }) =>
        log.fragment?.name === 'BookingCreated'
      );
      const bookingId = event?.args?.[0];

      return { hash: receipt.hash, bookingId: bookingId?.toString() };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Transaction failed';
      setTxState({ status: 'error', hash: null, error: message });
      throw err;
    }
  }, [getContract]);

  const confirmHandover = useCallback(async (bookingId: number) => {
    setTxState({ status: 'pending', hash: null, error: null });
    try {
      const contract = getContract();
      const tx = await contract.confirmHandover(bookingId);
      setTxState({ status: 'mining', hash: tx.hash, error: null });

      const receipt = await tx.wait();
      setTxState({ status: 'confirmed', hash: receipt.hash, error: null });
      return receipt.hash;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Transaction failed';
      setTxState({ status: 'error', hash: null, error: message });
      throw err;
    }
  }, [getContract]);

  const cancelBooking = useCallback(async (bookingId: number) => {
    setTxState({ status: 'pending', hash: null, error: null });
    try {
      const contract = getContract();
      const tx = await contract.cancelBooking(bookingId);
      setTxState({ status: 'mining', hash: tx.hash, error: null });

      const receipt = await tx.wait();
      setTxState({ status: 'confirmed', hash: receipt.hash, error: null });
      return receipt.hash;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Transaction failed';
      setTxState({ status: 'error', hash: null, error: message });
      throw err;
    }
  }, [getContract]);

  const raiseDispute = useCallback(async (bookingId: number) => {
    setTxState({ status: 'pending', hash: null, error: null });
    try {
      const contract = getContract();
      const tx = await contract.raiseDispute(bookingId);
      setTxState({ status: 'mining', hash: tx.hash, error: null });

      const receipt = await tx.wait();
      setTxState({ status: 'confirmed', hash: receipt.hash, error: null });
      return receipt.hash;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Transaction failed';
      setTxState({ status: 'error', hash: null, error: message });
      throw err;
    }
  }, [getContract]);

  const getBookingState = useCallback(async (bookingId: number) => {
    const contract = getContract();
    return await contract.getBooking(bookingId);
  }, [getContract]);

  const resetTx = useCallback(() => {
    setTxState({ status: 'idle', hash: null, error: null });
  }, []);

  return {
    txState,
    createBooking,
    confirmHandover,
    cancelBooking,
    raiseDispute,
    getBookingState,
    resetTx,
  };
}
