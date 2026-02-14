import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Trash2, Search, X, Eye, EyeOff } from 'lucide-react';

const OrganizationView = () => {
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingOrg, setEditingOrg] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
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
            const token = localStorage.getItem('access_token');
            const response = await fetch('http://localhost:8000/api/organizations/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setOrganizations(data);
            }
        } catch (error) {
            console.error('Error fetching organizations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('access_token');

        // Validation
        if (formData.portal_access_enabled) {
            if (!formData.username.trim()) {
                alert('Username is required for portal access');
                return;
            }
            if (!editingOrg && !formData.password.trim()) {
                alert('Password is required for new organization');
                return;
            }
        }

        try {
            const url = editingOrg
                ? `http://localhost:8000/api/organizations/${editingOrg._id}`
                : 'http://localhost:8000/api/organizations/';

            const method = editingOrg ? 'PUT' : 'POST';

            // Prepare payload
            const payload = { ...formData };

            // Remove password if empty (for edit)
            if (editingOrg && !payload.password) {
                delete payload.password;
            }

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                await fetchOrganizations();
                handleCloseModal();
                alert(editingOrg ? 'Organization updated successfully!' : 'Organization created successfully!');
            } else {
                const error = await response.json();
                console.error('Backend error:', error);
                // Handle validation errors
                if (error.detail && Array.isArray(error.detail)) {
                    const errorMessages = error.detail.map(err => `${err.loc.join('.')}: ${err.msg}`).join('\n');
                    alert(`Validation Error:\n${errorMessages}`);
                } else {
                    alert(`Error: ${error.detail || 'Failed to save organization'}`);
                }
            }
        } catch (error) {
            console.error('Error saving organization:', error);
            alert('Error saving organization');
        }
    };

    const handleDelete = async (orgId) => {
        if (!window.confirm('Are you sure you want to delete this organization?')) return;

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`http://localhost:8000/api/organizations/${orgId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                await fetchOrganizations();
                alert('Organization deleted successfully!');
            } else {
                alert('Failed to delete organization');
            }
        } catch (error) {
            console.error('Error deleting organization:', error);
            alert('Error deleting organization');
        }
    };

    const handleEdit = (org) => {
        setEditingOrg(org);
        setFormData({
            name: org.name,
            email: org.email,
            phone: org.phone,
            address: org.address || '',
            city: org.city || '',
            country: org.country || '',
            is_active: org.is_active,
            portal_access_enabled: org.portal_access_enabled ?? true,
            username: org.username || '',
            password: '' // Don't populate password for security
        });
        setShowModal(true);
        setShowPassword(false);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingOrg(null);
        setShowPassword(false);
        setFormData({
            name: '',
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
    };

    const filteredOrganizations = organizations.filter(org =>
        (org.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (org.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading organizations...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Organizations</h2>
                    <p className="text-slate-500 font-medium">Manage organization accounts</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                >
                    <Plus size={16} /> Add Organization
                </button>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                </div>
            </div>

            {/* Organizations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrganizations.length === 0 ? (
                    <div className="col-span-full text-center p-12 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                        <Building2 className="mx-auto text-slate-300 mb-4" size={48} />
                        <p className="text-slate-400 font-medium">
                            {searchTerm ? 'No organizations found matching your search' : 'No organizations yet. Create your first organization!'}
                        </p>
                    </div>
                ) : (
                    filteredOrganizations.map(org => (
                        <div
                            key={org._id}
                            className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-all duration-300"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-1">
                                        {org.name}
                                    </h3>
                                </div>
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${org.is_active
                                    ? 'bg-emerald-50 text-emerald-600'
                                    : 'bg-red-50 text-red-600'
                                    }`}>
                                    {org.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            <div className="space-y-2 mb-4">
                                {org.email && (
                                    <p className="text-sm text-slate-600"><span className="font-bold">Email:</span> {org.email}</p>
                                )}
                                {org.phone && (
                                    <p className="text-sm text-slate-600"><span className="font-bold">Phone:</span> {org.phone}</p>
                                )}
                                {org.city && (
                                    <p className="text-sm text-slate-600"><span className="font-bold">City:</span> {org.city}</p>
                                )}
                                {org.country && (
                                    <p className="text-sm text-slate-600"><span className="font-bold">Country:</span> {org.country}</p>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEdit(org)}
                                    className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all flex items-center justify-center gap-1"
                                >
                                    <Edit2 size={14} /> Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(org._id)}
                                    className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-1"
                                >
                                    <Trash2 size={14} /> Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex items-center justify-between rounded-t-3xl">
                            <h3 className="text-2xl font-black text-slate-900 uppercase">
                                {editingOrg ? 'Edit Organization' : 'Add Organization'}
                            </h3>
                            <button onClick={handleCloseModal} className="p-2 hover:bg-slate-100 rounded-lg transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Organization Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value, username: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Phone</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                        required
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Address</label>
                                    <input
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">City</label>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Country</label>
                                    <input
                                        type="text"
                                        value={formData.country}
                                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {/* Portal Access Section */}
                            <div className="border-t border-slate-200 pt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-sm font-black text-slate-700 uppercase tracking-wider">Portal Access</h4>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            name="portal_access_enabled"
                                            id="portal_access_enabled"
                                            checked={formData.portal_access_enabled}
                                            onChange={(e) => setFormData({ ...formData, portal_access_enabled: e.target.checked })}
                                            className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                        />
                                        <label htmlFor="portal_access_enabled" className="text-sm font-bold text-slate-700">
                                            Enable Portal Access
                                        </label>
                                    </div>
                                </div>

                                {formData.portal_access_enabled && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-2">Username (Auto-filled from Email) *</label>
                                            <input
                                                type="text"
                                                name="username"
                                                value={formData.username}
                                                readOnly
                                                required={formData.portal_access_enabled}
                                                className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium outline-none cursor-not-allowed text-slate-600"
                                                placeholder="Enter email above to auto-fill"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-2">
                                                Password {!editingOrg && '*'}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    name="password"
                                                    value={formData.password}
                                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                    required={formData.portal_access_enabled && !editingOrg}
                                                    className="w-full px-4 py-3 pr-12 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 ring-blue-100 focus:bg-white focus:border-blue-300 transition-all"
                                                    placeholder={editingOrg ? "Leave blank to keep current" : "Enter password"}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                >
                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="is_active" className="text-sm font-bold text-slate-700">Active</label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                                >
                                    {editingOrg ? 'Update' : 'Create'} Organization
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrganizationView;
