import React, { useState, useEffect } from 'react';
import {
    Plus, Filter, Copy, MoreVertical, Building2, User,
    CreditCard, Check, X, Edit3, Trash2, Search, Bell,
    Receipt, Download, Eye, DollarSign, CheckCircle, Clock, XCircle
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

    // Voucher states
    const [vouchers, setVouchers] = useState([]);
    const [voucherForm, setVoucherForm] = useState({
        userName: '',
        userEmail: '',
        contactNumber: '',
        reason: '',
        amount: '',
        expiryDate: '',
        currency: 'PKR',
        paymentMethod: 'wallet'
    });
    const [isGeneratingVoucher, setIsGeneratingVoucher] = useState(false);
    const [selectedVoucher, setSelectedVoucher] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    // Form States - MOVED TO PAGE
    // const [formData, setFormData] = useState({...}); 
    // const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        if (activeTab === 'Bank Accounts') {
            fetchAccounts();
            fetchAgencies();
            fetchBranches();
        } else if (activeTab === 'Vouchers') {
            fetchVouchers();
        }
    }, [activeTab]);

    // Load current user data and auto-fill form
    useEffect(() => {
        const loadCurrentUser = async () => {
            try {
                const token = localStorage.getItem('access_token');
                if (!token) return;

                // Decode JWT token to get user info
                const payload = JSON.parse(atob(token.split('.')[1]));

                // Try to get additional user data from localStorage
                const userData = JSON.parse(localStorage.getItem('user_data') || '{}');

                // Determine if this is an organization login or user linked to org
                const orgId = payload.organization_id || (payload.user_type === 'organization' ? payload.sub : null) || (payload.entity_type === 'organization' ? payload.entity_id : null);

                if (orgId) {
                    // Fetch organization details from backend
                    try {
                        const resp = await fetch(`http://localhost:8000/api/organizations/${orgId}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (resp.ok) {
                            const org = await resp.json();
                            setCurrentUser(org);
                            setVoucherForm(prev => ({
                                ...prev,
                                userName: org.name || userData.name || payload.name || '',
                                userEmail: org.email || userData.email || payload.email || payload.sub || '',
                                contactNumber: org.phone || userData.phone || payload.phone || ''
                            }));
                            return;
                        }
                    } catch (err) {
                        console.error('Failed to fetch organization details:', err);
                    }
                }

                // Fallback to individual user info
                const user = {
                    name: userData.name || payload.name || '',
                    email: userData.email || payload.email || payload.sub || '',
                    phone: userData.phone || payload.phone || '',
                    id: payload.sub || userData._id
                };
                setCurrentUser(user);
                setVoucherForm(prev => ({
                    ...prev,
                    userName: user.name,
                    userEmail: user.email,
                    contactNumber: user.phone
                }));
            } catch (error) {
                console.error('Error loading user data:', error);
            }
        };

        loadCurrentUser();
    }, []);

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

    // Voucher Functions
    const fetchVouchers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('http://localhost:8000/api/payments/vouchers/', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setVouchers(data);
            }
        } catch (error) {
            console.error('Error fetching vouchers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVoucherInputChange = (e) => {
        const { name, value } = e.target;
        setVoucherForm(prev => ({ ...prev, [name]: value }));
    };

    const generateVoucher = async (e) => {
        e.preventDefault();
        setIsGeneratingVoucher(true);
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('http://localhost:8000/api/payments/vouchers/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_name: voucherForm.userName,
                    user_email: voucherForm.userEmail,
                    contact_number: voucherForm.contactNumber,
                    reason: voucherForm.reason,
                    amount: parseFloat(voucherForm.amount),
                    expiry_date: voucherForm.expiryDate,
                    currency: voucherForm.currency,
                    payment_method: voucherForm.paymentMethod
                })
            });

            if (response.ok) {
                const newVoucher = await response.json();
                setVouchers(prev => [newVoucher, ...prev]);
                // Reset only the fields that should be cleared (not user info)
                setVoucherForm(prev => ({
                    ...prev,
                    reason: '',
                    amount: '',
                    expiryDate: '',
                    currency: 'PKR',
                    paymentMethod: 'wallet'
                }));
                alert('Voucher generated successfully!');
            } else {
                const error = await response.json();
                alert(error.detail || 'Failed to generate voucher');
            }
        } catch (error) {
            console.error('Error generating voucher:', error);
            alert('Error generating voucher');
        } finally {
            setIsGeneratingVoucher(false);
        }
    };

    const initiatePayment = async (voucher) => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('http://localhost:8000/api/payments/topup/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    wallet_id: voucher.wallet_id,
                    amount: voucher.amount,
                    currency: voucher.currency,
                    provider: 'local_gateway',
                    return_url: window.location.origin + '/payments/complete',
                    metadata: { voucher_id: voucher._id }
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.provider_session?.checkout_url) {
                    window.open(data.provider_session.checkout_url, '_blank');
                } else {
                    alert('Payment session created. Transaction ID: ' + data.transaction_id);
                }
                fetchVouchers(); // Refresh list
            } else {
                const error = await response.json();
                alert(error.detail || 'Failed to initiate payment');
            }
        } catch (error) {
            console.error('Error initiating payment:', error);
            alert('Error initiating payment');
        }
    };

    const getVoucherStatusBadge = (status) => {
        const styles = {
            pending: 'bg-yellow-50 text-yellow-700 border-yellow-100',
            paid: 'bg-green-50 text-green-700 border-green-100',
            failed: 'bg-red-50 text-red-700 border-red-100',
            cancelled: 'bg-slate-50 text-slate-500 border-slate-100',
            expired: 'bg-orange-50 text-orange-700 border-orange-100',
        };
        const icons = {
            pending: Clock,
            paid: CheckCircle,
            failed: XCircle,
            cancelled: X,
            expired: XCircle
        };
        const Icon = icons[status] || Clock;
        return (
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${styles[status] || styles.pending}`}>
                <Icon size={12} />
                {status}
            </span>
        );
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
                        {['Ledger', 'Add Payment', 'Vouchers', 'Bank Accounts', 'Pending Payments', 'Booking History'].map((tab) => (
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

                        {/* VOUCHERS TAB */}
                        {activeTab === 'Vouchers' && (
                            <>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Voucher Generation Form */}
                                    <div className="lg:col-span-1 bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-2xl p-6 shadow-sm">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                                                <Receipt size={20} />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-900">Generate Voucher</h3>
                                                <p className="text-xs text-slate-500">Create payment voucher</p>
                                            </div>
                                        </div>

                                        <form onSubmit={generateVoucher} className="space-y-4">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide ml-1 block mb-1.5">Name</label>
                                                <input
                                                    type="text"
                                                    name="userName"
                                                    value={voucherForm.userName}
                                                    onChange={handleVoucherInputChange}
                                                    placeholder="User name"
                                                    readOnly
                                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 cursor-not-allowed"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide ml-1 block mb-1.5">Email Address</label>
                                                <input
                                                    type="email"
                                                    name="userEmail"
                                                    value={voucherForm.userEmail}
                                                    onChange={handleVoucherInputChange}
                                                    placeholder="user@example.com"
                                                    readOnly
                                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 cursor-not-allowed"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide ml-1 block mb-1.5">Contact Number *</label>
                                                <input
                                                    type="tel"
                                                    name="contactNumber"
                                                    value={voucherForm.contactNumber}
                                                    onChange={handleVoucherInputChange}
                                                    placeholder="03000000000"
                                                    readOnly
                                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 cursor-not-allowed"
                                                />
                                                <p className="text-[9px] text-slate-400 mt-1 ml-1">Enter the contact number for this bill</p>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide ml-1 block mb-1.5">Reason *</label>
                                                <textarea
                                                    name="reason"
                                                    value={voucherForm.reason}
                                                    onChange={handleVoucherInputChange}
                                                    placeholder="Enter reason for bill"
                                                    rows="3"
                                                    required
                                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:border-blue-500 transition-all resize-none"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide ml-1 block mb-1.5">Amount *</label>
                                                <input
                                                    type="number"
                                                    name="amount"
                                                    value={voucherForm.amount}
                                                    onChange={handleVoucherInputChange}
                                                    placeholder="Enter amount"
                                                    step="0.01"
                                                    required
                                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:border-blue-500 transition-all"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide ml-1 block mb-1.5">Expiry Date *</label>
                                                <input
                                                    type="date"
                                                    name="expiryDate"
                                                    value={voucherForm.expiryDate}
                                                    onChange={handleVoucherInputChange}
                                                    required
                                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:border-blue-500 transition-all"
                                                />
                                                <p className="text-[9px] text-slate-400 mt-1 ml-1">Bill will be blocked when expiry date passes</p>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide ml-1 block mb-1.5">Currency</label>
                                                <select
                                                    name="currency"
                                                    value={voucherForm.currency}
                                                    onChange={handleVoucherInputChange}
                                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:border-blue-500 transition-all"
                                                >
                                                    <option value="PKR">PKR</option>
                                                    <option value="USD">USD</option>
                                                    <option value="SAR">SAR</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide ml-1 block mb-1.5">Payment Method</label>
                                                <select
                                                    name="paymentMethod"
                                                    value={voucherForm.paymentMethod}
                                                    onChange={handleVoucherInputChange}
                                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:border-blue-500 transition-all"
                                                >
                                                    <option value="wallet">Wallet</option>
                                                    <option value="bank_transfer">Bank Transfer</option>
                                                    <option value="card">Card</option>
                                                </select>
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={isGeneratingVoucher}
                                                className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isGeneratingVoucher ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                        Generating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Receipt size={18} />
                                                        Generate Voucher
                                                    </>
                                                )}
                                            </button>
                                        </form>
                                    </div>

                                    {/* Voucher List */}
                                    <div className="lg:col-span-2">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-bold text-slate-900">Recent Vouchers</h3>
                                            <div className="flex items-center gap-2">
                                                <button className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-600 transition-all">
                                                    <Filter size={14} className="inline mr-1" />
                                                    Filter
                                                </button>
                                            </div>
                                        </div>

                                        {loading ? (
                                            <div className="flex justify-center items-center h-64 bg-white rounded-2xl border border-slate-200">
                                                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        ) : vouchers.length === 0 ? (
                                            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                                                <Receipt size={48} className="mx-auto text-slate-300 mb-3" />
                                                <p className="text-sm font-bold text-slate-400">No vouchers yet</p>
                                                <p className="text-xs text-slate-400 mt-1">Generate your first voucher to get started</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {vouchers.map((voucher) => (
                                                    <div
                                                        key={voucher._id || voucher.id}
                                                        className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg transition-all group"
                                                    >
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex items-start gap-3">
                                                                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                                                                    <Receipt size={24} />
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-sm font-bold text-slate-800">{voucher.user_name || voucher.recipient}</h4>
                                                                    <p className="text-xs text-slate-500 mt-0.5">{voucher.user_email}</p>
                                                                    <p className="text-xs text-slate-600 mt-1 font-medium">{voucher.reason || voucher.description || 'No reason'}</p>
                                                                    <p className="text-xs text-slate-400 mt-1 font-mono">Voucher #{voucher.consumer_number || voucher.voucher_number || voucher._id?.slice(-8) || voucher.id?.slice(-8)}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-lg font-bold text-slate-900">{voucher.currency} {parseFloat(voucher.amount).toLocaleString()}</p>
                                                                {getVoucherStatusBadge(voucher.status || 'pending')}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                                            <div className="flex items-center gap-4 text-xs text-slate-500">
                                                                <span>Contact: <strong className="text-slate-700">{voucher.contact_number || 'N/A'}</strong></span>
                                                                <span>Expiry: <strong className="text-slate-700">{
                                                                    voucher.expiry_date ? (
                                                                        voucher.expiry_date.length === 8 
                                                                            ? `${voucher.expiry_date.substring(0,4)}-${voucher.expiry_date.substring(4,6)}-${voucher.expiry_date.substring(6,8)}`
                                                                            : new Date(voucher.expiry_date).toLocaleDateString()
                                                                    ) : 'N/A'
                                                                }</strong></span>
                                                                <span>Created: <strong className="text-slate-700">{new Date(voucher.created_at || Date.now()).toLocaleDateString()}</strong></span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {voucher.status === 'pending' && (
                                                                    <button
                                                                        onClick={() => initiatePayment(voucher)}
                                                                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-all flex items-center gap-1.5"
                                                                    >
                                                                        <DollarSign size={14} />
                                                                        Pay Now
                                                                    </button>
                                                                )}
                                                                <button className="p-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
                                                                    <Eye size={16} />
                                                                </button>
                                                                <button className="p-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
                                                                    <Download size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

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
