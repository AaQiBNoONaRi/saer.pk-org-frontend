import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Search, X, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '../../services/api';

const EmployeesView = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentAdmin, setCurrentAdmin] = useState(null);
    const [formData, setFormData] = useState({
        emp_id: '',
        name: '',
        email: '',
        phone: '',
        password: '',
        entity_type: 'organization',
        entity_id: '',
        role: 'agent',
        is_active: true,
        portal_access_enabled: true,
        username: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [entities, setEntities] = useState({ organizations: [], branches: [], agencies: [] });

    useEffect(() => {
        // Get current admin data
        const adminData = authAPI.getAdminData();
        setCurrentAdmin(adminData);

        fetchEmployees();
        fetchEntities();
    }, []);

    const fetchEmployees = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('http://localhost:8000/api/employees/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setEmployees(data);
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEntities = async () => {
        const token = localStorage.getItem('access_token');

        console.log('Fetching entities with token:', token ? 'Token exists' : 'No token');

        let organizations = [];
        let branches = [];
        let agencies = [];

        // Fetch organizations
        try {
            const orgResponse = await fetch('http://localhost:8000/api/organizations/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('Organizations response status:', orgResponse.status);
            if (orgResponse.ok) {
                organizations = await orgResponse.json();
                console.log('Organizations fetched:', organizations);
            } else {
                console.warn('Failed to fetch organizations:', orgResponse.status);
            }
        } catch (error) {
            console.error('Error fetching organizations:', error);
        }

        // Fetch branches (don't fail if this errors)
        try {
            const branchResponse = await fetch('http://localhost:8000/api/branches/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (branchResponse.ok) {
                branches = await branchResponse.json();
                console.log('Branches fetched:', branches);
            } else {
                console.warn('Failed to fetch branches:', branchResponse.status);
            }
        } catch (error) {
            console.warn('Error fetching branches (continuing anyway):', error);
        }

        // Fetch agencies (don't fail if this errors)
        try {
            const agencyResponse = await fetch('http://localhost:8000/api/agencies/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (agencyResponse.ok) {
                agencies = await agencyResponse.json();
                console.log('Agencies fetched:', agencies);
            } else {
                console.warn('Failed to fetch agencies:', agencyResponse.status);
            }
        } catch (error) {
            console.warn('Error fetching agencies (continuing anyway):', error);
        }

        setEntities({ organizations, branches, agencies });

        // If no organizations found, show warning
        if (organizations.length === 0) {
            console.warn('No organizations found in database');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('access_token');

        try {
            const url = editingEmployee
                ? `http://localhost:8000/api/employees/${editingEmployee.emp_id}`
                : 'http://localhost:8000/api/employees/';

            const method = editingEmployee ? 'PUT' : 'POST';

            // Don't send password if editing and password is empty
            const payload = { ...formData };
            if (editingEmployee && !payload.password) {
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
                await fetchEmployees();
                handleCloseModal();
                alert(editingEmployee ? 'Employee updated successfully!' : 'Employee created successfully!');
            } else {
                const error = await response.json();
                console.error('Backend error:', error);
                // Handle validation errors
                if (error.detail && Array.isArray(error.detail)) {
                    const errorMessages = error.detail.map(err => `${err.loc.join('.')}: ${err.msg}`).join('\n');
                    alert(`Validation Error:\n${errorMessages}`);
                } else {
                    alert(`Error: ${error.detail || 'Failed to save employee'}`);
                }
            }
        } catch (error) {
            console.error('Error saving employee:', error);
            alert('Error saving employee');
        }
    };

    const handleDelete = async (empId) => {
        if (!window.confirm('Are you sure you want to delete this employee?')) return;

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`http://localhost:8000/api/employees/${empId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                await fetchEmployees();
                alert('Employee deleted successfully!');
            } else {
                alert('Failed to delete employee');
            }
        } catch (error) {
            console.error('Error deleting employee:', error);
            alert('Error deleting employee');
        }
    };

    const handleEdit = (employee) => {
        setEditingEmployee(employee);
        setFormData({
            emp_id: employee.emp_id,
            name: employee.name,
            email: employee.email,
            phone: employee.phone,
            password: '', // Don't pre-fill password
            entity_type: employee.entity_type,
            entity_id: employee.entity_id,
            role: employee.role,
            is_active: employee.is_active,
            portal_access_enabled: employee.portal_access_enabled ?? true,
            username: employee.username || ''
        });
        setShowModal(true);
        setShowPassword(false);
    };

    const handleOpenAddModal = () => {
        // Pre-select current admin's organization if available
        if (currentAdmin && currentAdmin.org_id) {
            setFormData({
                emp_id: '',
                name: '',
                email: '',
                phone: '',
                password: '',
                entity_type: 'organization',
                entity_id: currentAdmin.org_id,
                role: 'agent',
                is_active: true,
                portal_access_enabled: true,
                username: ''
            });
        }
        setShowModal(true);
        setShowPassword(false);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingEmployee(null);
        setFormData({
            emp_id: '',
            name: '',
            email: '',
            phone: '',
            password: '',
            entity_type: 'organization',
            entity_id: '',
            role: 'agent',
            is_active: true,
            portal_access_enabled: true,
            username: ''
        });
        setShowPassword(false);
    };

    const getEntityOptions = () => {
        switch (formData.entity_type) {
            case 'organization':
                return entities.organizations;
            case 'branch':
                return entities.branches;
            case 'agency':
                return entities.agencies;
            default:
                return [];
        }
    };

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.emp_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading employees...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Employees</h2>
                    <p className="text-slate-500 font-medium">Manage employee accounts and roles</p>
                </div>
                <button
                    onClick={handleOpenAddModal}
                    className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                >
                    <Plus size={16} /> Add Employee
                </button>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name, ID, or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                </div>
            </div>

            {/* Employees Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEmployees.length === 0 ? (
                    <div className="col-span-full text-center p-12 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                        <Users className="mx-auto text-slate-300 mb-4" size={48} />
                        <p className="text-slate-400 font-medium">
                            {searchTerm ? 'No employees found matching your search' : 'No employees yet. Create your first employee!'}
                        </p>
                    </div>
                ) : (
                    filteredEmployees.map(employee => (
                        <div
                            key={employee._id}
                            className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-all duration-300"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-1">
                                        {employee.name}
                                    </h3>
                                    <p className="text-xs text-slate-500 font-bold">ID: {employee.emp_id}</p>
                                </div>
                                <div className="flex flex-col gap-1 items-end">
                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${employee.is_active
                                        ? 'bg-emerald-50 text-emerald-600'
                                        : 'bg-red-50 text-red-600'
                                        }`}>
                                        {employee.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-600 uppercase">
                                        {employee.role}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2 mb-4">
                                {employee.email && (
                                    <p className="text-sm text-slate-600"><span className="font-bold">Email:</span> {employee.email}</p>
                                )}
                                {employee.phone && (
                                    <p className="text-sm text-slate-600"><span className="font-bold">Phone:</span> {employee.phone}</p>
                                )}
                                {employee.entity_type && (
                                    <p className="text-sm text-slate-600"><span className="font-bold">Entity:</span> <span className="capitalize">{employee.entity_type}</span></p>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEdit(employee)}
                                    className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all flex items-center justify-center gap-1"
                                >
                                    <Edit2 size={14} /> Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(employee.emp_id)}
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
                                {editingEmployee ? 'Edit Employee' : 'Add Employee'}
                            </h3>
                            <button onClick={handleCloseModal} className="p-2 hover:bg-slate-100 rounded-lg transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Employee ID</label>
                                    <input
                                        type="text"
                                        value={formData.emp_id}
                                        onChange={(e) => setFormData({ ...formData, emp_id: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                        required
                                        disabled={editingEmployee}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Name</label>
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

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Role</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                        required
                                    >
                                        <option value="admin">Admin</option>
                                        <option value="manager">Manager</option>
                                        <option value="agent">Agent</option>
                                        <option value="support">Support</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Entity Type</label>
                                    <select
                                        value={formData.entity_type}
                                        onChange={(e) => setFormData({ ...formData, entity_type: e.target.value, entity_id: '' })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                        required
                                    >
                                        <option value="organization">Organization</option>
                                        <option value="branch">Branch</option>
                                        <option value="agency">Agency</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Entity</label>
                                    <select
                                        value={formData.entity_id}
                                        onChange={(e) => setFormData({ ...formData, entity_id: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                        required
                                    >
                                        <option value="">
                                            {getEntityOptions().length === 0
                                                ? `No ${formData.entity_type}s found - Please create one first`
                                                : `Select ${formData.entity_type}`}
                                        </option>
                                        {getEntityOptions().map(entity => (
                                            <option key={entity._id} value={entity._id}>
                                                {entity.name || entity.org_name}
                                            </option>
                                        ))}
                                    </select>
                                    {getEntityOptions().length === 0 && (
                                        <p className="mt-2 text-xs text-amber-600 font-medium">
                                            ⚠️ No {formData.entity_type}s available. Please go to Entities → {formData.entity_type === 'organization' ? 'Organization' : formData.entity_type === 'branch' ? 'Branch' : 'Agencies'} to create one first.
                                        </p>
                                    )}
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
                                                Password {!editingEmployee && '*'}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    name="password"
                                                    value={formData.password}
                                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                    required={formData.portal_access_enabled && !editingEmployee}
                                                    className="w-full px-4 py-3 pr-12 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 ring-blue-100 focus:bg-white focus:border-blue-300 transition-all"
                                                    placeholder={editingEmployee ? "Leave blank to keep current" : "Enter password"}
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
                                    {editingEmployee ? 'Update' : 'Create'} Employee
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeesView;
