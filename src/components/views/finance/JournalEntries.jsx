import React, { useEffect, useState } from 'react';
import { journalAPI, coaAPI } from '../../../services/financeService';
import { RefreshCw, ChevronDown, ChevronRight, Trash2, Plus } from 'lucide-react';

const REF_COLORS = {
    umrah_booking: 'bg-blue-100 text-blue-700',
    ticket_booking: 'bg-purple-100 text-purple-700',
    payment_received: 'bg-emerald-100 text-emerald-700',
    manual_income: 'bg-green-100 text-green-700',
    manual_expense: 'bg-rose-100 text-rose-700',
    salary: 'bg-amber-100 text-amber-700',
    vendor_bill: 'bg-orange-100 text-orange-700',
    adjustment: 'bg-slate-100 text-slate-700',
};

const fmt = (n) => Number(n || 0).toLocaleString('en-PK');

export default function JournalEntries() {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(null);
    const [filter, setFilter] = useState({ reference_type: '', date_from: '', date_to: '' });

    const load = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filter.reference_type) params.reference_type = filter.reference_type;
            if (filter.date_from) params.date_from = filter.date_from;
            if (filter.date_to) params.date_to = filter.date_to;
            const res = await journalAPI.getAll(params);
            setEntries(res.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const handleReverse = async (id, ref) => {
        if (!window.confirm(`Reverse journal entry ${ref}? (soft-delete)`)) return;
        try {
            await journalAPI.reverse(id);
            load();
        } catch (e) {
            alert('Error: ' + (e.response?.data?.detail || e.message));
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">Journal Entries</h1>
                    <p className="text-slate-400 text-sm mt-1">{entries.length} entries</p>
                </div>
                <button onClick={load}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-5 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <select value={filter.reference_type} onChange={e => setFilter(f => ({ ...f, reference_type: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">All Types</option>
                    {Object.keys(REF_COLORS).map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </select>
                <input type="date" value={filter.date_from}
                    onChange={e => setFilter(f => ({ ...f, date_from: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <span className="self-center text-slate-300">→</span>
                <input type="date" value={filter.date_to}
                    onChange={e => setFilter(f => ({ ...f, date_to: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button onClick={load} className="px-4 py-2 bg-slate-800 text-white text-sm font-bold rounded-xl hover:bg-slate-700">Apply</button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><RefreshCw size={28} className="animate-spin text-blue-400" /></div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                {['', 'Date', 'Reference', 'Description', 'Type', 'Debit', 'Credit', 'By'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                                ))}
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {entries.map(e => {
                                const totalDr = e.entries?.reduce((s, l) => s + l.debit, 0) || 0;
                                const totalCr = e.entries?.reduce((s, l) => s + l.credit, 0) || 0;
                                const isExp = expanded === e._id;
                                return (
                                    <React.Fragment key={e._id}>
                                        <tr className={`hover:bg-slate-50/50 transition ${e.is_reversed ? 'opacity-40 line-through' : ''}`}>
                                            <td className="px-4 py-3">
                                                <button onClick={() => setExpanded(isExp ? null : e._id)}
                                                    className="text-slate-400 hover:text-blue-600">
                                                    {isExp ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                                                {e.date ? e.date.slice(0, 10) : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-mono font-bold text-slate-800">{e.reference_id || '—'}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">{e.description}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${REF_COLORS[e.reference_type] || 'bg-slate-100 text-slate-600'}`}>
                                                    {(e.reference_type || '').replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm font-bold text-slate-800 text-right">{fmt(totalDr)}</td>
                                            <td className="px-4 py-3 text-sm font-bold text-slate-800 text-right">{fmt(totalCr)}</td>
                                            <td className="px-4 py-3 text-xs text-slate-400">{e.created_by}</td>
                                            <td className="px-4 py-3">
                                                {!e.is_reversed && (
                                                    <button onClick={() => handleReverse(e._id, e.reference_id)}
                                                        className="p-1.5 text-slate-300 hover:text-rose-500 transition" title="Reverse">
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                        {isExp && (
                                            <tr className="bg-slate-50/50">
                                                <td colSpan={9} className="px-8 py-4">
                                                    <table className="w-full text-xs">
                                                        <thead>
                                                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                                <th className="text-left pb-2">Account</th>
                                                                <th className="text-right pb-2">Debit</th>
                                                                <th className="text-right pb-2">Credit</th>
                                                                <th className="text-left pb-2 pl-4">Note</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                            {(e.entries || []).map((line, i) => (
                                                                <tr key={i}>
                                                                    <td className="py-1.5 font-medium text-slate-700">
                                                                        {line.account_code && <span className="font-mono text-slate-400 mr-2">{line.account_code}</span>}
                                                                        {line.account_name}
                                                                    </td>
                                                                    <td className="py-1.5 text-right font-bold text-blue-700">{line.debit ? fmt(line.debit) : ''}</td>
                                                                    <td className="py-1.5 text-right font-bold text-rose-700">{line.credit ? fmt(line.credit) : ''}</td>
                                                                    <td className="py-1.5 pl-4 text-slate-400">{line.description}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                            {!entries.length && (
                                <tr><td colSpan={9} className="py-12 text-center text-slate-400 text-sm">No journal entries found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
