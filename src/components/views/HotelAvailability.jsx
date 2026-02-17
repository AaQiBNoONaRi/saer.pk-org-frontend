import React, { useState, useEffect } from 'react';
import {
    Calendar as CalendarIcon, ChevronLeft, ChevronRight,
    Filter, Search, User, CheckCircle, Clock, X, ArrowLeft, Loader2
} from 'lucide-react';

const HotelAvailability = ({ hotel, onBack }) => {
    // State
    const [rooms, setRooms] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState(new Date());
    const [daysToShow, setDaysToShow] = useState(14);
    const [activeBookings, setActiveBookings] = useState([]); // For tooltip/modal

    // Filters
    const [floorFilter, setFloorFilter] = useState('All');
    const [typeFilter, setTypeFilter] = useState('All');

    const token = localStorage.getItem('access_token');
    const headers = { 'Authorization': `Bearer ${token}` };

    // Format Date Helper
    const formatDate = (date) => date.toISOString().split('T')[0];
    const addDays = (date, days) => {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    };

    // Initial Load
    useEffect(() => {
        fetchData();
    }, [hotel._id, startDate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Rooms
            const roomsRes = await fetch(`http://localhost:8000/api/hotel-rooms/?hotel_id=${hotel._id}`, { headers });
            const roomsData = await roomsRes.json();

            // 2. Fetch Bookings for Range
            const startStr = formatDate(startDate);
            const endStr = formatDate(addDays(startDate, daysToShow));

            const bookingsRes = await fetch(
                `http://localhost:8000/api/hotel-bookings/?hotel_id=${hotel._id}&date_from=${startStr}&date_to=${endStr}`,
                { headers }
            );

            let bookingsData = [];
            if (bookingsRes.ok) {
                bookingsData = await bookingsRes.json();
            }

            setRooms(roomsData.sort((a, b) => a.room_number.localeCompare(b.room_number, undefined, { numeric: true })));
            setBookings(bookingsData);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Generate Calendar Days
    const calendarDays = [];
    for (let i = 0; i < daysToShow; i++) {
        calendarDays.push(addDays(startDate, i));
    }

    // Filter Rooms
    const filteredRooms = rooms.filter(room => {
        if (floorFilter !== 'All' && room.floor_id !== floorFilter) return false;
        // Add type filter logic if we fetch bed types map
        return true;
    });

    // Get Booking for Cell
    const getBookingForCell = (roomId, date) => {
        const dateStr = formatDate(date);
        return bookings.find(b =>
            b.room_id === roomId &&
            b.date_from <= dateStr &&
            b.date_to >= dateStr &&
            b.status !== 'CANCELLED'
        );
    };

    // Handle Date Nav
    const handlePrev = () => setStartDate(addDays(startDate, -7));
    const handleNext = () => setStartDate(addDays(startDate, 7));
    const handleToday = () => setStartDate(new Date());

    return (
        <div className="fixed inset-0 bg-white z-[55] flex flex-col">
            {/* Header */}
            <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-white shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-50 rounded-full text-slate-500 hover:text-slate-900 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-lg font-black text-slate-900">Availability Calendar : {hotel.name}</h2>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-full"></div> Booked</span>
                            {/* <span className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-400 rounded-full"></div> Pending</span> */}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={handleToday} className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">Today</button>
                    <div className="flex items-center bg-slate-50 rounded-lg p-1 border border-slate-200">
                        <button onClick={handlePrev} className="p-1 hover:bg-white rounded shadow-sm transition-all"><ChevronLeft size={16} /></button>
                        <span className="px-3 text-xs font-bold text-slate-700 min-w-[100px] text-center">
                            {startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </span>
                        <button onClick={handleNext} className="p-1 hover:bg-white rounded shadow-sm transition-all"><ChevronRight size={16} /></button>
                    </div>
                    {/* Add Booking Button Placeholder */}
                    <button className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200">
                        + New Booking
                    </button>
                </div>
            </div>

            {/* Timeline Grid */}
            <div className="flex-1 overflow-auto bg-slate-50">
                {loading ? (
                    <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
                ) : (
                    <div className="min-w-max bg-white m-4 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        {/* Header Row */}
                        <div className="flex border-b border-slate-200">
                            <div className="w-24 shrink-0 p-3 bg-slate-50 text-xs font-black text-slate-400 uppercase tracking-wider sticky left-0 z-10 border-r border-slate-200">
                                Room
                            </div>
                            {calendarDays.map((day, i) => (
                                <div key={i} className={`flex-1 min-w-[60px] p-2 text-center border-r border-slate-100 last:border-r-0 ${formatDate(day) === formatDate(new Date()) ? 'bg-blue-50' : ''
                                    }`}>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">{day.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                                    <p className={`text-sm font-black ${formatDate(day) === formatDate(new Date()) ? 'text-blue-600' : 'text-slate-700'
                                        }`}>{day.getDate()}</p>
                                </div>
                            ))}
                        </div>

                        {/* Room Rows */}
                        <div className="divide-y divide-slate-100">
                            {filteredRooms.map(room => (
                                <div key={room._id} className="flex hover:bg-slate-50 transition-colors">
                                    <div className="w-24 shrink-0 p-3 flex flex-col justify-center bg-white sticky left-0 z-10 border-r border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                        <span className="font-black text-slate-800">{room.room_number}</span>
                                        {/* <span className="text-[10px] text-slate-400">Double</span> */}
                                    </div>

                                    {calendarDays.map((day, i) => {
                                        const booking = getBookingForCell(room._id, day);
                                        const isStart = booking && booking.date_from === formatDate(day);
                                        const isEnd = booking && booking.date_to === formatDate(day);
                                        const isMiddle = booking && !isStart && !isEnd;

                                        return (
                                            <div key={i} className="flex-1 min-w-[60px] border-r border-slate-100 relative h-12 p-1">
                                                {booking && (
                                                    <div
                                                        className={`h-full rounded-md text-[10px] font-bold text-white flex items-center justify-center overflow-hidden cursor-pointer shadow-sm
                                                            ${booking.status === 'CHECKED_IN' ? 'bg-green-500' : 'bg-blue-500'}
                                                            ${isStart ? 'ml-1 rounded-l-md' : 'rounded-l-none -ml-4'} 
                                                            ${isEnd ? 'mr-1 rounded-r-md' : 'rounded-r-none -mr-4'}
                                                            z-0 hover:z-10 hover:brightness-110
                                                        `}
                                                        title={`Booking: ${booking.guest_name} (${booking.status})`}
                                                    >
                                                        {isStart && <span className="truncate px-1">{booking.guest_name || 'Guest'}</span>}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                            {filteredRooms.length === 0 && (
                                <div className="p-8 text-center text-slate-400">No rooms found.</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HotelAvailability;
