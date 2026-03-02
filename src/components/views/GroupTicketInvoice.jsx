import React from 'react';
import { ArrowLeft, Printer, Download, MapPin, Calendar, Globe, User, Hash } from 'lucide-react';

const PassengerCard = ({ passenger, index }) => (
    <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100 flex items-start gap-4 hover:border-blue-100 transition-all">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-black text-sm shrink-0">
            {index + 1}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-4 gap-x-8 w-full">
            <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</p>
                <p className="text-sm font-bold text-slate-800 uppercase leading-tight">
                    {`${passenger.first_name || passenger.given_name || ''} ${passenger.last_name || passenger.surname || ''}`.trim() || '—'}
                </p>
            </div>
            <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Passport No</p>
                <p className="text-sm font-bold text-slate-700 font-mono tracking-tight">{passenger.passport_no || passenger.passport_number || '—'}</p>
            </div>
            <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pax Type</p>
                <p className="text-sm font-bold text-slate-700">{passenger.type || 'Adult'}</p>
            </div>
        </div>
    </div>
);

export default function GroupTicketInvoice({ booking, onBack }) {
    const b = booking || {};
    const passengers = b.passengers || [];
    const pkg = b.package_details || {};
    const flight = Array.isArray(pkg.flight) ? pkg.flight[0] : (pkg.flight || {});

    // Robust flight extraction
    const dObj = flight.departure_trip || b.departure_trip || flight || {};
    const rObj = flight.return_trip || b.return_trip || {};

    const pick = (pts, ...os) => {
        for (const o of os) {
            if (!o || typeof o !== 'object') continue;
            for (const k of pts) if (o[k]) return o[k];
        }
        return null;
    };

    const dDate = pick(['departure_date', 'date'], dObj, flight, b) || '—';
    const aDate = pick(['arrival_date', 'date'], rObj) || '—';

    return (
        <div className="p-8 max-w-5xl mx-auto print:p-0">
            {/* Action Bar */}
            <div className="flex items-center justify-between mb-8 print:hidden">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-800 hover:border-slate-300 transition-all"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Group Ticket Details</h2>
                        <p className="text-xs font-bold text-slate-400">Ref: {b.booking_reference || b._id?.substring(0, 8)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:shadow-md transition-all"
                    >
                        <Printer size={16} /> Print
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all">
                        <Download size={16} /> Download
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden print:shadow-none print:border-none">

                {/* Header */}
                <div className="bg-[#EEEEEE] p-8 border-b border-slate-100">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8 md:items-start">
                        <div className="flex flex-col items-center md:items-start">
                            <div className="bg-white px-6 py-2 rounded-xl shadow-sm mb-3">
                                <h1 className="text-2xl font-black text-blue-600 tracking-tight">Saer<span className="text-slate-400">.pk</span></h1>
                            </div>
                            <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest">{b.organization_details?.name || 'SAER KARO TRAVEL & TOURS'}</h2>
                        </div>
                        <div className="text-center md:text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Status</p>
                            <span className="inline-block px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-black uppercase border border-emerald-100 tracking-wider">
                                {b.booking_status || 'Confirmed'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-10 space-y-12">
                    {/* Flight Summary */}
                    <section>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-3">
                            <span className="w-8 h-[1px] bg-slate-200"></span>
                            Flight Summary
                            <span className="w-8 h-[1px] bg-slate-200"></span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 space-y-3">
                                <div className="flex items-center gap-3 text-blue-600">
                                    <Globe size={18} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Sector</span>
                                </div>
                                <p className="text-lg font-black text-slate-800 uppercase">{b.sector || 'TBD'}</p>
                            </div>
                            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 space-y-3">
                                <div className="flex items-center gap-3 text-emerald-600">
                                    <Calendar size={18} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Departure</span>
                                </div>
                                <p className="text-lg font-black text-slate-800 uppercase">{dDate}</p>
                            </div>
                            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 space-y-3">
                                <div className="flex items-center gap-3 text-blue-500">
                                    <Calendar size={18} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Return</span>
                                </div>
                                <p className="text-lg font-black text-slate-800 uppercase">{aDate}</p>
                            </div>
                        </div>
                    </section>

                    {/* Passenger Manifest */}
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                                <span className="w-8 h-[1px] bg-slate-200"></span>
                                Passenger Manifest
                            </h3>
                            <span className="px-3 py-1 bg-slate-800 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">
                                Total: {passengers.length} PILGRIMS
                            </span>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {passengers.map((p, i) => (
                                <PassengerCard key={i} index={i} passenger={p} />
                            ))}
                            {passengers.length === 0 && (
                                <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-slate-400 font-bold text-sm">
                                    No passengers assigned to this group ticket.
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Footer Info */}
                    <section className="pt-8 border-t border-slate-100">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PNR Reference</p>
                                <p className="text-sm font-bold text-slate-800 uppercase">{b.pnr || 'TBD'}</p>
                            </div>
                            <div className="space-y-1 text-right md:text-left">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Agent Name</p>
                                <p className="text-sm font-bold text-slate-800 uppercase">{b.agent_name || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Group No</p>
                                <p className="text-sm font-bold text-slate-800 uppercase">{b.group_no || 'N/A'}</p>
                            </div>
                            <div className="space-y-1 text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Organization ID</p>
                                <p className="text-sm font-bold text-slate-800 uppercase">{b.organization_id || 'N/A'}</p>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Bottom Bar */}
                <div className="bg-slate-50 p-6 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[2px]">Generated by SaaS Saer.pk Systems</p>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Digitally Verified Document</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
