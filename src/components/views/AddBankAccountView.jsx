import React, { useState, useEffect } from 'react';
import {
    ArrowLeft, CreditCard, User, Building2, MoreVertical, Check, Loader2, Landmark
} from 'lucide-react';

export default function AddBankAccountView({ onBack, editingAccount }) {
    const [loading, setLoading] = useState(false);
    const [agencies, setAgencies] = useState([]);
    const [branches, setBranches] = useState([]);

    // Determine initial type based on editingAccount or default
    const getInitialType = () => {
        if (!editingAccount) return 'company';
        if (editingAccount.account_type === 'Agency') return 'agent';
        if (editingAccount.account_type === 'Branch') return 'branch';
        return 'company';
    };

    const [accountType, setAccountType] = useState(getInitialType());

    const [formData, setFormData] = useState({
        bankName: editingAccount?.bank_name || '',
        accountTitle: editingAccount?.account_title || '',
        accountNumber: editingAccount?.account_number || '',
        iban: editingAccount?.iban || '',
        status: editingAccount?.status || 'Active',
        agencyId: editingAccount?.agency_id || '',
        branchId: editingAccount?.branch_id || ''
    });

    useEffect(() => {
        fetchAgencies();
        fetchBranches();
    }, []);

    const fetchAgencies = async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) return;

            const response = await fetch(`http://localhost:8000/api/agencies`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setAgencies(data);
            }
        } catch (error) {
            console.error('Error fetching agencies:', error);
        }
    };

    const fetchBranches = async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) return;

            const response = await fetch(`http://localhost:8000/api/branches`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setBranches(data);
            }
        } catch (error) {
            console.error('Error fetching branches:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const url = editingAccount
                ? `http://localhost:8000/api/bank-accounts/${editingAccount._id}`
                : 'http://localhost:8000/api/bank-accounts';

            const method = editingAccount ? 'PUT' : 'POST';

            const payload = {
                bank_name: formData.bankName,
                account_title: formData.accountTitle,
                account_number: formData.accountNumber,
                iban: formData.iban,
                status: formData.status,
            };

            if (accountType === 'agent') {
                if (!formData.agencyId) {
                    alert('Please select an agency');
                    setLoading(false);
                    return;
                }
                payload.account_type = 'Agency';
                payload.agency_id = formData.agencyId;
                payload.branch_id = null;
            } else if (accountType === 'branch') {
                if (!formData.branchId) {
                    alert('Please select a branch');
                    setLoading(false);
                    return;
                }
                payload.account_type = 'Branch';
                payload.branch_id = formData.branchId;
                payload.agency_id = null;
            } else {
                payload.account_type = 'Organization';
                payload.agency_id = null;
                payload.branch_id = null;
            }

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                onBack(); // Go back to list
            } else {
                const err = await response.json();
                alert(`Failed to save account: ${err.detail || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error saving account:', error);
            alert('Error saving account');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#F8F9FD]">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-8 py-6 flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-full transition-all"
                >
                    <ArrowLeft size={20} className="stroke-[3]" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                        {editingAccount ? 'Edit Bank Account' : 'Add New Bank Account'}
                    </h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                        Fill in the details below to {editingAccount ? 'update the' : 'create a new'} bank account.
                    </p>
                </div>
            </div>

            {/* Content using Layout similar to other pages */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-3xl mx-auto space-y-8">

                    {/* Account Owner Card */}
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
                        <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                            <Building2 size={20} className="text-blue-600" /> Account Owner
                        </h2>

                        <div className="flex bg-slate-50 p-1.5 rounded-2xl mb-8">
                            <button
                                onClick={() => { setAccountType('company'); setFormData(p => ({ ...p, agencyId: '', branchId: '' })); }}
                                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2
                                    ${accountType === 'company' ? 'bg-white text-blue-600 shadow-md shadow-slate-100 ring-1 ring-slate-100' : 'text-slate-500 hover:text-slate-700'}
                                `}
                            >
                                <Building2 size={16} /> Company Account
                            </button>
                            <button
                                onClick={() => { setAccountType('agent'); setFormData(p => ({ ...p, branchId: '' })); }}
                                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2
                                    ${accountType === 'agent' ? 'bg-white text-blue-600 shadow-md shadow-slate-100 ring-1 ring-slate-100' : 'text-slate-500 hover:text-slate-700'}
                                `}
                            >
                                <User size={16} /> Agent Account
                            </button>
                            <button
                                onClick={() => { setAccountType('branch'); setFormData(p => ({ ...p, agencyId: '' })); }}
                                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2
                                    ${accountType === 'branch' ? 'bg-white text-blue-600 shadow-md shadow-slate-100 ring-1 ring-slate-100' : 'text-slate-500 hover:text-slate-700'}
                                `}
                            >
                                <Building2 size={16} /> Branch Account
                            </button>
                        </div>

                        {accountType === 'agent' && (
                            <div className="space-y-1.5 animate-in slide-in-from-top-2">
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Select Agency</label>
                                <div className="relative">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <select
                                        name="agencyId"
                                        value={formData.agencyId}
                                        onChange={handleInputChange}
                                        className="w-full pl-11 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer outline-none"
                                        required
                                    >
                                        <option value="">Select Agency...</option>
                                        {agencies.map(agency => (
                                            <option key={agency.id || agency._id} value={agency.id || agency._id}>{agency.name}</option>
                                        ))}
                                    </select>
                                    <MoreVertical className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                </div>
                            </div>
                        )}

                        {accountType === 'branch' && (
                            <div className="space-y-1.5 animate-in slide-in-from-top-2">
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Select Branch</label>
                                <div className="relative">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <select
                                        name="branchId"
                                        value={formData.branchId}
                                        onChange={handleInputChange}
                                        className="w-full pl-11 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer outline-none"
                                        required
                                    >
                                        <option value="">Select Branch...</option>
                                        {branches.map(branch => (
                                            <option key={branch.id || branch._id} value={branch.id || branch._id}>{branch.name}</option>
                                        ))}
                                    </select>
                                    <MoreVertical className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Basic Details Card */}
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
                        <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                            <Landmark size={20} className="text-blue-600" /> Account Details
                        </h2>

                        <div className="space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Bank Name</label>
                                <div className="relative">
                                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        name="bankName"
                                        value={formData.bankName}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Meezan Bank"
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Account Title</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        name="accountTitle"
                                        value={formData.accountTitle}
                                        onChange={handleInputChange}
                                        placeholder="e.g. John Doe"
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Account Number</label>
                                    <input
                                        type="text"
                                        name="accountNumber"
                                        value={formData.accountNumber}
                                        onChange={handleInputChange}
                                        placeholder="0000..."
                                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono font-bold text-slate-700 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">IBAN</label>
                                    <input
                                        type="text"
                                        name="iban"
                                        value={formData.iban}
                                        onChange={handleInputChange}
                                        placeholder="PK..."
                                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono font-bold text-slate-700 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Status</label>
                                <div className="relative">
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer outline-none"
                                    >
                                        <option>Active</option>
                                        <option>Inactive</option>
                                    </select>
                                    <MoreVertical className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-4 pt-4">
                        <button
                            onClick={onBack}
                            type="button"
                            className="px-8 py-3.5 rounded-2xl text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            type="button"
                            className="px-8 py-3.5 bg-blue-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} strokeWidth={2.5} />}
                            {editingAccount ? 'Update Account' : 'Create Account'}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
