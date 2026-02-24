import React, { useState, useEffect } from 'react';
import { reportsAPI, downloadBlob } from '../../../../services/financeService';
import { RefreshCw, Download, FileSpreadsheet } from 'lucide-react';

const fmt = (n) => Number(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 });

export default function ProfitLoss() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ date_from: '', date_to: '' });

    const load = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filter.date_from) params.date_from = filter.date_from;
            if (filter.date_to) params.date_to = filter.date_to;
            const res = await reportsAPI.profitLoss(params);
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
                ? await reportsAPI.downloadExcel('profit-loss', params)
                : await reportsAPI.downloadPdf('profit-loss', params);
            downloadBlob(res.data, `profit-loss.${format === 'excel' ? 'xlsx' : 'pdf'}`);
        } catch (e) { alert('Download failed: ' + e.message); }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">Profit & Loss</h1>
                    <p className="text-slate-400 text-sm mt-1">Income Statement</p>
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

            {/* Filters */}
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
                    {/* Income */}
                    <Section title="Income" rows={data.income || []} type="income" />
                    {/* Expenses */}
                    <Section title="Expenses" rows={data.expenses || []} type="expense" />

                    {/* Summary */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <table className="w-full">
                            <tbody>
                                <SummaryRow label="Total Income" value={data.total_income} color="text-emerald-600" />
                                <SummaryRow label="Total Expenses" value={data.total_expense} color="text-rose-600" />
                                <SummaryRow label="Gross Profit" value={data.gross_profit} color={data.gross_profit >= 0 ? "text-emerald-700 font-black" : "text-rose-700 font-black"} border />
                                <SummaryRow label="Net Profit / Loss" value={data.net_profit} color={data.net_profit >= 0 ? "text-emerald-700 font-black text-lg" : "text-rose-700 font-black text-lg"} border highlight />
                            </tbody>
                        </table>
                    </div>
                    <p className="text-xs text-slate-400">Generated: {data.generated_at?.slice(0, 19)?.replace('T', ' ')} UTC</p>
                </div>
            )}
        </div>
    );
}

const Section = ({ title, rows, type }) => (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className={`px-6 py-3 border-b border-slate-50 ${type === 'income' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
            <h3 className={`text-sm font-black uppercase tracking-widest ${type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>{title}</h3>
        </div>
        <table className="w-full">
            <thead className="bg-slate-50">
                <tr>
                    <th className="px-5 py-2.5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Account</th>
                    <th className="px-5 py-2.5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount (PKR)</th>
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

const SummaryRow = ({ label, value, color, border, highlight }) => (
    <tr className={`${border ? 'border-t-2 border-slate-100' : ''} ${highlight ? 'bg-slate-50' : ''}`}>
        <td className="px-6 py-4 text-sm font-black text-slate-600 uppercase tracking-wider">{label}</td>
        <td className={`px-6 py-4 text-right font-black ${color || 'text-slate-800'}`}>
            PKR {fmt(value)}
        </td>
    </tr>
);
