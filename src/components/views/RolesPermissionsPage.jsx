import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Shield, ChevronDown, Check, X, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

const API = 'http://localhost:8000/api';

// Permission action badges
const ACTIONS = ['view', 'add', 'update', 'delete', 'all'];
const ACTION_COLORS = {
    view:   'bg-blue-100 text-blue-700 border-blue-200',
    add:    'bg-green-100 text-green-700 border-green-200',
    update: 'bg-amber-100 text-amber-700 border-amber-200',
    delete: 'bg-red-100 text-red-700 border-red-200',
    all:    'bg-purple-100 text-purple-700 border-purple-200',
};

// Auto-grant logic: if 'all' is enabled, enable all; if any action is enabled, auto-grant 'view'
const applyAutoView = (perms) => {
    const out = {};
    for (const mod in perms) {
        const p = { ...perms[mod] };
        if (p.all) {
            // If "all" is enabled, enable everything
            p.view = true;
            p.add = true;
            p.update = true;
            p.delete = true;
        } else if (p.add || p.update || p.delete) {
            // Auto-grant view if any write permission is enabled
            p.view = true;
        }
        out[mod] = p;
    }
    return out;
};

// Build permission code from module path
const buildPermCode = (category, subLabel, action) => {
    // Category mappings
    const catMap = {
        'Inventory': 'inventory',
        'Pricing': 'pricing',
        'Finance': 'finance',
        'Payments': 'payments',
        'Customers': 'customers',
        'HR': 'hr',
        'Entities': 'entities',
        'Content & Operations': 'content', // default for content modules
        'Agency': 'agency',
    };
    
    // Special mappings for specific modules (category:module -> code)
    const specialMap = {
        // Finance modules with non-standard naming
        'Finance:Dashboard': 'finance.dashboard',
        'Finance:Chart of Accounts': 'finance.coa',
        'Finance:Journal Entries': 'finance.journals',
        'Finance:Manual Posting': 'finance.manual_posting',
        'Finance:Profit & Loss': 'finance.profit_loss',
        'Finance:Balance Sheet': 'finance.balance_sheet',
        'Finance:Trial Balance': 'finance.trial_balance',
        'Finance:Ledger': 'finance.ledger',
        'Finance:Audit Trail': 'finance.audit_trail',
        // Payments modules with non-standard naming
        'Payments:Add Payment': 'payments.add_payment',
        'Payments:Pending Payments': 'payments.pending',
        'Payments:Vouchers': 'payments.vouchers',
        'Payments:Bank Accounts': 'payments.bank_accounts',
        // Operations modules  
        'Content & Operations:Pax Movement': 'operations.pax_movement',
        'Content & Operations:Daily Operations': 'operations.daily',
        'Content & Operations:Order Delivery': 'operations.order_delivery',
    };
    
    const specialKey = `${category}:${subLabel}`;
    if (specialMap[specialKey]) {
        const parts = specialMap[specialKey].split('.');
        return `${parts[0]}.${parts[1]}.${action}`;
    }
    
    const prefix = catMap[category] || 'general';
    const sub = subLabel.toLowerCase().replace(/ & /g, '_').replace(/\s+/g, '_').replace(/[^\w]/g, '');
    return `${prefix}.${sub}.${action}`;
};

