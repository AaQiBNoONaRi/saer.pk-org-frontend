import React, { useEffect, useState } from 'react';
import { reportsAPI } from '../../../services/financeService';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, RefreshCw } from 'lucide-react';

const KPICard = ({ title, value, icon: Icon, color, sub }) => (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shrink-0`}>
            <Icon size={22} className="text-white" />
        </div>
        <div className="min-w-0">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
            <p className="text-2xl font-black text-slate-800">
                {typeof value === 'number' ? value.toLocaleString('en-PK', { minimumFractionDigits: 0 }) : value ?? '—'}
            </p>
            {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
    </div>
);

export default function FinanceDashboard({ onNavigate }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ date_from: '', date_to: '' });

    const load = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filter.date_from) params.date_from = filter.date_from;
            if (filter.date_to) params.date_to = filter.date_to;
            const res = await reportsAPI.dashboard(params);
            setData(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const kpis = data ? [
        {
            title: 'Total Revenue',
            value: data.revenue,
            icon: DollarSign,
            color: 'bg-blue-600',
            sub: 'All income accounts',
        },
        {
            title: 'Gross Profit',
            value: data.gross_profit,
            icon: TrendingUp,
            color: data.gross_profit >= 0 ? 'bg-emerald-500' : 'bg-red-500',
            sub: 'Revenue minus Cost of Sales',
        },
        {
            title: 'Net Profit',
            value: data.net_profit,
            icon: data.net_profit >= 0 ? TrendingUp : TrendingDown,
            color: data.net_profit >= 0 ? 'bg-emerald-600' : 'bg-red-600',
            sub: 'Revenue minus all expenses',
        },
        {
            title: 'Outstanding Receivables',
            value: data.outstanding_receivables,
            icon: AlertCircle,
            color: 'bg-amber-500',
            sub: 'Accounts Receivable balance',
        },
        {
            title: 'Outstanding Payables',
            value: data.outstanding_payables,
            icon: AlertCircle,
            color: 'bg-rose-500',
            sub: 'Supplier Payable balance',
        },
    ] : [];

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">Finance Dashboard</h1>
                    <p className="text-slate-400 text-sm mt-1">Real-time accounting overview</p>
                </div>
                <button
                    onClick={load}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Date filter */}
            <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Period:</span>
                <input type="date" value={filter.date_from}
                    onChange={e => setFilter(f => ({ ...f, date_from: e.target.value }))}
                    className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <span className="text-slate-300">→</span>
                <input type="date" value={filter.date_to}
                    onChange={e => setFilter(f => ({ ...f, date_to: e.target.value }))}
                    className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button onClick={load}
                    className="px-4 py-1.5 bg-slate-800 text-white text-sm font-bold rounded-lg hover:bg-slate-700">
                    Apply
                </button>
                <button onClick={() => { setFilter({ date_from: '', date_to: '' }); setTimeout(load, 100); }}
                    className="px-4 py-1.5 border border-slate-200 text-slate-500 text-sm font-bold rounded-lg hover:bg-slate-50">
                    Clear
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-40">
                    <RefreshCw size={32} className="animate-spin text-blue-400" />
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
                        {kpis.map(k => <KPICard key={k.title} {...k} />)}
                    </div>

                    {/* Quick-links */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            ['Chart of Accounts', 'Finance/COA'],
                            ['Journal Entries', 'Finance/Journal'],
                            ['Profit & Loss', 'Finance/Reports/PL'],
                            ['Balance Sheet', 'Finance/Reports/BS'],
                            ['Trial Balance', 'Finance/Reports/TB'],
                            ['Manual Entry', 'Finance/ManualEntry'],
                            ['Audit Trail', 'Finance/AuditTrail'],
                        ].map(([label, tab]) => (
                            <button
                                key={tab}
                                onClick={() => onNavigate && onNavigate(tab)}
                                className="bg-white border border-slate-100 rounded-2xl p-4 text-sm font-black text-slate-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition text-left shadow-sm"
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
