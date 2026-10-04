'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: 'TENANT' | 'OWNER' | 'ADMIN';
  language: string;
  walletAddress: string | null;
  isBanned: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'TENANT' | 'OWNER';
  language?: string;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ id: 0, name: '', email: '', phone: '', role: 'TENANT' as const, language: 'en', walletAddress: null, isBanned: false, createdAt: '' }),
  register: async () => {},
  logout: () => {},
  updateProfile: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      api.get('/auth/me')
        .then(({ data }) => setUser(data.user))
        .catch(() => {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
    return data.user as User;
  }, []);

  const register = useCallback(async (regData: RegisterData) => {
    const { data } = await api.post('/auth/register', regData);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (profileData: Partial<User>) => {
    const { data } = await api.patch('/auth/profile', profileData);
    setUser(data.user);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch {
      // ignore - user might not be logged in
    }
  }, []);

  // Listen for wallet-linked event from WalletContext (avoids circular imports)
  useEffect(() => {
    const handleWalletLinked = () => {
      refreshUser();
    };
    window.addEventListener('wallet-linked', handleWalletLinked);
    return () => window.removeEventListener('wallet-linked', handleWalletLinked);
  }, [refreshUser]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
