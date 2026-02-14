import React, { useState, useEffect } from 'react';
import { Building, Plus, Search, Edit2, Trash2, X, Eye, EyeOff } from 'lucide-react';

const AgenciesView = () => {
    const [agencies, setAgencies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterBranch, setFilterBranch] = useState('');
    const [filterType, setFilterType] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingAgency, setEditingAgency] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        agency_type: 'full',
        branch_id: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        is_active: true,
        portal_access_enabled: true,
        username: '',
        password: ''
    });

    // Fetch agencies
    const fetchAgencies = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('access_token');
            const response = await fetch('http://localhost:8000/api/agencies/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setAgencies(data);
            }
        } catch (error) {
            console.error('Error fetching agencies:', error);
            alert('Failed to fetch agencies');
        } finally {
            setLoading(false);
        }
    };

    // Fetch branches for dropdown
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

    useEffect(() => {
        fetchAgencies();
        fetchBranches();
    }, []);

    // Handle form input change
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        // Auto-fill username from email
        if (name === 'email') {
            setFormData(prev => ({
                ...prev,
                email: value,
                username: value // Auto-fill username with email
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    // Open modal for add/edit
    const openModal = (agency = null) => {
        if (agency) {
            setEditingAgency(agency);
            setFormData({
                name: agency.name || '',
                code: agency.code || '',
                agency_type: agency.agency_type || 'full',
                branch_id: agency.branch_id || agency.branch?._id || '',
                contact_person: agency.contact_person || '',
                email: agency.email || '',
                phone: agency.phone || '',
                address: agency.address || '',
                city: agency.city || '',
                is_active: agency.is_active ?? true,
                portal_access_enabled: agency.portal_access_enabled ?? true,
                username: agency.username || '',
                password: '' // Don't populate password for security
            });
        } else {
            setEditingAgency(null);
            setFormData({
                name: '',
                code: '',
                agency_type: 'full',
                branch_id: '',
                contact_person: '',
                email: '',
                phone: '',
                address: '',
                city: '',
                is_active: true,
                portal_access_enabled: true,
                username: '',
                password: ''
            });
        }
        setShowModal(true);
        setShowPassword(false);
    };

    // Close modal
    const closeModal = () => {
        setShowModal(false);
        setEditingAgency(null);
        setShowPassword(false);
    };

    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.name.trim()) {
            alert('Agency name is required');
            return;
        }

        if (!formData.branch_id) {
            alert('Please select a branch');
            return;
        }

        if (formData.portal_access_enabled) {
            if (!formData.username.trim()) {
                alert('Username is required for portal access');
                return;
            }
            if (!editingAgency && !formData.password.trim()) {
                alert('Password is required for new agency');
                return;
            }
        }

        try {
            const token = localStorage.getItem('access_token');
            const url = editingAgency
                ? `http://localhost:8000/api/agencies/${editingAgency.id || editingAgency._id}/`
                : 'http://localhost:8000/api/agencies/';

            const method = editingAgency ? 'PUT' : 'POST';

            // Prepare payload
            const payload = { ...formData };

            // Remove password if empty (for edit)
            if (editingAgency && !payload.password) {
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
                alert(editingAgency ? 'Agency updated successfully!' : 'Agency created successfully!');
                closeModal();
                fetchAgencies();
            } else {
                const errorData = await response.json();
                alert('Error: ' + (errorData.detail || JSON.stringify(errorData)));
            }
        } catch (error) {
            console.error('Error saving agency:', error);
            alert('Failed to save agency');
        }
    };

    // Handle delete
    const handleDelete = async (agency) => {
        if (!window.confirm(`Are you sure you want to delete "${agency.name}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`http://localhost:8000/api/agencies/${agency.id || agency._id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                alert('Agency deleted successfully!');
                fetchAgencies();
            } else {
                const errorData = await response.json();
                alert('Failed to delete agency: ' + (errorData.detail || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error deleting agency:', error);
            alert('Error deleting agency');
        }
    };

    // Get branch name by ID
    const getBranchName = (branchId) => {
        const branch = branches.find(b => (b.id || b._id) === branchId);
        return branch ? branch.name : 'Unknown Branch';
    };

    // Filter agencies
    const filteredAgencies = agencies.filter(agency => {
        const matchesSearch =
            agency.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            agency.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            agency.city?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesBranch = !filterBranch || (agency.branch_id || agency.branch?._id) === filterBranch;
        const matchesType = !filterType || agency.agency_type === filterType;

        return matchesSearch && matchesBranch && matchesType;
    });

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading agencies...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Agencies</h2>
                    <p className="text-slate-500 font-medium mt-1">Manage your branch agencies</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-100 flex items-center gap-2 justify-center"
                >
                    <Plus size={16} /> Add Agency
                </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div className="relative md:col-span-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search agencies..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 ring-blue-100 focus:border-blue-300 transition-all"
                    />
                </div>

                {/* Branch Filter */}
                <div>
                    <select
                        value={filterBranch}
                        onChange={(e) => setFilterBranch(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 ring-blue-100 focus:border-blue-300 transition-all"
                    >
                        <option value="">All Branches</option>
                        {branches.map(branch => (
                            <option key={branch.id || branch._id} value={branch.id || branch._id}>
                                {branch.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Type Filter */}
                <div>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 ring-blue-100 focus:border-blue-300 transition-all"
                    >
                        <option value="">All Types</option>
                        <option value="full">Full Agency</option>
                        <option value="area">Area Agency</option>
                    </select>
                </div>
            </div>

            {/* Agencies Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAgencies.length === 0 ? (
                    <div className="col-span-full text-center p-12 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                        <Building size={48} className="mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-400 font-medium">
                            {searchTerm || filterBranch || filterType
                                ? 'No agencies found matching your filters'
                                : 'No agencies yet. Create your first agency!'}
                        </p>
                    </div>
                ) : (
                    filteredAgencies.map(agency => (
                        <div
                            key={agency.id || agency._id}
                            className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-all duration-300"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-1">
                                        {agency.name}
                                    </h3>
                                    {agency.code && (
                                        <p className="text-xs text-slate-500 font-bold">Code: {agency.code}</p>
                                    )}
                                </div>
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${agency.is_active
                                    ? 'bg-emerald-50 text-emerald-600'
                                    : 'bg-red-50 text-red-600'
                                    }`}>
                                    {agency.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${agency.agency_type === 'full'
                                        ? 'bg-blue-50 text-blue-600'
                                        : 'bg-purple-50 text-purple-600'
                                        }`}>
                                        {agency.agency_type === 'full' ? 'Full Agency' : 'Area Agency'}
                                    </span>
                                </div>

                                <p className="text-sm text-slate-600">
                                    <span className="font-bold">Branch:</span> {getBranchName(agency.branch_id || agency.branch?._id)}
                                </p>

                                {agency.contact_person && (
                                    <p className="text-sm text-slate-600"><span className="font-bold">Contact:</span> {agency.contact_person}</p>
                                )}
                                {agency.email && (
                                    <p className="text-sm text-slate-600"><span className="font-bold">Email:</span> {agency.email}</p>
                                )}
                                {agency.phone && (
                                    <p className="text-sm text-slate-600"><span className="font-bold">Phone:</span> {agency.phone}</p>
                                )}
                                {agency.city && (
                                    <p className="text-sm text-slate-600"><span className="font-bold">City:</span> {agency.city}</p>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => openModal(agency)}
                                    className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all flex items-center justify-center gap-1"
                                >
                                    <Edit2 size={14} /> Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(agency)}
                                    className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-1"
                                >
                                    <Trash2 size={14} /> Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center rounded-t-3xl">
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                                {editingAgency ? 'Edit Agency' : 'Add New Agency'}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Agency Information Section */}
                            <div>
                                <h4 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-4">Agency Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-2">Agency Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 ring-blue-100 focus:bg-white focus:border-blue-300 transition-all"
                                            placeholder="Enter agency name"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-2">Agency Code</label>
                                        <input
                                            type="text"
                                            name="code"
                                            value={formData.code}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 ring-blue-100 focus:bg-white focus:border-blue-300 transition-all"
                                            placeholder="Enter agency code"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-2">Agency Type *</label>
                                        <select
                                            name="agency_type"
                                            value={formData.agency_type}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 ring-blue-100 focus:bg-white focus:border-blue-300 transition-all"
                                        >
                                            <option value="full">Full Agency</option>
                                            <option value="area">Area Agency</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-2">Branch *</label>
                                        <select
                                            name="branch_id"
                                            value={formData.branch_id}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 ring-blue-100 focus:bg-white focus:border-blue-300 transition-all"
                                        >
                                            <option value="">Select Branch</option>
                                            {branches.map(branch => (
                                                <option key={branch.id || branch._id} value={branch.id || branch._id}>
                                                    {branch.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-2">Contact Person</label>
                                        <input
                                            type="text"
                                            name="contact_person"
                                            value={formData.contact_person}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 ring-blue-100 focus:bg-white focus:border-blue-300 transition-all"
                                            placeholder="Enter contact person name"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-2">Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 ring-blue-100 focus:bg-white focus:border-blue-300 transition-all"
                                            placeholder="email@example.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-2">Phone</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 ring-blue-100 focus:bg-white focus:border-blue-300 transition-all"
                                            placeholder="03001234567"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-2">City</label>
                                        <input
                                            type="text"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 ring-blue-100 focus:bg-white focus:border-blue-300 transition-all"
                                            placeholder="Enter city"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-600 mb-2">Address</label>
                                        <textarea
                                            name="address"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            rows="2"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 ring-blue-100 focus:bg-white focus:border-blue-300 transition-all resize-none"
                                            placeholder="Enter full address"
                                        />
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            name="is_active"
                                            id="is_active"
                                            checked={formData.is_active}
                                            onChange={handleInputChange}
                                            className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                        />
                                        <label htmlFor="is_active" className="text-sm font-bold text-slate-700">
                                            Active Status
                                        </label>
                                    </div>
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
                                            onChange={handleInputChange}
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
                                                Password {!editingAgency && '*'}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    name="password"
                                                    value={formData.password}
                                                    onChange={handleInputChange}
                                                    required={formData.portal_access_enabled && !editingAgency}
                                                    className="w-full px-4 py-3 pr-12 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 ring-blue-100 focus:bg-white focus:border-blue-300 transition-all"
                                                    placeholder={editingAgency ? "Leave blank to keep current" : "Enter password"}
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

                            {/* Form Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                                >
                                    {editingAgency ? 'Update Agency' : 'Create Agency'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgenciesView;
