import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronLeft as BackIcon, Settings, X, Loader2, CheckCircle2, XCircle, Save, Printer, Download } from 'lucide-react';

const API = 'http://localhost:8000';
const PKR = (n) => `PKR ${(Number(n) || 0).toLocaleString()}`;
const SAR = (n) => `SAR ${(Number(n) || 0).toLocaleString()}`;

const InclusionPill = ({ label, included }) => (
    <div className="flex items-center justify-between gap-4 mb-2 min-w-[180px]">
        <span className="text-xs font-bold text-slate-700">{label}:</span>
        <span className={`text-[10px] font-black px-3 py-0.5 rounded-md min-w-[70px] text-center uppercase tracking-wider ${included ? 'bg-cyan-400 text-white' : 'bg-slate-300 text-white'}`}>
            {included ? 'INCLUDED' : 'N/A'}
        </span>
    </div>
);

const SectionHeader = ({ title }) => (
    <h3 className="text-sm font-extrabold text-slate-800 mb-4 uppercase tracking-wide">{title}</h3>
);

const AddNotesModal = ({ isOpen, onClose, onReject }) => {
    const [note, setNote] = useState('');
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                <div className="p-6 pb-4 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-xl font-extrabold text-slate-800">Reject With Note</h2>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-700 mb-2 block">Rejection Note</label>
                        <textarea
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            className="w-full h-32 p-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/10 transition-all resize-none"
                            placeholder="Enter reason for rejection..."
                        />
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => onReject(note)} className="flex-1 bg-rose-600 text-white text-sm font-bold py-3 rounded-lg shadow-lg shadow-rose-600/20 hover:bg-rose-700 transition-all">
                            Confirm Rejection
                        </button>
                        <button onClick={onClose} className="flex-1 bg-slate-100 text-slate-500 text-sm font-bold py-3 rounded-lg border border-slate-200 hover:bg-slate-200 transition-all">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Build route string from transport data
function buildRoute(transport) {
    if (!transport) return '—';
    if (transport.sector && transport.sector.trim()) return transport.sector;

    const smallSectors = transport.small_sectors || transport.small_sectors_details || [];
    if (smallSectors.length === 0) return 'Route Information';

    const abbr = (city = '', type = '') => {
        const c = city.trim().toUpperCase().slice(0, 3);
        const suffix = type.toLowerCase().includes('airport') ? '(A)' : '(H)';
        return `${c}${suffix}`;
    };
    const stops = smallSectors.flatMap(s => [
        abbr(s.from_city, s.from_type || ''),
        abbr(s.to_city, s.to_type || ''),
    ]);
    const deduped = stops.filter((v, i) => i === 0 || v !== stops[i - 1]);
    return `R/T - ${deduped.join('-')}`;
}

