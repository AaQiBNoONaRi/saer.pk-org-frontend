import React, { useState, useMemo } from 'react';
import {
    Users, Calendar, MapPin, DollarSign, BarChart2,
    CheckSquare, CreditCard, Search, Filter, ChevronDown,
    Clock, CheckCircle, XCircle, AlertCircle, TrendingUp,
    ArrowUpRight, ArrowDownRight, Award, Star,
} from 'lucide-react';

// ─── Fake data ────────────────────────────────────────────────────────────────
const EMPLOYEES = [
    { id: 1, emp_id: 'ORG-AHMED-1234', name: 'Ahmed Raza', email: 'ahmed@org.pk', role: 'ORGANIZATION_EMPLOYEE', phone: '+92 300 1111111', status: 'active', joinDate: '2024-01-15', salary: 55000, department: 'Sales' },
    { id: 2, emp_id: 'ORG-SARA-5678', name: 'Sara Khan', email: 'sara@org.pk', role: 'ORGANIZATION_ADMIN', phone: '+92 300 2222222', status: 'active', joinDate: '2023-06-10', salary: 80000, department: 'Management' },
    { id: 3, emp_id: 'ORG-BILAL-9012', name: 'Bilal Malik', email: 'bilal@org.pk', role: 'ORGANIZATION_EMPLOYEE', phone: '+92 300 3333333', status: 'active', joinDate: '2024-03-01', salary: 50000, department: 'CRM' },
    { id: 4, emp_id: 'ORG-HINA-3456', name: 'Hina Butt', email: 'hina@org.pk', role: 'ORGANIZATION_EMPLOYEE', phone: '+92 300 4444444', status: 'inactive', joinDate: '2022-11-20', salary: 48000, department: 'Operations' },
];

const ATTENDANCE = [
    { id: 1, emp: 'Ahmed Raza', empId: 'ORG-AHMED-1234', date: '2026-02-22', checkIn: '09:02', checkOut: '18:05', status: 'on_time', hours: '9h 3m', approved: true },
    { id: 2, emp: 'Sara Khan', empId: 'ORG-SARA-5678', date: '2026-02-22', checkIn: '09:25', checkOut: '18:00', status: 'grace', hours: '8h 35m', approved: true },
    { id: 3, emp: 'Bilal Malik', empId: 'ORG-BILAL-9012', date: '2026-02-22', checkIn: '10:15', checkOut: '17:30', status: 'late', hours: '7h 15m', approved: false },
    { id: 4, emp: 'Hina Butt', empId: 'ORG-HINA-3456', date: '2026-02-22', checkIn: null, checkOut: null, status: 'absent', hours: '—', approved: false },
    { id: 5, emp: 'Ahmed Raza', empId: 'ORG-AHMED-1234', date: '2026-02-21', checkIn: '08:58', checkOut: '18:02', status: 'on_time', hours: '9h 4m', approved: true },
    { id: 6, emp: 'Sara Khan', empId: 'ORG-SARA-5678', date: '2026-02-21', checkIn: '09:10', checkOut: '18:00', status: 'on_time', hours: '8h 50m', approved: true },
    { id: 7, emp: 'Bilal Malik', empId: 'ORG-BILAL-9012', date: '2026-02-21', checkIn: '09:45', checkOut: '16:00', status: 'late', hours: '6h 15m', approved: false },
];

const MOVEMENTS = [
    { id: 1, emp: 'Ahmed Raza', empId: 'ORG-AHMED-1234', type: 'field_visit', destination: 'Airport Branch', date: '2026-02-22', timeOut: '11:00', timeIn: '13:30', purpose: 'Client meeting', status: 'approved' },
    { id: 2, emp: 'Bilal Malik', empId: 'ORG-BILAL-9012', type: 'leave', destination: 'N/A', date: '2026-02-23', timeOut: '09:00', timeIn: '18:00', purpose: 'Annual leave requested', status: 'pending' },
    { id: 3, emp: 'Hina Butt', empId: 'ORG-HINA-3456', type: 'early_exit', destination: 'Home', date: '2026-02-20', timeOut: '15:00', timeIn: '—', purpose: 'Medical appointment', status: 'approved' },
    { id: 4, emp: 'Sara Khan', empId: 'ORG-SARA-5678', type: 'field_visit', destination: 'Head Office', date: '2026-02-19', timeOut: '10:00', timeIn: '16:00', purpose: 'Management review', status: 'approved' },
];

