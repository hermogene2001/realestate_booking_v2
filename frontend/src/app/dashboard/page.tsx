'use client';

import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import { formatEth } from '@/lib/utils';
import PropertyCard from '@/components/property/PropertyCard';
import {
  Home, Building2, CalendarCheck, DollarSign, TrendingUp, Users,
  MessageSquare, Bell, CreditCard, ShieldCheck, Lock, User,
  Plus, ArrowRight, Eye, Clock, CheckCircle2, AlertCircle,
} from 'lucide-react';

const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  LOCKED: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-slate-100 text-slate-600',
  DISPUTED: 'bg-red-100 text-red-700',
};

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-slate-500">{t('dashboard.please_login')}</p>
        <Link href="/login" className="text-blue-600 font-medium mt-2 inline-block">{t('nav.login')}</Link>
      </div>
    );
  }

  const { data: bookings } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: async () => { const { data } = await api.get('/bookings'); return data.bookings; },
    enabled: !!user,
  });

  const { data: propertiesData } = useQuery({
    queryKey: ['my-properties'],
    queryFn: async () => { const { data } = await api.get('/properties/owner/mine'); return data.properties; },
    enabled: user?.role === 'OWNER',
  });

  const { data: notifData } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: async () => { const { data } = await api.get('/notifications?unread=true&limit=1'); return data; },
    enabled: !!user,
  });

  const properties = (propertiesData || []) as Record<string, any>[];
  const allBookings = (bookings || []) as Record<string, any>[];
  const unreadNotifs = notifData?.total || 0;

  // For OWNER: filter bookings that belong to their properties
  const ownerPropertyIds = new Set(properties.map(p => p.id));
  const ownerBookings = user?.role === 'OWNER'
    ? allBookings.filter(b => ownerPropertyIds.has(b.propertyId) || ownerPropertyIds.has(b.property?.id))
    : allBookings;

  const activeBookings = ownerBookings.filter(b => ['PENDING', 'LOCKED'].includes(b.status));
  const pendingBookings = ownerBookings.filter(b => b.status === 'PENDING');
  const completedBookings = ownerBookings.filter(b => b.status === 'COMPLETED');
  const totalEarned = completedBookings.reduce((sum, b) => sum + Number(b.escrowAmount || 0), 0);
  const propertyIdsWithBookings = new Set(ownerBookings.map(b => b.propertyId || b.property?.id));
  const occupiedCount = properties.filter(p => propertyIdsWithBookings.has(p.id) && activeBookings.some(b => (b.propertyId || b.property?.id) === p.id)).length;

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const tenantDashboard = () => (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: t('dashboard.active_bookings'), value: activeBookings.length, icon: CalendarCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: t('dashboard.completed'), value: completedBookings.length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: t('dashboard.total_paid'), value: allBookings.reduce((s, b) => s + Number(b.escrowAmount || 0), 0).toFixed(3) + ' ETH', icon: DollarSign, color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: t('dashboard.notifications'), value: unreadNotifs > 0 ? `${unreadNotifs} ${t('dashboard.unread')}` : t('dashboard.all_clear'), icon: Bell, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">{card.label}</p>
                <div className={`${card.bg} p-2 rounded-xl`}><Icon className={`w-4 h-4 ${card.color}`} /></div>
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-5">{t('dashboard.quick_actions')}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: t('dashboard.browse_properties'), href: '/properties', icon: Home, desc: t('dashboard.find_your_home'), color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: t('dashboard.my_bookings'), href: '/bookings', icon: CalendarCheck, desc: `${activeBookings.length} ${t('dashboard.active')}`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: t('dashboard.messages'), href: '/messages', icon: MessageSquare, desc: t('dashboard.messages_desc'), color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: t('dashboard.notifications'), href: '/notifications', icon: Bell, desc: unreadNotifs > 0 ? `${unreadNotifs} ${t('dashboard.unread')}` : t('dashboard.all_caught_up'), color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map(item => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="group flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 hover:border-slate-200 hover:shadow-sm transition">
                <div className={`${item.bg} p-3 rounded-xl`}><Icon className={`w-5 h-5 ${item.color}`} /></div>
                <div><p className="text-sm font-semibold text-slate-900">{item.label}</p><p className="text-xs text-slate-500">{item.desc}</p></div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Active Bookings */}
      {activeBookings.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between p-6 pb-4">
            <h2 className="text-lg font-semibold text-slate-900">{t('dashboard.active_bookings')}</h2>
            <Link href="/bookings" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">{t('dashboard.view_all')} <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="divide-y divide-slate-100">
            {activeBookings.slice(0, 5).map(booking => {
              const prop = booking.property;
              return (
                <Link key={booking.id} href={`/bookings/${booking.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><Home className="w-5 h-5 text-blue-600" /></div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{prop?.title || `Property #${booking.propertyId}`}</p>
                      <p className="text-xs text-slate-500">{prop?.location || ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-slate-700">{formatEth(booking.escrowAmount)} ETH</span>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusColors[booking.status as string] || 'bg-slate-100 text-slate-700'}`}>{booking.status}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const ownerDashboard = () => (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: t('dashboard.total_properties'), value: properties.length, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50', sub: `${properties.filter(p => p.isApproved).length} ${t('dashboard.approved')}` },
          { label: t('dashboard.active_bookings'), value: activeBookings.length, icon: CalendarCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', sub: `${pendingBookings.length} ${t('dashboard.pending_confirmation')}` },
          { label: t('dashboard.total_earned'), value: `${totalEarned.toFixed(3)} ETH`, icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50', sub: `~$${(totalEarned * 2500).toLocaleString()} USD` },
          { label: t('dashboard.occupied'), value: `${properties.length ? Math.round((occupiedCount / properties.length) * 100) : 0}%`, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50', sub: `${occupiedCount} ${t('dashboard.of')} ${properties.length} ${t('dashboard.properties')}` },
        ].map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">{card.label}</p>
                <div className={`${card.bg} p-2 rounded-xl`}><Icon className={`w-4 h-4 ${card.color}`} /></div>
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{card.value}</p>
              <p className="mt-1 text-xs text-slate-500">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Revenue & Bookings Overview */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Earnings Summary */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-slate-900">{t('dashboard.earnings_summary')}</h2>
            <Link href="/payments" className="text-sm text-blue-600 hover:text-blue-700 font-medium">{t('dashboard.details')}</Link>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50"><CheckCircle2 className="w-4 h-4 text-emerald-600" /></div>
                <div><p className="text-sm font-medium text-slate-900">{t('dashboard.completed_bookings')}</p><p className="text-xs text-slate-500">{completedBookings.length} {t('dashboard.bookings')}</p></div>
              </div>
              <p className="text-lg font-bold text-emerald-600">{totalEarned.toFixed(3)} ETH</p>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-50"><Clock className="w-4 h-4 text-amber-600" /></div>
                <div><p className="text-sm font-medium text-slate-900">{t('dashboard.pending_payouts')}</p><p className="text-xs text-slate-500">{pendingBookings.length} {t('dashboard.awaiting_confirmation')}</p></div>
              </div>
              <p className="text-lg font-bold text-amber-600">{pendingBookings.reduce((s, b) => s + Number(b.escrowAmount || 0), 0).toFixed(3)} ETH</p>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50"><DollarSign className="w-4 h-4 text-blue-600" /></div>
                <div><p className="text-sm font-medium text-slate-900">{t('dashboard.lifetime_earnings')}</p><p className="text-xs text-slate-500">{t('dashboard.all_time_total')}</p></div>
              </div>
              <p className="text-lg font-bold text-slate-900">{totalEarned.toFixed(3)} ETH</p>
            </div>
          </div>
        </div>

        {/* Booking Status Distribution */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-slate-900">{t('dashboard.booking_status')}</h2>
            <Link href="/bookings" className="text-sm text-blue-600 hover:text-blue-700 font-medium">{t('dashboard.view_all')}</Link>
          </div>
          <div className="space-y-3">
            {[
              { label: t('booking.pending'), count: pendingBookings.length, color: 'bg-amber-500', textColor: 'text-amber-700', bgColor: 'bg-amber-50' },
              { label: t('dashboard.active'), count: activeBookings.filter(b => b.status === 'LOCKED').length, color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-50' },
              { label: t('booking.completed'), count: completedBookings.length, color: 'bg-emerald-500', textColor: 'text-emerald-700', bgColor: 'bg-emerald-50' },
              { label: t('booking.disputed'), count: ownerBookings.filter(b => b.status === 'DISPUTED').length, color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-50' },
            ].map(item => {
              const pct = ownerBookings.length ? Math.round((item.count / ownerBookings.length) * 100) : 0;
              return (
                <div key={item.label} className="flex items-center gap-3">
                  <span className={`text-xs font-semibold w-20 ${item.textColor}`}>{item.label}</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-medium text-slate-600 w-16 text-right">{item.count} ({pct}%)</span>
                </div>
              );
            })}
          </div>
          {ownerBookings.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-8">{t('dashboard.no_bookings')}</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-slate-900">{t('dashboard.quick_actions')}</h2>
          <Link href="/properties/create" className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-sm">
            <Plus className="w-4 h-4" /> {t('dashboard.add_property')}
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: t('dashboard.my_properties'), href: '/properties/mine', icon: Home, desc: `${properties.length} ${t('dashboard.listings')}` },
            { label: t('dashboard.messages'), href: '/messages', icon: MessageSquare, desc: t('dashboard.respond_tenants') },
            { label: t('dashboard.notifications'), href: '/notifications', icon: Bell, desc: unreadNotifs > 0 ? `${unreadNotifs} ${t('dashboard.unread')}` : t('dashboard.all_caught_up') },
            { label: t('dashboard.disputes'), href: '/disputes', icon: ShieldCheck, desc: t('dashboard.resolve_issues') },
            { label: t('dashboard.kyc'), href: '/kyc', icon: Users, desc: t('dashboard.verify_identity') },
            { label: t('dashboard.payments'), href: '/payments', icon: CreditCard, desc: `${completedBookings.length} ${t('dashboard.completed')}` },
            { label: t('dashboard.security'), href: '/2fa', icon: Lock, desc: t('dashboard.twofa') },
            { label: t('nav.profile'), href: '/profile', icon: User, desc: t('dashboard.account_details') },
          ].map(item => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 hover:border-slate-200 hover:shadow-sm transition">
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <Icon className="w-4 h-4 text-slate-600 group-hover:text-blue-600 transition" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Properties Performance */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-lg font-semibold text-slate-900">{t('dashboard.properties_overview')}</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">{properties.filter(p => p.isApproved).length} {t('dashboard.approved')} · {properties.filter(p => !p.isApproved).length} {t('dashboard.pending')}</span>
            <Link href="/properties/mine" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">{t('dashboard.manage')} <ArrowRight className="w-3 h-3" /></Link>
          </div>
        </div>
        {properties.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {properties.map(property => {
              const propBookings = ownerBookings.filter(b => (b.propertyId || b.property?.id) === property.id);
              const propActive = propBookings.filter(b => ['PENDING', 'LOCKED'].includes(b.status));
              const propEarned = propBookings.filter(b => b.status === 'COMPLETED').reduce((s, b) => s + Number(b.escrowAmount || 0), 0);
              return (
                <Link key={property.id} href={`/properties/${property.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0"><Home className="w-5 h-5 text-blue-600" /></div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{property.title}</p>
                      <p className="text-xs text-slate-500">{property.district} · {property.bedrooms} bed · {Number(property.priceEth).toFixed(2)} ETH/mo</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">{propActive.length}</p>
                      <p className="text-xs text-slate-500">{t('dashboard.active')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-emerald-600">{propEarned.toFixed(2)} ETH</p>
                      <p className="text-xs text-slate-500">{t('dashboard.earned')}</p>
                    </div>
                    <div className={`px-2.5 py-1 rounded-lg text-xs font-medium ${property.isApproved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {property.isApproved ? t('dashboard.approved') : t('dashboard.pending')}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4"><Home className="w-6 h-6 text-slate-400" /></div>
            <p className="text-sm font-medium text-slate-900">{t('dashboard.no_properties')}</p>
            <p className="text-xs text-slate-500 mt-1 mb-4">{t('dashboard.no_properties_desc')}</p>
            <Link href="/properties/create" className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
              <Plus className="w-4 h-4" /> {t('dashboard.add_property')}
            </Link>
          </div>
        )}
      </div>

      {/* Recent Bookings */}
      {activeBookings.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between p-6 pb-4">
            <h2 className="text-lg font-semibold text-slate-900">{t('dashboard.recent_bookings')}</h2>
            <Link href="/bookings" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">{t('dashboard.view_all')} <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="divide-y divide-slate-100">
            {activeBookings.slice(0, 5).map(booking => {
              const prop = booking.property || properties.find(p => p.id === (booking.propertyId || booking.property?.id));
              return (
                <Link key={booking.id} href={`/bookings/${booking.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><CalendarCheck className="w-5 h-5 text-emerald-600" /></div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{prop?.title || `Property #${booking.propertyId}`}</p>
                      <p className="text-xs text-slate-500">Tenant · {new Date(booking.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-700">{formatEth(booking.escrowAmount)} ETH</span>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusColors[booking.status as string] || 'bg-slate-100 text-slate-700'}`}>{booking.status}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-slate-900">
                {user.role === 'OWNER' ? t('dashboard.owner_dashboard') : t('dashboard.tenant_dashboard')}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold ${
                user.role === 'OWNER' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
              }`}>
                {user.role === 'OWNER' ? t('dashboard.owner_label') : t('dashboard.tenant_label')}
              </span>
            </div>
            <p className="text-sm text-slate-500">
              {t('dashboard.welcome_back')}, <span className="font-medium text-slate-700">{user.name || user.email}</span> · {dateStr}
            </p>
          </div>
          {user.role === 'OWNER' && (
            <Link
              href="/properties/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
            >
              <Plus className="w-4 h-4" /> {t('dashboard.add_new_property')}
            </Link>
          )}
        </div>
      </div>

      {/* Role-specific content */}
      {user.role === 'OWNER' ? ownerDashboard() : tenantDashboard()}
    </div>
  );
}
