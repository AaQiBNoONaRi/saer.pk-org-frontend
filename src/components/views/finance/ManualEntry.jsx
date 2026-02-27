import React, { useEffect, useState } from 'react';
import { manualEntryAPI, coaAPI } from '../../../services/financeService';
import { CheckCircle, AlertCircle, Lock } from 'lucide-react';
import { getModulePermissions } from '../../../utils/permissions';
import api from '../../../services/api';

// Entry types – Income Entry and Adjustment Entry have been removed
const ENTRY_TYPES = [
    {
        value: 'manual_expense',
        label: 'Expense Entry',
        desc: 'General operating expense (WiFi, Rent, Utilities…)',
    },
    {
        value: 'salary',
        label: 'Salary Entry',
        desc: 'Employee salary payment',
    },
    {
        value: 'vendor_bill',
        label: 'Vendor Bill',
        desc: 'Pay a supplier / vendor invoice',
    },
];

// Vendor bill sub-types – used to filter the credit account list
const VENDOR_TYPES = [
    { value: 'ticket', label: 'Ticket Vendor' },
    { value: 'package', label: 'Package Vendor' },
    { value: 'hotel', label: 'Hotel Vendor' },
    { value: 'other', label: 'Other Vendor' },
];

export default function ManualEntry() {
    const [accounts, setAccounts] = useState([]);
    const [bankAccounts, setBankAccounts] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [form, setForm] = useState({
        entry_type: 'manual_expense',
        date: new Date().toISOString().slice(0, 10),
        description: '',
        amount: '',
        debit_account_id: '',   // Pay FROM  (cash / bank)
        credit_account_id: '',   // Pay TO    (expense / employee / vendor)
        vendor_type: 'ticket',
        employee_id: '',
        notes: '',
    });
    const [saving, setSaving] = useState(false);
    const [result, setResult] = useState(null);

    const orgId = localStorage.getItem('organization_id') || '';
    const perms = getModulePermissions('finance.manual_posting');
    const canAdd = perms.add;

    // ── Fetch COA & Employees ────────────────────────────────────────────────
    useEffect(() => {
        coaAPI.getAll({ organization_id: orgId, is_active: true })
            .then(r => setAccounts(r.data))
            .catch(console.error);

        // Fetch actual bank accounts created by the organisation
        api.get('/api/bank-accounts/', { params: { include_system: true } })
            .then(r => setBankAccounts(r.data || []))
            .catch(console.error);

        // Fetch employees for salary picker
        api.get('/api/employees', { params: { organization_id: orgId } })
            .then(r => setEmployees(r.data?.data || r.data || []))
            .catch(console.error);
    }, []);

    // ── Derived account lists ────────────────────────────────────────────────
    // Build a lookup of org bank accounts by COA-matched name for richer labels
    const orgBankMap = {};
    bankAccounts
        .filter(b => b.is_active !== false && b.account_type === 'Organization')
        .forEach(b => { orgBankMap[`${b.bank_name} - ${b.account_title}`] = b; });

    // "Pay FROM" options: read directly from COA asset accounts (cash and bank).
    // The parent "Bank Account" (1002) already holds the correct aggregated balance
    // from all journal entries — sub-accounts that haven't been individually posted
    // to will show 0 naturally and can be ignored.
    const uniquePayFromOptions = accounts
        .filter(a => a.type === 'asset' && /cash|bank/i.test(a.name))
        .map(a => {
            const bal = a.current_balance ?? 0;
            const matchedBank = orgBankMap[a.name];
            const label = matchedBank
                ? `${matchedBank.bank_name} – ${matchedBank.account_title} (…${(matchedBank.account_number || '').slice(-4)}) — Balance: PKR ${bal.toLocaleString()}`
                : `${a.code} – ${a.name} — Balance: PKR ${bal.toLocaleString()}`;
            return { id: a._id, coaId: a._id, bankId: matchedBank?._id || null, balance: bal, label, source: 'coa' };
        })
        .sort((a, b) => b.balance - a.balance);

    // Expense accounts: type === 'expense'
    const expenseAccounts = accounts.filter(a => a.type === 'expense');

    // Vendor / payable accounts
    const vendorAccountFor = (vType) => {
        const keywords = {
            ticket: /ticket/i,
            package: /package/i,
            hotel: /hotel/i,
            other: /other vendor|miscellaneous|payable/i,
        };
        const kw = keywords[vType] || /payable/i;
        return accounts.filter(a => a.type === 'liability' && kw.test(a.name));
    };

    // Employee payable accounts (for salary credit side)
    const employeePayableAccounts = accounts.filter(a =>
        a.type === 'liability' && /salary|payable/i.test(a.name)
    );

    // ── Reset dependent fields when entry type changes ───────────────────────
    const handleTypeChange = (val) => {
        setForm(f => ({
            ...f,
            entry_type: val,
            debit_account_id: '',
            credit_account_id: '',
            employee_id: '',
            vendor_type: 'ticket',
        }));
    };

    // ── Submit ───────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.amount || Number(form.amount) <= 0) {
            setResult({ ok: false, msg: 'Amount must be greater than 0.' });
            return;
        }
        if (!form.debit_account_id) {
            setResult({ ok: false, msg: 'Please select a Pay From (Cash/Bank) account.' });
            return;
        }
        // Balance check: disallow if amount exceeds selected account balance
        const selectedPayFrom = uniquePayFromOptions.find(o => o.id === form.debit_account_id);
        if (selectedPayFrom && Number(form.amount) > selectedPayFrom.balance) {
            setResult({
                ok: false,
                msg: `Insufficient balance. Selected account has PKR ${selectedPayFrom.balance.toLocaleString()} available, but you entered PKR ${Number(form.amount).toLocaleString()}.`
            });
            return;
        }
        if (!form.credit_account_id && form.entry_type !== 'salary') {
            setResult({ ok: false, msg: 'Please select a Credit account.' });
            return;
        }
        if (form.entry_type === 'salary' && !form.employee_id) {
            setResult({ ok: false, msg: 'Please select an employee.' });
            return;
        }

        setSaving(true);
        setResult(null);
        try {
            // For salary, add employee name to description if not already there
            let description = form.description;
            if (form.entry_type === 'salary' && form.employee_id) {
                const emp = employees.find(e => e._id === form.employee_id || e.id === form.employee_id);
                if (emp) {
                    const empName = emp.full_name || emp.name || emp.emp_id;
                    if (!description.includes(empName)) {
                        description = `Salary – ${empName}` + (description ? `: ${description}` : '');
                    }
                }
            }

            const payload = {
                entry_type: form.entry_type,
                date: form.date,
                description,
                amount: parseFloat(form.amount),
                organization_id: orgId,
                debit_account_id: form.debit_account_id || undefined,
                credit_account_id: form.credit_account_id || undefined,
                notes: form.notes || undefined,
                ...(form.entry_type === 'salary' ? { employee_id: form.employee_id } : {}),
                ...(form.entry_type === 'vendor_bill' ? { vendor_type: form.vendor_type } : {}),
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
                employee_id: '',
            }));
        } catch (err) {
            setResult({ ok: false, msg: err.response?.data?.detail || err.message });
        } finally {
            setSaving(false);
        }
    };

    // ── Helpers ───────────────────────────────────────────────────────────────
    const AccountSelect = ({ label, value, onChange, options, placeholder = '— Select account —' }) => (
        <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                {label} *
            </label>
            <select
                required
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <option value="">{placeholder}</option>
                {options.map(a => (
                    <option key={a._id} value={a._id}>{a.code} – {a.name}</option>
                ))}
            </select>
            {options.length === 0 && (
                <p className="text-[10px] text-amber-500 mt-1 font-bold">
                    No matching accounts found. Please seed your Chart of Accounts first.
                </p>
            )}
        </div>
    );

    // Credit account selector is only needed for expense entries.
    // Salary and vendor bills are auto-resolved by the backend.
    const showCreditPicker = form.entry_type === 'manual_expense';

    return (
        <div className="max-w-2xl">
            <div className="mb-6">
                <h1 className="text-3xl font-black text-slate-900">Manual Entry</h1>
                <p className="text-slate-400 text-sm mt-1">Post expenses, salary payments or vendor bills</p>
            </div>

            {result && (
                <div className={`mb-5 flex items-start gap-3 px-4 py-3 rounded-xl text-sm font-medium ${result.ok
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                    : 'bg-rose-50 border border-rose-200 text-rose-700'
                    }`}>
                    {result.ok
                        ? <CheckCircle size={18} className="shrink-0 mt-0.5" />
                        : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
                    <span>{result.msg}</span>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* Entry Type Selection */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Entry Type *</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {ENTRY_TYPES.map(t => (
                                <button
                                    key={t.value}
                                    type="button"
                                    onClick={() => handleTypeChange(t.value)}
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

                    {/* Vendor type picker  (only for vendor_bill) */}
                    {form.entry_type === 'vendor_bill' && (
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Vendor Type *</label>
                            <div className="grid grid-cols-2 gap-2">
                                {VENDOR_TYPES.map(v => {
                                    // Map vendor type to COA code to find balance
                                    const codeMap = { ticket: '2001.1', package: '2001.2', hotel: '2001.3', other: '2001.4' };
                                    const vendorCoa = accounts.find(a => a.code === codeMap[v.value]);
                                    const payable = vendorCoa?.current_balance ?? 0;
                                    const isSelected = form.vendor_type === v.value;
                                    return (
                                        <button
                                            key={v.value}
                                            type="button"
                                            onClick={() => setForm(f => ({ ...f, vendor_type: v.value, credit_account_id: '' }))}
                                            className={`px-4 py-3 rounded-xl border text-left transition ${isSelected
                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                                                }`}
                                        >
                                            <div className="text-sm font-bold">{v.label}</div>
                                            <div className={`text-xs mt-0.5 font-black ${payable > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                                                Payable: PKR {payable.toLocaleString()}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Employee picker  (only for salary) */}
                    {form.entry_type === 'salary' && (
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Employee *</label>
                            <select
                                required
                                value={form.employee_id}
                                onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">— Select Employee —</option>
                                {employees.map(emp => (
                                    <option key={emp._id || emp.id} value={emp._id || emp.id}>
                                        {emp.full_name || emp.name} ({emp.emp_id})
                                    </option>
                                ))}
                            </select>
                            {employees.length === 0 && (
                                <p className="text-[10px] text-amber-500 mt-1 font-bold">
                                    No employees found for this organization.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Date + Amount */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date *</label>
                            <input type="date" required value={form.date}
                                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
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
                            placeholder={
                                form.entry_type === 'vendor_bill' ? 'e.g. Visa fee, Ziyarat package, invoice # …'
                                    : form.entry_type === 'salary' ? 'e.g. March 2025 salary'
                                        : 'e.g. Monthly WiFi, Office Rent…'
                            }
                        />
                    </div>

                    {/* Pay FROM  –  cash or any bank account */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                            Pay From (Cash / Bank Account) *
                        </label>
                        <select
                            required
                            value={form.debit_account_id}
                            onChange={e => setForm(f => ({ ...f, debit_account_id: e.target.value }))}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">— Select cash or bank account —</option>
                            {uniquePayFromOptions.map(opt => (
                                <option key={opt.id} value={opt.id}>{opt.label}</option>
                            ))}
                        </select>
                        {uniquePayFromOptions.length === 0 && (
                            <p className="text-[10px] text-amber-500 mt-1 font-bold">
                                No cash/bank accounts found. Add a Bank Account from the Payments page first.
                            </p>
                        )}
                    </div>

                    {/* Pay TO — expense entry shows picker; salary & vendor are auto-resolved */}
                    {showCreditPicker && (
                        <AccountSelect
                            label="Expense Account"
                            value={form.credit_account_id}
                            onChange={v => setForm(f => ({ ...f, credit_account_id: v }))}
                            options={expenseAccounts}
                            placeholder="— Select expense account —"
                        />
                    )}

                    {form.entry_type === 'salary' && (
                        <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                            <span className="text-blue-500 mt-0.5 font-black text-xs">ℹ</span>
                            <p className="text-xs font-bold text-blue-600">
                                A <strong>Salary Payable</strong> account for the selected employee will be auto-created if it doesn't exist.
                            </p>
                        </div>
                    )}

                    {form.entry_type === 'vendor_bill' && (
                        <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                            <span className="text-blue-500 mt-0.5 font-black text-xs">ℹ</span>
                            <p className="text-xs font-bold text-blue-600">
                                A <strong>{form.vendor_type?.charAt(0).toUpperCase() + form.vendor_type?.slice(1)} Vendor Payable</strong> account will be auto-created if it doesn't exist.
                            </p>
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Notes</label>
                        <textarea rows={2} value={form.notes}
                            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            placeholder="Optional additional notes" />
                    </div>

                    {canAdd ? (
                        <button type="submit" disabled={saving}
                            className="w-full py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 disabled:opacity-50 transition text-sm tracking-wider">
                            {saving ? 'Posting…' : 'Post Journal Entry'}
                        </button>
                    ) : (
                        <div className="flex items-center gap-3 w-full py-3 px-4 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm font-bold">
                            <Lock size={16} className="shrink-0 text-slate-400" />
                            <span>You don't have permission to post journal entries.</span>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