// ─── Pill badge ───────────────────────────────────────────────────────────────
const ActionBadge = ({ action, active }) => (
    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${active ? ACTION_COLORS[action] : 'bg-slate-50 text-slate-300 border-slate-100'}`}>
        {action}
    </span>
);

// ─── Permission row in the matrix ─────────────────────────────────────────────
const PermissionRow = ({ category, subLabel, perms, onChange, availableActions = ACTIONS }) => {
    const toggle = (action) => {
        const next = { ...perms, [action]: !perms[action] };
        // If enabling "all", enable everything that's available
        if (action === 'all' && next.all) {
            availableActions.forEach(a => { next[a] = true; });
        }
        // If disabling "all", disable everything
        if (action === 'all' && !next.all) {
            availableActions.forEach(a => { next[a] = false; });
        }
        // If enabling any action, disable "all"
        if (action !== 'all' && next[action]) {
            next.all = false;
        }
        // Auto-grant view if available
        if ((next.add || next.update || next.delete) && availableActions.includes('view')) {
            next.view = true;
        }
        onChange(next);
    };

    return (
        <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
            <td className="py-3 px-4">
                <div className="font-black text-xs text-slate-800">{subLabel}</div>
                <div className="text-[9px] text-slate-400">{category}</div>
            </td>
            {ACTIONS.map(action => {
                const isAvailable = availableActions.includes(action);
                const isView = action === 'view';
                const autoGranted = isView && isAvailable && (perms.add || perms.update || perms.delete || perms.all);
                const isAll = action === 'all';
                
                if (!isAvailable) {
                    return (
                        <td key={action} className="py-3 px-4 text-center">
                            <div className="w-6 h-6 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto" title="Not available for this module">
                                <X size={10} className="text-slate-300" strokeWidth={2} />
                            </div>
                        </td>
                    );
                }
                
                return (
                    <td key={action} className="py-3 px-4 text-center">
                        <button
                            type="button"
                            onClick={() => !autoGranted && toggle(action)}
                            title={autoGranted ? 'Auto-granted' : (isAll ? 'Grant all available permissions' : `Toggle ${action}`)}
                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center mx-auto transition-all ${
                                perms[action]
                                    ? `${ACTION_COLORS[action]} border-current`
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                            } ${autoGranted ? 'cursor-default opacity-70' : 'cursor-pointer'}`}
                        >
                            {perms[action] && <Check size={12} strokeWidth={3} />}
                        </button>
                    </td>
                );
            })}
        </tr>
    );
};

