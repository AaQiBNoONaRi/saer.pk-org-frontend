import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Shield, ChevronDown, Check, X, Loader2, AlertCircle } from 'lucide-react';

const API = 'http://localhost:8000/api';

const MODULES = [
    { key: 'inventory',       label: 'Inventory',                 desc: 'Packages, rooms, transport stock' },
    { key: 'inventory_items', label: 'Inventory Items',           desc: 'Individual inventory line items' },
    { key: 'share_inventory', label: 'Share Inventory Pricing',   desc: 'Shared pricing & partner rates' },
    { key: 'finance',         label: 'Finance',                   desc: 'Journals, COA, P&L reports' },
    { key: 'leads',           label: 'Leads / CRM',               desc: 'Customers, leads, loans, tasks' },
    { key: 'employees',       label: 'Employees',                 desc: 'Employee management & HR' },
    { key: 'entities',        label: 'Entities',                  desc: 'Org, Branch, Agencies setup' },
    { key: 'blog',            label: 'Blog',                      desc: 'Blog posts & content' },
    { key: 'forms',           label: 'Forms',                     desc: 'Custom form builder' },
];

const ACTIONS = ['view', 'add', 'update', 'delete'];
const ACTION_COLORS = {
    view:   'bg-blue-100 text-blue-700 border-blue-200',
    add:    'bg-green-100 text-green-700 border-green-200',
    update: 'bg-amber-100 text-amber-700 border-amber-200',
    delete: 'bg-red-100 text-red-700 border-red-200',
};

const emptyPermissions = () =>
    Object.fromEntries(MODULES.map(m => [m.key, { view: false, add: false, update: false, delete: false }]));

// Auto-grant view when any write permission is enabled
const applyAutoView = (perms) => {
    const out = { ...perms };
    for (const mod in out) {
        if (out[mod].add || out[mod].update || out[mod].delete) {
            out[mod] = { ...out[mod], view: true };
        }
    }
    return out;
};

