'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const PAGE_TITLES: Record<string, { title: string; description: string }> = {
  '/admin': { title: 'Dashboard', description: 'Platform overview and key metrics' },
  '/admin/reports': { title: 'Reports & Analytics', description: 'Month-over-month trends and platform insights' },
  '/admin/users': { title: 'User Management', description: 'Manage platform users, roles, and access' },
  '/admin/properties': { title: 'Property Management', description: 'Review and manage listed properties' },
  '/admin/properties/status': { title: 'Property Status Overview', description: 'View all properties, their listing status and approval state' },
  '/admin/bookings': { title: 'Booking Management', description: 'Monitor bookings and escrow states' },
  '/admin/reviews': { title: 'Review Moderation', description: 'Moderate and manage property reviews' },
  '/admin/transactions': { title: 'Transaction Ledger', description: 'Blockchain transaction history' },
  '/admin/payments': { title: 'Payments', description: 'MoMo, card, and ETH payment records' },
  '/admin/commissions': { title: 'Commissions', description: 'Platform fees and owner payouts' },
  '/admin/promo-codes': { title: 'Promo Codes', description: 'Create and manage discount codes' },
  '/admin/kyc': { title: 'KYC Verification', description: 'Review and approve user identity documents' },
  '/admin/disputes': { title: 'Dispute Resolution', description: 'Manage and resolve booking disputes' },
  '/admin/fraud': { title: 'Fraud Detection', description: 'Monitor suspicious activity and alerts' },
  '/admin/blog': { title: 'Blog / CMS', description: 'Create and manage blog posts and content' },
};

export default function AdminTopbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const pageInfo = PAGE_TITLES[pathname] || { title: 'Admin', description: '' };

  return (
    <header className="h-20 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-8 shrink-0 shadow-sm shadow-slate-900/30">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 mb-1">Admin Control Center</p>
        <h1 className="text-xl font-semibold text-white tracking-tight">{pageInfo.title}</h1>
        <p className="text-sm text-slate-400">{pageInfo.description}</p>
      </div>
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2 rounded-full bg-slate-900/80 px-4 py-2 text-xs text-slate-300 border border-slate-800">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>System online</span>
        </div>
        <div className="flex items-center gap-3 rounded-3xl bg-slate-900/80 px-4 py-2 border border-slate-800">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-semibold text-slate-100">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{user?.name}</p>
            <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  );
}
