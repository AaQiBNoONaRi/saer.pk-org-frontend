import React, { useState, useEffect } from 'react';
import {
    Calendar, Search, Filter, Download, Eye, CreditCard,
    CheckCircle, XCircle, Clock, AlertCircle, MoreHorizontal, FileText, Loader2
} from 'lucide-react';
import BookingVoucher from './BookingVoucher';
import BookingInvoice from './BookingInvoice';
import GroupTicketInvoice from './GroupTicketInvoice';

const API = 'http://localhost:8000';

// --- Countdown Timer Component ---
const CountdownTimer = ({ deadline, paymentStatus }) => {
    const [timeLeft, setTimeLeft] = useState('');

    const paymentSubmitted = paymentStatus === 'pending' || paymentStatus === 'paid';

    useEffect(() => {
        if (paymentSubmitted) return;
        if (!deadline || deadline === '-') {
            setTimeLeft('-');
            return;
        }

        const target = new Date(deadline).getTime();

        const updateTimer = () => {
            const now = new Date().getTime();
            const diff = target - now;
            if (diff <= 0) { setTimeLeft('EXPIRED'); return; }
            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeLeft(`${h}h ${m}m ${s}s`);
        };

        const timer = setInterval(updateTimer, 1000);
        updateTimer();
        return () => clearInterval(timer);
    }, [deadline, paymentStatus]);

    if (paymentSubmitted) {
        return (
            <span className="inline-flex items-center gap-1.5 text-emerald-600 font-black text-[11px]">
                <CheckCircle size={12} />
                Payment Submitted
            </span>
        );
    }

    if (timeLeft === 'EXPIRED') return <span className="text-rose-500 font-black">EXPIRED</span>;
    if (timeLeft === '-') return <span className="text-slate-300">-</span>;

    return (
        <span className="text-blue-600 font-black tabular-nums flex items-center gap-1.5">
            <Clock size={12} className="animate-pulse" />
            {timeLeft}
        </span>
    );
};

// --- Status Badge ---
const StatusBadge = ({ status }) => {
    const s = String(status || 'Pending').toLowerCase();

    let displayStatus = 'Pending';
    let styleClass = 'bg-amber-50 text-amber-600 border-amber-100';
    let Icon = Clock;

    if (s === 'confirmed' || s === 'paid') {
        displayStatus = 'Confirmed';
        styleClass = 'bg-emerald-50 text-emerald-600 border-emerald-100';
        Icon = CheckCircle;
    } else if (s === 'approved') {
        displayStatus = 'Approved';
        styleClass = 'bg-blue-50 text-blue-600 border-blue-100';
        Icon = CheckCircle;
    } else if (s.includes('cancel') || s.includes('reject')) {
        displayStatus = 'Cancelled';
        styleClass = 'bg-rose-50 text-rose-600 border-rose-100';
        Icon = XCircle;
    } else if (s.includes('expire')) {
        displayStatus = 'Expired';
        styleClass = 'bg-slate-50 text-slate-500 border-slate-100';
        Icon = AlertCircle;
    }

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${styleClass}`}>
            <Icon size={12} strokeWidth={2.5} />
            {displayStatus}
        </span>
    );
};

// --- Payment Status Badge ---
const PaymentStatusBadge = ({ status }) => {
    const s = String(status || 'Unpaid').toLowerCase();
    const isPaid = s === 'paid' || s === 'completed';
    const isPending = s === 'pending';

    return (
        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${isPaid ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : isPending ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-400 border-slate-100'
            }`}>
            {isPaid ? 'Paid' : isPending ? 'Pending' : 'Unpaid'}
        </span>
    );
};

// --- Tab Button ---
const TabButton = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`
            px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 border
            ${active
                ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20'
                : 'bg-slate-50 text-slate-500 border-transparent hover:bg-white hover:border-slate-200 hover:text-slate-700'}
        `}
    >
        {label}
    </button>
);

const TABLE_HEADERS = ['Date', 'Order #', 'Pax Name', 'Booked By', 'Payment', 'Status', 'Amount', 'Action'];

