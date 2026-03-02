import React, { useState, useEffect } from 'react';
import {
    Building2, Plus, Search, Mail, Phone, ArrowLeft,
    Edit2, Trash2, Loader2, AlertCircle, MapPin
} from 'lucide-react';
import { getModulePermissions } from '../../utils/permissions';

const OrganizationView = () => {
    // Check permissions for entities.organization module
    const organizationPerms = getModulePermissions('entities.organization');
    const [organizations, setOrganizations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOrganization, setSelectedOrganization] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'list', 'detail', 'add', 'edit'

    const [searchQuery, setSearchQuery] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: '',
        is_active: true,
        portal_access_enabled: true,
        username: '',
        password: ''
    });

    useEffect(() => {
        fetchOrganizations();
    }, []);

    const fetchOrganizations = async () => {
        try {
            setIsLoading(true);
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
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (organization) => {
        if (!window.confirm(`Are you sure you want to delete "${organization.name}"?`)) return;
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`http://localhost:8000/api/organizations/${organization._id || organization.id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const updatedList = organizations.filter(o => (o._id || o.id) !== (organization._id || organization.id));
                setOrganizations(updatedList);
                if (selectedOrganization && (selectedOrganization._id || selectedOrganization.id) === (organization._id || organization.id)) {
                    setSelectedOrganization(null);
                    setViewMode('list');
                }
                alert('Organization deleted successfully!');
            } else {
                alert('Failed to delete organization');
            }
        } catch (err) {
            alert('Failed to delete organization');
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
            contact_person: '',
            email: '',
            phone: '',
            address: '',
            city: '',
            country: '',
            is_active: true,
            portal_access_enabled: true,
            username: '',
            password: ''
        });
        setError('');
        setViewMode('add');
    };

    const openEditForm = (organization) => {
        setFormData({
            name: organization.name || '',
            code: organization.code || '',
            contact_person: organization.contact_person || '',
            email: organization.email || '',
            phone: organization.phone || '',
            address: organization.address || '',
            city: organization.city || '',
            country: organization.country || '',
            is_active: organization.is_active ?? true,
            portal_access_enabled: organization.portal_access_enabled ?? true,
            username: organization.username || organization.email || '',
            password: '' // Don't populate password
        });
        setSelectedOrganization(organization);
        setError('');
        setViewMode('edit');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        if (!formData.name.trim()) {
            setError('Organization name is required');
            setIsSubmitting(false);
            return;
        }

        try {
            const token = localStorage.getItem('access_token');

            const url = viewMode === 'edit'
                ? `http://localhost:8000/api/organizations/${selectedOrganization._id || selectedOrganization.id}/`
                : 'http://localhost:8000/api/organizations/';

            const method = viewMode === 'edit' ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                await fetchOrganizations();
                alert(viewMode === 'edit' ? 'Organization updated successfully!' : 'Organization created successfully!');
                setViewMode('list');
            } else {
                const errorData = await response.json();
                setError(errorData.detail || 'Failed to save organization');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to save organization');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredOrganizations = organizations.filter(organization => {
        return organization.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            organization.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            organization.code?.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // LIST VIEW
    if (viewMode === 'list') {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <Building2 className="text-blue-600" size={24} />
                            Organizations <span className="text-slate-400 text-sm">({filteredOrganizations.length})</span>
                        </h1>
                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide">
                            Manage organization accounts
                        </p>
                    </div>
                    {organizationPerms.add && (
                        <button
                            onClick={openAddForm}
                            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:scale-105 transition-all"
                        >
                            <Plus size={16} />
                            <span>Add New Organization</span>
                        </button>
                    )}
                </div>

                <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
                    <div className="space-y-4 mb-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search organizations..."
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
                    ) : filteredOrganizations.length === 0 ? (
                        <div className="text-center p-12 text-slate-400 text-sm font-bold">No organizations found</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredOrganizations.map(organization => (
                                <div
                                    key={organization._id || organization.id}
                                    onClick={() => { setSelectedOrganization(organization); setViewMode('detail'); }}
                                    className="p-6 rounded-2xl border border-slate-100 cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02] active:scale-95 bg-white"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-black text-base text-slate-800">{organization.name}</h3>
                                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${organization.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {organization.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium mb-3">{organization.code || 'NO-REF'}</p>
                                    <div className="space-y-2">
                                        {organization.email && (
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                                <Mail size={12} />
                                                <span className="truncate">{organization.email}</span>
                                            </div>
                                        )}
                                        {organization.phone && (
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                                <Phone size={12} />
                                                <span>{organization.phone}</span>
                                            </div>
                                        )}
                                        {organization.city && (
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                                <MapPin size={12} />
                                                <span>{organization.city}</span>
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
    if (viewMode === 'detail' && selectedOrganization) {
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
                                <h1 className="text-lg font-bold text-slate-900">Organization Details</h1>
                                <p className="text-xs text-slate-500 uppercase tracking-wide">View and manage organization information</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {organizationPerms.update && (
                                <button
                                    onClick={() => openEditForm(selectedOrganization)}
                                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all flex items-center gap-2"
                                >
                                    <Edit2 size={14} /> EDIT
                                </button>
                            )}
                            {organizationPerms.delete && (
                                <button
                                    onClick={() => handleDelete(selectedOrganization)}
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
                                <Building2 size={32} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-1">{selectedOrganization.name}</h2>
                                <p className="text-sm text-slate-600 mb-1">{selectedOrganization.contact_person || 'No Contact Person'}</p>
                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                    <span className="flex items-center gap-1">
                                        <Phone size={12} /> {selectedOrganization.phone || 'N/A'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Mail size={12} /> {selectedOrganization.email || 'N/A'}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                    <MapPin size={12} /> {selectedOrganization.address || 'No Address Provided'}
                                </p>
                            </div>
                        </div>
                        <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-xs font-bold uppercase tracking-wider">
                            {selectedOrganization.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </div>

                    {/* Organization Information */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6">
                        <h3 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-wider">Organization Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Contact Person</p>
                                <p className="font-medium text-slate-900">{selectedOrganization.contact_person || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email</p>
                                <p className="font-medium text-slate-900">{selectedOrganization.email || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Phone</p>
                                <p className="font-medium text-slate-900">{selectedOrganization.phone || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">City</p>
                                <p className="font-medium text-slate-900">{selectedOrganization.city || 'N/A'}</p>
                            </div>
                            <div className="md:col-span-2">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Address</p>
                                <p className="font-medium text-slate-900">{selectedOrganization.address || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Portal Access Information */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-wider">Portal Access</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${selectedOrganization.portal_access_enabled ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                    {selectedOrganization.portal_access_enabled ? 'Enabled' : 'Disabled'}
                                </span>
                            </div>
                            {selectedOrganization.portal_access_enabled && (
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Username</p>
                                    <p className="font-medium text-slate-900">{selectedOrganization.username || selectedOrganization.email || 'N/A'}</p>
                                </div>
                            )}
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
                        {viewMode === 'add' ? 'Add New Organization' : 'Edit Organization'}
                    </h1>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide">
                        {viewMode === 'add' ? 'Create a new organization' : `Editing: ${selectedOrganization?.name}`}
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
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Organization Name *</label>
                        <input required type="text" name="name" value={formData.name} onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100" placeholder="Enter organization name" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Organization Code</label>
                        <input type="text" name="code" value={formData.code} onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100" placeholder="Enter organization code" />
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
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Address</label>
                        <textarea name="address" value={formData.address} onChange={handleInputChange} rows="2"
                            className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100 resize-none" placeholder="Full Address" />
                    </div>
                </div>

                {/* Portal Access Section */}
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <input
                            type="checkbox"
                            name="portal_access_enabled"
                            id="portal_access_enabled"
                            checked={formData.portal_access_enabled}
                            onChange={handleInputChange}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <label htmlFor="portal_access_enabled" className="text-sm font-bold text-slate-900 select-none">
                            Enable Portal Access
                        </label>
                    </div>

                    {formData.portal_access_enabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Username (Auto-filled from Email)</label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    readOnly
                                    className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-bold text-slate-500 outline-none cursor-not-allowed"
                                    placeholder="Enter username"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    Password {viewMode === 'add' ? '*' : '(Leave blank to keep current)'}
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100"
                                    placeholder={viewMode === 'add' ? "Enter password" : "Enter new password"}
                                />
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
                            {isSubmitting ? 'Saving...' : viewMode === 'edit' ? 'Update Organization' : 'Create Organization'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default OrganizationView;
