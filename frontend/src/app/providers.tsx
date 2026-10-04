'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { WalletProvider } from '@/context/WalletContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <WalletProvider>
            {children}
            <Toaster position="top-right" />
          </WalletProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
