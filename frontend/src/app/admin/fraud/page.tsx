'use client';

import { useAuth } from '@/context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { formatDateTime } from '@/lib/utils';
import { useState } from 'react';

interface FraudAlert {
  id: number;
  userId: number | null;
  alertType: string;
  severity: string;
  description: string;
  metadata: Record<string, unknown>;
  isResolved: boolean;
  createdAt: string;
  user?: { id: number; name: string; email: string; role: string } | null;
}

interface FraudStats {
  total: number;
  unresolved: number;
  highSeverity: number;
  byType: Array<{ type: string; count: number }>;
}

export default function FraudPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showResolved, setShowResolved] = useState(false);
  const [scanning, setScanning] = useState(false);

  const { data: stats } = useQuery<FraudStats>({
    queryKey: ['fraud-stats'],
    queryFn: async () => { const { data } = await api.get('/admin/fraud-alerts/stats'); return data; },
    enabled: user?.role === 'ADMIN',
  });

  const { data: alertsData, isLoading } = useQuery<FraudAlert[]>({
    queryKey: ['fraud-alerts', showResolved],
    queryFn: async () => {
      const { data } = await api.get(`/admin/fraud-alerts?resolved=${showResolved}`);
      return data.alerts;
    },
    enabled: user?.role === 'ADMIN',
  });

  const handleScan = async () => {
    setScanning(true);
    try {
      const { data } = await api.post('/admin/fraud-alerts/scan');
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['fraud-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['fraud-stats'] });
    } catch {
      toast.error('Scan failed');
    } finally {
      setScanning(false);
    }
  };

  const handleResolve = async (alertId: number) => {
    try {
      await api.patch(`/admin/fraud-alerts/${alertId}`);
      toast.success('Alert resolved');
      queryClient.invalidateQueries({ queryKey: ['fraud-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['fraud-stats'] });
    } catch {
      toast.error('Failed to resolve alert');
    }
  };

  const getAlertTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      rapid_bookings: 'Rapid Bookings',
      rapid_cancellations: 'Rapid Cancellations',
      quick_handover: 'Quick Handover',
    };
    return labels[type] || type;
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'rapid_bookings':
        return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
      case 'rapid_cancellations':
        return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
      default:
        return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats + Actions */}
      <div className="flex items-start justify-between gap-6">
        <div className="grid grid-cols-4 gap-4 flex-1">
          {[
            { label: 'Total Alerts', value: stats?.total || 0, gradient: 'var(--admin-gradient-blue)' },
            { label: 'Unresolved', value: stats?.unresolved || 0, gradient: 'var(--admin-gradient-amber)' },
            { label: 'High Severity', value: stats?.highSeverity || 0, gradient: 'var(--admin-gradient-rose)' },
            { label: 'Rule Types Active', value: stats?.byType?.length || 0, gradient: 'var(--admin-gradient-violet)' },
          ].map((s, i) => (
            <div key={i} className="admin-card p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{s.label}</p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{s.value}</p>
              <div className="w-full h-1 rounded-full bg-slate-100 mt-3">
                <div className="h-1 rounded-full" style={{ background: s.gradient, width: s.value ? '100%' : '0%' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alert Type Breakdown + Scan Button */}
      <div className="admin-card p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-semibold text-slate-900">Detection Rules</h3>
          <div className="flex gap-2">
            {[
              { type: 'rapid_bookings', desc: '>5 bookings in 24h', color: 'bg-blue-50 text-blue-700 border-blue-200' },
              { type: 'rapid_cancellations', desc: '>3 cancels in 7d', color: 'bg-amber-50 text-amber-700 border-amber-200' },
              { type: 'quick_handover', desc: '<10min to complete', color: 'bg-rose-50 text-rose-700 border-rose-200' },
            ].map(rule => (
              <div key={rule.type} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${rule.color}`}>
                {getAlertTypeIcon(rule.type)}
                <span>{getAlertTypeLabel(rule.type)}</span>
                <span className="text-[10px] opacity-70">({rule.desc})</span>
              </div>
            ))}
          </div>
        </div>
        <button onClick={handleScan} disabled={scanning} className="admin-btn-primary flex items-center gap-2">
          {scanning ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
          {scanning ? 'Scanning...' : 'Run Scan'}
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {[
          { label: 'Active', value: false, count: stats?.unresolved || 0 },
          { label: 'Resolved', value: true, count: (stats?.total || 0) - (stats?.unresolved || 0) },
        ].map(tab => (
          <button
            key={String(tab.value)}
            onClick={() => setShowResolved(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              showResolved === tab.value
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
            <span className={`ml-2 text-xs tabular-nums ${showResolved === tab.value ? 'text-slate-300' : 'text-slate-400'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="admin-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : alertsData && alertsData.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {alertsData.map((alert) => (
              <div key={alert.id} className="px-6 py-4 hover:bg-slate-50/50 transition-colors animate-fade-in">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      alert.severity === 'high' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {getAlertTypeIcon(alert.alertType)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`admin-badge text-[10px] uppercase ${
                          alert.severity === 'high'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {alert.severity}
                        </span>
                        <span className="text-xs font-medium text-slate-500">{getAlertTypeLabel(alert.alertType)}</span>
                        {alert.isResolved && (
                          <span className="admin-badge text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">Resolved</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-700 mb-1.5">{alert.description}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        {alert.user ? (
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            <span className="font-medium text-slate-600">{alert.user.name}</span>
                            <span>({alert.user.email})</span>
                          </span>
                        ) : (
                          <span>Unknown user</span>
                        )}
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          {formatDateTime(alert.createdAt)}
                        </span>
                      </div>
                      {alert.metadata && Object.keys(alert.metadata).length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {Object.entries(alert.metadata).map(([key, value]) => (
                            <span key={key} className="px-2 py-0.5 bg-slate-50 border border-slate-100 rounded text-[10px] text-slate-500 font-mono">
                              {key}: {String(value)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {!alert.isResolved && (
                    <button
                      onClick={() => handleResolve(alert.id)}
                      className="admin-btn-secondary text-xs shrink-0"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-600">
              {showResolved ? 'No resolved alerts' : 'No active fraud alerts'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {showResolved ? 'Resolved alerts will appear here' : 'Click "Run Scan" to check for suspicious activity'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
