import React, { useState, useEffect, useCallback } from 'react';
import {
    UsersRound, UserPlus, Wallet, Ticket, PackageCheck, Users,
    RefreshCw, Loader2, AlertCircle, Plane, Package, Briefcase,
    CreditCard, CheckCircle, XCircle, Hotel, Settings2, ArrowRight,
    Zap,
} from 'lucide-react';
import KpiCard from '../ui/KpiCard';
import OrderStatusTracker from '../ui/OrderStatusTracker';
import HighlightCard from '../ui/HighlightCard';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtAmt(n) {
    const v = Number(n) || 0;
    if (v === 0) return 'Rs. 0';
    if (v >= 1_000_000) return `Rs. ${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000)     return `Rs. ${(v / 1_000).toFixed(0)}k`;
    return `Rs. ${v.toFixed(0)}`;
}

function timeAgo(iso) {
    if (!iso) return '';
    const diff = Math.floor((Date.now() - new Date(iso + (iso.includes('+') ? '' : 'Z'))) / 1000);
    if (diff < 5)  return 'JUST NOW';
    if (diff < 60) return `${diff}S AGO`;
    if (diff < 3600) return `${Math.floor(diff / 60)} MINS AGO`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}H AGO`;
    return `${Math.floor(diff / 86400)}D AGO`;
}

const STATUS_STYLES = {
    approved:      'bg-green-50 text-green-600 border-green-100',
    done:          'bg-green-50 text-green-600 border-green-100',
    confirmed:     'bg-blue-50 text-blue-600 border-blue-100',
    booked:        'bg-blue-50 text-blue-600 border-blue-100',
    pending:       'bg-orange-50 text-orange-600 border-orange-100',
    underprocess:  'bg-yellow-50 text-yellow-600 border-yellow-100',
    under_process: 'bg-yellow-50 text-yellow-600 border-yellow-100',
    cancelled:     'bg-red-50 text-red-600 border-red-100',
    rejected:      'bg-red-50 text-red-600 border-red-100',
};

