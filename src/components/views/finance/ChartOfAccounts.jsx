import React, { useEffect, useState } from 'react';
import { coaAPI } from '../../../services/financeService';
import { Plus, RefreshCw, BookOpen, CheckCircle, XCircle } from 'lucide-react';

const ACCOUNT_TYPES = ['asset', 'liability', 'equity', 'income', 'expense'];

const TYPE_COLORS = {
    asset: 'bg-blue-100 text-blue-700',
    liability: 'bg-rose-100 text-rose-700',
    equity: 'bg-purple-100 text-purple-700',
    income: 'bg-emerald-100 text-emerald-700',
    expense: 'bg-amber-100 text-amber-700',
};

export default function ChartOfAccounts() {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [typeFilter, setTypeFilter] = useState('');
    const [form, setForm] = useState({ code: '', name: '', type: 'asset', description: '' });
    const [saving, setSaving] = useState(false);
    const [seeding, setSeeding] = useState(false);
    const [msg, setMsg] = useState('');

    const orgId = localStorage.getItem('organization_id') || '';

    const load = async () => {
        setLoading(true);
        try {
            const params = { organization_id: orgId };
            if (typeFilter) params.account_type = typeFilter;
            const res = await coaAPI.getAll(params);
            setAccounts(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [typeFilter]);

    const handleSeed = async () => {
        if (!orgId) { setMsg('Organization ID not found in session.'); return; }
        setSeeding(true);
        try {
            const res = await coaAPI.seed(orgId);
            setMsg(`Seeded: ${res.data.inserted} accounts, ${res.data.skipped} already existed.`);
            load();
        } catch (e) {
            setMsg('Seed failed: ' + (e.response?.data?.detail || e.message));
        } finally {
            setSeeding(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await coaAPI.create({ ...form, organization_id: orgId });
            setShowForm(false);
            setForm({ code: '', name: '', type: 'asset', description: '' });
            setMsg('Account created successfully.');
            load();
        } catch (e) {
            setMsg('Error: ' + (e.response?.data?.detail || e.message));
        } finally {
            setSaving(false);
        }
    };

    const grouped = ACCOUNT_TYPES.reduce((acc, t) => {
        acc[t] = accounts.filter(a => a.type === t);
        return acc;
    }, {});

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">Chart of Accounts</h1>
                    <p className="text-slate-400 text-sm mt-1">{accounts.length} accounts</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleSeed} disabled={seeding}
                        className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition">
                        <BookOpen size={16} />
                        {seeding ? 'Seeding…' : 'Seed Default COA'}
                    </button>
                    <button onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition">
                        <Plus size={16} /> Add Account
                    </button>
                </div>
            </div>

            {msg && (
                <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-xl font-medium">
                    {msg}
                    <button onClick={() => setMsg('')} className="ml-3 underline text-xs">dismiss</button>
                </div>
            )}

            {/* Type filter tabs */}
            <div className="flex gap-2 mb-5 flex-wrap">
                {['', ...ACCOUNT_TYPES].map(t => (
                    <button key={t} onClick={() => setTypeFilter(t)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition ${typeFilter === t ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                        {t || 'All'}
                    </button>
                ))}
            </div>

            {/* Create Form */}
            {showForm && (
                <div className="bg-white border border-slate-100 rounded-2xl p-6 mb-6 shadow-sm">
                    <h3 className="font-black text-slate-800 mb-4 text-sm uppercase tracking-widest">New Account</h3>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Code *</label>
                            <input required value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 1005" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Name *</label>
                            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Account name" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Type *</label>
                            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Description</label>
                            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Optional" />
                        </div>
                        <div className="sm:col-span-2 flex gap-2 justify-end">
                            <button type="button" onClick={() => setShowForm(false)}
                                className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50">Cancel</button>
                            <button type="submit" disabled={saving}
                                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50">
                                {saving ? 'Saving…' : 'Create Account'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-12"><RefreshCw size={28} className="animate-spin text-blue-400" /></div>
            ) : (
                <div className="space-y-6">
                    {(typeFilter ? [typeFilter] : ACCOUNT_TYPES).map(type => {
                        const rows = grouped[type] || [];
                        if (!rows.length) return null;
                        return (
                            <div key={type} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${TYPE_COLORS[type]}`}>
                                        {type}
                                    </span>
                                    <span className="text-slate-400 text-xs">{rows.length} accounts</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                {['Code', 'Name', 'Status', 'Description'].map(h => (
                                                    <th key={h} className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {rows.map(a => (
                                                <tr key={a._id} className="hover:bg-slate-50/50 transition">
                                                    <td className="px-5 py-3 font-mono text-sm font-bold text-slate-800">{a.code}</td>
                                                    <td className="px-5 py-3 text-sm text-slate-700 font-medium">{a.name}</td>
                                                    <td className="px-5 py-3">
                                                        {a.is_active
                                                            ? <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold"><CheckCircle size={12} /> Active</span>
                                                            : <span className="flex items-center gap-1 text-slate-400 text-xs font-bold"><XCircle size={12} /> Inactive</span>
                                                        }
                                                    </td>
                                                    <td className="px-5 py-3 text-sm text-slate-400">{a.description || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
