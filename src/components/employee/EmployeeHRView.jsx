import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Clock, Calendar, FileText, DollarSign, MapPin, AlertCircle, CheckCircle2, LogIn, LogOut, X } from 'lucide-react';

const API = 'http://localhost:8000/api';

function fmt(iso) {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true }); }
    catch { return '—'; }
}
function fmtDate(iso) {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return '—'; }
}

const STATUS_COLORS = {
    on_time: 'bg-green-100 text-green-700',
    grace: 'bg-yellow-100 text-yellow-700',
    late: 'bg-orange-100 text-orange-700',
    half_day: 'bg-amber-100 text-amber-700',
    absent: 'bg-red-100 text-red-700',
    present: 'bg-green-100 text-green-700',
};

// ── Custom Toast ───────────────────────────────────────────
function Toast({ toasts, remove }) {
    return (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
            {toasts.map(t => (
                <div key={t.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 16px',
                    borderRadius: 12,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    background: t.type === 'success' ? '#f0fdf4' : t.type === 'warn' ? '#fffbeb' : '#fef2f2',
                    border: `1px solid ${t.type === 'success' ? '#bbf7d0' : t.type === 'warn' ? '#fde68a' : '#fecaca'}`,
                    color: t.type === 'success' ? '#15803d' : t.type === 'warn' ? '#92400e' : '#dc2626',
                    fontSize: 13, fontWeight: 600, minWidth: 260, maxWidth: 360,
                    animation: 'slideInRight 0.25s ease',
                }}>
                    <span style={{ flex: 1 }}>{t.text}</span>
                    <button onClick={() => remove(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, padding: 2 }}>
                        <X size={14} />
                    </button>
                </div>
            ))}
            <style>{`@keyframes slideInRight { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }`}</style>
        </div>
    );
}

