import React, { useEffect, useState } from 'react';
import { auditAPI } from '../../../services/financeService';
import { RefreshCw, ChevronDown, ChevronUp, ArrowRight, CheckCircle, XCircle } from 'lucide-react';

const ACTION_COLORS = {
    CREATE_JOURNAL: 'bg-blue-100 text-blue-700',
    UPDATE_JOURNAL: 'bg-amber-100 text-amber-700',
    DELETE_JOURNAL: 'bg-rose-100 text-rose-700',
    CREATE_COA: 'bg-emerald-100 text-emerald-700',
    UPDATE_COA: 'bg-yellow-100 text-yellow-700',
    SEED_COA: 'bg-purple-100 text-purple-700',
};

const REF_TYPE_LABEL = {
    ticket_booking: 'Ticket Booking',
    umrah_booking: 'Umrah Booking',
    custom_booking: 'Custom Booking',
    manual_expense: 'Manual Expense',
    manual_income: 'Manual Income',
    salary: 'Salary',
    vendor_bill: 'Vendor Bill',
    adjustment: 'Adjustment',
    payment_received: 'Payment Received',
};

function fmt(n) {
    return Number(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 });
}

/** Renders the "after" data of a CREATE_JOURNAL audit record in a nice UI. */
function JournalDetail({ data }) {
    if (!data || typeof data !== 'object') return null;

    const entries = Array.isArray(data.entries) ? data.entries : [];
    const totalDebit = entries.reduce((s, e) => s + Number(e.debit || 0), 0);
    const totalCredit = entries.reduce((s, e) => s + Number(e.credit || 0), 0);

    return (
        <div className="space-y-4">
            {/* Header row */}
            <div className="flex flex-wrap items-center gap-3">
                {data.reference_type && (
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-[11px] font-black uppercase tracking-widest">
                        {REF_TYPE_LABEL[data.reference_type] || data.reference_type}
                    </span>
                )}
                {data.reference_id && (
                    <span className="font-mono text-xs font-bold text-slate-700">{data.reference_id}</span>
                )}
                {data.is_reversed !== undefined && (
                    data.is_reversed
                        ? <span className="flex items-center gap-1 text-xs text-rose-500 font-bold"><XCircle size={13} /> Reversed</span>
                        : <span className="flex items-center gap-1 text-xs text-emerald-500 font-bold"><CheckCircle size={13} /> Posted</span>
                )}
            </div>

            {/* Description */}
            {data.description && (
                <p className="text-sm font-bold text-slate-700">{data.description}</p>
            )}

            {/* Entries table */}
            {entries.length > 0 && (
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-xs">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-3 py-2 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Code</th>
                                <th className="px-3 py-2 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Account</th>
                                <th className="px-3 py-2 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Note</th>
                                <th className="px-3 py-2 text-right text-[10px] font-black text-blue-400 uppercase tracking-widest">Debit</th>
                                <th className="px-3 py-2 text-right text-[10px] font-black text-emerald-500 uppercase tracking-widest">Credit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {entries.map((en, i) => (
                                <tr key={i} className="hover:bg-slate-50/60">
                                    <td className="px-3 py-2 font-mono text-slate-500">{en.account_code}</td>
                                    <td className="px-3 py-2 font-bold text-slate-700">{en.account_name}</td>
                                    <td className="px-3 py-2 text-slate-400 italic">{en.description || '—'}</td>
                                    <td className="px-3 py-2 text-right font-mono font-bold text-blue-600">
                                        {Number(en.debit) > 0 ? fmt(en.debit) : '—'}
                                    </td>
                                    <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">
                                        {Number(en.credit) > 0 ? fmt(en.credit) : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-slate-50 border-t border-slate-200">
                            <tr>
                                <td colSpan={3} className="px-3 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">Totals</td>
                                <td className="px-3 py-2 text-right font-mono font-black text-blue-700">
                                    {fmt(totalDebit)}
                                </td>
                                <td className="px-3 py-2 text-right font-mono font-black text-emerald-700">
                                    {fmt(totalCredit)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                    {/* Balanced indicator */}
                    <div className={`px-3 py-1.5 text-center text-[10px] font-black uppercase tracking-widest ${Math.abs(totalDebit - totalCredit) < 0.01
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-rose-50 text-rose-600'
                        }`}>
                        {Math.abs(totalDebit - totalCredit) < 0.01 ? '✓ Balanced' : `⚠ Unbalanced — Diff: PKR ${fmt(Math.abs(totalDebit - totalCredit))}`}
                    </div>
                </div>
            )}

            {/* Metadata pills */}
            <div className="flex flex-wrap gap-2 text-[10px]">
                {data.created_by && (
                    <span className="px-2 py-1 bg-slate-100 rounded-lg text-slate-500 font-bold">By: {data.created_by}</span>
                )}
                {data.organization_id && (
                    <span className="px-2 py-1 bg-slate-100 rounded-lg text-slate-400 font-mono">Org: …{data.organization_id.slice(-6)}</span>
                )}
                {data.branch_id && (
                    <span className="px-2 py-1 bg-slate-100 rounded-lg text-slate-400 font-mono">Branch: …{data.branch_id.slice(-6)}</span>
                )}
                {data.agency_id && (
                    <span className="px-2 py-1 bg-slate-100 rounded-lg text-slate-400 font-mono">Agency: …{data.agency_id.slice(-6)}</span>
                )}
            </div>
        </div>
    );
}

/** Generic key-value preview for non-journal records (COA creates etc.) */
function GenericDetail({ data }) {
    if (!data || typeof data !== 'object') return null;
    const skip = new Set(['_id', 'created_by', 'organization_id']);
    const pairs = Object.entries(data).filter(([k]) => !skip.has(k));
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {pairs.map(([k, v]) => (
                <div key={k} className="bg-white border border-slate-100 rounded-xl px-3 py-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{k.replace(/_/g, ' ')}</p>
                    <p className="text-xs font-bold text-slate-700 truncate">
                        {typeof v === 'boolean' ? (v ? 'Yes' : 'No') : (v ?? '—').toString()}
                    </p>
                </div>
            ))}
        </div>
    );
}

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
                <div className="space-y-2">
                    {entries.map((e, idx) => {
                        const isOpen = expanded === idx;
                        const hasDetail = (e.new_data && Object.keys(e.new_data).length > 0) ||
                            (e.old_data && Object.keys(e.old_data).length > 0);
                        const isJournal = e.action === 'CREATE_JOURNAL' || e.action === 'UPDATE_JOURNAL' || e.action === 'DELETE_JOURNAL';

                        return (
                            <div key={idx} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                {/* Row */}
                                <div
                                    className={`flex flex-wrap items-center gap-3 px-5 py-4 ${hasDetail ? 'cursor-pointer hover:bg-slate-50/60' : ''}`}
                                    onClick={() => hasDetail && setExpanded(isOpen ? null : idx)}
                                >
                                    {/* Time */}
                                    <span className="text-xs text-slate-400 whitespace-nowrap w-36 shrink-0">
                                        {e.timestamp ? new Date(e.timestamp).toLocaleString('en-PK') : '—'}
                                    </span>

                                    {/* Action badge */}
                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shrink-0 ${ACTION_COLORS[e.action] || 'bg-slate-100 text-slate-600'}`}>
                                        {(e.action || '').replace(/_/g, ' ')}
                                    </span>

                                    {/* Collection */}
                                    <span className="text-xs font-mono text-slate-400 shrink-0">{e.collection}</span>

                                    {/* Arrow */}
                                    <ArrowRight size={12} className="text-slate-300 shrink-0" />

                                    {/* Reference */}
                                    <span className="text-xs font-mono font-bold text-slate-700 truncate flex-1">
                                        {e.reference_id}
                                    </span>

                                    {/* Description (from new_data) */}
                                    {e.new_data?.description && (
                                        <span className="text-xs text-slate-500 truncate max-w-xs hidden md:block">
                                            {e.new_data.description}
                                        </span>
                                    )}

                                    {/* Performed by */}
                                    <span className="text-xs text-slate-400 shrink-0 ml-auto">{e.performed_by}</span>

                                    {/* Expand toggle */}
                                    {hasDetail && (
                                        <span className="text-slate-400 shrink-0">
                                            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </span>
                                    )}
                                </div>

                                {/* Expandable detail panel */}
                                {isOpen && hasDetail && (
                                    <div className="border-t border-slate-100 px-5 py-4 bg-slate-50/40 space-y-4">
                                        {/* BEFORE */}
                                        {e.old_data && Object.keys(e.old_data).length > 0 && (
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Before</p>
                                                <GenericDetail data={e.old_data} />
                                            </div>
                                        )}

                                        {/* AFTER */}
                                        {e.new_data && Object.keys(e.new_data).length > 0 && (
                                            <div>
                                                {e.old_data && Object.keys(e.old_data).length > 0 && (
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">After</p>
                                                )}
                                                {isJournal
                                                    ? <JournalDetail data={e.new_data} />
                                                    : <GenericDetail data={e.new_data} />
                                                }
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {!entries.length && (
                        <div className="py-12 text-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-100">
                            No audit records found.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
