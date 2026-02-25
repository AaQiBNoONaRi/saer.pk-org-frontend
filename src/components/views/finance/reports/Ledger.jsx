import React, { useState, useEffect } from 'react';
import { reportsAPI, coaAPI, downloadBlob } from '../../../../services/financeService';
import { RefreshCw, Download, FileSpreadsheet } from 'lucide-react';

const fmt = (n) => Number(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 });

export default function Ledger() {
    const [data, setData] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState({
        account_id: '',
        agency_id: '',
        branch_id: '',
        date_from: '',
        date_to: '',
    });
    const orgId = localStorage.getItem('organization_id') || '';

    useEffect(() => {
        coaAPI.getAll({ organization_id: orgId, is_active: true })
            .then(r => setAccounts(r.data))
            .catch(console.error);
    }, []);

    const load = async () => {
        setLoading(true);
        try {
            const params = {};
            if (orgId) params.organization_id = orgId;
            if (filter.account_id) params.account_id = filter.account_id;
            if (filter.agency_id) params.agency_id = filter.agency_id;
            if (filter.branch_id) params.branch_id = filter.branch_id;
            if (filter.date_from) params.date_from = filter.date_from;
            if (filter.date_to) params.date_to = filter.date_to;
            const res = await reportsAPI.ledger(params);
            setData(res.data);
        } catch (e) { console.error(e); } finally { setLoading(false); }
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

    const isAccountLedger = !!(filter.account_id && data?.rows?.[0]?.date !== undefined && data?.rows?.[0]?.balance !== undefined);

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">General Ledger</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        {filter.agency_id ? 'Agency Ledger' : filter.branch_id ? 'Branch Ledger' : 'Organisation Ledger'}
                    </p>
                </div>
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
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-5 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Account</label>
                    <select value={filter.account_id}
                        onChange={e => setFilter(f => ({ ...f, account_id: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">All Accounts</option>
                        {accounts.map(a => <option key={a._id} value={a._id}>{a.code} – {a.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Agency ID</label>
                    <input value={filter.agency_id}
                        onChange={e => setFilter(f => ({ ...f, agency_id: e.target.value }))}
                        placeholder="Filter by agency"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Branch ID</label>
                    <input value={filter.branch_id}
                        onChange={e => setFilter(f => ({ ...f, branch_id: e.target.value }))}
                        placeholder="Filter by branch"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
                                <tr>
                                    {['Date', 'Reference', 'Description', 'Debit', 'Credit', 'Balance'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            ) : (
                                <tr>
                                    {['Code', 'Account Name', 'Type', 'Total Debit', 'Total Credit', 'Bal Dr', 'Bal Cr'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
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
                                        <td className={`px-4 py-3 text-sm text-right font-black ${r.balance >= 0 ? 'text-slate-800' : 'text-rose-700'}`}>
                                            {fmt(r.balance)}
                                        </td>
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
        </div>
    );
}