function useToast() {
    const [toasts, setToasts] = useState([]);
    const timerRef = useRef({});

    const addToast = useCallback((text, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, text, type }]);
        timerRef.current[id] = setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    }, []);

    const remove = useCallback((id) => {
        clearTimeout(timerRef.current[id]);
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return { toasts, addToast, remove };
}
// ──────────────────────────────────────────────────────────

export default function EmployeeHRView() {
    const [activeTab, setActiveTab] = useState('attendance');
    const [loading, setLoading] = useState(true);
    const [myAttendance, setMyAttendance] = useState([]);
    const [myMovements, setMyMovements] = useState([]);
    const [myLeaves, setMyLeaves] = useState([]);
    const [mySalaries, setMySalaries] = useState([]);

    // Attendance check-in/out state
    const [todayRecord, setTodayRecord] = useState(null);
    const [checking, setChecking] = useState(false);
    const [earlyReason, setEarlyReason] = useState('');
    const [needsReason, setNeedsReason] = useState(false);

    const { toasts, addToast, remove: removeToast } = useToast();

    const employeeData = JSON.parse(localStorage.getItem('employee_data') || '{}');
    const empId = employeeData.emp_id;
    const token = localStorage.getItem('access_token');
    const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    const loadAttendance = useCallback(async () => {
        setLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            // Fetch today's status — try with just emp_id (no org filter needed)
            const res = await fetch(
                `${API}/hr/attendance?emp_id=${empId}&start_date=${today}&end_date=${today}`,
                { headers: authHeaders }
            );
            if (res.ok) {
                const data = await res.json();
                // data may be filtered by org — if empty but they're actually checked in,
                // we handle that in handleCheckIn's error path
                if (data.length > 0) setTodayRecord(data[0]);
            }
            // Last 7 days for the history list
            const past = new Date(); past.setDate(past.getDate() - 6);
            const pastStr = past.toISOString().split('T')[0];
            const res2 = await fetch(
                `${API}/hr/attendance?emp_id=${empId}&start_date=${pastStr}&end_date=${today}`,
                { headers: authHeaders }
            );
            if (res2.ok) setMyAttendance(await res2.json());
        } catch (e) { console.error(e); }
        setLoading(false);
    }, [empId, token]);

    useEffect(() => { loadAttendance(); }, [loadAttendance]);

    const tabs = [
        { id: 'attendance', label: 'My Attendance', icon: Clock },
        { id: 'movements', label: 'Movements', icon: MapPin },
        { id: 'leaves', label: 'Leave Requests', icon: FileText },
        { id: 'salaries', label: 'Salary & Payments', icon: DollarSign }
    ];

    const handleCheckIn = async () => {
        if (!empId) { addToast('Employee ID not found. Please re-login.', 'error'); return; }
        setChecking(true);
        try {
            const res = await fetch(`${API}/hr/attendance/check-in`, {
                method: 'POST', headers: authHeaders,
                body: JSON.stringify({ emp_id: empId })
            });
            const data = await res.json();
            if (res.ok) {
                setTodayRecord(data);
                setMyAttendance(prev => {
                    const today = new Date().toISOString().split('T')[0];
                    return [data, ...prev.filter(r => r.date !== today)];
                });
                addToast(`✓ Checked in at ${fmt(data.check_in)}`, 'success');
            } else if (res.status === 400 && data.detail?.toLowerCase().includes('already checked in')) {
                // Employee is already checked in but todayRecord was null (org_id mismatch in fetch)
                // Flip the UI to show Check Out, and inform the user
                const todayStr = new Date().toISOString().split('T')[0];
                setTodayRecord(prev => prev ?? { check_in: new Date().toISOString(), check_out: null, date: todayStr });
                addToast('You are already checked in. Use the Check Out button when done.', 'warn');
            } else {
                addToast(data.detail || 'Check-in failed', 'error');
            }
        } catch { addToast('Network error. Try again.', 'error'); }
        setChecking(false);
    };

    const handleCheckOut = async (reason = '') => {
        if (!empId) { addToast('Employee ID not found. Please re-login.', 'error'); return; }
        setChecking(true);
        try {
            const body = { emp_id: empId };
            if (reason.trim()) body.reason = reason.trim();
            const res = await fetch(`${API}/hr/attendance/check-out`, {
                method: 'POST', headers: authHeaders,
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (res.status === 202) {
                if (data.status === 'approval_required') {
                    setNeedsReason(true);
                    addToast(`Early checkout by ${data.minutes_early} min — please provide a reason below.`, 'warn');
                } else if (data.status === 'approval_pending') {
                    addToast('Early checkout request is pending manager approval.', 'warn');
                }
            } else if (res.ok) {
                setTodayRecord(data);
                setMyAttendance(prev => {
                    const today = new Date().toISOString().split('T')[0];
                    const filtered = prev.filter(r => r.date !== today);
                    return [data, ...filtered];
                });
                setNeedsReason(false); setEarlyReason('');
                addToast(`✓ Checked out at ${fmt(data.check_out)} · ${data.working_hours?.toFixed(1)}h worked`, 'success');
            } else {
                addToast(data.detail || 'Check-out failed', 'error');
            }
        } catch { addToast('Network error. Try again.', 'error'); }
        setChecking(false);
    };

    const renderAttendance = () => {
        const checkedIn = !!todayRecord?.check_in;
        const checkedOut = !!todayRecord?.check_out;
        const statusCls = STATUS_COLORS[todayRecord?.status] || 'bg-slate-100 text-slate-600';

        return (
            <div className="space-y-5">
                {/* ── Today Card ── */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white">
                            <Calendar size={16} />
                            <span className="text-sm font-bold">Today — {fmtDate(new Date().toISOString())}</span>
                        </div>
                        {todayRecord?.status && (
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${statusCls}`}>
                                {todayRecord.status.replace('_', ' ')}
                            </span>
                        )}
                    </div>

                    <div className="px-5 py-4">
                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="text-center">
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Check In</div>
                                <div className="text-lg font-black text-slate-800">{fmt(todayRecord?.check_in)}</div>
                            </div>
                            <div className="text-center border-x border-slate-100">
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Check Out</div>
                                <div className="text-lg font-black text-slate-800">{fmt(todayRecord?.check_out)}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Hours</div>
                                <div className="text-lg font-black text-slate-800">
                                    {todayRecord?.working_hours != null ? `${todayRecord.working_hours.toFixed(1)}h` : '—'}
                                </div>
                            </div>
                        </div>

                        {/* Message */}
                        {checkMsg.text && (
                            <div className={`text-xs font-semibold px-3 py-2 rounded-lg mb-3 ${checkMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
                                checkMsg.type === 'warn' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                    'bg-red-50 text-red-600 border border-red-200'
                                }`}>{checkMsg.text}</div>
                        )}

                        {/* Early checkout reason input */}
                        {needsReason && !checkedOut && (
                            <div className="flex gap-2 mb-3">
                                <input
                                    value={earlyReason}
                                    onChange={e => setEarlyReason(e.target.value)}
                                    placeholder="Reason for early checkout…"
                                    className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-blue-500"
                                />
                                <button
                                    onClick={() => handleCheckOut(earlyReason)}
                                    disabled={!earlyReason.trim() || checking}
                                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg disabled:opacity-50 transition-colors"
                                >{checking ? 'Submitting…' : 'Submit'}</button>
                            </div>
                        )}

                        {/* Check In / Check Out button */}
                        {!checkedOut && (
                            <button
                                onClick={checkedIn ? () => handleCheckOut() : handleCheckIn}
                                disabled={checking || !empId}
                                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${checkedIn
                                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-200'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {checking ? (
                                    <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Processing…</>
                                ) : checkedIn ? (
                                    <><LogOut size={16} /> Check Out</>
                                ) : (
                                    <><LogIn size={16} /> Check In</>
                                )}
                            </button>
                        )}

                        {checkedOut && (
                            <div className="flex items-center justify-center gap-2 py-3 bg-green-50 rounded-xl border border-green-200">
                                <CheckCircle2 size={18} className="text-green-600" />
                                <span className="text-sm font-bold text-green-700">Attendance marked for today</span>
                            </div>
                        )}

                        {!empId && (
                            <p className="text-xs text-center text-red-500 mt-2">Employee ID missing — please contact HR or re-login.</p>
                        )}
                    </div>
                </div>

                {/* ── Recent records ── */}
                <div>
                    <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Last 7 Days</div>
                    {myAttendance.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">
                            <Clock size={40} className="mx-auto mb-2 opacity-40" />
                            <p className="text-sm font-semibold">No records yet</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {[...myAttendance].sort((a, b) => b.date?.localeCompare(a.date)).map((rec, idx) => (
                                <div key={idx} className="bg-white border border-slate-100 rounded-xl px-4 py-3 flex items-center gap-4 shadow-sm">
                                    <div className="w-10 text-center">
                                        <div className="text-[10px] font-black uppercase text-slate-400">{new Date(rec.date).toLocaleDateString('en-PK', { weekday: 'short' })}</div>
                                        <div className="text-sm font-black text-slate-700">{new Date(rec.date).getDate()}</div>
                                    </div>
                                    <div className="flex-1 grid grid-cols-3 gap-2 text-xs">
                                        <div><span className="text-slate-400 block text-[9px] uppercase font-bold">In</span><span className="font-bold text-slate-700">{fmt(rec.check_in)}</span></div>
                                        <div><span className="text-slate-400 block text-[9px] uppercase font-bold">Out</span><span className="font-bold text-slate-700">{fmt(rec.check_out)}</span></div>
                                        <div><span className="text-slate-400 block text-[9px] uppercase font-bold">Hours</span><span className="font-bold text-slate-700">{rec.working_hours != null ? `${rec.working_hours.toFixed(1)}h` : '—'}</span></div>
                                    </div>
                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${STATUS_COLORS[rec.status] || 'bg-slate-100 text-slate-500'}`}>
                                        {(rec.status || 'unknown').replace('_', ' ')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderMovements = () => (
        <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="text-blue-600 mt-0.5" size={20} />
                <div>
                    <p className="text-sm font-semibold text-blue-900">Movement Tracking Coming Soon</p>
                    <p className="text-xs text-blue-700 mt-1">Track your movements and field visits here.</p>
                </div>
            </div>

            {myMovements.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                    <MapPin size={48} className="mx-auto mb-3 opacity-50" />
                    <p className="text-sm font-semibold">No Movement Records</p>
                    <p className="text-xs mt-1">Your movement history will appear here</p>
                </div>
            ) : null}
        </div>
    );

    const renderLeaves = () => (
        <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="text-blue-600 mt-0.5" size={20} />
                <div>
                    <p className="text-sm font-semibold text-blue-900">Leave Management Coming Soon</p>
                    <p className="text-xs text-blue-700 mt-1">Submit leave requests and track their status here.</p>
                </div>
            </div>

            {myLeaves.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                    <FileText size={48} className="mx-auto mb-3 opacity-50" />
                    <p className="text-sm font-semibold">No Leave Requests</p>
                    <p className="text-xs mt-1">Your leave requests will appear here</p>
                </div>
            ) : null}
        </div>
    );

    const renderSalaries = () => (
        <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="text-blue-600 mt-0.5" size={20} />
                <div>
                    <p className="text-sm font-semibold text-blue-900">Salary Information Coming Soon</p>
                    <p className="text-xs text-blue-700 mt-1">View your salary slips and payment history here.</p>
                </div>
            </div>

            {mySalaries.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                    <DollarSign size={48} className="mx-auto mb-3 opacity-50" />
                    <p className="text-sm font-semibold">No Salary Records</p>
                    <p className="text-xs mt-1">Your salary and payment records will appear here</p>
                </div>
            ) : null}
        </div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'attendance': return renderAttendance();
            case 'movements': return renderMovements();
            case 'leaves': return renderLeaves();
            case 'salaries': return renderSalaries();
            default: return renderAttendance();
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Toast notifications */}
            <Toast toasts={toasts} remove={removeToast} />

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800">My HR Information</h1>
                <p className="text-sm text-slate-500 mt-1">View your attendance, movements, leaves, and salary information</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-slate-200">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === tab.id
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                                }`}
                        >
                            <Icon size={16} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <div className="bg-slate-50 rounded-lg p-6">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-sm text-slate-500 mt-4">Loading...</p>
                    </div>
                ) : (
                    renderContent()
                )}
            </div>
        </div>
    );
}
