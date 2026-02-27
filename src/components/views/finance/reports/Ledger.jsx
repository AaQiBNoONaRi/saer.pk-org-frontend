import React, { useState, useEffect, useRef } from 'react';
import { reportsAPI, coaAPI, downloadBlob } from '../../../../services/financeService';
import { RefreshCw, Download, FileSpreadsheet, Search, Building2 } from 'lucide-react';

const API = 'http://localhost:8000';
const fmt = (n) => Number(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 });

export default function Ledger() {
    const [tab, setTab] = useState('agency');
    const [data, setData] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState({ account_id: '', date_from: '', date_to: '' });

    // Agency Statement
    const [agencyLoading, setAgencyLoading] = useState(false);
    const [agencyStatement, setAgencyStatement] = useState(null);
    const [agencies, setAgencies] = useState([]);
    const [agencySearch, setAgencySearch] = useState('');
    const [selectedAgency, setSelectedAgency] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef();

    const orgId = localStorage.getItem('organization_id') || '';
    const token = () => localStorage.getItem('access_token') || '';

    useEffect(() => {
        coaAPI.getAll({ organization_id: orgId, is_active: true })
            .then(r => setAccounts(r.data)).catch(console.error);
        fetch(`${API}/api/agencies/?organization_id=${orgId}&limit=200`, {
            headers: { Authorization: `Bearer ${token()}` }
        })
            .then(r => r.ok ? r.json() : [])
            .then(d => setAgencies(Array.isArray(d) ? d : d?.agencies || d?.data || []))
            .catch(console.error);
    }, []);

    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const load = async () => {
        setLoading(true);
        try {
            const params = {};
            if (orgId) params.organization_id = orgId;
            if (filter.account_id) params.account_id = filter.account_id;
            if (filter.date_from) params.date_from = filter.date_from;
            if (filter.date_to) params.date_to = filter.date_to;
            const res = await reportsAPI.ledger(params);
            setData(res.data);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const loadAgencyStatement = async (agId) => {
        setAgencyLoading(true);
        setAgencyStatement(null);
        try {
            const res = await fetch(
                `${API}/api/finance/reports/agency-statement?agency_id=${agId}&organization_id=${orgId}`,
                { headers: { Authorization: `Bearer ${token()}` } }
            );
            if (res.ok) setAgencyStatement(await res.json());
        } catch (e) { console.error(e); } finally { setAgencyLoading(false); }
    };

    const handleSelectAgency = (ag) => {
        setSelectedAgency(ag);
        setAgencySearch(ag.agency_name || ag.name || '');
        setShowDropdown(false);
        loadAgencyStatement(ag._id || ag.id);
    };

    const handleDownload = async (format) => {
        const params = {};
        if (orgId) params.organization_id = orgId;
        if (filter.account_id) params.account_id = filter.account_id;
        if (filter.date_from) params.date_from = filter.date_from;
        if (filter.date_to) params.date_to = filter.date_to;
        try {
            const res = format === 'excel'
                ? await reportsAPI.downloadExcel('ledger', params)
                : await reportsAPI.downloadPdf('ledger', params);
            downloadBlob(res.data, `ledger.${format === 'excel' ? 'xlsx' : 'pdf'}`);
        } catch (e) { alert('Download failed: ' + e.message); }
    };

    const filteredAgencies = agencies.filter(a =>
        (a.agency_name || a.name || '').toLowerCase().includes(agencySearch.toLowerCase())
    );

    const isAccountLedger = !!(filter.account_id && data?.rows?.[0]?.date !== undefined && data?.rows?.[0]?.balance !== undefined);

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">General Ledger</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        {tab === 'agency' ? 'Agency Statement – transactions from agency perspective' : 'Organisation journal entries'}
                    </p>
                </div>
                {tab === 'general' && (
                    <div className="flex gap-2">
                        <button onClick={() => handleDownload('excel')}
                            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-sm font-bold text-slate-600 rounded-xl hover:bg-slate-50">
                            <FileSpreadsheet size={16} /> Excel
                        </button>
                        <button onClick={() => handleDownload('pdf')}
                            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-sm font-bold text-slate-600 rounded-xl hover:bg-slate-50">
                            <Download size={16} /> PDF
                        </button>
                        <button onClick={load} disabled={loading}
                            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50">
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Load
                        </button>
                    </div>
                )}
            </div>



            {/* ── General Ledger ── */}
            {tab === 'general' && (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <div>
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Account</label>
                            <select value={filter.account_id}
                                onChange={e => setFilter(f => ({ ...f, account_id: e.target.value }))}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">All Accounts (Summary)</option>
                                {accounts.map(a => <option key={a._id} value={a._id}>{a.code} – {a.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">From</label>
                            <input type="date" value={filter.date_from}
                                onChange={e => setFilter(f => ({ ...f, date_from: e.target.value }))}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">To</label>
                            <input type="date" value={filter.date_to}
                                onChange={e => setFilter(f => ({ ...f, date_to: e.target.value }))}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                    </div>

                    {!data ? (
                        <div className="flex items-center justify-center h-40 bg-white rounded-2xl border border-slate-100 shadow-sm">
                            <p className="text-slate-400 text-sm">Select filters and click Load to view ledger.</p>
                        </div>
                    ) : loading ? (
                        <div className="flex justify-center py-12"><RefreshCw size={28} className="animate-spin text-blue-400" /></div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-slate-50">
                                    {isAccountLedger ? (
                                        <tr>{['Date', 'Reference', 'Description', 'Debit', 'Credit', 'Balance'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                                        ))}</tr>
                                    ) : (
                                        <tr>{['Code', 'Account Name', 'Type', 'Total Debit', 'Total Credit', 'Bal Dr', 'Bal Cr'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                                        ))}</tr>
                                    )}
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {(data.rows || []).map((r, i) => (
                                        isAccountLedger ? (
                                            <tr key={i} className="hover:bg-slate-50/50">
                                                <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{(r.date || '').slice(0, 10)}</td>
                                                <td className="px-4 py-3 text-sm font-mono font-bold text-slate-700">{r.reference_id}</td>
                                                <td className="px-4 py-3 text-sm text-slate-600 max-w-xs">{r.entry_desc || r.description}</td>
                                                <td className="px-4 py-3 text-sm text-right font-bold text-blue-600">{r.debit ? fmt(r.debit) : ''}</td>
                                                <td className="px-4 py-3 text-sm text-right font-bold text-rose-600">{r.credit ? fmt(r.credit) : ''}</td>
                                                <td className={`px-4 py-3 text-sm text-right font-black ${r.balance >= 0 ? 'text-slate-800' : 'text-rose-700'}`}>{fmt(r.balance)}</td>
                                            </tr>
                                        ) : (
                                            <tr key={r.account_id} className="hover:bg-slate-50/50">
                                                <td className="px-4 py-3 font-mono text-sm font-bold text-slate-700">{r.account_code}</td>
                                                <td className="px-4 py-3 text-sm text-slate-700">{r.account_name}</td>
                                                <td className="px-4 py-3 text-xs text-slate-400 uppercase font-bold">{r.account_type}</td>
                                                <td className="px-4 py-3 text-sm text-right font-bold text-slate-800">{fmt(r.total_debit)}</td>
                                                <td className="px-4 py-3 text-sm text-right font-bold text-slate-800">{fmt(r.total_credit)}</td>
                                                <td className="px-4 py-3 text-sm text-right font-bold text-blue-600">{r.balance_debit ? fmt(r.balance_debit) : ''}</td>
                                                <td className="px-4 py-3 text-sm text-right font-bold text-rose-600">{r.balance_credit ? fmt(r.balance_credit) : ''}</td>
                                            </tr>
                                        )
                                    ))}
                                    {!data.rows?.length && (
                                        <tr><td colSpan={7} className="py-12 text-center text-slate-400 text-sm">No ledger entries found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* ── Agency Statement ── */}
            {tab === 'agency' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Search Agency</label>
                        <div className="relative" ref={dropdownRef}>
                            <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus-within:border-blue-500 focus-within:bg-white transition-all">
                                <Search size={16} className="text-slate-400 shrink-0" />
                                <input
                                    value={agencySearch}
                                    onChange={e => { setAgencySearch(e.target.value); setShowDropdown(true); }}
                                    onFocus={() => setShowDropdown(true)}
                                    placeholder="Type agency name..."
                                    className="flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none"
                                />
                                {selectedAgency && (
                                    <button onClick={() => { setSelectedAgency(null); setAgencySearch(''); setAgencyStatement(null); }}
                                        className="text-slate-400 hover:text-red-500 text-xs font-bold">✕</button>
                                )}
                            </div>
                            {showDropdown && filteredAgencies.length > 0 && (
                                <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden max-h-64 overflow-y-auto">
                                    {filteredAgencies.slice(0, 20).map(ag => (
                                        <button key={ag._id || ag.id}
                                            onClick={() => handleSelectAgency(ag)}
                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left">
                                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                                                <Building2 size={14} className="text-blue-600" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-800">{ag.agency_name || ag.name}</div>
                                                <div className="text-xs text-slate-400">{ag.email || ag.agency_email || ''}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {agencyLoading && (
                        <div className="flex justify-center py-12"><RefreshCw size={28} className="animate-spin text-blue-400" /></div>
                    )}

                    {agencyStatement && !agencyLoading && (
                        <>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Booked</div>
                                    <div className="text-2xl font-black text-slate-900">PKR {fmt(agencyStatement.total_owed)}</div>
                                </div>
                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Paid</div>
                                    <div className="text-2xl font-black text-emerald-600">PKR {fmt(agencyStatement.total_paid)}</div>
                                </div>
                                <div className={`rounded-2xl border shadow-sm p-5 ${agencyStatement.current_balance > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Outstanding Balance</div>
                                    <div className={`text-2xl font-black ${agencyStatement.current_balance > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                                        PKR {fmt(agencyStatement.current_balance)}
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-1">{agencyStatement.current_balance > 0 ? 'Amount agency still owes' : 'Fully settled ✅'}</div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Transaction History – {selectedAgency?.agency_name || selectedAgency?.name}</h3>
                                    <button onClick={() => loadAgencyStatement(selectedAgency?._id || selectedAgency?.id)}
                                        className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600">
                                        <RefreshCw size={13} /> Refresh
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-slate-50 border-b border-slate-100">
                                            <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                                                <th className="px-4 py-3">Date</th>
                                                <th className="px-4 py-3">Type</th>
                                                <th className="px-4 py-3">Reference</th>
                                                <th className="px-4 py-3">Description</th>
                                                <th className="px-4 py-3 text-right text-amber-600">Amount Owed</th>
                                                <th className="px-4 py-3 text-right text-emerald-600">Amount Paid</th>
                                                <th className="px-4 py-3 text-right">Balance</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {agencyStatement.rows.length === 0 ? (
                                                <tr><td colSpan={7} className="py-12 text-center text-slate-400 text-sm">No entries found.</td></tr>
                                            ) : agencyStatement.rows.map((row, i) => (
                                                <tr key={i} className={`transition-colors ${row.amount_paid > 0 ? 'bg-emerald-50/20' : 'hover:bg-slate-50/50'}`}>
                                                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{(row.date || '').slice(0, 10)}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded border ${row.reference_type === 'payment_received'
                                                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                                            : 'text-amber-700 bg-amber-50 border-amber-200'
                                                            }`}>{row.reference_type?.replace(/_/g, ' ') || 'Entry'}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs font-mono text-slate-600">{row.reference_id || '—'}</td>
                                                    <td className="px-4 py-3 text-xs font-bold text-slate-700 max-w-xs">{row.entry_desc || row.description || '—'}</td>
                                                    <td className="px-4 py-3 text-sm font-mono font-bold text-amber-600 text-right">{row.amount_owed > 0 ? fmt(row.amount_owed) : '—'}</td>
                                                    <td className="px-4 py-3 text-sm font-mono font-bold text-emerald-600 text-right">{row.amount_paid > 0 ? fmt(row.amount_paid) : '—'}</td>
                                                    <td className={`px-4 py-3 text-sm font-black text-right ${row.balance > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>{fmt(row.balance)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}

                    {!agencyLoading && !agencyStatement && (
                        <div className="flex items-center justify-center h-40 bg-white rounded-2xl border border-slate-100 shadow-sm">
                            <p className="text-slate-400 text-sm">Search for an agency to view their statement.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
