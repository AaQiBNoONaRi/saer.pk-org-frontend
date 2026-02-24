import React, { useState, useEffect } from 'react';
import {
    Building2, Plus, Search, MapPin, Phone, Mail, ArrowLeft,
    Edit2, Trash2, ShieldCheck, Loader2, AlertCircle, CreditCard,
    Eye, EyeOff, Building, User, Check, Ticket, Clock
} from 'lucide-react';

const AgenciesView = () => {
    const [agencies, setAgencies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAgency, setSelectedAgency] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'list', 'detail', 'add', 'edit'

    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [agencyTypeFilter, setAgencyTypeFilter] = useState('all');
    const [filterBranch, setFilterBranch] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        agency_type: 'full',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: '',
        branch_id: '',
        is_active: true,
        portal_access_enabled: true,
        username: '',
        password: '',
        credit_limit: 0,
        credit_limit_days: 30,
        agreement_status: 'active',
        commission_group: 'Standard',
        logo: ''
    });

    useEffect(() => {
        fetchAgencies();
        fetchBranches();
    }, []);

    const fetchAgencies = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('access_token');
            const response = await fetch('http://localhost:8000/api/agencies/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setAgencies(data);
            }
        } catch (err) {
            console.error("Failed to fetch agencies", err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchBranches = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('http://localhost:8000/api/branches/', {
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

    const handleConfirmDelete = async (agency) => {
        if (!window.confirm(`Are you sure you want to delete "${agency.name}"?`)) return;
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`http://localhost:8000/api/agencies/${agency._id || agency.id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const updatedList = agencies.filter(a => (a._id || a.id) !== (agency._id || agency.id));
                setAgencies(updatedList);
                if (selectedAgency && (selectedAgency._id || selectedAgency.id) === (agency._id || agency.id)) {
                    setSelectedAgency(null);
                    setViewMode('list');
                }
                alert('Agency deleted successfully!');
            } else {
                alert('Failed to delete agency');
            }
        } catch (err) {
            alert('Failed to delete agency');
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === 'email') {
            setFormData(prev => ({
                ...prev,
                email: value,
                username: value
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const openAddForm = () => {
        setFormData({
            name: '',
            code: '',
            agency_type: 'full',
            contact_person: '',
            email: '',
            phone: '',
            address: '',
            city: '',
            country: '',
            branch_id: '',
            is_active: true,
            portal_access_enabled: true,
            username: '',
            password: '',
            credit_limit: 0,
            credit_limit_days: 30,
            agreement_status: 'active',
            commission_group: 'Standard',
            logo: ''
        });
        setError('');
        setViewMode('add');
    };

    const openEditForm = (agency) => {
        setFormData({
            name: agency.name || '',
            code: agency.code || '',
            agency_type: agency.agency_type || 'full',
            contact_person: agency.contact_person || '',
            email: agency.email || '',
            phone: agency.phone || '',
            address: agency.address || '',
            city: agency.city || '',
            country: agency.country || '',
            branch_id: agency.branch_id || agency.branch?._id || '',
            is_active: agency.is_active ?? true,
            portal_access_enabled: agency.portal_access_enabled ?? true,
            username: agency.username || agency.email || '',
            password: '',
            credit_limit: agency.credit_limit || 0,
            credit_limit_days: agency.credit_limit_days || 30,
            agreement_status: agency.agreement_status || 'active',
            commission_group: agency.commission_group || 'Standard',
            logo: agency.logo || ''
        });
        setSelectedAgency(agency);
        setError('');
        setViewMode('edit');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        if (!formData.name.trim()) {
            setError('Agency name is required');
            setIsSubmitting(false);
            return;
        }

        if (!formData.branch_id) {
            setError('Branch selection is required');
            setIsSubmitting(false);
            return;
        }

        if (formData.portal_access_enabled) {
            if (!formData.username?.trim()) {
                setError('Username is required for portal access');
                setIsSubmitting(false);
                return;
            }
            if (viewMode === 'add' && !formData.password?.trim()) {
                setError('Password is required for new agencies');
                setIsSubmitting(false);
                return;
            }
        }

        try {
            const token = localStorage.getItem('access_token');
            const orgId = localStorage.getItem('organization_id');

            const payload = {
                ...formData,
                organization_id: orgId
            };

            if (viewMode === 'edit') {
                delete payload.organization_id;
                if (!payload.password) delete payload.password;
            }

            if (!payload.portal_access_enabled) {
                delete payload.password;
                delete payload.username;
            }

            const url = viewMode === 'edit'
                ? `http://localhost:8000/api/agencies/${selectedAgency._id || selectedAgency.id}/`
                : 'http://localhost:8000/api/agencies/';

            const method = viewMode === 'edit' ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                await fetchAgencies();
                alert(viewMode === 'edit' ? 'Agency updated successfully!' : 'Agency created successfully!');
                setViewMode('list');
            } else {
                const errorData = await response.json();
                let errorMessage = 'Failed to save agency';
                if (typeof errorData.detail === 'string') {
                    errorMessage = errorData.detail;
                } else if (Array.isArray(errorData.detail)) {
                    errorMessage = errorData.detail.map(e => e.msg).join(', ');
                }
                setError(errorMessage);
            }
        } catch (err) {
            console.error(err);
            setError('Failed to save agency');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredAgencies = agencies.filter(agency => {
        const matchesSearch = agency.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            agency.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            agency.code?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterType === 'all'
            ? true
            : filterType === 'active' ? agency.is_active
                : !agency.is_active;
        const matchesAgencyType = agencyTypeFilter === 'all'
            ? true
            : agency.agency_type === agencyTypeFilter;
        const matchesBranch = !filterBranch || (agency.branch_id || agency.branch?._id) === filterBranch;
        return matchesSearch && matchesFilter && matchesAgencyType && matchesBranch;
    });

    const getBranchName = (branchId) => {
        const branch = branches.find(b => (b.id || b._id) === branchId);
        return branch ? branch.name : 'Unknown Branch';
    };

    // LIST VIEW
    if (viewMode === 'list') {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <Building2 className="text-blue-600" size={24} />
                            Agencies <span className="text-slate-400 text-sm">({filteredAgencies.length})</span>
                        </h1>
                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide">
                            Manage your branch agency partners
                        </p>
                    </div>
                    <button
                        onClick={openAddForm}
                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:scale-105 transition-all"
                    >
                        <Plus size={16} />
                        <span>Add New Agency</span>
                    </button>
                </div>

                <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
                    <div className="space-y-4 mb-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search agencies..."
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 outline-none"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active Only</option>
                                <option value="inactive">Inactive Only</option>
                            </select>
                            <select
                                value={agencyTypeFilter}
                                onChange={(e) => setAgencyTypeFilter(e.target.value)}
                                className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 outline-none"
                            >
                                <option value="all">All Types</option>
                                <option value="full">Full Agency</option>
                                <option value="area">Area Agency</option>
                            </select>
                            <select
                                value={filterBranch}
                                onChange={(e) => setFilterBranch(e.target.value)}
                                className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 outline-none"
                            >
                                <option value="">All Branches</option>
                                {branches.map(branch => (
                                    <option key={branch.id || branch._id} value={branch.id || branch._id}>
                                        {branch.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
                    ) : filteredAgencies.length === 0 ? (
                        <div className="text-center p-12 text-slate-400 text-sm font-bold">No agencies found</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredAgencies.map(agency => (
                                <div
                                    key={agency._id || agency.id}
                                    onClick={() => { setSelectedAgency(agency); setViewMode('detail'); }}
                                    className="p-6 rounded-2xl border border-slate-100 cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02] active:scale-95 bg-white"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-black text-base text-slate-800">{agency.name}</h3>
                                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${agency.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {agency.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium mb-3">{agency.code || 'NO-REF'}</p>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                            <Building size={12} />
                                            <span>{getBranchName(agency.branch_id || agency.branch?._id)}</span>
                                        </div>
                                        {agency.contact_person && (
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                                <User size={12} />
                                                <span>{agency.contact_person}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                            <Phone size={12} />
                                            <span>{agency.phone}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                            <Mail size={12} />
                                            <span className="truncate">{agency.email}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // DETAIL VIEW
    if (viewMode === 'detail' && selectedAgency) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                {/* Header with back button */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setViewMode('list')}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-all"
                            >
                                <ArrowLeft size={20} className="text-slate-600" />
                            </button>
                            <div>
                                <h1 className="text-lg font-bold text-slate-900">Agency Details</h1>
                                <p className="text-xs text-slate-500 uppercase tracking-wide">View and manage agency information</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => openEditForm(selectedAgency)}
                                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all flex items-center gap-2"
                            >
                                <Edit2 size={14} /> EDIT
                            </button>
                            <button
                                onClick={() => handleConfirmDelete(selectedAgency)}
                                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-all flex items-center gap-2"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Profile Card */}
                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-start gap-4">
                            <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                                <Building2 size={32} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-1">{selectedAgency.name}</h2>
                                <p className="text-sm text-slate-600 mb-1">{selectedAgency.contact_person || 'No Contact Person'}</p>
                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                    <span className="flex items-center gap-1">
                                        <Phone size={12} /> {selectedAgency.phone || '03222018688'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Mail size={12} /> {selectedAgency.email || 'N/A'}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                    <MapPin size={12} /> {selectedAgency.address || 'No Address Provided'}
                                </p>
                            </div>
                        </div>
                        <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-xs font-bold uppercase tracking-wider">
                            Active Agreement
                        </span>
                    </div>


                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                            <div className="flex flex-col items-center text-center">
                                <Ticket size={24} className="text-blue-600 mb-2" />
                                <p className="text-3xl font-bold text-blue-600 mb-1">0</p>
                                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Total Bookings</p>
                            </div>
                        </div>
                        <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                            <div className="flex flex-col items-center text-center">
                                <Check size={24} className="text-green-600 mb-2" />
                                <p className="text-3xl font-bold text-green-600 mb-1">0</p>
                                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">On-Time Payments</p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-slate-200">
                            <div className="flex flex-col items-center text-center">
                                <Clock size={24} className="text-slate-600 mb-2" />
                                <p className="text-3xl font-bold text-slate-900 mb-1">0</p>
                                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Late Payments</p>
                            </div>
                        </div>
                        <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                            <div className="flex flex-col items-center text-center">
                                <AlertCircle size={24} className="text-red-600 mb-2" />
                                <p className="text-3xl font-bold text-red-600 mb-1">0</p>
                                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Disputes</p>
                            </div>
                        </div>
                    </div>



                    {/* Additional Information */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6">
                        <h3 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-wider">Additional Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-xs font-medium text-slate-500 mb-1">Code: <span className="text-blue-600 font-bold">{selectedAgency.code || 'N/A'}</span></p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500 mb-1">Type: <span className="text-blue-600 font-bold capitalize">{selectedAgency.agency_type || 'Full'}</span></p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500 mb-1">Credit Limit (PKR): <span className="text-blue-600 font-bold">Rs. {selectedAgency.credit_limit?.toLocaleString() || 0}</span></p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500 mb-1">Credit Limit (Days): <span className="text-blue-600 font-bold">{selectedAgency.credit_limit_days || 0} Days</span></p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500 mb-1">Commission Group: <span className="text-blue-600 font-bold">{selectedAgency.commission_group || 'Standard'}</span></p>
                            </div>
                        </div>
                    </div>

                    {/* Agency Portal Access */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <ShieldCheck size={16} className="text-slate-600" />
                                Agency Portal Access
                            </h3>
                            <span className="px-4 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-bold uppercase tracking-wider">
                                Enabled
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Username</p>
                                <div className="flex items-center gap-2 text-sm font-medium text-slate-900 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                                    <Mail size={14} className="text-slate-400" />
                                    <span>{selectedAgency.username || selectedAgency.email}</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Login Email</p>
                                <div className="flex items-center gap-2 text-sm font-medium text-slate-900 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                                    <Mail size={14} className="text-slate-400" />
                                    <span>{selectedAgency.email || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <div className="flex items-start gap-2">
                                <AlertCircle size={14} className="text-blue-600 mt-0.5 shrink-0" />
                                <p className="text-xs font-medium text-blue-600">
                                    This agency can log in to the Agency Portal using their email and password
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        );
    }

    // ADD/EDIT FORM VIEW
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setViewMode('list')}
                    className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                        {viewMode === 'add' ? 'Add New Agency' : 'Edit Agency'}
                    </h1>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide">
                        {viewMode === 'add' ? 'Create a new agency partner' : `Editing: ${selectedAgency?.name}`}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-8">
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start space-x-3">
                        <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-black text-red-600 uppercase tracking-wider mb-1">Error</p>
                            <p className="text-xs font-bold text-red-500">{error}</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Agency Name *</label>
                        <input required type="text" name="name" value={formData.name} onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100" placeholder="Enter agency name" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Agency Code</label>
                        <input type="text" name="code" value={formData.code} onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100" placeholder="Enter agency code" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Branch *</label>
                        <select name="branch_id" value={formData.branch_id} onChange={handleInputChange} required
                            className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100">
                            <option value="">Select Branch</option>
                            {branches.map(branch => (
                                <option key={branch.id || branch._id} value={branch.id || branch._id}>
                                    {branch.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Agency Type *</label>
                        <select name="agency_type" value={formData.agency_type} onChange={handleInputChange} required
                            className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100">
                            <option value="full">Full Agency</option>
                            <option value="area">Area Agency</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Contact Person</label>
                        <input type="text" name="contact_person" value={formData.contact_person} onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100" placeholder="Full Name" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100" placeholder="email@example.com" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Phone</label>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100" placeholder="+92 300 1234567" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">City</label>
                        <input type="text" name="city" value={formData.city} onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100" placeholder="City Name" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Address</label>
                        <textarea name="address" value={formData.address} onChange={handleInputChange} rows="2"
                            className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100 resize-none" placeholder="Full Address" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Credit Limit (Amount PKR)</label>
                        <input type="number" name="credit_limit" value={formData.credit_limit} onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100" placeholder="e.g. 500000" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Credit Limit (Days)</label>
                        <input type="number" name="credit_limit_days" value={formData.credit_limit_days} onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Agreement Status</label>
                        <select name="agreement_status" value={formData.agreement_status} onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100">
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Commission Group</label>
                        <select name="commission_group" value={formData.commission_group} onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100">
                            <option value="Standard">Standard</option>
                            <option value="Premium">Premium</option>
                            <option value="VIP">VIP</option>
                        </select>
                    </div>
                </div>

                <div className="border-t border-slate-100"></div>

                {/* Portal Access */}
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Portal Access</h4>
                        <div className="flex items-center gap-3">
                            <input type="checkbox" name="portal_access_enabled" id="portal_access_enabled" checked={formData.portal_access_enabled} onChange={handleInputChange}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
                            <label htmlFor="portal_access_enabled" className="text-sm font-bold text-slate-700">
                                Enable Portal Access
                            </label>
                        </div>
                    </div>

                    {formData.portal_access_enabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-300">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Username (Auto-filled)</label>
                                <input type="text" name="username" value={formData.username} readOnly
                                    className="w-full px-4 py-3 bg-slate-200 rounded-2xl text-sm font-bold text-slate-600 cursor-not-allowed" placeholder="Enter email to auto-fill" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password {viewMode === 'add' && '*'}</label>
                                <div className="relative">
                                    <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleInputChange} required={viewMode === 'add'}
                                        className="w-full px-4 py-3 pr-12 bg-white rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100"
                                        placeholder={viewMode === 'edit' ? "Leave blank to keep current" : "Enter password"} />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Status & Actions */}
                <div className="flex items-center justify-between pt-4">
                    <div className="flex items-center gap-3">
                        <input type="checkbox" name="is_active" id="is_active" checked={formData.is_active} onChange={handleInputChange}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
                        <label htmlFor="is_active" className="text-sm font-bold text-slate-700">
                            Active Status
                        </label>
                    </div>
                    <div className="flex gap-4">
                        <button type="button" onClick={() => setViewMode('list')}
                            className="px-8 py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all">
                            Cancel
                        </button>
                        <button type="submit" disabled={isSubmitting}
                            className="px-8 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50">
                            {isSubmitting ? 'Saving...' : viewMode === 'edit' ? 'Update Agency' : 'Create Agency'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default AgenciesView;
