import React, { useState, useEffect } from 'react';
import {
    Plus, Filter, Copy, MoreVertical, Building2, User,
    CreditCard, Check, X, Edit3, Trash2, Search, Bell
} from 'lucide-react';

// --- Reusable Components (Internal) ---

const TabButton = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`
      pb-3 px-4 text-sm font-bold border-b-[3px] transition-all relative top-px
      ${active
                ? 'text-blue-600 border-blue-600'
                : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-200'}
    `}
    >
        {label}
    </button>
);

const Badge = ({ status }) => {
    const styles = {
        Active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        Inactive: 'bg-slate-50 text-slate-500 border-slate-100',
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${styles[status] || styles.Inactive}`}>
            {status}
        </span>
    );
};

export default function PaymentsView({ onAddAccount, onEditAccount }) {
    const [activeTab, setActiveTab] = useState('Bank Accounts');
    // const [isModalOpen, setIsModalOpen] = useState(false); // REMOVED
    // const [modalType, setModalType] = useState('company'); // REMOVED
    const [accounts, setAccounts] = useState([]);
    const [agencies, setAgencies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(false);

    // Form States - MOVED TO PAGE
    // const [formData, setFormData] = useState({...}); 
    // const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        if (activeTab === 'Bank Accounts') {
            fetchAccounts();
            fetchAgencies();
            fetchBranches();
        }
    }, [activeTab]);

    const fetchAgencies = async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) return;

            let orgId = null;
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                orgId = payload.organization_id || payload.sub;
            } catch (e) {
                console.error("Error parsing token", e);
            }

            if (orgId) {
                const response = await fetch(`http://localhost:8000/api/agencies?organization_id=${orgId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setAgencies(data);
                }
            }
        } catch (error) {
            console.error('Error fetching agencies:', error);
        }
    };

    const fetchBranches = async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) return;

            let orgId = null;
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                orgId = payload.organization_id || payload.sub;
            } catch (e) {
                console.error("Error parsing token", e);
            }

            if (orgId) {
                const response = await fetch(`http://localhost:8000/api/branches?organization_id=${orgId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setBranches(data);
                }
            }
        } catch (error) {
            console.error('Error fetching branches:', error);
        }
    };

    const fetchAccounts = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('http://localhost:8000/api/bank-accounts?include_agencies=true', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setAccounts(data);
            } else {
                console.error('Failed to fetch accounts');
            }
        } catch (error) {
            console.error('Error fetching accounts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('access_token');
            const url = editingId
                ? `http://localhost:8000/api/bank-accounts/${editingId}`
                : 'http://localhost:8000/api/bank-accounts';

            const method = editingId ? 'PUT' : 'POST';

            const payload = {
                bank_name: formData.bankName,
                account_title: formData.accountTitle,
                account_number: formData.accountNumber,
                iban: formData.iban,
                status: formData.status,
            };

            if (modalType === 'agent') {
                if (!formData.agencyId) {
                    alert('Please select an agency');
                    return;
                }
                payload.account_type = 'Agency';
                payload.agency_id = formData.agencyId;
                payload.branch_id = null;
            } else if (modalType === 'branch') {
                if (!formData.branchId) {
                    alert('Please select a branch');
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
                setIsModalOpen(false);
                setEditingId(null);
                setFormData({
                    bankName: '',
                    accountTitle: '',
                    accountNumber: '',
                    iban: '',
                    status: 'Active',
                    agencyId: '',
                    branchId: ''
                });
                fetchAccounts();
            } else {
                alert('Failed to save account');
            }
        } catch (error) {
            console.error('Error saving account:', error);
            alert('Error saving account');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this account?')) return;
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`http://localhost:8000/api/bank-accounts/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) fetchAccounts();
        } catch (error) {
            console.error(error);
        }
    };

    const openEditModal = (acc) => {
        setEditingId(acc._id);
        const type = acc.account_type === 'Branch' ? 'branch' : (acc.account_type === 'Agency' ? 'agent' : 'company');
        setFormData({
            bankName: acc.bank_name,
            accountTitle: acc.account_title,
            accountNumber: acc.account_number,
            iban: acc.iban || '',
            status: acc.status,
            agencyId: acc.agency_id || '',
            branchId: acc.branch_id || ''
        });
        setModalType(type);
        setIsModalOpen(true);
    };

    const getAgencyName = (id) => {
        const agency = agencies.find(a => a._id === id);
        return agency ? agency.name : '-';
    };

    const getBranchName = (id) => {
        const branch = branches.find(b => b._id === id);
        return branch ? branch.name : '-';
    };

    return (
        <div className="flex flex-col h-full bg-[#F8F9FD]">
            {/* Header (recreated locally or use Layout header? Layout has header. 
            The Layout renders children in a scrollable area.
            So I just need the content.
        */}

            <div className="flex-1 space-y-6">

                {/* Main Card */}
                <div className="bg-white rounded-[32px] shadow-sm border border-slate-100/50 min-h-[600px] flex flex-col">

                    {/* Tabs */}
                    <div className="px-8 pt-8 border-b border-slate-100 flex gap-6 overflow-x-auto no-scrollbar">
                        {['Ledger', 'Add Payment', 'Bank Accounts', 'Pending Payments', 'Booking History'].map((tab) => (
                            <TabButton
                                key={tab}
                                label={tab}
                                active={activeTab === tab}
                                onClick={() => setActiveTab(tab)}
                            />
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="p-8 space-y-8">

                        {activeTab === 'Bank Accounts' && (
                            <>
                                {/* Filter / Action Bar */}
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">

                                    {/* Filters */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full md:w-auto flex-1">
                                        {/* ... Filters UI ... */}
                                        {/* Simplified for brevity or keeping original */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide ml-1">Bank Name</label>
                                            <input type="text" placeholder="e.g. Meezan Bank" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:border-blue-500 transition-all" />
                                        </div>
                                        {/* ... other filters ... */}
                                        <div className="flex items-end gap-2">
                                            <button className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                                                <Filter size={16} /> Filter
                                            </button>
                                        </div>
                                    </div>

                                    {/* Main Action Button */}
                                    <button
                                        onClick={onAddAccount}
                                        className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 active:scale-95"
                                    >
                                        <Plus size={18} strokeWidth={2.5} />
                                        Add Bank Account
                                    </button>
                                </div>

                                {/* Data Table */}
                                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-slate-50/80 border-b border-slate-200">
                                                    {['Bank Name', 'Account Title', 'Account Number', 'IBAN', 'Owner', 'Type', 'Actions'].map((h, i) => (
                                                        <th key={i} className={`px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-left whitespace-nowrap ${i === 6 ? 'text-right' : ''}`}>{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {accounts.map((acc) => (
                                                    <tr key={acc._id} className="hover:bg-blue-50/30 transition-colors group">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                                                    {acc.bank_name?.charAt(0)}
                                                                </div>
                                                                <span className="text-sm font-bold text-slate-800">{acc.bank_name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-medium text-slate-600">{acc.account_title}</td>
                                                        <td className="px-6 py-4 text-sm font-mono font-medium text-slate-600">{acc.account_number}</td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2 text-sm font-mono font-medium text-slate-600">
                                                                {acc.iban}
                                                                <button className="text-slate-300 hover:text-blue-600 transition-colors" title="Copy IBAN">
                                                                    <Copy size={14} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-slate-500">
                                                            {acc.account_type === 'Agency' ? getAgencyName(acc.agency_id) :
                                                                (acc.account_type === 'Branch' ? getBranchName(acc.branch_id) : '-')}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {acc.account_type === 'Organization' && (
                                                                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold border border-blue-100">
                                                                    <Building2 size={12} /> Company
                                                                </span>
                                                            )}
                                                            {acc.account_type === 'Agency' && (
                                                                <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs font-bold border border-purple-100">
                                                                    <User size={12} /> Agent
                                                                </span>
                                                            )}
                                                            {acc.account_type === 'Branch' && (
                                                                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-xs font-bold border border-emerald-100">
                                                                    <Building2 size={12} /> Branch
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <Badge status={acc.status} />
                                                                <button onClick={() => onEditAccount(acc)} className="p-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors border border-transparent hover:border-blue-100">
                                                                    <Edit3 size={16} />
                                                                </button>
                                                                <button onClick={() => handleDelete(acc._id)} className="p-2 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors border border-transparent hover:border-rose-100">
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}

                    </div>
                </div>

            </div>
        </div>
    );
}
