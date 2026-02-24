import React, { useEffect, useState } from 'react';
import { auditAPI } from '../../../services/financeService';
import { RefreshCw } from 'lucide-react';

const ACTION_COLORS = {
    CREATE_JOURNAL: 'bg-blue-100 text-blue-700',
    UPDATE_JOURNAL: 'bg-amber-100 text-amber-700',
    DELETE_JOURNAL: 'bg-rose-100 text-rose-700',
    CREATE_COA: 'bg-emerald-100 text-emerald-700',
    UPDATE_COA: 'bg-yellow-100 text-yellow-700',
    SEED_COA: 'bg-purple-100 text-purple-700',
};

export default function AuditTrail() {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [action, setAction] = useState('');
    const [expanded, setExpanded] = useState(null);

    const load = async () => {
        setLoading(true);
        try {
            const params = {};
            if (action) params.action = action;
            const res = await auditAPI.getAll(params);
            setEntries(res.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">Audit Trail</h1>
                    <p className="text-slate-400 text-sm mt-1">Complete history of every accounting action</p>
                </div>
                <button onClick={load}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            {/* Filter */}
            <div className="flex gap-3 mb-5 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <select value={action} onChange={e => setAction(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">All Actions</option>
                    {Object.keys(ACTION_COLORS).map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
                </select>
                <button onClick={load} className="px-4 py-2 bg-slate-800 text-white text-sm font-bold rounded-xl hover:bg-slate-700">Apply</button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><RefreshCw size={28} className="animate-spin text-blue-400" /></div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                {['Time', 'Action', 'Collection', 'Reference', 'Performed By', 'Details'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {entries.map((e, idx) => (
                                <React.Fragment key={idx}>
                                    <tr className="hover:bg-slate-50/50 transition">
                                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                                            {e.timestamp ? new Date(e.timestamp).toLocaleString('en-PK') : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${ACTION_COLORS[e.action] || 'bg-slate-100 text-slate-600'}`}>
                                                {(e.action || '').replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs font-mono text-slate-500">{e.collection}</td>
                                        <td className="px-4 py-3 text-xs font-mono font-bold text-slate-700">{e.reference_id}</td>
                                        <td className="px-4 py-3 text-xs text-slate-500">{e.performed_by}</td>
                                        <td className="px-4 py-3">
                                            {(e.new_data && Object.keys(e.new_data).length > 0) && (
                                                <button onClick={() => setExpanded(expanded === idx ? null : idx)}
                                                    className="text-xs text-blue-500 hover:underline font-bold">
                                                    {expanded === idx ? 'Hide' : 'Show'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                    {expanded === idx && (
                                        <tr className="bg-slate-50">
                                            <td colSpan={6} className="px-6 py-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    {e.old_data && Object.keys(e.old_data).length > 0 && (
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Before</p>
                                                            <pre className="text-xs bg-white border border-slate-200 rounded-xl p-3 overflow-auto max-h-48">
                                                                {JSON.stringify(e.old_data, null, 2)}
                                                            </pre>
                                                        </div>
                                                    )}
                                                    {e.new_data && Object.keys(e.new_data).length > 0 && (
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">After</p>
                                                            <pre className="text-xs bg-white border border-slate-200 rounded-xl p-3 overflow-auto max-h-48">
                                                                {JSON.stringify(e.new_data, null, 2)}
                                                            </pre>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                            {!entries.length && (
                                <tr><td colSpan={6} className="py-12 text-center text-slate-400 text-sm">No audit records found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
