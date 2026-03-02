import React, { useState, useEffect } from 'react';
import { MapPin, Search, MoveRight, Plane, Calendar, Users, DollarSign, ShoppingCart } from 'lucide-react';
import BookingPage from './BookingPage';

const TicketBookingCreationView = ({ resumeId, clearResume }) => {
    const [tickets, setTickets] = useState([]);
    const [airlines, setAirlines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchFilters, setSearchFilters] = useState({
        departureCity: '',
        arrivalCity: ''
    });
    const [showBooking, setShowBooking] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);

    useEffect(() => {
        fetchTickets();
        fetchAirlines();
    }, []);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('access_token');

            if (!token) {
                throw new Error('Not logged in. Please login first.');
            }

            const response = await fetch('http://localhost:8000/api/flights/', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Unauthorized. Your session may have expired. Please login again.');
                }
                throw new Error('Failed to fetch tickets');
            }

            const data = await response.json();
            setTickets(data);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching tickets:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAirlines = async () => {
        try {
            const token = localStorage.getItem('access_token');

            if (!token) {
                console.warn('No access token found');
                return;
            }

            const response = await fetch('http://localhost:8000/api/others/flight-iata?is_active=true', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setAirlines(data);
            } else {
                console.error('Failed to fetch airlines:', response.status);
            }
        } catch (error) {
            console.error('Error fetching airlines:', error);
        }
    };

    const handleSearch = () => {
        fetchTickets();
    };

    const handleBook = (ticket) => {
        // Prepare booking data with full ticket info
        const bookingData = {
            type: 'Flight Ticket',
            itemDetails: {
                route: `${ticket.departure_trip.departure_city} → ${ticket.departure_trip.arrival_city}`,
                dates: `${new Date(ticket.departure_trip.departure_datetime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}${ticket.return_trip ? ' - ' + new Date(ticket.return_trip.departure_datetime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}`,
                airline: ticket.departure_trip.airline,
                flightNo: ticket.departure_trip.flight_number
            },
            ticketId: ticket._id,
            fullTicketData: ticket // Pass complete ticket data for pricing
        };

        setSelectedTicket(bookingData);
        setShowBooking(true);
        window.history.pushState({ step: 1 }, '', `/ticket-booking/step-1${window.location.search}`);
    };

    // Show booking page if ticket is selected or if we are resuming
    if ((showBooking && selectedTicket) || resumeId) {
        return (
            <BookingPage
                bookingData={selectedTicket}
                resumeId={resumeId}
                onBack={() => {
                    setShowBooking(false);
                    setSelectedTicket(null);
                    if (clearResume) clearResume();
                }}
            />
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Flight Tickets</h2>
                    <p className="text-slate-500 font-medium text-lg">Browse and book available flight tickets</p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-6 lg:p-10 rounded-[40px] border border-slate-100 shadow-sm flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-center">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[3px] mb-3">Departure</label>
                        <input
                            type="text"
                            placeholder="Karachi (KHI)"
                            value={searchFilters.departureCity}
                            onChange={(e) => setSearchFilters({ ...searchFilters, departureCity: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        />
                    </div>
                    <div className="hidden lg:flex items-center justify-center pt-8">
                        <MoveRight className="text-slate-200" size={24} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[3px] mb-3">Destination</label>
                        <input
                            type="text"
                            placeholder="Jeddah (JED)"
                            value={searchFilters.arrivalCity}
                            onChange={(e) => setSearchFilters({ ...searchFilters, arrivalCity: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        />
                    </div>
                    <div className="lg:pt-6">
                        <button
                            onClick={handleSearch}
                            className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                        >
                            <Search size={16} /> Search
                        </button>
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-blue-600"></div>
                    <p className="mt-4 text-slate-500 font-medium">Loading tickets...</p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                    <p className="text-red-600 font-medium">Error: {error}</p>
                    <button
                        onClick={fetchTickets}
                        className="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-all"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Tickets Grid */}
            {!loading && !error && (
                <div className="space-y-6">
                    {tickets.length === 0 ? (
                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
                            <Plane className="mx-auto text-slate-300 mb-4" size={48} />
                            <h3 className="text-xl font-black text-slate-400 uppercase tracking-wider mb-2">No Tickets Found</h3>
                            <p className="text-slate-500">No flight tickets available at the moment.</p>
                        </div>
                    ) : (
                        tickets.map((ticket) => (
                            <TicketCard key={ticket._id} ticket={ticket} airlines={airlines} onBook={handleBook} />
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

// Modern Ticket Card Component
const TicketCard = ({ ticket, airlines, onBook }) => {
    const { departure_trip, return_trip, trip_type, total_seats, available_seats, adult_selling, adult_purchasing } = ticket;

    // Debug logging
    console.log('Ticket data:', {
        trip_type,
        has_return_trip: !!return_trip,
        return_trip,
        full_ticket: ticket
    });

    const selling = adult_selling || 0;

    // LegRow component for each flight leg
    const LegRow = ({ trip, isReturn }) => {
        const airlineData = airlines.find(a => a.airline_name === trip.airline);

        return (
            <div className="flex items-center gap-6 py-3">
                {/* Airline Info */}
                <div className="w-40 shrink-0 flex items-center space-x-3">
                    <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center p-1.5 overflow-hidden">
                        {airlineData && airlineData.logo_url ? (
                            <img
                                src={`http://localhost:8000${airlineData.logo_url}`}
                                alt={trip.airline}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextElementSibling.style.display = 'block';
                                }}
                            />
                        ) : null}
                        <Plane className={`${airlineData && airlineData.logo_url ? 'hidden' : ''} ${isReturn ? 'text-emerald-500 rotate-180' : 'text-blue-500'}`} size={20} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                            {isReturn ? 'Return' : 'Departure'}
                        </p>
                        <p className="text-[11px] font-black text-slate-900 truncate uppercase leading-none">{trip.airline}</p>
                    </div>
                </div>

                {/* Route Visualizer */}
                <div className="flex-1 flex items-center gap-4">
                    <div className="text-left w-24">
                        <p className="text-lg font-black text-slate-900 leading-none mb-1">
                            {new Date(trip.departure_datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase truncate">{trip.departure_city}</p>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center px-4">
                        <div className="w-full flex items-center justify-between mb-1">
                            <span className={`text-[8px] font-black uppercase tracking-tighter ${isReturn ? 'text-emerald-500' : 'text-blue-500'}`}>
                                {isReturn ? 'Inbound' : 'Outbound'}
                            </span>
                            <Plane size={10} className={`${isReturn ? 'text-emerald-500 rotate-180' : 'text-blue-500'}`} />
                        </div>
                        <div className="w-full h-[1.5px] bg-slate-100 relative">
                            <div className={`absolute top-0 bottom-0 left-0 right-0 rounded-full opacity-30 ${isReturn ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                        </div>
                        <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-1">
                            {new Date(trip.departure_datetime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </span>
                    </div>

                    <div className="text-right w-24">
                        <p className="text-lg font-black text-slate-900 leading-none mb-1">
                            {new Date(trip.arrival_datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase truncate">{trip.arrival_city}</p>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 overflow-hidden flex flex-col md:flex-row group">
            {/* Left: Flight Details */}
            <div className="flex-1 p-6 md:p-8 space-y-4 border-b md:border-b-0 md:border-r border-slate-100">
                <LegRow trip={departure_trip} isReturn={false} />
                {return_trip && (
                    <>
                        <div className="border-t border-slate-100"></div>
                        <LegRow trip={return_trip} isReturn={true} />
                    </>
                )}
            </div>

            {/* Right: Pricing & Actions */}
            <div className="w-full md:w-80 bg-slate-50 p-6 md:p-8 flex flex-col justify-between">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Available Seats</span>
                        <span className="text-sm font-black text-slate-900">{available_seats} / {total_seats}</span>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                        <div className="space-y-0.5">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Price Per Adult</p>
                            <p className="text-xl font-black text-[#3B82F6]">Rs. {selling.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-2 mt-6">
                    <button
                        onClick={() => onBook && onBook(ticket)}
                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                    >
                        <ShoppingCart size={14} />
                        Book This Ticket
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TicketBookingCreationView;
