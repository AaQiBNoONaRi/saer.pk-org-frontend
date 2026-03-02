import React, { useState, useEffect, useMemo } from 'react';
import {
    Users, Calendar, MapPin, DollarSign, BarChart2, LayoutDashboard,
    CheckSquare, CreditCard, Search, Filter, ChevronDown,
    Clock, CheckCircle, XCircle, AlertCircle, TrendingUp,
    ArrowUpRight, ArrowDownRight, Award, Star, Plus, X,
    Edit, Save, Download, Play, Pause, FileText, Briefcase,
    MoreVertical, Eye, User, Building, BookOpen, BadgeDollarSign,
    PersonStanding, RefreshCw, ArrowLeft, AlarmClock, ClipboardList, ClipboardSignature
} from 'lucide-react';
import * as hrService from '../../services/hrService';
import { getModulePermissions } from '../../utils/permissions';

// ─── Helpers ──────────────────────────────────────────────────────────────
const statusBadge = (s, map) => {
    const { label, cls } = map[s] || { label: s, cls: 'bg-slate-100 text-slate-600' };
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${cls}`}>{label}</span>;
};

const ATTEND_STATUS_MAP = {
    on_time: { label: 'On Time', cls: 'bg-green-100 text-green-700' },
    grace: { label: 'Grace', cls: 'bg-yellow-100 text-yellow-700' },
    late: { label: 'Late', cls: 'bg-orange-100 text-orange-700' },
    absent: { label: 'Absent', cls: 'bg-red-100 text-red-700' },
    present: { label: 'Present', cls: 'bg-blue-100 text-blue-700' },
    half_day: { label: 'Half Day', cls: 'bg-purple-100 text-purple-700' },
};
const MOVE_STATUS_MAP = {
    active: { label: 'Active', cls: 'bg-blue-100 text-blue-700' },
    completed: { label: 'Completed', cls: 'bg-green-100 text-green-700' },
    cancelled: { label: 'Cancelled', cls: 'bg-red-100 text-red-700' }
};
const LEAVE_STATUS_MAP = {
    approved: { label: 'Approved', cls: 'bg-green-100 text-green-700' },
    pending: { label: 'Pending', cls: 'bg-yellow-100 text-yellow-700' },
    rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-700' }
};
const PAY_STATUS_MAP = {
    paid: { label: 'Paid', cls: 'bg-green-100 text-green-700' },
    pending: { label: 'Pending', cls: 'bg-yellow-100 text-yellow-700' },
    cancelled: { label: 'Cancelled', cls: 'bg-red-100 text-red-700' }
};

const pkr = n => `PKR ${n?.toLocaleString() || 0}`;
const formatDate = (d) => {
    if (!d) return '—';
    if (typeof d === 'string') d = new Date(d);
    return d.toLocaleDateString('en-PK');
};
const formatTime = (t) => {
    if (!t) return '—';
    if (typeof t === 'string') t = new Date(t);
    return t.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
};
const formatDateTime = (dt) => {
    if (!dt) return '—';
    return `${formatDate(dt)} ${formatTime(dt)}`;
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const Stat = ({ label, value, icon: Icon, color }) => (
    <div className={`rounded-2xl p-5 border ${color} flex items-center gap-4`}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/60 shrink-0">
            <Icon size={18} />
        </div>
        <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{label}</p>
            <p className="text-xl font-black">{value}</p>
        </div>
    </div>
);

// ─── Dashboard Stat Card ──────────────────────────────────────────────────────
const StatCard = ({ title, value, subtitle, icon: Icon, iconColor, valueColor, borderColor = 'border-slate-200' }) => (
    <div className={`bg-white rounded-2xl p-5 border ${borderColor} shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full`}>
        <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-bold text-slate-600">{title}</p>
            {Icon && <Icon size={20} className={iconColor} strokeWidth={2.5} />}
        </div>
        <div>
            <h3 className={`text-3xl font-black ${valueColor || 'text-slate-800'}`}>{value}</h3>
            <p className={`text-[11px] font-medium mt-1 ${valueColor ? valueColor : 'text-slate-400'}`}>{subtitle}</p>
        </div>
    </div>
);

// ─── Toolbar ──────────────────────────────────────────────────────────────────
const Toolbar = ({ search, setSearch, placeholder = 'Search…', children }) => (
    <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
                type="text"
                placeholder={placeholder}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-100"
            />
        </div>
        {children}
    </div>
);

const Select = ({ value, onChange, label, options }) => {
    return (
        <div className="relative">
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="appearance-none px-4 pr-10 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black text-slate-600 cursor-pointer outline-none focus:ring-2 focus:ring-blue-100"
            >
                <option value="">{label}</option>
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
    );
};

// ─── Table Components ─────────────────────────────────────────────────────────
const Table = ({ cols, children }) => (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        {cols.map((c, i) => (
                            <th key={i} className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-widest text-slate-500">
                                {c}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {children}
                </tbody>
            </table>
        </div>
    </div>
);
const Td = ({ children, className = '' }) => (
    <td className={`px-5 py-4 ${className}`}>{children}</td>
);

// ─── Modal Component ──────────────────────────────────────────────────────────
const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
        xl: 'max-w-6xl'
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
            <div className={`bg-white rounded-2xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden flex flex-col`} onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <h3 className="text-xl font-black text-slate-800">{title}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HRManagementView() {
    const [activeTab, setActiveTab] = useState('dashboard');

    // Permission flags
    const empPerms = getModulePermissions('hr.employees');
    const attendPerms = getModulePermissions('hr.attendance');
    const movPerms = getModulePermissions('hr.movements');
    const commPerms = getModulePermissions('hr.commissions');
    const punctPerms = getModulePermissions('hr.punctuality');
    const approvPerms = getModulePermissions('hr.approvals');
    const payPerms = getModulePermissions('hr.payments');
    const dashPerms = getModulePermissions('hr.dashboard');

    const hasFlag = (p) => Object.values(p || {}).some(Boolean);
    const canSeeEmployees = hasFlag(empPerms);
    const canSeeAttendance = hasFlag(attendPerms);
    const canSeeMovements = hasFlag(movPerms);
    const canSeeCommissions = hasFlag(commPerms);
    const canSeePunctuality = hasFlag(punctPerms);
    const canSeeApprovals = hasFlag(approvPerms);
    const canSeePayments = hasFlag(payPerms);
    const canAttendanceAdd = !!attendPerms?.add;
    const canMovementsAdd = !!movPerms?.add;

    const ALL_TABS = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, visible: true },
        { id: 'employees', label: 'Employees', icon: Users, visible: canSeeEmployees },
        { id: 'attendance', label: 'Attendance', icon: Calendar, visible: canSeeAttendance },
        { id: 'movements', label: 'Movements', icon: MapPin, visible: canSeeMovements },
        { id: 'approvals', label: 'Approvals', icon: CheckSquare, visible: canSeeApprovals },
        { id: 'punctuality', label: 'Punctuality', icon: BarChart2, visible: canSeePunctuality },
        { id: 'payments', label: 'Payments', icon: DollarSign, visible: canSeePayments },
    ];
    const visibleTabs = ALL_TABS.filter(t => t.visible);

    useEffect(() => {
        // Listen for navigation events from quick actions
        const handleNavigate = (event) => {
            setActiveTab(event.detail);
        };
        window.addEventListener('navigate-hr-tab', handleNavigate);
        return () => window.removeEventListener('navigate-hr-tab', handleNavigate);
    }, []);


    return (
        <div className="h-full flex flex-col bg-slate-50">
            {/* Header Tabs */}
            <div className="bg-white border-b border-slate-200 px-8 pt-6 shrink-0">
                <div className="flex items-center gap-1">
                    {visibleTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 pb-3 px-4 border-b-2 transition-all ${activeTab === tab.id
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <tab.icon size={18} />
                            <span className="font-black text-xs uppercase tracking-wider">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8">
                {activeTab === 'dashboard' && <DashboardTab />}
                {activeTab === 'employees' && <EmployeesTab canAttendanceAdd={canAttendanceAdd} />}
                {activeTab === 'attendance' && <AttendanceTab />}
                {activeTab === 'movements' && <MovementsTab canMovementsAdd={canMovementsAdd} />}
                {activeTab === 'approvals' && <ApprovalsTab />}
                {activeTab === 'punctuality' && <PunctualityTab />}
                {activeTab === 'payments' && <PaymentsTab />}
            </div>
        </div>
    );
}

// ① Dashboard ────────────────────────────────────────────────────────────────
function DashboardTab() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardStats();
    }, []);

    const loadDashboardStats = async () => {
        try {
            setLoading(true);
            const data = await hrService.getDashboardStats();
            setStats(data);
        } catch (error) {
            console.error('Failed to load dashboard stats:', error);
            alert('Failed to load dashboard: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-center py-12">Loading...</div>;
    if (!stats) return <div className="text-center py-12">Failed to load dashboard</div>;

    const attendancePercent = stats.total_employees > 0
        ? Math.round((stats.present_today / stats.total_employees) * 100)
        : 0;

    return (
        <section className="space-y-6">
            <h2 className="text-2xl font-black text-slate-800">HR Dashboard</h2>

            {/* Row 1: Main Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Employees"
                    value={stats.total_employees}
                    subtitle="Active workforce"
                    icon={Users}
                    iconColor="text-indigo-600 bg-indigo-50 p-1.5 rounded-lg"
                    valueColor="text-slate-800"
                />
                <StatCard
                    title="Present Today"
                    value={stats.present_today}
                    subtitle={`${attendancePercent}% attendance`}
                    icon={CheckSquare}
                    iconColor="text-emerald-500 bg-emerald-50 p-1.5 rounded-lg"
                    valueColor="text-slate-800"
                />
                <StatCard
                    title="Late Today"
                    value={stats.late_today}
                    subtitle="After grace period"
                    icon={AlertCircle}
                    iconColor="text-amber-500 bg-amber-50 p-1.5 rounded-lg"
                    valueColor="text-amber-500"
                    borderColor="border-amber-400"
                />
                <StatCard
                    title="Absent Today"
                    value={stats.absent_today}
                    subtitle="No check-in"
                    icon={XCircle}
                    iconColor="text-rose-500 bg-rose-50 p-1.5 rounded-lg"
                    valueColor="text-rose-500"
                    borderColor="border-rose-400"
                />
            </div>

            {/* Row 2: Financial & Movements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Salaries Paid (Month)"
                    value={pkr(stats.salaries_paid_this_month)}
                    subtitle="Successfully processed"
                    icon={BadgeDollarSign}
                    iconColor="text-amber-600 bg-amber-50 p-1.5 rounded-lg"
                    valueColor="text-emerald-500"
                />
                <StatCard
                    title="Pending Salaries"
                    value={pkr(stats.pending_salaries)}
                    subtitle="Due this month"
                    icon={Clock}
                    iconColor="text-slate-400 bg-slate-100 p-1.5 rounded-lg"
                    valueColor="text-amber-500"
                />
                <StatCard
                    title="Total Commissions"
                    value={pkr(stats.total_commissions_this_month || 0)}
                    subtitle="This month"
                    icon={BadgeDollarSign}
                    iconColor="text-emerald-500 bg-emerald-50 p-1.5 rounded-lg"
                    valueColor="text-cyan-500"
                />
                <StatCard
                    title="Total Movements"
                    value={stats.total_movements_today || 0}
                    subtitle="Today"
                    icon={PersonStanding}
                    iconColor="text-rose-500 bg-rose-50 p-1.5 rounded-lg"
                    valueColor="text-slate-800"
                />
            </div>

            {/* Row 3: Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <StatCard
                    title="Avg Check-in Time"
                    value={stats.avg_checkin_time || '--:--'}
                    subtitle="Company wide average"
                    icon={AlarmClock}
                    iconColor="text-rose-400 bg-rose-50 p-1.5 rounded-lg"
                />
                <StatCard
                    title="Pending Approvals"
                    value={stats.pending_leave_requests}
                    subtitle="Requires attention"
                    icon={ClipboardList}
                    iconColor="text-amber-600 bg-amber-50 p-1.5 rounded-lg"
                    valueColor="text-blue-500"
                    borderColor="border-blue-400"
                />

                {/* Punctuality Score Card */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-xs font-bold text-slate-600 mb-4">Punctuality Score</p>
                    <div className="w-full bg-slate-100 rounded-full h-6 mb-2 relative overflow-hidden">
                        <div
                            className="bg-emerald-600 h-6 rounded-full flex items-center justify-center transition-all duration-500"
                            style={{ width: `${stats.punctuality_score || 0}%` }}
                        >
                            <span className="text-[10px] font-bold text-white tracking-widest">
                                {stats.punctuality_score || 0}%
                            </span>
                        </div>
                    </div>
                    <p className="text-[11px] font-medium text-slate-400 mt-2">Overall company punctuality</p>
                </div>
            </div>

            {/* Row 4: Complex Areas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pb-8">

                {/* Recent Activity (Spans 2 columns) */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col min-h-[300px]">
                    <p className="text-xs font-bold text-slate-600 mb-4">Recent Activity</p>

                    {stats.recent_activities && stats.recent_activities.length > 0 ? (
                        <div className="flex-1 flex flex-col gap-3">
                            {stats.recent_activities.map((activity, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                                    <div className={`p-2 rounded-lg ${activity.type === 'attendance' ? 'bg-blue-50 text-blue-600' :
                                        activity.type === 'movement' ? 'bg-purple-50 text-purple-600' :
                                            'bg-amber-50 text-amber-600'
                                        }`}>
                                        {activity.type === 'attendance' ? <Calendar size={16} /> :
                                            activity.type === 'movement' ? <PersonStanding size={16} /> :
                                                <ClipboardList size={16} />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-slate-800">{activity.emp_name || activity.emp_id}</p>
                                        <p className="text-[11px] text-slate-500 font-medium">{activity.action}</p>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400">
                                        {activity.time ? new Date(activity.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                            <div className="bg-amber-50 p-3 rounded-full mb-3">
                                <ClipboardList size={24} className="text-amber-600/50" />
                            </div>
                            <p className="text-sm font-bold text-slate-700">No recent activity</p>
                            <p className="text-[11px] font-medium text-slate-400 mt-1">Check-ins, movements, and approvals will appear here</p>
                        </div>
                    )}
                </div>

                {/* Right Side Column (Notifications & Quick Actions) */}
                <div className="flex flex-col gap-4">

                    {/* Notifications */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex-1">
                        <p className="text-xs font-bold text-slate-600 mb-4">Approval Notifications</p>

                        {stats.approval_notifications && stats.approval_notifications.length > 0 ? (
                            <div className="space-y-3">
                                {stats.approval_notifications.map(req => (
                                    <div
                                        key={req._id}
                                        onClick={() => window.dispatchEvent(new CustomEvent('navigate-hr-tab', { detail: 'approvals' }))}
                                        className="cursor-pointer group flex items-start gap-3 p-3 rounded-xl bg-orange-50 border border-orange-100 hover:bg-orange-100 transition-colors"
                                    >
                                        <div className="p-1.5 bg-orange-200 text-orange-700 rounded-lg">
                                            <AlertCircle size={14} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-orange-800">New {req.request_type.replace('_', ' ')} logic</p>
                                            <p className="text-[10px] text-orange-600/80 font-medium">{req.emp_name}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-[11px] font-medium text-slate-400 text-center py-4">No pending approvals</p>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                        <p className="text-xs font-bold text-slate-600 mb-4">Quick Actions</p>
                        <div className="space-y-2">
                            <button
                                onClick={() => window.dispatchEvent(new CustomEvent('navigate-hr-tab', { detail: 'employees' }))}
                                className="w-full py-2 bg-white border border-blue-400 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <Users size={14} /> View All Employees
                            </button>
                            <button
                                onClick={() => window.dispatchEvent(new CustomEvent('navigate-hr-tab', { detail: 'attendance' }))}
                                className="w-full py-2 bg-white border border-blue-400 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <Calendar size={14} /> Open Attendance
                            </button>
                            <button
                                onClick={() => window.dispatchEvent(new CustomEvent('navigate-hr-tab', { detail: 'movements' }))}
                                className="w-full py-2 bg-white border border-blue-400 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <PersonStanding size={14} /> Track Movements
                            </button>
                            <button
                                onClick={() => window.dispatchEvent(new CustomEvent('navigate-hr-tab', { detail: 'payments' }))}
                                className="w-full py-2 bg-white border border-emerald-500 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <BadgeDollarSign size={14} /> Manage Payments
                            </button>
                            <button
                                onClick={() => window.dispatchEvent(new CustomEvent('navigate-hr-tab', { detail: 'approvals' }))}
                                className="w-full py-2 bg-white border border-amber-400 text-amber-500 rounded-lg text-xs font-bold hover:bg-amber-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <ClipboardSignature size={14} /> Review Approvals
                            </button>
                        </div>
                    </div>
                </div>

            </div>

        </section>
    );
}

// ② Employees ────────────────────────────────────────────────────────────────
function EmployeesTab({ canAttendanceAdd = false }) {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showCheckInModal, setShowCheckInModal] = useState(false);
    const [showCheckOutModal, setShowCheckOutModal] = useState(false);
    const [checkOutReason, setCheckOutReason] = useState('');
    const [showEarlyCheckoutReasonModal, setShowEarlyCheckoutReasonModal] = useState(false);
    const [earlyCheckoutInfo, setEarlyCheckoutInfo] = useState({ employee: null, minutes: 0 });
    const [earlyCheckoutReasonInput, setEarlyCheckoutReasonInput] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [viewingEmployee, setViewingEmployee] = useState(null);
    const [showActionsMenu, setShowActionsMenu] = useState(null);
    const [showSalaryModal, setShowSalaryModal] = useState(false);
    const [showCommissionModal, setShowCommissionModal] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editFormData, setEditFormData] = useState({});

    useEffect(() => {
        loadEmployees();
    }, [statusFilter]);

    const loadEmployees = async () => {
        try {
            setLoading(true);
            const filters = {};
            if (statusFilter) filters.is_active = statusFilter === 'active';
            const data = await hrService.getEmployees(filters);
            setEmployees(data);
        } catch (error) {
            console.error('Failed to load employees:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async (emp) => {
        try {
            await hrService.checkIn(emp.emp_id);
            alert(`Checked in successfully for ${emp.full_name || emp.name}`);
            setShowCheckInModal(false);
        } catch (error) {
            alert('Failed to check in: ' + error.message);
        }
    };

    const handleCheckOut = async (emp) => {
        try {
            const result = await hrService.checkOut(emp.emp_id, null, checkOutReason || null);

            // Check if approval is required/pending
            if (result.status === 'approval_required') {
                alert(`✓ Early checkout request submitted for approval!\n\n${result.message}\n\nPlease wait for manager approval.`);
                setShowCheckOutModal(false);
                setCheckOutReason('');
                loadEmployees(); // Refresh to show pending request
            } else if (result.status === 'approval_pending') {
                alert(`⏳ ${result.message}`);
                setShowCheckOutModal(false);
                setCheckOutReason('');
            } else {
                // Normal checkout success
                alert(`✓ Checked out successfully for ${emp.full_name || emp.name}`);
                setShowCheckOutModal(false);
                setCheckOutReason('');
                loadEmployees(); // Refresh employee list
            }
        } catch (error) {
            // Check if error is about missing reason for early checkout
            if (error.message.includes('Early checkout detected') && error.message.includes('Please provide a reason')) {
                // Extract minutes from error message
                const minutesMatch = error.message.match(/(\d+)\s*min\s*early/);
                const minutes = minutesMatch ? minutesMatch[1] : 'several';

                // Show custom modal to enter reason
                setEarlyCheckoutInfo({ employee: emp, minutes: minutes });
                setEarlyCheckoutReasonInput('');
                setShowEarlyCheckoutReasonModal(true);
            } else {
                alert('❌ Failed to check out: ' + error.message);
            }
        }
    };

    const handleSubmitEarlyCheckoutReason = async () => {
        if (!earlyCheckoutReasonInput || !earlyCheckoutReasonInput.trim()) {
            alert('⚠️ Reason is required for early checkout.');
            return;
        }

        try {
            const result = await hrService.checkOut(earlyCheckoutInfo.employee.emp_id, null, earlyCheckoutReasonInput.trim());
            if (result.status === 'approval_required') {
                alert(`✓ Early checkout request submitted!\n\nYour request has been sent to your manager for approval.`);
                setShowEarlyCheckoutReasonModal(false);
                setShowCheckOutModal(false);
                setCheckOutReason('');
                setEarlyCheckoutReasonInput('');
                loadEmployees();
            } else if (result.status === 'approval_pending') {
                alert(`⏳ ${result.message}`);
                setShowEarlyCheckoutReasonModal(false);
                setShowCheckOutModal(false);
                setCheckOutReason('');
                setEarlyCheckoutReasonInput('');
            } else {
                alert(`✓ Checked out successfully!`);
                setShowEarlyCheckoutReasonModal(false);
                setShowCheckOutModal(false);
                setCheckOutReason('');
                setEarlyCheckoutReasonInput('');
                loadEmployees();
            }
        } catch (error) {
            alert('❌ Failed: ' + error.message);
        }
    };

    const handleSaveSalary = async () => {
        try {
            await hrService.updateEmployee(selectedEmployee.emp_id, {
                base_salary: parseFloat(editFormData.base_salary)
            });
            alert('Salary updated successfully!');
            setShowSalaryModal(false);
            loadEmployees();
        } catch (error) {
            alert('Failed to update salary: ' + error.message);
        }
    };

    const handleSaveSchedule = async () => {
        try {
            await hrService.updateEmployee(selectedEmployee.emp_id, {
                office_check_in_time: editFormData.office_check_in_time,
                office_check_out_time: editFormData.office_check_out_time,
                grace_period_minutes: parseInt(editFormData.grace_period_minutes)
            });
            alert('Schedule updated successfully!');
            setShowScheduleModal(false);
            loadEmployees();
        } catch (error) {
            alert('Failed to update schedule: ' + error.message);
        }
    };

    const handleSavePersonalDetails = async () => {
        try {
            await hrService.updateEmployee(selectedEmployee.emp_id, editFormData);
            alert('Personal details updated successfully!');
            setShowEditModal(false);
            loadEmployees();
        } catch (error) {
            alert('Failed to update details: ' + error.message);
        }
    };

    const filteredEmployees = useMemo(() => employees.filter(e => {
        const matchSearch = !search ||
            (e.full_name || e.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (e.emp_id || '').toLowerCase().includes(search.toLowerCase());
        return matchSearch;
    }), [employees, search]);

    if (loading) return <div className="text-center py-12">Loading...</div>;

    if (viewingEmployee) {
        return <EmployeeProfileView employee={viewingEmployee} onBack={() => setViewingEmployee(null)} onRefresh={loadEmployees} />;
    }

    return (
        <section>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-slate-800">Employees</h2>
                {canAttendanceAdd && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowCheckInModal(true)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-black transition-all"
                        >
                            <Plus size={16} className="inline mr-1" />
                            Check In
                        </button>
                        <button
                            onClick={() => setShowCheckOutModal(true)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-black transition-all"
                        >
                            <Pause size={16} className="inline mr-1" />
                            Check Out
                        </button>
                    </div>
                )}
            </div>

            <Toolbar search={search} setSearch={setSearch} placeholder="Search employees...">
                <Select value={statusFilter} onChange={setStatusFilter} label="All Status"
                    options={[
                        { value: 'active', label: 'Active' },
                        { value: 'inactive', label: 'Inactive' }
                    ]} />
            </Toolbar>

            <Table cols={['Employee', 'Department', 'Phone', 'Salary', 'Join Date', 'Status', 'Actions']}>
                {filteredEmployees.map(e => (
                    <tr key={e._id} className="hover:bg-slate-50/50 transition-colors">
                        <Td>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center text-xs font-black shrink-0">
                                    {(e.full_name || e.name || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-black text-slate-800 text-xs">{e.full_name || e.name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold">{e.emp_id}</p>
                                </div>
                            </div>
                        </Td>
                        <Td><span className="text-xs font-bold text-slate-600">{e.department || '—'}</span></Td>
                        <Td><span className="text-xs font-bold text-slate-600">{e.phone || '—'}</span></Td>
                        <Td><span className="text-xs font-black text-slate-800">{pkr(e.base_salary || e.salary || 0)}</span></Td>
                        <Td><span className="text-xs font-bold text-slate-500">{formatDate(e.join_date)}</span></Td>
                        <Td>{statusBadge(e.is_active ? 'active' : 'inactive', {
                            active: { label: 'Active', cls: 'bg-green-100 text-green-700' },
                            inactive: { label: 'Inactive', cls: 'bg-red-100 text-red-600' }
                        })}</Td>
                        <Td>
                            <div className="relative">
                                <button
                                    onClick={() => setShowActionsMenu(showActionsMenu === e._id ? null : e._id)}
                                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <MoreVertical size={16} className="text-slate-600" />
                                </button>
                                {showActionsMenu === e._id && (
                                    <div className="absolute right-0 top-8 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 min-w-[200px]">
                                        <button
                                            onClick={() => { setViewingEmployee(e); setShowActionsMenu(null); }}
                                            className="w-full px-4 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                        >
                                            <Eye size={14} /> View Full Details
                                        </button>
                                        <button
                                            onClick={() => { setSelectedEmployee(e); setEditFormData({ base_salary: e.base_salary || e.salary || 0 }); setShowSalaryModal(true); setShowActionsMenu(null); }}
                                            className="w-full px-4 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                        >
                                            <DollarSign size={14} /> Change Salary
                                        </button>
                                        <button
                                            onClick={() => { setSelectedEmployee(e); setShowCommissionModal(true); setShowActionsMenu(null); }}
                                            className="w-full px-4 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                        >
                                            <CreditCard size={14} /> Change Commission
                                        </button>
                                        <button
                                            onClick={() => { setSelectedEmployee(e); setEditFormData({ office_check_in_time: e.office_check_in_time || '09:00', office_check_out_time: e.office_check_out_time || '18:00', grace_period_minutes: e.grace_period_minutes || 15 }); setShowScheduleModal(true); setShowActionsMenu(null); }}
                                            className="w-full px-4 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                        >
                                            <Clock size={14} /> Change Check-In/Out Times
                                        </button>
                                        <button
                                            onClick={() => { setSelectedEmployee(e); setEditFormData({ full_name: e.full_name || e.name, email: e.email, phone: e.phone, department: e.department || '', designation: e.designation || '', cnic: e.cnic || '', address: e.address || '' }); setShowEditModal(true); setShowActionsMenu(null); }}
                                            className="w-full px-4 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                        >
                                            <Edit size={14} /> Edit Personal Details
                                        </button>
                                    </div>
                                )}
                            </div>
                        </Td>
                    </tr>
                ))}
            </Table>

            {/* Check In Modal */}
            <Modal isOpen={showCheckInModal} onClose={() => setShowCheckInModal(false)} title="Check In Employee">
                <div className="space-y-4">
                    <Select
                        value={selectedEmployee?.emp_id || ''}
                        onChange={(empId) => setSelectedEmployee(employees.find(e => e.emp_id === empId))}
                        label="Select Employee"
                        options={employees.map(e => ({ value: e.emp_id, label: `${e.full_name || e.name} (${e.emp_id})` }))}
                    />
                    {selectedEmployee && (
                        <button
                            onClick={() => handleCheckIn(selectedEmployee)}
                            className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black"
                        >
                            Confirm Check In
                        </button>
                    )}
                </div>
            </Modal>

            {/* Check Out Modal */}
            <Modal isOpen={showCheckOutModal} onClose={() => { setShowCheckOutModal(false); setCheckOutReason(''); }} title="Check Out Employee">
                <div className="space-y-4">
                    <Select
                        value={selectedEmployee?.emp_id || ''}
                        onChange={(empId) => setSelectedEmployee(employees.find(e => e.emp_id === empId))}
                        label="Select Employee"
                        options={employees.map(e => ({ value: e.emp_id, label: `${e.full_name || e.name} (${e.emp_id})` }))}
                    />
                    {selectedEmployee && (
                        <>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-2">
                                    Reason (Optional)
                                </label>
                                <p className="text-[11px] text-slate-500 mb-2">
                                    💡 If checking out early (more than 15 min before scheduled time), a reason will be required for approval.
                                </p>
                                <textarea
                                    value={checkOutReason}
                                    onChange={(e) => setCheckOutReason(e.target.value)}
                                    placeholder="Enter reason for early checkout (required if leaving >15 min early)..."
                                    rows={3}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                            <button
                                onClick={() => handleCheckOut(selectedEmployee)}
                                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black"
                            >
                                Submit Checkout
                            </button>
                        </>
                    )}
                </div>
            </Modal>

            {/* Early Checkout Reason Modal */}
            <Modal
                isOpen={showEarlyCheckoutReasonModal}
                onClose={() => { setShowEarlyCheckoutReasonModal(false); setEarlyCheckoutReasonInput(''); }}
                title="Early Checkout Detected"
            >
                <div className="space-y-4">
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                                <span className="text-xl">⚠️</span>
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-orange-900 mb-1">Approval Required</h4>
                                <p className="text-xs text-orange-700">
                                    <strong>{earlyCheckoutInfo.employee?.full_name || earlyCheckoutInfo.employee?.name}</strong> is checking out <strong>{earlyCheckoutInfo.minutes} minutes early</strong>.
                                    This requires manager approval.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">
                            Reason for Early Checkout *
                        </label>
                        <textarea
                            value={earlyCheckoutReasonInput}
                            onChange={(e) => setEarlyCheckoutReasonInput(e.target.value)}
                            placeholder="e.g., Medical appointment, family emergency, personal matters..."
                            rows={4}
                            autoFocus
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className="text-[11px] text-slate-500 mt-1">
                            Your manager will review this request before approving the early checkout.
                        </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={() => { setShowEarlyCheckoutReasonModal(false); setEarlyCheckoutReasonInput(''); }}
                            className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmitEarlyCheckoutReason}
                            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black transition-colors"
                        >
                            Submit Request
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Salary Modal */}
            <Modal isOpen={showSalaryModal} onClose={() => setShowSalaryModal(false)} title="Change Salary">
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Base Salary (PKR)</label>
                        <input
                            type="number"
                            value={editFormData.base_salary || 0}
                            onChange={(e) => setEditFormData({ ...editFormData, base_salary: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <button
                        onClick={handleSaveSalary}
                        className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black"
                    >
                        Save Salary
                    </button>
                </div>
            </Modal>

            {/* Commission Modal */}
            <Modal isOpen={showCommissionModal} onClose={() => setShowCommissionModal(false)} title="Change Commission">
                <div className="space-y-4">
                    <div className="text-center py-8">
                        <CreditCard size={48} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-sm font-bold text-slate-600">Commission management coming soon</p>
                    </div>
                </div>
            </Modal>

            {/* Schedule Modal */}
            <Modal isOpen={showScheduleModal} onClose={() => setShowScheduleModal(false)} title="Change Check-In/Out Times">
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Check-In Time</label>
                        <input
                            type="time"
                            value={editFormData.office_check_in_time || '09:00'}
                            onChange={(e) => setEditFormData({ ...editFormData, office_check_in_time: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Check-Out Time</label>
                        <input
                            type="time"
                            value={editFormData.office_check_out_time || '18:00'}
                            onChange={(e) => setEditFormData({ ...editFormData, office_check_out_time: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Grace Period (minutes)</label>
                        <input
                            type="number"
                            value={editFormData.grace_period_minutes || 15}
                            onChange={(e) => setEditFormData({ ...editFormData, grace_period_minutes: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <button
                        onClick={handleSaveSchedule}
                        className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black"
                    >
                        Save Schedule
                    </button>
                </div>
            </Modal>

            {/* Edit Personal Details Modal */}
            <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Personal Details">
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Full Name</label>
                        <input
                            type="text"
                            value={editFormData.full_name || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Email</label>
                            <input
                                type="email"
                                value={editFormData.email || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Phone</label>
                            <input
                                type="text"
                                value={editFormData.phone || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Department</label>
                            <input
                                type="text"
                                value={editFormData.department || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Designation</label>
                            <input
                                type="text"
                                value={editFormData.designation || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, designation: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">CNIC</label>
                        <input
                            type="text"
                            value={editFormData.cnic || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, cnic: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="12345-1234567-1"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Address</label>
                        <textarea
                            value={editFormData.address || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            rows="2"
                        />
                    </div>
                    <button
                        onClick={handleSavePersonalDetails}
                        className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black"
                    >
                        Save Details
                    </button>
                </div>
            </Modal>
        </section>
    );
}

// ③ Attendance ─────────────────────────────────────────────────────────────────
function AttendanceTab() {
    const todayStr = new Date().toISOString().split('T')[0];
    const [attendance, setAttendance] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFilter, setDateFilter] = useState(todayStr);

    useEffect(() => {
        loadAttendance();
    }, [statusFilter, dateFilter]);

    useEffect(() => {
        hrService.getEmployees().then(setEmployees).catch(console.error);
    }, []);

    const empMap = useMemo(() => {
        const m = {};
        employees.forEach(e => { m[e.emp_id] = e.full_name || e.name || e.emp_id; });
        return m;
    }, [employees]);

    const loadAttendance = async () => {
        try {
            setLoading(true);
            const filters = {};
            if (statusFilter) filters.status = statusFilter;
            // Always send today if no date picked
            const d = dateFilter || todayStr;
            filters.start_date = d;
            filters.end_date = d;
            const data = await hrService.getAttendance(filters);
            setAttendance(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load attendance:', error);
            setAttendance([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredAttendance = useMemo(() => attendance.filter(a => {
        const name = empMap[a.emp_id] || a.emp_id || '';
        return !search || name.toLowerCase().includes(search.toLowerCase()) ||
            (a.emp_id || '').toLowerCase().includes(search.toLowerCase());
    }), [attendance, search, empMap]);

    if (loading) return <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3" /><p className="text-sm text-slate-500">Loading attendance…</p></div>;

    return (
        <section>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-slate-800">Attendance</h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setDateFilter(todayStr)}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${dateFilter === todayStr ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        Today
                    </button>
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={e => setDateFilter(e.target.value)}
                        className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black text-slate-600 outline-none focus:ring-2 focus:ring-blue-100"
                    />
                    <button onClick={loadAttendance} className="p-2 hover:bg-slate-100 rounded-xl transition-colors" title="Refresh">
                        <RefreshCw size={16} className="text-slate-500" />
                    </button>
                </div>
            </div>

            <Toolbar search={search} setSearch={setSearch} placeholder="Search by name or employee ID…">
                <Select value={statusFilter} onChange={setStatusFilter} label="All Status"
                    options={[
                        { value: 'on_time', label: 'On Time' },
                        { value: 'grace', label: 'Grace' },
                        { value: 'late', label: 'Late' },
                        { value: 'absent', label: 'Absent' },
                        { value: 'half_day', label: 'Half Day' }
                    ]} />
            </Toolbar>

            {filteredAttendance.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                    <Calendar size={40} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-sm font-black text-slate-600">No attendance records for {dateFilter === todayStr ? 'today' : dateFilter}</p>
                    <p className="text-xs text-slate-400 mt-1">Records appear here when employees check in</p>
                </div>
            ) : (
                <Table cols={['Employee', 'Emp ID', 'Date', 'Check In', 'Check Out', 'Hours', 'Status']}>
                    {filteredAttendance.map(a => (
                        <tr key={a._id} className="hover:bg-slate-50/50 transition-colors">
                            <Td><span className="font-black text-slate-800 text-xs">{empMap[a.emp_id] || a.emp_id}</span></Td>
                            <Td><span className="text-[10px] font-bold text-slate-400">{a.emp_id}</span></Td>
                            <Td><span className="text-xs font-bold text-slate-600">{formatDate(a.date)}</span></Td>
                            <Td><span className={`text-xs font-black ${a.check_in ? 'text-green-600' : 'text-slate-400'}`}>{formatTime(a.check_in)}</span></Td>
                            <Td><span className={`text-xs font-black ${a.check_out ? 'text-blue-600' : 'text-slate-400'}`}>{formatTime(a.check_out)}</span></Td>
                            <Td><span className="text-xs font-bold text-slate-600">{a.working_hours ? `${a.working_hours.toFixed(1)}h` : '—'}</span></Td>
                            <Td>{statusBadge(a.status, ATTEND_STATUS_MAP)}</Td>
                        </tr>
                    ))}
                </Table>
            )}
        </section>
    );
}



// ④ Movements ─────────────────────────────────────────────────────────────────
function MovementsTab({ canMovementsAdd = false }) {
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchMovements, setSearchMovements] = useState('');
    const [searchEmployees, setSearchEmployees] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showReasonModal, setShowReasonModal] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [reason, setReason] = useState('');

    useEffect(() => {
        loadMovements();
        loadEmployees();
    }, [statusFilter]);

    const loadMovements = async () => {
        try {
            setLoading(true);
            const filters = {};
            if (statusFilter) filters.status = statusFilter;
            const data = await hrService.getMovements(filters);
            setMovements(data);
        } catch (error) {
            console.error('Failed to load movements:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadEmployees = async () => {
        try {
            const data = await hrService.getEmployees({ is_active: true });
            setEmployees(data);
        } catch (error) {
            console.error('Failed to load employees:', error);
        }
    };

    const handleOpenStartModal = (employee) => {
        setSelectedEmployee(employee);
        setReason('');
        setShowReasonModal(true);
    };

    const handleStartMovement = async () => {
        if (!selectedEmployee || !reason.trim()) {
            alert('Please enter a reason for the movement');
            return;
        }
        try {
            await hrService.startMovement(selectedEmployee.emp_id, reason.trim());
            alert('Movement started successfully');
            setShowReasonModal(false);
            setSelectedEmployee(null);
            setReason('');
            loadMovements();
        } catch (error) {
            alert('Failed to start movement: ' + error.message);
        }
    };

    const handleEndMovement = async (movementId) => {
        if (!confirm('End this movement?')) return;
        try {
            await hrService.endMovement(movementId);
            alert('Movement ended successfully');
            loadMovements();
        } catch (error) {
            alert('Failed to end movement: ' + error.message);
        }
    };

    const calculateDuration = (startTime, endTime) => {
        if (!startTime || !endTime) return '—';
        const start = new Date(startTime);
        const end = new Date(endTime);
        const diffMs = end - start;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 60) return `${diffMins}m`;
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return `${hours}h ${mins}m`;
    };

    const filteredMovements = useMemo(() => movements.filter(m => {
        const matchSearch = !searchMovements ||
            (m.emp_id || '').toLowerCase().includes(searchMovements.toLowerCase()) ||
            (m.employee?.full_name || m.employee?.name || '').toLowerCase().includes(searchMovements.toLowerCase()) ||
            (m.employee?.phone || '').includes(searchMovements);
        return matchSearch;
    }), [movements, searchMovements]);

    const filteredEmployees = useMemo(() => employees.filter(e => {
        const matchSearch = !searchEmployees ||
            (e.emp_id || '').toLowerCase().includes(searchEmployees.toLowerCase()) ||
            (e.full_name || e.name || '').toLowerCase().includes(searchEmployees.toLowerCase()) ||
            (e.phone || '').includes(searchEmployees);
        return matchSearch;
    }), [employees, searchEmployees]);

    if (loading) return <div className="text-center py-12">Loading...</div>;

    return (
        <section className="space-y-10">
            {/* Movement Logs Section */}
            <div>
                <div className="mb-6">
                    <h2 className="text-xl font-extrabold text-slate-800 mb-1">Movement Logs</h2>
                    <p className="text-sm text-slate-500 font-medium">Track out-of-office movements for employees</p>
                </div>

                {/* Filters for Movement Logs */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative w-full sm:w-80">
                        <input
                            type="text"
                            placeholder="Search by ID, name, or phone..."
                            value={searchMovements}
                            onChange={e => setSearchMovements(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 placeholder:text-slate-400 shadow-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                        />
                    </div>
                    <div className="relative w-full sm:w-48">
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 shadow-sm appearance-none cursor-pointer focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                        >
                            <option value="">All Status</option>
                            <option value="active">In Progress</option>
                            <option value="completed">Completed</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>
                    {(searchMovements || statusFilter) && (
                        <button
                            onClick={() => {
                                setSearchMovements('');
                                setStatusFilter('');
                            }}
                            className="px-5 py-2.5 bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 rounded-xl text-sm font-bold shadow-sm transition-all whitespace-nowrap"
                        >
                            Reset
                        </button>
                    )}
                </div>

                {/* Movement Logs Table */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-100">
                                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">EMPLOYEE</th>
                                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">PHONE</th>
                                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">START</th>
                                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">END</th>
                                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">DURATION</th>
                                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">REASON</th>
                                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-right">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-sm font-semibold text-slate-700">
                                {filteredMovements.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-8 text-center text-slate-400">
                                            No movement logs found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredMovements.map(m => (
                                        <tr key={m._id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-800 uppercase">
                                                {m.employee?.full_name || m.employee?.name || m.emp_id}
                                            </td>
                                            <td className="px-6 py-4">{m.employee?.phone || '—'}</td>
                                            <td className="px-6 py-4">{formatDateTime(m.start_time)}</td>
                                            <td className="px-6 py-4">{m.end_time ? formatDateTime(m.end_time) : '—'}</td>
                                            <td className="px-6 py-4">{calculateDuration(m.start_time, m.end_time)}</td>
                                            <td className="px-6 py-4">{m.reason}</td>
                                            <td className="px-6 py-4 text-right">
                                                {m.status === 'active' ? (
                                                    canMovementsAdd ? (
                                                        <button
                                                            onClick={() => handleEndMovement(m._id)}
                                                            className="px-4 py-1.5 border border-rose-500 text-rose-500 rounded-lg text-xs font-bold hover:bg-rose-50 transition-colors"
                                                        >
                                                            End Movement
                                                        </button>
                                                    ) : (
                                                        <span className="text-slate-500 font-medium">Active</span>
                                                    )
                                                ) : (
                                                    <span className="text-slate-500 font-medium">Completed</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Start Movement Section */}
            {canMovementsAdd && <div>
                <div className="mb-4">
                    <h2 className="text-base font-extrabold text-slate-800">Start Movement for Employees</h2>
                </div>

                {/* Search for Employees */}
                <div className="mb-6">
                    <div className="relative w-full sm:w-80">
                        <input
                            type="text"
                            placeholder="Search by ID, name, or phone..."
                            value={searchEmployees}
                            onChange={e => setSearchEmployees(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 placeholder:text-slate-400 shadow-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                        />
                    </div>
                </div>

                {/* Employees Table */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-100">
                                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">ID</th>
                                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">NAME</th>
                                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">ROLE</th>
                                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">PHONE</th>
                                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-right">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-sm font-semibold text-slate-700">
                                {filteredEmployees.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-slate-400">
                                            No employees found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredEmployees.map(e => (
                                        <tr key={e.emp_id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-800">{e.emp_id}</td>
                                            <td className="px-6 py-4 font-bold text-slate-800 uppercase">{e.full_name || e.name}</td>
                                            <td className="px-6 py-4 uppercase">{e.designation || e.role || '—'}</td>
                                            <td className="px-6 py-4">{e.phone || '—'}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleOpenStartModal(e)}
                                                    className="px-4 py-1.5 border border-blue-600 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors"
                                                >
                                                    Start Movement
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>}

            {/* Start Movement Modal */}
            <Modal isOpen={showReasonModal} onClose={() => setShowReasonModal(false)} title="Start Movement" size="sm">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-black text-slate-700 mb-2">Employee</label>
                        <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800">
                            {selectedEmployee?.full_name || selectedEmployee?.name} ({selectedEmployee?.emp_id})
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-black text-slate-700 mb-2">Reason for Movement</label>
                        <textarea
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold resize-none"
                            placeholder="Enter reason for movement..."
                            rows="3"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowReasonModal(false)}
                            className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleStartMovement}
                            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black transition-colors"
                        >
                            Start Movement
                        </button>
                    </div>
                </div>
            </Modal>
        </section>
    );
}

//⑤ Approvals ─────────────────────────────────────────────────────────────────
function ApprovalsTab() {
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [requestsData, employeesData] = await Promise.all([
                hrService.getLeaveRequests({ status: 'pending' }),
                hrService.getEmployees()
            ]);
            setLeaveRequests(requestsData);
            setEmployees(employeesData);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getEmployeeName = (empId) => {
        const emp = employees.find(e => e.emp_id === empId);
        return emp ? (emp.full_name || emp.name) : empId;
    };

    const handleApprove = async (requestId) => {
        try {
            const currentUser = JSON.parse(localStorage.getItem('admin_data') || '{}');
            await hrService.approveLeaveRequest(requestId, currentUser.email || currentUser.emp_id);
            alert('Request approved successfully');
            loadData();
        } catch (error) {
            alert('Failed to approve: ' + error.message);
        }
    };

    const handleReject = async (requestId) => {
        try {
            const currentUser = JSON.parse(localStorage.getItem('admin_data') || '{}');
            await hrService.rejectLeaveRequest(requestId, currentUser.email || currentUser.emp_id);
            alert('Request rejected successfully');
            loadData();
        } catch (error) {
            alert('Failed to reject: ' + error.message);
        }
    };

    if (loading) return <div className="text-center py-12">Loading...</div>;

    return (
        <section>
            <h2 className="text-2xl font-black text-slate-800 mb-6">Pending Approvals</h2>

            {leaveRequests.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                    <p className="text-slate-500 font-medium">No pending approvals</p>
                </div>
            ) : (
                <Table cols={['Employee', 'Type', 'Date/Time', 'Reason', 'Status', 'Actions']}>
                    {leaveRequests.map(r => (
                        <tr key={r._id} className="hover:bg-slate-50/50 transition-colors">
                            <Td>
                                <div>
                                    <p className="font-bold text-slate-800 text-xs">{getEmployeeName(r.emp_id)}</p>
                                    <p className="text-[10px] text-slate-500 font-medium">{r.emp_id}</p>
                                </div>
                            </Td>
                            <Td>
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${r.request_type === 'early_checkout'
                                    ? 'bg-orange-100 text-orange-700'
                                    : 'bg-blue-100 text-blue-700'
                                    }`}>
                                    {r.request_type.replace('_', ' ')}
                                </span>
                            </Td>
                            <Td>
                                <div>
                                    <p className="text-xs font-bold text-slate-600">{formatDate(r.request_date)}</p>
                                    {r.start_time && (
                                        <p className="text-[10px] text-slate-500 font-medium">
                                            {new Date(r.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    )}
                                </div>
                            </Td>
                            <Td><span className="text-xs text-slate-600">{r.reason}</span></Td>
                            <Td>{statusBadge(r.status, LEAVE_STATUS_MAP)}</Td>
                            <Td>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleApprove(r._id)}
                                        className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-[10px] font-black transition-colors"
                                    >
                                        ✓ Approve
                                    </button>
                                    <button
                                        onClick={() => handleReject(r._id)}
                                        className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-[10px] font-black transition-colors"
                                    >
                                        ✕ Reject
                                    </button>
                                </div>
                            </Td>
                        </tr>
                    ))}
                </Table>
            )}
        </section>
    );
}