const COMMISSIONS = [
    { id: 1, emp: 'Ahmed Raza', empId: 'ORG-AHMED-1234', month: 'Feb 2026', bookings: 12, totalRevenue: 450000, commissionRate: '5%', earned: 22500, paid: 22500, status: 'paid' },
    { id: 2, emp: 'Sara Khan', empId: 'ORG-SARA-5678', month: 'Feb 2026', bookings: 8, totalRevenue: 600000, commissionRate: '3%', earned: 18000, paid: 0, status: 'pending' },
    { id: 3, emp: 'Bilal Malik', empId: 'ORG-BILAL-9012', month: 'Feb 2026', bookings: 5, totalRevenue: 180000, commissionRate: '5%', earned: 9000, paid: 9000, status: 'paid' },
    { id: 4, emp: 'Ahmed Raza', empId: 'ORG-AHMED-1234', month: 'Jan 2026', bookings: 15, totalRevenue: 520000, commissionRate: '5%', earned: 26000, paid: 26000, status: 'paid' },
    { id: 5, emp: 'Sara Khan', empId: 'ORG-SARA-5678', month: 'Jan 2026', bookings: 10, totalRevenue: 730000, commissionRate: '3%', earned: 21900, paid: 21900, status: 'paid' },
];

const PUNCTUALITY = [
    { id: 1, emp: 'Ahmed Raza', empId: 'ORG-AHMED-1234', totalDays: 20, onTime: 16, grace: 2, late: 2, absent: 0, score: 90, trend: 'up' },
    { id: 2, emp: 'Sara Khan', empId: 'ORG-SARA-5678', totalDays: 20, onTime: 18, grace: 1, late: 1, absent: 0, score: 95, trend: 'up' },
    { id: 3, emp: 'Bilal Malik', empId: 'ORG-BILAL-9012', totalDays: 20, onTime: 10, grace: 3, late: 6, absent: 1, score: 62, trend: 'down' },
    { id: 4, emp: 'Hina Butt', empId: 'ORG-HINA-3456', totalDays: 20, onTime: 8, grace: 2, late: 4, absent: 6, score: 45, trend: 'down' },
];

const APPROVALS = [
    { id: 1, emp: 'Bilal Malik', empId: 'ORG-BILAL-9012', type: 'late_checkin', date: '2026-02-21', detail: 'Late by 45 min — traffic jam', status: 'pending' },
    { id: 2, emp: 'Bilal Malik', empId: 'ORG-BILAL-9012', type: 'leave', date: '2026-02-23', detail: 'Annual leave — 1 day', status: 'pending' },
    { id: 3, emp: 'Hina Butt', empId: 'ORG-HINA-3456', type: 'early_checkout', date: '2026-02-20', detail: 'Early checkout 15:00 — medical appt', status: 'approved' },
    { id: 4, emp: 'Ahmed Raza', empId: 'ORG-AHMED-1234', type: 'overtime', date: '2026-02-18', detail: 'Overtime 2h — client deliverable', status: 'approved' },
];