export default function OrderDeliveryDetailView({ onBack, booking: initialBooking, onConfirm }) {
    const [booking, setBooking] = useState(initialBooking || null);
    const [loading, setLoading] = useState(!initialBooking);
    const [saving, setSaving] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    // Voucher inputs (editable)
    const [hotelVoucher, setHotelVoucher] = useState('');
    const [hotelBrn, setHotelBrn] = useState('');
    const [transportVoucher, setTransportVoucher] = useState('');
    const [transportBrn, setTransportBrn] = useState('');

    useEffect(() => {
        if (initialBooking) {
            setBooking(initialBooking);
            const rooms = initialBooking.rooms_selected || [];
            setHotelVoucher(rooms[0]?.hotel_voucher_number || '');
            setHotelBrn(rooms[0]?.hotel_brn || '');
            setTransportVoucher(initialBooking.transport_voucher_number || '');
            setTransportBrn(initialBooking.transport_brn || '');
        }
    }, [initialBooking]);

    if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="animate-spin text-blue-400" size={36} /></div>;
    if (!booking) return <div className="text-center py-24 text-slate-400 font-bold">Booking not found.</div>;

    const isUmrah = booking.booking_type === 'umrah_package';
    const agencyDetails = booking.agency_details || {};
    const branchDetails = booking.branch_details || {};
    const agentName = agencyDetails.name || agencyDetails.agency_name || branchDetails.name || booking.agent_name || '—';
    const agentContact = agencyDetails.phone_number || agencyDetails.contact || branchDetails.phone_number || '—';

    const pkg = booking.package_details || {};
    const passengers = booking.passengers || [];
    const rooms = booking.rooms_selected || [];
    const hotels = pkg.hotels || [];
    const transport = pkg.transport || null;
    const food = pkg.food || null;
    const ziyarat = pkg.ziyarat || null;
    const visaPricing = pkg.visa_pricing || {};
    const flight = Array.isArray(pkg.flight) ? pkg.flight[0] : (pkg.flight || null);

    const adults = passengers.filter(p => (p.type || '').toLowerCase() === 'adult').length;
    const children = passengers.filter(p => (p.type || '').toLowerCase() === 'child').length;
    const infants = passengers.filter(p => (p.type || '').toLowerCase() === 'infant').length;
    const totalPax = passengers.length || booking.total_passengers || 0;

    const getFoodTotal = () => {
        if (!food) return 0;
        return (food.adult_selling || food.selling || 0) * adults +
            (food.child_selling || food.selling || 0) * children +
            (food.infant_selling || food.selling || 0) * infants;
    };

    const getFlightTotal = () => {
        if (!flight) return 0;
        const adultRate = flight.adult_pkr || flight.adult_selling || flight.departure_trip?.adult_selling || 0;
        const childRate = flight.child_pkr || flight.child_selling || flight.departure_trip?.child_selling || 0;
        const infantRate = flight.infant_pkr || flight.infant_selling || flight.departure_trip?.infant_selling || 0;
        return adultRate * adults + childRate * children + infantRate * infants;
    };

    const getVisaTotal = () => {
        return (visaPricing.adult_selling || 0) * adults +
            (visaPricing.child_selling || 0) * children +
            (visaPricing.infant_selling || 0) * infants;
    };

    const visaTotal = getVisaTotal();
    const flightTotal = getFlightTotal();
    const foodTotal = getFoodTotal();
    const ziyaratTotal = (ziyarat?.purchasing || 0);

    const hotelTotal = rooms.reduce((acc, r) => {
        const hMeta = hotels.find(h => String(h.id || h._id || '') === String(r.hotel_id || ''))
            || (isUmrah ? hotels[0] : null) || {};
        const nights = Number(hMeta.nights || hMeta.total_nights || r.nights || 0);
        return acc + (r.rate_pkr || r.price_per_person || 0) * (r.quantity || 1) * (nights || 1);
    }, 0);

    const isApproved = booking.booking_status?.toLowerCase() === 'approved';
    const isConfirmed = ['confirmed', 'approved'].includes(booking.booking_status?.toLowerCase());
    const isUnderprocess = ['underprocess', 'pending', 'processing'].includes(booking.booking_status?.toLowerCase());

    const getEndpoint = () => {
        if (booking.source === 'customer') return 'customer-bookings';
        return booking.booking_type === 'umrah_package' ? 'umrah-bookings' : 'custom-bookings';
    };
    const getToken = () => localStorage.getItem('access_token');

    const updateBooking = async (payload) => {
        setSaving(true);
        try {
            const res = await fetch(`${API}/api/${getEndpoint()}/${booking.id || booking._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error('Update failed');
            const updated = await res.json();
            setBooking(updated);
            return updated;
        } finally {
            setSaving(false);
        }
    };

    const handleMarkConfirmed = async () => {
        await updateBooking({ booking_status: 'confirmed', order_status: 'confirmed' });
        setSuccessMsg('Order confirmed!');
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    const handleConfirm = async () => {
        const updated = await updateBooking({ booking_status: 'approved', order_status: 'approved', voucher_status: 'Approved' });
        setSuccessMsg('Order approved successfully!');
        if (onConfirm) onConfirm(updated);
    };

    const handleReject = async (note) => {
        await updateBooking({ booking_status: 'rejected', notes: note });
        setIsRejectModalOpen(false);
        setSuccessMsg('Order rejected.');
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    return (
        <div className="bg-white min-h-screen text-slate-800 font-sans">
            <AddNotesModal isOpen={isRejectModalOpen} onClose={() => setIsRejectModalOpen(false)} onReject={handleReject} />

            {/* Notification Banner */}
            {successMsg && (
                <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl text-sm font-bold animate-in slide-in-from-top-2 duration-300">
                    <CheckCircle2 size={16} /> {successMsg}
                </div>
            )}

            <div className="max-w-7xl mx-auto p-8 space-y-12">

                {/* --- HEADER SECTION --- */}
                <div className="flex justify-between items-start">
                    <div className="space-y-4">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Order Number (VOUCHER NO)</div>
                        <h1 className="text-4xl font-black text-blue-600 tracking-tight">{booking.booking_reference || booking.id || '—'}</h1>
                        <div className="flex gap-12 pt-2">
                            <div><span className="text-xs font-black text-slate-800 uppercase mr-2">Agent Name:</span> <span className="text-sm font-medium text-slate-500">{agentName}</span></div>
                            <div><span className="text-xs font-black text-slate-800 uppercase mr-2">Agency Name:</span> <span className="text-sm font-medium text-slate-500">{agencyDetails.agency_name || 'Saer.pk'}</span></div>
                            <div><span className="text-xs font-black text-slate-800 uppercase mr-2">Contact:</span> <span className="text-sm font-medium text-slate-500">{agentContact}</span></div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"><Printer size={16} /> Print</button>
                            <button className="flex items-center gap-2 px-6 py-2 bg-white border-2 border-blue-600 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-50 transition-all"><Download size={16} /> Download</button>
                        </div>
                        {booking.sar_to_pkr_rate && (
                            <div className="mt-4 p-3 bg-blue-50/50 rounded-xl border border-blue-100/50 inline-block">
                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-1">Currency Snapshot</span>
                                <span className="text-sm font-black text-blue-600">1 SAR = {booking.sar_to_pkr_rate} PKR</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-1">
                        <InclusionPill label="Visa" included={!!pkg.visa_pricing} />
                        <InclusionPill label="Accommodation" included={hotels.length > 0} />
                        <InclusionPill label="Transport" included={!!transport} />
                        <InclusionPill label="Tickets" included={!!flight} />
                        <InclusionPill label="Food" included={!!food} />
                        <InclusionPill label="Ziyarat" included={!!ziyarat} />
                    </div>
                </div>

                {/* --- AGENCY FINANCIAL HEADER TABLE --- */}
                <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-center border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                {['ORDER NO', 'AGENCY CODE', 'CREDIT REMAINING', 'CREDIT DAYS', 'AGREEMENT STATUS', 'PACKAGE NO', 'TOTAL PAX', 'BALANCE', 'STATUS'].map((h, i) => (
                                    <th key={i} className="px-4 py-3 text-[10px] font-black text-slate-400 border-r last:border-r-0 border-slate-100 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="text-xs font-bold text-slate-700">
                            <tr>
                                <td className="px-4 py-4 border-r border-slate-100">{booking.booking_reference || '—'}</td>
                                <td className="px-4 py-4 border-r border-slate-100">{agencyDetails.agency_code || 'AGN-0000'}</td>
                                <td className="px-4 py-4 border-r border-slate-100 text-emerald-600 font-black">{PKR(45900)}</td>
                                <td className="px-4 py-4 border-r border-slate-100"><span className="bg-cyan-400 text-white px-3 py-1 rounded text-[10px]">30 DAYS</span></td>
                                <td className="px-4 py-4 border-r border-slate-100 text-slate-500">Active</td>
                                <td className="px-4 py-4 border-r border-slate-100 text-slate-400">{booking.package_id || 'N/A'}</td>
                                <td className="px-4 py-4 border-r border-slate-100">{totalPax}</td>
                                <td className="px-4 py-4 border-r border-slate-100">PKR {booking.balance || 0}</td>
                                <td className="px-4 py-4">
                                    <span className="bg-slate-500 text-white px-3 py-1 rounded text-[10px] uppercase">{booking.booking_status || 'CONFIRMED'}</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* --- BOOKING OVERVIEW --- */}
                <div className="space-y-12">
                    <h2 className="text-xl font-black text-slate-800">Booking Overview</h2>

                    {/* Payment Details Section */}
                    {booking.payment_details && (
                        <div className="p-6 bg-blue-50/30 rounded-2xl border border-blue-100">
                            <SectionHeader title="Payment Details (Sender Information)" />
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Payment Method</p>
                                    <p className="text-sm font-black text-slate-800 uppercase">{booking.payment_details.payment_method || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                    <span className="bg-slate-500 text-white px-3 py-1 rounded text-[10px] uppercase font-bold">{booking.payment_details.payment_status || '—'}</span>
                                </div>
                                {booking.payment_details.payment_method === 'transfer' && (
                                    <>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sender CNIC</p>
                                            <p className="text-sm font-bold text-slate-700">{booking.payment_details.transfer_cnic || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sender Phone</p>
                                            <p className="text-sm font-bold text-slate-700">{booking.payment_details.transfer_phone || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Account Name</p>
                                            <p className="text-sm font-bold text-slate-700">{booking.payment_details.transfer_account_name || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Account Number</p>
                                            <p className="text-sm font-bold text-slate-700">{booking.payment_details.transfer_account_number || '—'}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Pax Information */}
                    <div>
                        <SectionHeader title="Pax Information" />
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    {['Passenger Name', 'Passport No', 'PAX', 'DOB', 'Total Pax'].map((h, i) => (
                                        <th key={i} className="py-4 text-xs font-black text-slate-400 uppercase">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="text-xs font-medium text-slate-600">
                                {passengers.map((p, i) => (
                                    <tr key={i} className="border-b border-slate-50">
                                        <td className="py-4 font-bold text-slate-800 uppercase">{`${p.first_name || p.name || ''} ${p.last_name || ''}`.trim() || '—'}</td>
                                        <td className="py-4 font-mono">{p.passport_no || '—'}</td>
                                        <td className="py-4 capitalize">{p.type || '—'}</td>
                                        <td className="py-4">{p.dob || '—'}</td>
                                        {i === 0 && <td rowSpan={passengers.length} className="py-4 font-bold text-slate-800 align-top">{adults > 0 && `${adults} Adult`}{children > 0 && ` & ${children} Child`}</td>}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Accommodation */}
                    <div className="space-y-4">
                        <SectionHeader title="Accommodation" />
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    {['Hotel Name', 'Check-In', 'Check-Out', 'Nights', 'Type', 'QTY', 'Rate', 'Net'].map((h, i) => (
                                        <th key={i} className="py-4 text-xs font-black text-slate-400 uppercase">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="text-xs font-medium text-slate-600">
                                {rooms.map((r, i) => {
                                    const hMeta = hotels.find(h => String(h.id || h._id || '') === String(r.hotel_id || ''))
                                        || (isUmrah ? hotels[i] || hotels[0] : null)
                                        || {};
                                    const nights = Number(hMeta.nights || hMeta.total_nights || r.nights || 0);
                                    return (
                                        <tr key={i} className="border-b border-slate-50">
                                            <td className="py-4 font-bold text-slate-800">{r.hotel_name || hMeta.name || hMeta.hotel_name || '—'}</td>
                                            <td className="py-4">{hMeta.check_in || '—'}</td>
                                            <td className="py-4">{hMeta.check_out || '—'}</td>
                                            <td className="py-4">{nights}</td>
                                            <td className="py-4 capitalize">{r.room_type || '—'}</td>
                                            <td className="py-4">{r.quantity || 1}</td>
                                            <td className="py-4">{PKR(r.rate_pkr || r.price_per_person)}</td>
                                            <td className="py-4 font-bold text-slate-800">{PKR((r.rate_pkr || r.price_per_person || 0) * (r.quantity || 1) * (nights || 1))}</td>
                                        </tr>
                                    );
                                })}
                                <tr className="text-xs font-black text-slate-800">
                                    <td className="py-6 uppercase">Total Accommodation</td>
                                    <td colSpan={2} />
                                    <td className="py-6">{rooms.reduce((acc, r) => acc + (Number(r.nights) || 0), 0)}</td>
                                    <td colSpan={3} />
                                    <td className="py-6">
                                        <div className="flex flex-col items-end">
                                            <span>{PKR(hotelTotal)}</span>
                                            {booking.hotel_cost_sar && <span className="text-[10px] text-slate-400 font-bold">{SAR(booking.hotel_cost_sar)} (Audit)</span>}
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Transportation */}
                    <div className="space-y-4">
                        <SectionHeader title="Transportation" />
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    {['Vehicle type', 'Route', 'Rate', 'QTY', 'Net'].map((h, i) => (
                                        <th key={i} className="py-4 text-xs font-black text-slate-400 uppercase">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="text-xs font-medium text-slate-600">
                                {transport ? (
                                    <tr className="border-b border-slate-50">
                                        <td className="py-4 font-bold text-slate-800 tracking-tight">{transport.title || transport.vehicle_name || transport.vehicle_type}</td>
                                        <td className="py-4 text-slate-500 font-medium">{buildRoute(transport)}</td>
                                        <td className="py-4">{PKR(transport.selling)}</td>
                                        <td className="py-4">1</td>
                                        <td className="py-4 font-bold text-slate-800">{PKR(transport.selling)}</td>
                                    </tr>
                                ) : (
                                    <tr><td colSpan={5} className="py-4 text-slate-400">No transport data</td></tr>
                                )}
                                <tr className="text-xs font-black text-slate-800">
                                    <td className="py-6 uppercase">Total Transportation</td>
                                    <td colSpan={3} />
                                    <td className="py-6">
                                        <div className="flex flex-col items-end">
                                            <span>{PKR(transport?.selling || 0)}</span>
                                            {booking.transport_cost_sar && <span className="text-[10px] text-slate-400 font-bold">{SAR(booking.transport_cost_sar)} (Audit)</span>}
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Food Services */}
                    <div className="space-y-4">
                        <SectionHeader title="Food Services" />
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    {['Adult Rate * Qty', 'Child Rate * Qty', 'Infant Rate * Qty', 'Net'].map((h, i) => (
                                        <th key={i} className="py-4 text-xs font-black text-slate-400 uppercase">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="text-xs font-medium text-slate-600">
                                {food ? (
                                    <tr className="border-b border-slate-50">
                                        <td className="py-4">{PKR(food.adult_selling || food.selling)} * {adults}</td>
                                        <td className="py-4">{PKR(food.child_selling || food.selling)} * {children}</td>
                                        <td className="py-4">{PKR(food.infant_selling || food.selling)} * {infants}</td>
                                        <td className="py-4 font-bold text-slate-800">{PKR(foodTotal)}</td>
                                    </tr>
                                ) : (
                                    <tr><td colSpan={4} className="py-4 text-slate-400">No food data</td></tr>
                                )}
                                <tr className="text-xs font-black text-slate-800">
                                    <td className="py-6 uppercase">Total Food Services</td>
                                    <td colSpan={2} />
                                    <td className="py-6">
                                        <div className="flex flex-col items-end">
                                            <span>{PKR(foodTotal)}</span>
                                            {booking.food_cost_sar && <span className="text-[10px] text-slate-400 font-bold">{SAR(booking.food_cost_sar)} (Audit)</span>}
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Visa & Ticket Details */}
                    <div className="space-y-4">
                        <SectionHeader title="Umrah Visa & Tickets Rates Details" />
                        <div className="max-w-xl">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        {['PAX', 'TOTAL PAX', 'VISA RATE', 'TICKET RATE'].map((h, i) => (
                                            <th key={i} className="px-4 py-4 font-black text-slate-400 uppercase">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="font-bold text-slate-700">
                                    <tr className="border-b border-slate-100">
                                        <td className="px-4 py-4">Adult</td><td className="px-4 py-4">{adults}</td>
                                        <td className="px-4 py-4">{PKR(visaPricing.adult_selling || 0)}</td>
                                        <td className="px-4 py-4">{PKR(flight?.adult_pkr || flight?.adult_selling || flight?.departure_trip?.adult_selling || 0)}</td>
                                    </tr>
                                    <tr className="border-b border-slate-100">
                                        <td className="px-4 py-4">Child</td><td className="px-4 py-4">{children}</td>
                                        <td className="px-4 py-4">{PKR(visaPricing.child_selling || 0)}</td>
                                        <td className="px-4 py-4">{PKR(flight?.child_pkr || flight?.child_selling || flight?.departure_trip?.child_selling || 0)}</td>
                                    </tr>
                                    <tr className="border-b border-slate-100">
                                        <td className="px-4 py-4">Infant</td><td className="px-4 py-4">{infants}</td>
                                        <td className="px-4 py-4">{PKR(visaPricing.infant_selling || 0)}</td>
                                        <td className="px-4 py-4">{PKR(flight?.infant_pkr || flight?.infant_selling || flight?.departure_trip?.infant_selling || 0)}</td>
                                    </tr>
                                    <tr className="font-black text-slate-900 border-t-2 border-slate-200">
                                        <td className="px-4 py-4">Total</td>
                                        <td className="px-4 py-4">{totalPax}</td>
                                        <td className="px-4 py-4">{PKR(visaTotal)}</td>
                                        <td className="px-4 py-4">{PKR(flightTotal)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* --- FOOTER INVOICE DETAILS --- */}
                    <div className="flex flex-wrap lg:flex-nowrap justify-between gap-12 pt-8">
                        {/* Left: Metadata */}
                        <div className="space-y-4 min-w-[300px]">
                            <SectionHeader title="Invoice Details" />
                            <div className="space-y-2 text-sm font-bold">
                                <p><span className="text-slate-400 font-extrabold mr-2 uppercase text-[10px] tracking-wider">Booking Date:</span> <span className="text-slate-800">{(booking.created_at || '').split('T')[0]}</span></p>
                                <p><span className="text-slate-400 font-extrabold mr-2 uppercase text-[10px] tracking-wider">Family Head:</span> <span className="text-slate-800 font-black">{passengers[0]?.first_name || 'Aqib'}</span></p>
                                <p><span className="text-slate-400 font-extrabold mr-2 uppercase text-[10px] tracking-wider">Booking#:</span> <span className="text-blue-600">{booking.booking_reference}</span></p>
                                <p><span className="text-slate-400 font-extrabold mr-2 uppercase text-[10px] tracking-wider">Travel Date:</span> <span className="text-slate-800">{booking.travel_date || '2/24/2026, 11:37:00 PM'}</span></p>
                                <p><span className="text-slate-400 font-extrabold mr-2 uppercase text-[10px] tracking-wider">Invoice Date:</span> <span className="text-slate-800">{(new Date().toLocaleDateString())}</span></p>
                                <p><span className="text-slate-400 font-extrabold mr-2 uppercase text-[10px] tracking-wider">Return Date:</span> <span className="text-slate-800">{booking.return_date || '3/3/2026, 11:38:00 PM'}</span></p>
                            </div>
                        </div>

                        {/* Right: Summary Card */}
                        <div className="w-full max-w-sm space-y-4">
                            <div className="border border-slate-200 rounded-xl bg-white shadow-sm font-bold text-xs">
                                <div className="divide-y divide-slate-100">
                                    <div className="flex justify-between p-4"><span>Total Pax:</span><span className="text-slate-900">{totalPax}</span></div>
                                    <div className="flex justify-between p-4"><span>Visa Rate:</span><span className="text-slate-900">{PKR(visaTotal)}</span></div>
                                    <div className="flex justify-between p-4"><span>Tickets:</span><span className="text-slate-900">{PKR(flightTotal)}</span></div>
                                    <div className="flex justify-between p-4"><span>Hotel:</span><span className="text-slate-900">{PKR(hotelTotal)}</span></div>
                                    <div className="flex justify-between p-4"><span>Transport:</span><span className="text-slate-900">{PKR(transport?.selling || 0)}</span></div>
                                    <div className="flex justify-between p-4"><span>Food:</span><span className="text-slate-900">{PKR(foodTotal)}</span></div>
                                    <div className="flex justify-between p-4 text-slate-400"><span>Ziyarat:</span><span className="text-slate-900">{PKR(ziyaratTotal)}</span></div>
                                </div>
                                <div className="p-4 bg-blue-600 text-white flex justify-between rounded-b-xl text-sm font-black tracking-wide">
                                    <div className="flex flex-col">
                                        <span>NET PKR:</span>
                                        {booking.sar_to_pkr_rate && (
                                            <span className="text-[10px] opacity-70 font-bold">TOTAL SAR (AUDIT)</span>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-end text-right">
                                        <span>{PKR(booking.total_amount)}</span>
                                        {booking.sar_to_pkr_rate && (
                                            <span className="text-[10px] opacity-70 font-bold">
                                                {SAR(
                                                    (booking.visa_cost_sar || (booking.visa_cost_pkr / booking.sar_to_pkr_rate)) +
                                                    (booking.hotel_cost_sar || (booking.hotel_cost_pkr / booking.sar_to_pkr_rate)) +
                                                    (booking.transport_cost_sar || (booking.transport_cost_pkr / booking.sar_to_pkr_rate)) +
                                                    (booking.food_cost_sar || (booking.food_cost_pkr / booking.sar_to_pkr_rate)) +
                                                    (booking.ziyarat_cost_sar || (booking.ziyarat_cost_pkr / booking.sar_to_pkr_rate))
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Availability Indicators */}
                    <div className="space-y-1 py-4">
                        <p className="text-xs font-bold font-black text-slate-700">Ticket Availability: <span className="text-emerald-500">Available</span></p>
                        <p className="text-xs font-bold font-black text-slate-700">Hotel Availability: <span className="text-rose-500">Not Available</span></p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-6 pb-12">
                        {/* For underprocess orders: show both Confirm and Approve */}
                        {isUnderprocess && (
                            <button
                                onClick={handleMarkConfirmed}
                                disabled={saving}
                                className="px-10 py-3 bg-amber-500 text-white rounded-lg text-sm font-bold shadow-xl shadow-amber-500/30 hover:bg-amber-600 transition-all flex items-center justify-center min-w-[130px]"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : 'Confirm'}
                            </button>
                        )}
                        {/* Approve: visible for both underprocess and confirmed, hidden only when already approved */}
                        {!isApproved && (
                            <button
                                onClick={handleConfirm}
                                disabled={saving}
                                className="px-10 py-3 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-xl shadow-blue-600/30 hover:bg-blue-700 transition-all flex items-center justify-center min-w-[130px]"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : 'Approve'}
                            </button>
                        )}
                        <button onClick={() => setIsRejectModalOpen(true)} className="px-10 py-3 bg-white border border-rose-600 text-rose-600 rounded-lg text-sm font-bold hover:bg-rose-50 transition-all">Reject With Note</button>
                        <button onClick={onBack} className="px-10 py-3 bg-white border border-slate-300 text-slate-500 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all">Close</button>
                    </div>

                </div>
            </div>
        </div>
    );
}
