import React, { useState, useEffect, useMemo } from 'react';
import {
    Users, TrendingUp, Search, Eye, Phone, Mail,
    Zap, BookOpen, CreditCard, CheckSquare, Clock,
    ChevronDown, AlertCircle, Star, FileText, X, Check,
    ArrowRight, UserCheck, UserX, DollarSign
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const API = 'http://localhost:8000/api';

const STATUS_COLORS = {
    new: 'bg-blue-100 text-blue-700',
    followup: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-green-100 text-green-700',
    lost: 'bg-red-100 text-red-700',
};
const CONV_COLORS = {
    not_converted: 'bg-slate-100 text-slate-600',
    converted_to_booking: 'bg-green-100 text-green-700',
    lost: 'bg-red-100 text-red-600',
};
const LOAN_COLORS = {
    pending: 'bg-amber-100 text-amber-700',
    cleared: 'bg-green-100 text-green-700',
    overdue: 'bg-red-100 text-red-700',
};

const PASSPORT_STATUS_COLORS = {
    pending: 'bg-amber-100 text-amber-700',
    processing: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
};

const Badge = ({ cls, label }) => (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${cls}`}>
        {label}
    </span>
);

const Sel = ({ value, onChange, options, label }) => (
    <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)}
            className="appearance-none pl-3 pr-7 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-100">
            <option value="">{label}</option>
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
);

// ─── Shared table shell ───────────────────────────────────────────────────────
const Tbl = ({ cols, children, emptyIcon, emptyMsg = 'No records found.' }) => (
    <div className="overflow-x-auto">
        <table className="w-full min-w-max">
            <thead>
                <tr className="bg-slate-900">
                    {cols.map(c => (
                        <th key={c} className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-slate-300">
                            {c}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {React.Children.count(children) === 0 ? (
                    <tr>
                        <td colSpan={cols.length} className="py-16 text-center text-slate-400">
                            <div className="flex flex-col items-center gap-3">
                                {emptyIcon || <AlertCircle size={36} className="text-slate-200" />}
                                <span className="text-sm font-bold">{emptyMsg}</span>
                            </div>
                        </td>
                    </tr>
                ) : children}
            </tbody>
        </table>
    </div>
);

const Td = ({ children, cls = '' }) => (
    <td className={`px-4 py-3 text-xs whitespace-nowrap border-b border-slate-50 ${cls}`}>{children}</td>
);

const StatCard = ({ label, value, color = 'text-blue-600', bg = 'bg-blue-50', icon }) => (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <p className={`text-2xl font-black ${color}`}>{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${bg}`}>{icon}</div>
    </div>
);

// ─── LEADS SECTION ────────────────────────────────────────────────────────────
// Lead classification helpers
const hasLoan = l => Number(l.loan_amount || 0) > 0 || Number(l.recovered_amount || 0) > 0;
const hasTask = l => !!(l.is_internal_task || l.task_type || l.assigned_to);

