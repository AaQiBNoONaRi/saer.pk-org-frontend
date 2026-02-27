import React, { useState, useEffect } from 'react';
import {
    Plus, Filter, Copy, Building2, User,
    Edit3, Trash2, Search, Eye, CheckCircle, XCircle,
    Upload, FileText, Clock, ChevronLeft, ChevronRight,
    CreditCard, Check, X, Bell, Receipt, Download, DollarSign
} from 'lucide-react';

const API = 'http://localhost:8000';

// --- Reusable Components ---

const TabButton = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`pb-3 px-4 text-sm font-bold border-b-[3px] transition-all relative top-px whitespace-nowrap
      ${active ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-200'}`}
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

const StatusBadge = ({ status }) => {
    const styles = {
        pending: 'bg-amber-50 text-amber-700 border-amber-200',
        approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        rejected: 'bg-red-50 text-red-700 border-red-200',
    };
    return (
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${styles[status] || styles.pending}`}>
            {status}
        </span>
    );
};

export default function PaymentsView({ onAddAccount, onEditAccount, permissions = null }) {
    const [activeTab, setActiveTab] = useState('Add Payment');
    const [accounts, setAccounts] = useState([]);
    const [agencies, setAgencies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // If permissions prop is not provided, assume full access (for org admin)
    const canAdd = permissions ? permissions.add : true;
    const canUpdate = permissions ? permissions.update : true;
    const canDelete = permissions ? permissions.delete : true;

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

    // Add Payment Tab State
    const [agencySearch, setAgencySearch] = useState('');
    const [selectedAgency, setSelectedAgency] = useState(null);
    const [orgBankAccounts, setOrgBankAccounts] = useState([]);
    const [agencyBankAccounts, setAgencyBankAccounts] = useState([]);
    const [paymentForm, setPaymentForm] = useState({
        mode: 'bank',
        beneficiaryAccount: '',
        agentAccount: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        slipFile: null,
    });
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [historySearch, setHistorySearch] = useState('');
    const [historyStatus, setHistoryStatus] = useState('all');
    const [historyPage, setHistoryPage] = useState(1);
    const [historyPerPage] = useState(10);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const token = () => localStorage.getItem('access_token');

    useEffect(() => {
        if (activeTab === 'Bank Accounts') {
            fetchAccounts();
            fetchAgencies();
            fetchBranches();
        } else if (activeTab === 'Vouchers') {
            fetchVouchers();
        } else if (activeTab === 'Add Payment' || activeTab === 'Pending Payments') {
            fetchPaymentHistory();
            fetchOrgBankAccounts();
            fetchAgencies();
            fetchBranches();
        } else {
            fetchAgencies();
            fetchBranches();
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
            const res = await fetch(`${API}/api/agencies`, { headers: { 'Authorization': `Bearer ${token()}` } });
            if (res.ok) setAgencies(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchBranches = async () => {
        try {
            const res = await fetch(`${API}/api/branches`, { headers: { 'Authorization': `Bearer ${token()}` } });
            if (res.ok) setBranches(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchAccounts = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/bank-accounts`, { headers: { 'Authorization': `Bearer ${token()}` } });
            if (res.ok) setAccounts(await res.json());
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const fetchOrgBankAccounts = async () => {
        try {
            const res = await fetch(`${API}/api/bank-accounts`, { headers: { 'Authorization': `Bearer ${token()}` } });
            if (res.ok) {
                const data = await res.json();
                setOrgBankAccounts(data.filter(a => a.account_type === 'Organization'));
            }
        } catch (e) { console.error(e); }
    };

    const fetchPaymentHistory = async () => {
        try {
            const res = await fetch(`${API}/api/payments/?exclude_credit=true`, { headers: { 'Authorization': `Bearer ${token()}` } });
            if (res.ok) setPaymentHistory(await res.json());
        } catch (e) { console.error(e); }
    };

    const handleSelectAgency = async (agency) => {
        setSelectedAgency(agency);
        setAgencySearch(agency.name || agency.agency_name || '');
        setPaymentForm(f => ({ ...f, agentAccount: '' }));
        // Fetch bank accounts for this specific agency
        try {
            const res = await fetch(`${API}/api/bank-accounts`, { headers: { 'Authorization': `Bearer ${token()}` } });
            if (res.ok) {
                const data = await res.json();
                const agencyAccs = data.filter(a => a.account_type === 'Agency' && a.agency_id === (agency._id || agency.id));
                setAgencyBankAccounts(agencyAccs);
            }
        } catch (e) { console.error(e); }
    };

    const handleAddDeposit = async () => {
        if (!selectedAgency) { alert('Please select an agency first.'); return; }
        if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) { alert('Please enter a valid amount.'); return; }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            // We'll create a dummy booking_id since this is a manual deposit
            formData.append('booking_id', selectedAgency._id || selectedAgency.id);
            formData.append('booking_type', 'manual');
            formData.append('payment_method', paymentForm.mode);
            formData.append('amount', paymentForm.amount);
            formData.append('payment_date', paymentForm.date);
            if (paymentForm.notes) formData.append('note', paymentForm.notes);
            if (paymentForm.beneficiaryAccount) formData.append('beneficiary_account', paymentForm.beneficiaryAccount);
            if (paymentForm.agentAccount) formData.append('agent_account', paymentForm.agentAccount);
            if (paymentForm.slipFile) formData.append('slip_file', paymentForm.slipFile);

            const res = await fetch(`${API}/api/payments/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token()}` },
                body: formData
            });

            if (res.ok) {
                alert('✅ Deposit recorded successfully!');
                setPaymentForm({ mode: 'bank', beneficiaryAccount: '', agentAccount: '', amount: '', date: new Date().toISOString().split('T')[0], notes: '', slipFile: null });
                setSelectedAgency(null);
                setAgencySearch('');
                fetchPaymentHistory();
            } else {
                const err = await res.json();
                alert('Error: ' + (err.detail || 'Failed to add deposit'));
            }
        } catch (e) { alert('Error: ' + e.message); } finally { setIsSubmitting(false); }
    };

    const handleApprove = async (paymentId) => {
        if (!window.confirm('Approve this payment?')) return;
        try {
            const formData = new FormData();
            formData.append('new_status', 'approved');
            const res = await fetch(`${API}/api/payments/${paymentId}/status`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token()}` },
                body: formData
            });
            if (res.ok) { fetchPaymentHistory(); }
            else { const e = await res.json(); alert(e.detail || 'Failed to approve'); }
        } catch (e) { alert(e.message); }
    };

    const handleReject = async (paymentId) => {
        const note = window.prompt('Reason for rejection (optional):');
        if (note === null) return;
        try {
            const formData = new FormData();
            formData.append('new_status', 'rejected');
            if (note) formData.append('note', note);
            const res = await fetch(`${API}/api/payments/${paymentId}/status`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token()}` },
                body: formData
            });
            if (res.ok) { fetchPaymentHistory(); }
            else { const e = await res.json(); alert(e.detail || 'Failed to reject'); }
        } catch (e) { alert(e.message); }
    };

    const handleDeleteAccount = async (id) => {
        if (!window.confirm('Are you sure you want to delete this account?')) return;
        try {
            const res = await fetch(`${API}/api/bank-accounts/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token()}` } });
            if (res.ok) fetchAccounts();
        } catch (e) { console.error(e); }
    };

    const getAgencyName = (id) => agencies.find(a => (a._id || a.id) === id)?.name || '-';
    const getBranchName = (id) => branches.find(b => (b._id || b.id) === id)?.name || '-';

    const filteredAgencies = agencies.filter(a =>
        (a.name || a.agency_name || '').toLowerCase().includes(agencySearch.toLowerCase())
    );

    const filteredPayments = paymentHistory.filter(p => {
        const matchStatus = historyStatus === 'all' || p.status === historyStatus;
        const matchSearch = !historySearch || (p.booking_id || '').toLowerCase().includes(historySearch.toLowerCase()) || (p.agent_name || '').toLowerCase().includes(historySearch.toLowerCase());
        return matchStatus && matchSearch;
    });

    const paginatedPayments = filteredPayments.slice((historyPage - 1) * historyPerPage, historyPage * historyPerPage);
    const totalPages = Math.ceil(filteredPayments.length / historyPerPage);

    const pendingPayments = paymentHistory.filter(p => p.status === 'pending');

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
            <div className="flex-1 space-y-6">
                <div className="bg-white rounded-[32px] shadow-sm border border-slate-100/50 min-h-[600px] flex flex-col">

                    {/* Tabs */}
                    <div className="px-8 pt-8 border-b border-slate-100 flex gap-6 overflow-x-auto no-scrollbar">
                        {['Add Payment', 'Pending Payments', 'Vouchers', 'Bank Accounts', 'Ledger', 'Booking History'].map((tab) => (
                            <TabButton
                                key={tab}
                                label={tab === 'Pending Payments' ? `Pending Payments ${pendingPayments.length > 0 ? `(${pendingPayments.length})` : ''}` : tab}
                                active={activeTab === tab}  
                                onClick={() => setActiveTab(tab)}
                            />
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="p-8 space-y-6">

                        {/* ── ADD PAYMENT TAB ───────────────────────────────── */}
                        {activeTab === 'Add Payment' && (
                            <>
                                {/* Add Deposit Form */}
                                <div className="border border-slate-200 rounded-2xl p-6 space-y-5">
                                    <h3 className="text-base font-black text-slate-900">Add Deposit</h3>

                                    {/* Agency Search */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Select Agency (agencies with bank accounts)</label>
                                        <div className="relative">
                                            <div className="flex gap-3">
                                                <input
                                                    type="text"
                                                    placeholder="Search agencies..."
                                                    value={agencySearch}
                                                    onChange={e => { setAgencySearch(e.target.value); setSelectedAgency(null); setAgencyBankAccounts([]); }}
                                                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                                                />
                                                <button className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all flex items-center gap-2">
                                                    <Search size={15} /> Search
                                                </button>
                                                <button onClick={() => { setAgencySearch(''); setSelectedAgency(null); setAgencyBankAccounts([]); }} className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all">
                                                    Clear
                                                </button>
                                            </div>
                                            {/* Agency dropdown results */}
                                            {agencySearch && !selectedAgency && filteredAgencies.length > 0 && (
                                                <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                                                    {filteredAgencies.map(ag => (
                                                        <button key={ag._id || ag.id} onClick={() => handleSelectAgency(ag)}
                                                            className="w-full text-left px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors border-b border-slate-50 last:border-0">
                                                            {ag.name || ag.agency_name} <span className="text-slate-400 font-normal text-xs ml-2">{ag.email}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {selectedAgency && (
                                            <p className="text-xs font-bold text-emerald-600 flex items-center gap-1 mt-1">
                                                <CheckCircle size={12} /> Selected: {selectedAgency.name || selectedAgency.agency_name}
                                            </p>
                                        )}
                                    </div>

                                    {/* Payment Fields */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {/* Mode of Payment */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mode of Payment</label>
                                            <select value={paymentForm.mode} onChange={e => setPaymentForm(f => ({ ...f, mode: e.target.value }))}
                                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none transition-all appearance-none">
                                                <option value="bank">Bank Transfer</option>
                                                <option value="cash">Cash</option>
                                                <option value="cheque">Cheque</option>
                                                <option value="credit">Credit</option>
                                            </select>
                                        </div>

                                        {/* Beneficiary Account */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Beneficiary Account</label>
                                            <select value={paymentForm.beneficiaryAccount} onChange={e => setPaymentForm(f => ({ ...f, beneficiaryAccount: e.target.value }))}
                                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none transition-all appearance-none">
                                                <option value="">Select beneficiary account</option>
                                                {orgBankAccounts.map(a => (
                                                    <option key={a._id || a.id} value={`${a.bank_name} - ${a.account_number}`}>
                                                        {a.account_title ? `${a.account_title} - ` : ''}{a.bank_name} ({a.account_number})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Agent Account */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Agent Account</label>
                                            <select value={paymentForm.agentAccount} onChange={e => setPaymentForm(f => ({ ...f, agentAccount: e.target.value }))}
                                                disabled={!selectedAgency}
                                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none transition-all appearance-none disabled:opacity-50">
                                                <option value="">{selectedAgency ? 'Select agent account' : 'Select an agency first'}</option>
                                                {agencyBankAccounts.map(a => (
                                                    <option key={a._id || a.id} value={`${a.bank_name} - ${a.account_number}`}>
                                                        {a.account_title ? `${a.account_title} - ` : ''}{a.bank_name} ({a.account_number})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Amount + Upload Slip */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    placeholder="Type Rs.100,000/"
                                                    value={paymentForm.amount}
                                                    onChange={e => setPaymentForm(f => ({ ...f, amount: e.target.value }))}
                                                    className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                                                />
                                                <label className="cursor-pointer flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all whitespace-nowrap">
                                                    <Upload size={13} />
                                                    {paymentForm.slipFile ? '✓ Slip' : 'Upload Slip *'}
                                                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => { if (e.target.files[0]) setPaymentForm(f => ({ ...f, slipFile: e.target.files[0] })); }} />
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Date + Notes + Submit */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</label>
                                            <input type="date" value={paymentForm.date} onChange={e => setPaymentForm(f => ({ ...f, date: e.target.value }))}
                                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none transition-all" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notes</label>
                                            <input type="text" placeholder="Type Note" value={paymentForm.notes} onChange={e => setPaymentForm(f => ({ ...f, notes: e.target.value }))}
                                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none transition-all" />
                                        </div>
                                        <button onClick={handleAddDeposit} disabled={isSubmitting}
                                            className="w-full py-2.5 px-6 bg-slate-800 hover:bg-blue-600 text-white rounded-xl font-black text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                            {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={16} />}
                                            Add Deposit
                                        </button>
                                    </div>
                                </div>

                                {/* Payments Table */}
                                <div className="space-y-3">
                                    {/* Table Search/Filter */}
                                    <div className="flex flex-wrap gap-3 items-center">
                                        <input type="text" placeholder="Search payments..." value={historySearch} onChange={e => setHistorySearch(e.target.value)}
                                            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none transition-all w-48" />
                                        <select value={historyStatus} onChange={e => setHistoryStatus(e.target.value)}
                                            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none appearance-none cursor-pointer">
                                            <option value="all">All statuses</option>
                                            <option value="pending">Pending</option>
                                            <option value="approved">Approved</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                        <button onClick={() => setHistoryStatus('all')} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50">Show all</button>
                                        <button onClick={() => { setHistorySearch(''); setHistoryStatus('all'); }} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50">Clear</button>
                                    </div>

                                    {/* Table */}
                                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="bg-slate-50 border-b border-slate-200">
                                                        {['Date', 'Transaction', 'Trans Type', 'Beneficiary Ac', 'Account #', 'Agent Account', 'Agent Ac #', 'Amount', 'Status', 'Slip', 'Actions'].map((h, i) => (
                                                            <th key={i} className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider text-left whitespace-nowrap">{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {paginatedPayments.length === 0 ? (
                                                        <tr><td colSpan={11} className="px-6 py-8 text-center text-sm text-slate-400 font-medium">No payments found.</td></tr>
                                                    ) : (
                                                        paginatedPayments.map(p => {
                                                            const baParts = (p.beneficiary_account || '').split(' - ');
                                                            const agParts = (p.agent_account || '').split(' - ');
                                                            return (
                                                                <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                                                                    <td className="px-4 py-3 text-xs font-medium text-slate-600 whitespace-nowrap">{p.payment_date || p.created_at?.split('T')[0]}</td>
                                                                    <td className="px-4 py-3 text-xs font-mono text-slate-500">{(p._id || '').slice(-8).toUpperCase()}</td>
                                                                    <td className="px-4 py-3"><span className="text-[10px] font-black uppercase bg-blue-50 text-blue-700 px-2 py-1 rounded">{p.payment_method}</span></td>
                                                                    <td className="px-4 py-3 text-xs font-medium text-slate-600 whitespace-nowrap">{baParts[0] || '-'}</td>
                                                                    <td className="px-4 py-3 text-xs font-mono text-slate-500">{baParts[1] || '-'}</td>
                                                                    <td className="px-4 py-3 text-xs font-medium text-slate-600 whitespace-nowrap">{agParts[0] || p.agent_name || '-'}</td>
                                                                    <td className="px-4 py-3 text-xs font-mono text-slate-500">{agParts[1] || '-'}</td>
                                                                    <td className="px-4 py-3 text-sm font-black text-slate-900">PKR {Number(p.amount || 0).toLocaleString()}</td>
                                                                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                                                                    <td className="px-4 py-3">
                                                                        {p.slip_url ? (
                                                                            <a href={`${API}${p.slip_url}`} target="_blank" rel="noreferrer"
                                                                                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline">
                                                                                <Eye size={12} /> View
                                                                            </a>
                                                                        ) : <span className="text-slate-300 text-xs">—</span>}
                                                                    </td>
                                                                    <td className="px-4 py-3">
                                                                        {p.status === 'pending' && (
                                                                            <div className="flex items-center gap-1.5">
                                                                                <button onClick={() => handleApprove(p._id)}
                                                                                    className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors" title="Approve">
                                                                                    <CheckCircle size={14} />
                                                                                </button>
                                                                                <button onClick={() => handleReject(p._id)}
                                                                                    className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors" title="Reject">
                                                                                    <XCircle size={14} />
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                        {p.status !== 'pending' && <span className="text-slate-300 text-xs">—</span>}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Pagination */}
                                        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                                            <p className="text-xs font-medium text-slate-400">
                                                Showing {filteredPayments.length === 0 ? '0 - 0' : `${(historyPage - 1) * historyPerPage + 1} - ${Math.min(historyPage * historyPerPage, filteredPayments.length)}`} of {filteredPayments.length}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => setHistoryPage(p => Math.max(1, p - 1))} disabled={historyPage === 1}
                                                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1">
                                                    <ChevronLeft size={13} /> Prev
                                                </button>
                                                <span className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-black">{historyPage}</span>
                                                <button onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))} disabled={historyPage >= totalPages}
                                                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1">
                                                    Next <ChevronRight size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ── PENDING PAYMENTS TAB ──────────────────────────── */}
                        {activeTab === 'Pending Payments' && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Clock size={18} className="text-amber-500" />
                                    <h3 className="text-base font-black text-slate-900">Pending Payment Requests</h3>
                                    {pendingPayments.length > 0 && (
                                        <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-black rounded-full">{pendingPayments.length} pending</span>
                                    )}
                                </div>
                                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-amber-50/60 border-b border-slate-200">
                                                    {['Date', 'Agent / Agency', 'Trans Type', 'Beneficiary Account', 'Agent Account', 'Amount', 'Note', 'Slip', 'Actions'].map((h, i) => (
                                                        <th key={i} className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider text-left whitespace-nowrap">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {pendingPayments.length === 0 ? (
                                                    <tr><td colSpan={9} className="px-6 py-12 text-center">
                                                        <div className="flex flex-col items-center gap-3">
                                                            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center"><CheckCircle size={24} className="text-emerald-500" /></div>
                                                            <p className="text-sm font-bold text-slate-500">No pending payments</p>
                                                            <p className="text-xs text-slate-400">All payments have been processed.</p>
                                                        </div>
                                                    </td></tr>
                                                ) : (
                                                    pendingPayments.map(p => (
                                                        <tr key={p._id} className="hover:bg-amber-50/30 transition-colors">
                                                            <td className="px-4 py-4 text-xs font-medium text-slate-600 whitespace-nowrap">{p.payment_date || p.created_at?.split('T')[0]}</td>
                                                            <td className="px-4 py-4">
                                                                <p className="text-sm font-bold text-slate-800">{p.agent_name || 'Unknown'}</p>
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-[10px] font-medium text-slate-400">Booking: {(p.booking_id || '').slice(-8).toUpperCase()}</p>
                                                                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${p.booking_type === 'ticket' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                                                        p.booking_type === 'umrah' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                                            p.booking_type === 'custom' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                                                'bg-slate-50 text-slate-500 border border-slate-100'
                                                                        }`}>
                                                                        {p.booking_type === 'custom' ? 'Custom Umrah' : p.booking_type || 'Manual'}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4"><span className="text-[10px] font-black uppercase bg-blue-50 text-blue-700 px-2 py-1 rounded">{p.payment_method}</span></td>
                                                            <td className="px-4 py-4 text-xs font-medium text-slate-600">{p.beneficiary_account || '—'}</td>
                                                            <td className="px-4 py-4 text-xs font-medium text-slate-600">{p.agent_account || '—'}</td>
                                                            <td className="px-4 py-4 text-sm font-black text-slate-900">PKR {Number(p.amount || 0).toLocaleString()}</td>
                                                            <td className="px-4 py-4 text-xs text-slate-500 max-w-[150px] truncate">{p.note || '—'}</td>
                                                            <td className="px-4 py-4">
                                                                {p.slip_url ? (
                                                                    <a href={`${API}${p.slip_url}`} target="_blank" rel="noreferrer"
                                                                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded-lg">
                                                                        <FileText size={12} /> View Slip
                                                                    </a>
                                                                ) : <span className="text-slate-300 text-xs">No slip</span>}
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <div className="flex items-center gap-2">
                                                                    <button onClick={() => handleApprove(p._id)}
                                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black transition-all">
                                                                        <CheckCircle size={12} /> Accept
                                                                    </button>
                                                                    <button onClick={() => handleReject(p._id)}
                                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-black transition-all">
                                                                        <XCircle size={12} /> Reject
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

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
                                                                            ? `${voucher.expiry_date.substring(0, 4)}-${voucher.expiry_date.substring(4, 6)}-${voucher.expiry_date.substring(6, 8)}`
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
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full flex-1">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide ml-1">Bank Name</label>
                                            <input type="text" placeholder="e.g. Meezan Bank" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none transition-all" />
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <button className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                                                <Filter size={16} /> Filter
                                            </button>
                                        </div>
                                    </div>
                                    <button onClick={onAddAccount}
                                        className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 active:scale-95">
                                        <Plus size={18} strokeWidth={2.5} /> Add Bank Account
                                    </button>
                                </div>

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
                                                                {canUpdate && (
                                                                    <button onClick={() => onEditAccount(acc)} className="p-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors border border-transparent hover:border-blue-100">
                                                                        <Edit3 size={16} />
                                                                    </button>
                                                                )}
                                                                {canDelete && (
                                                                    <button onClick={() => handleDeleteAccount(acc._id)} className="p-2 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors border border-transparent hover:border-rose-100">
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                )}
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

                        {/* ── OTHER TABS (Ledger, Booking History) ─────────── */}
                        {(activeTab === 'Ledger' || activeTab === 'Booking History') && (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center">
                                    <FileText size={28} className="text-slate-400" />
                                </div>
                                <p className="text-sm font-bold text-slate-500">{activeTab} — Coming Soon</p>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}