// ─── Group Form (inline, not modal) ───────────────────────────────────────────
const GroupForm = ({ group, onSave, onCancel }) => {
    const [name, setName] = useState(group?.name || '');
    const [desc, setDesc] = useState(group?.description || '');
    const [catalogue, setCatalogue] = useState([]);
    const [perms, setPerms] = useState({});
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');

    // Fetch permission catalogue from backend
    useEffect(() => {
        const fetchCatalogue = async () => {
            try {
                const token = localStorage.getItem('access_token');
                const res = await fetch(`${API}/role-groups/catalogue`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setCatalogue(data);
                    // Initialize permissions from group or empty
                    const initialPerms = {};
                    data.forEach(cat => {
                        cat.subcategories?.forEach(sub => {
                            const key = `${cat.category}:${sub.label}`;
                            initialPerms[key] = { view: false, add: false, update: false, delete: false, all: false };
                            // Load existing permissions
                            if (group?.permissions) {
                                sub.permissions?.forEach(p => {
                                    if (group.permissions.includes(p.code)) {
                                        const action = p.code.split('.').pop();
                                        initialPerms[key][action] = true;
                                    }
                                });
                            }
                        });
                    });
                    setPerms(initialPerms);
                }
            } catch (e) {
                setErr('Failed to load permiss  ion catalogue');
            } finally {
                setLoading(false);
            }
        };
        fetchCatalogue();
    }, [group]);

    const handleSave = async () => {
        if (!name.trim()) { setErr('Group name is required'); return; }
        setSaving(true);
        setErr('');
        
        // Build permission codes list from UI state (only save available permissions)
        const permCodes = [];
        catalogue.forEach(cat => {
            cat.subcategories?.forEach(sub => {
                const key = `${cat.category}:${sub.label}`;
                const p = perms[key] || {};
                // Get available actions from catalogue
                const availableActions = sub.permissions?.map(perm => perm.code.split('.').pop()) || ACTIONS;
                availableActions.forEach(action => {
                    if (p[action]) {
                        permCodes.push(buildPermCode(cat.category, sub.label, action));
                    }
                });
            });
        });

        const payload = { name: name.trim(), description: desc.trim(), permissions: permCodes };
        
        try {
            const token = localStorage.getItem('access_token');
            const orgId = localStorage.getItem('organization_id');
            if (!group) payload.organization_id = orgId;

            const url = group ? `${API}/role-groups/${group._id || group.id}` : `${API}/role-groups/`;
            const res = await fetch(url, {
                method: group ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                const data = await res.json();
                onSave(data);
            } else {
                const e = await res.json();
                setErr(e.detail || 'Failed to save');
            }
        } catch (e) { setErr('Network error'); }
        setSaving(false);
    };

    const setAll = (key, value) => {
        setPerms(p => ({
            ...p,
            [key]: { view: value, add: value, update: value, delete: value, all: value }
        }));
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <button onClick={onCancel} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold text-sm mb-2 transition-colors">
                        <ArrowLeft size={16} /> Back to Groups
                    </button>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">{group ? 'Edit Role Group' : 'Create Role Group'}</h1>
                    <p className="text-xs text-slate-400 mt-0.5">Enterprise RBAC – Organization → Branch → Agency → Employee</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all">Cancel</button>
                    <button onClick={handleSave} disabled={saving || loading}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-black text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 flex items-center gap-2">
                        {saving && <Loader2 size={14} className="animate-spin" />}
                        {group ? 'Save Changes' : 'Create Group'}
                    </button>
                </div>
            </div>

            {err && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-xs font-bold">
                    <AlertCircle size={14} /> {err}
                </div>
            )}

            {/* Name + Description */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Group Name *</label>
                        <input value={name} onChange={e => setName(e.target.value)}
                            className="w-full mt-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100"
                            placeholder="e.g. CRM Staff, Finance Manager, Agency Admin" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</label>
                        <input value={desc} onChange={e => setDesc(e.target.value)}
                            className="w-full mt-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100"
                            placeholder="Optional description" />
                    </div>
                </div>
            </div>

            {/* Permissions matrix */}
            <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Module Permissions</h3>
                <p className="text-[10px] text-slate-400 mb-4">
                    <Check size={10} className="inline text-green-500 mr-1" />
                    View is auto-granted when any write permission is enabled. "All" grants full access.
                </p>
                
                {loading ? (
                    <div className="flex justify-center py-16 bg-white rounded-2xl border border-slate-100">
                        <Loader2 className="animate-spin text-blue-600" size={32} />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {catalogue.map((cat, idx) => (
                            <div key={idx} className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
                                {/* Category Header */}
                                <div className="bg-gradient-to-r from-slate-900 to-slate-700 text-white px-5 py-4 flex items-center gap-3">
                                    <span className="text-2xl">{cat.icon}</span>
                                    <div>
                                        <h3 className="font-black text-sm">{cat.category}</h3>
                                        <p className="text-[9px] text-slate-300">{cat.description}</p>
                                    </div>
                                </div>
                                {/* Subcategories Table */}
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                                            <th className="py-2 px-4 text-left text-[9px] font-black uppercase tracking-widest">Module</th>
                                            {ACTIONS.map(a => (
                                                <th key={a} className="py-2 px-4 text-center text-[9px] font-black uppercase tracking-widest">
                                                    <span className={`px-1.5 py-0.5 rounded text-[8px] ${ACTION_COLORS[a]}`}>{a}</span>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cat.subcategories?.map((sub, subIdx) => {
                                            const key = `${cat.category}:${sub.label}`;
                                            const p = perms[key] || { view: false, add: false, update: false, delete: false, all: false };
                                            // Extract available actions from backend catalogue
                                            const availableActions = sub.permissions?.map(perm => perm.code.split('.').pop()) || ACTIONS;
                                            return (
                                                <PermissionRow
                                                    key={subIdx}
                                                    category={cat.category}
                                                    subLabel={sub.label}
                                                    perms={p}
                                                    availableActions={availableActions}
                                                    onChange={(next) => setPerms(prev => ({ ...prev, [key]: next }))}
                                                />
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer actions */}
            <div className="flex justify-end gap-3 p-6 bg-white rounded-2xl border border-slate-100">
                <button onClick={onCancel} className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all">Cancel</button>
                <button onClick={handleSave} disabled={saving || loading}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-black text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 flex items-center gap-2">
                    {saving && <Loader2 size={14} className="animate-spin" />}
                    {group ? 'Save Changes' : 'Create Group'}
                </button>
            </div>
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const RolesPermissionsPage = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [editingGroup, setEditingGroup] = useState(null);

    const orgId = localStorage.getItem('organization_id') || '';

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API}/role-groups/?organization_id=${orgId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) setGroups(await res.json());
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    useEffect(() => { fetchGroups(); }, []);

    const handleSave = (saved) => {
        setGroups(prev => {
            const idx = prev.findIndex(g => (g._id || g.id) === (saved._id || saved.id));
            return idx >= 0 ? prev.map((g, i) => (i === idx ? saved : g)) : [saved, ...prev];
        });
        setView('list');
        setEditingGroup(null);
    };

    const handleDelete = async (group) => {
        if (!window.confirm(`Delete group "${group.name}"? Employees assigned this group will lose its permissions.`)) return;
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API}/role-groups/${group._id || group.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) setGroups(prev => prev.filter(g => (g._id || g.id) !== (group._id || group.id)));
        } catch (e) { alert('Failed to delete'); }
    };

    const renderPermissionSummary = (permissions) => {
        if (!permissions || (Array.isArray(permissions) && permissions.length === 0)) {
            return <p className="mt-3 text-xs text-slate-400">No permissions assigned yet.</p>;
        }

        // Group permissions by module
        const grouped = {};
        if (Array.isArray(permissions)) {
            permissions.forEach(code => {
                const parts = code.split('.');
                if (parts.length === 3) {
                    const [cat, mod, action] = parts;
                    const key = `${cat}.${mod}`;
                    if (!grouped[key]) grouped[key] = [];
                    grouped[key].push(action);
                }
            });
        }

        return (
            <div className="mt-4 pt-4 border-t border-slate-50">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Granted Access</p>
                <div className="flex flex-wrap gap-2">
                    {Object.entries(grouped).map(([key, actions]) => {
                        const label = key.split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1).replace(/_/g, ' ')).join(' → ');
                        return (
                            <div key={key} className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5">
                                <span className="text-[10px] font-black text-slate-700">{label}</span>
                                <div className="flex gap-1">
                                    {actions.map(a => (
                                        <span key={a} className={`px-1 py-0.5 rounded text-[8px] font-black uppercase ${ACTION_COLORS[a]}`}>{a}</span>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Show form view
    if (view === 'form') {
        return (
            <GroupForm
                group={editingGroup}
                onSave={handleSave}
                onCancel={() => { setView('list'); setEditingGroup(null); }}
            />
        );
    }

    // Show list view
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Roles & Permissions</h1>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide">
                        Enterprise RBAC – Organization → Branch → Agency → Employee Hierarchy
                    </p>
                </div>
                <button
                    onClick={() => { setEditingGroup(null); setView('form'); }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-black text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                    <Plus size={16} /> New Group
                </button>
            </div>

            {/* Groups list */}
            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
            ) : groups.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
                    <Shield size={40} className="text-slate-200 mx-auto mb-4" />
                    <p className="font-bold text-slate-500 text-sm">No role groups yet</p>
                    <p className="text-xs text-slate-400 mt-1">Create your first group to start assigning permissions to employees</p>
                    <button onClick={() => setView('form')}
                        className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-black text-sm hover:bg-blue-700 transition-all">
                        <Plus size={14} /> Create First Group
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {groups.map(group => (
                        <div key={group._id || group.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-4 min-w-0">
                                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                                        <Shield size={18} className="text-blue-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-black text-slate-900">{group.name}</h3>
                                        {group.description && <p className="text-xs text-slate-400 mt-0.5">{group.description}</p>}
                                    </div>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button onClick={() => { setEditingGroup(group); setView('form'); }}
                                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all">
                                        <Edit2 size={14} />
                                    </button>
                                    <button onClick={() => handleDelete(group)}
                                        className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-all">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Permissions summary */}
                            {renderPermissionSummary(group.permissions)}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RolesPermissionsPage;
