import React from 'react';
import { ChevronLeft, Circle, Plane } from 'lucide-react';

export default function TicketPrintView({ booking, orderId }) {
    const pkg = booking?.package_details || {};
    const flightData = pkg.flight || pkg.flights || [];
    const flights = Array.isArray(flightData) ? flightData : [flightData].filter(Boolean);
    const passengers = booking?.passengers || [];
    const agency = booking?.agency_details || {};

    // Formatting helpers
    const formatTime = (dateTimeStr) => {
        if (!dateTimeStr) return '—';
        try {
            if (dateTimeStr.includes(' / ')) return dateTimeStr.split(' / ')[1];
            const date = new Date(dateTimeStr);
            if (isNaN(date.getTime())) return dateTimeStr;
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        } catch (e) { return dateTimeStr; }
    };

    const formatDate = (dateTimeStr) => {
        if (!dateTimeStr) return '—';
        try {
            if (dateTimeStr.includes(' / ')) return dateTimeStr.split(' / ')[0];
            const date = new Date(dateTimeStr);
            if (isNaN(date.getTime())) return dateTimeStr;
            return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch (e) { return dateTimeStr; }
    };
    return (
        <div className="min-h-screen bg-[#E5E7EB] py-8 px-4 font-sans text-slate-800 flex justify-center overflow-y-auto">

            {/* Main Print Card */}
            <div className="w-full max-w-4xl bg-white rounded-[32px] shadow-sm p-8 md:p-12 h-fit">

                {/* Top Actions Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
                    <button className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                        <ChevronLeft size={24} strokeWidth={2.5} />
                    </button>

                    <div className="flex flex-wrap gap-3">
                        <button className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md shadow-blue-600/20 transition-all active:scale-95">
                            Email
                        </button>
                        <button className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md shadow-blue-600/20 transition-all active:scale-95">
                            Print
                        </button>
                        <button className="px-6 py-2.5 bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95">
                            Download
                        </button>
                    </div>
                </div>

                {/* Header Information */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-12">
                    {/* Logo */}
                    <div className="flex items-center gap-1">
                        <h1 className="text-4xl font-black text-blue-600 tracking-tight">Saer</h1>
                        <span className="text-2xl font-black text-slate-400 mt-1">.pk</span>
                    </div>

                    {/* Agency Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4">
                        <div>
                            <p className="text-[10px] font-black text-slate-800 mb-0.5">Name:</p>
                            <p className="text-[10px] font-medium text-slate-500">92 World travel</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-800 mb-0.5">Agent Name:</p>
                            <p className="text-[10px] font-medium text-slate-500 leading-tight">{booking?.agent_name || agency.name || '—'}<br />{agency.phone_number || '—'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-800 mb-0.5">Address:</p>
                            <p className="text-[10px] font-medium text-slate-500 leading-tight">Hilltop town, Street<br />78, Gujranwala</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-800 mb-0.5">Code:</p>
                            <p className="text-[10px] font-medium text-slate-500">{agency.agency_code || '—'}</p>
                        </div>
                    </div>
                </div>

                {/* Tickets Detail Section */}
                <div className="mb-10 space-y-6">
                    <h2 className="text-xl font-black text-slate-800 mb-4">Tickets Detail</h2>

                    {flights.map((flight, fIdx) => {
                        // Resilient extraction for different structures
                        const trip = flight.departure_trip || flight; // For Umrah (nested) or Custom (flat)
                        const retTrip = flight.return_trip || null;

                        const renderTripBox = (t, isReturn = false) => {
                            const depTime = t.departure_time || t.departure_datetime || t.time || '—';
                            const arrTime = t.arrival_time || t.arrival_datetime || t.time || '—';
                            const fromCity = t.from_city || t.departure_city || '—';
                            const toCity = t.to_city || t.arrival_city || '—';
                            const airline = t.airline || '—';
                            const flNo = t.flight_no || t.flight_number || '—';

                            return (
                                <div key={isReturn ? 'ret' : 'dep'} className={`${isReturn ? 'bg-emerald-50' : 'bg-[#EBF5FF]'} rounded-2xl flex flex-col md:flex-row relative mb-4`}>
                                    {/* Left: Flight Route */}
                                    <div className="flex-1 p-8 flex flex-col sm:flex-row justify-between items-center relative gap-6">
                                        {/* Depart */}
                                        <div className="text-center sm:text-left min-w-[120px]">
                                            <p className="text-sm font-bold text-slate-500 mb-1">Depart</p>
                                            <h3 className="text-4xl font-black text-slate-800 tracking-tight mb-1">{formatTime(depTime)}</h3>
                                            <p className="text-sm font-semibold text-slate-400 mb-1">{formatDate(depTime)}</p>
                                            <p className="text-lg font-black text-slate-800 uppercase">{fromCity}</p>
                                        </div>

                                        {/* Connector */}
                                        <div className="flex flex-col items-center justify-center w-full px-4 relative mt-4 sm:mt-0">
                                            <div className="flex items-center w-full gap-1 absolute top-1/2 -translate-y-1/2">
                                                <div className="h-px bg-slate-300 flex-1 border-t border-dashed border-slate-400"></div>
                                            </div>
                                            <div className={`${isReturn ? 'bg-emerald-50' : 'bg-[#EBF5FF]'} px-3 z-10 flex flex-col items-center`}>
                                                <Plane size={16} className={`${isReturn ? 'text-emerald-500 rotate-180' : 'text-blue-500'} mb-1`} />
                                                <p className="text-[10px] font-black text-slate-800 whitespace-nowrap uppercase">{airline}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase">{flNo}</p>
                                            </div>
                                        </div>

                                        {/* Arrival */}
                                        <div className="text-center sm:text-right min-w-[120px]">
                                            <p className="text-sm font-bold text-slate-500 mb-1">Arrival</p>
                                            <h3 className="text-4xl font-black text-slate-800 tracking-tight mb-1">{formatTime(arrTime)}</h3>
                                            <p className="text-sm font-semibold text-slate-400 mb-1">{formatDate(arrTime)}</p>
                                            <p className="text-lg font-black text-slate-800 uppercase">{toCity}</p>
                                        </div>
                                    </div>

                                    {/* Dashed Divider */}
                                    <div className={`hidden md:block w-px border-l border-dashed ${isReturn ? 'border-emerald-200' : 'border-blue-200'} relative my-6`}></div>
                                    <div className={`block md:hidden h-px border-t border-dashed ${isReturn ? 'border-emerald-200' : 'border-blue-200'} mx-6`}></div>

                                    {/* Right: Flight Meta */}
                                    <div className="w-full md:w-64 p-8 flex flex-col justify-center">
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                                            <div className="text-center">
                                                <p className="text-sm font-black text-slate-800 mb-0.5">Confirm</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-black text-slate-800 mb-0.5">Economy</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Class</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-black text-slate-800 mb-0.5 uppercase">{passengers[0]?.pnr || flight.pnr || '—'}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PNR</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-black text-slate-800 mb-0.5">30.0 KG</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Baggage</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        };

                        return (
                            <div key={fIdx} className="space-y-4">
                                {renderTripBox(trip, false)}
                                {retTrip && renderTripBox(retTrip, true)}
                            </div>
                        );
                    })}
                </div>

                {/* Passenger Details Section */}
                <div className="mb-10">
                    <h2 className="text-xl font-black text-slate-800 mb-4">Passenger Details</h2>

                    <div className="space-y-3">
                        {passengers.map((pax, idx) => (
                            <div key={idx} className="border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-sm transition-shadow text-slate-600">

                                <div className="flex items-center gap-8 w-full sm:w-auto">
                                    <div className="min-w-[50px]">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pex NO</p>
                                        <p className="text-xl font-black text-slate-800">{String(idx + 1).padStart(2, '0')}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Traveler Name</p>
                                        <p className="text-sm font-black text-slate-800 underline decoration-slate-300 underline-offset-4 uppercase">{pax.first_name || pax.name || '—'} {pax.last_name || ''}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-12 w-full sm:w-auto mt-2 sm:mt-0">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Agency PNR</p>
                                        <p className="text-sm font-black text-slate-800 underline decoration-slate-300 underline-offset-4">{pax.pnr || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fare</p>
                                        <p className="text-base font-black text-slate-800">PKR {(Number(pax.fare) || 0).toLocaleString()}/</p>
                                    </div>
                                </div>

                            </div>
                        ))}
                    </div>
                </div>

                {/* Accommodation Section */}
                {booking?.rooms_selected?.length > 0 && (
                    <div className="mb-10 text-slate-600">
                        <h2 className="text-xl font-black text-slate-800 mb-4">Accommodation</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {booking.rooms_selected.map((room, idx) => (
                                <div key={idx} className="border border-slate-200 rounded-2xl p-5 bg-white shadow-sm flex justify-between items-center group hover:border-blue-200 transition-all">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Hotel Name</p>
                                        <p className="text-sm font-black text-slate-800 group-hover:text-blue-600 transition-colors uppercase">{room.hotel_name || '—'}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{room.city || 'Makkah / Madinah'}</p>
                                        {room.hotel_voucher_number && room.hotel_voucher_number !== 'N/A' && (
                                            <p className="text-[9px] font-bold text-blue-600 mt-1">VOUCHER: {room.hotel_voucher_number}</p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-bold text-slate-500 mb-1">IN: {formatDate(room.check_in)}</div>
                                        <div className="text-[10px] font-bold text-slate-500 mb-1">OUT: {formatDate(room.check_out)}</div>
                                        {(room.hotel_brn || room.brn) && (room.hotel_brn !== 'N/A' || room.brn !== 'N/A') && (
                                            <div className="text-[9px] font-bold text-slate-400">BRN: {room.hotel_brn || room.brn}</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Transportation & Extras */}
                {(pkg.transport || pkg.food || pkg.fooding || pkg.ziarat || pkg.ziyarat) && (
                    <div className="mb-10 text-slate-600">
                        <h2 className="text-xl font-black text-slate-800 mb-4">Additional Services</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {pkg.transport && (
                                <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-sm">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Transportation</p>
                                    <p className="text-sm font-black text-slate-800 uppercase">{pkg.transport.title || pkg.transport.name || pkg.transport.vehicle_type || '—'}</p>
                                    <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase">{pkg.transport.sector || pkg.transport.route || 'Route Details'}</p>
                                    {(pkg.transport.brn || booking.transport_brn) && (pkg.transport.brn !== 'N/A' || booking.transport_brn !== 'N/A') && (
                                        <p className="text-[9px] font-bold text-slate-400 mt-2">BRN: {pkg.transport.brn || booking.transport_brn}</p>
                                    )}
                                </div>
                            )}
                            {(pkg.food || pkg.fooding) && (
                                <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-sm">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Catering / Food</p>
                                    <p className="text-sm font-black text-slate-800 uppercase">{(pkg.food || pkg.fooding).title || (pkg.food || pkg.fooding).menu || 'Standard Meal'}</p>
                                    <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase">Full Board / Half Board</p>
                                    {(pkg.food || pkg.fooding).brn && (pkg.food || pkg.fooding).brn !== 'N/A' && (
                                        <p className="text-[9px] font-bold text-slate-400 mt-2">BRN: {(pkg.food || pkg.fooding).brn}</p>
                                    )}
                                </div>
                            )}
                            {(pkg.ziarat || pkg.ziyarat) && (
                                <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-sm">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ziyarat Details</p>
                                    <p className="text-sm font-black text-slate-800 uppercase">{(pkg.ziarat || pkg.ziyarat).title || (pkg.ziarat || pkg.ziyarat).name || 'Local Ziyarat'}</p>
                                    <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase">Makkah & Madinah</p>
                                    {(pkg.ziarat || pkg.ziyarat).brn && (pkg.ziarat || pkg.ziyarat).brn !== 'N/A' && (
                                        <p className="text-[9px] font-bold text-slate-400 mt-2">BRN: {(pkg.ziarat || pkg.ziyarat).brn}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Total Balance Section */}
                <div className="bg-[#EBF5FF] rounded-2xl p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
                    <h3 className="text-lg font-black text-slate-800">Total Balance</h3>

                    <div className="w-full md:w-80 space-y-4">
                        <div className="flex justify-between items-center border-b border-blue-100 pb-3">
                            <span className="text-sm font-black text-slate-700">Sub Total</span>
                            <span className="text-base font-black text-slate-800 underline decoration-slate-300 underline-offset-4">Rs 360,000/</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-blue-100 pb-3">
                            <span className="text-sm font-black text-slate-700">Paid</span>
                            <span className="text-base font-black text-blue-600 underline decoration-blue-200 underline-offset-4">Rs 360,000/</span>
                        </div>
                        <div className="flex justify-between items-center pt-1">
                            <span className="text-sm font-black text-slate-700">Pending</span>
                            <span className="text-lg font-black text-slate-800">Rs 0/</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Booking Date: <span className="font-black text-slate-800">{formatDate(booking?.created_at) || '—'}</span>
                    </p>
                </div>

            </div>
        </div>
    );
}
