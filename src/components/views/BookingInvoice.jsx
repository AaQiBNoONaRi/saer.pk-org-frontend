import React from 'react';
import {
    Printer, Download, ArrowLeft,
    Globe
} from 'lucide-react';

const SectionTitle = ({ title }) => (
    <h3 className="text-sm font-extrabold text-slate-800 mb-4 border-l-4 border-slate-800 pl-3 uppercase tracking-wide">
        {title}
    </h3>
);

export default function BookingInvoice({ booking, onBack }) {
    const b = booking || {};
    const agency = b.agency_details || {};
    const branch = b.branch_details || {};
    const pkg = b.package_details || {};

    // Arrays
    const passengers = b.passengers || [];
    const hotels = pkg.hotels || pkg.selectedHotels || [];
    const rooms = b.rooms_selected || [];
    const rawTransport = pkg.transport || pkg.selectedTransport;
    const transports = Array.isArray(rawTransport) ? rawTransport : (rawTransport ? [rawTransport] : []);
    // Normalize flight: pkg.flight can be an array or object
    const flight = Array.isArray(pkg.flight) ? pkg.flight[0] : (pkg.flight || {});
    const visa = pkg.visa || {};
    const foodRows = pkg.food_rows || [];
    const ziaratRows = pkg.ziarat_rows || [];
    const foodIncluded = pkg.food_included;
    const ziyaratIncluded = pkg.ziyarat_included;

    const invoiceNo = b.booking_reference || b._id?.substring(0, 8) || 'N/A';
    const invoiceDate = b.created_at ? new Date(b.created_at).toLocaleDateString() : 'N/A';
    const status = String(b.booking_status || 'Under Process').toUpperCase();

    // Flight Data Extraction - ROBUST & UNIFIED
    const rawF = flight; // already normalized above
    const dObj = rawF.departure_trip || b.departure_trip || rawF || {};
    const rObj = rawF.return_trip || b.return_trip || {};
    const fIn = (pts, ...os) => {
        for (const o of os) {
            if (!o || typeof o !== 'object') continue;
            for (const k of pts) if (o[k]) return o[k];
        }
        return null;
    };
    const dDate = fIn(['departure_date', 'date'], dObj, rawF, b) ||
        (String(fIn(['departure_datetime'], dObj)).includes('T') ? fIn(['departure_datetime'], dObj).split('T')[0] : 'TBD');
    const aDate = fIn(['departure_date', 'date'], rObj) ||
        fIn(['arrival_date', 'date'], dObj, rawF) || 'TBD';

    // Financial calculations
    const rawTotal = b.grand_total || b.total_amount || 0;
    const paidAmount = b.amount_paid || (b.payment_status === 'paid' ? rawTotal : 0);
    const pendingAmount = rawTotal - paidAmount;

    return (
        <div className="p-8 max-w-[1600px] mx-auto print:p-0">

            {/* Action Toolbar */}
            <div className="max-w-5xl mx-auto mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
                <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
                        <ArrowLeft
                            onClick={onBack}
                            className="cursor-pointer text-slate-400 hover:text-slate-800 transition-colors"
                            size={24}
                        />
                        Invoice <span className="text-slate-400 text-lg font-medium">({invoiceNo})</span>
                    </h2>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-sm hover:shadow-md hover:border-blue-200 hover:text-blue-600 transition-all"
                    >
                        <Printer size={16} /> Print
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white border border-transparent rounded-xl text-xs font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all">
                        <Download size={16} /> Download
                    </button>
                </div>
            </div>

            {/* INVOICE CARD */}
            <div className="max-w-5xl mx-auto bg-white rounded-[24px] shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-none print:rounded-none">

                {/* 1. Header Section */}
                <div className="bg-[#EEEEEE] p-8 relative">
                    <div className="flex flex-col items-center justify-center mb-10">
                        <div className="bg-white px-8 py-3 rounded-xl shadow-sm mb-3">
                            <h1 className="text-3xl font-black text-blue-600 tracking-tight">Saer<span className="text-slate-400">.pk</span></h1>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">POWERED BY</p>
                            <h2 className="text-lg font-bold text-slate-700 uppercase tracking-wide leading-tight">
                                SAER KARO TRAVEL AND TOURS <span className="text-xs text-slate-500 block sm:inline">(SMC PVT LTD)</span>
                            </h2>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-end gap-8 relative z-10">
                        <div className="flex items-start gap-5">
                            <div className="w-32 h-20 bg-white rounded-lg flex items-center justify-center border border-white shadow-sm p-2 shrink-0">
                                <div className="flex flex-col items-center justify-center">
                                    <Globe size={32} className="text-emerald-600 mb-1" strokeWidth={1.5} />
                                    <span className="text-[10px] font-bold text-emerald-700 leading-none">TRAVEL</span>
                                    <span className="text-[10px] font-bold text-emerald-700 leading-none">PAKISTAN</span>
                                </div>
                            </div>
                            <div className="space-y-1.5 pt-1">
                                <h3 className="font-extrabold text-slate-800 text-lg leading-tight">{agency.company_name || agency.name || branch.name || 'Travel Agency'}</h3>
                                <p className="text-sm text-slate-600 font-medium"><span className="font-bold text-slate-700">Booking Date:</span> {invoiceDate}</p>
                                <p className="text-sm text-slate-600 font-medium"><span className="font-bold text-slate-700">Package/Ref:</span> {invoiceNo}</p>
                            </div>
                        </div>
                        <div className="text-right space-y-1.5">
                            <p className="text-sm text-slate-600 font-medium"><span className="font-bold text-slate-700">Agent:</span> {b.agent_name || agency.name || 'N/A'}</p>
                            <p className="text-sm text-slate-600 font-medium"><span className="font-bold text-slate-700">City:</span> {agency.city || branch.city || 'N/A'}</p>
                            <p className="text-sm text-slate-600 font-medium"><span className="font-bold text-slate-700">Phone:</span> {agency.phone || branch.phone || 'N/A'}</p>
                            <p className="text-sm text-blue-600 font-bold"><span className="text-slate-700">Invoice Status:</span> {status}</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-10">

                    {/* 2. Pax Information */}
                    <section>
                        <SectionTitle title="Pax Information" />
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-500 font-bold">
                                        <th className="px-4 py-3">Passenger Name</th>
                                        <th className="px-4 py-3">Passport No</th>
                                        <th className="px-4 py-3">PAX</th>
                                        <th className="px-4 py-3">DOB</th>
                                        <th className="px-4 py-3">PNR</th>
                                        <th className="px-4 py-3">Bed</th>
                                        <th className="px-4 py-3 text-right">Total Pax</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {passengers.map((p, i) => (
                                        <tr key={i} className="text-xs font-semibold text-slate-700">
                                            <td className="px-4 py-3 uppercase">{`${p.first_name || p.given_name || ''} ${p.last_name || p.surname || ''}`.trim() || 'N/A'}</td>
                                            <td className="px-4 py-3 font-mono">{p.passport_number || p.passport_no || p.passport || 'N/A'}</td>
                                            <td className="px-4 py-3">{p.type || 'Adult'}</td>
                                            <td className="px-4 py-3">{p.dob || p.date_of_birth || '-'}</td>
                                            <td className="px-4 py-3">{invoiceNo}</td>
                                            <td className="px-4 py-3">{(() => { const r = rooms.find(r => r.family_id === p.family_id || r.room_type); return r?.room_type || '-'; })()}</td>
                                            {i === 0 && (
                                                <td className="px-4 py-3 text-right font-bold text-slate-900" rowSpan={passengers.length || 1}>{passengers.length} Pax</td>
                                            )}
                                        </tr>
                                    ))}
                                    {passengers.length === 0 && (
                                        <tr><td colSpan="7" className="text-center py-4 text-slate-500">No passengers found</td></tr>
                                    )}
                                    <tr className="bg-slate-50/50">
                                        <td colSpan={7} className="px-4 py-2 text-right text-xs font-bold text-slate-500">Total: {passengers.length}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* 3. Accommodation */}
                    <section>
                        <SectionTitle title="Accommodation" />
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm min-w-[900px]">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-500 font-bold">
                                            <th className="px-4 py-3">Hotel Name</th>
                                            <th className="px-4 py-3">Type</th>
                                            <th className="px-4 py-3">Check-In</th>
                                            <th className="px-4 py-3 text-center">Nights</th>
                                            <th className="px-4 py-3">Check-Out</th>
                                            <th className="px-4 py-3 text-right">Rate</th>
                                            <th className="px-4 py-3 text-center">QTY</th>
                                            <th className="px-4 py-3 text-right">Net</th>
                                            <th className="px-4 py-3 text-center">R.O.R</th>
                                            <th className="px-4 py-3 text-right">Pkr Net</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {(() => {
                                            // Try rooms_selected first (has rate data). Fallback to hotels list.
                                            const rowSource = rooms.length > 0 ? rooms : hotels;
                                            const useRooms = rooms.length > 0;

                                            return rowSource.map((row, i) => {
                                                // If using rooms_selected, get hotel metadata for dates
                                                let hotelMeta = {};
                                                if (useRooms) {
                                                    const hid = String(row.hotel_id || '');
                                                    hotelMeta = hotels.find(h =>
                                                        String(h.id || h.hotel_id || h._id || '') === hid
                                                    ) || {};
                                                }

                                                const hotelName = row.hotel_name || (useRooms ? hotelMeta.hotel_name || hotelMeta.name : row.hotel_name || row.name) || 'N/A';
                                                const roomType = row.room_type || 'Standard';
                                                const checkIn = useRooms ? (hotelMeta.check_in || '-') : (row.check_in || '-');
                                                const checkOut = useRooms ? (hotelMeta.check_out || '-') : (row.check_out || '-');
                                                const nights = Number(useRooms ? (hotelMeta.total_nights || hotelMeta.nights || row.nights || 0) : (row.total_nights || row.nights || 0));
                                                const rate = useRooms ? (row.rate_pkr || row.rate_sar || 0) : 0;
                                                const qty = row.quantity || 1;
                                                const net = rate * qty * nights;

                                                return (
                                                    <tr key={i} className="text-xs font-semibold text-slate-700">
                                                        <td className="px-4 py-3">{hotelName}</td>
                                                        <td className="px-4 py-3">{roomType}</td>
                                                        <td className="px-4 py-3">{checkIn}</td>
                                                        <td className="px-4 py-3 text-center font-bold">{nights || '-'}</td>
                                                        <td className="px-4 py-3">{checkOut}</td>
                                                        <td className="px-4 py-3 text-right">{rate > 0 ? `PKR ${rate.toLocaleString()}` : '-'}</td>
                                                        <td className="px-4 py-3 text-center">{qty}</td>
                                                        <td className="px-4 py-3 text-right">{net > 0 ? `PKR ${net.toLocaleString()}` : '-'}</td>
                                                        <td className="px-4 py-3 text-center">-</td>
                                                        <td className="px-4 py-3 text-right">{net > 0 ? `PKR ${net.toLocaleString()}` : '-'}</td>
                                                    </tr>
                                                );
                                            });
                                        })()}
                                        {rooms.length === 0 && hotels.length === 0 && (
                                            <tr><td colSpan="10" className="text-center py-4 text-slate-500">No hotels reserved</td></tr>
                                        )}
                                        <tr className="bg-slate-50 border-t border-slate-200 font-bold text-slate-800 text-xs">
                                            <td colSpan={3} className="px-4 py-3 text-right uppercase">Total Accommodation</td>
                                            <td className="px-4 py-3 text-center">
                                                {hotels.reduce((acc, h) => acc + (Number(h.total_nights || h.nights) || 0), 0) ||
                                                    rooms.reduce((acc, r) => acc + (Number(r.nights) || 0), 0)}
                                            </td>
                                            <td colSpan={5}></td>
                                            <td className="px-4 py-3 text-right">
                                                {(() => {
                                                    const total = rooms.reduce((acc, r) => {
                                                        const h = hotels.find(h => String(h.id || h.hotel_id || h._id || '') === String(r.hotel_id));
                                                        const n = h ? Number(h.total_nights || h.nights || r.nights || 0) : Number(r.nights || 0);
                                                        return acc + (r.rate_pkr || 0) * (r.quantity || 1) * n;
                                                    }, 0);
                                                    return total > 0 ? `PKR ${total.toLocaleString()}` : '-';
                                                })()}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>

                    {/* 4. Transportation */}
                    <section>
                        <SectionTitle title="Transportation" />
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-500 font-bold">
                                        <th className="px-4 py-3">Vehicle Type</th>
                                        <th className="px-4 py-3">Route</th>
                                        <th className="px-4 py-3 text-right">Rate</th>
                                        <th className="px-4 py-3 text-center">QTY</th>
                                        <th className="px-4 py-3 text-right">Net</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transports.map((t, i) => {
                                        const route = t.sector || t.route || 'N/A';
                                        const rate = t.adult_pkr || t.adult_selling || 0;
                                        const qty = t.quantity || 1; // Or pax total based on setting
                                        return (
                                            <tr key={i} className="text-xs font-semibold text-slate-700">
                                                <td className="px-4 py-3">{t.vehicle_name ? `${t.vehicle_type} - ${t.vehicle_name}` : (t.vehicle_type || t.type || 'N/A')}</td>
                                                <td className="px-4 py-3">{route}</td>
                                                <td className="px-4 py-3 text-right">{rate > 0 ? `PKR ${rate.toLocaleString()}` : '-'}</td>
                                                <td className="px-4 py-3 text-center">{qty}</td>
                                                <td className="px-4 py-3 text-right">{rate > 0 ? `PKR ${(rate * qty).toLocaleString()}` : '-'}</td>
                                            </tr>
                                        );
                                    })}
                                    {transports.length === 0 && (
                                        <tr><td colSpan="5" className="text-center py-4 text-slate-500">No transport reserved</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* 5. Food & Ziyarat Services */}
                    {(foodIncluded || ziyaratIncluded) && (
                        <section>
                            <SectionTitle title="Meals & Ziyarat Tours" />
                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-500 font-bold">
                                            <th className="px-4 py-3">Service Type</th>
                                            <th className="px-4 py-3">City</th>
                                            <th className="px-4 py-3">Date / Details</th>
                                            <th className="px-4 py-3 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {foodIncluded && foodRows.length === 0 && (
                                            <tr className="text-xs font-semibold text-slate-700">
                                                <td className="px-4 py-3 flex items-center gap-2"><span>🍽️</span> Food Package</td>
                                                <td className="px-4 py-3 text-slate-500">Various</td>
                                                <td className="px-4 py-3 text-slate-500">Meals included in package</td>
                                                <td className="px-4 py-3 text-center"><span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-black">INCLUDED</span></td>
                                            </tr>
                                        )}
                                        {foodRows.map((r, i) => (
                                            <tr key={`f-${i}`} className="text-xs font-semibold text-slate-700">
                                                <td className="px-4 py-3 flex items-center gap-2"><span>🍽️</span> Food Selection</td>
                                                <td className="px-4 py-3">{r.city || 'Makkah'}</td>
                                                <td className="px-4 py-3">{r.start_date} to {r.end_date}</td>
                                                <td className="px-4 py-3 text-center"><span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-black">INCLUDED</span></td>
                                            </tr>
                                        ))}

                                        {ziyaratIncluded && ziaratRows.length === 0 && (
                                            <tr className="text-xs font-semibold text-slate-700">
                                                <td className="px-4 py-3 flex items-center gap-2"><span>🕌</span> Ziyarat Tour</td>
                                                <td className="px-4 py-3 text-slate-500">Various</td>
                                                <td className="px-4 py-3 text-slate-500">Ziyarat tours included</td>
                                                <td className="px-4 py-3 text-center"><span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-black">INCLUDED</span></td>
                                            </tr>
                                        )}
                                        {ziaratRows.map((r, i) => (
                                            <tr key={`z-${i}`} className="text-xs font-semibold text-slate-700">
                                                <td className="px-4 py-3 flex items-center gap-2"><span>🕌</span> Ziyarat Tour</td>
                                                <td className="px-4 py-3">{r.city || 'Makkah'}</td>
                                                <td className="px-4 py-3">Visit Date: {r.visit_date}</td>
                                                <td className="px-4 py-3 text-center"><span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-black">INCLUDED</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {/* 6. Pilgrims & Tickets Detail */}
                    <section>
                        <SectionTitle title="Pilgrims & Tickets Detail" />
                        <div className="border border-slate-200 rounded-xl overflow-hidden max-w-lg">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-500 font-bold">
                                        <th className="px-4 py-3">Pax</th>
                                        <th className="px-4 py-3 text-center">Total Pax</th>
                                        <th className="px-4 py-3 text-right">Visa Rate</th>
                                        <th className="px-4 py-3 text-right">Ticket Rate</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    <tr className="text-xs font-semibold text-slate-700">
                                        <td className="px-4 py-2">Adult</td>
                                        <td className="px-4 py-2 text-center">{passengers.filter(p => !p.type || p.type === 'Adult').length}</td>
                                        <td className="px-4 py-2 text-right">{visa.adult_pkr > 0 ? `PKR ${visa.adult_pkr.toLocaleString()}` : '-'}</td>
                                        <td className="px-4 py-2 text-right">{flight.adult_pkr > 0 ? `PKR ${flight.adult_pkr.toLocaleString()}` : '-'}</td>
                                    </tr>
                                    <tr className="text-xs font-semibold text-slate-700">
                                        <td className="px-4 py-2">Child</td>
                                        <td className="px-4 py-2 text-center">{passengers.filter(p => p.type === 'Child').length}</td>
                                        <td className="px-4 py-2 text-right">{visa.child_pkr > 0 ? `PKR ${visa.child_pkr.toLocaleString()}` : '-'}</td>
                                        <td className="px-4 py-2 text-right">{flight.child_pkr > 0 ? `PKR ${flight.child_pkr.toLocaleString()}` : '-'}</td>
                                    </tr>
                                    <tr className="text-xs font-semibold text-slate-700">
                                        <td className="px-4 py-2">Infant</td>
                                        <td className="px-4 py-2 text-center">{passengers.filter(p => p.type === 'Infant').length}</td>
                                        <td className="px-4 py-2 text-right">{visa.infant_pkr > 0 ? `PKR ${visa.infant_pkr.toLocaleString()}` : '-'}</td>
                                        <td className="px-4 py-2 text-right">{flight.infant_pkr > 0 ? `PKR ${flight.infant_pkr.toLocaleString()}` : '-'}</td>
                                    </tr>
                                    <tr className="bg-slate-50 font-bold text-slate-800 text-xs">
                                        <td className="px-4 py-2 uppercase">Total</td>
                                        <td className="px-4 py-2 text-center">{b.total_passengers || passengers.length || 0}</td>
                                        <td className="px-4 py-2 text-right">
                                            {(() => {
                                                const adults = passengers.filter(p => !p.type || p.type === 'Adult').length;
                                                const children = passengers.filter(p => p.type === 'Child').length;
                                                const infants = passengers.filter(p => p.type === 'Infant').length;
                                                const total = (visa.adult_pkr || 0) * adults + (visa.child_pkr || 0) * children + (visa.infant_pkr || 0) * infants;
                                                return total > 0 ? `PKR ${total.toLocaleString()}` : '-';
                                            })()}
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            {(() => {
                                                const adults = passengers.filter(p => !p.type || p.type === 'Adult').length;
                                                const children = passengers.filter(p => p.type === 'Child').length;
                                                const infants = passengers.filter(p => p.type === 'Infant').length;
                                                const total = (flight.adult_pkr || 0) * adults + (flight.child_pkr || 0) * children + (flight.infant_pkr || 0) * infants;
                                                return total > 0 ? `PKR ${total.toLocaleString()}` : `PKR ${Number(rawTotal).toLocaleString()}`;
                                            })()}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* 6. Invoice Details & Footer */}
                    <section className="mt-12">
                        <div className="flex flex-col md:flex-row justify-between gap-12">
                            {/* Left: Metadata */}
                            <div className="space-y-4 text-xs">
                                <h4 className="font-extrabold text-slate-800 text-sm mb-4">Invoice Details</h4>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-2 max-w-md">
                                    <span className="text-slate-500 font-medium">Booking Date:</span>
                                    <span className="font-bold text-slate-800">{invoiceDate}</span>
                                    <span className="text-slate-500 font-medium">Booking#:</span>
                                    <span className="font-bold text-slate-800">{invoiceNo}</span>
                                    <span className="text-slate-500 font-medium">Invoice Date:</span>
                                    <span className="font-bold text-slate-800">{invoiceDate}</span>
                                    <span className="text-slate-500 font-medium">Lead Passenger:</span>
                                    <span className="font-bold text-slate-800 uppercase">{passengers.length > 0 ? `${passengers[0].first_name || passengers[0].given_name || ''} ${passengers[0].last_name || passengers[0].surname || ''}` : 'N/A'}</span>
                                    <span className="text-slate-500 font-medium">Travel Date:</span>
                                    <span className="font-bold text-slate-800">{dDate}</span>
                                    <span className="text-slate-500 font-medium">Return Date:</span>
                                    <span className="font-bold text-slate-800">{aDate}</span>
                                </div>
                            </div>

                            {/* Right: Calculations */}
                            <div className="space-y-3 text-right min-w-[300px]">
                                <div className="text-sm text-slate-500 font-medium">Total Pax: <span className="font-bold text-slate-900">{b.total_passengers || passengers.length || 0}</span></div>
                                <div className="pt-2 border-t border-slate-100 space-y-2">
                                    <div className="flex justify-between text-xs font-bold text-slate-600">
                                        <span>Grand Total:</span>
                                        <span className="text-slate-800">PKR {Number(rawTotal).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-bold text-slate-600">
                                        <span>Paid Amount:</span>
                                        <span className="text-slate-800">PKR {Number(paidAmount).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-bold text-slate-600">
                                        <span>Pending Amount:</span>
                                        <span className="text-rose-600">PKR {Number(pendingAmount).toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="pt-4">
                                    <div className="bg-blue-600 text-white text-sm font-bold py-3 px-6 rounded-xl inline-block shadow-lg shadow-blue-600/20">
                                        Net Balance = PKR {Number(pendingAmount).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 7. Notes */}
                    <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                        {b.notes && (
                            <div className="text-xs">
                                <span className="font-bold text-slate-900">Booking Notes:</span>{' '}
                                <span className="text-slate-600">{b.notes}</span>
                            </div>
                        )}
                        {!b.notes && (
                            <div className="text-xs text-slate-400 italic">No notes added to this booking.</div>
                        )}
                    </section>

                </div>
            </div>
        </div>
    );
}