const PAYMENTS = [
    { id: 1, emp: 'Ahmed Raza', empId: 'ORG-AHMED-1234', month: 'Feb 2026', baseSalary: 55000, commission: 22500, deductions: 2000, net: 75500, status: 'paid', paidOn: '2026-02-01' },
    { id: 2, emp: 'Sara Khan', empId: 'ORG-SARA-5678', month: 'Feb 2026', baseSalary: 80000, commission: 0, deductions: 3000, net: 77000, status: 'pending', paidOn: null },
    { id: 3, emp: 'Bilal Malik', empId: 'ORG-BILAL-9012', month: 'Feb 2026', baseSalary: 50000, commission: 9000, deductions: 4500, net: 54500, status: 'pending', paidOn: null },
    { id: 4, emp: 'Ahmed Raza', empId: 'ORG-AHMED-1234', month: 'Jan 2026', baseSalary: 55000, commission: 26000, deductions: 2000, net: 79000, status: 'paid', paidOn: '2026-01-01' },
    { id: 5, emp: 'Sara Khan', empId: 'ORG-SARA-5678', month: 'Jan 2026', baseSalary: 80000, commission: 21900, deductions: 3000, net: 98900, status: 'paid', paidOn: '2026-01-01' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
};
const MOVE_TYPE_MAP = { field_visit: { label: 'Field Visit', cls: 'bg-blue-100 text-blue-700' }, leave: { label: 'Leave', cls: 'bg-purple-100 text-purple-700' }, early_exit: { label: 'Early Exit', cls: 'bg-orange-100 text-orange-700' } };
const MOVE_STATUS_MAP = { approved: { label: 'Approved', cls: 'bg-green-100 text-green-700' }, pending: { label: 'Pending', cls: 'bg-yellow-100 text-yellow-700' }, rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-700' } };
const APPR_TYPE_MAP = { late_checkin: { label: 'Late Check-In', cls: 'bg-orange-100 text-orange-700' }, leave: { label: 'Leave', cls: 'bg-purple-100 text-purple-700' }, early_checkout: { label: 'Early Exit', cls: 'bg-yellow-100 text-yellow-700' }, overtime: { label: 'Overtime', cls: 'bg-blue-100 text-blue-700' } };
const PAY_STATUS_MAP = { paid: { label: 'Paid', cls: 'bg-green-100 text-green-700' }, pending: { label: 'Pending', cls: 'bg-yellow-100 text-yellow-700' } };
const COMM_STATUS_MAP = { paid: { label: 'Paid', cls: 'bg-green-100 text-green-700' }, pending: { label: 'Pending', cls: 'bg-yellow-100 text-yellow-700' } };

const pkr = n => `PKR ${n?.toLocaleString() || 0}`;

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

// ─── Toolbar ──────────────────────────────────────────────────────────────────
const Toolbar = ({ search, setSearch, placeholder = 'Search…', children }) => (
    <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[180px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100"
            />
        </div>
        {children}
    </div>
);

const Select = ({ value, onChange, options, label }) => (
    <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black text-slate-600 outline-none focus:ring-2 focus:ring-blue-100">
            <option value="">{label}</option>
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
);

// ─── Table wrapper ────────────────────────────────────────────────────────────
const Table = ({ cols, children, empty = 'No records found.' }) => (
    <div className="overflow-x-auto rounded-2xl border border-slate-100">
        <table className="w-full text-sm min-w-max">
            <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                    {cols.map(c => (
                        <th key={c} className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">{c}</th>
                    ))}
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {React.Children.count(children) === 0
                    ? <tr><td colSpan={cols.length} className="px-4 py-10 text-center text-slate-400 text-xs font-bold">{empty}</td></tr>
                    : children}
            </tbody>
        </table>
    </div>
);

const Td = ({ children, className = '' }) => (
    <td className={`px-4 py-3 whitespace-nowrap ${className}`}>{children}</td>
);

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
    { key: 'employees', label: 'Employees', icon: Users },
    { key: 'attendance', label: 'Attendance', icon: Calendar },
    { key: 'movements', label: 'Movements', icon: MapPin },
    { key: 'commissions', label: 'Commissions', icon: DollarSign },
    { key: 'punctuality', label: 'Punctuality', icon: BarChart2 },
    { key: 'approvals', label: 'Approvals', icon: CheckSquare },
    { key: 'payments', label: 'Payments', icon: CreditCard },
];

// ══════════════════════════════════════════════════════════════════════════════
// SECTION COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

// ① Employees ─────────────────────────────────────────────────────────────────
function EmployeesTab() {
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const rows = useMemo(() => EMPLOYEES.filter(e => {
        const q = search.toLowerCase();
        const matchQ = !q || e.name.toLowerCase().includes(q) || e.emp_id.toLowerCase().includes(q) || e.email.toLowerCase().includes(q);
        const matchR = !roleFilter || e.role === roleFilter;
        const matchS = !statusFilter || e.status === statusFilter;
        return matchQ && matchR && matchS;
    }), [search, roleFilter, statusFilter]);

    const active = EMPLOYEES.filter(e => e.status === 'active').length;

    return (
        <section>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Stat label="Total" value={EMPLOYEES.length} icon={Users} color="bg-blue-50 text-blue-700 border-blue-100" />
                <Stat label="Active" value={active} icon={CheckCircle} color="bg-green-50 text-green-700 border-green-100" />
                <Stat label="Inactive" value={EMPLOYEES.length - active} icon={XCircle} color="bg-red-50 text-red-700 border-red-100" />
                <Stat label="Departments" value={[...new Set(EMPLOYEES.map(e => e.department))].length} icon={Award} color="bg-purple-50 text-purple-700 border-purple-100" />
            </div>

            <Toolbar search={search} setSearch={setSearch} placeholder="Search employees…">
                <Select value={roleFilter} onChange={setRoleFilter} label="All Roles"
                    options={[{ value: 'ORGANIZATION_ADMIN', label: 'Org Admin' }, { value: 'ORGANIZATION_EMPLOYEE', label: 'Org Employee' }]} />
                <Select value={statusFilter} onChange={setStatusFilter} label="All Status"
                    options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
            </Toolbar>

            <Table cols={['Employee', 'Role', 'Department', 'Phone', 'Salary', 'Join Date', 'Status']}>
                {rows.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                        <Td>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center text-xs font-black shrink-0">
                                    {e.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-black text-slate-800 text-xs">{e.name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold">{e.emp_id}</p>
                                </div>
                            </div>
                        </Td>
                        <Td><span className="text-[10px] font-black text-slate-600">{e.role.replace(/_/g, ' ')}</span></Td>
                        <Td><span className="text-xs font-bold text-slate-600">{e.department}</span></Td>
                        <Td><span className="text-xs font-bold text-slate-600">{e.phone}</span></Td>
                        <Td><span className="text-xs font-black text-slate-800">{pkr(e.salary)}</span></Td>
                        <Td><span className="text-xs font-bold text-slate-500">{e.joinDate}</span></Td>
                        <Td>{statusBadge(e.status, { active: { label: 'Active', cls: 'bg-green-100 text-green-700' }, inactive: { label: 'Inactive', cls: 'bg-red-100 text-red-600' } })}</Td>
                    </tr>
                ))}
            </Table>
        </section>
    );
}

// ② Attendance ────────────────────────────────────────────────────────────────
function AttendanceTab() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');

    const rows = useMemo(() => ATTENDANCE.filter(r => {
        const matchQ = !search || r.emp.toLowerCase().includes(search.toLowerCase()) || r.empId.toLowerCase().includes(search.toLowerCase());
        const matchS = !statusFilter || r.status === statusFilter;
        const matchD = !dateFilter || r.date === dateFilter;
        return matchQ && matchS && matchD;
    }), [search, statusFilter, dateFilter]);

    const today = ATTENDANCE.filter(r => r.date === '2026-02-22');
    const onTime = today.filter(r => r.status === 'on_time').length;
    const late = today.filter(r => r.status === 'late').length;
    const absent = today.filter(r => r.status === 'absent').length;

    return (
        <section>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Stat label="Present Today" value={today.filter(r => r.status !== 'absent').length} icon={CheckCircle} color="bg-green-50 text-green-700 border-green-100" />
                <Stat label="On Time" value={onTime} icon={Clock} color="bg-blue-50 text-blue-700 border-blue-100" />
                <Stat label="Late" value={late} icon={AlertCircle} color="bg-orange-50 text-orange-700 border-orange-100" />
                <Stat label="Absent" value={absent} icon={XCircle} color="bg-red-50 text-red-700 border-red-100" />
            </div>

            <Toolbar search={search} setSearch={setSearch} placeholder="Search employee…">
                <Select value={statusFilter} onChange={setStatusFilter} label="All Status"
                    options={[{ value: 'on_time', label: 'On Time' }, { value: 'grace', label: 'Grace' }, { value: 'late', label: 'Late' }, { value: 'absent', label: 'Absent' }]} />
                <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
                    className="px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black text-slate-600 outline-none focus:ring-2 focus:ring-blue-100" />
            </Toolbar>

            <Table cols={['Employee', 'Date', 'Check In', 'Check Out', 'Hours', 'Status', 'Approved']}>
                {rows.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                        <Td>
                            <div>
                                <p className="font-black text-slate-800 text-xs">{r.emp}</p>
                                <p className="text-[10px] text-slate-400 font-bold">{r.empId}</p>
                            </div>
                        </Td>
                        <Td><span className="text-xs font-bold text-slate-600">{r.date}</span></Td>
                        <Td><span className={`text-xs font-black ${r.checkIn ? 'text-green-600' : 'text-slate-400'}`}>{r.checkIn || '—'}</span></Td>
                        <Td><span className={`text-xs font-black ${r.checkOut ? 'text-blue-600' : 'text-slate-400'}`}>{r.checkOut || '—'}</span></Td>
                        <Td><span className="text-xs font-bold text-slate-600">{r.hours}</span></Td>
                        <Td>{statusBadge(r.status, ATTEND_STATUS_MAP)}</Td>
                        <Td>
                            {r.approved
                                ? <CheckCircle size={15} className="text-green-500" />
                                : <XCircle size={15} className="text-slate-300" />}
                        </Td>
                    </tr>
                ))}
            </Table>
        </section>
    );
}