export default function BookingHistoryView() {
    const [activeTab, setActiveTab] = useState('Groups Tickets');
    const [orderNo, setOrderNo] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    // Data State
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);

    // Action State
    const [openActionId, setOpenActionId] = useState(null);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [selectedGroupTicket, setSelectedGroupTicket] = useState(null);

    /* —— URL Synchronization —— */
    useEffect(() => {
        const handlePopState = () => {
            const path = window.location.pathname;
            if (path === '/booking-history') {
                setSelectedBooking(null);
                setSelectedInvoice(null);
                setSelectedGroupTicket(null);
            } else {
                const parts = path.split('/');
                const id = parts[parts.length - 1];
                const type = parts[parts.length - 2];

                if (type === 'voucher') {
                    const b = bookings.find(x => x._id === id);
                    if (b) setSelectedBooking(b);
                } else if (type === 'invoice') {
                    const b = bookings.find(x => x._id === id);
                    if (b) setSelectedInvoice(b);
                } else if (type === 'group-invoice') {
                    const b = bookings.find(x => (x._id || x.id) === id);
                    if (b) setSelectedGroupTicket(b);
                }
            }
        };
        window.addEventListener('popstate', handlePopState);
        handlePopState(); // Run on mount
        return () => window.removeEventListener('popstate', handlePopState);
    }, [bookings]);

    const updateView = (type, data) => {
        if (!data) {
            window.history.pushState(null, '', '/booking-history');
            setSelectedBooking(null);
            setSelectedInvoice(null);
            setSelectedGroupTicket(null);
            return;
        }

        const id = data._id || data.id;
        window.history.pushState(null, '', `/booking-history/${type}/${id}`);
        if (type === 'voucher') setSelectedBooking(data);
        else if (type === 'invoice') setSelectedInvoice(data);
        else if (type === 'group-invoice') setSelectedGroupTicket(data);
    };

    const tabs = ['Groups Tickets', 'UMRAH BOOKINGS', 'Custom Umrah Bookings'];
    const isGroupTab = activeTab === 'Groups Tickets';

    const token = () => localStorage.getItem('access_token');

    // Fetch Bookings Based on Active Tab
    useEffect(() => {
        const fetchBookings = async () => {
            setLoading(true);
            setBookings([]);

            let endpoint = '';
            if (activeTab === 'Groups Tickets') endpoint = '/api/ticket-bookings/';
            if (activeTab === 'UMRAH BOOKINGS') endpoint = '/api/umrah-bookings/';
            if (activeTab === 'Custom Umrah Bookings') endpoint = '/api/custom-bookings/';

            try {
                const res = await fetch(`${API}${endpoint}`, {
                    headers: { 'Authorization': `Bearer ${token()}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setBookings(Array.isArray(data) ? data : []);
                } else {
                    console.error('Failed to fetch bookings:', await res.text());
                }
            } catch (err) {
                console.error('Network Error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, [activeTab]);

    const handleMakePayment = (booking) => {
        const id = booking._id || booking.id;
        let type = '';
        if (activeTab === 'Groups Tickets') type = 'Ticket';
        if (activeTab === 'UMRAH BOOKINGS') type = 'Umrah Package';
        if (activeTab === 'Custom Umrah Bookings') type = 'Custom Umrah';

        // This will be picked up by App.jsx to set the correct tab and pass resume ID
        window.location.href = `/?tab=${type}&resume=${id}`;
    };

    // Data Mapping Helper
    const mapBookingData = (b) => {
        let date = 'Unknown';
        let pax = 'Unknown Passenger';
        let amount = b.grand_total || b.total_amount || 0;
        let expiry = b.payment_deadline || '-';
        let status = b.booking_status || b.status || 'Pending';

        if (b.created_at) {
            date = new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }

        if (b.passengers && b.passengers.length > 0) {
            const firstPax = b.passengers[0];
            pax = `${firstPax.first_name || firstPax.given_name || ''} ${firstPax.last_name || firstPax.surname || ''}`.trim() || 'Unknown Passenger';
        } else if (b.contact_details) {
            pax = b.contact_details.name || b.contact_details.email || pax;
        }

        return {
            id: b._id || b.id,
            booking_reference: b.booking_reference || (b._id ? b._id.substring(0, 8).toUpperCase() : 'N/A'),
            date,
            pax,
            booked_by: b.booked_by_name || 'Agency',
            expiry,
            status,
            payment_status: b.payment_status || 'unpaid',
            amount,
            raw: b
        };
    };

    // Filter Logic
    const filteredBookings = bookings.map(mapBookingData).filter(b => {
        const matchSearch = orderNo === '' || b.booking_reference.toLowerCase().includes(orderNo.toLowerCase()) || b.id.toLowerCase().includes(orderNo.toLowerCase());

        let matchFrom = true;
        let matchTo = true;
        if (fromDate && b.raw.created_at) matchFrom = new Date(b.raw.created_at) >= new Date(fromDate);
        if (toDate && b.raw.created_at) matchTo = new Date(b.raw.created_at) <= new Date(toDate);

        return matchSearch && matchFrom && matchTo;
    });

    if (selectedGroupTicket) {
        return <GroupTicketInvoice booking={selectedGroupTicket} onBack={() => updateView(null, null)} />;
    }

    if (selectedBooking) {
        return <BookingVoucher booking={selectedBooking} onBack={() => updateView(null, null)} />;
    }

    if (selectedInvoice) {
        return <BookingInvoice booking={selectedInvoice} onBack={() => updateView(null, null)} />;
    }

    return (
        <div
            className="p-4 md:p-8 space-y-6 min-h-full"
            onClick={() => setOpenActionId(null)}
        >
            {/* Search Filters Card */}
            <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100/50">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                    <div className="md:col-span-3 space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide ml-1">Order No.</label>
                        <input
                            type="text"
                            placeholder="Type Order No."
                            value={orderNo}
                            onChange={(e) => setOrderNo(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50/50 transition-all placeholder:text-slate-400 outline-none"
                        />
                    </div>

                    <div className="md:col-span-3 space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide ml-1">From</label>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50/50 transition-all outline-none"
                        />
                    </div>

                    <div className="md:col-span-3 space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide ml-1">To</label>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50/50 transition-all outline-none"
                        />
                    </div>

                    <div className="md:col-span-3 flex gap-2">
                        <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0">
                            <Search size={18} strokeWidth={2.5} /> Search
                        </button>
                        {(orderNo || fromDate || toDate) && (
                            <button onClick={() => { setOrderNo(''); setFromDate(''); setToDate(''); }} className="px-5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-sm transition-all">
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Data Section */}
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100/50">
                {/* Tabs Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex flex-wrap items-center gap-3">
                        {tabs.map(tab => (
                            <TabButton
                                key={tab}
                                label={tab}
                                active={activeTab === tab}
                                onClick={() => setActiveTab(tab)}
                            />
                        ))}
                    </div>
                </div>

                {/* Table Action Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-extrabold text-slate-800">Booking</h3>
                        <p className="text-xs font-semibold text-slate-400">{filteredBookings.length} bookings found</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all">
                            <Filter size={14} /> Filters
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all">
                            <Download size={14} /> Export
                        </button>
                    </div>
                </div>

                {/* Table Header Row */}
                <div className="grid grid-cols-8 gap-4 px-6 py-4 bg-slate-50 rounded-2xl mb-2 border border-slate-100 text-center">
                    {TABLE_HEADERS.map((header, idx) => (
                        <div key={idx} className={`text-xs font-black text-slate-500 uppercase tracking-widest ${idx === 7 ? 'text-right pr-4' : idx === 0 ? 'text-left pl-4' : ''}`}>
                            {header}
                        </div>
                    ))}
                </div>

                {/* Data Rows */}
                <div className="space-y-2 min-h-[200px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 text-blue-600">
                            <Loader2 size={32} className="animate-spin" />
                            <p className="text-sm font-bold text-slate-500">Fetching {activeTab}...</p>
                        </div>
                    ) : filteredBookings.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-2">
                                <Search size={24} className="text-slate-300" />
                            </div>
                            <p className="text-sm font-bold text-slate-500">No bookings found</p>
                            <p className="text-xs font-medium">Try adjusting your search criteria</p>
                        </div>
                    ) : (
                        filteredBookings.map((b) => (
                            <div key={b.id} className="relative">
                                <div className="grid grid-cols-8 gap-4 px-6 py-5 bg-white border border-slate-100 rounded-2xl items-center hover:shadow-md hover:border-blue-100 transition-all group text-center">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 whitespace-nowrap pl-4 text-left">
                                        <Calendar size={13} className="text-slate-400" />
                                        {b.date}
                                    </div>
                                    <div className="text-xs font-black text-blue-600 font-mono tracking-tighter" title={`ID: ${b.id}`}>
                                        {b.booking_reference}
                                    </div>
                                    <div className="text-xs font-bold text-slate-700 truncate pr-2 text-left" title={b.pax}>{b.pax}</div>
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-tight truncate px-1" title={b.booked_by}>
                                        {b.booked_by}
                                    </div>
                                    <div className="flex justify-center">
                                        <PaymentStatusBadge status={b.payment_status} />
                                    </div>
                                    <div className="flex justify-center"><StatusBadge status={b.status} /></div>
                                    <div className="text-xs font-black text-slate-900 whitespace-nowrap">PKR {Number(b.amount || 0).toLocaleString()}</div>
                                    <div className="flex justify-end relative pr-4">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenActionId(openActionId === b.id ? null : b.id);
                                            }}
                                            className={`p-2 rounded-lg transition-colors ${openActionId === b.id ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            <MoreHorizontal size={20} />
                                        </button>

                                        {openActionId === b.id && (
                                            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                {(() => {
                                                    const raw = b.raw || {};
                                                    const st = String(b.status || '').toLowerCase();
                                                    const pSt = String(raw.payment_status || '').toLowerCase();
                                                    const isUnderProcess = ['underprocess', 'pending', 'under_process'].includes(st);
                                                    const isPaid = ['paid', 'completed'].includes(pSt);
                                                    return isUnderProcess && !isPaid;
                                                })() && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleMakePayment(b.raw); setOpenActionId(null); }}
                                                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-black text-white bg-slate-900 hover:bg-blue-600 transition-colors"
                                                        >
                                                            <CreditCard size={16} />
                                                            Make Payment
                                                        </button>
                                                    )}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); isGroupTab ? updateView('group-invoice', b.raw) : updateView('voucher', b.raw); setOpenActionId(null); }}
                                                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors"
                                                >
                                                    <Eye size={16} />
                                                    See Booking
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); isGroupTab ? updateView('group-invoice', b.raw) : updateView('invoice', b.raw); setOpenActionId(null); }}
                                                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors border-t border-slate-50"
                                                >
                                                    <FileText size={16} />
                                                    Invoice
                                                </button>
                                                <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors border-t border-slate-50">
                                                    <Download size={16} />
                                                    Download Voucher
                                                </button>
                                                <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-bold text-rose-500 hover:bg-rose-50 transition-colors border-t border-slate-100">
                                                    <XCircle size={16} />
                                                    Cancel Booking
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
