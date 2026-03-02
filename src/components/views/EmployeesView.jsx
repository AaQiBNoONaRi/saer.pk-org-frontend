import React, { useState, useEffect } from 'react';
import {
    Users, Plus, Search, Mail, Phone, ArrowLeft,
    Edit2, Trash2, Loader2, AlertCircle, User, Eye, EyeOff
} from 'lucide-react';
import { getModulePermissions } from '../../utils/permissions';

const EmployeesView = () => {
    // Check permissions for entities.employees module
    const employeesPerms = getModulePermissions('entities.employees');
    const [employees, setEmployees] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [branches, setBranches] = useState([]);
    const [agencies, setAgencies] = useState([]);
    const [groups, setGroups] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'list', 'detail', 'add', 'edit'

    const [searchQuery, setSearchQuery] = useState('');
    const [filterOrg, setFilterOrg] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const orgId = localStorage.getItem('organization_id') || '';

    const [formData, setFormData] = useState({
        emp_id: '',
        name: '',
        email: '',
        phone: '',
        role: 'ORGANIZATION_EMPLOYEE',
        entity_type: 'organization',
        entity_id: orgId,
        organization_id: orgId,
        branch_id: '',
        agency_id: '',
        is_active: true,
        portal_access_enabled: true,
        username: '',
        password: '',
        permissions: ['crm'],
        group_id: ''
    });

    useEffect(() => {
        fetchEmployees();
        fetchOrganizations();
        fetchBranches();
        fetchAgencies();
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const orgId = localStorage.getItem('organization_id') || '';
            const res = await fetch(`http://localhost:8000/api/role-groups/?organization_id=${orgId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setGroups(await res.json());
        } catch (e) {
            console.error('Failed to fetch groups', e);
        }
    };

    const fetchEmployees = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('access_token');
            const response = await fetch('http://localhost:8000/api/employees/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                console.debug('fetchEmployees: got', Array.isArray(data) ? data.length : typeof data, 'employees');
                // keep a shallow copy for debugging if needed
                window.__debug_employees = data;
                setEmployees(data);
            }
        } catch (err) {
            console.error("Failed to fetch employees", err);
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
                console.debug('fetchOrganizations: got', data?.length ?? 0, 'organizations', data);
                window.__debug_organizations = data;
                setOrganizations(data);
                console.debug('fetchOrganizations: state updated, organizations.length =', data?.length);
            } else {
                console.warn('fetchOrganizations: primary request failed', response.status);
                // Fallback: try without auth headers (useful in local dev if token missing)
                try {
                    const fallback = await fetch('http://localhost:8000/api/organizations/');
                    if (fallback.ok) {
                        const data = await fallback.json();
                        console.debug('fetchOrganizations: fallback got', data?.length ?? 0, 'organizations', data);
                        window.__debug_organizations = data;
                        setOrganizations(data);
                        console.debug('fetchOrganizations: fallback state updated');
                        return;
                    }
                    console.warn('fetchOrganizations: fallback also failed', fallback.status);
                } catch (fbErr) {
                    console.error('fetchOrganizations fallback error', fbErr);
                }
            }
        } catch (error) {
            console.error('Error fetching organizations:', error);
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
        } catch (error) {
            console.error('Error fetching agencies:', error);
        }
    };

    const handleDelete = async (employee) => {
        if (!window.confirm(`Are you sure you want to delete "${employee.name}"?`)) return;
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`http://localhost:8000/api/employees/${employee._id || employee.id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const updatedList = employees.filter(e => (e._id || e.id) !== (employee._id || employee.id));
                setEmployees(updatedList);
                if (selectedEmployee && String(selectedEmployee._id || selectedEmployee.id) === String(employee._id || employee.id)) {
                    setSelectedEmployee(null);
                    setViewMode('list');
                }
                alert('Employee deleted successfully!');
            } else {
                alert('Failed to delete employee');
            }
        } catch (err) {
            alert('Failed to delete employee');
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === 'email') {
            // Auto-generate emp_id from email prefix + timestamp suffix
            const prefix = value.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 6);
            const suffix = Date.now().toString().slice(-4);
            const autoEmpId = `ORG-${prefix}-${suffix}`;
            setFormData(prev => ({
                ...prev,
                email: value,
                username: value,
                emp_id: prev.emp_id || autoEmpId
            }));
        } else if (name === 'permission_crm') {
            setFormData(prev => ({
                ...prev,
                permissions: checked
                    ? [...(prev.permissions || []).filter(p => p !== 'crm'), 'crm']
                    : (prev.permissions || []).filter(p => p !== 'crm')
            }));
        } else if (name === 'permission_employees') {
            setFormData(prev => ({
                ...prev,
                permissions: checked
                    ? [...(prev.permissions || []).filter(p => p !== 'employees'), 'employees']
                    : (prev.permissions || []).filter(p => p !== 'employees')
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const openAddForm = () => {
        const orgId = localStorage.getItem('organization_id') || '';
        setFormData({
            emp_id: '',
            name: '',
            email: '',
            phone: '',
            role: 'ORGANIZATION_EMPLOYEE',
            entity_type: 'organization',
            entity_id: orgId,
            organization_id: orgId,
            branch_id: '',
            agency_id: '',
            is_active: true,
            portal_access_enabled: true,
            username: '',
            password: '',
            permissions: ['crm'],
            group_id: ''
        });
        setError('');
        setViewMode('add');
    };

    const openEditForm = (employee) => {
        const orgId = localStorage.getItem('organization_id') || '';
        setFormData({
            emp_id: employee.emp_id || '',
            name: employee.name || '',
            email: employee.email || '',
            phone: employee.phone || '',
            role: employee.role || 'ORGANIZATION_EMPLOYEE',
            entity_type: 'organization',
            entity_id: orgId,
            organization_id: orgId,
            branch_id: '',
            agency_id: '',
            is_active: employee.is_active ?? true,
            portal_access_enabled: employee.portal_access_enabled ?? true,
            username: employee.username || '',
            password: '',
            permissions: employee.permissions || ['crm'],
            group_id: employee.group_id || ''
        });
        setSelectedEmployee(employee);
        setError('');
        setViewMode('edit');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        if (!formData.name.trim() || !formData.email.trim()) {
            setError('Name and email are required');
            setIsSubmitting(false);
            return;
        }

        if (viewMode === 'add' && !formData.password?.trim()) {
            setError('Password is required for new employees');
            setIsSubmitting(false);
            return;
        }

        try {
            const token = localStorage.getItem('access_token');
            const payload = { ...formData };

            if (viewMode === 'edit' && !payload.password) {
                delete payload.password;
            }

            const url = viewMode === 'edit'
                ? `http://localhost:8000/api/employees/${selectedEmployee._id || selectedEmployee.id}/`
                : 'http://localhost:8000/api/employees/';

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
                await fetchEmployees();
                alert(viewMode === 'edit' ? 'Employee updated successfully!' : 'Employee created successfully!');
                setViewMode('list');
            } else {
                const errorData = await response.json();
                setError(errorData.detail || 'Failed to save employee');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to save employee');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredEmployees = employees.filter(employee => {
        const matchesSearch = employee.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            employee.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesOrg = !filterOrg || String(employee.organization_id || employee.organization?._id) === filterOrg;
        const matchesRole = filterRole === 'all' || employee.role === filterRole;
        return matchesSearch && matchesOrg && matchesRole;
    });

    const getEntityName = (entities, id) => {
        if (!id) return 'N/A';
        const entity = entities.find(e => String(e.id || e._id) === String(id));
        return entity ? entity.name : 'N/A';
    };

    // LIST VIEW
    if (viewMode === 'list') {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <Users className="text-blue-600" size={24} />
                            Employees <span className="text-slate-400 text-sm">({filteredEmployees.length})</span>
                        </h1>
                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide">
                            Manage employee accounts
                        </p>
                    </div>
                    {employeesPerms.add && (
                        <button
                            onClick={openAddForm}
                            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:scale-105 transition-all"
                        >
                            <Plus size={16} />
                            <span>Add New Employee</span>
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
                                placeholder="Search employees..."
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <select
                                value={filterOrg}
                                onChange={(e) => setFilterOrg(e.target.value)}
                                className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 outline-none"
                            >
                                <option value="">All Organizations</option>
                                {organizations.length === 0 && (
                                    <option disabled>Loading organizations... (check console)</option>
                                )}
                                {organizations.map(org => (
                                    <option key={org.id || org._id} value={org.id || org._id}>
                                        {org.name}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value)}
                                className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 outline-none"
                            >
                                <option value="all">All Roles</option>
                                <option value="ORGANIZATION_ADMIN">Organization Admin</option>
                                <option value="ORGANIZATION_EMPLOYEE">Organization Employee</option>
                                <option value="BRANCH_ADMIN">Branch Admin</option>
                                <option value="BRANCH_EMPLOYEE">Branch Employee</option>
                                <option value="AGENCY_ADMIN">Agency Admin</option>
                                <option value="AGENCY_EMPLOYEE">Agency Employee</option>
                            </select>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
                    ) : filteredEmployees.length === 0 ? (
                        <div className="text-center p-12 text-slate-400 text-sm font-bold">No employees found</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredEmployees.map(employee => (
                                <div
                                    key={employee._id || employee.id}
                                    onClick={() => { setSelectedEmployee(employee); setViewMode('detail'); }}
                                    className="p-6 rounded-2xl border border-slate-100 cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02] active:scale-95 bg-white"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-black text-base text-slate-800">{employee.name}</h3>
                                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${employee.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {employee.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium mb-3">{employee.role?.replace('_', ' ')}</p>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                            <Mail size={12} />
                                            <span className="truncate">{employee.email}</span>
                                        </div>
                                        {employee.phone && (
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                                <Phone size={12} />
                                                <span>{employee.phone}</span>
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
    if (viewMode === 'detail' && selectedEmployee) {
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
                                <h1 className="text-lg font-bold text-slate-900">Employee Details</h1>
                                <p className="text-xs text-slate-500 uppercase tracking-wide">View and manage employee information</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {employeesPerms.update && (
                                <button
                                    onClick={() => openEditForm(selectedEmployee)}
                                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all flex items-center gap-2"
                                >
                                    <Edit2 size={14} /> EDIT
                                </button>
                            )}
                            {employeesPerms.delete && (
                                <button
                                    onClick={() => handleDelete(selectedEmployee)}
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
                                <User size={32} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-1">{selectedEmployee.name}</h2>
                                <p className="text-sm text-slate-600 mb-1">{selectedEmployee.role?.replace('_', ' ')}</p>
                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                    <span className="flex items-center gap-1">
                                        <Phone size={12} /> {selectedEmployee.phone || 'N/A'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Mail size={12} /> {selectedEmployee.email || 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <span className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider ${selectedEmployee.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {selectedEmployee.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </div>

                    {/* Employee Information */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-wider">Employee Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email</p>
                                <p className="font-medium text-slate-900">{selectedEmployee.email || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Phone</p>
                                <p className="font-medium text-slate-900">{selectedEmployee.phone || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Organization</p>
                                {(() => {
                                    const orgName = selectedEmployee.organization?.name || selectedEmployee.organization_name || getEntityName(organizations, selectedEmployee.entity_id || selectedEmployee.organization_id || selectedEmployee.organization?._id);
                                    if (orgName && orgName !== 'N/A') {
                                        return <p className="font-medium text-slate-900">{orgName}</p>;
                                    }
                                    // Show brief debug info to help diagnose missing link
                                    return (
                                        <div className="text-xs text-rose-500">
                                            <p className="font-medium">Not linked</p>
                                            <pre className="mt-2 text-[10px] text-slate-400 bg-slate-50 p-2 rounded-md overflow-x-auto">{JSON.stringify({ orgLookupCount: organizations?.length ?? 0, selectedOrganization: selectedEmployee.organization || null, entity_id: selectedEmployee.entity_id || selectedEmployee.organization_id || null }, null, 2)}</pre>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>

                    {/* Portal Access Information */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mt-6">
                        <h3 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-wider">Portal Access</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${selectedEmployee.portal_access_enabled ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                    {selectedEmployee.portal_access_enabled ? 'Enabled' : 'Disabled'}
                                </span>
                            </div>
                            {selectedEmployee.portal_access_enabled && (
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Username</p>
                                    <p className="font-medium text-slate-900">{selectedEmployee.username || selectedEmployee.email || 'N/A'}</p>
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
                        {viewMode === 'add' ? 'Add New Employee' : 'Edit Employee'}
                    </h1>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide">
                        {viewMode === 'add' ? 'Create a new employee account' : `Editing: ${selectedEmployee?.name}`}
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
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Full Name *</label>
                        <input required type="text" name="name" value={formData.name} onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100" placeholder="Enter full name" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email *</label>
                        <input required type="email" name="email" value={formData.email} onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100" placeholder="email@example.com" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Phone</label>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100" placeholder="+92 300 1234567" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Role *</label>
                        <select name="role" value={formData.role} onChange={handleInputChange} required
                            className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100">
                            <option value="ORGANIZATION_ADMIN">Organization Admin</option>
                            <option value="ORGANIZATION_EMPLOYEE">Organization Employee</option>
                        </select>
                    </div>

                    {/* Entity locked to this Organization */}
                    <div className="md:col-span-2 flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-100 rounded-2xl">
                        <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" /></svg>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Assigned Entity</p>
                            <p className="text-xs font-black text-blue-700">Your Organization</p>
                            <p className="text-[9px] text-blue-400">This employee will belong to your organization</p>
                        </div>
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
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        required={viewMode === 'add'}
                                        className="w-full px-4 py-3 pr-12 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100"
                                        placeholder={viewMode === 'edit' ? "Leave blank to keep current" : "Enter password"}
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Permissions */}
                    {formData.portal_access_enabled && (
                        <div className="pt-2 border-t border-slate-200 animate-in fade-in duration-300">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Portal Permissions</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Assign Group</label>
                                    <select name="group_id" value={formData.group_id || ''} onChange={handleInputChange}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100">
                                        <option value="">-- No group (custom permissions) --</option>
                                        {groups.map(g => (
                                            <option key={g._id || g.id} value={g._id || g.id}>{g.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Custom Permissions</p>
                                    <p className="text-xs text-slate-400">Use when you need ad-hoc simple permissions. Prefer assigning a group.</p>
                                    <div className="mt-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name="permission_crm"
                                                checked={(formData.permissions || []).includes('crm')}
                                                onChange={handleInputChange}
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                            />
                                            <span className="text-xs font-bold text-slate-700">CRM Access</span>
                                        </label>
                                    </div>
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
                            {isSubmitting ? 'Saving...' : viewMode === 'edit' ? 'Update Employee' : 'Create Employee'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default EmployeesView;