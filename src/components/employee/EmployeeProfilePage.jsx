import React, { useState, useEffect } from 'react';
import {
    User, Mail, Phone, Shield, Key, Calendar, CheckCircle,
    XCircle, Building2, Hash, Layers, Lock, Tag, ChevronLeft,
    RefreshCw, Eye, EyeOff
} from 'lucide-react';

const API = 'http://localhost:8000/api';

const Field = ({ icon: Icon, label, value, mono = false, muted = false }) => (
    <div className="flex items-center gap-2 py-1.5 border-b border-slate-50 last:border-0 pl-1">
        <div className="w-5 h-5 rounded bg-slate-50 flex items-center justify-center flex-shrink-0">
            <Icon size={10} className="text-slate-400" />
        </div>
        <div className="w-24 flex-shrink-0 text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</div>
        <div className={`flex-1 min-w-0 text-xs font-bold truncate ${muted ? 'text-slate-300' : 'text-slate-800'} ${mono ? 'font-mono' : ''}`}>
            {value ?? '—'}
        </div>
    </div>
);


const StatusChip = ({ active, label }) => (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider 
        ${active ? 'bg-green-100/20 text-green-300' : 'bg-red-100/20 text-red-300'}`}>
        {active ? <CheckCircle size={8} /> : <XCircle size={8} />}
        {label}
    </span>
);


const Section = ({ title, children, className = "" }) => (
    <div className={`bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col ${className}`}>
        <div className="px-4 py-2 bg-slate-50/50 border-b border-slate-100">
            <div className="text-[9px] font-black uppercase tracking-widest text-blue-600">{title}</div>
        </div>
        <div className="px-3 py-1 flex-1">{children}</div>
    </div>
);


export default function EmployeeProfilePage({ onBack }) {
    const [emp, setEmp] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [savingPassword, setSavingPassword] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

    const loadProfile = async () => {
        setLoading(true);
        try {
            // Try fetching fresh data from backend
            const t = localStorage.getItem('access_token');
            const stored = (() => {
                try { return JSON.parse(localStorage.getItem('employee_data') || '{}'); } catch { return {}; }
            })();

            const id = stored._id || stored.id;
            if (id && t) {
                const res = await fetch(`${API}/employees/${id}`, {
                    headers: { Authorization: `Bearer ${t}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setEmp(data);
                    setLoading(false);
                    return;
                }
            }
            // Fallback to stored data
            setEmp(stored);
        } catch (e) {
            const stored = (() => {
                try { return JSON.parse(localStorage.getItem('employee_data') || '{}'); } catch { return {}; }
            })();
            setEmp(stored);
        }
        setLoading(false);
    };

    useEffect(() => { loadProfile(); }, []);

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPasswordMessage({ type: '', text: '' });

        if (newPassword.length < 6) {
            setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }

        setSavingPassword(true);
        try {
            const t = localStorage.getItem('access_token');
            const id = emp?._id || emp?.id;

            if (!id || !t) throw new Error('Authentication missing');

            const res = await fetch(`${API}/employees/${id}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${t}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password: newPassword })
            });

            if (res.ok) {
                setPasswordMessage({ type: 'success', text: 'Password changed successfully' });
                setNewPassword('');
                setTimeout(() => {
                    setShowPasswordForm(false);
                    setPasswordMessage({ type: '', text: '' });
                }, 2000);
            } else {
                const err = await res.json();
                setPasswordMessage({ type: 'error', text: err.detail || 'Failed to update password' });
            }
        } catch (error) {
            setPasswordMessage({ type: 'error', text: 'Error connecting to server' });
        }
        setSavingPassword(false);
    };

    const fmtDate = (iso) => {

        try { return new Date(iso).toLocaleString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }); }
        catch { return iso || '—'; }
    };

    const initials = (emp?.full_name || emp?.name || emp?.email || 'E').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="w-full h-full max-h-[calc(100vh-4rem)] flex flex-col pt-2 pb-6 px-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-3 shrink-0">
                <button onClick={onBack}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
                    <ChevronLeft size={16} />
                </button>
                <h1 className="text-base font-black text-slate-800">My Profile</h1>
                <button onClick={loadProfile}
                    className="ml-auto p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    title="Refresh">
                    <RefreshCw size={14} />
                </button>
            </div>

            <div className="flex-1 min-h-0 flex flex-col gap-3">
                {/* Identity Card (Compact) */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-4 text-white shadow-md shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-xl font-black text-white shadow-inner border border-white/30 shrink-0">
                                {initials}
                            </div>
                            <div>
                                <div className="text-lg font-black leading-none mb-1">{emp?.full_name || emp?.name || '—'}</div>
                                <div className="text-blue-200 text-xs font-bold leading-none">{emp?.email || emp?.username || '—'}</div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                            <div className="flex items-center gap-2">
                                <span className="bg-white/20 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded tracking-wider">
                                    {(emp?.role || 'employee').replace(/_/g, ' ')}
                                </span>
                            </div>

                            <div className="flex gap-2 text-[8px]">
                                <StatusChip active={emp?.is_active} label={emp?.is_active ? 'Active' : 'Inactive'} />
                                <StatusChip active={emp?.portal_access_enabled} label={emp?.portal_access_enabled ? 'Portal Access' : 'No Portal'} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Grid Layout for Sections to utilize horizontal space and avoid scroll */}
                <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
                    <div className="flex flex-col gap-3 min-h-0">
                        {/* Contact & Identity */}
                        <Section title="Contact & Identity">
                            <Field icon={User} label="Full Name" value={emp?.full_name || emp?.name} />
                            <Field icon={Mail} label="Email" value={emp?.email} />
                            <Field icon={Phone} label="Phone" value={emp?.phone} />
                            <Field icon={User} label="Username" value={emp?.username} />
                        </Section>

                        {/* System IDs */}
                        <Section title="System Identifiers" className="flex-1">
                            <Field icon={Hash} label="Employee ID" value={emp?.emp_id} mono />
                            <Field icon={Key} label="Record ID" value={emp?._id || emp?.id} mono />
                            <Field icon={Building2} label="Entity Type" value={emp?.entity_type} />
                            <Field icon={Layers} label="Entity ID" value={emp?.entity_id} mono />
                        </Section>
                    </div>

                    <div className="flex flex-col gap-3 min-h-0">
                        {/* Permissions */}
                        <Section title="Access & Permissions" className="flex-1">
                            <div className="py-2">
                                <div className="flex flex-wrap gap-1.5">
                                    {(emp?.permissions || []).length === 0
                                        ? <span className="text-xs text-slate-400 font-bold">No permissions assigned</span>
                                        : (emp?.permissions || []).map((p, i) => (
                                            <span key={i} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-[10px] font-black uppercase px-2 py-1 rounded tracking-wider border border-blue-100">
                                                <Shield size={10} />
                                                {p}
                                            </span>
                                        ))
                                    }
                                </div>
                            </div>
                        </Section>

                        {/* Security & Password */}
                        <Section title="Security">
                            <div className="py-1">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-1.5">
                                        <Lock size={10} className="text-slate-400" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Authentication</span>
                                    </div>
                                    <button onClick={() => {
                                        setShowPasswordForm(f => !f);
                                        setPasswordMessage({ type: '', text: '' });
                                    }}
                                        className="flex items-center gap-1 text-[8px] font-black uppercase text-blue-600 hover:text-blue-700 px-1.5 py-0.5 rounded hover:bg-blue-50 transition-all">
                                        {showPasswordForm ? <XCircle size={10} /> : <Key size={10} />}
                                        {showPasswordForm ? 'Cancel' : 'Change Password'}
                                    </button>
                                </div>

                                {showPasswordForm ? (
                                    <form onSubmit={handlePasswordChange} className="mt-2 flex flex-col gap-1.5">
                                        <div className="flex gap-1.5">
                                            <input
                                                type="text"
                                                placeholder="Enter new password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="flex-1 text-xs px-2 py-1.5 rounded-lg border border-slate-200 outline-none focus:border-blue-500 font-mono"
                                                autoFocus
                                            />
                                            <button
                                                type="submit"
                                                disabled={savingPassword || !newPassword}
                                                className="px-3 py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                            >
                                                {savingPassword ? 'Saving...' : 'Save'}
                                            </button>
                                        </div>
                                        {passwordMessage.text && (
                                            <div className={`text-[9px] font-bold pl-1 ${passwordMessage.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>
                                                {passwordMessage.text}
                                            </div>
                                        )}
                                    </form>
                                ) : (
                                    <div className="h-6 flex items-center">
                                        <div className="text-[10px] text-slate-300 font-bold tracking-widest mt-1 group relative cursor-help">
                                            ••••••••••••••••••••••••
                                            <div className="absolute top-full left-0 hidden group-hover:block px-2 py-1 bg-slate-800 text-white text-[9px] rounded mt-1 z-10 w-max whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                                                Hash hidden for security
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Section>


                        {/* Timestamps - moved to bottom of right column to save horizontal space */}
                        <div className="flex gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                            <div className="flex-1">
                                <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                                    <Calendar size={10} /> Created At
                                </div>
                                <div className="text-[10px] font-bold text-slate-700">{fmtDate(emp?.created_at)}</div>
                            </div>
                            <div className="flex-1 border-l border-slate-200 pl-3">
                                <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                                    <Calendar size={10} /> Updated At
                                </div>
                                <div className="text-[10px] font-bold text-slate-700">{fmtDate(emp?.updated_at)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
