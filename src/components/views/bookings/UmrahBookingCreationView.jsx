import React, { useState, useEffect } from 'react';
import { Building2, Truck, ShieldCheck, Plane, Utensils, DollarSign, ShoppingCart } from 'lucide-react';

const UmrahBookingCreationView = ({ onBookPackage }) => {
    const [packages, setPackages] = useState([]);
    const [flights, setFlights] = useState([]);
    const [airlines, setAirlines] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPackages = async () => {
        try {
            const token = localStorage.getItem('access_token');

            if (!token) {
                console.error('No access token found. Please login first.');
                setLoading(false);
                return;
            }

            const response = await fetch('http://localhost:8000/api/packages/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    console.error('Unauthorized. Session may have expired.');
                }
                throw new Error(`Failed to fetch packages: ${response.status}`);
            }

            const data = await response.json();
            setPackages(data);
        } catch (error) {
            console.error('Error fetching packages:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPackages();
        fetchFlights();
        fetchAirlines();
    }, []);

    const fetchFlights = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('http://localhost:8000/api/flights/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setFlights(data);
            }
        } catch (error) {
            console.error('Error fetching flights:', error);
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

    const handleBook = (pkg) => {
        if (onBookPackage) {
            onBookPackage(pkg, flights, airlines);
        }
    };

    if (loading) {
        return <div className="text-center text-slate-500">Loading packages...</div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Umrah Packages</h2>
                    <p className="text-slate-500 font-medium">Browse and book available Umrah packages</p>
                </div>
            </div>

            <div className="space-y-6">
                {packages.length === 0 ? (
                    <div className="text-center p-12 bg-slate-50 rounded-[40px] border border-slate-200 border-dashed">
                        <p className="text-slate-400 font-medium">No packages available at the moment.</p>
                    </div>
                ) : (
                    packages.map(pkg => (
                        <UmrahPackageCard
                            key={pkg._id}
                            packageData={pkg}
                            flights={flights}
                            airlines={airlines}
                            onBook={handleBook}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

const UmrahPackageCard = ({ packageData, onBook, flights = [], airlines = [] }) => {
    const formatPrice = (price) => price ? price.toLocaleString() : 'N/A';
    const hotels = packageData.hotels || [];
    const prices = packageData.package_prices || {};
    // normalize flight times for display (handle various shapes)
    const normalizeFlightTimes = (f) => {
        if (!f) return null;
        const departure_time = f.departure_time || f.time || f.departure_trip?.departure_time || (f.departure_trip?.departure_datetime ? new Date(f.departure_trip.departure_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null) || null;
        const arrival_time = f.arrival_time || f.departure_trip?.arrival_time || (f.departure_trip?.arrival_datetime ? new Date(f.departure_trip.arrival_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null) || null;
        return { departure_time, arrival_time };
    };

    // Resolve flight data when package stores only an ID
    const resolveRawFlight = (pkg) => {
        const flightId = typeof pkg.flight === 'object' ? pkg.flight?.id || pkg.flight?._id : pkg.flight;
        const found = flights.find(f => (f._id || f.id) === flightId);
        return found || (typeof pkg.flight === 'object' ? pkg.flight : null);
    };

    const rawFlight = resolveRawFlight(packageData);
    const outboundTimes = normalizeFlightTimes(rawFlight || packageData.flight);
    const returnTimes = normalizeFlightTimes((rawFlight && rawFlight.return_flight) || packageData.flight?.return_flight);

    // Map airline codes/names using `airlines` list
    const getAirlineName = (identifier) => {
        if (!identifier) return '';
        if (typeof identifier === 'object') return identifier.airline_name || identifier.name || '';
        const byIata = airlines.find(a => (a.iata_code || '').toLowerCase() === String(identifier).toLowerCase());
        if (byIata) return byIata.airline_name || byIata.name || identifier;
        const byName = airlines.find(a => (a.airline_name || '').toLowerCase() === String(identifier).toLowerCase());
        if (byName) return byName.airline_name || identifier;
        return identifier;
    };

    const normalizeFullFlight = (raw) => {
        if (!raw) return null;
        return {
            airline: getAirlineName(raw.departure_trip?.airline || raw.airline || raw.airline_code || raw.iata || raw.iata_code),
            flight_number: raw.departure_trip?.flight_number || raw.flight_number || raw.number || '',
            departure_city: raw.departure_trip?.departure_city || raw.departure_city || raw.from_city || '',
            arrival_city: raw.departure_trip?.arrival_city || raw.arrival_city || raw.to_city || '',
            departure_time: outboundTimes?.departure_time || null,
            arrival_time: outboundTimes?.arrival_time || null,
            return_flight: raw.return_flight ? {
                airline: getAirlineName(raw.return_flight.departure_trip?.airline || raw.return_flight.airline || raw.return_flight.airline_code),
                departure_city: raw.return_flight.departure_city || raw.return_flight.departure_trip?.departure_city || '',
                arrival_city: raw.return_flight.arrival_city || raw.return_flight.departure_trip?.arrival_city || '',
                departure_time: returnTimes?.departure_time || null,
                arrival_time: returnTimes?.arrival_time || null,
            } : null
        };
    };

    const flight = normalizeFullFlight(rawFlight || packageData.flight);

    return (
        <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-4 sm:p-6 lg:p-8 hover:shadow-md transition-all duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 sm:mb-8">
                <div className="flex-1">
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">{packageData.title}</h3>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 flex-wrap">
                        {packageData.flight && (
                            <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg flex items-center gap-1">
                                <Plane size={12} className="text-blue-600" /> <span className="hidden sm:inline">Flight Included</span><span className="sm:hidden">Flight</span>
                            </span>
                        )}
                        {packageData.visa_pricing && (
                            <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg flex items-center gap-1">
                                <ShieldCheck size={12} className="text-blue-600" /> <span className="hidden sm:inline">Visa Included</span><span className="sm:hidden">Visa</span>
                            </span>
                        )}
                        {packageData.food && (
                            <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg flex items-center gap-1">
                                <Utensils size={12} className="text-blue-600" /> <span className="hidden sm:inline">Food Included</span><span className="sm:hidden">Food</span>
                            </span>
                        )}
                        {packageData.transport && (
                            <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg flex items-center gap-1">
                                <Truck size={12} className="text-blue-600" /> {packageData.transport.sector}
                            </span>
                        )}
                    </div>
                </div>
                <div className="text-left sm:text-right w-full sm:w-auto">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-2">{packageData.pax_capacity} Seats Capacity</span>
                    <div className="w-full sm:w-32 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-600 w-2/3"></div></div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mb-6 lg:mb-8">

                {/* Left Column: Services Details (7 cols) */}
                <div className="lg:col-span-7 space-y-4 lg:space-y-6">

                    {/* Hotels */}
                    {hotels.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            {hotels.map((hotel, index) => (
                                <QuickInfo
                                    key={index}
                                    label={`${hotel.city} Hotel`}
                                    value={hotel.name || 'Not specified'}
                                    icon={<Building2 size={14} />}
                                />
                            ))}
                        </div>
                    )}

                    {/* Flight Details (Conditional) */}
                    {packageData.flight && (
                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                            <div className="flex items-center gap-2 mb-3">
                                <Plane size={16} className="text-blue-600" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Flight Details</span>
                            </div>

                            <div className="space-y-4">
                                {/* Outbound */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Outbound</p>
                                        <p className="text-xs font-black text-slate-900">{flight?.airline || 'N/A'}</p>
                                        {flight?.departure_time || flight?.arrival_time ? (
                                            <p className="text-[10px] text-slate-500 mt-1">{flight?.departure_time ? `Dep: ${flight.departure_time}` : ''}{flight?.arrival_time ? (flight.departure_time ? `  •  Arr: ${flight.arrival_time}` : `Arr: ${flight.arrival_time}`) : ''}</p>
                                        ) : null}
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Route</p>
                                        <p className="text-xs font-black text-slate-900">
                                            {flight?.departure_city || 'N/A'} <span className="text-slate-400">→</span> {flight?.arrival_city || 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                {/* Return (if available) */}
                                {(rawFlight?.return_flight || packageData.flight.return_flight) && (
                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                                        <div>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Return</p>
                                            <p className="text-xs font-black text-slate-900">{flight?.return_flight?.airline || flight?.airline || 'N/A'}</p>
                                            {flight?.return_flight?.departure_time || flight?.return_flight?.arrival_time ? (
                                                <p className="text-[10px] text-slate-500 mt-1">{flight.return_flight?.departure_time ? `Dep: ${flight.return_flight.departure_time}` : ''}{flight.return_flight?.arrival_time ? (flight.return_flight.departure_time ? `  •  Arr: ${flight.return_flight.arrival_time}` : `Arr: ${flight.return_flight.arrival_time}`) : ''}</p>
                                            ) : null}
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Route</p>
                                            <p className="text-xs font-black text-slate-900">
                                                {flight?.return_flight?.departure_city || 'N/A'} <span className="text-slate-400">→</span> {flight?.return_flight?.arrival_city || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Transport (already shown in header badges) */}
                </div>

                {/* Right Column: Pricing (5 cols) */}
                <div className="lg:col-span-5">
                    <div className="bg-slate-900 rounded-[32px] p-6 text-white h-full">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-white/10 rounded-xl">
                                <DollarSign size={18} className="text-emerald-400" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Package Pricing</span>
                        </div>

                        <div className="space-y-4">
                            {prices.sharing && (
                                <PriceRow label="Sharing" price={prices.sharing.selling} />
                            )}
                            {prices.quint && (
                                <PriceRow label="Quint" price={prices.quint.selling} />
                            )}
                            {prices.quad && (
                                <PriceRow label="Quad" price={prices.quad.selling} />
                            )}
                            {prices.triple && (
                                <PriceRow label="Triple" price={prices.triple.selling} />
                            )}
                            {prices.double && (
                                <PriceRow label="Double" price={prices.double.selling} />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Book Button */}
            <button
                onClick={() => onBook && onBook(packageData)}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
            >
                <ShoppingCart size={16} />
                Book This Package
            </button>
        </div>
    );
};

const QuickInfo = ({ label, value, icon }) => (
    <div className="min-w-0 bg-slate-50 rounded-2xl p-4 border border-slate-100">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <div className="flex items-center gap-2 min-w-0">
            <span className="text-blue-600 shrink-0">{icon}</span>
            <span className="text-[11px] font-black text-slate-900 truncate uppercase tracking-tighter" title={value}>{value}</span>
        </div>
    </div>
);

const PriceRow = ({ label, price }) => (
    <div className="flex items-center justify-between border-b border-white/10 pb-3 last:border-0 last:pb-0">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
        <div className="text-right">
            <span className="text-[10px] text-emerald-400 font-bold mr-1">PKR</span>
            <span className="text-lg font-black tracking-tight">{price ? price.toLocaleString() : 'N/A'}</span>
        </div>
    </div>
);

export default UmrahBookingCreationView;