// ③ Movements ─────────────────────────────────────────────────────────────────
function MovementsTab() {
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const rows = useMemo(() => MOVEMENTS.filter(r => {
        const matchQ = !search || r.emp.toLowerCase().includes(search.toLowerCase());
        const matchT = !typeFilter || r.type === typeFilter;
        const matchS = !statusFilter || r.status === statusFilter;
        return matchQ && matchT && matchS;
    }), [search, typeFilter, statusFilter]);

    const pending = MOVEMENTS.filter(r => r.status === 'pending').length;
    const approved = MOVEMENTS.filter(r => r.status === 'approved').length;

    return (
        <section>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <Stat label="Total Requests" value={MOVEMENTS.length} icon={MapPin} color="bg-blue-50 text-blue-700 border-blue-100" />
                <Stat label="Approved" value={approved} icon={CheckCircle} color="bg-green-50 text-green-700 border-green-100" />
                <Stat label="Pending" value={pending} icon={AlertCircle} color="bg-yellow-50 text-yellow-700 border-yellow-100" />
            </div>

            <Toolbar search={search} setSearch={setSearch} placeholder="Search employee…">
                <Select value={typeFilter} onChange={setTypeFilter} label="All Types"
                    options={[{ value: 'field_visit', label: 'Field Visit' }, { value: 'leave', label: 'Leave' }, { value: 'early_exit', label: 'Early Exit' }]} />
                <Select value={statusFilter} onChange={setStatusFilter} label="All Status"
                    options={[{ value: 'approved', label: 'Approved' }, { value: 'pending', label: 'Pending' }, { value: 'rejected', label: 'Rejected' }]} />
            </Toolbar>

            <Table cols={['Employee', 'Type', 'Date', 'Time Out', 'Time In', 'Purpose', 'Status']}>
                {rows.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                        <Td>
                            <div>
                                <p className="font-black text-slate-800 text-xs">{r.emp}</p>
                                <p className="text-[10px] text-slate-400 font-bold">{r.empId}</p>
                            </div>
                        </Td>
                        <Td>{statusBadge(r.type, MOVE_TYPE_MAP)}</Td>
                        <Td><span className="text-xs font-bold text-slate-600">{r.date}</span></Td>
                        <Td><span className="text-xs font-black text-orange-600">{r.timeOut}</span></Td>
                        <Td><span className="text-xs font-black text-blue-600">{r.timeIn}</span></Td>
                        <Td><span className="text-xs text-slate-600 max-w-[140px] truncate block">{r.purpose}</span></Td>
                        <Td>{statusBadge(r.status, MOVE_STATUS_MAP)}</Td>
                    </tr>
                ))}
            </Table>
        </section>
    );
}

