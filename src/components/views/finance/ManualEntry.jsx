import React, { useEffect, useState } from 'react';
import { manualEntryAPI, coaAPI } from '../../../services/financeService';
import { CheckCircle, AlertCircle } from 'lucide-react';

const ENTRY_TYPES = [
    { value: 'manual_income', label: 'Income Entry', desc: 'Cash/Bank received as income' },
    { value: 'manual_expense', label: 'Expense Entry', desc: 'General operating expense' },
    { value: 'salary', label: 'Salary Entry', desc: 'Employee salary payment' },
    { value: 'vendor_bill', label: 'Vendor Bill', desc: 'Supplier / vendor invoice' },
    { value: 'adjustment', label: 'Adjustment Entry', desc: 'Balance adjustment or correction' },
];

const DEFAULT_MAPPINGS = {
    manual_income: { dr: 'Cash in Hand', cr: 'Umrah Revenue' },
    manual_expense: { dr: 'Marketing', cr: 'Cash in Hand' },
    salary: { dr: 'Salary Expense', cr: 'Salary Payable' },
    vendor_bill: { dr: 'Cost of Sales', cr: 'Supplier Payable' },
    adjustment: { dr: 'Retained Earnings', cr: 'Retained Earnings' },
};

export default function ManualEntry() {
    const [accounts, setAccounts] = useState([]);
    const [form, setForm] = useState({
        entry_type: 'manual_income',
        date: new Date().toISOString().slice(0, 10),
        description: '',
        amount: '',
        debit_account_id: '',
        credit_account_id: '',
        notes: '',
    });
    const [saving, setSaving] = useState(false);
    const [result, setResult] = useState(null);  // { ok: bool, msg: str }
    const orgId = localStorage.getItem('organization_id') || '';

    useEffect(() => {
        coaAPI.getAll({ organization_id: orgId, is_active: true })
            .then(r => setAccounts(r.data))
            .catch(console.error);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.amount || Number(form.amount) <= 0) {
            setResult({ ok: false, msg: 'Amount must be greater than 0.' });
            return;
        }
        setSaving(true);
        setResult(null);
        try {
            const payload = {
                ...form,
                amount: parseFloat(form.amount),
                organization_id: orgId,
                debit_account_id: form.debit_account_id || undefined,
                credit_account_id: form.credit_account_id || undefined,
            };
            const res = await manualEntryAPI.create(payload);
            setResult({ ok: true, msg: `Journal entry created: ${res.data.reference_id}` });
            setForm(f => ({
                ...f,
                description: '',
                amount: '',
                notes: '',
                debit_account_id: '',
                credit_account_id: '',
            }));
        } catch (err) {
            setResult({ ok: false, msg: err.response?.data?.detail || err.message });
        } finally {
            setSaving(false);
        }
    };

    const selectedType = ENTRY_TYPES.find(t => t.value === form.entry_type);
    const defaults = DEFAULT_MAPPINGS[form.entry_type] || {};

    return (
        <div className="max-w-2xl">
            <div className="mb-6">
                <h1 className="text-3xl font-black text-slate-900">Manual Entry</h1>
                <p className="text-slate-400 text-sm mt-1">Post income, expenses, salaries, vendor bills or adjustments</p>
            </div>

            {result && (
                <div className={`mb-5 flex items-start gap-3 px-4 py-3 rounded-xl text-sm font-medium ${result.ok
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                        : 'bg-rose-50 border border-rose-200 text-rose-700'
                    }`}>
                    {result.ok ? <CheckCircle size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
                    <span>{result.msg}</span>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* Entry Type Selection */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Entry Type *</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {ENTRY_TYPES.map(t => (
                                <button
                                    key={t.value}
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, entry_type: t.value }))}
                                    className={`px-4 py-3 rounded-xl text-left border transition text-sm ${form.entry_type === t.value
                                            ? 'border-blue-500 bg-blue-50 text-blue-700 font-black shadow-sm'
                                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    <div className="font-bold">{t.label}</div>
                                    <div className="text-xs opacity-70 mt-0.5">{t.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Default accounts info */}
                    {defaults.dr && (
                        <div className="bg-slate-50 rounded-xl px-4 py-3 text-xs text-slate-500">
                            <span className="font-black text-slate-600">Default: </span>
                            <span className="text-blue-600 font-bold">DR {defaults.dr}</span>
                            {' → '}
                            <span className="text-rose-600 font-bold">CR {defaults.cr}</span>
                            <span className="ml-2 text-slate-400">(override below if needed)</span>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        {/* Date */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date *</label>
                            <input type="date" required value={form.date}
                                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        {/* Amount */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Amount (PKR) *</label>
                            <input type="number" required min="0.01" step="0.01" value={form.amount}
                                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="0.00" />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Description *</label>
                        <input required value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Brief description of this entry" />
                    </div>

                    {/* Account overrides */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                Debit Account <span className="text-slate-300">(override)</span>
                            </label>
                            <select value={form.debit_account_id}
                                onChange={e => setForm(f => ({ ...f, debit_account_id: e.target.value }))}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">— Use default —</option>
                                {accounts.map(a => <option key={a._id} value={a._id}>{a.code} – {a.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                Credit Account <span className="text-slate-300">(override)</span>
                            </label>
                            <select value={form.credit_account_id}
                                onChange={e => setForm(f => ({ ...f, credit_account_id: e.target.value }))}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">— Use default —</option>
                                {accounts.map(a => <option key={a._id} value={a._id}>{a.code} – {a.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Notes</label>
                        <textarea rows={2} value={form.notes}
                            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            placeholder="Optional notes" />
                    </div>

                    <button type="submit" disabled={saving}
                        className="w-full py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 disabled:opacity-50 transition text-sm tracking-wider">
                        {saving ? 'Posting…' : 'Post Journal Entry'}
                    </button>
                </form>
            </div>
        </div>
    );
}