function LeadsSection({ token }) {
    const [sub, setSub] = useState('followup_dashboard');
    const [all, setAll] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [statusF, setStatusF] = useState('');
    const [serviceF, setServiceF] = useState('');
    const [convF, setConvF] = useState('');
    const [sourceF, setSourceF] = useState('');

    useEffect(() => { fetchLeads(); }, []);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/leads/`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                setAll(Array.isArray(data) ? data : (data.leads || data.results || []));
            }
        } catch { /* will show empty */ } finally { setLoading(false); }
    };

    // Derived lists
    const loans = useMemo(() => all.filter(hasLoan), [all]);
    const tasks = useMemo(() => all.filter(l => !hasLoan(l) && hasTask(l)), [all]);
    const instants = useMemo(() => all.filter(l => l.is_instant), [all]);
    const closed = useMemo(() => all.filter(l => l.lead_status === 'lost' || l.conversion_status === 'converted_to_booking'), [all]);
    const pureLeads = useMemo(() => all.filter(l => !hasLoan(l) && !hasTask(l) && l.lead_status !== 'lost'), [all]);

    const today = new Date().toISOString().split('T')[0];
    const todayFollowups = useMemo(() => all.filter(l => l.next_followup_date === today), [all]);

    const stats = useMemo(() => ({
        total: all.length,
        newLeads: all.filter(l => l.lead_status === 'new').length,
        walkIn: all.filter(l => l.lead_source === 'walk-in').length,
        converted: all.filter(l => l.conversion_status === 'converted_to_booking').length,
    }), [all]);

    const convRate = stats.total > 0 ? ((stats.converted / stats.total) * 100).toFixed(0) : 0;

    // Filter helper
    const applyFilters = rows => rows.filter(l => {
        const q = search.toLowerCase();
        const matchQ = !q || (l.customer_full_name || '').toLowerCase().includes(q) || (l.contact_number || '').includes(q);
        const matchS = !statusF || l.lead_status === statusF;
        const matchSvc = !serviceF || l.interested_in === serviceF;
        const matchC = !convF || l.conversion_status === convF;
        const matchSrc = !sourceF || l.lead_source === sourceF;
        return matchQ && matchS && matchSvc && matchC && matchSrc;
    });

    const LEAD_COLS = ['Name', 'Contact', 'Lead Status', 'Interested In', 'Source', 'Conversion', 'Instant', 'Actions'];
    const LOAN_COLS = ['Name', 'Contact', 'Amount (PKR)', 'Recovered', 'Due Date', 'Loan Status', 'Actions'];
    const TASK_COLS = ['Name', 'Contact', 'Type', 'Assigned To', 'Next Follow-up', 'Status', 'Actions'];
    const FU_COLS = ['Name', 'Contact', 'Type', 'Next Follow-up', 'Status', 'Actions'];
    const CLOSED_COLS = ['Name', 'Contact', 'Status', 'Reason', 'Closed On'];

    const LeadRow = ({ l }) => (
        <tr className="hover:bg-slate-50/50 transition-colors">
            <Td><span className="font-black text-slate-800">{l.customer_full_name || '—'}</span></Td>
            <Td>{l.contact_number || '—'}</Td>
            <Td><Badge cls={STATUS_COLORS[l.lead_status] || STATUS_COLORS.new} label={l.lead_status || 'new'} /></Td>
            <Td>{l.interested_in ? <Badge cls="bg-purple-100 text-purple-700" label={l.interested_in} /> : '—'}</Td>
            <Td className="capitalize">{l.lead_source || '—'}</Td>
            <Td><Badge cls={CONV_COLORS[l.conversion_status] || CONV_COLORS.not_converted} label={(l.conversion_status || 'not_converted').replace(/_/g, ' ')} /></Td>
            <Td>{l.is_instant ? <Zap size={14} className="text-amber-500" /> : '—'}</Td>
            <Td>
                <button className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase hover:bg-blue-100 transition-all">
                    <Eye size={11} /> View
                </button>
            </Td>
        </tr>
    );

    const LoanRow = ({ l }) => {
        const amt = Number(l.loan_amount || 0);
        const rec = Number(l.recovered_amount || 0);
        const pending = amt - rec;
        const status = amt > 0 && rec >= amt ? 'cleared' : (l.next_followup_date && new Date(l.next_followup_date) < new Date() && rec < amt) ? 'overdue' : 'pending';
        return (
            <tr className="hover:bg-slate-50/50 transition-colors">
                <Td><span className="font-black text-slate-800">{l.customer_full_name || '—'}</span></Td>
                <Td>{l.contact_number || '—'}</Td>
                <Td><span className="font-black text-slate-800">PKR {amt.toLocaleString()}</span></Td>
                <Td><span className="text-green-600 font-black">PKR {rec.toLocaleString()}</span></Td>
                <Td>{l.next_followup_date || '—'}</Td>
                <Td><Badge cls={LOAN_COLORS[status]} label={status} /></Td>
                <Td><button className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase hover:bg-blue-100 transition-all"><Eye size={11} /> View</button></Td>
            </tr>
        );
    };

    const TaskRow = ({ l }) => (
        <tr className="hover:bg-slate-50/50 transition-colors">
            <Td><span className="font-black text-slate-800">{l.customer_full_name || 'Internal Task'}</span></Td>
            <Td>{l.contact_number || '—'}</Td>
            <Td>{l.task_type ? <Badge cls="bg-indigo-100 text-indigo-700" label={l.task_type} /> : '—'}</Td>
            <Td>{l.assigned_to || '—'}</Td>
            <Td>{l.next_followup_date || '—'}</Td>
            <Td><Badge cls={STATUS_COLORS[l.lead_status] || STATUS_COLORS.new} label={l.lead_status || 'new'} /></Td>
            <Td><button className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase hover:bg-blue-100 transition-all"><Eye size={11} /> View</button></Td>
        </tr>
    );

    const SUB_TABS = [
        { key: 'followup_dashboard', label: 'Follow-up Dashboard', icon: Clock },
        { key: 'leads', label: 'Leads', icon: TrendingUp },
        { key: 'loans', label: 'Loans', icon: CreditCard },
        { key: 'tasks', label: 'Tasks', icon: CheckSquare },
        { key: 'followups', label: 'Follow-ups', icon: Phone },
        { key: 'closed', label: 'Closed Leads', icon: X },
        { key: 'instant', label: 'Instant', icon: Zap },
    ];

    // Toolbar
    const Filters = () => (
        <div className="flex flex-wrap gap-2 items-center mb-4">
            <div className="relative flex-1 min-w-[200px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100" />
            </div>
            <Sel value={statusF} onChange={setStatusF} label="All Status"
                options={[{ value: 'new', label: 'New' }, { value: 'followup', label: 'Follow-up' }, { value: 'confirmed', label: 'Confirmed' }, { value: 'lost', label: 'Lost' }]} />
            <Sel value={serviceF} onChange={setServiceF} label="All Services"
                options={[{ value: 'ticket', label: 'Ticket' }, { value: 'umrah', label: 'Umrah' }, { value: 'visa', label: 'Visa' }, { value: 'hotel', label: 'Hotel' }, { value: 'transport', label: 'Transport' }]} />
            <Sel value={convF} onChange={setConvF} label="All Conversions"
                options={[{ value: 'not_converted', label: 'Not Converted' }, { value: 'converted_to_booking', label: 'Converted' }, { value: 'lost', label: 'Lost' }]} />
            <Sel value={sourceF} onChange={setSourceF} label="All Sources"
                options={[{ value: 'walk-in', label: 'Walk-in' }, { value: 'call', label: 'Call' }, { value: 'whatsapp', label: 'WhatsApp' }, { value: 'facebook', label: 'Facebook' }, { value: 'referral', label: 'Referral' }]} />
        </div>
    );

    return (
        <div className="space-y-5">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard label="Total Leads" value={stats.total} color="text-blue-600" bg="bg-blue-50" icon={<TrendingUp size={22} className="text-blue-600" />} />
                <StatCard label="New Leads" value={stats.newLeads} color="text-amber-600" bg="bg-amber-50" icon={<Star size={22} className="text-amber-600" />} />
                <StatCard label="Walk-in Leads" value={stats.walkIn} color="text-purple-600" bg="bg-purple-50" icon={<Users size={22} className="text-purple-600" />} />
                <StatCard label="Converted" value={stats.converted} color="text-green-600" bg="bg-green-50" icon={<UserCheck size={22} className="text-green-600" />} />
                <StatCard label="Conversion Rate" value={`${convRate}%`} color="text-indigo-600" bg="bg-indigo-50" icon={<DollarSign size={22} className="text-indigo-600" />} />
            </div>

            {/* Sub-tab bar */}
            <div className="flex flex-wrap gap-1 border-b border-slate-100">
                {SUB_TABS.map(({ key, label, icon: Icon }) => (
                    <button key={key} onClick={() => setSub(key)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider border-b-2 transition-all ${sub === key
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                        <Icon size={13} />{label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* ── Follow-up Dashboard ── */}
                {sub === 'followup_dashboard' && (
                    <div>
                        <div className="px-5 pt-5 pb-3">
                            <h2 className="text-base font-black text-slate-900">Follow-up Dashboard</h2>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">Overview of leads and quick follow-up actions — focus on today's priorities and convert faster.</p>
                        </div>
                        <div className="px-5 pb-4"><Filters /></div>
                        <div className="px-4 pb-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Today's follow-ups</p>
                        </div>
                        <Tbl cols={LEAD_COLS} emptyMsg="No follow-ups due today.">
                            {loading
                                ? <tr><td colSpan={8} className="py-10 text-center text-xs text-slate-400 font-bold">Loading…</td></tr>
                                : applyFilters(todayFollowups).map(l => <LeadRow key={l._id || l.id} l={l} />)
                            }
                        </Tbl>
                    </div>
                )}

                {/* ── Leads ── */}
                {sub === 'leads' && (
                    <div>
                        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-black text-slate-900">All Leads</h2>
                                <p className="text-[10px] text-slate-400 font-bold mt-0.5">All customer-facing sales leads</p>
                            </div>
                        </div>
                        <div className="px-5 pb-4"><Filters /></div>
                        <Tbl cols={LEAD_COLS} emptyMsg="No leads found." emptyIcon={<TrendingUp size={36} className="text-slate-200" />}>
                            {loading
                                ? <tr><td colSpan={8} className="py-10 text-center text-xs text-slate-400 font-bold">Loading…</td></tr>
                                : applyFilters(pureLeads).map(l => <LeadRow key={l._id || l.id} l={l} />)
                            }
                        </Tbl>
                    </div>
                )}

                {/* ── Loans ── */}
                {sub === 'loans' && (
                    <div>
                        <div className="px-5 pt-5 pb-3">
                            <h2 className="text-base font-black text-slate-900">Loans & Recovery</h2>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">All loan entries with recovery tracking</p>
                        </div>
                        <div className="px-5 pb-4">
                            <div className="relative max-w-sm">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search loans..."
                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100" />
                            </div>
                        </div>
                        <Tbl cols={LOAN_COLS} emptyMsg="No loans found." emptyIcon={<CreditCard size={36} className="text-slate-200" />}>
                            {loading
                                ? <tr><td colSpan={7} className="py-10 text-center text-xs text-slate-400 font-bold">Loading…</td></tr>
                                : loans.filter(l => !search || (l.customer_full_name || '').toLowerCase().includes(search.toLowerCase())).map(l => <LoanRow key={l._id || l.id} l={l} />)
                            }
                        </Tbl>
                    </div>
                )}

                {/* ── Tasks ── */}
                {sub === 'tasks' && (
                    <div>
                        <div className="px-5 pt-5 pb-3">
                            <h2 className="text-base font-black text-slate-900">Internal Tasks</h2>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">Team tasks and internal assignments</p>
                        </div>
                        <div className="px-5 pb-4">
                            <div className="relative max-w-sm">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..."
                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100" />
                            </div>
                        </div>
                        <Tbl cols={TASK_COLS} emptyMsg="No tasks found." emptyIcon={<CheckSquare size={36} className="text-slate-200" />}>
                            {loading
                                ? <tr><td colSpan={7} className="py-10 text-center text-xs text-slate-400 font-bold">Loading…</td></tr>
                                : tasks.filter(l => !search || (l.customer_full_name || '').toLowerCase().includes(search.toLowerCase())).map(l => <TaskRow key={l._id || l.id} l={l} />)
                            }
                        </Tbl>
                    </div>
                )}

                {/* ── Follow-ups history ── */}
                {sub === 'followups' && (
                    <div>
                        <div className="px-5 pt-5 pb-3">
                            <h2 className="text-base font-black text-slate-900">Follow-up Schedule</h2>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">All leads with upcoming or past follow-ups</p>
                        </div>
                        <div className="px-5 pb-4"><Filters /></div>
                        <Tbl cols={['Name', 'Contact', 'Lead Status', 'Interested In', 'Last Contacted', 'Next Follow-up', 'Actions']}
                            emptyMsg="No follow-ups scheduled." emptyIcon={<Phone size={36} className="text-slate-200" />}>
                            {loading
                                ? <tr><td colSpan={7} className="py-10 text-center text-xs text-slate-400 font-bold">Loading…</td></tr>
                                : applyFilters(all.filter(l => l.next_followup_date)).map(l => (
                                    <tr key={l._id || l.id} className="hover:bg-slate-50/50 transition-colors">
                                        <Td><span className="font-black text-slate-800">{l.customer_full_name || '—'}</span></Td>
                                        <Td>{l.contact_number || '—'}</Td>
                                        <Td><Badge cls={STATUS_COLORS[l.lead_status] || STATUS_COLORS.new} label={l.lead_status || 'new'} /></Td>
                                        <Td>{l.interested_in || '—'}</Td>
                                        <Td className="text-slate-500">{l.last_contacted_date || '—'}</Td>
                                        <Td className={l.next_followup_date === today ? 'font-black text-red-600' : 'font-bold text-slate-700'}>{l.next_followup_date}</Td>
                                        <Td><button className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase hover:bg-blue-100 transition-all"><Eye size={11} /> View</button></Td>
                                    </tr>
                                ))
                            }
                        </Tbl>
                    </div>
                )}

                {/* ── Closed Leads ── */}
                {sub === 'closed' && (
                    <div>
                        <div className="px-5 pt-5 pb-3">
                            <h2 className="text-base font-black text-slate-900">Closed Leads</h2>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">Converted bookings and lost leads</p>
                        </div>
                        <Tbl cols={CLOSED_COLS} emptyMsg="No closed leads." emptyIcon={<X size={36} className="text-slate-200" />}>
                            {loading
                                ? <tr><td colSpan={5} className="py-10 text-center text-xs text-slate-400 font-bold">Loading…</td></tr>
                                : closed.map(l => (
                                    <tr key={l._id || l.id} className="hover:bg-slate-50/50 transition-colors">
                                        <Td><span className="font-black text-slate-800">{l.customer_full_name || '—'}</span></Td>
                                        <Td>{l.contact_number || '—'}</Td>
                                        <Td><Badge cls={CONV_COLORS[l.conversion_status] || CONV_COLORS.not_converted} label={(l.conversion_status || '').replace(/_/g, ' ')} /></Td>
                                        <Td>{l.remarks || '—'}</Td>
                                        <Td>{l.updated_at ? new Date(l.updated_at).toLocaleDateString() : '—'}</Td>
                                    </tr>
                                ))
                            }
                        </Tbl>
                    </div>
                )}

                {/* ── Instant ── */}
                {sub === 'instant' && (
                    <div>
                        <div className="px-5 pt-5 pb-3">
                            <h2 className="text-base font-black text-slate-900">Instant Leads, Loans & Tasks</h2>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">All records marked as instant</p>
                        </div>
                        <Tbl cols={FU_COLS} emptyMsg="No instant leads." emptyIcon={<Zap size={36} className="text-slate-200" />}>
                            {loading
                                ? <tr><td colSpan={6} className="py-10 text-center text-xs text-slate-400 font-bold">Loading…</td></tr>
                                : instants.map(l => (
                                    <tr key={l._id || l.id} className="hover:bg-slate-50/50 transition-colors">
                                        <Td><span className="font-black text-slate-800">{l.customer_full_name || '—'}</span></Td>
                                        <Td>{l.contact_number || '—'}</Td>
                                        <Td>
                                            {hasLoan(l) ? <Badge cls="bg-orange-100 text-orange-700" label="loan" />
                                                : hasTask(l) ? <Badge cls="bg-indigo-100 text-indigo-700" label="task" />
                                                    : <Badge cls="bg-blue-100 text-blue-700" label="lead" />}
                                        </Td>
                                        <Td>{l.next_followup_date || '—'}</Td>
                                        <Td><Badge cls={STATUS_COLORS[l.lead_status] || STATUS_COLORS.new} label={l.lead_status || 'new'} /></Td>
                                        <Td><button className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase hover:bg-blue-100 transition-all"><Eye size={11} /> View</button></Td>
                                    </tr>
                                ))
                            }
                        </Tbl>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── CUSTOMERS SECTION ────────────────────────────────────────────────────────
function CustomersSection({ token }) {
    const [view, setView] = useState('walkIn');   // walkIn | database

    // ── Walk-in state ──
    const [customers, setCustomers] = useState([]);
    const [loadingWI, setLoadingWI] = useState(false);
    const [searchWI, setSearchWI] = useState('');
    const [subFilter, setSubFilter] = useState('all');

    // ── Database state ──
    const [dbData, setDbData] = useState(null);    // { total, from_bookings, from_leads, from_walkin, customers }
    const [loadingDB, setLoadingDB] = useState(false);
    const [searchDB, setSearchDB] = useState('');
    const [sourceFilter, setSourceFilter] = useState('');  // bookings | leads | walk-in | ''
    const [syncMsg, setSyncMsg] = useState('');

    useEffect(() => { fetchWalkIns(); }, []);
    useEffect(() => { if (view === 'database') fetchDatabase(); }, [view]);

    const fetchWalkIns = async () => {
        setLoadingWI(true);
        try {
            const res = await fetch(`${API}/customers/`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                setCustomers(Array.isArray(data) ? data : (data.customers || []));
            }
        } catch { } finally { setLoadingWI(false); }
    };

    const fetchDatabase = async () => {
        setLoadingDB(true);
        try {
            let url = `${API}/customers/database/aggregate`;
            if (sourceFilter) url += `?source=${sourceFilter}`;
            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) setDbData(await res.json());
        } catch { } finally { setLoadingDB(false); }
    };

    const syncDatabase = async () => {
        setSyncMsg('Syncing…');
        await fetchDatabase();
        setSyncMsg('Synced ✓');
        setTimeout(() => setSyncMsg(''), 2000);
    };

    // Walk-in filtered
    const filteredWI = useMemo(() => {
        const q = searchWI.toLowerCase();
        return customers.filter(c => {
            const matchQ = !q || (c.full_name || '').toLowerCase().includes(q) || (c.phone || '').includes(q) || (c.email || '').toLowerCase().includes(q);
            const matchF = subFilter === 'all' || (subFilter === 'active' && c.is_active !== false) || (subFilter === 'inactive' && c.is_active === false);
            return matchQ && matchF;
        });
    }, [customers, searchWI, subFilter]);

    // DB filtered
    const filteredDB = useMemo(() => {
        if (!dbData) return [];
        const q = searchDB.toLowerCase();
        return (dbData.customers || []).filter(c => {
            const matchQ = !q || (c.full_name || '').toLowerCase().includes(q)
                || (c.phone || '').includes(q)
                || (c.passport_number || '').toLowerCase().includes(q)
                || (c.email || '').toLowerCase().includes(q);
            const matchSrc = !sourceFilter || c.source === sourceFilter;
            return matchQ && matchSrc;
        });
    }, [dbData, searchDB, sourceFilter]);

    const activeWI = customers.filter(c => c.is_active !== false).length;
    const inactiveWI = customers.length - activeWI;

    const SOURCE_BADGES = {
        bookings: 'bg-blue-100 text-blue-700',
        leads: 'bg-amber-100 text-amber-700',
        'walk-in': 'bg-green-100 text-green-700',
        branches: 'bg-purple-100 text-purple-700',
    };

    return (
        <div className="space-y-5">
            {/* Sub-view switcher */}
            <div className="flex gap-2 border-b border-slate-100 pb-0">
                <button onClick={() => setView('walkIn')}
                    className={`flex items-center gap-2 px-5 py-2.5 text-[11px] font-black uppercase tracking-wider border-b-2 transition-all -mb-px ${view === 'walkIn' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                    <Users size={13} /> Walk-in Customers
                </button>
                <button onClick={() => setView('database')}
                    className={`flex items-center gap-2 px-5 py-2.5 text-[11px] font-black uppercase tracking-wider border-b-2 transition-all -mb-px ${view === 'database' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                    <BookOpen size={13} /> Customer Database
                </button>
            </div>

            {/* ── Walk-in Customers ── */}
            {view === 'walkIn' && (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard label="Total Customers" value={customers.length} color="text-blue-600" bg="bg-blue-50" icon={<Users size={22} className="text-blue-600" />} />
                        <StatCard label="Active Customers" value={activeWI} color="text-green-600" bg="bg-green-50" icon={<UserCheck size={22} className="text-green-600" />} />
                        <StatCard label="Inactive" value={inactiveWI} color="text-amber-600" bg="bg-amber-50" icon={<UserX size={22} className="text-amber-600" />} />
                        <StatCard label="Total Revenue" value="PKR 0" color="text-purple-600" bg="bg-purple-50" icon={<DollarSign size={22} className="text-purple-600" />} />
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-50 flex flex-wrap gap-3 items-center justify-between">
                            <div className="flex gap-2">
                                {['all', 'active', 'inactive'].map(f => (
                                    <button key={f} onClick={() => setSubFilter(f)}
                                        className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${subFilter === f ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                                        {f}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2 items-center">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                                    <input value={searchWI} onChange={e => setSearchWI(e.target.value)} placeholder="Search customers..."
                                        className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 w-48" />
                                </div>
                            </div>
                        </div>
                        <Tbl cols={['Customer ID', 'Name', 'Phone', 'Email', 'City', 'Status', 'Total Spent', 'Last Visit', 'Actions']}
                            emptyMsg="No customers found." emptyIcon={<Users size={40} className="text-slate-200" />}>
                            {loadingWI
                                ? <tr><td colSpan={9} className="py-12 text-center text-xs text-slate-400 font-bold"><div className="flex justify-center"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div></td></tr>
                                : filteredWI.map((c, i) => (
                                    <tr key={c._id || i} className="hover:bg-slate-50/50 transition-colors">
                                        <Td cls="text-slate-400 font-bold font-mono text-[10px]">#{String(i + 1).padStart(4, '0')}</Td>
                                        <Td cls="font-black text-slate-800">{c.full_name || 'N/A'}</Td>
                                        <Td>{c.phone || '—'}</Td>
                                        <Td>{c.email || '—'}</Td>
                                        <Td>{c.city || '—'}</Td>
                                        <Td>
                                            <Badge cls={c.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}
                                                label={c.is_active !== false ? 'Active' : 'Inactive'} />
                                        </Td>
                                        <Td cls="font-black text-slate-800">PKR {(c.total_spent || 0).toLocaleString()}</Td>
                                        <Td cls="text-slate-400">{c.last_activity ? new Date(c.last_activity).toLocaleDateString() : '—'}</Td>
                                        <Td>
                                            <button className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase hover:bg-blue-100 transition-all">
                                                <Eye size={11} /> View
                                            </button>
                                        </Td>
                                    </tr>
                                ))
                            }
                        </Tbl>
                    </div>
                </>
            )}

            {/* ── Customer Database (aggregated) ── */}
            {view === 'database' && (
                <>
                    {/* Info banner */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-teal-50 border border-teal-100 rounded-2xl text-xs font-bold text-teal-700">
                        <BookOpen size={16} className="text-teal-500 shrink-0" />
                        <span><strong>Customer Database</strong>– Auto-collection from booking APIs, passport leads, and area branches</span>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard label="Total Collected" value={dbData?.total || 0} color="text-blue-600" bg="bg-blue-50" icon={<Users size={22} className="text-blue-600" />} />
                        <StatCard label="From Bookings (PAX)" value={dbData?.from_bookings || 0} color="text-green-600" bg="bg-green-50" icon={<BookOpen size={22} className="text-green-600" />}
                        />
                        <StatCard label="From Leads" value={dbData?.from_leads || 0} color="text-amber-600" bg="bg-amber-50" icon={<TrendingUp size={22} className="text-amber-600" />} />
                        <StatCard label="From Walk-ins" value={dbData?.from_walkin || 0} color="text-purple-600" bg="bg-purple-50" icon={<UserCheck size={22} className="text-purple-600" />} />
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-50 flex flex-wrap gap-3 items-center justify-between">
                            {/* Source filter tabs */}
                            <div className="flex gap-1">
                                {[{ v: '', l: 'All Sources' }, { v: 'bookings', l: 'From Bookings' }, { v: 'leads', l: 'From Leads' }, { v: 'walk-in', l: 'From Walk-ins' }].map(({ v, l }) => (
                                    <button key={v} onClick={() => { setSourceFilter(v); }}
                                        className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${sourceFilter === v ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                                        {l}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2 items-center">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                                    <input value={searchDB} onChange={e => setSearchDB(e.target.value)} placeholder="Search database..."
                                        className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 w-48" />
                                </div>
                                <button onClick={syncDatabase}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-blue-700 transition-all">
                                    <ArrowRight size={12} /> {syncMsg || 'Sync Now'}
                                </button>
                            </div>
                        </div>

                        {/* Auto-collection info bar */}
                        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <p className="text-[10px] font-bold text-slate-500">
                                <strong>Auto-Collection Sources:</strong>&nbsp;
                                • Bookings (with passenger details) &nbsp;• Passport Leads &nbsp;• Area Branches &nbsp;• Walk-in Customers
                            </p>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Showing {filteredDB.length} of {dbData?.total || 0} Customers
                            </span>
                        </div>

                        <Tbl cols={['ID', 'Name', 'Phone', 'Email', 'City', 'Source', 'Collected At', 'Status', 'Actions']}
                            emptyMsg="No customers in database. Click Sync Now to load." emptyIcon={<Users size={40} className="text-slate-200" />}>
                            {loadingDB
                                ? <tr><td colSpan={9} className="py-12 text-center text-xs text-slate-400 font-bold"><div className="flex justify-center"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div></td></tr>
                                : filteredDB.map((c, i) => (
                                    <tr key={c.id || i} className="hover:bg-slate-50/50 transition-colors">
                                        <Td cls="text-slate-400 font-mono text-[10px] font-bold">#{i + 1}</Td>
                                        <Td cls="font-black text-slate-800">{c.full_name || 'N/A'}</Td>
                                        <Td>{c.phone || '—'}</Td>
                                        <Td>{c.email || '—'}</Td>
                                        <Td>{c.city || '—'}</Td>
                                        <Td>
                                            <Badge cls={SOURCE_BADGES[c.source] || 'bg-slate-100 text-slate-600'}
                                                label={c.source_label || c.source || '—'} />
                                        </Td>
                                        <Td cls="text-slate-400 text-[10px]">{c.collected_at ? new Date(c.collected_at).toLocaleDateString() : '—'}</Td>
                                        <Td>
                                            <Badge cls={c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}
                                                label={c.status || 'active'} />
                                        </Td>
                                        <Td>
                                            <button className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase hover:bg-blue-100 transition-all">
                                                <Eye size={11} /> View
                                            </button>
                                        </Td>
                                    </tr>
                                ))
                            }
                        </Tbl>
                    </div>
                </>
            )}
        </div>
    );
}


// ─── PASSPORT LEADS SECTION ───────────────────────────────────────────────────
function PassportLeadsSection({ token }) {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [statusF, setStatusF] = useState('');

    useEffect(() => { fetchPassportLeads(); }, []);

    const fetchPassportLeads = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/passport-leads/`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                setRecords(Array.isArray(data) ? data : (data.results || data.passport_leads || []));
            }
        } catch { } finally { setLoading(false); }
    };

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return records.filter(r => {
            const matchQ = !q || (r.customer_name || '').toLowerCase().includes(q)
                || (r.customer_phone || '').includes(q)
                || (r.passport_number || '').toLowerCase().includes(q);
            const matchS = !statusF || r.status === statusF;
            return matchQ && matchS;
        });
    }, [records, search, statusF]);

    const total = records.length;
    const pending = records.filter(r => r.status === 'pending').length;
    const completed = records.filter(r => r.status === 'completed').length;
    const converted = records.filter(r => r.status === 'converted').length;

    return (
        <div className="space-y-5">
            <div>
                <h2 className="text-xl font-black text-slate-900">Passport Leads</h2>
                <p className="text-xs text-slate-400 font-bold mt-0.5">Manage passport applications and follow-ups</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Leads" value={total} color="text-blue-600" bg="bg-blue-50" icon={<BookOpen size={22} className="text-blue-600" />} />
                <StatCard label="Pending" value={pending} color="text-amber-600" bg="bg-amber-50" icon={<AlertCircle size={22} className="text-amber-600" />} />
                <StatCard label="Completed" value={completed} color="text-green-600" bg="bg-green-50" icon={<Check size={22} className="text-green-600" />} />
                <StatCard label="Converted" value={converted} color="text-purple-600" bg="bg-purple-50" icon={<ArrowRight size={22} className="text-purple-600" />} />
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-50 flex flex-wrap gap-3 items-center">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, passport..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100" />
                    </div>
                    <Sel value={statusF} onChange={setStatusF} label="All Status"
                        options={[{ value: 'pending', label: 'Pending' }, { value: 'processing', label: 'Processing' }, { value: 'completed', label: 'Completed' }, { value: 'rejected', label: 'Rejected' }, { value: 'converted', label: 'Converted' }]} />
                </div>

                <Tbl cols={['#', 'Customer Name', 'Phone', 'Passport No.', 'Service', 'Travel Date', 'Status', 'Next Follow-up', 'Actions']}
                    emptyMsg="No passport leads found." emptyIcon={<FileText size={40} className="text-slate-200" />}>
                    {loading
                        ? <tr><td colSpan={9} className="py-12 text-center text-xs text-slate-400 font-bold">Loading…</td></tr>
                        : filtered.map((r, i) => (
                            <tr key={r._id || r.id || i} className="hover:bg-slate-50/50 transition-colors">
                                <Td cls="text-slate-400 font-bold">#{i + 1}</Td>
                                <Td cls="font-black text-slate-800">{r.customer_name || r.full_name || 'N/A'}</Td>
                                <Td>{r.customer_phone || r.phone || '—'}</Td>
                                <Td cls="font-mono text-xs">{r.passport_number || '—'}</Td>
                                <Td>{r.service_type || r.interested_in ? <Badge cls="bg-purple-100 text-purple-700" label={r.service_type || r.interested_in} /> : '—'}</Td>
                                <Td cls="text-slate-500">{r.travel_date || r.interested_travel_date || '—'}</Td>
                                <Td>
                                    <Badge cls={PASSPORT_STATUS_COLORS[r.status] || PASSPORT_STATUS_COLORS.pending}
                                        label={r.status || 'pending'} />
                                </Td>
                                <Td cls="text-slate-500">{r.next_followup_date || '—'}</Td>
                                <Td>
                                    <button className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase hover:bg-blue-100 transition-all">
                                        <Eye size={11} /> View
                                    </button>
                                </Td>
                            </tr>
                        ))
                    }
                </Tbl>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ══════════════════════════════════════════════════════════════════════════════
const MAIN_TABS = [
    { key: 'Customers', label: 'Customers', icon: Users },
    { key: 'Leads', label: 'Leads', icon: TrendingUp },
    { key: 'Passport Leads', label: 'Passport Leads', icon: FileText },
];

export default function EmployeeDashboard({ initialTab = 'Customers' }) {
    const [activeTab, setActiveTab] = useState(initialTab);
    const token = localStorage.getItem('access_token');

    return (
        <div className="space-y-5 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full">CRM</span>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-2">Customer Management</h1>
                    <p className="text-xs text-slate-400 font-bold mt-0.5">Walk-in customers, leads, and passport applications</p>
                </div>
            </div>

            {/* Main tab bar */}
            <div className="flex gap-1 border-b border-slate-200">
                {MAIN_TABS.map(({ key, label, icon: Icon }) => (
                    <button key={key} onClick={() => setActiveTab(key)}
                        className={`flex items-center gap-2 px-5 py-3 text-[11px] font-black uppercase tracking-wider border-b-2 transition-all ${activeTab === key
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                        <Icon size={14} />
                        {label}
                    </button>
                ))}
            </div>

            {/* Section */}
            {activeTab === 'Customers' && <CustomersSection token={token} />}
            {activeTab === 'Leads' && <LeadsSection token={token} />}
            {activeTab === 'Passport Leads' && <PassportLeadsSection token={token} />}
        </div>
    );
}