// ④ Commissions ───────────────────────────────────────────────────────────────
function CommissionsTab() {
    const [search, setSearch] = useState('');
    const [monthFilter, setMonthFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const rows = useMemo(() => COMMISSIONS.filter(r => {
        const matchQ = !search || r.emp.toLowerCase().includes(search.toLowerCase());
        const matchM = !monthFilter || r.month === monthFilter;
        const matchS = !statusFilter || r.status === statusFilter;
        return matchQ && matchM && matchS;
    }), [search, monthFilter, statusFilter]);

    const totalEarned = COMMISSIONS.reduce((a, c) => a + c.earned, 0);
    const totalPaid = COMMISSIONS.reduce((a, c) => a + c.paid, 0);
    const totalPending = totalEarned - totalPaid;

    return (
        <section>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <Stat label="Total Earned" value={pkr(totalEarned)} icon={TrendingUp} color="bg-blue-50 text-blue-700 border-blue-100" />
                <Stat label="Total Paid" value={pkr(totalPaid)} icon={CheckCircle} color="bg-green-50 text-green-700 border-green-100" />
                <Stat label="Pending" value={pkr(totalPending)} icon={AlertCircle} color="bg-yellow-50 text-yellow-700 border-yellow-100" />
            </div>

            <Toolbar search={search} setSearch={setSearch} placeholder="Search employee…">
                <Select value={monthFilter} onChange={setMonthFilter} label="All Months"
                    options={[{ value: 'Feb 2026', label: 'Feb 2026' }, { value: 'Jan 2026', label: 'Jan 2026' }]} />
                <Select value={statusFilter} onChange={setStatusFilter} label="All Status"
                    options={[{ value: 'paid', label: 'Paid' }, { value: 'pending', label: 'Pending' }]} />
            </Toolbar>

            <Table cols={['Employee', 'Month', 'Bookings', 'Revenue', 'Rate', 'Earned', 'Paid', 'Status']}>
                {rows.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                        <Td>
                            <div>
                                <p className="font-black text-slate-800 text-xs">{r.emp}</p>
                                <p className="text-[10px] text-slate-400 font-bold">{r.empId}</p>
                            </div>
                        </Td>
                        <Td><span className="text-xs font-bold text-slate-600">{r.month}</span></Td>
                        <Td><span className="text-xs font-black text-blue-600">{r.bookings}</span></Td>
                        <Td><span className="text-xs font-bold text-slate-600">{pkr(r.totalRevenue)}</span></Td>
                        <Td><span className="text-xs font-black text-purple-600">{r.commissionRate}</span></Td>
                        <Td><span className="text-xs font-black text-green-700">{pkr(r.earned)}</span></Td>
                        <Td><span className="text-xs font-black text-slate-700">{pkr(r.paid)}</span></Td>
                        <Td>{statusBadge(r.status, COMM_STATUS_MAP)}</Td>
                    </tr>
                ))}
            </Table>
        </section>
    );
}

