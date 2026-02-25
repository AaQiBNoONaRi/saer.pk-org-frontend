import React, { useState, useEffect } from 'react';
import { reportsAPI, downloadBlob } from '../../../../services/financeService';
import { RefreshCw, Download, FileSpreadsheet, CheckCircle, XCircle } from 'lucide-react';

const fmt = (n) => Number(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 });

const Section = ({ title, rows, colorClass }) => (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className={`px-6 py-3 border-b border-slate-50 ${colorClass}`}>
            <h3 className="text-sm font-black uppercase tracking-widest">{title}</h3>
        </div>
        <table className="w-full">
            <thead className="bg-slate-50">
                <tr>
                    <th className="px-5 py-2.5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Account</th>
                    <th className="px-5 py-2.5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Balance (PKR)</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {rows.map(r => (
                    <tr key={r.account_id} className="hover:bg-slate-50/50">
                        <td className="px-5 py-3 text-sm text-slate-700">
                            {r.account_code && <span className="font-mono text-slate-400 mr-2 text-xs">{r.account_code}</span>}
                            {r.account_name}
                        </td>
                        <td className="px-5 py-3 text-sm font-bold text-right text-slate-800">{fmt(r.net)}</td>
                    </tr>
                ))}
                {!rows.length && <tr><td colSpan={2} className="py-4 text-center text-xs text-slate-400">No entries</td></tr>}
            </tbody>
        </table>
    </div>
);

export default function BalanceSheet() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ date_from: '', date_to: '' });

    const load = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filter.date_from) params.date_from = filter.date_from;
            if (filter.date_to) params.date_to = filter.date_to;
            const res = await reportsAPI.balanceSheet(params);
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
                ? await reportsAPI.downloadExcel('balance-sheet', params)
                : await reportsAPI.downloadPdf('balance-sheet', params);
            downloadBlob(res.data, `balance-sheet.${format === 'excel' ? 'xlsx' : 'pdf'}`);
        } catch (e) { alert('Download failed: ' + e.message); }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">Balance Sheet</h1>
                    <p className="text-slate-400 text-sm mt-1">Assets = Liabilities + Equity</p>
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
                <div className="space-y-5">
                    <Section title="Assets" rows={data.assets || []} colorClass="bg-blue-50 text-blue-700" />
                    <Section title="Liabilities" rows={data.liabilities || []} colorClass="bg-rose-50 text-rose-700" />
                    <Section title="Equity" rows={data.equity || []} colorClass="bg-purple-50 text-purple-700" />

                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <table className="w-full">
                            <tbody>
                                <tr><td className="px-6 py-4 text-sm font-black text-slate-600 uppercase tracking-wider">Total Assets</td>
                                    <td className="px-6 py-4 text-right font-black text-blue-600">PKR {fmt(data.total_assets)}</td></tr>
                                <tr className="border-t border-slate-100">
                                    <td className="px-6 py-4 text-sm font-black text-slate-600 uppercase tracking-wider">Total Liabilities</td>
                                    <td className="px-6 py-4 text-right font-black text-rose-600">PKR {fmt(data.total_liabilities)}</td></tr>
                                <tr>
                                    <td className="px-6 py-4 text-sm font-black text-slate-600 uppercase tracking-wider">Total Equity</td>
                                    <td className="px-6 py-4 text-right font-black text-purple-600">PKR {fmt(data.total_equity)}</td></tr>
                                <tr>
                                    <td className="px-6 py-4 text-sm text-slate-500">Retained Earnings (current period)</td>
                                    <td className="px-6 py-4 text-right text-sm text-slate-600">PKR {fmt(data.retained_earnings)}</td></tr>
                                <tr className="bg-slate-50 border-t-2 border-slate-200">
                                    <td className="px-6 py-4 font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                        Balance Check
                                        {data.balanced
                                            ? <CheckCircle size={16} className="text-emerald-500" />
                                            : <XCircle size={16} className="text-rose-500" />}
                                    </td>
                                    <td className={`px-6 py-4 text-right font-black ${data.balanced ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {data.balanced ? 'BALANCED ✓' : 'OUT OF BALANCE ✗'}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <p className="text-xs text-slate-400">Generated: {data.generated_at?.slice(0, 19)?.replace('T', ' ')} UTC</p>
                </div>
            )}
        </div>
    );
}
