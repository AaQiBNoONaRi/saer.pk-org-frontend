import React, { useState, useEffect } from 'react';
import { reportsAPI, downloadBlob } from '../../../../services/financeService';
import { RefreshCw, Download, FileSpreadsheet, CheckCircle, XCircle } from 'lucide-react';

const fmt = (n) => Number(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 });

const TYPE_COLORS = {
    asset: 'text-blue-600',
    liability: 'text-rose-600',
    equity: 'text-purple-600',
    income: 'text-emerald-600',
    expense: 'text-amber-600',
};

export default function TrialBalance() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ date_from: '', date_to: '' });

    const load = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filter.date_from) params.date_from = filter.date_from;
            if (filter.date_to) params.date_to = filter.date_to;
            const res = await reportsAPI.trialBalance(params);
            setData(res.data);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const handleDownload = async (format) => {
        const params = {};
        if (filter.date_from) params.date_from = filter.date_from;
        if (filter.date_to) params.date_to = filter.date_to;
        try {
            const res = format === 'excel'
                ? await reportsAPI.downloadExcel('trial-balance', params)
                : await reportsAPI.downloadPdf('trial-balance', params);
            downloadBlob(res.data, `trial-balance.${format === 'excel' ? 'xlsx' : 'pdf'}`);
        } catch (e) { alert('Download failed: ' + e.message); }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">Trial Balance</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Verify total debits equal total credits
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
                    <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700">
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                </div>
            </div>

            <div className="flex gap-3 mb-5 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <input type="date" value={filter.date_from}
                    onChange={e => setFilter(f => ({ ...f, date_from: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <span className="self-center text-slate-300">→</span>
                <input type="date" value={filter.date_to}
                    onChange={e => setFilter(f => ({ ...f, date_to: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button onClick={load} className="px-4 py-2 bg-slate-800 text-white text-sm font-bold rounded-xl">Apply</button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><RefreshCw size={28} className="animate-spin text-blue-400" /></div>
            ) : data && (
                <div>
                    {/* Balance Status */}
                    <div className={`mb-4 flex items-center gap-3 px-5 py-3 rounded-xl border ${data.balanced
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-rose-50 border-rose-200 text-rose-700'
                        }`}>
                        {data.balanced
                            ? <><CheckCircle size={18} /><span className="font-black text-sm">Trial Balance is BALANCED – Total DR = Total CR = PKR {fmt(data.total_debit)}</span></>
                            : <><XCircle size={18} /><span className="font-black text-sm">OUT OF BALANCE – DR: {fmt(data.total_debit)} | CR: {fmt(data.total_credit)}</span></>
                        }
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-slate-50">
                                <tr>
                                    {['Code', 'Account Name', 'Type', 'Total Debit', 'Total Credit', 'Balance Dr', 'Balance Cr'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {(data.rows || []).map(r => (
                                    <tr key={r.account_id} className="hover:bg-slate-50/50">
                                        <td className="px-4 py-3 font-mono text-sm font-bold text-slate-700">{r.account_code}</td>
                                        <td className="px-4 py-3 text-sm text-slate-700">{r.account_name}</td>
                                        <td className={`px-4 py-3 text-[10px] font-black uppercase tracking-wider ${TYPE_COLORS[r.account_type] || 'text-slate-500'}`}>
                                            {r.account_type}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-bold text-slate-800">{fmt(r.total_debit)}</td>
                                        <td className="px-4 py-3 text-sm text-right font-bold text-slate-800">{fmt(r.total_credit)}</td>
                                        <td className="px-4 py-3 text-sm text-right font-bold text-blue-600">{r.balance_debit ? fmt(r.balance_debit) : ''}</td>
                                        <td className="px-4 py-3 text-sm text-right font-bold text-rose-600">{r.balance_credit ? fmt(r.balance_credit) : ''}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-100 border-t-2 border-slate-200">
                                <tr>
                                    <td colSpan={5} className="px-4 py-3 font-black text-sm text-slate-700 uppercase tracking-wider">TOTALS</td>
                                    <td className="px-4 py-3 text-right font-black text-blue-700">{fmt(data.total_debit)}</td>
                                    <td className="px-4 py-3 text-right font-black text-rose-700">{fmt(data.total_credit)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    <p className="text-xs text-slate-400 mt-3">Generated: {data.generated_at?.slice(0, 19)?.replace('T', ' ')} UTC</p>
                </div>
            )}
        </div>
    );
}