// ⑤ Punctuality ───────────────────────────────────────────────────────────────
function PunctualityTab() {
    const [search, setSearch] = useState('');

    const rows = useMemo(() => PUNCTUALITY.filter(r =>
        !search || r.emp.toLowerCase().includes(search.toLowerCase())
    ), [search]);

    const avg = Math.round(PUNCTUALITY.reduce((a, r) => a + r.score, 0) / PUNCTUALITY.length);
    const stars = PUNCTUALITY.filter(r => r.score >= 90).length;
    const low = PUNCTUALITY.filter(r => r.score < 60).length;

    const ScoreBar = ({ score }) => {
        const color = score >= 90 ? 'bg-green-500' : score >= 70 ? 'bg-yellow-400' : score >= 50 ? 'bg-orange-400' : 'bg-red-500';
        return (
            <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-2 rounded-full ${color}`} style={{ width: `${score}%` }} />
                </div>
                <span className="text-xs font-black w-8 text-right">{score}</span>
            </div>
        );
    };

    return (
        <section>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <Stat label="Avg Score" value={`${avg}/100`} icon={BarChart2} color="bg-blue-50 text-blue-700 border-blue-100" />
                <Stat label="Top Performers" value={stars} icon={Star} color="bg-green-50 text-green-700 border-green-100" />
                <Stat label="Needs Attention" value={low} icon={AlertCircle} color="bg-red-50 text-red-700 border-red-100" />
            </div>

            <Toolbar search={search} setSearch={setSearch} placeholder="Search employee…" />

            <Table cols={['Employee', 'Total Days', 'On Time', 'Grace', 'Late', 'Absent', 'Score', 'Trend']}>
                {rows.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                        <Td>
                            <div>
                                <p className="font-black text-slate-800 text-xs">{r.emp}</p>
                                <p className="text-[10px] text-slate-400 font-bold">{r.empId}</p>
                            </div>
                        </Td>
                        <Td><span className="text-xs font-bold text-slate-600">{r.totalDays}</span></Td>
                        <Td><span className="text-xs font-black text-green-600">{r.onTime}</span></Td>
                        <Td><span className="text-xs font-black text-yellow-600">{r.grace}</span></Td>
                        <Td><span className="text-xs font-black text-orange-600">{r.late}</span></Td>
                        <Td><span className="text-xs font-black text-red-600">{r.absent}</span></Td>
                        <Td className="min-w-[140px]"><ScoreBar score={r.score} /></Td>
                        <Td>
                            {r.trend === 'up'
                                ? <ArrowUpRight size={16} className="text-green-500" />
                                : <ArrowDownRight size={16} className="text-red-500" />}
                        </Td>
                    </tr>
                ))}
            </Table>
        </section>
    );
}

// ⑥ Approvals ─────────────────────────────────────────────────────────────────
function ApprovalsTab() {
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [records, setRecords] = useState(APPROVALS);

    const rows = useMemo(() => records.filter(r => {
        const matchQ = !search || r.emp.toLowerCase().includes(search.toLowerCase());
        const matchT = !typeFilter || r.type === typeFilter;
        const matchS = !statusFilter || r.status === statusFilter;
        return matchQ && matchT && matchS;
    }), [search, typeFilter, statusFilter, records]);

    const pending = records.filter(r => r.status === 'pending').length;
    const approved = records.filter(r => r.status === 'approved').length;

    const act = (id, newStatus) => setRecords(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));

    return (
        <section>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <Stat label="Total" value={records.length} icon={CheckSquare} color="bg-blue-50 text-blue-700 border-blue-100" />
                <Stat label="Pending" value={pending} icon={AlertCircle} color="bg-yellow-50 text-yellow-700 border-yellow-100" />
                <Stat label="Approved" value={approved} icon={CheckCircle} color="bg-green-50 text-green-700 border-green-100" />
            </div>

            <Toolbar search={search} setSearch={setSearch} placeholder="Search employee…">
                <Select value={typeFilter} onChange={setTypeFilter} label="All Types"
                    options={[{ value: 'late_checkin', label: 'Late Check-In' }, { value: 'leave', label: 'Leave' }, { value: 'early_checkout', label: 'Early Exit' }, { value: 'overtime', label: 'Overtime' }]} />
                <Select value={statusFilter} onChange={setStatusFilter} label="All Status"
                    options={[{ value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' }]} />
            </Toolbar>

            <Table cols={['Employee', 'Type', 'Date', 'Detail', 'Status', 'Actions']}>
                {rows.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                        <Td>
                            <div>
                                <p className="font-black text-slate-800 text-xs">{r.emp}</p>
                                <p className="text-[10px] text-slate-400 font-bold">{r.empId}</p>
                            </div>
                        </Td>
                        <Td>{statusBadge(r.type, APPR_TYPE_MAP)}</Td>
                        <Td><span className="text-xs font-bold text-slate-600">{r.date}</span></Td>
                        <Td><span className="text-xs text-slate-600 max-w-[180px] truncate block">{r.detail}</span></Td>
                        <Td>{statusBadge(r.status, MOVE_STATUS_MAP)}</Td>
                        <Td>
                            {r.status === 'pending' && (
                                <div className="flex items-center gap-2">
                                    <button onClick={() => act(r.id, 'approved')}
                                        className="px-3 py-1 bg-green-600 text-white text-[10px] font-black rounded-lg hover:bg-green-700 transition-colors">
                                        Approve
                                    </button>
                                    <button onClick={() => act(r.id, 'rejected')}
                                        className="px-3 py-1 bg-red-100 text-red-600 text-[10px] font-black rounded-lg hover:bg-red-200 transition-colors">
                                        Reject
                                    </button>
                                </div>
                            )}
                            {r.status !== 'pending' && (
                                <span className="text-[10px] font-black text-slate-400">—</span>
                            )}
                        </Td>
                    </tr>
                ))}
            </Table>
        </section>
    );
}

// ⑦ Payments ──────────────────────────────────────────────────────────────────
function PaymentsTab() {
    const [search, setSearch] = useState('');
    const [monthFilter, setMonthFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const rows = useMemo(() => PAYMENTS.filter(r => {
        const matchQ = !search || r.emp.toLowerCase().includes(search.toLowerCase());
        const matchM = !monthFilter || r.month === monthFilter;
        const matchS = !statusFilter || r.status === statusFilter;
        return matchQ && matchM && matchS;
    }), [search, monthFilter, statusFilter]);

    const totalNet = rows.reduce((a, r) => a + r.net, 0);
    const totalPaid = rows.filter(r => r.status === 'paid').reduce((a, r) => a + r.net, 0);
    const totalPending = rows.filter(r => r.status === 'pending').reduce((a, r) => a + r.net, 0);

    return (
        <section>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <Stat label="Total Payroll" value={pkr(totalNet)} icon={CreditCard} color="bg-blue-50 text-blue-700 border-blue-100" />
                <Stat label="Paid" value={pkr(totalPaid)} icon={CheckCircle} color="bg-green-50 text-green-700 border-green-100" />
                <Stat label="Pending" value={pkr(totalPending)} icon={AlertCircle} color="bg-yellow-50 text-yellow-700 border-yellow-100" />
            </div>

            <Toolbar search={search} setSearch={setSearch} placeholder="Search employee…">
                <Select value={monthFilter} onChange={setMonthFilter} label="All Months"
                    options={[{ value: 'Feb 2026', label: 'Feb 2026' }, { value: 'Jan 2026', label: 'Jan 2026' }]} />
                <Select value={statusFilter} onChange={setStatusFilter} label="All Status"
                    options={[{ value: 'paid', label: 'Paid' }, { value: 'pending', label: 'Pending' }]} />
            </Toolbar>

            <Table cols={['Employee', 'Month', 'Base Salary', 'Commission', 'Deductions', 'Net Pay', 'Status', 'Paid On']}>
                {rows.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                        <Td>
                            <div>
                                <p className="font-black text-slate-800 text-xs">{r.emp}</p>
                                <p className="text-[10px] text-slate-400 font-bold">{r.empId}</p>
                            </div>
                        </Td>
                        <Td><span className="text-xs font-bold text-slate-600">{r.month}</span></Td>
                        <Td><span className="text-xs font-bold text-slate-700">{pkr(r.baseSalary)}</span></Td>
                        <Td><span className="text-xs font-black text-green-600">+{pkr(r.commission)}</span></Td>
                        <Td><span className="text-xs font-black text-red-500">-{pkr(r.deductions)}</span></Td>
                        <Td><span className="text-xs font-black text-blue-700">{pkr(r.net)}</span></Td>
                        <Td>{statusBadge(r.status, PAY_STATUS_MAP)}</Td>
                        <Td><span className="text-xs font-bold text-slate-500">{r.paidOn || '—'}</span></Td>
                    </tr>
                ))}
            </Table>
        </section>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ══════════════════════════════════════════════════════════════════════════════
const TAB_COMPONENTS = {
    employees: EmployeesTab,
    attendance: AttendanceTab,
    movements: MovementsTab,
    commissions: CommissionsTab,
    punctuality: PunctualityTab,
    approvals: ApprovalsTab,
    payments: PaymentsTab,
};

export default function EmployeeHRView() {
    const [activeTab, setActiveTab] = useState('employees');
    const Content = TAB_COMPONENTS[activeTab];

    const pendingApprovals = APPROVALS.filter(a => a.status === 'pending').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl font-black text-slate-900">HR Management</h1>
                <p className="text-xs font-bold text-slate-400 mt-0.5">Employees · Attendance · Payroll · Approvals</p>
            </div>

            {/* Tab Bar */}
            <div className="flex flex-wrap gap-1 p-1.5 bg-slate-100 rounded-2xl">
                {TABS.map(({ key, label, icon: Icon }) => {
                    const isActive = activeTab === key;
                    return (
                        <button key={key} onClick={() => setActiveTab(key)}
                            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${isActive
                                    ? 'bg-white text-blue-700 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                                }`}>
                            <Icon size={14} />
                            {label}
                            {key === 'approvals' && pendingApprovals > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                                    {pendingApprovals}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <div>
                <Content />
            </div>
        </div>
    );
}
