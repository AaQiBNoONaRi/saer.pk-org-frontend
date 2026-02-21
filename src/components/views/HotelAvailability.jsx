import React, { useState, useEffect } from 'react';
import {
    Calendar as CalendarIcon, ChevronLeft, ChevronRight,
    X, ArrowLeft, Loader2, Plus, Pencil, Trash2
} from 'lucide-react';

const HotelAvailability = ({ hotel, onBack }) => {
    // ─── Parse hotel date bounds ───────────────────────────────────────────────
    const hotelStart = hotel.available_from ? new Date(hotel.available_from + 'T00:00:00') : new Date();
    const hotelEnd = hotel.available_until ? new Date(hotel.available_until + 'T00:00:00') : new Date(new Date().setFullYear(new Date().getFullYear() + 1));

    // ─── State ─────────────────────────────────────────────────────────────────
    const [rooms, setRooms] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [bedTypes, setBedTypes] = useState([]);

    // Calendar window: start from hotel's available_from
    const [startDate, setStartDate] = useState(hotelStart);
    const daysToShow = 14;

    // ─── New Booking Modal ─────────────────────────────────────────────────────
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [bookingInput, setBookingInput] = useState({
        room_id: '',
        bed_type_id: '',
        client_name: '',
        client_reference: '',
        date_from: '',
        date_to: '',
        notes: '',
        status: 'BOOKED'
    });
    const [savingBooking, setSavingBooking] = useState(false);

    // ─── Edit Booking Modal ────────────────────────────────────────────────────
    const [showEditModal, setShowEditModal] = useState(false);
    const [editBooking, setEditBooking] = useState(null); // full booking object
    const [editInput, setEditInput] = useState({});
    const [savingEdit, setSavingEdit] = useState(false);

    const token = localStorage.getItem('access_token');
    const headers = { 'Authorization': `Bearer ${token}` };

    // ─── Helpers ───────────────────────────────────────────────────────────────
    const fmt = (d) => d.toISOString().split('T')[0];
    const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

    // Clamp a date into [hotelStart, hotelEnd]
    const clamp = (d) => {
        if (d < hotelStart) return new Date(hotelStart);
        if (d > hotelEnd) return new Date(hotelEnd);
        return d;
    };

    // ─── Data loading ──────────────────────────────────────────────────────────
    useEffect(() => { fetchData(); fetchBedTypes(); }, [hotel._id, startDate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Always request only within hotel availability window
            const rangeStart = fmt(clamp(startDate));
            const rangeEnd = fmt(clamp(addDays(startDate, daysToShow)));

            const [roomsRes, bookingsRes] = await Promise.all([
                fetch(`http://localhost:8000/api/hotel-rooms/?hotel_id=${hotel._id}`, { headers }),
                fetch(`http://localhost:8000/api/hotel-bookings/?hotel_id=${hotel._id}&date_from=${rangeStart}&date_to=${rangeEnd}`, { headers })
            ]);

            const roomsData = roomsRes.ok ? await roomsRes.json() : [];
            const bookingsData = bookingsRes.ok ? await bookingsRes.json() : [];

            setRooms(roomsData.sort((a, b) => a.room_number.localeCompare(b.room_number, undefined, { numeric: true })));
            setBookings(bookingsData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchBedTypes = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/bed-types/', { headers });
            if (res.ok) setBedTypes(await res.json());
        } catch (err) { console.error(err); }
    };

    // ─── Calendar days (clamped to hotel range) ────────────────────────────────
    const calendarDays = [];
    for (let i = 0; i < daysToShow; i++) {
        const d = addDays(startDate, i);
        if (d > hotelEnd) break;
        if (d >= hotelStart) calendarDays.push(d);
    }

    // ─── Booking cell lookup ───────────────────────────────────────────────────
    const getBookingForCell = (roomId, date) => {
        const dateStr = fmt(date);
        return bookings.find(b =>
            b.room_id === roomId &&
            b.date_from <= dateStr &&
            b.date_to >= dateStr &&
            b.status !== 'CANCELLED'
        );
    };

    // ─── Navigation (clamped) ─────────────────────────────────────────────────
    const handlePrev = () => {
        const prev = addDays(startDate, -7);
        setStartDate(prev < hotelStart ? new Date(hotelStart) : prev);
    };
    const handleNext = () => {
        const next = addDays(startDate, 7);
        // Don't go past the last window that has any visible days
        const lastWindowStart = addDays(hotelEnd, -(daysToShow - 1));
        setStartDate(next > lastWindowStart ? lastWindowStart : next);
    };
    const handleToday = () => {
        const today = new Date();
        setStartDate(clamp(today));
    };

    const canGoPrev = startDate > hotelStart;
    const canGoNext = addDays(startDate, daysToShow) <= hotelEnd;

    // ─── Open booking modal (optionally pre-fill room) ────────────────────────
    const openBookingModal = (room = null, day = null) => {
        setBookingInput({
            room_id: room?._id || '',
            bed_type_id: room?.bed_type_id || '',
            client_name: '',
            client_reference: '',
            date_from: day ? fmt(day) : (hotel.available_from || ''),
            date_to: day ? fmt(addDays(day, 1)) : '',
            notes: '',
            status: 'BOOKED'
        });
        setShowBookingModal(true);
    };

    // ─── Save booking ─────────────────────────────────────────────────────────
    const handleSaveBooking = async () => {
        if (!bookingInput.room_id || !bookingInput.client_name || !bookingInput.date_from || !bookingInput.date_to) {
            alert('Room, Guest Name, and Dates are required.');
            return;
        }
        if (bookingInput.date_to <= bookingInput.date_from) {
            alert('Check-out date must be after Check-in date.');
            return;
        }

        // Auto-fill bed_type_id from room if missing
        let bed_type_id = bookingInput.bed_type_id;
        if (!bed_type_id) {
            const selectedRoom = rooms.find(r => r._id === bookingInput.room_id);
            bed_type_id = selectedRoom?.bed_type_id || '';
        }

        setSavingBooking(true);
        try {
            const payload = {
                hotel_id: hotel._id,
                room_id: bookingInput.room_id,
                bed_type_id: bed_type_id,
                client_name: bookingInput.client_name,
                client_reference: bookingInput.client_reference || null,
                date_from: bookingInput.date_from,
                date_to: bookingInput.date_to,
                status: bookingInput.status,
                notes: bookingInput.notes || null
            };

            const res = await fetch('http://localhost:8000/api/hotel-bookings/', {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setShowBookingModal(false);
                fetchData();
            } else {
                const err = await res.json();
                alert('Failed to create booking: ' + (err.detail || JSON.stringify(err)));
            }
        } catch (err) {
            alert('Error: ' + err.message);
        } finally {
            setSavingBooking(false);
        }
    };

    const getBedTypeName = (id) => bedTypes.find(b => b._id === id)?.name || '';
    const getRoomNumber = (id) => rooms.find(r => r._id === id)?.room_number || id;

    // ─── Open Edit Modal ──────────────────────────────────────────────────────
    const openEditModal = (booking) => {
        setEditBooking(booking);
        setEditInput({
            client_name: booking.client_name,
            client_reference: booking.client_reference || '',
            date_from: booking.date_from,
            date_to: booking.date_to,
            status: booking.status,
            notes: booking.notes || ''
        });
        setShowEditModal(true);
    };

    // ─── Save edited booking ──────────────────────────────────────────────────
    const handleSaveEdit = async () => {
        if (!editInput.client_name || !editInput.date_from || !editInput.date_to) {
            alert('Guest name and dates are required.'); return;
        }
        if (editInput.date_to <= editInput.date_from) {
            alert('Check-out must be after check-in.'); return;
        }
        setSavingEdit(true);
        try {
            const res = await fetch(`http://localhost:8000/api/hotel-bookings/${editBooking._id}`, {
                method: 'PUT',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify(editInput)
            });
            if (res.ok) { setShowEditModal(false); fetchData(); }
            else {
                const err = await res.json();
                alert('Update failed: ' + (err.detail || JSON.stringify(err)));
            }
        } catch (e) { alert('Error: ' + e.message); }
        finally { setSavingEdit(false); }
    };

    // ─── Cancel (delete) booking ──────────────────────────────────────────────
    const handleCancelBooking = async () => {
        if (!window.confirm(`Cancel booking for "${editBooking.client_name}"?`)) return;
        try {
            // Prefer status update to CANCELLED, fall back to delete
            const res = await fetch(`http://localhost:8000/api/hotel-bookings/${editBooking._id}`, {
                method: 'PUT',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'CANCELLED' })
            });
            if (res.ok) { setShowEditModal(false); fetchData(); }
            else { alert('Could not cancel booking.'); }
        } catch (e) { alert('Error: ' + e.message); }
    };

    // ─── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 bg-white z-[55] flex flex-col">

            {/* ── Header ────────────────────────────────────────────────────── */}
            <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-white shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-50 rounded-full text-slate-500 hover:text-slate-900 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-lg font-black text-slate-900">Availability Calendar — {hotel.name}</h2>
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                            <span>
                                {hotel.available_from} → {hotel.available_until}
                            </span>
                            <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-blue-500 rounded-sm" /> Booked</span>
                            <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-green-500 rounded-sm" /> Checked-in</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleToday}
                        className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
                    >
                        Today
                    </button>

                    <div className="flex items-center bg-slate-50 rounded-lg p-1 border border-slate-200">
                        <button
                            onClick={handlePrev}
                            disabled={!canGoPrev}
                            className="p-1 hover:bg-white rounded shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="px-3 text-xs font-bold text-slate-700 min-w-[110px] text-center">
                            {startDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <button
                            onClick={handleNext}
                            disabled={!canGoNext}
                            className="p-1 hover:bg-white rounded shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    <button
                        onClick={() => openBookingModal()}
                        className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center gap-1.5"
                    >
                        <Plus size={14} /> New Booking
                    </button>
                </div>
            </div>

            {/* ── Timeline Grid ─────────────────────────────────────────────── */}
            <div className="flex-1 overflow-auto bg-slate-50">
                {loading ? (
                    <div className="h-full flex items-center justify-center">
                        <Loader2 className="animate-spin text-blue-600" size={40} />
                    </div>
                ) : calendarDays.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <CalendarIcon size={48} className="mb-3 text-slate-300" />
                        <p className="font-medium">No dates in the availability window.</p>
                    </div>
                ) : (
                    <div className="min-w-max bg-white m-4 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

                        {/* Header Row */}
                        <div className="flex border-b border-slate-200">
                            <div className="w-28 shrink-0 p-3 bg-slate-50 text-xs font-black text-slate-400 uppercase tracking-wider sticky left-0 z-10 border-r border-slate-200">
                                Room
                            </div>
                            {calendarDays.map((day, i) => {
                                const isToday = fmt(day) === fmt(new Date());
                                return (
                                    <div key={i} className={`flex-1 min-w-[64px] p-2 text-center border-r border-slate-100 last:border-r-0 ${isToday ? 'bg-blue-50' : ''}`}>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">{day.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                                        <p className={`text-sm font-black ${isToday ? 'text-blue-600' : 'text-slate-700'}`}>{day.getDate()}</p>
                                        <p className="text-[9px] text-slate-300">{day.toLocaleDateString('en-US', { month: 'short' })}</p>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Room Rows */}
                        <div className="divide-y divide-slate-100">
                            {rooms.length === 0 ? (
                                <div className="p-8 text-center text-slate-400">No rooms configured for this hotel.</div>
                            ) : rooms.map(room => (
                                <div key={room._id} className="flex hover:bg-slate-50/50 transition-colors">
                                    {/* Room Label */}
                                    <div className="w-28 shrink-0 p-3 flex flex-col justify-center bg-white sticky left-0 z-10 border-r border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                        <span className="font-black text-slate-800 text-sm">{room.room_number}</span>
                                        <span className="text-[10px] text-slate-400">{getBedTypeName(room.bed_type_id)}</span>
                                    </div>

                                    {/* Day Cells */}
                                    {calendarDays.map((day, i) => {
                                        const booking = getBookingForCell(room._id, day);
                                        const dateStr = fmt(day);
                                        const isStart = booking && booking.date_from === dateStr;
                                        const isEnd = booking && booking.date_to === dateStr;

                                        return (
                                            <div
                                                key={i}
                                                className="flex-1 min-w-[64px] border-r border-slate-100 relative h-12 p-0.5 group"
                                                onClick={() => !booking && openBookingModal(room, day)}
                                                style={{ cursor: booking ? 'default' : 'pointer' }}
                                                title={!booking ? `Book Room ${room.room_number} on ${dateStr}` : `${booking.client_name} (${booking.status})`}
                                            >
                                                {/* Empty cell hint */}
                                                {!booking && (
                                                    <div className="w-full h-full rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-blue-50 cursor-pointer">
                                                        <Plus size={12} className="text-blue-400" />
                                                    </div>
                                                )}
                                                {/* Booking bar — clickable to edit */}
                                                {booking && (
                                                    <div
                                                        className={`h-full text-[10px] font-bold text-white flex items-center justify-between overflow-hidden shadow-sm cursor-pointer
                                                            ${booking.status === 'CHECKED_IN' ? 'bg-green-500 hover:bg-green-600' : booking.status === 'CHECKED_OUT' ? 'bg-slate-400 hover:bg-slate-500' : 'bg-blue-500 hover:bg-blue-600'}
                                                            ${isStart ? 'rounded-l-md ml-1' : '-ml-0.5 rounded-l-none'}
                                                            ${isEnd ? 'rounded-r-md mr-1' : '-mr-0.5 rounded-r-none'}
                                                            transition-all
                                                        `}
                                                        onClick={(e) => { e.stopPropagation(); openEditModal(booking); }}
                                                        title="Click to edit booking"
                                                    >
                                                        {isStart && <span className="truncate px-2">{booking.client_name}</span>}
                                                        {isStart && <Pencil size={9} className="mr-1.5 opacity-60 shrink-0" />}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Edit Booking Modal ────────────────────────────────────────── */}
            {showEditModal && editBooking && (
                <div className="fixed inset-0 bg-black/50 z-[65] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-black text-slate-900">Edit Booking</h3>
                            <button onClick={() => setShowEditModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                                <X size={18} />
                            </button>
                        </div>
                        <p className="text-xs text-slate-400 mb-5">
                            Room <strong className="text-slate-600">{getRoomNumber(editBooking.room_id)}</strong>
                            {' · '}{getBedTypeName(editBooking.bed_type_id)}
                        </p>

                        <div className="space-y-4">
                            {/* Guest Name */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Guest / Client Name *</label>
                                <input
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none bg-slate-50 text-sm"
                                    value={editInput.client_name}
                                    onChange={e => setEditInput(p => ({ ...p, client_name: e.target.value }))}
                                />
                            </div>

                            {/* Reference */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Reference (Optional)</label>
                                <input
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none bg-slate-50 text-sm"
                                    value={editInput.client_reference}
                                    onChange={e => setEditInput(p => ({ ...p, client_reference: e.target.value }))}
                                />
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Check-in *</label>
                                    <input type="date"
                                        className="w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none bg-slate-50 text-sm"
                                        min={hotel.available_from} max={hotel.available_until}
                                        value={editInput.date_from}
                                        onChange={e => setEditInput(p => ({ ...p, date_from: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Check-out *</label>
                                    <input type="date"
                                        className="w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none bg-slate-50 text-sm"
                                        min={editInput.date_from || hotel.available_from} max={hotel.available_until}
                                        value={editInput.date_to}
                                        onChange={e => setEditInput(p => ({ ...p, date_to: e.target.value }))}
                                    />
                                </div>
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                                <select
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none bg-slate-50 text-sm"
                                    value={editInput.status}
                                    onChange={e => setEditInput(p => ({ ...p, status: e.target.value }))}
                                >
                                    <option value="BOOKED">Booked</option>
                                    <option value="CHECKED_IN">Checked In</option>
                                    <option value="CHECKED_OUT">Checked Out</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </select>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notes</label>
                                <textarea
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none bg-slate-50 text-sm resize-none"
                                    rows={2}
                                    value={editInput.notes}
                                    onChange={e => setEditInput(p => ({ ...p, notes: e.target.value }))}
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-1">
                                <button
                                    onClick={handleCancelBooking}
                                    className="px-4 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 flex items-center gap-1.5 text-sm"
                                >
                                    <Trash2 size={14} /> Cancel Booking
                                </button>
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 text-sm"
                                >
                                    Discard
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    disabled={savingEdit}
                                    className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
                                >
                                    {savingEdit ? <Loader2 size={15} className="animate-spin" /> : null}
                                    {savingEdit ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── New Booking Modal ─────────────────────────────────────────── */}
            {showBookingModal && (
                <div className="fixed inset-0 bg-black/50 z-[65] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-black text-slate-900">New Room Booking</h3>
                            <button onClick={() => setShowBookingModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Room */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Room *</label>
                                <select
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none bg-slate-50 text-sm"
                                    value={bookingInput.room_id}
                                    onChange={e => {
                                        const room = rooms.find(r => r._id === e.target.value);
                                        setBookingInput(p => ({ ...p, room_id: e.target.value, bed_type_id: room?.bed_type_id || '' }));
                                    }}
                                >
                                    <option value="">Select Room...</option>
                                    {rooms.map(r => (
                                        <option key={r._id} value={r._id}>
                                            Room {r.room_number} — {getBedTypeName(r.bed_type_id)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Guest Name */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Guest / Client Name *</label>
                                <input
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none bg-slate-50 text-sm"
                                    placeholder="e.g. Ahmed Raza"
                                    value={bookingInput.client_name}
                                    onChange={e => setBookingInput(p => ({ ...p, client_name: e.target.value }))}
                                />
                            </div>

                            {/* Reference */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Reference / Booking ID (Optional)</label>
                                <input
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none bg-slate-50 text-sm"
                                    placeholder="e.g. PKG-0034"
                                    value={bookingInput.client_reference}
                                    onChange={e => setBookingInput(p => ({ ...p, client_reference: e.target.value }))}
                                />
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Check-in *</label>
                                    <input
                                        type="date"
                                        className="w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none bg-slate-50 text-sm"
                                        min={hotel.available_from}
                                        max={hotel.available_until}
                                        value={bookingInput.date_from}
                                        onChange={e => setBookingInput(p => ({ ...p, date_from: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Check-out *</label>
                                    <input
                                        type="date"
                                        className="w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none bg-slate-50 text-sm"
                                        min={bookingInput.date_from || hotel.available_from}
                                        max={hotel.available_until}
                                        value={bookingInput.date_to}
                                        onChange={e => setBookingInput(p => ({ ...p, date_to: e.target.value }))}
                                    />
                                </div>
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                                <select
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none bg-slate-50 text-sm"
                                    value={bookingInput.status}
                                    onChange={e => setBookingInput(p => ({ ...p, status: e.target.value }))}
                                >
                                    <option value="BOOKED">Booked (Reserved)</option>
                                    <option value="CHECKED_IN">Checked In</option>
                                </select>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notes (Optional)</label>
                                <textarea
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none bg-slate-50 text-sm resize-none"
                                    rows={2}
                                    placeholder="Special requests, pax count, etc."
                                    value={bookingInput.notes}
                                    onChange={e => setBookingInput(p => ({ ...p, notes: e.target.value }))}
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-1">
                                <button
                                    onClick={() => setShowBookingModal(false)}
                                    className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveBooking}
                                    disabled={savingBooking}
                                    className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2"
                                >
                                    {savingBooking ? <Loader2 size={16} className="animate-spin" /> : null}
                                    {savingBooking ? 'Saving...' : 'Confirm Booking'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HotelAvailability;
