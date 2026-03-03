import React, { useState } from 'react';
import { ChevronLeft, Printer, FileText, X } from 'lucide-react';

const API = 'http://localhost:8000';

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmt = (v) => (v != null && v !== '' ? v : '—');
const fmtMoney = (v) => (v != null ? `Rs. ${Number(v).toLocaleString()}/-` : 'Rs. 0/-');

const formatDate = (d) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' }); }
    catch { return d; }
};
const formatDateTime = (d) => {
    if (!d) return '—';
    try {
        const dt = new Date(d);
        return dt.toLocaleDateString('en-GB', { month: '2-digit', day: '2-digit', year: 'numeric' }) + ', ' +
            dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch { return d; }
};

// ─── Sub-components ─────────────────────────────────────────────────────────

const SectionTitle = ({ children }) => (
    <h3 className="text-sm font-black text-slate-800 mb-3">{children}</h3>
);

const TableHead = ({ cols }) => (
    <thead>
        <tr className="border-b border-slate-100">
            {cols.map((c, i) => (
                <th key={i} className="pb-3 px-3 first:pl-0 last:pr-0 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left whitespace-nowrap">
                    {c}
                </th>
            ))}
        </tr>
    </thead>
);

const Td = ({ children, className = '' }) => (
    <td className={`py-3 px-3 first:pl-0 last:pr-0 text-xs font-semibold text-slate-700 whitespace-nowrap ${className}`}>
        {children}
    </td>
);

const StatusPill = ({ value }) => {
    const v = (value || '').toLowerCase();
    const map = {
        confirmed: 'bg-emerald-100 text-emerald-700',
        approved: 'bg-emerald-100 text-emerald-700',
        paid: 'bg-emerald-100 text-emerald-700',
        pending: 'bg-amber-100 text-amber-700',
        underprocess: 'bg-amber-100 text-amber-700',
        unpaid: 'bg-rose-100 text-rose-700',
        cancelled: 'bg-rose-100 text-rose-700',
        partial: 'bg-orange-100 text-orange-700',
    };
    // Normalize display text
    let display = (value || '—').toUpperCase();
    if (v === 'confirmed' || v === 'approved') display = 'APPROVED';

    return (
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${map[v] || 'bg-slate-100 text-slate-500'}`}>
            {display}
        </span>
    );
};

const ActionBtn = ({ label, color = 'blue', onClick, small }) => {
    const colors = {
        blue: 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20',
        red: 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20',
        amber: 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20',
        green: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20',
        slate: 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200',
        indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20',
        violet: 'bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-600/20',
        orange: 'bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20',
    };
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${small ? 'px-3 py-1.5 text-[10px]' : ''} ${colors[color] || colors.blue}`}
        >
            {label}
        </button>
    );
};