// ⑥ Payments ─────────────────────────────────────────────────────────────────
function PaymentsTab() {
    const [activeSubTab, setActiveSubTab] = useState('salaries');
    const [salaries, setSalaries] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [autoGenerating, setAutoGenerating] = useState(false);
    const [empFilter, setEmpFilter] = useState('');
    const [monthFilter, setMonthFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [overdueOnly, setOverdueOnly] = useState(false);

    useEffect(() => {
        loadEmployees();
        autoGenerateAndLoadData();
    }, []);

    useEffect(() => {
        loadStatistics();
        loadSalaries();
    }, [monthFilter, statusFilter]);

    const loadEmployees = async () => {
        try {
            const data = await hrService.getEmployees({ is_active: true });
            setEmployees(data || []);
        } catch (error) {
            console.error('Failed to load employees:', error);
        }
    };

    const loadStatistics = async () => {
        try {
            const stats = await hrService.getSalaryStatistics(monthFilter || null);
            setStatistics(stats);
        } catch (error) {
            console.error('Failed to load statistics:', error);
        }
    };

    const loadSalaries = async () => {
        try {
            setLoading(true);
            const filters = {};
            if (empFilter) filters.emp_id = empFilter;
            if (monthFilter) filters.month = monthFilter;
            if (statusFilter) filters.status = statusFilter;
            const data = await hrService.getSalaries(filters);
            setSalaries(data);
        } catch (error) {
            console.error('Failed to load salaries:', error);
        } finally {
            setLoading(false);
        }
    };

    const autoGenerateAndLoadData = async () => {
        try {
            setAutoGenerating(true);
            const result = await hrService.autoGenerateDueSalaries();
            if (result.generated_count > 0) {
                console.log(`Auto-generated ${result.generated_count} salaries`);
            }
        } catch (error) {
            console.error('Failed to auto-generate salaries:', error);
        } finally {
            setAutoGenerating(false);
            loadStatistics();
            loadSalaries();
        }
    };

    const handleReset = () => {
        setEmpFilter('');
        setMonthFilter('');
        setStatusFilter('');
        setOverdueOnly(false);
    };

    const getEmployeeName = (empId) => {
        const emp = employees.find(e => e.emp_id === empId);
        return emp?.full_name || empId;
    };

    const getEmployeeJoinDate = (empId) => {
        const emp = employees.find(e => e.emp_id === empId);
        return emp?.join_date ? formatDate(emp.join_date) : '—';
    };

    const isOverdue = (salary) => {
        if (salary.status !== 'pending') return false;
        const expectedDate = salary.expected_payment_date;
        if (!expectedDate) return false;
        try {
            const expected = new Date(expectedDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return today > expected;
        } catch {
            return false;
        }
    };

    const filteredSalaries = useMemo(() => {
        let filtered = [...salaries];
        if (overdueOnly) {
            filtered = filtered.filter(s => isOverdue(s));
        }
        return filtered;
    }, [salaries, overdueOnly]);

    const stats = statistics || { total_pending: 0, total_paid: 0, total_records: 0, overdue_count: 0 };

    return (
        <section>
            {/* Page Header */}
            <div className="mb-6">
                <h2 className="text-xl font-extrabold text-slate-800 mb-1">Payments</h2>
                <p className="text-sm text-slate-500 font-medium">
                    Salaries are auto-generated based on employee join dates
                </p>
            </div>

            {/* Sub Tabs */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
                <button
                    onClick={() => setActiveSubTab('salaries')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all border ${activeSubTab === 'salaries'
                        ? 'bg-slate-100 text-slate-800 border-slate-200'
                        : 'text-blue-500 hover:bg-blue-50 border-transparent'
                        }`}
                >
                    💰 Salaries
                </button>
                <button
                    onClick={() => setActiveSubTab('commissions')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all border ${activeSubTab === 'commissions'
                        ? 'bg-slate-100 text-slate-800 border-slate-200'
                        : 'text-blue-500 hover:bg-blue-50 border-transparent'
                        }`}
                >
                    💵 Commissions
                </button>
                <button
                    onClick={() => setActiveSubTab('history')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all border ${activeSubTab === 'history'
                        ? 'bg-slate-100 text-slate-800 border-slate-200'
                        : 'text-blue-500 hover:bg-blue-50 border-transparent'
                        }`}
                >
                    📊 Salary History
                </button>
            </div>

            {activeSubTab === 'salaries' && (
                <>
                    {/* Stat Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-[#F8F9FC] p-5 rounded-2xl border border-slate-100 shadow-sm">
                            <p className="text-sm font-bold text-slate-800 mb-1">Total Pending</p>
                            <p className="text-sm text-slate-500 font-medium">{pkr(stats.total_pending)}</p>
                        </div>
                        <div className="bg-[#F8F9FC] p-5 rounded-2xl border border-slate-100 shadow-sm">
                            <p className="text-sm font-bold text-slate-800 mb-1">Total Paid</p>
                            <p className="text-sm text-slate-500 font-medium">{pkr(stats.total_paid)}</p>
                        </div>
                        <div className="bg-[#F8F9FC] p-5 rounded-2xl border border-slate-100 shadow-sm">
                            <p className="text-sm font-bold text-slate-800 mb-1">Total Records</p>
                            <p className="text-sm text-slate-500 font-medium">{stats.total_records}</p>
                        </div>
                        <div className="bg-[#F8F9FC] p-5 rounded-2xl border border-slate-100 border-l-4 border-l-rose-500 shadow-sm">
                            <p className="text-sm font-bold text-slate-800 mb-1">Overdue Payments</p>
                            <p className="text-sm text-rose-500 font-medium">{stats.overdue_count}</p>
                        </div>
                    </div>

                    {/* Main List Container */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 min-h-100">
                        {/* Filters */}
                        <div className="flex flex-wrap items-center gap-4 mb-6">
                            <div className="relative w-full sm:w-48">
                                <select
                                    value={empFilter}
                                    onChange={(e) => setEmpFilter(e.target.value)}
                                    className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 appearance-none cursor-pointer focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                                >
                                    <option value="">All Employees</option>
                                    {employees.map(emp => (
                                        <option key={emp.emp_id} value={emp.emp_id}>
                                            {emp.full_name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                            </div>
                            <div className="relative w-full sm:w-40">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 appearance-none cursor-pointer focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                                >
                                    <option value="">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="paid">Paid</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                            </div>
                            <div className="relative w-full sm:w-40">
                                <input
                                    type="month"
                                    value={monthFilter}
                                    onChange={(e) => setMonthFilter(e.target.value)}
                                    className="w-full pl-4 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 cursor-pointer focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                                    placeholder="All Months"
                                />
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer mr-2 group">
                                <input
                                    type="checkbox"
                                    checked={overdueOnly}
                                    onChange={(e) => setOverdueOnly(e.target.checked)}
                                    className="w-4 h-4 rounded border border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-100"
                                />
                                <span className="text-sm font-medium text-slate-600 group-hover:text-slate-800 transition-colors">
                                    Overdue Only
                                </span>
                            </label>

                            <button
                                onClick={handleReset}
                                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm"
                            >
                                Reset
                            </button>

                            <button
                                onClick={autoGenerateAndLoadData}
                                disabled={autoGenerating}
                                className="ml-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <RefreshCw size={16} className={`inline mr-1 ${autoGenerating ? 'animate-spin' : ''}`} />
                                {autoGenerating ? 'Checking...' : 'Check for New Salaries'}
                            </button>
                        </div>

                        {/* Data Table */}
                        {loading ? (
                            <div className="text-center py-12">
                                <p className="text-sm font-medium text-slate-500">Loading...</p>
                            </div>
                        ) : filteredSalaries.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-sm font-medium text-slate-500">No salary payment records found</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto -mx-6">
                                <table className="w-full text-left whitespace-nowrap">
                                    <thead>
                                        <tr className="border-b border-slate-100">
                                            <th className="px-6 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Employee</th>
                                            <th className="px-6 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Month</th>
                                            <th className="px-6 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Salary Day</th>
                                            <th className="px-6 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-right">Base</th>
                                            <th className="px-6 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-right">Commission</th>
                                            <th className="px-6 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-right">Deductions</th>
                                            <th className="px-6 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-right">Net</th>
                                            <th className="px-6 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Status</th>
                                            <th className="px-6 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Payment Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredSalaries.map(salary => {
                                            const overdue = isOverdue(salary);
                                            return (
                                                <tr key={salary._id} className={`hover:bg-slate-50/50 transition-colors ${overdue ? 'bg-rose-50/30' : ''}`}>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                                                                {getEmployeeName(salary.emp_id).charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-800">
                                                                    {getEmployeeName(salary.emp_id)}
                                                                </p>
                                                                <p className="text-[10px] font-bold text-slate-400">
                                                                    {salary.emp_id}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-xs font-bold text-slate-600">{salary.month}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-xs font-bold text-blue-600">
                                                            Day {salary.salary_day || '1'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="text-xs font-black text-slate-800">{pkr(salary.base_salary)}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="text-xs font-bold text-green-600">{pkr(salary.commission_total || 0)}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="text-xs font-bold text-red-600">
                                                            {pkr((salary.fine_deductions || 0) + (salary.other_deductions || 0))}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="text-sm font-black text-blue-700">{pkr(salary.net_salary)}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {overdue ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700">
                                                                Overdue
                                                            </span>
                                                        ) : (
                                                            statusBadge(salary.status, PAY_STATUS_MAP)
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-xs text-slate-600">
                                                            {salary.actual_payment_date
                                                                ? formatDate(salary.actual_payment_date)
                                                                : salary.status === 'pending'
                                                                    ? `Due: ${formatDate(salary.expected_payment_date)}`
                                                                    : '—'
                                                            }
                                                        </span>
                                                        {salary.status === 'paid' && salary.days_late > 0 && (
                                                            <span className="block text-[10px] font-bold text-orange-600 mt-1">
                                                                {salary.days_late} days late
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}

            {activeSubTab === 'commissions' && (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 min-h-100">
                    <h3 className="text-lg font-black text-slate-800 mb-6">My Commissions</h3>

                    {/* Commission Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {/* Total Earned */}
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            <p className="text-sm font-bold text-slate-500 mb-2">Total Earned</p>
                            <p className="text-2xl font-black text-slate-800">PKR 0</p>
                        </div>

                        {/* Paid */}
                        <div className="bg-emerald-600 p-6 rounded-2xl">
                            <p className="text-sm font-bold text-white/80 mb-2">Paid</p>
                            <p className="text-2xl font-black text-white">PKR 0</p>
                        </div>

                        {/* Unpaid */}
                        <div className="bg-amber-400 p-6 rounded-2xl">
                            <p className="text-sm font-bold text-amber-900/70 mb-2">Unpaid</p>
                            <p className="text-2xl font-black text-amber-900">PKR 0</p>
                        </div>
                    </div>

                    {/* Empty State */}
                    <div className="flex items-center justify-center py-16 text-center">
                        <p className="text-sm font-medium text-slate-500">No commission records found</p>
                    </div>
                </div>
            )}

            {activeSubTab === 'history' && (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 min-h-100">
                    <div className="text-center py-12">
                        <p className="text-sm font-medium text-slate-500">Salary history coming soon</p>
                    </div>
                </div>
            )}
        </section>
    );
}

// ⑦ Punctuality ──────────────────────────────────────────────────────────────
function PunctualityTab() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [empFilter, setEmpFilter] = useState('');
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [employees, setEmployees] = useState([]);

    useEffect(() => {
        loadEmployees();
        loadPunctualityData();
    }, []);

    const loadEmployees = async () => {
        try {
            const data = await hrService.getEmployees();
            setEmployees(data || []);
        } catch (error) {
            console.error('Failed to load employees:', error);
        }
    };

    const loadPunctualityData = async (filters = {}) => {
        try {
            setLoading(true);
            const data = await hrService.getPunctualityAnalytics({
                start_date: startDate,
                end_date: endDate,
                emp_id: empFilter,
                ...filters
            });
            setData(data);
        } catch (error) {
            console.error('Failed to load punctuality data:', error);
            alert('Failed to load punctuality data: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateView = () => {
        loadPunctualityData();
    };

    const handleReset = () => {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        setEmpFilter('');
        setSearch('');

        // Reload with default filters
        setTimeout(() => loadPunctualityData(), 100);
    };

    const filteredEmployees = useMemo(() => {
        if (!data?.employees) return [];
        return data.employees.filter(emp => {
            const searchStr = search.toLowerCase();
            return emp.full_name?.toLowerCase().includes(searchStr) ||
                emp.emp_id?.toLowerCase().includes(searchStr) ||
                emp.designation?.toLowerCase().includes(searchStr);
        });
    }, [data?.employees, search]);

    if (loading) return <div className="text-center py-12">Loading...</div>;
    if (!data) return <div className="text-center py-12">Failed to load punctuality data</div>;

    const stats = data.statistics || {};

    return (
        <section>
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-800 mb-1">Punctuality Insights</h2>
                    <p className="text-sm text-slate-500 font-medium">Analytics & Violation Tracking</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleReset}
                        className="px-5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-bold shadow-sm transition-all"
                    >
                        Reset
                    </button>
                    <button
                        onClick={handleUpdateView}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20 transition-all"
                    >
                        Update View
                    </button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 border-b-[4px] border-b-rose-400 shadow-sm">
                    <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-2">VIOLATION RATE</p>
                    <h3 className="text-3xl font-black text-slate-800 mb-1">{stats.violation_rate || 0}</h3>
                    <p className="text-xs font-medium text-slate-500">Late arrivals & early leaves</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 border-b-[4px] border-b-amber-400 shadow-sm">
                    <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-2">GRACE USAGE</p>
                    <h3 className="text-3xl font-black text-slate-800 mb-1">{stats.grace_usage || 0}</h3>
                    <p className="text-xs font-medium text-slate-500">Within 15m allowance</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 border-b-[4px] border-b-slate-400 shadow-sm">
                    <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-2">ABSENTEEISM</p>
                    <h3 className="text-3xl font-black text-slate-800 mb-1">{stats.absenteeism || 0}</h3>
                    <p className="text-xs font-medium text-slate-500">Unexcused absences</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 border-b-[4px] border-b-emerald-400 shadow-sm">
                    <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-2">AVG PUNCTUALITY</p>
                    <h3 className="text-3xl font-black text-slate-800 mb-1">{stats.average_punctuality || 0}%</h3>
                    <p className="text-xs font-medium text-slate-500">Team average score</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-3 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-64">
                    <select
                        value={empFilter}
                        onChange={(e) => setEmpFilter(e.target.value)}
                        className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-transparent rounded-xl text-sm font-semibold text-slate-700 appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                        <option value="">All Employees</option>
                        {employees.map(emp => (
                            <option key={emp.emp_id} value={emp.emp_id}>
                                {emp.full_name} ({emp.emp_id})
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto overflow-hidden">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">From</span>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-3 py-2 bg-slate-50 border border-transparent rounded-xl text-sm font-semibold text-slate-700 focus:bg-white transition-all min-w-[130px]"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">To</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-3 py-2 bg-slate-50 border border-transparent rounded-xl text-sm font-semibold text-slate-700 focus:bg-white transition-all min-w-[130px]"
                        />
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="mb-4">
                <div className="relative w-full sm:w-80">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search employees..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-100 shadow-sm"
                    />
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">EMPLOYEE</th>
                                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-center">WORKING DAYS</th>
                                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">VIOLATIONS SUMMARY</th>
                                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest w-48">SCORE</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm font-semibold text-slate-700">
                            {filteredEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                                        No employees found
                                    </td>
                                </tr>
                            ) : (
                                filteredEmployees.map((emp, idx) => (
                                    <tr key={emp.emp_id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg ${['bg-indigo-600', 'bg-purple-600', 'bg-blue-600', 'bg-cyan-600', 'bg-teal-600'][idx % 5]} text-white flex items-center justify-center font-bold text-lg shadow-sm`}>
                                                    {emp.full_name?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800 leading-tight mb-0.5">
                                                        {emp.full_name?.toUpperCase() || 'Unknown'}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                        {emp.designation || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center text-slate-600 font-medium">
                                            {emp.working_days}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${emp.violations.total === 0
                                                ? 'bg-green-50 text-green-700 border-green-200'
                                                : emp.violations.total < 3
                                                    ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                    : 'bg-red-50 text-red-700 border-red-200'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${emp.violations.total === 0
                                                    ? 'bg-green-600'
                                                    : emp.violations.total < 3
                                                        ? 'bg-yellow-600'
                                                        : 'bg-red-600'
                                                    }`}></span>
                                                {emp.violations.summary}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${emp.punctuality_score >= 90 ? 'bg-green-500' :
                                                            emp.punctuality_score >= 75 ? 'bg-yellow-500' :
                                                                emp.punctuality_score >= 50 ? 'bg-orange-500' :
                                                                    'bg-rose-500'
                                                            }`}
                                                        style={{ width: `${emp.punctuality_score}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs font-bold text-slate-800 min-w-[42px]">
                                                    {emp.punctuality_score}%
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}

// ⑧ Employee Profile View ──────────────────────────────────────────────────────
function EmployeeProfileView({ employee, onBack, onRefresh }) {
    const [activeTab, setActiveTab] = useState('Info');
    const [attendance, setAttendance] = useState([]);
    const [movements, setMovements] = useState([]);
    const [ledger, setLedger] = useState([]);
    const [checkoutRequests, setCheckoutRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [showEarlyCheckoutReasonModal, setShowEarlyCheckoutReasonModal] = useState(false);
    const [earlyCheckoutInfo, setEarlyCheckoutInfo] = useState({ minutes: 0 });
    const [earlyCheckoutReasonInput, setEarlyCheckoutReasonInput] = useState('');
    const [formData, setFormData] = useState({
        full_name: employee.full_name || employee.name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        whatsapp_number: employee.whatsapp_number || '',
        other_contact_number: employee.other_contact_number || '',
        address: employee.address || '',
        emergency_contact_name: employee.emergency_contact_name || '',
        emergency_contact_phone: employee.emergency_contact_phone || '',
        office_check_in_time: employee.office_check_in_time || '09:00',
        office_check_out_time: employee.office_check_out_time || '18:00',
        grace_period_minutes: employee.grace_period_minutes || 15,
        join_date: employee.join_date || employee.joining_date || '',
        base_salary: employee.base_salary || employee.salary || 0,
        currency: employee.currency || 'PKR',
        bank_account_number: employee.bank_account_number || '',
        bank_account_title: employee.bank_account_title || '',
        bank_name: employee.bank_name || '',
        salary_payment_day: employee.salary_payment_day || 25,
        is_active: employee.is_active !== false,
        role: employee.role || ''
    });

    useEffect(() => {
        // Update formData when employee prop changes
        setFormData({
            full_name: employee.full_name || employee.name || '',
            email: employee.email || '',
            phone: employee.phone || '',
            whatsapp_number: employee.whatsapp_number || '',
            other_contact_number: employee.other_contact_number || '',
            address: employee.address || '',
            emergency_contact_name: employee.emergency_contact_name || '',
            emergency_contact_phone: employee.emergency_contact_phone || '',
            office_check_in_time: employee.office_check_in_time || '09:00',
            office_check_out_time: employee.office_check_out_time || '18:00',
            grace_period_minutes: employee.grace_period_minutes || 15,
            join_date: employee.join_date || employee.joining_date || '',
            base_salary: employee.base_salary || employee.salary || 0,
            currency: employee.currency || 'PKR',
            bank_account_number: employee.bank_account_number || '',
            bank_account_title: employee.bank_account_title || '',
            bank_name: employee.bank_name || '',
            salary_payment_day: employee.salary_payment_day || 25,
            is_active: employee.is_active !== false,
            role: employee.role || ''
        });
    }, [employee]);

    useEffect(() => {
        if (activeTab === 'Attendance') loadAttendance();
        if (activeTab === 'Movements') loadMovements();
        if (activeTab === 'Ledger') loadLedger();
        if (activeTab === 'Checkout Requests') loadCheckoutRequests();
        checkTodayAttendance();
    }, [activeTab]);

    useEffect(() => {
        // Load checkout requests on mount to show pending badges
        // Also check today's attendance to set correct check-in button state
        loadCheckoutRequests();
        checkTodayAttendance();
    }, []);

    const checkTodayAttendance = async () => {
        try {
            // Uses dedicated endpoint that queries attendance collection directly
            // by emp_id + today's date — no org_id filter, guaranteed to find the record.
            const record = await hrService.getTodayAttendance(employee.emp_id);
            // record.status === 'not_checked_in' means no record exists today
            const checkedIn = record.check_in && record.status !== 'not_checked_in';
            const checkedOut = record.check_out;
            // Show checkout button only if checked in AND not yet checked out
            setIsCheckedIn(!!checkedIn && !checkedOut);
        } catch (error) {
            console.error('Failed to check attendance status:', error);
            setIsCheckedIn(false);
        }
    };

    const loadCheckoutRequests = async () => {
        try {
            setLoading(true);
            const data = await hrService.getLeaveRequests({ emp_id: employee.emp_id, request_type: 'early_checkout' });
            setCheckoutRequests(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load checkout requests:', error);
            setCheckoutRequests([]);
        } finally {
            setLoading(false);
        }
    };

    const loadAttendance = async () => {
        try {
            setLoading(true);
            const data = await hrService.getAttendance({ emp_id: employee.emp_id });
            setAttendance(data);
        } catch (error) {
            console.error('Failed to load attendance:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMovements = async () => {
        try {
            setLoading(true);
            const data = await hrService.getMovements({ emp_id: employee.emp_id });
            setMovements(data);
        } catch (error) {
            console.error('Failed to load movements:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadLedger = async () => {
        try {
            setLoading(true);
            const data = await hrService.getEmployeeLedger(employee.emp_id);
            setLedger(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load ledger:', error);
            setLedger([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async () => {
        try {
            if (isCheckedIn) {
                // Check if early checkout
                const checkoutTimeStr = formData.office_check_out_time || '18:00';
                if (checkoutTimeStr && checkoutTimeStr.includes(':')) {
                    const now = new Date();
                    const [hours, minutes] = checkoutTimeStr.split(':').map(s => parseInt(s));
                    const expected = new Date();
                    expected.setHours(hours, minutes, 0, 0);

                    const minutesEarly = Math.floor((expected - now) / (1000 * 60));

                    if (minutesEarly > 15) {
                        // Show custom modal to enter reason
                        setEarlyCheckoutInfo({ minutes: minutesEarly });
                        setEarlyCheckoutReasonInput('');
                        setShowEarlyCheckoutReasonModal(true);
                        return;
                    }
                }

                const result = await hrService.checkOut(employee.emp_id);

                // Handle approval responses even for normal checkout (in case schedule changed)
                if (result.status === 'approval_required' || result.status === 'approval_pending') {
                    alert(`⏳ ${result.message}`);
                    checkTodayAttendance();
                } else {
                    alert('✓ Checked out successfully!');
                    setIsCheckedIn(false);
                }
            } else {
                await hrService.checkIn(employee.emp_id);
                alert('✓ Checked in successfully!');
                setIsCheckedIn(true);
            }
            onRefresh();
            if (activeTab === 'Attendance') {
                loadAttendance();
            }
        } catch (error) {
            alert('❌ Failed: ' + error.message);
        }
    };

    const handleStartMovement = async () => {
        try {
            await hrService.startMovement(employee.emp_id, 'Field Visit');
            alert('Movement started successfully!');
            onRefresh();
        } catch (error) {
            alert('Failed to start movement: ' + error.message);
        }
    };

    const handleSubmitProfileEarlyCheckout = async () => {
        if (!earlyCheckoutReasonInput || !earlyCheckoutReasonInput.trim()) {
            alert('⚠️ Reason is required for early checkout.');
            return;
        }

        try {
            const result = await hrService.checkOut(employee.emp_id, null, earlyCheckoutReasonInput.trim());

            // Handle approval responses
            if (result.status === 'approval_required' || result.status === 'approval_pending') {
                alert(`✓ ${result.message}\n\nYour request has been sent to your manager for approval.`);
                setShowEarlyCheckoutReasonModal(false);
                setEarlyCheckoutReasonInput('');
                loadCheckoutRequests(); // Always refresh to update sidebar badge
                checkTodayAttendance();
                return;
            }

            alert('✓ Checked out successfully!');
            setShowEarlyCheckoutReasonModal(false);
            setEarlyCheckoutReasonInput('');
            setIsCheckedIn(false);
            loadCheckoutRequests(); // Always refresh to update sidebar badge
            onRefresh();
        } catch (error) {
            alert('❌ Failed: ' + error.message);
        }
    };

    const handleSaveInfo = async () => {
        try {
            setIsSaving(true);
            await hrService.updateEmployee(employee.emp_id, formData);
            alert('Employee information updated successfully!');
            onRefresh();
        } catch (error) {
            alert('Failed to save: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const updateFormField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const TabButton = ({ label, icon: Icon, iconColor, active, onClick }) => (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 pb-3 px-2 text-sm font-bold border-b-2 transition-all whitespace-nowrap relative top-px ${active
                ? 'text-blue-600 border-blue-600'
                : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-200'
                }`}
        >
            {Icon && <Icon size={16} strokeWidth={2.5} className={iconColor || (active ? 'text-blue-600' : 'text-slate-400')} />}
            {label}
        </button>
    );

    const getInitials = (name) => {
        return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'NA';
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Top Actions Bar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 transition-all"
                    >
                        <ArrowLeft size={16} /> Back
                    </button>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight hidden sm:block">Employee Profile</h1>
                </div>

                <div className="flex items-center gap-3">
                    <button className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-2">
                        <Save size={16} /> Save
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-2">
                        More <ChevronDown size={16} />
                    </button>
                </div>
            </div>

            {/* Main Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left Column (Profile Summary) */}
                <div className="lg:col-span-4 bg-white rounded-3xl shadow-sm border border-slate-100/50 p-6 flex flex-col h-fit">

                    {/* Avatar & Name */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-xl font-black text-slate-600 border border-slate-100 shrink-0">
                            {getInitials(employee.name)}
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 leading-tight">{employee.name?.toUpperCase()}</h2>
                            <p className="text-xs text-slate-500 font-medium mt-1">Role: {employee.role?.toUpperCase() || 'EMPLOYEE'}</p>
                            <p className="text-xs text-slate-400 mt-0.5">Joined: {employee.joining_date ? new Date(employee.joining_date).toLocaleDateString() : 'N/A'}</p>
                        </div>
                    </div>

                    <hr className="border-slate-100 mb-6" />

                    {/* Details */}
                    <div className="space-y-4 mb-6">
                        <div>
                            <p className="text-sm font-bold text-slate-800 mb-0.5">First Name</p>
                            <p className="text-sm text-slate-600 font-medium">{formData.full_name?.split(' ')[0] || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-800 mb-0.5">Last Name</p>
                            <p className="text-sm text-slate-600 font-medium">{formData.full_name?.split(' ').slice(1).join(' ') || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-800 mb-0.5">Email</p>
                            <p className="text-sm text-slate-600 font-medium">{formData.email || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-800 mb-0.5">Phone</p>
                            <p className="text-sm text-slate-600 font-medium">{formData.phone || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-800 mb-0.5">WhatsApp</p>
                            <p className="text-sm text-slate-600 font-medium">{formData.whatsapp_number || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-800 mb-0.5">Address</p>
                            <p className="text-sm text-slate-600 font-medium">{formData.address || 'N/A'}</p>
                        </div>
                    </div>

                    <hr className="border-slate-100 mb-6" />

                    {/* Early Checkout Request Badge */}
                    {checkoutRequests.filter(r => r.status === 'pending').length > 0 && (
                        <div className="mb-6">
                            {checkoutRequests.filter(r => r.status === 'pending').slice(0, 1).map(request => (
                                <div key={request._id} className="bg-cyan-50 border border-cyan-200 rounded-xl p-3">
                                    <div className="flex items-start gap-2 mb-2">
                                        <div className="w-5 h-5 rounded bg-cyan-100 flex items-center justify-center shrink-0 mt-0.5">
                                            <Clock size={12} className="text-cyan-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-black text-cyan-900">Early checkout request submitted for approval</p>
                                        </div>
                                    </div>
                                    <div className="ml-7 space-y-1">
                                        <p className="text-[11px] text-cyan-700">
                                            <span className="font-bold">Reason:</span> {request.reason}
                                        </p>
                                        <p className="text-[11px] text-cyan-600">
                                            <span className="font-bold">Request ID:</span> #{request._id?.slice(-4)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="space-y-3 mb-6">
                        <p className="text-sm font-bold text-slate-800 mb-2">Quick Actions</p>

                        {/* Check In/Out Button with Approval Pending State */}
                        {checkoutRequests.filter(r => r.status === 'pending').length > 0 && isCheckedIn ? (
                            <button
                                disabled
                                className="w-full py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold shadow-md opacity-90 cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Clock size={16} className="text-orange-200" /> Checkout Pending Approval
                            </button>
                        ) : (
                            <button
                                onClick={handleCheckIn}
                                className={`w-full py-2.5 ${isCheckedIn ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2`}
                            >
                                <CheckSquare size={16} className={isCheckedIn ? 'text-red-400' : 'text-emerald-400'} /> {isCheckedIn ? 'Check Out' : 'Check In'}
                            </button>
                        )}

                        <button
                            onClick={handleStartMovement}
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                        >
                            <PersonStanding size={16} className="text-amber-400" /> Start Movement
                        </button>
                    </div>

                    <hr className="border-slate-100 mb-6" />

                    {/* Office Schedule */}
                    <div className="space-y-3 pb-2">
                        <p className="text-sm font-bold text-slate-800 mb-2">Office Schedule</p>
                        <div>
                            <p className="text-xs text-slate-500 font-medium mb-1">Check-in</p>
                            <p className="text-sm text-slate-800 font-semibold">{formData.office_check_in_time || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium mb-1">Check-out</p>
                            <p className="text-sm text-slate-800 font-semibold">{formData.office_check_out_time || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium mb-1">Grace</p>
                            <p className="text-sm text-slate-800 font-semibold">{formData.grace_period_minutes || 15} min</p>
                        </div>
                    </div>
                </div>

                {/* Right Column (Tabs & Forms) */}
                <div className="lg:col-span-8 bg-white rounded-3xl shadow-sm border border-slate-100/50 flex flex-col">

                    {/* Tabs */}
                    <div className="px-6 pt-6 border-b border-slate-100 flex gap-4 overflow-x-auto no-scrollbar">
                        <TabButton
                            label="Info"
                            active={activeTab === 'Info'}
                            onClick={() => setActiveTab('Info')}
                        />
                        <TabButton
                            label="Checkout Requests"
                            icon={Clock}
                            iconColor="text-slate-400"
                            active={activeTab === 'Checkout Requests'}
                            onClick={() => setActiveTab('Checkout Requests')}
                        />
                        <TabButton
                            label="Ledger"
                            icon={BookOpen}
                            iconColor="text-amber-400"
                            active={activeTab === 'Ledger'}
                            onClick={() => setActiveTab('Ledger')}
                        />
                        <TabButton
                            label="Commissions"
                            icon={BadgeDollarSign}
                            iconColor="text-emerald-500"
                            active={activeTab === 'Commissions'}
                            onClick={() => setActiveTab('Commissions')}
                        />
                        <TabButton
                            label="Attendance"
                            icon={Calendar}
                            iconColor="text-blue-500"
                            active={activeTab === 'Attendance'}
                            onClick={() => setActiveTab('Attendance')}
                        />
                        <TabButton
                            label="Movements"
                            icon={PersonStanding}
                            iconColor="text-orange-500"
                            active={activeTab === 'Movements'}
                            onClick={() => setActiveTab('Movements')}
                        />
                    </div>

                    {/* Tab Content */}
                    <div className="p-8 flex-1 overflow-y-auto">
                        {activeTab === 'Info' && (
                            <div className="animate-in fade-in duration-300">

                                {/* Header with Edit Button */}
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-black text-slate-800">Personal Information</h3>
                                    {!isEditMode && (
                                        <button
                                            onClick={() => setIsEditMode(true)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-sm shadow-md transition-all flex items-center gap-2"
                                        >
                                            <Edit size={16} /> Edit
                                        </button>
                                    )}
                                </div>

                                {!isEditMode ? (
                                    // View Mode - Display only 4 fields
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <p className="text-xs font-bold text-slate-600 mb-2">First Name</p>
                                                <p className="text-base font-bold text-slate-800">{formData.full_name?.split(' ')[0] || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-600 mb-2">Last Name</p>
                                                <p className="text-base font-bold text-slate-800">{formData.full_name?.split(' ').slice(1).join(' ') || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-600 mb-2">Email</p>
                                                <p className="text-base font-bold text-slate-800">{formData.email || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-600 mb-2">Phone</p>
                                                <p className="text-base font-bold text-slate-800">{formData.phone || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    // Edit Mode - Editable form with all fields
                                    <div className="space-y-8">
                                        {/* Personal Information */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-slate-600 ml-1">First Name</label>
                                                <input
                                                    type="text"
                                                    value={formData.full_name?.split(' ')[0] || ''}
                                                    onChange={(e) => {
                                                        const lastName = formData.full_name?.split(' ').slice(1).join(' ') || '';
                                                        updateFormField('full_name', `${e.target.value} ${lastName}`.trim());
                                                    }}
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-slate-600 ml-1">Last Name</label>
                                                <input
                                                    type="text"
                                                    value={formData.full_name?.split(' ').slice(1).join(' ') || ''}
                                                    onChange={(e) => {
                                                        const firstName = formData.full_name?.split(' ')[0] || '';
                                                        updateFormField('full_name', `${firstName} ${e.target.value}`.trim());
                                                    }}
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-slate-600 ml-1">Email</label>
                                                <input
                                                    type="email"
                                                    value={formData.email || ''}
                                                    onChange={(e) => updateFormField('email', e.target.value)}
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-slate-600 ml-1">Phone</label>
                                                <input
                                                    type="tel"
                                                    value={formData.phone || ''}
                                                    onChange={(e) => updateFormField('phone', e.target.value)}
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-slate-600 ml-1">WhatsApp Number</label>
                                                <input
                                                    type="tel"
                                                    value={formData.whatsapp_number || ''}
                                                    onChange={(e) => updateFormField('whatsapp_number', e.target.value)}
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-slate-600 ml-1">Other Contact Number</label>
                                                <input
                                                    type="tel"
                                                    value={formData.other_contact_number || ''}
                                                    onChange={(e) => updateFormField('other_contact_number', e.target.value)}
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                                />
                                            </div>
                                            <div className="space-y-1.5 md:col-span-2">
                                                <label className="text-xs font-bold text-slate-600 ml-1">Address</label>
                                                <input
                                                    type="text"
                                                    value={formData.address || ''}
                                                    onChange={(e) => updateFormField('address', e.target.value)}
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                                />
                                            </div>
                                        </div>

                                        {/* Emergency Contact */}
                                        <div className="border-t border-slate-100 pt-8 mb-8">
                                            <h3 className="text-lg font-black text-slate-800 mb-6">Emergency Contact</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-slate-600 ml-1">Contact Name</label>
                                                    <input
                                                        type="text"
                                                        value={formData.emergency_contact_name || ''}
                                                        onChange={(e) => updateFormField('emergency_contact_name', e.target.value)}
                                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-slate-600 ml-1">Contact Phone</label>
                                                    <input
                                                        type="tel"
                                                        value={formData.emergency_contact_phone || ''}
                                                        onChange={(e) => updateFormField('emergency_contact_phone', e.target.value)}
                                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Role & Organization */}
                                        <div className="border-t border-slate-100 pt-8 mb-8">
                                            <h3 className="text-lg font-black text-slate-800 mb-6">Role & Organization</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-slate-600 ml-1">Role</label>
                                                    <input
                                                        type="text"
                                                        value={formData.role || ''}
                                                        disabled
                                                        className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 cursor-not-allowed shadow-sm"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-slate-600 ml-1">Commission Group (%)</label>
                                                    <input
                                                        type="text"
                                                        value={employee.commission_percentage || '0'}
                                                        disabled
                                                        className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 cursor-not-allowed shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Office Schedule */}
                                        <div className="border-t border-slate-100 pt-8 mb-8">
                                            <h3 className="text-lg font-black text-slate-800 mb-6">Office Schedule</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-slate-600 ml-1">Check-In Time</label>
                                                    <input
                                                        type="time"
                                                        value={formData.office_check_in_time || ''}
                                                        onChange={(e) => updateFormField('office_check_in_time', e.target.value)}
                                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-slate-600 ml-1">Check-Out Time</label>
                                                    <input
                                                        type="time"
                                                        value={formData.office_check_out_time || ''}
                                                        onChange={(e) => updateFormField('office_check_out_time', e.target.value)}
                                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-slate-600 ml-1">Grace Minutes</label>
                                                    <input
                                                        type="number"
                                                        value={formData.grace_period_minutes || ''}
                                                        onChange={(e) => updateFormField('grace_period_minutes', parseInt(e.target.value) || 0)}
                                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                                        min="0"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Salary Information */}
                                        <div className="border-t border-slate-100 pt-8 mb-8">
                                            <h3 className="text-lg font-black text-slate-800 mb-6">Salary Information</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-slate-600 ml-1">Joining Date</label>
                                                    <input
                                                        type="date"
                                                        value={formData.join_date || ''}
                                                        onChange={(e) => updateFormField('join_date', e.target.value)}
                                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-slate-600 ml-1">Base Salary</label>
                                                    <input
                                                        type="number"
                                                        value={formData.base_salary || ''}
                                                        onChange={(e) => updateFormField('base_salary', parseFloat(e.target.value) || 0)}
                                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                                        min="0"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-slate-600 ml-1">Currency</label>
                                                    <div className="relative">
                                                        <select
                                                            value={formData.currency || 'PKR'}
                                                            onChange={(e) => updateFormField('currency', e.target.value)}
                                                            className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer shadow-sm"
                                                        >
                                                            <option value="PKR">PKR</option>
                                                            <option value="USD">USD</option>
                                                            <option value="EUR">EUR</option>
                                                            <option value="GBP">GBP</option>
                                                        </select>
                                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-slate-600 ml-1">Payment Day (1-31)</label>
                                                    <input
                                                        type="number"
                                                        value={formData.salary_payment_day || ''}
                                                        onChange={(e) => updateFormField('salary_payment_day', parseInt(e.target.value) || 1)}
                                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                                        min="1"
                                                        max="31"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bank Details */}
                                        <div className="border-t border-slate-100 pt-8 mb-8">
                                            <h3 className="text-lg font-black text-slate-800 mb-6">Bank Details</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-slate-600 ml-1">Account Number</label>
                                                    <input
                                                        type="text"
                                                        value={formData.bank_account_number || ''}
                                                        onChange={(e) => updateFormField('bank_account_number', e.target.value)}
                                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-slate-600 ml-1">Account Title</label>
                                                    <input
                                                        type="text"
                                                        value={formData.bank_account_title || ''}
                                                        onChange={(e) => updateFormField('bank_account_title', e.target.value)}
                                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                                    />
                                                </div>
                                                <div className="space-y-1.5 md:col-span-2">
                                                    <label className="text-xs font-bold text-slate-600 ml-1">Bank Name</label>
                                                    <input
                                                        type="text"
                                                        value={formData.bank_name || ''}
                                                        onChange={(e) => updateFormField('bank_name', e.target.value)}
                                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Active Status */}
                                        <div className="border-t border-slate-100 pt-8 mb-8">
                                            <label className="flex items-center space-x-3">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.is_active || false}
                                                    onChange={(e) => updateFormField('is_active', e.target.checked)}
                                                    className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 focus:ring-2"
                                                />
                                                <span className="text-sm font-bold text-slate-800">Active Employee</span>
                                            </label>
                                        </div>

                                        {/* Save and Cancel Buttons */}
                                        <div className="border-t border-slate-100 pt-8 flex justify-end gap-3">
                                            <button
                                                onClick={() => {
                                                    setIsEditMode(false);
                                                    // Reset form data to original employee data
                                                    setFormData({
                                                        full_name: employee.full_name || employee.name || '',
                                                        email: employee.email || '',
                                                        phone: employee.phone || '',
                                                        whatsapp_number: employee.whatsapp_number || '',
                                                        other_contact_number: employee.other_contact_number || '',
                                                        address: employee.address || '',
                                                        emergency_contact_name: employee.emergency_contact_name || '',
                                                        emergency_contact_phone: employee.emergency_contact_phone || '',
                                                        office_check_in_time: employee.office_check_in_time || '09:00',
                                                        office_check_out_time: employee.office_check_out_time || '18:00',
                                                        grace_period_minutes: employee.grace_period_minutes || 15,
                                                        join_date: employee.join_date || employee.joining_date || '',
                                                        base_salary: employee.base_salary || employee.salary || 0,
                                                        currency: employee.currency || 'PKR',
                                                        bank_account_number: employee.bank_account_number || '',
                                                        bank_account_title: employee.bank_account_title || '',
                                                        bank_name: employee.bank_name || '',
                                                        salary_payment_day: employee.salary_payment_day || 25,
                                                        is_active: employee.is_active !== false,
                                                        role: employee.role || ''
                                                    });
                                                }}
                                                className="px-6 py-3 bg-slate-200 text-slate-800 rounded-xl hover:bg-slate-300 font-bold text-sm shadow-md transition-all"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    await handleSaveInfo();
                                                    setIsEditMode(false);
                                                }}
                                                disabled={isSaving}
                                                className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-sm shadow-lg shadow-blue-600/30 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
                                            >
                                                {isSaving ? 'Saving...' : 'Save Changes'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'Checkout Requests' && (
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-black text-slate-800">Early Checkout Requests</h3>
                                    <button
                                        onClick={loadCheckoutRequests}
                                        disabled={loading}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-sm shadow-md transition-all disabled:opacity-50"
                                    >
                                        {loading ? 'Loading...' : 'Refresh'}
                                    </button>
                                </div>

                                {checkoutRequests.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-64 text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                            <Clock className="text-slate-300" size={32} />
                                        </div>
                                        <h4 className="text-base font-bold text-slate-800 mb-1">No checkout requests</h4>
                                        <p className="text-sm text-slate-500">There are currently no early checkout requests.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-slate-100">
                                                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Date</th>
                                                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Check-Out Time</th>
                                                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Reason</th>
                                                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
                                                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Approved By</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {checkoutRequests.map((request, idx) => (
                                                    <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                        <td className="py-4 px-4 text-sm font-semibold text-slate-800">
                                                            {new Date(request.request_date || request.created_at).toLocaleDateString()}
                                                        </td>
                                                        <td className="py-4 px-4 text-sm text-slate-600">
                                                            {request.early_checkout_time || 'N/A'}
                                                        </td>
                                                        <td className="py-4 px-4 text-sm text-slate-600 max-w-xs truncate">
                                                            {request.reason || 'No reason provided'}
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${request.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                                request.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                                    'bg-yellow-100 text-yellow-700'
                                                                }`}>
                                                                {request.status || 'pending'}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-4 text-sm text-slate-600">
                                                            {request.approved_by || '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'Ledger' && (
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-black text-slate-800">Employee Ledger</h3>
                                    <button
                                        onClick={loadLedger}
                                        disabled={loading}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-sm shadow-md transition-all disabled:opacity-50"
                                    >
                                        {loading ? 'Loading...' : 'Refresh'}
                                    </button>
                                </div>
                                {loading ? (
                                    <div className="flex justify-center py-12">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : ledger.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-64 text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                            <BookOpen className="text-slate-300" size={32} />
                                        </div>
                                        <h4 className="text-base font-bold text-slate-800 mb-1">No data available</h4>
                                        <p className="text-sm text-slate-500">There are currently no ledger entries.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full">
                                            <thead>
                                                <tr className="border-b-2 border-slate-200">
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600">Date</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600">Type</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600">Description</th>
                                                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-600">Debit</th>
                                                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-600">Credit</th>
                                                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-600">Balance</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {ledger.map((entry, index) => (
                                                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-4 py-3 text-sm text-slate-900">{new Date(entry.date).toLocaleDateString()}</td>
                                                        <td className="px-4 py-3 text-sm text-slate-900">{entry.type}</td>
                                                        <td className="px-4 py-3 text-sm text-slate-600">{entry.description}</td>
                                                        <td className="px-4 py-3 text-sm text-right text-red-600 font-semibold">{entry.debit ? `PKR ${entry.debit.toLocaleString()}` : '-'}</td>
                                                        <td className="px-4 py-3 text-sm text-right text-green-600 font-semibold">{entry.credit ? `PKR ${entry.credit.toLocaleString()}` : '-'}</td>
                                                        <td className="px-4 py-3 text-sm text-right font-bold text-slate-900">{`PKR ${entry.balance.toLocaleString()}`}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'Commissions' && (
                            <div>
                                <h3 className="text-lg font-black text-slate-800 mb-6">My Commissions</h3>

                                {/* Commission Stats Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    {/* Total Earned */}
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                        <p className="text-sm font-bold text-slate-500 mb-2">Total Earned</p>
                                        <p className="text-2xl font-black text-slate-800">PKR 0</p>
                                    </div>

                                    {/* Paid */}
                                    <div className="bg-emerald-600 p-6 rounded-2xl">
                                        <p className="text-sm font-bold text-white/80 mb-2">Paid</p>
                                        <p className="text-2xl font-black text-white">PKR 0</p>
                                    </div>

                                    {/* Unpaid */}
                                    <div className="bg-amber-400 p-6 rounded-2xl">
                                        <p className="text-sm font-bold text-amber-900/70 mb-2">Unpaid</p>
                                        <p className="text-2xl font-black text-amber-900">PKR 0</p>
                                    </div>
                                </div>

                                {/* Empty State */}
                                <div className="flex items-center justify-center py-16 text-center">
                                    <p className="text-sm font-medium text-slate-500">No commission records found</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'Attendance' && (
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-black text-slate-800">Attendance Records</h3>
                                    <button
                                        onClick={handleCheckIn}
                                        className={`px-4 py-2 ${isCheckedIn ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2`}
                                    >
                                        <Clock size={18} />
                                        {isCheckedIn ? 'Check Out' : 'Check In'}
                                    </button>
                                </div>
                                {loading ? (
                                    <div className="flex justify-center py-12">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                                    </div>
                                ) : attendance.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-64 text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                            <Calendar className="text-slate-300" size={32} />
                                        </div>
                                        <h4 className="text-base font-bold text-slate-800 mb-1">No data available</h4>
                                        <p className="text-sm text-slate-500">There are currently no attendance records.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full">
                                            <thead>
                                                <tr className="border-b-2 border-slate-200">
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600">Date</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600">Check In</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600">Check Out</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600">Hours</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {attendance.map((record, index) => (
                                                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">{new Date(record.date).toLocaleDateString()}</td>
                                                        <td className="px-4 py-3 text-sm text-slate-600">{record.check_in_time || '-'}</td>
                                                        <td className="px-4 py-3 text-sm text-slate-600">{record.check_out_time || '-'}</td>
                                                        <td className="px-4 py-3 text-sm text-slate-600">{record.total_hours || '-'}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${record.status === 'present' ? 'bg-green-50 text-green-700 border border-green-100' :
                                                                record.status === 'late' ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' :
                                                                    record.status === 'absent' ? 'bg-red-50 text-red-700 border border-red-100' :
                                                                        'bg-slate-50 text-slate-700 border border-slate-100'
                                                                }`}>
                                                                {record.status?.toUpperCase()}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'Movements' && (
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-black text-slate-800">Movement Records</h3>
                                    <button
                                        onClick={handleStartMovement}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-sm shadow-md transition-all flex items-center gap-2"
                                    >
                                        <MapPin size={18} />
                                        Start Movement
                                    </button>
                                </div>
                                {loading ? (
                                    <div className="flex justify-center py-12">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : movements.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-64 text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                            <PersonStanding className="text-slate-300" size={32} />
                                        </div>
                                        <h4 className="text-base font-bold text-slate-800 mb-1">No data available</h4>
                                        <p className="text-sm text-slate-500">There are currently no movement records.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full">
                                            <thead>
                                                <tr className="border-b-2 border-slate-200">
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600">Date</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600">Start Time</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600">End Time</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600">Reason</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {movements.map((movement, index) => (
                                                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">{new Date(movement.start_time).toLocaleDateString()}</td>
                                                        <td className="px-4 py-3 text-sm text-slate-600">{new Date(movement.start_time).toLocaleTimeString()}</td>
                                                        <td className="px-4 py-3 text-sm text-slate-600">{movement.end_time ? new Date(movement.end_time).toLocaleTimeString() : 'Ongoing'}</td>
                                                        <td className="px-4 py-3 text-sm text-slate-600">{movement.reason || 'N/A'}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${movement.status === 'ended' ? 'bg-green-50 text-green-700 border border-green-100' :
                                                                movement.status === 'active' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                                                    'bg-slate-50 text-slate-700 border border-slate-100'
                                                                }`}>
                                                                {movement.status?.toUpperCase()}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Early Checkout Reason Modal */}
            <Modal
                isOpen={showEarlyCheckoutReasonModal}
                onClose={() => { setShowEarlyCheckoutReasonModal(false); setEarlyCheckoutReasonInput(''); }}
                title="Early Checkout Detected"
            >
                <div className="space-y-4">
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                                <span className="text-xl">⚠️</span>
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-orange-900 mb-1">Approval Required</h4>
                                <p className="text-xs text-orange-700">
                                    You are checking out <strong>{earlyCheckoutInfo.minutes} minutes early</strong>.
                                    This requires manager approval.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">
                            Reason for Early Checkout *
                        </label>
                        <textarea
                            value={earlyCheckoutReasonInput}
                            onChange={(e) => setEarlyCheckoutReasonInput(e.target.value)}
                            placeholder="e.g., Medical appointment, family emergency, personal matters..."
                            rows={4}
                            autoFocus
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className="text-[11px] text-slate-500 mt-1">
                            Your manager will review this request before approving the early checkout.
                        </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={() => { setShowEarlyCheckoutReasonModal(false); setEarlyCheckoutReasonInput(''); }}
                            className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmitProfileEarlyCheckout}
                            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black transition-colors"
                        >
                            Submit Request
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

