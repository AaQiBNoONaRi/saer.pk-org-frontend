import React, { useState, useEffect } from 'react';
import { MapPin, Search, MoveRight, Plane, Calendar, Users, DollarSign } from 'lucide-react';

const TicketsView = ({ onAddTicket, onEditTicket, onDeleteTicket }) => {
    const [tickets, setTickets] = useState([]);
    const [airlines, setAirlines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchFilters, setSearchFilters] = useState({
        departureCity: '',
        arrivalCity: ''
    });

    // Fetch tickets and airlines from API
    useEffect(() => {
        fetchTickets();
        fetchAirlines();
    }, []);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('access_token');

            const response = await fetch('http://localhost:8000/api/flights/', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
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
            const response = await fetch('http://localhost:8000/api/others/flight-iata?is_active=true', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setAirlines(data);
            }
        } catch (error) {
            console.error('Error fetching airlines:', error);
        }
    };

    const handleSearch = () => {
        // Filter tickets based on search criteria
        // For now, just refetch
        fetchTickets();
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Flight Inventory</h2>
                    <p className="text-slate-500 font-medium text-lg">Manage real-time ticket availability for groups.</p>
                </div>
                <button
                    onClick={onAddTicket}
                    className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl shadow-blue-100 hover:scale-105 transition-all"
                >
                    + Add Group Tickets
                </button>
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
                            <p className="text-slate-500">Add your first group ticket to get started!</p>
                            <button
                                onClick={onAddTicket}
                                className="mt-6 px-8 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all"
                            >
                                + Add Ticket
                            </button>
                        </div>
                    ) : (
                        tickets.map((ticket) => (
                            <TicketCard key={ticket._id} ticket={ticket} airlines={airlines} onEditTicket={onEditTicket} onDeleteTicket={onDeleteTicket} />
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

// Modern Ticket Card Component
const TicketCard = ({ ticket, airlines, onEditTicket, onDeleteTicket }) => {
    const { departure_trip, return_trip, trip_type, total_seats, available_seats, adult_selling, adult_purchasing } = ticket;

    // Calculate margin
    const selling = adult_selling || 0;
    const cost = adult_purchasing || 0;
    const margin = selling - cost;

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

            {/* Flight Information Section */}
            <div className="flex-1 p-5 lg:p-7 space-y-2">
                {/* Trip Type Badge */}
                <div className="flex items-center justify-between mb-4">
                    <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-black uppercase tracking-wider">
                        {trip_type}
                    </span>
                    <div className="text-right">
                        <p className="text-xs text-slate-400 font-medium">Available Seats</p>
                        <p className="text-sm font-black text-slate-900">{available_seats}/{total_seats}</p>
                    </div>
                </div>

                <LegRow trip={departure_trip} isReturn={false} />

                {return_trip && (
                    <>
                        <div className="h-px bg-slate-50 mx-4" />
                        <LegRow trip={return_trip} isReturn={true} />
                    </>
                )}
            </div>

            {/* Pricing & Management Sidebar */}
            <div className="w-full md:w-72 bg-slate-50/50 p-6 lg:p-8 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-100">
                <div className="space-y-4">
                    {/* Prices Grid */}
                    <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Adult Selling</p>
                            <p className="text-xl font-black text-[#3B82F6]">Rs. {selling.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-2">
                        <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest text-slate-400">
                            <span>Inventory Cost</span>
                            <span className="text-slate-700 font-black">Rs. {cost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest">
                            <span className="text-emerald-500">Net Margin</span>
                            <span className="text-emerald-600 font-black">+Rs. {margin.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-2 mt-6">
                    <button className="w-full py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
                        Manage PNR
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => onEditTicket(ticket)}
                            className="py-2 bg-white border border-slate-200 text-slate-600 rounded-lg font-bold uppercase text-[9px] tracking-widest hover:bg-slate-50 transition-all"
                        >
                            Edit
                        </button>
                        <button
                            onClick={() => onDeleteTicket(ticket)}
                            className="py-2 bg-white border border-slate-200 text-rose-500 rounded-lg font-bold uppercase text-[9px] tracking-widest hover:bg-rose-50 transition-all"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TicketsView;
