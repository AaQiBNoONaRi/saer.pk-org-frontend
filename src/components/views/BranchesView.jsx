import React, { useState, useEffect } from 'react';
import {
    Building, Plus, Search, MapPin, Phone, Mail, ArrowLeft,
    Edit2, Trash2, Loader2, AlertCircle, User, Check,
    ShieldCheck, Eye, EyeOff
} from 'lucide-react';
import { getModulePermissions } from '../../utils/permissions';

const BranchesView = () => {
    // Check permissions for entities.branch module
    const branchPerms = getModulePermissions('entities.branch');
    const [branches, setBranches] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [agencies, setAgencies] = useState([]);
    const [commissionGroups, setCommissionGroups] = useState([]);
    const [serviceChargeGroups, setServiceChargeGroups] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'list', 'detail', 'add', 'edit'

    const [searchQuery, setSearchQuery] = useState('');
    const [filterOrg, setFilterOrg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        organization_id: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: '',
        commission_group_id: '',
        service_charge_group_id: '',
        is_active: true,
        portal_access_enabled: true,
        username: '',
        password: ''
    });

    useEffect(() => {
        fetchBranches();
        fetchOrganizations();
        fetchAgencies();
        fetchCommissionGroups();
        fetchServiceChargeGroups();
    }, []);

    const fetchBranches = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('access_token');
            const response = await fetch('http://localhost:8000/api/branches/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setBranches(data);
            }
        } catch (err) {
            console.error("Failed to fetch branches", err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchOrganizations = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('http://localhost:8000/api/organizations/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setOrganizations(data);
            }
        } catch (err) {
            console.error("Failed to fetch organizations", err);
        }
    };

    const fetchAgencies = async () => {
        try {
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
        }
    };

    const fetchCommissionGroups = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('http://localhost:8000/api/commissions/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setCommissionGroups(data);
            }
        } catch (error) {
            console.error('Error fetching commission groups:', error);
        }
    };

    const fetchServiceChargeGroups = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('http://localhost:8000/api/service-charges/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setServiceChargeGroups(data);
            }
        } catch (error) {
            console.error('Error fetching service charge groups:', error);
        }
    };

    const handleDelete = async (branch) => {
        if (!window.confirm(`Are you sure you want to delete "${branch.name}"?`)) return;
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`http://localhost:8000/api/branches/${branch._id || branch.id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const updatedList = branches.filter(b => (b._id || b.id) !== (branch._id || branch.id));
                setBranches(updatedList);
                if (selectedBranch && (selectedBranch._id || selectedBranch.id) === (branch._id || branch.id)) {
                    setSelectedBranch(null);
                    setViewMode('list');
                }
                alert('Branch deleted successfully!');
            } else {
                alert('Failed to delete branch');
            }
        } catch (err) {
            alert('Failed to delete branch');
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
            organization_id: '',
            contact_person: '',
            email: '',
            phone: '',
            address: '',
            city: '',
            country: '',
            commission_group_id: '',
            service_charge_group_id: '',
            is_active: true,
            portal_access_enabled: true,
            username: '',
            password: ''
        });
        setError('');
        setViewMode('add');
    };

    const openEditForm = (branch) => {
        setFormData({
            name: branch.name || '',
            code: branch.code || '',
            organization_id: branch.organization_id || branch.organization?._id || '',
            contact_person: branch.contact_person || '',
            email: branch.email || '',
            phone: branch.phone || '',
            address: branch.address || '',
            city: branch.city || '',
            country: branch.country || '',
            commission_group_id: branch.commission_group_id || '',
            service_charge_group_id: branch.service_charge_group_id || '',
            is_active: branch.is_active ?? true,
            portal_access_enabled: branch.portal_access_enabled ?? true,
            username: branch.username || branch.email || '',
            password: ''
        });
        setSelectedBranch(branch);
        setError('');
        setViewMode('edit');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        if (!formData.name.trim()) {
            setError('Branch name is required');
            setIsSubmitting(false);
            return;
        }

        if (!formData.organization_id) {
            setError('Organization selection is required');
            setIsSubmitting(false);
            return;
        }

        try {
            const token = localStorage.getItem('access_token');

            const url = viewMode === 'edit'
                ? `http://localhost:8000/api/branches/${selectedBranch._id || selectedBranch.id}/`
                : 'http://localhost:8000/api/branches/';

            const method = viewMode === 'edit' ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...formData,
                    password: formData.password || undefined // Only send if set
                })
            });

            if (response.ok) {
                await fetchBranches();
                alert(viewMode === 'edit' ? 'Branch updated successfully!' : 'Branch created successfully!');
                setViewMode('list');
            } else {
                const errorData = await response.json();
                let errorMessage = 'Failed to save branch';
                if (typeof errorData.detail === 'string') {
                    errorMessage = errorData.detail;
                } else if (Array.isArray(errorData.detail)) {
                    errorMessage = errorData.detail.map(e => e.msg).join(', ');
                } else if (typeof errorData.detail === 'object' && errorData.detail !== null) {
                    errorMessage = JSON.stringify(errorData.detail);
                }
                setError(errorMessage);
            }
        } catch (err) {
            console.error(err);
            setError('Failed to save branch');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredBranches = branches.filter(branch => {
        const matchesSearch = branch.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            branch.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            branch.code?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesOrg = !filterOrg || (branch.organization_id || branch.organization?._id) === filterOrg;
        return matchesSearch && matchesOrg;
    });

    const getOrganizationName = (orgId) => {
        const org = organizations.find(o => (o.id || o._id) === orgId);
        return org ? org.name : 'Unknown Organization';
    };

    // LIST VIEW
    if (viewMode === 'list') {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                            <Building className="text-slate-400" size={28} />
                            Branches <span className="text-slate-500 text-lg font-normal">({filteredBranches.length})</span>
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Manage organization branches
                        </p>
                    </div>
                    {branchPerms.add && (
                        <button
                            onClick={openAddForm}
                            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                        >
                            <Plus size={18} />
                            <span>Add Branch</span>
                        </button>
                    )}
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search branches..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                        <select
                            value={filterOrg}
                            onChange={(e) => setFilterOrg(e.target.value)}
                            className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all min-w-[200px]"
                        >
                            <option value="">All Organizations</option>
                            {organizations.map(org => (
                                <option key={org.id || org._id} value={org.id || org._id}>
                                    {org.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
                    ) : filteredBranches.length === 0 ? (
                        <div className="text-center p-12 text-slate-400 text-sm font-bold">No branches found</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filteredBranches.map(branch => (
                                <div
                                    key={branch._id || branch.id}
                                    onClick={() => { setSelectedBranch(branch); setViewMode('detail'); }}
                                    className="p-5 rounded-xl border border-slate-200 cursor-pointer transition-all hover:shadow-md hover:border-slate-300 bg-white group"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-base text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{branch.name}</h3>
                                            <p className="text-xs text-slate-500">{branch.code || 'NO-REF'}</p>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${branch.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {branch.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div className="space-y-2.5">
                                        <div className="flex items-center gap-2 text-xs text-slate-600">
                                            <Building size={14} className="text-slate-400" />
                                            <span>{getOrganizationName(branch.organization_id || branch.organization?._id)}</span>
                                        </div>
                                        {branch.contact_person && (
                                            <div className="flex items-center gap-2 text-xs text-slate-600">
                                                <User size={14} className="text-slate-400" />
                                                <span>{branch.contact_person}</span>
                                            </div>
                                        )}
                                        {branch.phone && (
                                            <div className="flex items-center gap-2 text-xs text-slate-600">
                                                <Phone size={14} className="text-slate-400" />
                                                <span>{branch.phone}</span>
                                            </div>
                                        )}
                                        {branch.email && (
                                            <div className="flex items-center gap-2 text-xs text-slate-600">
                                                <Mail size={14} className="text-slate-400" />
                                                <span className="truncate">{branch.email}</span>
                                            </div>
                                        )}
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
    if (viewMode === 'detail' && selectedBranch) {
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
                                <h1 className="text-lg font-bold text-slate-900">Branch Details</h1>
                                <p className="text-xs text-slate-500 uppercase tracking-wide">View and manage branch information</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {branchPerms.update && (
                                <button
                                    onClick={() => openEditForm(selectedBranch)}
                                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all flex items-center gap-2"
                                >
                                    <Edit2 size={14} /> EDIT
                                </button>
                            )}
                            {branchPerms.delete && (
                                <button
                                    onClick={() => handleDelete(selectedBranch)}
                                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-all flex items-center gap-2"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Profile Card */}
                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-start gap-4">
                            <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                                <Building size={32} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-1">{selectedBranch.name}</h2>
                                <p className="text-sm text-slate-600 mb-1">{selectedBranch.contact_person || 'No Contact Person'}</p>
                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                    <span className="flex items-center gap-1">
                                        <Phone size={12} /> {selectedBranch.phone || 'N/A'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Mail size={12} /> {selectedBranch.email || 'N/A'}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                    <MapPin size={12} /> {selectedBranch.address || 'No Address Provided'}
                                </p>
                            </div>
                        </div>
                        <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-xs font-bold uppercase tracking-wider">
                            {selectedBranch.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </div>

                    {/* Additional Information */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-wider">Branch Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Organization</p>
                                <p className="font-medium text-slate-900">{getOrganizationName(selectedBranch.organization_id || selectedBranch.organization?._id)}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Contact Person</p>
                                <p className="font-medium text-slate-900">{selectedBranch.contact_person || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email</p>
                                <p className="font-medium text-slate-900">{selectedBranch.email || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Phone</p>
                                <p className="font-medium text-slate-900">{selectedBranch.phone || 'N/A'}</p>
                            </div>
                            {selectedBranch.commission_group && (
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Commission Group</p>
                                    <p className="font-medium text-slate-900">{selectedBranch.commission_group.name || 'N/A'}</p>
                                </div>
                            )}
                            {selectedBranch.service_charge_group && (
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Service Charge Group</p>
                                    <p className="font-medium text-slate-900">{selectedBranch.service_charge_group.name || 'N/A'}</p>
                                </div>
                            )}
                            <div className="md:col-span-2">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Address</p>
                                <p className="font-medium text-slate-900">{selectedBranch.address || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Portal Access – Set Password */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mt-6">
                        <div className="flex items-center gap-3 mb-4">
                            <ShieldCheck size={18} className="text-blue-600" />
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Portal Access</h3>
                            <span className={`ml-auto px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${selectedBranch.portal_access_enabled !== false ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                {selectedBranch.portal_access_enabled !== false ? 'Enabled' : 'Disabled'}
                            </span>
                        </div>
                        {selectedBranch.email && (
                            <p className="text-xs text-slate-500 mb-3">Login email: <span className="font-bold text-slate-700">{selectedBranch.email}</span></p>
                        )}
                        {!selectedBranch.password && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-center gap-2">
                                <AlertCircle size={14} className="text-amber-600 shrink-0" />
                                <p className="text-xs font-bold text-amber-700">No portal password set yet — set one below to enable login.</p>
                            </div>
                        )}
                        <div className="flex gap-3">
                            <input
                                type="password"
                                id="quickSetPassword"
                                placeholder="Set / reset portal password"
                                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100"
                            />
                            <button
                                onClick={async () => {
                                    const pw = document.getElementById('quickSetPassword').value;
                                    if (!pw || pw.length < 4) { alert('Password must be at least 4 characters'); return; }
                                    try {
                                        const token = localStorage.getItem('access_token');
                                        const res = await fetch(`http://localhost:8000/api/branches/${selectedBranch._id || selectedBranch.id}/set-password`, {
                                            method: 'POST',
                                            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ password: pw })
                                        });
                                        if (res.ok) {
                                            alert('Password set! The branch can now log in with their email and this password.');
                                            document.getElementById('quickSetPassword').value = '';
                                            await fetchBranches();
                                        } else {
                                            const err = await res.json();
                                            alert(err.detail || 'Failed to set password');
                                        }
                                    } catch (e) { alert('Error setting password'); }
                                }}
                                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all whitespace-nowrap"
                            >
                                Set Password
                            </button>
                        </div>
                    </div>

                    {/* Branch Agencies */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mt-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                                Agencies ({agencies.filter(a => (a.branch_id || a.branch?._id) === (selectedBranch._id || selectedBranch.id)).length})
                            </h3>
                        </div>
                        {agencies.filter(a => (a.branch_id || a.branch?._id) === (selectedBranch._id || selectedBranch.id)).length === 0 ? (
                            <div className="text-center py-8 text-slate-400 text-sm">
                                <Building size={32} className="mx-auto mb-2 opacity-50" />
                                <p>No agencies assigned to this branch</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {agencies.filter(a => (a.branch_id || a.branch?._id) === (selectedBranch._id || selectedBranch.id)).map(agency => (
                                    <div
                                        key={agency._id || agency.id}
                                        className="p-4 border border-slate-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-semibold text-slate-900">{agency.name}</h4>
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${agency.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {agency.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        {agency.code && (
                                            <p className="text-xs text-slate-500 mb-2">{agency.code}</p>
                                        )}
                                        <div className="space-y-1.5">
                                            {agency.contact_person && (
                                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                                    <User size={12} className="text-slate-400" />
                                                    <span>{agency.contact_person}</span>
                                                </div>
                                            )}
                                            {agency.phone && (
                                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                                    <Phone size={12} className="text-slate-400" />
                                                    <span>{agency.phone}</span>
                                                </div>
                                            )}
                                            {agency.email && (
                                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                                    <Mail size={12} className="text-slate-400" />
                                                    <span className="truncate">{agency.email}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
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
                        {viewMode === 'add' ? 'Add New Branch' : 'Edit Branch'}
                    </h1>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide">
                        {viewMode === 'add' ? 'Create a new branch' : `Editing: ${selectedBranch?.name}`}
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
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Branch Name *</label>
                        <input required type="text" name="name" value={formData.name} onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100" placeholder="Enter branch name" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Branch Code</label>
                        <input type="text" name="code" value={formData.code} onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100" placeholder="Enter branch code" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Organization *</label>
                        <select name="organization_id" value={formData.organization_id} onChange={handleInputChange} required
                            className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100">
                            <option value="">Select Organization</option>
                            {organizations.map(org => (
                                <option key={org.id || org._id} value={org.id || org._id}>
                                    {org.name}
                                </option>
                            ))}
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
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Country</label>
                        <input type="text" name="country" value={formData.country} onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100" placeholder="Country Name" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Commission Group</label>
                        <select name="commission_group_id" value={formData.commission_group_id} onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100">
                            <option value="">Select Commission Group</option>
                            {commissionGroups.map(group => (
                                <option key={group._id || group.id} value={group._id || group.id}>
                                    {group.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Service Charge Group</label>
                        <select name="service_charge_group_id" value={formData.service_charge_group_id} onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100">
                            <option value="">Select Service Charge Group</option>
                            {serviceChargeGroups.map(group => (
                                <option key={group._id || group.id} value={group._id || group.id}>
                                    {group.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Address</label>
                        <textarea name="address" value={formData.address} onChange={handleInputChange} rows="2"
                            className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100 resize-none" placeholder="Full Address" />
                    </div>
                </div>

                <div className="border-t border-slate-100"></div>

                {/* Portal Access */}
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-400">
                                <ShieldCheck size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Portal Access</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Enable branch management portal</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <input type="checkbox" name="portal_access_enabled" id="portal_access_enabled" checked={formData.portal_access_enabled} onChange={handleInputChange}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
                            <label htmlFor="portal_access_enabled" className="text-sm font-bold text-slate-700">
                                Enable Login
                            </label>
                        </div>
                    </div>

                    {formData.portal_access_enabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-300">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Username (Auto-filled)</label>
                                <input type="text" name="username" value={formData.username} readOnly
                                    className="w-full px-4 py-3 bg-slate-200 rounded-2xl text-sm font-bold text-slate-600 cursor-not-allowed" placeholder="Email will be used as username" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Password {viewMode === 'add' && '*'}</label>
                                <div className="relative">
                                    <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleInputChange} required={viewMode === 'add'}
                                        className="w-full px-4 py-3 pr-12 bg-white rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100 border border-slate-100"
                                        placeholder={viewMode === 'edit' ? "Leave blank to keep current" : "Enter password"} />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

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
                            {isSubmitting ? 'Saving...' : viewMode === 'edit' ? 'Update Branch' : 'Create Branch'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default BranchesView;