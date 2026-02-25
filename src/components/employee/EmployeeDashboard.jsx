import React, { useState, useEffect, useMemo } from 'react';
import {
    Users, TrendingUp, Search, Eye, Phone, Mail,
    Zap, BookOpen, CreditCard, CheckSquare, Clock,
    ChevronDown, AlertCircle, Star, FileText, X, Check,
    ArrowRight, UserCheck, UserX, DollarSign, Plus, ChevronUp, MessageSquare
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

function LeadsSection({ token, onViewLead }) {
    const [sub, setSub] = useState(() => sessionStorage.getItem('empLeadsSub') || 'followup_dashboard');
    useEffect(() => { sessionStorage.setItem('empLeadsSub', sub); }, [sub]);
    const [all, setAll] = useState([]);
    const [tasks, setTasks] = useState([]);
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
            const t = token || localStorage.getItem('access_token');
            const [leadsRes, tasksRes] = await Promise.all([
                fetch(`${API}/leads/`, { headers: { Authorization: `Bearer ${t}` } }),
                fetch(`${API}/tasks/`, { headers: { Authorization: `Bearer ${t}` } })
            ]);

            if (leadsRes.ok) {
                const data = await leadsRes.json();
                const list = Array.isArray(data) ? data : (data.leads || data.results || []);
                setAll(list);
            }
            if (tasksRes.ok) {
                const taskData = await tasksRes.json();
                const taskList = Array.isArray(taskData) ? taskData : (taskData.tasks || taskData.results || []);
                setTasks(taskList);
            }
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    // Derived lists from 'all' leads
    const isClosed = l => l.lead_status === 'lost' || l.conversion_status === 'converted_to_booking' || l.conversion_status === 'lost';
    const loans = useMemo(() => all.filter(l => hasLoan(l) && !isClosed(l)), [all]);
    const instants = useMemo(() => all.filter(l => l.is_instant && !isClosed(l)), [all]);
    const closed = useMemo(() => all.filter(isClosed), [all]);
    const pureLeads = useMemo(() => all.filter(l => !hasLoan(l) && !hasTask(l) && !isClosed(l)), [all]);

    const today = new Date().toISOString().split('T')[0];
    const todayFollowups = useMemo(() => all.filter(l => l.next_followup_date === today && !isClosed(l)), [all]);

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
    const LOAN_COLS = ['Name', 'Contact', 'Amount (PKR)', 'Recovered', 'Remaining', 'Due Date', 'Loan Status', 'Actions'];
    const TASK_COLS = ['Name', 'Contact', 'Type', 'Assigned To', 'Next Follow-up', 'Status', 'Actions'];
    const FU_COLS = ['Name', 'Contact', 'Type', 'Next Follow-up', 'Status', 'Actions'];
    const CLOSED_COLS = ['Name', 'Contact', 'Status', 'Reason', 'Closed On', 'Actions'];

    const LeadRow = ({ l }) => (
        <tr className="hover:bg-slate-50/50 transition-colors">
            <Td>
                <div className="font-black text-slate-800">{l.customer_full_name || '—'}</div>
                {l.remarks && <div className="text-xs text-slate-400 truncate max-w-[160px]">{l.remarks}</div>}
            </Td>
            <Td>
                <div>{l.contact_number || '—'}</div>
                {l.whatsapp_number && <div className="text-xs text-slate-400">WA: {l.whatsapp_number}</div>}
            </Td>
            <Td><Badge cls={STATUS_COLORS[l.lead_status] || STATUS_COLORS.new} label={l.lead_status || 'new'} /></Td>
            <Td>{l.interested_in ? <Badge cls="bg-purple-100 text-purple-700" label={l.interested_in} /> : '—'}</Td>
            <Td className="capitalize">{l.lead_source || '—'}</Td>
            <Td><Badge cls={CONV_COLORS[l.conversion_status] || CONV_COLORS.not_converted} label={(l.conversion_status || 'not_converted').replace(/_/g, ' ')} /></Td>
            <Td>{l.is_instant ? <Zap size={14} className="text-amber-500" /> : '—'}</Td>
            <Td>
                <div className="flex items-center gap-1.5 flex-wrap">
                    <button onClick={(e) => { e.stopPropagation(); if (typeof onViewLead === 'function') onViewLead(l); }} className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase hover:bg-blue-100 transition-all">
                        <Eye size={11} /> View
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); openUpdateFollowup(l); }} className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-black uppercase hover:bg-amber-100 transition-all">
                        <Clock size={11} /> Update
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleCloseLead(l); }} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-500 rounded-lg text-[9px] font-black uppercase hover:bg-red-100 transition-all">
                        <X size={11} /> Close
                    </button>
                </div>
            </Td>
        </tr>
    );




    const LoanRow = ({ l }) => {
        const amt = Number(l.loan_amount || 0);
        const rec = Number(l.recovered_amount || 0);
        const pending = amt - rec;
        const status = amt > 0 && rec >= amt ? 'cleared' : (l.next_followup_date && new Date(l.next_followup_date) < new Date() && rec < amt) ? 'overdue' : 'pending';
        const updateLeadFields = async (leadId, payload) => {
            try {
                const t = token || localStorage.getItem('access_token');
                const res = await fetch(`${API}/leads/${leadId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    fetchLeads();
                    return await res.json();
                } else {
                    const err = await res.json();
                    alert(err.detail || 'Failed to update lead');
                }
            } catch (e) { console.error(e); alert('Error updating lead'); }
        };

        // Instead of quick prompts, open the Add Loan modal and set a mode
        const handleAddRemarksAction = () => {
            setSelectedLeadForLoan(l);
            // preload existing remarks and loan amount into the modal for editing (remarks prefilled, recovered input blank)
            setLoanForm(f => ({ ...f, remarks: l.remarks || '', loan_amount: l.loan_amount || '', recovered_amount: '' }));
            setActionMode('add_remarks');
            setShowAddLoan(true);
        };

        const handleAddBalanceAction = () => {
            setSelectedLeadForLoan(l);
            // use recovered_amount field in modal to capture amount-to-add
            // preload loan_amount and current recovered amount
            setLoanForm(f => ({ ...f, loan_amount: l.loan_amount || '', recovered_amount: '' }));
            setActionMode('add_balance');
            setShowAddLoan(true);
        };

        const handleRescheduleAction = () => {
            setSelectedLeadForLoan(l);
            setLoanForm(f => ({ ...f, loan_promise_date: l.loan_promise_date || '', loan_amount: l.loan_amount || '', recovered_amount: '' }));
            setActionMode('reschedule');
            setShowAddLoan(true);
        };

        const handleClearLoanAction = async () => {
            if (!window.confirm('Mark loan as cleared?')) return;
            const loanAmt = Number(l.loan_amount || 0) || 0;
            await updateLeadFields(l._id || l.id, { recovered_amount: loanAmt, loan_status: 'cleared' });
        };

        const handleViewAction = (ev) => {
            ev && ev.stopPropagation();
            const id = l._id || l.id;
            if (typeof onViewLead === 'function') return onViewLead(l);
            window.history.pushState(null, '', `/leads/${id}`);
        };

        return (
            <tr className="hover:bg-slate-50/50 transition-colors">
                <Td><span className="font-black text-slate-800">{l.customer_full_name || '—'}</span></Td>
                <Td>{l.contact_number || '—'}</Td>
                <Td><span className="font-black text-slate-800">PKR {amt.toLocaleString()}</span></Td>
                <Td><span className="text-green-600 font-black">PKR {rec.toLocaleString()}</span></Td>
                <Td><span className="font-black">PKR {Math.max(0, pending).toLocaleString()}</span></Td>
                <Td>{l.loan_promise_date || '—'}</Td>
                <Td><Badge cls={LOAN_COLORS[status]} label={status} /></Td>
                <Td>
                    <div className="flex items-center gap-2">
                        <button onClick={() => { setSelectedLeadForLoan(l); setLoanForm(f => ({ ...f, loan_amount: l.loan_amount || '', recovered_amount: '', loan_promise_date: l.loan_promise_date || '' })); setActionMode('create'); setShowAddLoan(true); }} className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg font-black">Update</button>
                        <button onClick={handleViewAction} className="text-xs px-3 py-1.5 bg-white text-slate-600 border rounded-lg">View</button>
                    </div>
                </Td>
            </tr>
        );
    };




    // ── Shared Remarks Chat Panel ──────────────────────────────────────────
    const RemarksChatPanel = ({ entityId, entityType, initialRemarks, token: tkn }) => {
        const [remarks, setRemarks] = React.useState(Array.isArray(initialRemarks) ? initialRemarks : []);
        const [text, setText] = React.useState('');
        const [sending, setSending] = React.useState(false);
        const bottomRef = React.useRef(null);

        React.useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [remarks]);

        const submit = async (e) => {
            e.preventDefault();
            if (!text.trim()) return;
            setSending(true);
            try {
                const t = tkn || localStorage.getItem('access_token') || localStorage.getItem('token');
                const url = entityType === 'task'
                    ? `${API}/tasks/${entityId}/remarks`
                    : `${API}/leads/${entityId}/remarks`;
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
                    body: JSON.stringify({ text: text.trim() })
                });
                if (res.ok) {
                    const data = await res.json();
                    setRemarks(prev => [...prev, data.remark]);
                    setText('');
                }
            } catch { } finally { setSending(false); }
        };

        const fmtTime = (iso) => {
            if (!iso) return 'Just now';
            try {
                const d = new Date(iso);
                if (isNaN(d)) return 'Just now';
                return d.toLocaleString('en-PK', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
            } catch { return 'Just now'; }
        };

        return (
            <div className="bg-slate-50 border-t border-slate-100 px-5 py-4 space-y-3">
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                    {remarks.length === 0 && (
                        <p className="text-xs text-slate-400 text-center py-4 font-bold">No remarks yet. Add the first one below.</p>
                    )}
                    {remarks.map((r, i) => {
                        const etBadge = { organization: 'bg-purple-100 text-purple-700', branch: 'bg-green-100 text-green-700', agency: 'bg-orange-100 text-orange-700', employee: 'bg-blue-100 text-blue-700' }[r.entity_type] || 'bg-slate-100 text-slate-600';
                        return (
                            <div key={i} className="flex gap-2.5 items-start">
                                <div className="w-7 h-7 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center text-white text-[10px] font-black mt-0.5">
                                    {(r.author_name || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                        <span className="text-[10px] font-black text-slate-700">{r.author_name || 'Unknown'}</span>
                                        {r.entity_type && <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full leading-none ${etBadge}`}>{r.entity_type}</span>}
                                        <span className="text-[9px] text-slate-300 font-bold ml-auto">{fmtTime(r.created_at)}</span>
                                    </div>
                                    <div className="bg-white border border-slate-100 rounded-xl px-3 py-2 text-xs text-slate-700 shadow-sm">
                                        {r.text}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={bottomRef} />
                </div>
                <form onSubmit={submit} className="flex gap-2 items-center">
                    <input
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder="Add a remark…"
                        className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100"
                    />
                    <button type="submit" disabled={sending || !text.trim()}
                        className="px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-black disabled:opacity-40 hover:bg-blue-700 transition-all">
                        {sending ? '…' : 'Send'}
                    </button>
                </form>
            </div>
        );
    };



    const TaskRow = ({ l }) => (
        <tr className="hover:bg-slate-50/50 transition-colors">
            <Td>
                <div className="font-black text-slate-800">{l.customer_name || 'Internal'}</div>
                {l.description && <div className="text-xs text-slate-400 truncate max-w-[200px]">{l.description}</div>}
            </Td>
            <Td>
                <div>{l.contact_number || '—'}</div>
                {l.whatsapp_number && <div className="text-xs text-slate-400">WA: {l.whatsapp_number}</div>}
            </Td>
            <Td>
                <Badge cls={l.task_type === 'customer' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'} label={l.task_type || 'internal'} />
            </Td>
            <Td>{l.created_by ? 'Assigned' : '—'}</Td>
            <Td>
                <div className="font-bold text-slate-700">{l.follow_up_date || '—'}</div>
                <div className="text-xs text-slate-400">{l.follow_up_time || ''}</div>
            </Td>
            <Td><Badge cls={STATUS_COLORS[l.status] || STATUS_COLORS.new} label={l.status || 'pending'} /></Td>
            <Td>
                <button onClick={(e) => { e.stopPropagation(); openTaskRemarks(l); }} className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase hover:bg-blue-100 transition-all">
                    <Eye size={11} /> View
                </button>
            </Td>
        </tr>
    );







    const SUB_TABS = [
        { key: 'followup_dashboard', label: 'Dashboard', icon: TrendingUp },
        { key: 'leads', label: 'Leads', icon: Users },
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

    // ── Add Lead Modal & Helpers ──────────────────────────────────────────
    const [showAddLead, setShowAddLead] = useState(false);
    // ── Add Loan Modal & Helpers ──────────────────────────────────────────
    const [showAddLoan, setShowAddLoan] = useState(false);
    const [actionMode, setActionMode] = useState(''); // '', 'add_remarks', 'add_balance', 'reschedule'
    const [loanLeadSearch, setLoanLeadSearch] = useState('');
    const [loanSearchResults, setLoanSearchResults] = useState([]);
    const [selectedLeadForLoan, setSelectedLeadForLoan] = useState(null);
    const [loanForm, setLoanForm] = useState({ loan_amount: '', recovered_amount: 0, loan_promise_date: '', loan_status: 'pending', remarks: '' });
    const [loanFormErrors, setLoanFormErrors] = useState({});
    const [expandedGroups, setExpandedGroups] = useState({});
    const [leadSearch, setLeadSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [leadForm, setLeadForm] = useState({
        customer_full_name: '',
        contact_number: '',
        whatsapp_number: '',
        email: '',
        city: '',
        country: '',
        customer_id: '',
        address: '',
        interested_in: 'umrah',
        next_followup_date: '',
        next_followup_time: '',
        lead_source: 'walk-in',
        remarks: '',
        is_instant: false,
    });
    const [formErrors, setFormErrors] = useState({});

    // ── Update Followup Modal ──────────────────────────────────────────────
    const [showUpdateFollowup, setShowUpdateFollowup] = useState(false);
    const [followupTargetLead, setFollowupTargetLead] = useState(null);
    const [followupForm, setFollowupForm] = useState({ next_followup_date: '', next_followup_time: '', remarks: '', lead_status: 'followup' });
    const [followupFormErrors, setFollowupFormErrors] = useState({});

    const openUpdateFollowup = (l) => {
        setFollowupTargetLead(l);
        setFollowupForm({
            next_followup_date: l.next_followup_date || '',
            next_followup_time: l.next_followup_time || '',
            remarks: '',  // always blank; history is shown above
            lead_status: l.lead_status || 'followup',
        });
        setFollowupFormErrors({});
        setShowUpdateFollowup(true);
    };

    // ── Task Remarks Modal ──────────────────────────────────────────────────
    const [showTaskRemarks, setShowTaskRemarks] = useState(false);
    const [taskRemarksTarget, setTaskRemarksTarget] = useState(null);
    const openTaskRemarks = (task) => { setTaskRemarksTarget(task); setShowTaskRemarks(true); };


    const handleUpdateFollowup = async (e) => {
        e && e.preventDefault();
        const errors = {};
        if (!followupForm.next_followup_date) errors.next_followup_date = 'Required';
        setFollowupFormErrors(errors);
        if (Object.keys(errors).length > 0) return;
        try {
            const t = token || localStorage.getItem('access_token') || localStorage.getItem('token');
            const leadId = followupTargetLead._id || followupTargetLead.id;
            const res = await fetch(`${API}/leads/${leadId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
                body: JSON.stringify({
                    next_followup_date: followupForm.next_followup_date,
                    next_followup_time: followupForm.next_followup_time || null,
                    lead_status: followupForm.lead_status || 'followup',
                }),
            });
            if (res.ok) {
                // Also save as a chat remark if the user typed one
                if (followupForm.remarks && followupForm.remarks.trim()) {
                    try {
                        await fetch(`${API}/leads/${leadId}/remarks`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
                            body: JSON.stringify({ text: followupForm.remarks.trim() }),
                        });
                    } catch (re) { console.warn('Remark save failed', re); }
                }
                setShowUpdateFollowup(false);
                setFollowupTargetLead(null);
                fetchLeads();
            } else {
                const err = await res.json();
                alert(err.detail || 'Failed to update follow-up');
            }
        } catch (err) { console.error(err); alert('Error updating follow-up'); }
    };


    const handleCloseLead = async (l) => {
        if (!window.confirm(`Close / mark "${l.customer_full_name || 'this lead'}" as Lost?`)) return;
        try {
            const leadId = l._id || l.id;
            const res = await fetch(`${API}/leads/${leadId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lead_status: 'lost', conversion_status: 'lost' }),
            });
            if (res.ok) { fetchLeads(); }
            else { const err = await res.json(); alert(err.detail || 'Failed to close lead'); }
        } catch (err) { console.error(err); alert('Error closing lead'); }
    };

    // ── Add Task Modal & Helpers ──────────────────────────────────────────
    const [showAddTask, setShowAddTask] = useState(false);
    const [addTaskMode, setAddTaskMode] = useState('internal'); // 'internal' | 'customer'
    const [taskCustomerSearch, setTaskCustomerSearch] = useState('');
    const [taskCustomerResults, setTaskCustomerResults] = useState([]);
    const [selectedTaskCustomer, setSelectedTaskCustomer] = useState(null);
    const [taskForm, setTaskForm] = useState({
        customer_id: '',
        customer_name: '',
        contact_number: '',
        whatsapp_number: '',
        address: '',
        follow_up_date: '',
        follow_up_time: '',
        description: ''
    });
    const [taskFormErrors, setTaskFormErrors] = useState({});

    // Search aggregated customer database (name / city / phone)
    // Debounced search for leads only
    useEffect(() => {
        if (!leadSearch) { setSearchResults([]); return; }
        let cancelled = false;
        const timer = setTimeout(() => {
            (async () => {
                try {
                    const t = token || localStorage.getItem('access_token') || localStorage.getItem('token');
                    const q = encodeURIComponent(leadSearch);
                    // Query leads and customers and merge results
                    const [leadsRes, custRes] = await Promise.all([
                        fetch(`${API}/leads/?search=${q}`, { headers: { Authorization: `Bearer ${t}` } }),
                        fetch(`${API}/customers/?search=${q}`, { headers: { Authorization: `Bearer ${t}` } })
                    ]);
                    if (!leadsRes.ok && !custRes.ok) return;
                    const leadsData = leadsRes.ok ? await leadsRes.json() : [];
                    const custData = custRes.ok ? await custRes.json() : [];
                    if (cancelled) return;
                    const leadList = Array.isArray(leadsData) ? leadsData : (leadsData.leads || leadsData.results || []);
                    const custList = Array.isArray(custData) ? custData : (custData.customers || []);
                    // Mark types and normalize id
                    const leadsMarked = leadList.map(l => ({ ...l, __type: 'lead', __key: l._id || l.id }));
                    const customersMarked = custList.map(c => ({ ...c, __type: 'customer', __key: c._id || c.id || c.id }));
                    setSearchResults([...customersMarked, ...leadsMarked]);
                } catch (e) { console.error(e); }
            })();
        }, 250);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [leadSearch, token]);

    // Debounced search for task customer selection
    useEffect(() => {
        if (!taskCustomerSearch) { setTaskCustomerResults([]); return; }
        let cancelled = false;
        const timer = setTimeout(() => {
            (async () => {
                try {
                    const t = token || localStorage.getItem('access_token') || localStorage.getItem('token');
                    const q = encodeURIComponent(taskCustomerSearch);
                    const [leadsRes, custRes] = await Promise.all([
                        fetch(`${API}/leads/?search=${q}`, { headers: { Authorization: `Bearer ${t}` } }),
                        fetch(`${API}/customers/?search=${q}`, { headers: { Authorization: `Bearer ${t}` } }),
                    ]);
                    const leadsData = leadsRes.ok ? await leadsRes.json() : [];
                    const custData = custRes.ok ? await custRes.json() : [];
                    if (cancelled) return;
                    const leadList = (Array.isArray(leadsData) ? leadsData : (leadsData.leads || leadsData.results || [])).map(l => ({ ...l, __type: 'lead', __key: l._id || l.id }));
                    const custList = (Array.isArray(custData) ? custData : (custData.customers || [])).map(c => ({ ...c, __type: 'customer', __key: c._id || c.id }));
                    setTaskCustomerResults([...custList, ...leadList]);
                } catch (e) { console.error(e); }
            })();
        }, 250);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [taskCustomerSearch, token]);

    // Debounced search for loan lead selection
    useEffect(() => {
        if (!loanLeadSearch) { setLoanSearchResults([]); return; }
        let cancelled = false;
        const timer = setTimeout(() => {
            (async () => {
                try {
                    const t = token || localStorage.getItem('access_token') || localStorage.getItem('token');
                    const q = encodeURIComponent(loanLeadSearch);
                    const res = await fetch(`${API}/leads/?search=${q}`, { headers: { Authorization: `Bearer ${t}` } });
                    if (!res.ok) return;
                    const data = await res.json();
                    if (cancelled) return;
                    const list = Array.isArray(data) ? data : (data.leads || data.results || []);
                    const marked = list.map(l => ({ ...l, __key: l._id || l.id }));
                    setLoanSearchResults(marked);
                } catch (e) { console.error(e); }
            })();
        }, 250);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [loanLeadSearch, token]);

    const handleSelectSearch = (item) => {
        setLeadForm(f => ({
            ...f,
            customer_full_name: item.customer_full_name || item.full_name || item.name || '',
            contact_number: item.contact_number || item.phone || item.contact || '',
            whatsapp_number: item.whatsapp_number || item.whatsapp || item.whatsapp_no || '',
            email: item.email || '',
            city: item.city || '',
            country: item.country || '',
            customer_id: (item.__type === 'customer') ? (item._id || item.id || item.__key) : (item.customer_id || ''),
            address: item.address || '',
            remarks: item.remarks || item.note || f.remarks || '',
            next_followup_date: item.next_followup_date || f.next_followup_date || '',
            next_followup_time: item.next_followup_time || f.next_followup_time || '',
        }));
        setSearchResults([]);
        setLeadSearch('');
    };

    const handleSelectLoanLead = (item) => {
        setSelectedLeadForLoan(item);
        setLoanSearchResults([]);
        setLoanLeadSearch('');
    };

    const handleCreateLead = async (e) => {
        e && e.preventDefault();
        // client-side validation for required fields
        const required = ['customer_full_name', 'contact_number', 'email', 'interested_in', 'lead_source', 'next_followup_date', 'next_followup_time', 'city', 'country', 'remarks'];
        const errors = {};
        required.forEach(f => { if (!leadForm[f] || (typeof leadForm[f] === 'string' && !leadForm[f].trim())) errors[f] = 'Required'; });
        setFormErrors(errors);
        if (Object.keys(errors).length > 0) {
            // focus first error field
            const key = Object.keys(errors)[0];
            const el = document.querySelector(`[name=lead_${key}]`);
            if (el) el.focus();
            return;
        }
        try {
            const t = token || localStorage.getItem('access_token') || localStorage.getItem('token');
            const payload = {
                customer_full_name: leadForm.customer_full_name,
                contact_number: leadForm.contact_number,
                whatsapp_number: leadForm.whatsapp_number,
                email: leadForm.email,
                address: leadForm.address,
                city: leadForm.city,
                country: leadForm.country,
                customer_id: leadForm.customer_id || null,
                interested_in: leadForm.interested_in,
                next_followup_date: leadForm.next_followup_date || null,
                next_followup_time: leadForm.next_followup_time || null,
                lead_source: leadForm.lead_source,
                remarks: leadForm.remarks,
                is_instant: !!leadForm.is_instant,
            };
            const res = await fetch(`${API}/leads/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const created = await res.json();
                setShowAddLead(false);
                // refresh leads list
                fetchLeads();
                setLeadForm({
                    customer_full_name: '', contact_number: '', whatsapp_number: '', email: '', city: '', country: '', customer_id: '', address: '', interested_in: 'umrah', next_followup_date: '', next_followup_time: '', lead_source: 'walk-in', remarks: '', is_instant: false
                });
                setFormErrors({});
                alert('Lead created successfully');
            } else {
                const err = await res.json();
                alert(err.detail || 'Failed to create lead');
            }
        } catch (err) { console.error(err); alert('Error creating lead'); }
    };

    const handleCreateTask = async (e) => {
        e && e.preventDefault();
        const errors = {};
        if (addTaskMode === 'customer' && !selectedTaskCustomer) errors.task_customer = 'Search and select a customer';
        if (!taskForm.follow_up_date) errors.follow_up_date = 'Required';
        if (!taskForm.follow_up_time) errors.follow_up_time = 'Required';
        if (!taskForm.description || !taskForm.description.trim()) errors.description = 'Required';

        setTaskFormErrors(errors);
        if (Object.keys(errors).length > 0) return;

        try {
            const t = token || localStorage.getItem('access_token') || localStorage.getItem('token');
            const cust = selectedTaskCustomer;
            const payload = {
                task_type: addTaskMode,
                customer_id: cust ? (cust._id || cust.id || cust.__key || null) : null,
                customer_name: cust ? (cust.customer_full_name || cust.full_name || cust.name || cust.customer_name || null) : null,
                contact_number: cust ? (cust.contact_number || cust.phone || null) : null,
                whatsapp_number: cust ? (cust.whatsapp_number || null) : null,
                address: cust ? (cust.address || null) : null,
                follow_up_date: taskForm.follow_up_date,
                follow_up_time: taskForm.follow_up_time,
                description: taskForm.description
            };
            const res = await fetch(`${API}/tasks/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setShowAddTask(false);
                setSelectedTaskCustomer(null);
                setTaskCustomerSearch('');
                setTaskCustomerResults([]);
                fetchLeads();
                setTaskForm({ customer_id: '', customer_name: '', contact_number: '', whatsapp_number: '', address: '', follow_up_date: '', follow_up_time: '', description: '' });
                setTaskFormErrors({});
                alert('Task created successfully');
            } else {
                const err = await res.json();
                alert(err.detail || 'Failed to create task');
            }
        } catch (err) { console.error(err); alert('Error creating task'); }
    };

    const handleCreateLoan = async (e) => {
        e && e.preventDefault();
        const errors = {};
        if (!selectedLeadForLoan) errors.lead = 'Select lead';
        // Validation depends on actionMode
        if (!actionMode || actionMode === 'create') {
            if (!loanForm.loan_amount || Number(loanForm.loan_amount) <= 0) errors.loan_amount = 'Enter amount';
            if (!loanForm.loan_promise_date) errors.loan_promise_date = 'Enter promise date';
        } else if (actionMode === 'add_balance') {
            if (!loanForm.recovered_amount || Number(loanForm.recovered_amount) <= 0) {
                errors.recovered_amount = 'Enter amount to add';
            } else {
                const add = Number(loanForm.recovered_amount || 0);
                const current = Number(selectedLeadForLoan?.recovered_amount || 0);
                const loanAmt = Number(selectedLeadForLoan?.loan_amount || loanForm.loan_amount || 0);
                const remaining = loanAmt - current;
                if (add > remaining) errors.recovered_amount = `Cannot exceed remaining PKR ${remaining}`;
            }
        } else if (actionMode === 'reschedule') {
            if (!loanForm.loan_promise_date) errors.loan_promise_date = 'Enter promise date';
        } else if (actionMode === 'add_remarks') {
            if (!loanForm.remarks || !String(loanForm.remarks).trim()) errors.remarks = 'Enter remarks';
        }
        setLoanFormErrors(errors);
        if (Object.keys(errors).length > 0) return;
        try {
            const t = token || localStorage.getItem('access_token') || localStorage.getItem('token');
            const leadId = selectedLeadForLoan._id || selectedLeadForLoan.id || selectedLeadForLoan.__key;
            let payload = {};
            if (!actionMode || actionMode === 'create') {
                payload = {
                    loan_amount: Number(loanForm.loan_amount),
                    recovered_amount: Number(loanForm.recovered_amount || 0),
                    loan_promise_date: loanForm.loan_promise_date || null,
                    loan_status: loanForm.loan_status,
                    remarks: loanForm.remarks || ''
                };
            } else if (actionMode === 'add_remarks') {
                // replace stored remarks with the edited text from the modal
                payload = { remarks: loanForm.remarks || '' };
            } else if (actionMode === 'add_balance') {
                const add = Number(loanForm.recovered_amount || 0);
                const current = Number(selectedLeadForLoan.recovered_amount || 0);
                const newRecovered = current + add;
                const loanAmt = Number(selectedLeadForLoan.loan_amount || loanForm.loan_amount || 0);
                const newStatus = loanAmt > 0 && newRecovered >= loanAmt ? 'cleared' : (loanForm.loan_status || selectedLeadForLoan.loan_status || 'pending');
                payload = { recovered_amount: newRecovered, loan_status: newStatus };
            } else if (actionMode === 'reschedule') {
                payload = { loan_promise_date: loanForm.loan_promise_date || null };
            }
            const res = await fetch(`${API}/leads/${leadId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                alert('Updated');
                setShowAddLoan(false);
                setSelectedLeadForLoan(null);
                setLoanForm({ loan_amount: '', recovered_amount: 0, loan_promise_date: '', loan_status: 'pending', remarks: '' });
                setActionMode('');
                // refresh leads list
                fetchLeads();
            } else {
                const err = await res.json();
                alert(err.detail || 'Failed to add loan');
            }
        } catch (err) { console.error(err); alert('Error adding loan'); }
    };

    const isFormValid = () => {
        const required = ['customer_full_name', 'contact_number', 'email', 'interested_in', 'lead_source', 'next_followup_date', 'next_followup_time', 'city', 'country', 'remarks'];
        return required.every(f => leadForm[f] && (typeof leadForm[f] !== 'string' || leadForm[f].trim()));
    };

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
                            <div className="flex items-center gap-2">
                                <button onClick={() => setShowAddLead(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-[12px] font-black hover:bg-blue-700 transition-all">
                                    <Plus size={14} /> Add Lead
                                </button>
                            </div>
                        </div>

                        {/* Add Lead Modal */}
                        {showAddLead && (
                            <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
                                <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddLead(false)} />
                                <form onSubmit={handleCreateLead} className="relative z-50 w-full max-w-2xl bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-black">Add Lead</h3>
                                            <p className="text-xs text-slate-400">Quickly create a lead from search or manual entry</p>
                                        </div>
                                        <button type="button" onClick={() => setShowAddLead(false)} className="text-slate-400 hover:text-slate-600">Close</button>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Search</label>
                                            <input value={leadSearch} onChange={e => setLeadSearch(e.target.value)} placeholder="Search name, city or phone" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                                            {searchResults.length > 0 && (
                                                <div className="mt-2 bg-white border border-slate-200 rounded-xl max-h-48 overflow-y-auto">
                                                    {searchResults.map((r, i) => (
                                                        <button key={i} type="button" onClick={() => handleSelectSearch(r)} className="w-full text-left px-4 py-3 hover:bg-blue-50">
                                                            <div className="font-bold text-slate-800">{r.customer_full_name || r.full_name || r.name || 'Unknown'}</div>
                                                            <div className="text-xs text-slate-400">{r.contact_number || r.phone || r.contact || ''}{r.whatsapp_number ? ` • WA: ${r.whatsapp_number}` : ''}{(r.email || r.address) ? ' • ' : ''}{r.email || ''}</div>
                                                            {(r.city || r.country) && <div className="text-xs text-slate-400">{[r.city, r.country].filter(Boolean).join(', ')}</div>}
                                                            {r.address && <div className="text-xs text-slate-400">{r.address}</div>}
                                                            {r.remarks && <div className="text-xs text-slate-400">Remarks: {r.remarks}</div>}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name *</label>
                                                <input name="lead_customer_full_name" required value={leadForm.customer_full_name} onChange={e => setLeadForm(f => ({ ...f, customer_full_name: e.target.value }))} className={`w-full px-4 py-2 bg-white border rounded-xl text-sm ${formErrors.customer_full_name ? 'border-rose-400' : 'border-slate-200'}`} />
                                                {formErrors.customer_full_name && <div className="text-rose-600 text-xs mt-1">Required</div>}
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact *</label>
                                                <input name="lead_contact_number" required value={leadForm.contact_number} onChange={e => setLeadForm(f => ({ ...f, contact_number: e.target.value }))} className={`w-full px-4 py-2 bg-white border rounded-xl text-sm ${formErrors.contact_number ? 'border-rose-400' : 'border-slate-200'}`} />
                                                {formErrors.contact_number && <div className="text-rose-600 text-xs mt-1">Required</div>}
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">WhatsApp Number</label>
                                                <input name="lead_whatsapp_number" value={leadForm.whatsapp_number} onChange={e => setLeadForm(f => ({ ...f, whatsapp_number: e.target.value }))} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</label>
                                                <input name="lead_email" value={leadForm.email} onChange={e => setLeadForm(f => ({ ...f, email: e.target.value }))} className={`w-full px-4 py-2 bg-white border rounded-xl text-sm ${formErrors.email ? 'border-rose-400' : 'border-slate-200'}`} />
                                                {formErrors.email && <div className="text-rose-600 text-xs mt-1">Required</div>}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interested In</label>
                                                <select name="lead_interested_in" value={leadForm.interested_in} onChange={e => setLeadForm(f => ({ ...f, interested_in: e.target.value }))} className={`w-full px-4 py-2 bg-white border rounded-xl text-sm ${formErrors.interested_in ? 'border-rose-400' : 'border-slate-200'}`}>
                                                    <option value="umrah">Umrah</option>
                                                    <option value="ticket">Ticket</option>
                                                    <option value="visa">Visa</option>
                                                    <option value="hotel">Hotel</option>
                                                    <option value="transport">Transport</option>
                                                </select>
                                                {formErrors.interested_in && <div className="text-rose-600 text-xs mt-1">Required</div>}
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Source</label>
                                                <select name="lead_lead_source" value={leadForm.lead_source} onChange={e => setLeadForm(f => ({ ...f, lead_source: e.target.value }))} className={`w-full px-4 py-2 bg-white border rounded-xl text-sm ${formErrors.lead_source ? 'border-rose-400' : 'border-slate-200'}`}>
                                                    <option value="walk-in">Walk-in</option>
                                                    <option value="whatsapp">WhatsApp</option>
                                                    <option value="call">Call</option>
                                                    <option value="referral">Referral</option>
                                                    <option value="facebook">Facebook</option>
                                                </select>
                                                {formErrors.lead_source && <div className="text-rose-600 text-xs mt-1">Required</div>}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Follow-up Date</label>
                                            <input name="lead_next_followup_date" type="date" value={leadForm.next_followup_date} onChange={e => setLeadForm(f => ({ ...f, next_followup_date: e.target.value }))} className={`w-full px-4 py-2 bg-white border rounded-xl text-sm ${formErrors.next_followup_date ? 'border-rose-400' : 'border-slate-200'}`} />
                                            {formErrors.next_followup_date && <div className="text-rose-600 text-xs mt-1">Required</div>}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Follow-up Time</label>
                                                <input name="lead_next_followup_time" type="time" value={leadForm.next_followup_time} onChange={e => setLeadForm(f => ({ ...f, next_followup_time: e.target.value }))} className={`w-full px-4 py-2 bg-white border rounded-xl text-sm ${formErrors.next_followup_time ? 'border-rose-400' : 'border-slate-200'}`} />
                                                {formErrors.next_followup_time && <div className="text-rose-600 text-xs mt-1">Required</div>}
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">City</label>
                                                    <input name="lead_city" value={leadForm.city} onChange={e => setLeadForm(f => ({ ...f, city: e.target.value }))} className={`w-full px-4 py-2 bg-white border rounded-xl text-sm ${formErrors.city ? 'border-rose-400' : 'border-slate-200'}`} />
                                                    {formErrors.city && <div className="text-rose-600 text-xs mt-1">Required</div>}
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Country</label>
                                                    <input name="lead_country" value={leadForm.country} onChange={e => setLeadForm(f => ({ ...f, country: e.target.value }))} className={`w-full px-4 py-2 bg-white border rounded-xl text-sm ${formErrors.country ? 'border-rose-400' : 'border-slate-200'}`} />
                                                    {formErrors.country && <div className="text-rose-600 text-xs mt-1">Required</div>}
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Address</label>
                                            <input value={leadForm.address} onChange={e => setLeadForm(f => ({ ...f, address: e.target.value }))} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm" />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Remarks</label>
                                            <textarea name="lead_remarks" value={leadForm.remarks} onChange={e => setLeadForm(f => ({ ...f, remarks: e.target.value }))} rows={3} className={`w-full px-4 py-2 bg-white border rounded-xl text-sm resize-none ${formErrors.remarks ? 'border-rose-400' : 'border-slate-200'}`} />
                                            {formErrors.remarks && <div className="text-rose-600 text-xs mt-1">Required</div>}
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <label className="inline-flex items-center gap-2">
                                                <input type="checkbox" checked={leadForm.is_instant} onChange={e => setLeadForm(f => ({ ...f, is_instant: e.target.checked }))} />
                                                <span className="text-sm font-bold ml-1">Mark as Instant Lead</span>
                                            </label>
                                            <div className="flex-1" />
                                            <div className="flex items-center gap-2">
                                                <button type="button" onClick={() => setShowAddLead(false)} className="px-4 py-2 rounded-xl bg-slate-100 font-bold">Cancel</button>
                                                <button type="submit" disabled={!isFormValid()} className={`px-4 py-2 rounded-xl text-white font-black ${isFormValid() ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300 cursor-not-allowed'}`}>Create Lead</button>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        )}
                        <div className="px-5 pb-4"><Filters /></div>
                        <Tbl cols={LEAD_COLS} emptyMsg="No leads found." emptyIcon={<TrendingUp size={36} className="text-slate-200" />}>
                            {loading
                                ? <tr><td colSpan={8} className="py-10 text-center text-xs text-slate-400 font-bold">Loading…</td></tr>
                                : (
                                    (() => {
                                        const rows = applyFilters(pureLeads);
                                        const groupsMap = new Map();
                                        rows.forEach(l => {
                                            const key = l.customer_id || (l.customer_full_name || '').trim() || (l._id || l.id || Math.random().toString(36).slice(2));
                                            const name = l.customer_full_name || 'Unknown';
                                            if (!groupsMap.has(key)) groupsMap.set(key, { name, leads: [] });
                                            groupsMap.get(key).leads.push(l);
                                        });
                                        const groups = Array.from(groupsMap.entries()).map(([key, v]) => ({ key, name: v.name, leads: v.leads }));

                                        if (groups.length === 0) return null;

                                        return groups.map(g => {
                                            // determine the latest lead by updated_at/created_at
                                            const latest = g.leads.reduce((acc, cur) => {
                                                if (!acc) return cur;
                                                const a = new Date(acc.updated_at || acc.created_at || 0);
                                                const b = new Date(cur.updated_at || cur.created_at || 0);
                                                return b > a ? cur : acc;
                                            }, null);

                                            // If only one lead in the group, render it directly (no collapse)
                                            if (g.leads.length === 1) {
                                                const single = g.leads[0];
                                                return <LeadRow key={single._id || single.id || g.key} l={single} />;
                                            }

                                            // Multiple leads: render header with latest summary and expandable list
                                            return (
                                                <React.Fragment key={g.key}>
                                                    <tr className="bg-slate-50/60 cursor-pointer" onClick={() => setExpandedGroups(s => ({ ...s, [g.key]: !s[g.key] }))}>
                                                        <td colSpan={2} className="px-4 py-3 text-xs font-black text-slate-800">
                                                            {g.name} <span className="text-xs font-bold text-slate-400 ml-2">({g.leads.length})</span>
                                                            {latest && (
                                                                <div className="text-[11px] text-slate-500 font-bold mt-1">
                                                                    <span className="mr-3">{latest.contact_number || latest.phone || '—'}</span>
                                                                    <span className="mr-3">{latest.whatsapp_number ? `WA: ${latest.whatsapp_number}` : ''}</span>
                                                                    <span className="mr-3">{latest.interested_in || ''}</span>
                                                                    <span className="text-slate-400">{latest.lead_source ? `• ${latest.lead_source}` : ''}</span>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td colSpan={6} className="px-4 py-3 text-xs text-slate-400">Click to {expandedGroups[g.key] ? 'collapse' : 'expand'} leads</td>
                                                    </tr>
                                                    {expandedGroups[g.key] && g.leads.map(l => <LeadRow key={l._id || l.id} l={l} />)}
                                                </React.Fragment>
                                            );
                                        });
                                    })()
                                )
                            }
                        </Tbl>
                    </div>
                )}

                {/* ── Loans ── */}
                {sub === 'loans' && (
                    <div>
                        <div className="px-5 pt-5 pb-3">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-base font-black text-slate-900">Loans & Recovery</h2>
                                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">All loan entries with recovery tracking</p>
                                </div>
                                <div>
                                    <button onClick={() => { setSelectedLeadForLoan(null); setLoanForm({ loan_amount: '', recovered_amount: 0, loan_promise_date: '', loan_status: 'pending', remarks: '' }); setActionMode('create'); setShowAddLoan(true); }} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-black hover:bg-blue-700">
                                        <Plus size={14} /> Add Loan
                                    </button>
                                </div>
                            </div>
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
                                ? <tr><td colSpan={8} className="py-10 text-center text-xs text-slate-400 font-bold">Loading…</td></tr>
                                : loans.filter(l => !search || (l.customer_full_name || '').toLowerCase().includes(search.toLowerCase())).map(l => <LoanRow key={l._id || l.id} l={l} />)
                            }
                        </Tbl>
                    </div>
                )}

                {/* Add Loan Modal */}
                {showAddLoan && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
                        <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden">
                            <div className="p-5 border-b flex items-center justify-between">
                                <h3 className="text-lg font-black">{actionMode === 'add_remarks' ? 'Add Remarks' : actionMode === 'add_balance' ? 'Add Balance' : actionMode === 'reschedule' ? 'Reschedule Promise Date' : 'Add Loan to Lead'}</h3>
                                <button onClick={() => { setShowAddLoan(false); setActionMode(''); }} className="text-slate-400 hover:text-slate-600">Close</button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400">Search Lead</label>
                                    <input value={loanLeadSearch} onChange={e => setLoanLeadSearch(e.target.value)} placeholder="Search name, phone, city" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                                    {loanSearchResults.length > 0 && (
                                        <div className="mt-2 bg-white border border-slate-200 rounded-xl max-h-48 overflow-y-auto">
                                            {loanSearchResults.map((r, i) => (
                                                <button key={i} type="button" onClick={() => handleSelectLoanLead(r)} className="w-full text-left px-4 py-3 hover:bg-blue-50">
                                                    <div className="font-bold text-slate-800">{r.customer_full_name || r.full_name || r.name || 'Unknown'}</div>
                                                    <div className="text-xs text-slate-400">{r.contact_number || r.phone || ''} {r.whatsapp_number ? `• WA: ${r.whatsapp_number}` : ''}</div>
                                                    {(r.city || r.country) && <div className="text-xs text-slate-400">{[r.city, r.country].filter(Boolean).join(', ')}</div>}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {selectedLeadForLoan && (
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <div className="font-black text-slate-800">{selectedLeadForLoan.customer_full_name || selectedLeadForLoan.full_name}</div>
                                        <div className="text-xs text-slate-500">{selectedLeadForLoan.contact_number || selectedLeadForLoan.phone} {selectedLeadForLoan.whatsapp_number ? ` • WA: ${selectedLeadForLoan.whatsapp_number}` : ''}</div>
                                    </div>
                                )}

                                {actionMode === 'add_remarks' && (
                                    <div className="text-sm text-slate-500">Editing remarks for <strong>{selectedLeadForLoan?.customer_full_name}</strong>. Saving will replace the stored remarks.</div>
                                )}
                                {actionMode === 'add_balance' && (
                                    <div className="text-sm text-slate-500">Enter amount to add to recovered balance for <strong>{selectedLeadForLoan?.customer_full_name}</strong>.</div>
                                )}
                                {actionMode === 'reschedule' && (
                                    <div className="text-sm text-slate-500">Set a new promise date for <strong>{selectedLeadForLoan?.customer_full_name}</strong>.</div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400">Loan Amount (PKR)</label>
                                        <input value={loanForm.loan_amount} onChange={e => setLoanForm(f => ({ ...f, loan_amount: e.target.value }))} readOnly={actionMode && actionMode !== 'create'} className={`w-full px-4 py-2 bg-white border rounded-xl text-sm ${loanFormErrors.loan_amount ? 'border-rose-400' : 'border-slate-200'}`} />
                                        {loanFormErrors.loan_amount && <div className="text-rose-600 text-xs mt-1">{loanFormErrors.loan_amount}</div>}
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400">Promise Date</label>
                                        <input type="date" value={loanForm.loan_promise_date} onChange={e => setLoanForm(f => ({ ...f, loan_promise_date: e.target.value }))} className={`w-full px-4 py-2 bg-white border rounded-xl text-sm ${loanFormErrors.loan_promise_date ? 'border-rose-400' : 'border-slate-200'}`} />
                                        {loanFormErrors.loan_promise_date && <div className="text-rose-600 text-xs mt-1">{loanFormErrors.loan_promise_date}</div>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400">Remaining (PKR)</label>
                                        {(() => {
                                            const currentRec = Number(selectedLeadForLoan?.recovered_amount || 0);
                                            const loanAmt = Number(selectedLeadForLoan?.loan_amount || loanForm.loan_amount || 0);
                                            const remaining = Math.max(0, loanAmt - currentRec);
                                            return <div className="font-black">PKR {remaining.toLocaleString()}</div>;
                                        })()}

                                        <div className="mt-2">
                                            <label className="text-xs font-bold text-slate-400">Amount to Recover (PKR)</label>
                                            <input value={loanForm.recovered_amount} onChange={e => setLoanForm(f => ({ ...f, recovered_amount: e.target.value }))} placeholder="Enter amount to recover" className={`w-full mt-1 px-4 py-2 bg-white border rounded-xl text-sm ${loanFormErrors.recovered_amount ? 'border-rose-400' : 'border-slate-200'}`} />
                                            {loanFormErrors.recovered_amount && <div className="text-rose-600 text-xs mt-1">{loanFormErrors.recovered_amount}</div>}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400">Status</label>
                                        <select value={loanForm.loan_status} onChange={e => setLoanForm(f => ({ ...f, loan_status: e.target.value }))} className="w-full mt-2 p-2 rounded-lg border border-slate-100 text-sm font-bold">
                                            <option value="pending">pending</option>
                                            <option value="cleared">cleared</option>
                                            <option value="overdue">overdue</option>
                                        </select>
                                    </div>
                                </div>

                                {/* removed duplicate Status field */}

                                <div>
                                    <label className="text-xs font-bold text-slate-400">Remarks</label>
                                    <textarea value={loanForm.remarks} onChange={e => setLoanForm(f => ({ ...f, remarks: e.target.value }))} className="w-full mt-2 p-3 rounded-lg border border-slate-100 text-sm" rows={3}></textarea>
                                </div>

                                <div className="flex items-center gap-3 justify-end">
                                    <button onClick={() => { setShowAddLoan(false); setActionMode(''); }} className="px-4 py-2 rounded-xl bg-slate-100 font-bold">Cancel</button>
                                    <button onClick={handleCreateLoan} className="px-4 py-2 rounded-xl text-white font-black bg-blue-600 hover:bg-blue-700">{actionMode === 'create' ? 'Create Loan' : 'Update'}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Update Followup Modal ── */}
                {showUpdateFollowup && followupTargetLead && (
                    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 px-4">
                        <div className="absolute inset-0 bg-black/40" onClick={() => setShowUpdateFollowup(false)} />
                        <form onSubmit={handleUpdateFollowup} className="relative z-50 w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                            {/* Header */}
                            <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between">
                                <div>
                                    <h3 className="text-base font-black text-slate-900">Update Follow-up</h3>
                                    <p className="text-xs text-slate-400 mt-0.5">{followupTargetLead.customer_full_name || 'Lead'}</p>
                                </div>
                                <button type="button" onClick={() => setShowUpdateFollowup(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"><X size={16} /></button>
                            </div>

                            {/* Past Remarks (chat thread) */}
                            <div className="px-5 pt-4 pb-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Remarks History</p>
                                <div className="space-y-2 max-h-44 overflow-y-auto pr-1 bg-slate-50 rounded-xl p-3 border border-slate-100">
                                    {(followupTargetLead.chat_remarks || []).length === 0 && (
                                        <p className="text-xs text-slate-400 text-center py-2 font-bold">No previous remarks.</p>
                                    )}
                                    {(followupTargetLead.chat_remarks || []).map((r, i) => {
                                        let timeStr = '';
                                        if (r.created_at) {
                                            try { timeStr = new Date(r.created_at).toLocaleString('en-PK', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }); } catch { }
                                        } else {
                                            timeStr = 'Just now';
                                        }
                                        const etBadge = { organization: 'bg-purple-100 text-purple-700', branch: 'bg-green-100 text-green-700', agency: 'bg-orange-100 text-orange-700', employee: 'bg-blue-100 text-blue-700' }[r.entity_type] || 'bg-slate-100 text-slate-500';
                                        return (
                                            <div key={i} className="flex gap-2 items-start">
                                                <div className="w-6 h-6 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center text-white text-[9px] font-black">
                                                    {(r.author_name || 'U').charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                                        <span className="text-[10px] font-black text-slate-700">{r.author_name || 'Unknown'}</span>
                                                        {r.entity_type && <span className={`text-[7px] font-black uppercase px-1 py-0.5 rounded-full leading-none ${etBadge}`}>{r.entity_type}</span>}
                                                        <span className="text-[8px] text-slate-300 ml-auto">{timeStr}</span>
                                                    </div>
                                                    <div className="bg-white border border-slate-100 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">{r.text}</div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                </div>
                            </div>

                            {/* Form fields */}
                            <div className="px-5 py-3 space-y-3">
                                {/* Status */}
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lead Status</label>
                                    <select value={followupForm.lead_status} onChange={e => setFollowupForm(f => ({ ...f, lead_status: e.target.value }))}
                                        className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold">
                                        <option value="new">New</option>
                                        <option value="followup">Follow-up</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="lost">Lost</option>
                                    </select>
                                </div>

                                {/* Follow-up Date & Time */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next Follow-up Date <span className="text-rose-500">*</span></label>
                                        <input type="date" value={followupForm.next_followup_date}
                                            onChange={e => setFollowupForm(f => ({ ...f, next_followup_date: e.target.value }))}
                                            className={`w-full mt-1 px-3 py-2 bg-slate-50 border rounded-xl text-sm ${followupFormErrors.next_followup_date ? 'border-rose-400' : 'border-slate-200'}`} />
                                        {followupFormErrors.next_followup_date && <p className="text-rose-500 text-[10px] mt-0.5">{followupFormErrors.next_followup_date}</p>}
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time</label>
                                        <input type="time" value={followupForm.next_followup_time}
                                            onChange={e => setFollowupForm(f => ({ ...f, next_followup_time: e.target.value }))}
                                            className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                                    </div>
                                </div>

                                {/* New Remark */}
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Add New Remark</label>
                                    <textarea value={followupForm.remarks} rows={2}
                                        onChange={e => setFollowupForm(f => ({ ...f, remarks: e.target.value }))}
                                        placeholder="Type your remark about this follow-up…"
                                        className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none" />
                                </div>
                            </div>

                            <div className="px-5 pb-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowUpdateFollowup(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm">Cancel</button>
                                <button type="submit" className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm transition-all">Save Follow-up</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* ── Task Remarks Modal ── */}
                {showTaskRemarks && taskRemarksTarget && (
                    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 px-4">
                        <div className="absolute inset-0 bg-black/40" onClick={() => setShowTaskRemarks(false)} />
                        <div className="relative z-50 w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                            {/* Header */}
                            <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between">
                                <div>
                                    <h3 className="text-base font-black text-slate-900">Task Notes</h3>
                                    <p className="text-xs text-slate-400 mt-0.5">{taskRemarksTarget.customer_name || 'Internal Task'} · {taskRemarksTarget.description || ''}</p>
                                </div>
                                <button type="button" onClick={() => setShowTaskRemarks(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"><X size={16} /></button>
                            </div>
                            {/* Remarks thread */}
                            <RemarksChatPanel
                                entityId={taskRemarksTarget._id || taskRemarksTarget.id}
                                entityType="task"
                                initialRemarks={taskRemarksTarget.remarks || []}
                                token={token}
                            />
                        </div>
                    </div>
                )}



                {/* ── Tasks ── */}
                {sub === 'tasks' && (
                    <div>
                        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-black text-slate-900">Task Management</h2>
                                <p className="text-[10px] text-slate-400 font-bold mt-0.5">Team tasks, internal assignments, and customer requests</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => { setTaskForm({ customer_id: '', customer_name: '', contact_number: '', whatsapp_number: '', address: '', follow_up_date: '', follow_up_time: '', description: '' }); setSelectedTaskCustomer(null); setTaskCustomerSearch(''); setTaskCustomerResults([]); setAddTaskMode('internal'); setShowAddTask(true); }}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-[12px] font-black hover:bg-blue-700 transition-all">
                                    <Plus size={14} /> Add Task
                                </button>
                            </div>
                        </div>

                        {/* Add Task Modal */}
                        {showAddTask && (
                            <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
                                <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddTask(false)} />
                                <form onSubmit={handleCreateTask} className="relative z-50 w-full max-w-xl bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                                    <div className="p-5 border-b border-slate-50 flex items-start justify-between bg-slate-50/50">
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900">Add New Task</h3>
                                            <p className="text-xs text-slate-500 mt-1">Create a reminder or assign an objective</p>
                                        </div>
                                        <button type="button" onClick={() => setShowAddTask(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><X size={18} /></button>
                                    </div>

                                    <div className="p-6 space-y-5">
                                        {/* Type Toggle */}
                                        <div className="flex p-1 bg-slate-100/80 rounded-xl">
                                            <button type="button" onClick={() => setAddTaskMode('internal')} className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${addTaskMode === 'internal' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Internal Task</button>
                                            <button type="button" onClick={() => setAddTaskMode('customer')} className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${addTaskMode === 'customer' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Customer Task</button>
                                        </div>

                                        {/* Customer Search (Customer Tasks only) */}
                                        {addTaskMode === 'customer' && (
                                            <div className="p-4 bg-blue-50/50 rounded-xl space-y-3 border border-blue-100/50">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Search Customer / Lead <span className="text-rose-500">*</span></label>
                                                {selectedTaskCustomer ? (
                                                    <div className="flex items-center justify-between bg-white rounded-xl border border-blue-200 px-4 py-3">
                                                        <div>
                                                            <div className="font-black text-slate-800 text-sm">
                                                                {selectedTaskCustomer.customer_full_name || selectedTaskCustomer.full_name || selectedTaskCustomer.name || selectedTaskCustomer.customer_name || 'Unknown'}
                                                            </div>
                                                            <div className="text-xs text-slate-400">
                                                                {selectedTaskCustomer.contact_number || selectedTaskCustomer.phone || ''}
                                                                {selectedTaskCustomer.whatsapp_number ? ` · WA: ${selectedTaskCustomer.whatsapp_number}` : ''}
                                                            </div>
                                                        </div>
                                                        <button type="button" onClick={() => { setSelectedTaskCustomer(null); setTaskCustomerSearch(''); setTaskCustomerResults([]); }}
                                                            className="text-xs px-2 py-1 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200">Change</button>
                                                    </div>
                                                ) : (
                                                    <div className="relative">
                                                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                        <input value={taskCustomerSearch} onChange={e => setTaskCustomerSearch(e.target.value)}
                                                            placeholder="Type name, phone or city…"
                                                            className={`w-full pl-8 pr-4 py-2 bg-white border rounded-xl text-sm ${taskFormErrors.task_customer ? 'border-rose-400' : 'border-slate-200'}`} />
                                                        {taskCustomerResults.length > 0 && (
                                                            <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                                                                {taskCustomerResults.map((r, i) => (
                                                                    <button key={i} type="button"
                                                                        onClick={() => { setSelectedTaskCustomer(r); setTaskCustomerSearch(''); setTaskCustomerResults([]); }}
                                                                        className="w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b border-slate-50 last:border-0">
                                                                        <div className="font-bold text-slate-800 text-sm">
                                                                            {r.customer_full_name || r.full_name || r.name || r.customer_name || 'Unknown'}
                                                                            <span className="ml-2 text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">{r.__type}</span>
                                                                        </div>
                                                                        <div className="text-xs text-slate-400">
                                                                            {r.contact_number || r.phone || ''}
                                                                            {r.city ? ` · ${r.city}` : ''}
                                                                            {r.country ? `, ${r.country}` : ''}
                                                                        </div>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {taskFormErrors.task_customer && <p className="text-rose-500 text-[10px] font-bold">{taskFormErrors.task_customer}</p>}
                                            </div>
                                        )}

                                        {/* Core Task Fields */}
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Follow-up Date <span className="text-rose-500">*</span></label>
                                                    <input type="date" value={taskForm.follow_up_date} onChange={e => setTaskForm(f => ({ ...f, follow_up_date: e.target.value }))} className={`w-full px-3 py-2 bg-white border rounded-lg text-sm outline-blue-100 ${taskFormErrors.follow_up_date ? 'border-rose-400' : 'border-slate-200'}`} />
                                                    {taskFormErrors.follow_up_date && <p className="text-rose-500 text-[10px] font-bold mt-1">{taskFormErrors.follow_up_date}</p>}
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Follow-up Time <span className="text-rose-500">*</span></label>
                                                    <input type="time" value={taskForm.follow_up_time} onChange={e => setTaskForm(f => ({ ...f, follow_up_time: e.target.value }))} className={`w-full px-3 py-2 bg-white border rounded-lg text-sm outline-blue-100 ${taskFormErrors.follow_up_time ? 'border-rose-400' : 'border-slate-200'}`} />
                                                    {taskFormErrors.follow_up_time && <p className="text-rose-500 text-[10px] font-bold mt-1">{taskFormErrors.follow_up_time}</p>}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Task Description <span className="text-rose-500">*</span></label>
                                                <textarea value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} rows={4} className={`w-full px-3 py-2 bg-white border rounded-lg text-sm outline-blue-100 resize-none ${taskFormErrors.description ? 'border-rose-400' : 'border-slate-200'}`} placeholder="What needs to be done?"></textarea>
                                                {taskFormErrors.description && <p className="text-rose-500 text-[10px] font-bold mt-1">{taskFormErrors.description}</p>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-5 border-t border-slate-50 bg-slate-50/50 flex justify-end gap-3">
                                        <button type="button" onClick={() => setShowAddTask(false)} className="px-5 py-2.5 rounded-xl bg-white text-slate-600 font-bold border border-slate-200 hover:bg-slate-50 transition-colors">Cancel</button>
                                        <button type="submit" className="px-6 py-2.5 rounded-xl text-white font-black bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">Create Task</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <div className="px-5 pb-4 mt-2">
                            <div className="relative max-w-sm">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..."
                                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 shadow-sm rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100" />
                            </div>
                        </div>
                        <Tbl cols={TASK_COLS} emptyMsg="No tasks found." emptyIcon={<CheckSquare size={36} className="text-slate-200" />}>
                            {loading
                                ? <tr><td colSpan={7} className="py-10 text-center text-xs text-slate-400 font-bold">Loading…</td></tr>
                                : tasks.filter(l => !search || (l.customer_name || l.description || '').toLowerCase().includes(search.toLowerCase())).map(l => <TaskRow key={l._id || l.id} l={l} />)
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
                                        <Td><button onClick={(e) => { e.stopPropagation(); if (typeof onViewLead === 'function') onViewLead(l); }} className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase hover:bg-blue-100 transition-all"><Eye size={11} /> View</button></Td>
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
                                        <Td>
                                            <button onClick={(e) => { e.stopPropagation(); if (typeof onViewLead === 'function') onViewLead(l); }} className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase hover:bg-blue-100 transition-all">
                                                <Eye size={11} /> View
                                            </button>
                                        </Td>
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
                                        <Td><button onClick={(e) => { e.stopPropagation(); if (typeof onViewLead === 'function') onViewLead(l); }} className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase hover:bg-blue-100 transition-all"><Eye size={11} /> View</button></Td>
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
    const [view, setView] = useState(() => sessionStorage.getItem('empCustView') || 'walkIn');
    useEffect(() => { sessionStorage.setItem('empCustView', view); }, [view]);

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

                        <Tbl cols={['ID', 'Name', 'City', 'Source', 'Collected At', 'Status', 'Actions']}
                            emptyMsg="No customers in database. Click Sync Now to load." emptyIcon={<Users size={40} className="text-slate-200" />}>
                            {loadingDB
                                ? <tr><td colSpan={7} className="py-12 text-center text-xs text-slate-400 font-bold"><div className="flex justify-center"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div></td></tr>
                                : filteredDB.map((c, i) => (
                                    <tr key={c.id || i} className="hover:bg-slate-50/50 transition-colors">
                                        <Td cls="text-slate-400 font-mono text-[10px] font-bold">#{i + 1}</Td>
                                        <Td cls="font-black text-slate-800">{c.full_name || 'N/A'}</Td>
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


// ─── ADD PASSPORT LEAD MODAL ────────────────────────────────────────────────
function AddPassportLeadModal({ isOpen, onClose, onSave }) {
    const defaultLead = {
        customer_name: '', phone: '', cnic: '', passport_number: '', city: '',
        source: 'Walk-in', status: 'pending', next_followup_date: '', remarks: ''
    };
    const defaultPax = {
        first_name: '', last_name: '', nickname: '', passport_number: '',
        dob: '', age: '', gender: '', issue_date: '', expiry_date: '',
        issuing_country: '', nationality: '', phone: '', whatsapp: '', email: '',
        address: '', notes: ''
    };

    const [lead, setLead] = useState(defaultLead);
    const [pax, setPax] = useState(defaultPax);
    const [showPax, setShowPax] = useState(false);
    const [saving, setSaving] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        const payload = { ...lead };
        if (showPax) {
            payload.passenger_details = pax;
        }
        await onSave(payload);
        setSaving(false);
        setLead(defaultLead);
        setPax(defaultPax);
        setShowPax(false);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 leading-tight">Add New Lead</h2>
                        <p className="text-xs font-bold text-slate-400 mt-1">Create a new passport service lead</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 scrollbar-hide space-y-6">
                    <form id="lead-form" onSubmit={handleSubmit} className="space-y-6">
                        {/* Lead Details */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Customer Name *</label>
                                <input required value={lead.customer_name} onChange={e => setLead({ ...lead, customer_name: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Phone *</label>
                                <input required value={lead.phone} onChange={e => setLead({ ...lead, phone: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">CNIC</label>
                                <input value={lead.cnic} onChange={e => setLead({ ...lead, cnic: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Passport Number</label>
                                <input value={lead.passport_number} onChange={e => setLead({ ...lead, passport_number: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">City</label>
                                <input value={lead.city} onChange={e => setLead({ ...lead, city: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Lead Source</label>
                                <select value={lead.source} onChange={e => setLead({ ...lead, source: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all">
                                    <option value="Walk-in">Walk-in</option>
                                    <option value="Phone">Phone</option>
                                    <option value="Email">Email</option>
                                    <option value="Reference">Reference</option>
                                    <option value="Website">Website</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Follow-up Status</label>
                                <select value={lead.status} onChange={e => setLead({ ...lead, status: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all">
                                    <option value="pending">Pending</option>
                                    <option value="processing">Processing</option>
                                    <option value="completed">Completed</option>
                                    <option value="rejected">Rejected</option>
                                    <option value="converted">Converted</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Next Follow-up Date</label>
                                <input type="date" value={lead.next_followup_date} onChange={e => setLead({ ...lead, next_followup_date: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Remarks</label>
                                <textarea rows="2" value={lead.remarks} onChange={e => setLead({ ...lead, remarks: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all resize-none" />
                            </div>
                        </div>

                        {/* Passenger Details Toggle */}
                        <div className="pt-4 border-t border-slate-100">
                            <button type="button" onClick={() => setShowPax(!showPax)}
                                className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
                                {showPax ? <ChevronUp size={18} /> : <Plus size={18} />}
                                Passenger Details (Optional)
                            </button>
                        </div>

                        {/* Passenger Details Form */}
                        {showPax && (
                            <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">First Name *</label>
                                    <input required value={pax.first_name} onChange={e => setPax({ ...pax, first_name: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Last Name</label>
                                    <input value={pax.last_name} onChange={e => setPax({ ...pax, last_name: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Nickname</label>
                                    <input value={pax.nickname} onChange={e => setPax({ ...pax, nickname: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Passport Number *</label>
                                    <input required value={pax.passport_number} onChange={e => setPax({ ...pax, passport_number: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Date of Birth</label>
                                    <input type="date" value={pax.dob} onChange={e => setPax({ ...pax, dob: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100" />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Age</label>
                                        <input type="number" value={pax.age} onChange={e => setPax({ ...pax, age: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Gender</label>
                                        <select value={pax.gender} onChange={e => setPax({ ...pax, gender: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100">
                                            <option value="">Select</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Date of Issue</label>
                                    <input type="date" value={pax.issue_date} onChange={e => setPax({ ...pax, issue_date: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Date of Expiry</label>
                                    <input type="date" value={pax.expiry_date} onChange={e => setPax({ ...pax, expiry_date: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Issuing Country</label>
                                    <input value={pax.issuing_country} onChange={e => setPax({ ...pax, issuing_country: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Nationality</label>
                                    <input value={pax.nationality} onChange={e => setPax({ ...pax, nationality: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Phone</label>
                                    <input value={pax.phone} onChange={e => setPax({ ...pax, phone: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">WhatsApp</label>
                                    <input value={pax.whatsapp} onChange={e => setPax({ ...pax, whatsapp: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Email</label>
                                    <input type="email" value={pax.email} onChange={e => setPax({ ...pax, email: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Address</label>
                                    <input value={pax.address} onChange={e => setPax({ ...pax, address: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Additional Notes</label>
                                    <textarea rows="2" value={pax.notes} onChange={e => setPax({ ...pax, notes: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 resize-none" />
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 shrink-0">
                    <button type="button" onClick={onClose}
                        className="px-6 py-2.5 rounded-xl text-xs font-black uppercase text-slate-500 hover:bg-slate-200 transition-colors">
                        Cancel
                    </button>
                    <button type="submit" form="lead-form" disabled={saving}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase hover:bg-blue-700 transition-colors disabled:opacity-50">
                        {saving ? 'Saving...' : 'Add Lead'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── PASSPORT LEAD DETAIL VIEW (FULL PAGE) ──────────────────────────────────
function PassportLeadDetailView({ lead, onClose, onUpdate }) {
    if (!lead) return null;

    const pax = lead.passenger_details || {};
    const hasPax = Object.keys(pax).length > 0;

    const [status, setStatus] = useState(lead.status || 'pending');
    const [nextFollowup, setNextFollowup] = useState(lead.next_followup_date || '');
    const [remarks, setRemarks] = useState(lead.remarks || '');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        await onUpdate(lead._id || lead.id, {
            status,
            next_followup_date: nextFollowup || null,
            remarks
        });
        setSaving(false);
    };

    return (
        <div className="space-y-5 animate-in fade-in duration-300">
            {/* Header / Back */}
            <div className="flex items-center gap-4">
                <button onClick={onClose} className="p-2 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 hover:text-slate-800 transition-colors">
                    <ArrowRight size={18} className="rotate-180" />
                </button>
                <div>
                    <h2 className="text-xl font-black text-slate-900">{lead.customer_name || lead.full_name || 'Lead Details'}</h2>
                    <p className="text-xs font-bold text-slate-400 mt-0.5">Passport application and follow-up history</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Read-Only Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 overflow-hidden">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-5 bg-blue-50/50 inline-block px-3 py-1 rounded-full">Primary Information</h3>
                        <div className="grid grid-cols-2 gap-y-5 gap-x-6">
                            <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Customer Name</p><p className="text-sm font-bold text-slate-800">{lead.customer_name || lead.full_name || '—'}</p></div>
                            <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Phone</p><p className="text-sm font-bold text-slate-800">{lead.customer_phone || lead.phone || '—'}</p></div>
                            <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">CNIC</p><p className="text-sm font-bold text-slate-800">{lead.cnic || '—'}</p></div>
                            <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Passport Number</p><p className="text-sm font-bold text-slate-800 font-mono">{lead.passport_number || '—'}</p></div>
                            <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">City</p><p className="text-sm font-bold text-slate-800">{lead.city || '—'}</p></div>
                            <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Lead Source</p><p className="text-sm font-bold text-slate-800">{lead.source || '—'}</p></div>
                        </div>
                    </div>

                    {hasPax && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 overflow-hidden">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-purple-600 mb-5 bg-purple-50/50 inline-block px-3 py-1 rounded-full">Passenger Details</h3>
                            <div className="grid grid-cols-2 gap-y-5 gap-x-6 bg-slate-50/50 p-5 rounded-xl border border-slate-100/50">
                                <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">First Name</p><p className="text-sm font-bold text-slate-800">{pax.first_name || '—'}</p></div>
                                <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Last Name</p><p className="text-sm font-bold text-slate-800">{pax.last_name || '—'}</p></div>
                                <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Nickname</p><p className="text-sm font-bold text-slate-800">{pax.nickname || '—'}</p></div>
                                <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Passport Number</p><p className="text-sm font-bold text-slate-800 font-mono">{pax.passport_number || '—'}</p></div>
                                <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Date of Birth</p><p className="text-sm font-bold text-slate-800">{pax.dob || '—'}</p></div>
                                <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Age & Gender</p><p className="text-sm font-bold text-slate-800">{pax.age ? `${pax.age} yrs, ` : ''}{pax.gender || '—'}</p></div>
                                <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Date of Issue</p><p className="text-sm font-bold text-slate-800">{pax.issue_date || '—'}</p></div>
                                <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Date of Expiry</p><p className="text-sm font-bold text-slate-800">{pax.expiry_date || '—'}</p></div>
                                <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Issuing Country</p><p className="text-sm font-bold text-slate-800">{pax.issuing_country || '—'}</p></div>
                                <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Nationality</p><p className="text-sm font-bold text-slate-800">{pax.nationality || '—'}</p></div>
                                <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Phone</p><p className="text-sm font-bold text-slate-800">{pax.phone || '—'}</p></div>
                                <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">WhatsApp</p><p className="text-sm font-bold text-slate-800">{pax.whatsapp || '—'}</p></div>
                                <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Email</p><p className="text-sm font-bold text-slate-800">{pax.email || '—'}</p></div>
                                <div className="col-span-2"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Address</p><p className="text-sm font-bold text-slate-800">{pax.address || '—'}</p></div>
                                <div className="col-span-2"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Notes</p><p className="text-sm font-bold text-slate-800">{pax.notes || '—'}</p></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Update Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden sticky top-6">
                        <div className="p-5 border-b border-slate-50 bg-amber-50/30 flex items-center gap-2">
                            <MessageSquare size={16} className="text-amber-600" />
                            <h3 className="text-sm font-black text-slate-900 tracking-tight">Record Follow-up</h3>
                        </div>
                        <div className="p-5">
                            <form id="detail-followup-form" onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Status</label>
                                    <select value={status} onChange={e => setStatus(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all">
                                        <option value="pending">Pending</option>
                                        <option value="processing">Processing</option>
                                        <option value="completed">Completed</option>
                                        <option value="rejected">Rejected</option>
                                        <option value="converted">Converted</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Next Follow-up Date</label>
                                    <input type="date" value={nextFollowup} onChange={e => setNextFollowup(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Current Remarks</label>
                                    <textarea rows="4" value={remarks} onChange={e => setRemarks(e.target.value)}
                                        placeholder="Add follow-up notes..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all resize-none" />
                                </div>

                                <div className="pt-2">
                                    <button type="submit" disabled={saving}
                                        className="w-full py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50 flex justify-center items-center gap-2">
                                        {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={16} />}
                                        {saving ? 'Updating...' : 'Save Follow-up'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── PASSPORT LEADS SECTION ───────────────────────────────────────────────────
function PassportLeadsSection({ token }) {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [statusF, setStatusF] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);

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

    const handleAddLead = async (payload) => {
        try {
            const res = await fetch(`${API}/passport-leads/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setIsAddOpen(false);
                fetchPassportLeads();
            } else {
                alert("Failed to add lead.");
            }
        } catch (err) {
            alert("Error adding lead.");
        }
    };

    const handleUpdateLead = async (leadId, updates) => {
        try {
            const res = await fetch(`${API}/passport-leads/${leadId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(updates)
            });
            if (res.ok) {
                // Instantly update local state to avoid refetching whole list just for view
                const updatedLead = { ...selectedLead, ...updates };
                setSelectedLead(updatedLead);
                // Also update the main list
                setRecords(prev => prev.map(l => (l._id || l.id) === leadId ? { ...l, ...updates } : l));
            } else {
                alert("Failed to update lead.");
            }
        } catch (err) {
            alert("Error updating lead.");
        }
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

    if (selectedLead) {
        return <PassportLeadDetailView lead={selectedLead} onClose={() => setSelectedLead(null)} onUpdate={handleUpdateLead} />;
    }

    return (
        <div className="space-y-5">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-black text-slate-900">Passport Leads</h2>
                    <p className="text-xs text-slate-400 font-bold mt-0.5">Manage passport applications and follow-ups</p>
                </div>
                <button onClick={() => setIsAddOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                    <Plus size={16} /> Add New Lead
                </button>
            </div>

            <AddPassportLeadModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onSave={handleAddLead} />

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

                <Tbl cols={['#', 'Customer Name', 'Phone', 'Passport No.', 'Status', 'Next Follow-up', 'Actions']}
                    emptyMsg="No passport leads found." emptyIcon={<FileText size={40} className="text-slate-200" />}>
                    {loading
                        ? <tr><td colSpan={7} className="py-12 text-center text-xs text-slate-400 font-bold">Loading…</td></tr>
                        : filtered.map((r, i) => (
                            <tr key={r._id || r.id || i} className="hover:bg-slate-50/50 transition-colors">
                                <Td cls="text-slate-400 font-bold">#{i + 1}</Td>
                                <Td cls="font-black text-slate-800">{r.customer_name || r.full_name || 'N/A'}</Td>
                                <Td>{r.customer_phone || r.phone || '—'}</Td>
                                <Td cls="font-mono text-xs">{r.passport_number || '—'}</Td>
                                <Td>
                                    <Badge cls={PASSPORT_STATUS_COLORS[r.status] || PASSPORT_STATUS_COLORS.pending}
                                        label={r.status || 'pending'} />
                                </Td>
                                <Td cls="text-slate-500">{r.next_followup_date || '—'}</Td>
                                <Td>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setSelectedLead(r)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase hover:bg-blue-100 transition-all">
                                            Open Details <ArrowRight size={11} />
                                        </button>
                                    </div>
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

export default function EmployeeDashboard({ initialTab = 'Customers', onViewLead }) {
    const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('empDashTab') || initialTab);
    useEffect(() => { sessionStorage.setItem('empDashTab', activeTab); }, [activeTab]);
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
            {activeTab === 'Leads' && <LeadsSection token={token} onViewLead={onViewLead} />}
            {activeTab === 'Passport Leads' && <PassportLeadsSection token={token} />}
        </div>
    );
}