// ─── Modal helpers ───────────────────────────────────────────────────────────
const Modal = ({ title, children, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h4 className="text-sm font-black text-slate-800">{title}</h4>
                <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"><X size={16} /></button>
            </div>
            <div className="px-6 py-5">{children}</div>
        </div>
    </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────
export default function OrderTicketDetailView({ onBack, order }) {
    const initialRaw = order?._raw || order || {};

    // ── Local booking state so we can update it after API calls ──
    const [bookingData, setBookingData] = useState(initialRaw);
    const raw = bookingData;

    const passengers = raw.passengers || [];
    const td = raw.ticket_details || {};
    const agency = raw.agency_details || {};
    const branch = raw.branch_details || {};

    // Financial — prefer ticket_details prices, fall back to top-level fields
    const adultPrice = td.adult_selling || raw.base_price_per_person || raw.adult_price || 0;
    const childPrice = td.child_selling || raw.child_price || 0;
    const infantPrice = td.infant_selling || raw.infant_price || 0;
    const discount = raw.discount_amount ?? raw.discount ?? 0;
    const paidAmt = raw.paid_amount || 0;
    const grandTotal = raw.grand_total || raw.total_amount || 0;
    const remaining = Math.max(0, grandTotal - paidAmt - discount);
    const receivedBy = raw.received_by || raw.booked_by_name || raw.created_by || '—';

    // Agency info
    const agencyName = agency.name || agency.agency_name || branch.name || branch.branch_name || raw.agent_name || '—';
    const agencyCode = agency.agency_code || agency.code || branch.branch_code || branch.code || '—';
    const agentName = raw.agent_name || agency.contact_person || '—';
    const contact = agency.phone || branch.phone || raw.contact || '—';
    const address = agency.address || branch.address || '—';
    const email = agency.email || branch.email || '—';
    const agreement = agency.agreement_status || branch.agreement_status || 'Active';
    const balance = agency.balance != null ? `Rs. ${Number(agency.balance).toLocaleString()}` : '—';

    // Flights — support both flat and nested trip structures
    const flights = (() => {
        if (Array.isArray(td)) return td;
        const rows = [];
        if (td.departure_trip) rows.push({ ...td.departure_trip, _leg: 'Departure' });
        else if (td.airline || td.flight_no || td.flight_number) rows.push({ ...td, _leg: 'Departure' });
        if (td.return_trip) rows.push({ ...td.return_trip, _leg: 'Return' });
        return rows;
    })();

    // Shared ticket meta (price, seats, pnr) from ticket_details or top-level raw
    const sharedMeta = {
        price: td.adult_selling || raw.base_price_per_person || td.price || 0,
        total_seats: td.total_seats || raw.total_seats || raw.total_passengers || 0,
        available_seats: td.available_seats || '—',
        weight: td.weight || raw.weight || '—',
        piece: td.piece || raw.piece || '—',
        pnr: raw.pnr || td.pnr || '—',
        meal: td.meal != null ? (td.meal ? 'Yes' : 'No') : '—',
        ticket_type: td.trip_type || td.ticket_type || td.type || '—',
    };

    // Modal states
    const [modal, setModal] = useState(null);
    const [modalNote, setModalNote] = useState('');
    const [discountAmt, setDiscountAmt] = useState('');
    const [infantFare, setInfantFare] = useState({ infant: '', child: '' });
    const [partialAmt, setPartialAmt] = useState('');
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    // ── Re-fetch booking after actions so the view visually updates ──
    const refetchBooking = async () => {
        try {
            const id = raw._id || raw.id;
            if (!id) return;
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API}/api/ticket-bookings/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const updated = await res.json();
                setBookingData(updated);
            }
        } catch (e) {
            // silently ignore refetch errors
        }
    };

    const updateBooking = async (data) => {
        const id = raw._id || raw.id;
        if (!id) throw new Error('No booking ID found');
        const token = localStorage.getItem('access_token');
        const res = await fetch(`${API}/api/ticket-bookings/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(data),
        });
        return res;
    };

    const handleAction = async (action) => {
        setSaving(true);
        try {
            let res;
            switch (action) {
                case 'approve':
                    res = await updateBooking({
                        booking_status: 'approved',
                        order_status: 'approved',
                        payment_status: 'paid',
                        voucher_status: 'Approved'
                    });
                    if (res.ok) {
                        await refetchBooking();
                        showToast('✓ Order approved successfully!');
                        setModal(null);
                    } else {
                        const err = await res.json().catch(() => ({}));
                        showToast(err.detail || `Failed (${res.status})`, 'error');
                    }
                    break;
                case 'cancel':
                    res = await updateBooking({
                        booking_status: 'cancelled',
                        order_status: 'cancelled'
                    });
                    if (res.ok) { await refetchBooking(); showToast('Order cancelled.', 'warning'); setModal(null); }
                    else { const e = await res.json().catch(() => ({})); showToast(e.detail || `Failed (${res.status})`, 'error'); }
                    break;
                case 'reject':
                    res = await updateBooking({
                        booking_status: 'rejected',
                        order_status: 'rejected',
                        notes: modalNote
                    });
                    if (res.ok) { await refetchBooking(); showToast('Order rejected.', 'warning'); setModal(null); setModalNote(''); }
                    else { const e = await res.json().catch(() => ({})); showToast(e.detail || `Failed (${res.status})`, 'error'); }
                    break;
                case 'cancel_note':
                    res = await updateBooking({
                        booking_status: 'cancelled',
                        order_status: 'cancelled',
                        notes: modalNote
                    });
                    if (res.ok) { await refetchBooking(); showToast('Order cancelled with note.', 'warning'); setModal(null); setModalNote(''); }
                    else { const e = await res.json().catch(() => ({})); showToast(e.detail || `Failed (${res.status})`, 'error'); }
                    break;
                case 'partial':
                    res = await updateBooking({ payment_status: 'partial', paid_amount: Number(partialAmt) });
                    if (res.ok) { await refetchBooking(); showToast('Partial payment recorded.'); setModal(null); setPartialAmt(''); }
                    else { const e = await res.json().catch(() => ({})); showToast(e.detail || `Failed (${res.status})`, 'error'); }
                    break;
                case 'discount':
                    res = await updateBooking({ discount: Number(discountAmt) });
                    if (res.ok) { await refetchBooking(); showToast('Discount applied.'); setModal(null); setDiscountAmt(''); }
                    else { const e = await res.json().catch(() => ({})); showToast(e.detail || `Failed (${res.status})`, 'error'); }
                    break;
                case 'infant_fare':
                    res = await updateBooking({ infant_price: Number(infantFare.infant), child_price: Number(infantFare.child) });
                    if (res.ok) { await refetchBooking(); showToast('Infant & child fare set.'); setModal(null); }
                    else { const e = await res.json().catch(() => ({})); showToast(e.detail || `Failed (${res.status})`, 'error'); }
                    break;
                case 'refund':
                    res = await updateBooking({
                        payment_status: 'refunded',
                        booking_status: 'cancelled',
                        order_status: 'cancelled'
                    });
                    if (res.ok) { await refetchBooking(); showToast('Ticket refunded.', 'warning'); setModal(null); }
                    else { const e = await res.json().catch(() => ({})); showToast(e.detail || `Failed (${res.status})`, 'error'); }
                    break;
                default: break;
            }
        } catch (e) {
            showToast(`Error: ${e.message || 'Network error'}`, 'error');
        } finally {
            setSaving(false);
        }
    };

    const inputCls = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all";

    return (
        <div className="bg-[#F8F9FD] min-h-screen relative">

            {/* Toast */}
            {toast && (
                <div className={`fixed top-5 right-5 z-[100] px-5 py-3 rounded-xl shadow-xl text-white text-xs font-bold transition-all ${toast.type === 'error' ? 'bg-rose-600' : toast.type === 'warning' ? 'bg-amber-500' : 'bg-emerald-600'
                    }`}>
                    {toast.msg}
                </div>
            )}

            {/* Modals */}
            {modal === 'discount' && (
                <Modal title="Add Discount" onClose={() => setModal(null)}>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Discount Amount (Rs.)</label>
                    <input className={inputCls} type="number" min="0" value={discountAmt} onChange={e => setDiscountAmt(e.target.value)} placeholder="0" />
                    <div className="flex gap-3 mt-4">
                        <ActionBtn label="Apply" color="green" onClick={() => handleAction('discount')} />
                        <ActionBtn label="Cancel" color="slate" onClick={() => setModal(null)} />
                    </div>
                </Modal>
            )}
            {modal === 'refund' && (
                <Modal title="Refund Payment" onClose={() => setModal(null)}>
                    <p className="text-xs text-slate-500 font-semibold mb-4">This will mark the booking as <span className="font-black text-rose-600">Refunded</span> and cancel the order. Are you sure?</p>
                    <div className="flex gap-3">
                        <ActionBtn label={saving ? 'Processing...' : 'Confirm Refund'} color="red" onClick={() => handleAction('refund')} />
                        <ActionBtn label="Cancel" color="slate" onClick={() => setModal(null)} />
                    </div>
                </Modal>
            )}
            {modal === 'reject' && (
                <Modal title="Reject With Note" onClose={() => setModal(null)}>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Rejection Note</label>
                    <textarea className={`${inputCls} resize-none`} rows={3} value={modalNote} onChange={e => setModalNote(e.target.value)} placeholder="Enter reason for rejection..." />
                    <div className="flex gap-3 mt-4">
                        <ActionBtn label={saving ? 'Saving...' : 'Reject Order'} color="red" onClick={() => handleAction('reject')} />
                        <ActionBtn label="Cancel" color="slate" onClick={() => setModal(null)} />
                    </div>
                </Modal>
            )}
            {modal === 'cancel_note' && (
                <Modal title="Cancel With Note" onClose={() => setModal(null)}>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Cancellation Note</label>
                    <textarea className={`${inputCls} resize-none`} rows={3} value={modalNote} onChange={e => setModalNote(e.target.value)} placeholder="Enter cancellation reason..." />
                    <div className="flex gap-3 mt-4">
                        <ActionBtn label={saving ? 'Saving...' : 'Cancel Order'} color="red" onClick={() => handleAction('cancel_note')} />
                        <ActionBtn label="Close" color="slate" onClick={() => setModal(null)} />
                    </div>
                </Modal>
            )}
            {modal === 'partial' && (
                <Modal title="Partial Payment" onClose={() => setModal(null)}>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Amount Received (Rs.)</label>
                    <input className={inputCls} type="number" min="0" value={partialAmt} onChange={e => setPartialAmt(e.target.value)} placeholder="0" />
                    <div className="flex gap-3 mt-4">
                        <ActionBtn label={saving ? 'Saving...' : 'Save Payment'} color="green" onClick={() => handleAction('partial')} />
                        <ActionBtn label="Cancel" color="slate" onClick={() => setModal(null)} />
                    </div>
                </Modal>
            )}
            {modal === 'infant_fare' && (
                <Modal title="Set Infant & Child Fare" onClose={() => setModal(null)}>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Child Price (Rs.)</label>
                            <input className={inputCls} type="number" min="0" value={infantFare.child} onChange={e => setInfantFare(p => ({ ...p, child: e.target.value }))} placeholder="0" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Infant Price (Rs.)</label>
                            <input className={inputCls} type="number" min="0" value={infantFare.infant} onChange={e => setInfantFare(p => ({ ...p, infant: e.target.value }))} placeholder="0" />
                        </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                        <ActionBtn label={saving ? 'Saving...' : 'Set Fares'} color="green" onClick={() => handleAction('infant_fare')} />
                        <ActionBtn label="Cancel" color="slate" onClick={() => setModal(null)} />
                    </div>
                </Modal>
            )}

            {modal === 'refund_ticket' && (
                <Modal title="Refund Ticket" onClose={() => setModal(null)}>
                    <p className="text-xs text-slate-500 font-semibold mb-4">Are you sure you want to refund this ticket? The booking will be marked as <span className="font-black text-rose-600">Refunded</span>.</p>
                    <div className="flex gap-3">
                        <ActionBtn label={saving ? 'Processing...' : 'Confirm Refund'} color="red" onClick={() => handleAction('refund')} />
                        <ActionBtn label="Cancel" color="slate" onClick={() => setModal(null)} />
                    </div>
                </Modal>
            )}

            <div className="p-4 md:px-8 md:pb-8">
                <div className="bg-white rounded-[28px] shadow-sm border border-slate-100/50 p-6 md:p-8">

                    {/* ── Header ── */}
                    <div className="flex items-center justify-between mb-6 pb-5 border-b border-slate-100">
                        <div
                            className="flex items-center gap-2 cursor-pointer group"
                            onClick={onBack}
                        >
                            <ChevronLeft size={20} strokeWidth={3} className="text-blue-500 group-hover:text-blue-700 transition-colors" />
                            <span className="text-sm font-black text-slate-700 group-hover:text-blue-700 transition-colors">
                                Order Delivery system / Tickets / Detail
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <button className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all">
                                <Printer size={14} /> Print
                            </button>
                        </div>
                    </div>

                    {/* ── 1. Order Summary Table ── */}
                    <div className="overflow-x-auto mb-8">
                        <table className="w-full text-left">
                            <TableHead cols={['Order No', 'Status', 'Agency Code', 'Agency Name', 'Agent Name', 'Contact', 'Address', 'Email', 'Agreement Status', 'Balance', 'Creation Timestamp']} />
                            <tbody>
                                <tr>
                                    <Td>
                                        <span className="text-blue-600 font-black underline underline-offset-2 decoration-slate-300">
                                            {raw.booking_reference || raw._id?.slice(-8) || '—'}
                                        </span>
                                    </Td>
                                    <Td><StatusPill value={raw.booking_status || raw.payment_status} /></Td>
                                    <Td className="font-black text-slate-800">{agencyCode}</Td>
                                    <Td className="font-black text-slate-800">{agencyName}</Td>
                                    <Td>{agentName}</Td>
                                    <Td>{contact}</Td>
                                    <Td className="max-w-[160px] truncate">{address}</Td>
                                    <Td className="text-blue-600">{email}</Td>
                                    <Td>{agreement}</Td>
                                    <Td className="font-black text-slate-800">{balance}</Td>
                                    <Td>{formatDateTime(raw.created_at)}</Td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* ── 2. Pax Detail ── */}
                    <div className="mb-8">
                        <SectionTitle>Pax Detail</SectionTitle>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <TableHead cols={['SND', 'Type', 'Title', 'First Name', 'Last Name', 'Passport No', 'DOB', 'Passport Issue', 'Passport Expiry', 'Country', 'Actions']} />
                                <tbody>
                                    {passengers.length === 0 ? (
                                        <tr><td colSpan={11} className="py-8 text-center text-xs text-slate-400 italic">No passengers found</td></tr>
                                    ) : passengers.map((p, idx) => (
                                        <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                            <Td className="font-black text-slate-800">{idx + 1}</Td>
                                            <Td className="capitalize">{p.type || 'Adult'}</Td>
                                            <Td>{p.title || '—'}</Td>
                                            <Td className="font-black text-slate-900">{p.first_name || '—'}</Td>
                                            <Td className="font-black text-slate-900">{p.last_name || '—'}</Td>
                                            <Td className="text-slate-800 font-black">{p.passport_no || p.passport || p.passport_number || '—'}</Td>
                                            <Td>{formatDate(p.dob || p.date_of_birth)}</Td>
                                            <Td className={!p.passport_issue && !p.passportIssue && !p.passport_issue_date ? 'text-slate-400' : 'text-amber-600 font-black'}>
                                                {formatDate(p.passport_issue || p.passportIssue || p.passport_issue_date)}
                                            </Td>
                                            <Td className={!p.passport_expiry && !p.passportExpiry && !p.passport_expiry_date ? 'text-slate-400' : ''}>
                                                {formatDate(p.passport_expiry || p.passportExpiry || p.passport_expiry_date)}
                                            </Td>
                                            <Td>{p.country || '—'}</Td>
                                            <Td>
                                                <button className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-[10px] font-black transition-colors">
                                                    ✎ Edit
                                                </button>
                                            </Td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ── 3. Flight Details ── */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-3">
                            <SectionTitle>Flight Details</SectionTitle>
                            <ActionBtn label="Send Ticket" color="blue" small />
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <TableHead cols={['Airline', 'Flight No', 'Meal', 'Trip Type', 'PNR', 'Adult Price', 'Total Seats', 'Avail. Seats', 'Route', 'Dep Date & Time', 'Arv Date & Time', 'Rtn Dep Date', 'Rtn Arv Date']} />
                                <tbody>
                                    {flights.length === 0 ? (
                                        <tr><td colSpan={13} className="py-8 text-center text-xs text-slate-400 italic">No flight data available</td></tr>
                                    ) : flights.map((f, idx) => {
                                        const leg = f._leg || (idx === 0 ? 'Departure' : 'Return');
                                        const route = [f.departure_city, f.arrival_city].filter(Boolean).join(' - ') || fmt(f.route);
                                        const depDT = f.departure_time || f.departure_datetime;
                                        const arvDT = f.arrival_time || f.arrival_datetime;
                                        // For 2nd entry show return times differently
                                        return (
                                            <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                <Td className="font-black text-slate-800">{fmt(f.airline || f.airline_name)}</Td>
                                                <Td>{fmt(f.flight_no || f.flight_number)}</Td>
                                                <Td>{sharedMeta.meal}</Td>
                                                <Td>
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${(sharedMeta.ticket_type || '').toLowerCase().includes('refund') ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                                                        }`}>
                                                        {sharedMeta.ticket_type || leg}
                                                    </span>
                                                </Td>
                                                <Td className="font-black text-blue-600 uppercase">{fmt(f.pnr || sharedMeta.pnr)}</Td>
                                                <Td className="font-black">{fmtMoney(sharedMeta.price)}</Td>
                                                <Td>{sharedMeta.total_seats}</Td>
                                                <Td>{sharedMeta.available_seats}</Td>
                                                <Td className="uppercase font-black text-slate-800">{route}</Td>
                                                <Td className="text-slate-600">{formatDateTime(depDT)}</Td>
                                                <Td className="text-slate-600">{formatDateTime(arvDT)}</Td>
                                                {/* Return columns (if applicable, show for dep row as return data) */}
                                                <Td className="text-slate-400">{idx === 0 && flights[1] ? formatDateTime(flights[1].departure_time || flights[1].departure_datetime) : '—'}</Td>
                                                <Td className="text-slate-400">{idx === 0 && flights[1] ? formatDateTime(flights[1].arrival_time || flights[1].arrival_datetime) : '—'}</Td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ── 4. Order Detail ── */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-3">
                            <SectionTitle>Order Detail</SectionTitle>
                            <ActionBtn label="Add Discount" color="blue" small onClick={() => setModal('discount')} />
                            <ActionBtn label="Refund Payment" color="red" small onClick={() => setModal('refund')} />
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <TableHead cols={['Order No', 'Date', 'No. of Pax', 'Adult Price', 'Child Price', 'Infant Price', 'Discount', 'Received By', 'Paid Amount', 'Remaining Amount', 'Total Amount', 'Action']} />
                                <tbody>
                                    <tr className="border-b border-slate-50">
                                        <Td className="font-black text-blue-600 underline underline-offset-2 decoration-slate-300">
                                            {raw.booking_reference || raw._id?.slice(-8) || '—'}
                                        </Td>
                                        <Td>{formatDate(raw.created_at)}</Td>
                                        <Td className="font-black text-slate-800">{raw.total_passengers || passengers.length || 1}</Td>
                                        <Td>{fmtMoney(adultPrice)}</Td>
                                        <Td>{fmtMoney(childPrice)}</Td>
                                        <Td>{fmtMoney(infantPrice)}</Td>
                                        <Td className="text-rose-600 font-black">Rs. {Number(discount).toLocaleString()}/-</Td>
                                        <Td>{receivedBy}</Td>
                                        <Td className="text-blue-600 font-black">{fmtMoney(paidAmt)}</Td>
                                        <Td>{fmtMoney(remaining)}</Td>
                                        <Td className="font-black text-slate-900">{fmtMoney(grandTotal)}</Td>
                                        <Td>
                                            <button className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black transition-colors shadow-md shadow-blue-600/20">
                                                <FileText size={11} /> INVOICE
                                            </button>
                                        </Td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ── 5. Payment Details Section ── */}
                    {raw.payment_details && (
                        <div className="mb-8 p-5 bg-blue-50/30 rounded-2xl border border-blue-100">
                            <SectionTitle>Payment Details (Sender Information)</SectionTitle>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Method</p>
                                    <p className="text-sm font-black text-slate-700 uppercase">{raw.payment_details.payment_method || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                    <StatusPill value={raw.payment_details.payment_status} />
                                </div>
                                {raw.payment_details.payment_method === 'transfer' && (
                                    <>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sender CNIC</p>
                                            <p className="text-sm font-bold text-slate-700">{raw.payment_details.transfer_cnic || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sender Phone</p>
                                            <p className="text-sm font-bold text-slate-700">{raw.payment_details.transfer_phone || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Account Name</p>
                                            <p className="text-sm font-bold text-slate-700">{raw.payment_details.transfer_account_name || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Account Number</p>
                                            <p className="text-sm font-bold text-slate-700">{raw.payment_details.transfer_account_number || '—'}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── 5. Set Infant & Child Fare + PNR display ── */}
                    <div className="mb-8 flex flex-wrap items-center gap-2">
                        <ActionBtn label="Set Infant And Child Fare" color="blue" onClick={() => setModal('infant_fare')} />
                        <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-200">
                            PNR: {sharedMeta.pnr}
                        </span>
                    </div>

                    {/* ── 6. Bottom Action Buttons ── */}
                    <div className="pt-5 border-t border-slate-100 flex flex-wrap items-center gap-3">
                        <ActionBtn label="Reject With Note" color="blue" onClick={() => { setModalNote(''); setModal('reject'); }} />
                        <ActionBtn label="Partial Paid" color="blue" onClick={() => { setPartialAmt(''); setModal('partial'); }} />
                        <ActionBtn label="Refund Ticket" color="blue" onClick={() => setModal('refund_ticket')} />
                        <ActionBtn label={saving ? 'Approving...' : 'Approve Order'} color="green" onClick={() => handleAction('approve')} />
                        <ActionBtn label="Cancel Order" color="red" onClick={() => handleAction('cancel')} />
                        <ActionBtn label="Cancel with note" color="blue" onClick={() => { setModalNote(''); setModal('cancel_note'); }} />
                        <ActionBtn label="Close" color="slate" onClick={onBack} />
                    </div>

                </div>
            </div>
        </div>
    );
}
