'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { BrowserProvider, JsonRpcSigner } from 'ethers';
import { CHAIN_ID, NETWORK } from '@/lib/contract';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface WalletContextType {
  address: string | null;
  chainId: number | null;
  signer: JsonRpcSigner | null;
  provider: BrowserProvider | null;
  isConnecting: boolean;
  isCorrectNetwork: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  chainId: null,
  signer: null,
  provider: null,
  isConnecting: false,
  isCorrectNetwork: false,
  connect: async () => {},
  disconnect: () => {},
  switchNetwork: async () => {},
});

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
};

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const isCorrectNetwork = chainId === CHAIN_ID;

  const getEthereum = (): EthereumProvider | undefined => {
    if (typeof window !== 'undefined') {
      return (window as unknown as { ethereum?: EthereumProvider }).ethereum;
    }
    return undefined;
  };

  // Auto-link wallet to user profile in backend
  const autoLinkWallet = useCallback(async (walletAddress: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    try {
      await api.patch('/auth/wallet', { walletAddress });
      // Dispatch event so AuthContext can refresh user data without circular imports
      window.dispatchEvent(new Event('wallet-linked'));
    } catch {
      // silently ignore - user can manually link from profile
    }
  }, []);

  const connect = useCallback(async () => {
    try {
      const ethereum = getEthereum();
      if (!ethereum) {
        toast.error('MetaMask not detected. Please install MetaMask extension to connect your wallet.');
        window.open('https://metamask.io/download/', '_blank');
        return;
      }

      setIsConnecting(true);
      try {
        const browserProvider = new BrowserProvider(ethereum as never);
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' }) as string[];
        
        if (!accounts || accounts.length === 0) {
          throw new Error('No accounts returned from MetaMask');
        }

        const network = await browserProvider.getNetwork();
        const userSigner = await browserProvider.getSigner();
        const userAddress = await userSigner.getAddress();

        setProvider(browserProvider);
        setSigner(userSigner);
        setAddress(userAddress);
        setChainId(Number(network.chainId));

        toast.success('Wallet connected!');

        // Auto-link to user profile
        await autoLinkWallet(userAddress);
      } catch (err: unknown) {
        const error = err as { code?: number; message?: string };
        if (error.code === 4001) {
          toast.error('Connection rejected. Please approve the MetaMask request to connect.');
        } else if (error.message?.includes('window.ethereum')) {
          toast.error('MetaMask is not available. Please install the extension.');
        } else {
          toast.error(error.message || 'Failed to connect wallet');
        }
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || 'Unexpected error connecting wallet');
    } finally {
      setIsConnecting(false);
    }
  }, [autoLinkWallet]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
    setSigner(null);
    setProvider(null);
  }, []);

  const switchNetwork = useCallback(async () => {
    try {
      const ethereum = getEthereum();
      if (!ethereum) {
        toast.error('MetaMask not detected');
        return;
      }

      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
        });
        toast.success(`Switched to ${NETWORK.chainName}!`);
      } catch (err: unknown) {
        const error = err as { code?: number };
        if (error.code === 4902) {
          try {
            const params = [{
              chainId: `0x${CHAIN_ID.toString(16)}`,
              chainName: NETWORK.chainName,
              nativeCurrency: NETWORK.nativeCurrency,
              rpcUrls: [NETWORK.rpcUrl],
              blockExplorerUrls: NETWORK.blockExplorerUrl ? [NETWORK.blockExplorerUrl] : [],
            }];
            await ethereum.request({ method: 'wallet_addEthereumChain', params });
            toast.success(`${NETWORK.chainName} added to MetaMask!`);
          } catch {
            toast.error(`Failed to add ${NETWORK.chainName}. Add it manually: RPC ${NETWORK.rpcUrl}, Chain ID ${CHAIN_ID}`);
          }
        } else if (error.code === 4001) {
          toast.error('Network switch rejected');
        } else {
          toast.error('Failed to switch network');
        }
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || 'Unexpected error switching network');
    }
  }, []);

  // Listen for account/chain changes (with error handling)
  useEffect(() => {
    try {
      const ethereum = getEthereum();
      if (!ethereum) {
        // MetaMask not available - this is fine, wallet features are optional
        return;
      }

      const handleAccountsChanged = (accounts: unknown) => {
        try {
          const accountList = accounts as string[];
          if (accountList && accountList.length === 0) {
            disconnect();
          } else if (accountList && accountList.length > 0) {
            setAddress(accountList[0]);
          }
        } catch (err) {
          console.warn('Error handling account change:', err);
        }
      };

      const handleChainChanged = (chainIdHex: unknown) => {
        try {
          const newChainId = parseInt(chainIdHex as string, 16);
          setChainId(newChainId);
        } catch (err) {
          console.warn('Error handling chain change:', err);
        }
      };

      ethereum.on('accountsChanged', handleAccountsChanged as (...args: unknown[]) => void);
      ethereum.on('chainChanged', handleChainChanged as (...args: unknown[]) => void);

      return () => {
        try {
          ethereum.removeListener('accountsChanged', handleAccountsChanged as (...args: unknown[]) => void);
          ethereum.removeListener('chainChanged', handleChainChanged as (...args: unknown[]) => void);
        } catch (err) {
          console.warn('Error removing wallet listeners:', err);
        }
      };
    } catch (err) {
      console.warn('Error setting up wallet listeners:', err);
    }
  }, [disconnect]);

  return (
    <WalletContext.Provider value={{
      address, chainId, signer, provider,
      isConnecting, isCorrectNetwork,
      connect, disconnect, switchNetwork,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);
