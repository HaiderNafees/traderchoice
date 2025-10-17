'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';
import type { User, Signal, Payment, FireTimestampLike } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  signals: Signal[];
  allUsers: User[];
  payments: Payment[];
  loading: boolean;
  signalsLoading: boolean;
  adminLoading: boolean;
  signup: (email: string, password: string) => Promise<any>;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  addSignal: (signal: Omit<Signal, 'id' | 'createdBy' | 'createdAt'>) => Promise<void>;
  updateSignal: (id: string, signal: Partial<Omit<Signal, 'id'>>) => Promise<void>;
  deleteSignal: (id: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshAdminData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [signalsLoading, setSignalsLoading] = useState(true);
  const [adminLoading, setAdminLoading] = useState(true);

  const API_BASE = ((globalThis as any)?.process?.env?.NEXT_PUBLIC_API_BASE_URL as string | undefined) || 'https://traderchoice.asia/api';

  const toTs = (epochSec: number | null | undefined): FireTimestampLike | null => {
    if (!epochSec) return null;
    return { toDate: () => new Date(epochSec * 1000) };
  };

  const mapSignal = (s: any): Signal => ({
    id: s.id,
    title: s.title,
    description: s.description,
    type: s.type,
    tradeType: s.tradeType,
    entryPrice: s.entryPrice,
    takeProfit: s.takeProfit,
    stopLoss: s.stopLoss,
    tradeNumber: s.tradeNumber,
    riskLevel: s.riskLevel,
    accuracyPercent: s.accuracyPercent,
    tp1: s.tp1 ?? null,
    tp2: s.tp2 ?? null,
    tp3: s.tp3 ?? null,
    createdBy: s.createdBy,
    createdAt: toTs(s.createdAt)!,
  });

  const adminToken = (globalThis as any)?.process?.env?.NEXT_PUBLIC_ADMIN_TOKEN as string | undefined;
  const withAdmin = (base?: Record<string, string>): Record<string, string> => {
    const headers: Record<string, string> = { ...(base || {}) };
    if (adminToken) headers['X-Admin-Token'] = adminToken;
    return headers;
  };

  const mapUser = (u: any): User => ({
    uid: u.uid,
    email: u.email ?? null,
    role: u.role,
    proExpires: toTs(u.proExpires || null),
    createdAt: toTs(u.createdAt)!,
  });

  const mapPayment = (p: any): Payment => ({
    id: p.id,
    userId: p.userId || p.uid,
    amount: p.amount ?? 60,
    txHash: p.txHash,
    createdAt: toTs(p.createdAt)!,
  });

  const refreshProfile = async () => {
    try {
      const res = await fetch(`${API_BASE}/users.php?action=profile`, { credentials: 'include' });
      const data = await res.json();
      if (data?.user) {
        setUser(mapUser(data.user));
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshAdminData = async () => {
    if (!user || user.role !== 'admin') return;
    setAdminLoading(true);
    try {
      const uRes = await fetch(`${API_BASE}/users.php?action=admin_list`, { credentials: 'include', headers: withAdmin() });
      const uData = await uRes.json();
      setAllUsers((uData.users || []).map(mapUser));
    } catch {}
    try {
      const pRes = await fetch(`${API_BASE}/payments.php?action=admin_list`, { credentials: 'include', headers: withAdmin() });
      const pData = await pRes.json();
      setPayments((pData.payments || []).map(mapPayment));
    } catch {}
    setAdminLoading(false);
  };

  useEffect(() => {
    // Initialize session by fetching profile
    refreshProfile();
    // Auto-refresh every 30s and when tab visible or window focused
    const iv = setInterval(() => { refreshProfile(); }, 30000);
    const onVisibility = () => { if (document.visibilityState === 'visible') refreshProfile(); };
    const onFocus = () => refreshProfile();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(iv);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    if (user) {
      setSignalsLoading(true);
      setAdminLoading(true);
      (async () => {
        try {
          const sRes = await fetch(`${API_BASE}/signals.php?action=list`, { credentials: 'include' });
          const sData = await sRes.json();
          setSignals((sData.signals || []).map(mapSignal));
        } catch (e) {
          setSignals([]);
        } finally {
          setSignalsLoading(false);
        }
        if (user.role === 'admin') {
          try {
            const uRes = await fetch(`${API_BASE}/users.php?action=admin_list`, { credentials: 'include', headers: withAdmin() });
            const uData = await uRes.json();
            setAllUsers((uData.users || []).map(mapUser));
          } catch {}
          try {
            const pRes = await fetch(`${API_BASE}/payments.php?action=admin_list`, { credentials: 'include', headers: withAdmin() });
            const pData = await pRes.json();
            setPayments((pData.payments || []).map(mapPayment));
          } catch {}
          setAdminLoading(false);
        } else {
          setAllUsers([]);
          setPayments([]);
          setAdminLoading(false);
        }
      })();
    } else {
      setSignals([]);
      setAllUsers([]);
      setPayments([]);
      setSignalsLoading(false);
      setAdminLoading(false);
    }
  }, [user, loading]);

  const signup = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/users.php?action=register`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Signup failed');
    setUser(mapUser(data.user));
    return data.user;
  };

  const login = async (email: string, password: string): Promise<any> => {
    const res = await fetch(`${API_BASE}/users.php?action=login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Login failed');
    setUser(mapUser(data.user));
    return data.user;
  };

  const logout = async () => {
    await fetch(`${API_BASE}/users.php?action=logout`, {
      method: 'POST',
      credentials: 'include'
    });
    setUser(null);
  };

  const addSignal = async (signal: Omit<Signal, 'id' | 'createdBy' | 'createdAt'>) => {
    if (user?.role !== 'admin') throw new Error('Permission denied');
    const res = await fetch(`${API_BASE}/signals.php?action=add`, {
      method: 'POST',
      credentials: 'include',
      headers: withAdmin({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ signal })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to add');
    // Refresh list
    const sRes = await fetch(`${API_BASE}/signals.php?action=list`, { credentials: 'include' });
    const sData = await sRes.json();
    setSignals((sData.signals || []).map(mapSignal));
  };

  const updateSignal = async (id: string, signal: Partial<Omit<Signal, 'id'>>) => {
    if (user?.role !== 'admin') throw new Error('Permission denied');
    const res = await fetch(`${API_BASE}/signals.php?action=edit&id=${encodeURIComponent(id)}`, {
      method: 'POST',
      credentials: 'include',
      headers: withAdmin({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ id, signal })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to update');
    const sRes = await fetch(`${API_BASE}/signals.php?action=list`, { credentials: 'include' });
    const sData = await sRes.json();
    setSignals((sData.signals || []).map(mapSignal));
  };
  
  const deleteSignal = async (id: string) => {
    if (user?.role !== 'admin') throw new Error('Permission denied');
    const res = await fetch(`${API_BASE}/signals.php?action=delete`, {
      method: 'POST',
      credentials: 'include',
      headers: withAdmin({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ id })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to delete');
    const sRes = await fetch(`${API_BASE}/signals.php?action=list`, { credentials: 'include' });
    const sData = await sRes.json();
    setSignals((sData.signals || []).map(mapSignal));
  };
  
  const value = {
    user,
    signals,
    allUsers,
    payments,
    loading,
    signalsLoading,
    adminLoading,
    signup,
    login,
    logout,
    addSignal,
    updateSignal,
    deleteSignal,
    refreshProfile,
    refreshAdminData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
