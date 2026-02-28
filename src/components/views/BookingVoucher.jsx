import React, { useRef } from 'react';
import { Printer, Download, ArrowLeft, QrCode, Plane } from 'lucide-react';

// ─── Formatting Helpers ─────────────────────────────────────────────────────
const fmt = (v) => (v != null && v !== '' ? v : '—');
const fmtDate = (d) => {
    if (!d) return '—';
    try {
        return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return d; }
};
const parseDTpart = (dt, mode = 'date') => {
    if (!dt) return '';
    try {
        const d = new Date(dt);
        if (isNaN(d.getTime())) return dt;
        if (mode === 'date') return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        if (mode === 'time') return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { return dt; }
    return '';
};

// ─── Section Title ────────────────────────────────────────────────────────────
const Section = ({ title }) => (
    <h3 style={{ borderLeft: '4px solid #dc2626' }} className="text-sm font-extrabold text-slate-800 mb-3 pl-3 uppercase tracking-wide">
        {title}
    </h3>
);

const TH = ({ children, center, right }) => (
    <th className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-500 bg-slate-50 border-b border-slate-200 ${center ? 'text-center' : right ? 'text-right' : 'text-left'}`}>
        {children}
    </th>
);
const TD = ({ children, bold, blue, center, right, mono, muted }) => (
    <td className={`px-3 py-2 text-xs border-b border-slate-100
        ${bold ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}
        ${blue ? 'text-blue-600' : ''}
        ${muted ? 'text-slate-400' : ''}
        ${center ? 'text-center' : ''}
        ${right ? 'text-right' : ''}
        ${mono ? 'font-mono' : ''}`}>
        {children}
    </td>
);

export default function BookingVoucher({ booking, onBack }) {
    const voucherRef = useRef(null);
    const b = booking || {};
    const agency = b.agency_details || {};
    const branch = b.branch_details || {};
    const org = b.organization_details || {};
    const pkg = b.package_details || {};

    // ── Passengers ────────────────────────────────────────────────────────────
    const passengers = b.passengers || [];
    const familyHead = passengers.find(p => p.is_family_head) || passengers.find(p => (p.type || '').toLowerCase() === 'adult') || passengers[0] || {};
    const familyHeadName = `${familyHead.first_name || familyHead.given_name || ''} ${familyHead.last_name || familyHead.surname || ''}`.trim() || '—';

    // ── Booking Meta ──────────────────────────────────────────────────────────
    const refNo = b.booking_reference || '—';
    const voucherDate = fmtDate(b.created_at);
    const rawStatus = b.voucher_status || b.booking_status || 'Draft';
    const voucherStatus = rawStatus.toUpperCase();

    // ── Shirka ────────────────────────────────────────────────────────────────
    // Shirka is set during Order Delivery as a name string. Also stored per-passenger.
    const shirkaDisplay = b.shirka || b.shirka_name || pkg.shirka ||
        (passengers.find(p => p.shirka) || {}).shirka || null;

    // ── Agency / Org ──────────────────────────────────────────────────────────
    const agencyName = agency.company_name || agency.name || branch.name || '—';
    const orgName = org.name || 'SAER KARO TRAVEL & TOURS';
    const helplineNo = org.phone || agency.phone || branch.phone || '—';
    const packageName = pkg.package_name || pkg.name || b.booking_type || '—';

    // ── Hotels ────────────────────────────────────────────────────────────────
    const hotels = pkg.hotels || pkg.selectedHotels || b.hotels || [];
    const roomsSelected = b.rooms_selected || [];
    const totalNights = hotels.reduce((acc, h) => acc + (Number(h.total_nights || h.nights) || 0), 0);

    // ── Food ──────────────────────────────────────────────────────────────────
    // food can come from: pkg.food (object), pkg.food_rows (array), pkg.food_included (bool)
    const foodObj = pkg.food || pkg.fooding || null;
    const foodRows = pkg.food_rows || b.food_rows || [];
    const hasFoodData = foodObj != null || foodRows.length > 0 || pkg.food_included || b.food_included;
    const foodAdults = passengers.filter(p => (p.type || '').toLowerCase() === 'adult').length || b.total_passengers || 1;
    const foodChildren = passengers.filter(p => (p.type || '').toLowerCase() === 'child').length || 0;
    const foodInfants = passengers.filter(p => (p.type || '').toLowerCase() === 'infant').length || 0;
    const foodType =
        (foodRows[0] && (foodRows[0].food_name || foodRows[0].name || foodRows[0].title || foodRows[0].type)) ||
        (foodObj && (foodObj.title || foodObj.menu || foodObj.name)) ||
        pkg.food_type || 'Meccain Standard Meal';

    // ── Transport ─────────────────────────────────────────────────────────────
    const rawTransport = pkg.transport || pkg.selectedTransport || b.transport || [];
    const transports = Array.isArray(rawTransport) ? rawTransport : (rawTransport ? [rawTransport] : []);
    const transportVoucher = b.transport_voucher_number || b.transport_brn || '—';

    // ── Flight ────────────────────────────────────────────────────────────────
    const rawF = Array.isArray(pkg.flight) ? pkg.flight[0] : (pkg.flight || {});
    const dObj = rawF.departure_trip || b.departure_trip || rawF || {};
    const rObj = rawF.return_trip || b.return_trip || {};

    const pick = (keys, ...objs) => {
        for (const o of objs) {
            if (!o || typeof o !== 'object') continue;
            for (const k of keys) if (o[k] != null && o[k] !== '') return o[k];
        }
        return null;
    };
    const pickDT = (keys, ...objs) => {
        const v = pick(keys, ...objs);
        if (!v) return null;
        if (String(v).includes('T') || String(v).match(/\d{4}-\d{2}-\d{2}/)) return v;
        return null;
    };

    // Departure
    const dAirline = pick(['airline'], dObj, rawF, b) || '—';
    const dFlightNo = pick(['flight_number', 'flight_no'], dObj, rawF, b) || '';
    const dSector = pick(['sector'], dObj, rawF) ||
        (dObj.departure_city && dObj.arrival_city ? `${dObj.departure_city} - ${dObj.arrival_city}` : '—');
    const dDepDT = pickDT(['departure_datetime', 'departure_date'], dObj, rawF);
    const dArvDT = pickDT(['arrival_datetime', 'arrival_date'], dObj, rawF);

    // Return
    const aAirline = pick(['airline'], rObj) || '—';
    const aFlightNo = pick(['flight_number', 'flight_no'], rObj) || '';
    const aSector = pick(['sector'], rObj) ||
        (rObj.departure_city && rObj.arrival_city ? `${rObj.departure_city} - ${rObj.arrival_city}` : '—');
    const aDepDT = pickDT(['departure_datetime', 'departure_date'], rObj);
    const aArvDT = pickDT(['arrival_datetime', 'arrival_date'], rObj);

    const flightPNR = pick(['pnr', 'booking_ref', 'reference'], dObj, rawF, b) || '—';

    const tripType = rawF.trip_type || b.trip_type || pkg.trip_type || 'Round-trip';
    const isOneWay = tripType.toLowerCase().includes('one') ||
        (!rObj.airline && !rObj.flight_number && !rObj.departure_city);

    // ── Print & Download ──────────────────────────────────────────────────────
    const handlePrint = () => window.print();

    const handleDownload = async () => {
        const el = voucherRef.current;
        if (!el) return;
        try {
            // html2pdf.js exports function directly (not via .default in UMD)
            const mod = await import('html2pdf.js');
            const html2pdf = mod.default || mod;
            html2pdf().set({
                margin: [8, 10, 8, 10],
                filename: `voucher-${refNo}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    letterRendering: true,
                    backgroundColor: '#ffffff',
                    logging: false,
                },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            }).from(el).save();
        } catch (err) {
            console.error('PDF error:', err);
            window.print();
        }
    };

    return (
        <div id="voucher-print-root" className="p-4 md:p-8 max-w-5xl mx-auto">

            {/* ── Actions Bar ── */}
            <div className="flex items-center justify-between mb-6 print:hidden">
                <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-sm transition-colors">
                    <ArrowLeft size={18} /> Back to List
                </button>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-sm hover:shadow-md hover:text-blue-600 transition-all"
                    >
                        <Printer size={15} /> Print
                    </button>
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
                    >
                        <Download size={15} /> Download PDF
                    </button>
                </div>
            </div>

            {/* ═══ VOUCHER CARD ═══ */}
            <div
                ref={voucherRef}
                style={{ position: 'relative', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                className="bg-white border border-slate-200 rounded-[20px] overflow-hidden shadow-sm"
            >
                {/* WATERMARK */}
                <div
                    className="pointer-events-none select-none"
                    style={{
                        position: 'absolute', inset: 0, zIndex: 10,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transform: 'rotate(-35deg)',
                        fontSize: '96px', fontWeight: 900,
                        color: voucherStatus === 'APPROVED' ? 'rgba(16,185,129,0.08)' : 'rgba(220,38,38,0.08)',
                        letterSpacing: '-2px', whiteSpace: 'nowrap',
                    }}
                >
                    {voucherStatus}
                </div>


                {/* ── 1. HEADER ── */}
                <div className="bg-[#EEEEEE] p-6">
                    {/* Logo + Company Name */}
                    <div className="flex flex-col items-center mb-5">
                        <div className="bg-white px-6 py-2 rounded-xl shadow-sm mb-2">
                            <h1 className="text-2xl font-black text-blue-600 tracking-tight">
                                Saer<span className="text-slate-400">.pk</span>
                            </h1>
                        </div>
                        <p className="text-sm font-extrabold text-slate-700 uppercase tracking-wide">{orgName}</p>
                    </div>

                    {/* Two-column info row */}
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        {/* Left: Agency block */}
                        <div className="flex items-start gap-4">
                            <div className="w-20 h-20 bg-white rounded-lg border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                                <span className="text-[9px] font-black text-slate-400 text-center leading-tight px-1">AGENCY<br />LOGO</span>
                            </div>
                            <div className="space-y-1 pt-1">
                                <p className="font-extrabold text-slate-800 text-base leading-tight">{agencyName}</p>
                                <p className="text-xs text-slate-600"><span className="font-bold">Voucher Date:</span> {voucherDate}</p>
                                <p className="text-xs text-slate-600"><span className="font-bold">Booking No:</span> {refNo}</p>
                                <p className="text-xs text-slate-600"><span className="font-bold">Package:</span> {packageName}</p>
                            </div>
                        </div>

                        {/* Right: Shirka / address block */}
                        <div className="text-right space-y-1 pt-1">
                            <p className="text-xs text-slate-600">
                                <span className="font-bold text-slate-700 text-sm mr-2">Shirka:</span>
                                {shirkaDisplay
                                    ? <span className="font-bold text-slate-900">{shirkaDisplay}</span>
                                    : <span className="text-amber-500 italic">Not yet assigned</span>}
                            </p>
                            <p className="text-xs text-slate-600 mt-1.5">
                                <span className="font-bold">Address:</span> {agency.address || branch.address || '—'}
                            </p>
                            <p className="text-xs text-slate-600">
                                <span className="font-bold">House #</span> {refNo}
                            </p>
                            <p className="text-xs text-slate-600">
                                <span className="font-bold">Helpline number:</span> {helplineNo}
                            </p>
                            <p className={`text-xs font-bold mt-1 ${['APPROVED', 'CONFIRMED'].includes(voucherStatus) ? 'text-emerald-600' : 'text-amber-600'}`}>
                                Voucher Status: <span>{voucherStatus}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── BODY ── */}
                <div className="p-6 space-y-8">

                    {/* ── 2. MEMBERS ── */}
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <Section title="Members" />
                            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg uppercase">
                                Family Head: <span className="text-slate-900">{familyHeadName}</span>
                            </span>
                        </div>
                        <div className="border border-slate-200 rounded-xl overflow-auto">
                            <table className="w-full text-left min-w-[620px]">
                                <thead>
                                    <tr>
                                        <TH>SNO</TH>
                                        <TH>Passport No.</TH>
                                        <TH>Mutamer Name</TH>
                                        <TH>G</TH>
                                        <TH>PAX</TH>
                                        <TH>MOFA#</TH>
                                        <TH>GRP#</TH>
                                        <TH center>VISA#</TH>
                                        <TH right>PNR</TH>
                                    </tr>
                                </thead>
                                <tbody>
                                    {passengers.length > 0 ? passengers.map((p, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50">
                                            <TD muted>{idx + 1}</TD>
                                            <TD mono>{fmt(p.passport_no || p.passport)}</TD>
                                            <TD bold>{`${p.first_name || p.given_name || ''} ${p.last_name || p.surname || ''}`.trim() || '—'}</TD>
                                            <TD>{p.gender ? String(p.gender).charAt(0).toUpperCase() : 'M'}</TD>
                                            <TD>{p.type || 'Adult'}</TD>
                                            <TD mono>{fmt(p.mofa_no || p.mota_no || p.mofa || p.mota || '"')}</TD>
                                            <TD mono>{fmt(p.group_no || p.grp || '—')}</TD>
                                            <TD center>
                                                {(() => {
                                                    const vs = (p.visa_status || 'Pending').toLowerCase();
                                                    const color = vs.includes('approv') || vs === 'approved'
                                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                                        : vs.includes('reject') || vs === 'rejected'
                                                            ? 'bg-rose-50 text-rose-600 border-rose-200'
                                                            : 'bg-amber-50 text-amber-600 border-amber-100';
                                                    return (
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${color}`}>
                                                            {p.visa_status || 'Pending'}
                                                        </span>
                                                    );
                                                })()}
                                            </TD>
                                            <TD right mono>{fmt(flightPNR || p.pnr)}</TD>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="9" className="text-center py-5 text-xs text-slate-400">No passengers found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* ── 3. ACCOMMODATION ── */}
                    <section>
                        <Section title="Accommodation" />
                        <div className="border border-slate-200 rounded-xl overflow-auto">
                            <table className="w-full text-left min-w-[700px]">
                                <thead>
                                    <tr>
                                        <TH>City</TH>
                                        <TH>Hotel Name</TH>
                                        <TH>Voucher No.</TH>
                                        <TH center>View</TH>
                                        <TH center>Meal</TH>
                                        <TH center>Con#</TH>
                                        <TH>Room Type</TH>
                                        <TH>Checkin</TH>
                                        <TH>Checkout</TH>
                                        <TH right>Nights</TH>
                                    </tr>
                                </thead>
                                <tbody>
                                    {hotels.length > 0 ? hotels.map((h, i) => {
                                        const roomMatch = roomsSelected.find(r => r.hotel_id === (h.id || h._id || h.hotel_id));
                                        const hotelVoucher = h.voucher_number || h.hotel_voucher_number || b.hotel_voucher_number || b.hotel_brn || '—';
                                        return (
                                            <tr key={i} className="hover:bg-slate-50/50">
                                                <TD bold>{fmt(h.city)}</TD>
                                                <TD bold blue>{fmt(h.hotel_name || h.name)}</TD>
                                                <TD mono>{fmt(hotelVoucher)}</TD>
                                                <TD center>{fmt(h.view || h.hotel_view)}</TD>
                                                <TD center>{fmt(h.meal_plan || h.meal_type || 'BB')}</TD>
                                                <TD center mono>{fmt(h.confirmation_no || h.con_no)}</TD>
                                                <TD>{fmt(roomMatch?.room_type || h.room_type || h.type || 'double')}</TD>
                                                <TD bold blue>{fmtDate(h.check_in || h.checkin)}</TD>
                                                <TD>{fmtDate(h.check_out || h.checkout)}</TD>
                                                <TD right bold>{fmt(h.total_nights || h.nights)}</TD>
                                            </tr>
                                        );
                                    }) : (
                                        <tr><td colSpan="10" className="text-center py-5 text-xs text-slate-400">No accommodation data</td></tr>
                                    )}
                                    {hotels.length > 0 && (
                                        <tr className="bg-blue-50/40">
                                            <td colSpan="9" className="px-3 py-2 text-right text-xs font-bold text-blue-700 uppercase">Total Nights</td>
                                            <td className="px-3 py-2 text-right text-sm font-black text-blue-800">{totalNights || '—'}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* ── 4. FOOD DETAILS ── */}
                    {hasFoodData && (
                        <section>
                            <Section title="Food Details" />
                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr>
                                            <TH>Food Type</TH>
                                            <TH center>Adults</TH>
                                            <TH center>Children</TH>
                                            <TH center>Infants</TH>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {foodRows.length > 0 ? foodRows.map((r, i) => (
                                            <tr key={i} className="hover:bg-slate-50/50">
                                                <TD bold blue>
                                                    {fmt(r.food_name || r.name || r.title || r.type || foodType)}
                                                </TD>
                                                <TD center bold>{r.adults ?? foodAdults}</TD>
                                                <TD center>{r.children ?? foodChildren}</TD>
                                                <TD center>{r.infants ?? foodInfants}</TD>
                                            </tr>
                                        )) : (
                                            // Show one row from foodObj or fallback
                                            <tr className="hover:bg-slate-50/50">
                                                <TD bold blue>{foodType}</TD>
                                                <TD center bold>{foodAdults}</TD>
                                                <TD center>{foodChildren}</TD>
                                                <TD center>{foodInfants}</TD>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {/* ── 5. TRANSPORT / SERVICES ── */}
                    <section>
                        <Section title="Transport / Services" />
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 border border-slate-200 rounded-xl overflow-hidden">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr>
                                            <TH>Voucher No.</TH>
                                            <TH>Transporter</TH>
                                            <TH>Type</TH>
                                            <TH>Description</TH>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transports.length > 0 ? transports.map((t, i) => (
                                            <tr key={i} className="hover:bg-slate-50/50">
                                                <TD mono>{fmt(t.voucher_number || t.brn || transportVoucher)}</TD>
                                                <TD bold>{fmt(t.title || t.name || t.vehicle_name || t.vehicle_type)}</TD>
                                                <TD>{fmt(t.vehicle_type || t.type)}</TD>
                                                <TD>{fmt(t.sector || t.route || t.description)}</TD>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <TD mono>{fmt(transportVoucher)}</TD>
                                                <TD>—</TD><TD>—</TD><TD>—</TD>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="w-24 h-24 bg-white border border-slate-200 rounded-xl flex items-center justify-center shrink-0">
                                <QrCode size={60} className="text-slate-800" />
                            </div>
                        </div>
                    </section>

                    {/* ── 6. FLIGHTS ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Departure: Pakistan → KSA */}
                        <div>
                            <h4 className="text-sm font-extrabold text-slate-800 mb-2 flex items-center gap-2">
                                <Plane size={15} className="text-blue-600 -rotate-45" />
                                Departure - Pakistan To KSA
                            </h4>
                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                <table className="w-full text-left text-xs">
                                    <thead><tr><TH>Flight</TH><TH>Sector</TH><TH>Departure</TH><TH>Arrival</TH></tr></thead>
                                    <tbody>
                                        <tr className="hover:bg-slate-50/50">
                                            <TD bold>{`${dAirline} ${dFlightNo}`.trim()}</TD>
                                            <TD>{fmt(dSector)}</TD>
                                            <TD>{parseDTpart(dDepDT, 'date')} {parseDTpart(dDepDT, 'time')}</TD>
                                            <TD>{parseDTpart(dArvDT, 'date')} {parseDTpart(dArvDT, 'time')}</TD>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Arrival: KSA → Pakistan */}
                        <div>
                            <h4 className="text-sm font-extrabold text-slate-800 mb-2 flex items-center gap-2">
                                <Plane size={15} className="text-blue-600 rotate-[135deg]" />
                                Arrival - KSA To Pakistan
                            </h4>
                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                <table className="w-full text-left text-xs">
                                    <thead><tr><TH>Flight</TH><TH>Sector</TH><TH>Departure</TH><TH>Arrival</TH></tr></thead>
                                    <tbody>
                                        {isOneWay ? (
                                            <tr><td colSpan="4" className="px-3 py-3 text-center text-xs text-slate-400 italic">One Way Flight</td></tr>
                                        ) : (
                                            <tr className="hover:bg-slate-50/50">
                                                <TD bold>{`${aAirline} ${aFlightNo}`.trim()}</TD>
                                                <TD>{fmt(aSector)}</TD>
                                                <TD>{parseDTpart(aDepDT, 'date')} {parseDTpart(aDepDT, 'time')}</TD>
                                                <TD>{parseDTpart(aArvDT, 'date')} {parseDTpart(aArvDT, 'time')}</TD>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* ── 7. NOTES ── */}
                    <section>
                        <p className="text-xs">
                            <span className="font-black text-slate-700 uppercase">Notes</span>
                            <span className="text-rose-600 font-bold ml-1">
                                {b.notes || 'PLEASE ACCOMMODATE WITH PRIORITY'}
                            </span>
                        </p>
                    </section>

                    {/* ── 8. HOTEL/TRANSPORT CONTACTS ── */}
                    {(hotels.some(h => h.contact_name || h.contact_phone) || transports.some(t => t.contact_name || t.contact_no || t.company_phone)) && (
                        <section>
                            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                {hotels.map((h, i) => (
                                    (h.contact_name || h.contact_phone) ? (
                                        <div key={i} className="flex gap-2">
                                            <span className="font-bold text-slate-700 shrink-0">{h.city} Hotel:</span>
                                            <span className="text-slate-500">{h.contact_name}{h.contact_phone && ` – ${h.contact_phone}`}</span>
                                        </div>
                                    ) : null
                                ))}
                                {transports.map((t, i) => (
                                    (t.contact_name || t.contact_no || t.company_phone) ? (
                                        <div key={`t${i}`} className="flex gap-2 md:col-span-2">
                                            <span className="font-bold text-slate-700 shrink-0">Transport:</span>
                                            <span className="text-slate-500">{t.contact_name}{(t.contact_no || t.company_phone) && ` – ${t.contact_no || t.company_phone}`}</span>
                                        </div>
                                    ) : null
                                ))}
                            </div>
                        </section>
                    )}

                    {/* ── 9. RULES ── */}
                    <section className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                        <h4 className="font-extrabold text-slate-800 mb-3 text-sm">Rules</h4>
                        <ol className="list-decimal pl-5 space-y-1.5 text-xs text-slate-600 font-medium">
                            <li><span className="font-bold text-slate-800">Booking Confirmation:</span> This voucher serves as proof of hotel booking and must be presented at check-in.</li>
                            <li><span className="font-bold text-slate-800">Check-in &amp; Check-out:</span> Standard check-in time is 3:00 PM and check-out time is 12:00 PM. Early check-in or late check-out is subject to hotel policy and availability.</li>
                            <li><span className="font-bold text-slate-800">Identification Requirement:</span> Guests must present a valid passport, visa and this voucher upon arrival.</li>
                            <li><span className="font-bold text-slate-800">Non-Transferable:</span> This voucher is non-transferable and can only be used by the individual(s) named on the booking.</li>
                            <li><span className="font-bold text-slate-800">No Show &amp; Late Arrival:</span> Failure to check in on the specified date without prior notice may result in cancellation without refund.</li>
                            <li><span className="font-bold text-slate-800">Amendments &amp; Cancellations:</span> Any changes or cancellations must be made through the travel agency and are subject to the agency and hotels policies.</li>
                        </ol>
                        <div className="flex justify-center mt-6">
                            <QrCode size={80} className="text-slate-800" />
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
}