const StatusBadge = ({ status }) => {
    const k = (status || '').toLowerCase();
    return (
        <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-xl border-2 tracking-widest ${STATUS_STYLES[k] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
            {status || 'unknown'}
        </span>
    );
};

const BookingTypeIcon = ({ type }) => {
    const t = (type || '').toLowerCase();
    if (t.includes('ticket')) return <Plane size={14} className="text-blue-600" />;
    if (t.includes('umrah'))  return <Package size={14} className="text-purple-600" />;
    return <Briefcase size={14} className="text-slate-500" />;
};

// Skeleton pulse row
const SkeletonRow = () => (
    <tr className="animate-pulse">
        {[1,2,3,4].map(i => (
            <td key={i} className="px-8 py-5">
                <div className="h-3 bg-slate-100 rounded-lg w-3/4" />
            </td>
        ))}
    </tr>
);

// ── Main Component ────────────────────────────────────────────────────────────

const DashboardView = ({ onNavigate = () => {} }) => {
    const [data, setData]         = useState(null);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('access_token');
            if (!token) throw new Error('Not authenticated');
            const res = await fetch(`${API_BASE}/dashboard/org/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const b = await res.json().catch(() => ({}));
                throw new Error(b?.detail || `Server error ${res.status}`);
            }
            setData(await res.json());
        } catch (e) {
            setError(e.message || 'Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const kpis      = data?.kpis            || {};
    const portfolio = data?.portfolio       || {};
    const lastBook  = data?.last_booking;
    const lastDel   = data?.last_delivery;
    const bookings  = data?.recent_bookings || [];
    const activity  = data?.recent_activity || [];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">

            {/* Error */}
            {error && !loading && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-red-600">
                        <AlertCircle size={18} />
                        <span className="text-sm font-bold">{error}</span>
                    </div>
                    <button onClick={load} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-xl">
                        <RefreshCw size={12} /> Retry
                    </button>
                </div>
            )}

            {/* Refresh */}
            <div className="flex justify-end">
                <button onClick={load} disabled={loading}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white border border-slate-200 hover:border-blue-300 text-slate-500 hover:text-blue-600 px-4 py-2.5 rounded-2xl shadow-sm transition-all disabled:opacity-50">
                    {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                    {loading ? 'Loading...' : 'Refresh'}
                </button>
            </div>

            {/* ── Row 1: Agent KPIs ─────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <KpiCard
                    label="Working Agents"
                    value={loading ? '—' : String(kpis.working_agents ?? 0)}
                    subtext={loading ? '' : `${kpis.total_agents ?? 0} total agents`}
                    icon={<UsersRound className="text-blue-600" size={24} />}
                />
                <KpiCard
                    label="New Agents (This Month)"
                    value={loading ? '—' : String(kpis.new_agents_this_month ?? 0)}
                    subtext="Added this month"
                    icon={<UserPlus className="text-blue-400" size={24} />}
                />
                <KpiCard
                    label="Recovery Pending"
                    value={loading ? '—' : fmtAmt(kpis.recovery_pending ?? 0)}
                    subtext="Pending Payments"
                    icon={<Wallet className="text-orange-500" size={24} />}
                />
            </div>

            {/* ── Row 2: Employee KPIs ──────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <KpiCard
                    label="Working Employees"
                    value={loading ? '—' : String(kpis.working_employees ?? 0)}
                    subtext="ORG active staff"
                    icon={<Users className="text-green-600" size={24} />}
                />
                <KpiCard
                    label="Total Employees"
                    value={loading ? '—' : String(kpis.total_employees ?? 0)}
                    subtext="All ORG employees"
                    icon={<Users className="text-slate-500" size={24} />}
                />
            </div>

            {/* ── Row 3: Portfolio Trackers ─────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <OrderStatusTracker
                    label="Tickets"
                    total={loading ? 0 : (portfolio.tickets?.total || 0)}
                    done={loading ? 0 : (portfolio.tickets?.done || 0)}
                    booked={loading ? 0 : (portfolio.tickets?.booked || 0)}
                    cancelled={loading ? 0 : (portfolio.tickets?.cancelled || 0)}
                />
                <OrderStatusTracker
                    label="Umrah Packages"
                    total={loading ? 0 : (portfolio.umrah?.total || 0)}
                    done={loading ? 0 : (portfolio.umrah?.done || 0)}
                    booked={loading ? 0 : (portfolio.umrah?.booked || 0)}
                    cancelled={loading ? 0 : (portfolio.umrah?.cancelled || 0)}
                />
                <OrderStatusTracker
                    label="Custom Packages"
                    total={loading ? 0 : (portfolio.custom?.total || 0)}
                    done={loading ? 0 : (portfolio.custom?.done || 0)}
                    booked={loading ? 0 : (portfolio.custom?.booked || 0)}
                    cancelled={loading ? 0 : (portfolio.custom?.cancelled || 0)}
                />
            </div>

            {/* ── Row 4: Highlight Cards ────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {loading ? (
                    <>
                        <div className="h-32 bg-white rounded-[40px] border border-slate-100 animate-pulse" />
                        <div className="h-32 bg-white rounded-[40px] border border-slate-100 animate-pulse" />
                    </>
                ) : (
                    <>
                        <HighlightCard
                            label="Last Booking"
                            title={lastBook ? `${lastBook.booking_type.toUpperCase()} — ${lastBook.agent_name}` : 'No bookings yet'}
                            sub={lastBook ? `${fmtAmt(lastBook.amount)} • ${lastBook.reference}` : '—'}
                            time={lastBook ? timeAgo(lastBook.created_at) : '—'}
                            icon={<Ticket size={24} />}
                            color="blue"
                        />
                        <HighlightCard
                            label="Last Delivery"
                            title={lastDel ? `${lastDel.booking_type.toUpperCase()} — ${lastDel.reference}` : 'No deliveries yet'}
                            sub={lastDel ? `Approved · ${lastDel.agent_name}` : '—'}
                            time={lastDel ? timeAgo(lastDel.created_at) : '—'}
                            icon={<PackageCheck size={24} />}
                            color="green"
                        />
                    </>
                )}
            </div>

            {/* ── Row 5: Recent Bookings ────────────────────────────────────── */}
            <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 md:p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Recent Bookings</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            ALL ORG BOOKINGS — BRANCHES, AGENCIES &amp; EMPLOYEES
                        </p>
                    </div>
                    <button onClick={load} disabled={loading}
                        className="bg-blue-600 text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:scale-105 transition-all disabled:opacity-50 flex items-center gap-2">
                        {loading && <Loader2 size={12} className="animate-spin" />}
                        {loading ? 'Loading...' : 'Refresh'}
                    </button>
                </div>
                <div className="overflow-x-auto w-full scrollbar-hide">
                    <table className="w-full text-left min-w-[700px]">
                        <thead className="bg-slate-50/50">
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">
                                <th className="px-8 py-5">Agent / Reference</th>
                                <th className="px-8 py-5">Type</th>
                                <th className="px-8 py-5">Amount</th>
                                <th className="px-8 py-5">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array.from({length: 5}).map((_, i) => <SkeletonRow key={i} />)
                            ) : bookings.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-12 text-center text-xs font-black text-slate-400 uppercase tracking-widest">
                                        No bookings found for this organization
                                    </td>
                                </tr>
                            ) : (
                                bookings.map((b, i) => (
                                    <tr key={i} className="hover:bg-blue-50/20 transition-all group cursor-pointer">
                                        <td className="px-8 py-6">
                                            <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">{b.agent_name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 tracking-tighter">{b.reference}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                                <BookingTypeIcon type={b.booking_type} />
                                                {b.booking_type}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-sm font-black text-blue-600 tracking-tighter">
                                            {b.amount > 0 ? fmtAmt(b.amount) : '—'}
                                        </td>
                                        <td className="px-8 py-6">
                                            <StatusBadge status={b.status} />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Row 6: Activity Feed ──────────────────────────────────────── */}
            <ActivityFeed events={activity} loading={loading} onNavigate={onNavigate} />

        </div>
    );
};

// ── Activity helpers ──────────────────────────────────────────────────────────

const ACTIVITY_CONFIG = {
    booking_created:   { icon: Plane,        bg: 'bg-blue-50',    ring: 'ring-blue-100',   label: 'Booking' },
    payment_submitted: { icon: CreditCard,   bg: 'bg-orange-50',  ring: 'ring-orange-100', label: 'Payment' },
    payment_status:    { icon: CheckCircle,  bg: 'bg-green-50',   ring: 'ring-green-100',  label: 'Payment' },
    package_created:   { icon: Package,      bg: 'bg-purple-50',  ring: 'ring-purple-100', label: 'Package' },
    package_updated:   { icon: Package,      bg: 'bg-purple-50',  ring: 'ring-purple-100', label: 'Package' },
    hotel_created:     { icon: Hotel,        bg: 'bg-teal-50',    ring: 'ring-teal-100',   label: 'Hotel' },
    hotel_updated:     { icon: Hotel,        bg: 'bg-teal-50',    ring: 'ring-teal-100',   label: 'Hotel' },
    config_saved:      { icon: Settings2,    bg: 'bg-slate-50',   ring: 'ring-slate-100',  label: 'Config' },
};

const ICON_COLORS = {
    booking_created:   'text-blue-600',
    payment_submitted: 'text-orange-500',
    payment_status:    'text-green-600',
    package_created:   'text-purple-600',
    package_updated:   'text-purple-600',
    hotel_created:     'text-teal-600',
    hotel_updated:     'text-teal-600',
    config_saved:      'text-slate-500',
};

// Override icon color based on status for payment_status events
function resolvePaymentStatusIcon(status = '') {
    const s = status.toLowerCase();
    if (s === 'rejected' || s === 'cancelled') return { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', ring: 'ring-red-100' };
    return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', ring: 'ring-green-100' };
}

const NAV_LABELS = {
    'Tickets':    'Tickets',
    'Packages':   'Packages',
    'Others':     'Others',
    'Finance Hub':'Finance Hub',
    'Hotels':     'Hotels',
    'Agencies':   'Agencies',
    'Employees':  'Employees',
};

const SkeletonActivity = () => (
    <div className="animate-pulse flex items-center gap-4 px-8 py-5 border-b border-slate-50">
        <div className="w-10 h-10 rounded-2xl bg-slate-100 shrink-0" />
        <div className="flex-1 space-y-2">
            <div className="h-3 bg-slate-100 rounded w-1/3" />
            <div className="h-2.5 bg-slate-100 rounded w-1/2" />
        </div>
        <div className="h-3 bg-slate-100 rounded w-16" />
    </div>
);

const ActivityFeed = ({ events, loading, onNavigate }) => {
    return (
        <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-slate-50 flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-amber-50 ring-4 ring-amber-50">
                    <Zap size={20} className="text-amber-500" />
                </div>
                <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Activity Feed</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        LATEST EVENTS — BOOKINGS, PAYMENTS, PACKAGES, HOTELS &amp; MORE
                    </p>
                </div>
            </div>

            {/* List */}
            <div className="divide-y divide-slate-50/80">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => <SkeletonActivity key={i} />)
                ) : events.length === 0 ? (
                    <div className="px-8 py-14 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            No recent activity found
                        </p>
                    </div>
                ) : (
                    events.map((ev, i) => {
                        const cfg   = ACTIVITY_CONFIG[ev.event_type] || ACTIVITY_CONFIG.config_saved;
                        const iconColor = ICON_COLORS[ev.event_type] || 'text-slate-500';

                        // Special override for payment_status
                        let IconComp  = cfg.icon;
                        let bgClass   = cfg.bg;
                        let ringClass = cfg.ring;
                        let iconCls   = iconColor;
                        if (ev.event_type === 'payment_status') {
                            const ov = resolvePaymentStatusIcon(ev.status);
                            IconComp  = ov.icon;
                            iconCls   = ov.color;
                            bgClass   = ov.bg;
                            ringClass = ov.ring;
                        }

                        const hasAmount = ev.amount && ev.amount > 0;
                        const hasStatus = ev.status && ev.status !== '';
                        const navLabel  = NAV_LABELS[ev.navigate_to] || ev.navigate_to;

                        return (
                            <div
                                key={i}
                                role="button"
                                tabIndex={0}
                                onClick={() => onNavigate(ev.navigate_to)}
                                onKeyDown={e => e.key === 'Enter' && onNavigate(ev.navigate_to)}
                                className="flex items-center gap-4 px-6 md:px-8 py-5 hover:bg-blue-50/20 cursor-pointer transition-all group"
                            >
                                {/* Icon bubble */}
                                <div className={`shrink-0 w-10 h-10 rounded-2xl ${bgClass} ring-4 ${ringClass} flex items-center justify-center`}>
                                    <IconComp size={16} className={iconCls} />
                                </div>

                                {/* Text */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black text-slate-900 uppercase tracking-tight truncate">
                                        {ev.title}
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-400 truncate mt-0.5">
                                        {ev.subtitle}
                                    </p>

                                    {/* Badges row */}
                                    {(hasAmount || hasStatus) && (
                                        <div className="flex items-center gap-2 mt-1.5">
                                            {hasAmount && (
                                                <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">
                                                    {fmtAmt(ev.amount)}
                                                </span>
                                            )}
                                            {hasStatus && (
                                                <StatusBadge status={ev.status} />
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Right side: time + nav */}
                                <div className="shrink-0 text-right flex flex-col items-end gap-2">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        {timeAgo(ev.created_at)}
                                    </span>
                                    <span className="flex items-center gap-1 text-[9px] font-black text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">
                                        {navLabel} <ArrowRight size={10} />
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default DashboardView;