// ─── Pill badge ───────────────────────────────────────────────────────────────
const ActionBadge = ({ action, active }) => (
    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${active ? ACTION_COLORS[action] : 'bg-slate-50 text-slate-300 border-slate-100'}`}>
        {action}
    </span>
);

// ─── Permission row in the matrix ─────────────────────────────────────────────
const PermissionRow = ({ mod, perms, onChange }) => {
    const toggle = (action) => {
        const next = { ...perms, [action]: !perms[action] };
        // auto-grant view
        if (next.add || next.update || next.delete) next.view = true;
        onChange(next);
    };

    return (
        <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
            <td className="py-3 px-4">
                <div className="font-black text-xs text-slate-800">{mod.label}</div>
                <div className="text-[10px] text-slate-400">{mod.desc}</div>
            </td>
            {ACTIONS.map(action => {
                const isView = action === 'view';
                const autoGranted = isView && (perms.add || perms.update || perms.delete);
                return (
                    <td key={action} className="py-3 px-4 text-center">
                        <button
                            type="button"
                            onClick={() => !autoGranted && toggle(action)}
                            title={autoGranted ? 'Auto-granted because a write permission is enabled' : ''}
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

// ─── Modal: Create / Edit group ───────────────────────────────────────────────
const GroupModal = ({ group, onSave, onClose }) => {
    const [name, setName] = useState(group?.name || '');
    const [desc, setDesc] = useState(group?.description || '');
    const [perms, setPerms] = useState(() => {
        const base = emptyPermissions();
        if (group?.permissions) {
            for (const mod in base) {
                if (group.permissions[mod]) base[mod] = { ...base[mod], ...group.permissions[mod] };
            }
        }
        return base;
    });
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');

    const handleSave = async () => {
        if (!name.trim()) { setErr('Group name is required'); return; }
        setSaving(true);
        setErr('');
        const finalPerms = applyAutoView(perms);
        const payload = { name: name.trim(), description: desc.trim(), permissions: finalPerms };
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

    // Select-all / clear-all for a module row
    const setAll = (modKey, value) => {
        const next = { ...perms, [modKey]: { view: value, add: value, update: value, delete: value } };
        setPerms(next);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-4 pb-10 overflow-y-auto">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative z-50 w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-slate-100">
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-slate-100">
                    <div>
                        <h2 className="text-lg font-black text-slate-900">{group ? 'Edit Role Group' : 'Create Role Group'}</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Define which modules and actions this group can perform</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"><X size={18} /></button>
                </div>

                <div className="p-6 space-y-5">
                    {err && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-xs font-bold">
                            <AlertCircle size={14} /> {err}
                        </div>
                    )}

                    {/* Name + Description */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Group Name *</label>
                            <input value={name} onChange={e => setName(e.target.value)}
                                className="w-full mt-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100"
                                placeholder="e.g. CRM Staff, Finance Manager" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</label>
                            <input value={desc} onChange={e => setDesc(e.target.value)}
                                className="w-full mt-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100"
                                placeholder="Optional description" />
                        </div>
                    </div>

                    {/* Permissions matrix */}
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Module Permissions</p>
                        <p className="text-[10px] text-slate-400 mb-3">
                            <Check size={10} className="inline text-green-500 mr-1" />
                            View is auto-granted when any write permission (add / update / delete) is enabled.
                        </p>
                        <div className="rounded-xl border border-slate-200 overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-900 text-slate-300">
                                        <th className="py-2.5 px-4 text-left text-[9px] font-black uppercase tracking-widest">Module</th>
                                        {ACTIONS.map(a => (
                                            <th key={a} className="py-2.5 px-4 text-center text-[9px] font-black uppercase tracking-widest">
                                                <span className={`px-1.5 py-0.5 rounded text-[8px] ${ACTION_COLORS[a]}`}>{a}</span>
                                            </th>
                                        ))}
                                        <th className="py-2.5 px-4 text-center text-[9px] font-black uppercase tracking-widest text-slate-400">All</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {MODULES.map(mod => (
                                        <tr key={mod.key} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                            <td className="py-3 px-4">
                                                <div className="font-black text-xs text-slate-800">{mod.label}</div>
                                                <div className="text-[10px] text-slate-400">{mod.desc}</div>
                                            </td>
                                            {ACTIONS.map(action => {
                                                const autoGranted = action === 'view' && (perms[mod.key].add || perms[mod.key].update || perms[mod.key].delete);
                                                return (
                                                    <td key={action} className="py-3 px-4 text-center">
                                                        <button type="button"
                                                            onClick={() => {
                                                                if (autoGranted) return;
                                                                const next = { ...perms[mod.key], [action]: !perms[mod.key][action] };
                                                                if (next.add || next.update || next.delete) next.view = true;
                                                                setPerms(p => ({ ...p, [mod.key]: next }));
                                                            }}
                                                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center mx-auto transition-all ${
                                                                perms[mod.key][action]
                                                                    ? `${ACTION_COLORS[action]} border-current`
                                                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                                            } ${autoGranted ? 'cursor-default opacity-60' : 'cursor-pointer'}`}
                                                        >
                                                            {perms[mod.key][action] && <Check size={12} strokeWidth={3} />}
                                                        </button>
                                                    </td>
                                                );
                                            })}
                                            {/* Quick all-on / all-off */}
                                            <td className="py-3 px-4 text-center">
                                                <button type="button"
                                                    onClick={() => {
                                                        const allOn = Object.values(perms[mod.key]).every(Boolean);
                                                        setAll(mod.key, !allOn);
                                                    }}
                                                    className="text-[9px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-wider px-2 py-1 rounded hover:bg-blue-50 transition-all">
                                                    {Object.values(perms[mod.key]).every(Boolean) ? 'Clear' : 'All'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-slate-100">
                    <button onClick={onClose} className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all">Cancel</button>
                    <button onClick={handleSave} disabled={saving}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-black text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 flex items-center gap-2">
                        {saving && <Loader2 size={14} className="animate-spin" />}
                        {group ? 'Save Changes' : 'Create Group'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const RolesPermissionsPage = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
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
        setShowModal(false);
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

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Roles & Permissions</h1>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide">
                        Create groups, assign module permissions, then assign a group to each employee
                    </p>
                </div>
                <button
                    onClick={() => { setEditingGroup(null); setShowModal(true); }}
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
                    <button onClick={() => setShowModal(true)}
                        className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-black text-sm hover:bg-blue-700 transition-all">
                        <Plus size={14} /> Create First Group
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {groups.map(group => {
                        const perms = group.permissions || {};
                        const grantedModules = MODULES.filter(m => {
                            const p = perms[m.key] || {};
                            return p.view || p.add || p.update || p.delete;
                        });
                        return (
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
                                        <button onClick={() => { setEditingGroup(group); setShowModal(true); }}
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
                                {grantedModules.length > 0 ? (
                                    <div className="mt-4 pt-4 border-t border-slate-50">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Granted Access</p>
                                        <div className="flex flex-wrap gap-2">
                                            {grantedModules.map(m => {
                                                const p = perms[m.key] || {};
                                                const actions = ACTIONS.filter(a => p[a]);
                                                return (
                                                    <div key={m.key} className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5">
                                                        <span className="text-[10px] font-black text-slate-700">{m.label}</span>
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
                                ) : (
                                    <p className="mt-3 text-xs text-slate-400">No permissions assigned yet.</p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {showModal && (
                <GroupModal
                    group={editingGroup}
                    onSave={handleSave}
                    onClose={() => { setShowModal(false); setEditingGroup(null); }}
                />
            )}
        </div>
    );
};

export default RolesPermissionsPage;
