import React, { useState, useEffect } from 'react';
import {
    Plane, CircleDollarSign, ArrowLeft, Save, ChevronDown
} from 'lucide-react';

const AddTicketView = ({ onBack, editingTicket }) => {
    const [formData, setFormData] = useState({
        meal: 'Yes',
        type: 'Refundable',
        pnr: '',
        umrahSeat: 'Yes',
        totalSeats: '',
        availableSeats: '',
        weight: '',
        piece: '',
        allowReselling: false,
        // Generic Pricing (for inventory)
        buyingPrice: '',
        sellingPrice: '',
        agentPrice: '',
        // Detailed Pricing (per category)
        adultSelling: '',
        adultPurchasing: '',
        childSelling: '',
        childPurchasing: '',
        infantSelling: '',
        infantPurchasing: ''
    });

    // Trip type at the top level (One-way or Round-trip)
    const [tripType, setTripType] = useState('One-way');

    // Airlines data from API
    const [airlines, setAirlines] = useState([]);
    const [selectedAirlineData, setSelectedAirlineData] = useState({
        departure: null,
        stop: null,
        return: null,
        returnStop: null
    });

    // Cities data from API
    const [cities, setCities] = useState([]);

    // Single trip data
    const [trip, setTrip] = useState({
        // Outbound flight
        flightType: 'Non-Stop',
        airline: '',
        flightNumber: '',
        departureDateTime: '',
        arrivalDateTime: '',
        departureCity: '',
        arrivalCity: '',
        // Stopover for departure (only used when flightType has stops)
        stopAirline: '',
        stopFlightNumber: '',
        stopDepartureDateTime: '',
        stopArrivalDateTime: '',
        stopOverCity: '',
        stopArrivalCity: '',
        stopWaitTime: '',
        // Return flight (only used when tripType is Round-trip)
        returnFlightType: 'Non-Stop',
        returnAirline: '',
        returnFlightNumber: '',
        returnDepartureDateTime: '',
        returnArrivalDateTime: '',
        returnDepartureCity: '',
        returnArrivalCity: '',
        // Return stopover (only used when returnFlightType has stops)
        returnStopAirline: '',
        returnStopFlightNumber: '',
        returnStopDepartureDateTime: '',
        returnStopArrivalDateTime: '',
        returnStopDepartureCity: '',
        returnStopArrivalCity: '',
        returnStopWaitTime: ''
    });

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const updateTrip = (field, value) => {
        setTrip(prev => ({ ...prev, [field]: value }));
    };

    // Fetch airlines on mount
    useEffect(() => {
        fetchAirlines();
        fetchCities();
    }, []);

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

    const fetchCities = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('http://localhost:8000/api/others/city-iata?is_active=true', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setCities(data);
            }
        } catch (error) {
            console.error('Error fetching cities:', error);
        }
    };

    // Handle airline selection with logo data
    const handleAirlineSelect = (field, airlineName, type) => {
        updateTrip(field, airlineName);
        const airlineData = airlines.find(a => a.airline_name === airlineName);
        setSelectedAirlineData(prev => ({ ...prev, [type]: airlineData }));
    };

    // Auto-calculate wait time for departure stopover
    React.useEffect(() => {
        if (trip.arrivalDateTime && trip.stopDepartureDateTime) {
            const arrival = new Date(trip.arrivalDateTime);
            const stopDeparture = new Date(trip.stopDepartureDateTime);
            const diffMs = stopDeparture - arrival;

            if (diffMs >= 0) {
                const hours = Math.floor(diffMs / (1000 * 60 * 60));
                const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                setTrip(prev => ({ ...prev, stopWaitTime: `${hours}h ${minutes}m` }));
            } else {
                setTrip(prev => ({ ...prev, stopWaitTime: 'Invalid' }));
            }
        }
    }, [trip.arrivalDateTime, trip.stopDepartureDateTime]);

    // Auto-calculate wait time for return stopover
    React.useEffect(() => {
        if (trip.returnArrivalDateTime && trip.returnStopDepartureDateTime) {
            const arrival = new Date(trip.returnArrivalDateTime);
            const stopDeparture = new Date(trip.returnStopDepartureDateTime);
            const diffMs = stopDeparture - arrival;

            if (diffMs >= 0) {
                const hours = Math.floor(diffMs / (1000 * 60 * 60));
                const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                setTrip(prev => ({ ...prev, returnStopWaitTime: `${hours}h ${minutes}m` }));
            } else {
                setTrip(prev => ({ ...prev, returnStopWaitTime: 'Invalid' }));
            }
        }
    }, [trip.returnArrivalDateTime, trip.returnStopDepartureDateTime]);

    // Pre-fill form when editing a ticket
    useEffect(() => {
        if (editingTicket) {
            const { departure_trip, return_trip, trip_type } = editingTicket;

            // Set trip type
            setTripType(trip_type || 'One-way');

            // Set form data
            setFormData({
                meal: 'Yes',
                type: 'Refundable',
                pnr: '',
                umrahSeat: 'Yes',
                totalSeats: editingTicket.total_seats?.toString() || '',
                availableSeats: editingTicket.available_seats?.toString() || '',
                weight: '',
                piece: '',
                allowReselling: editingTicket.allow_reselling || false,
                buyingPrice: '',
                sellingPrice: '',
                agentPrice: '',
                adultSelling: editingTicket.adult_selling?.toString() || '',
                adultPurchasing: editingTicket.adult_purchasing?.toString() || '',
                childSelling: editingTicket.child_selling?.toString() || '',
                childPurchasing: editingTicket.child_purchasing?.toString() || '',
                infantSelling: editingTicket.infant_selling?.toString() || '',
                infantPurchasing: editingTicket.infant_purchasing?.toString() || ''
            });

            // Set departure trip data
            if (departure_trip) {
                const depDateTime = departure_trip.departure_datetime ? new Date(departure_trip.departure_datetime).toISOString().slice(0, 16) : '';
                const arrDateTime = departure_trip.arrival_datetime ? new Date(departure_trip.arrival_datetime).toISOString().slice(0, 16) : '';

                setTrip(prev => ({
                    ...prev,
                    flightType: departure_trip.flight_type || 'Non-Stop',
                    airline: departure_trip.airline || '',
                    flightNumber: departure_trip.flight_number || '',
                    departureDateTime: depDateTime,
                    arrivalDateTime: arrDateTime,
                    departureCity: departure_trip.departure_city || '',
                    arrivalCity: departure_trip.arrival_city || '',
                }));

                // Set stopover data if exists
                if (departure_trip.stopover) {
                    const stopDepDateTime = departure_trip.stopover.departure_datetime ? new Date(departure_trip.stopover.departure_datetime).toISOString().slice(0, 16) : '';
                    const stopArrDateTime = departure_trip.stopover.arrival_datetime ? new Date(departure_trip.stopover.arrival_datetime).toISOString().slice(0, 16) : '';

                    setTrip(prev => ({
                        ...prev,
                        stopAirline: departure_trip.stopover.airline || '',
                        stopFlightNumber: departure_trip.stopover.flight_number || '',
                        stopDepartureDateTime: stopDepDateTime,
                        stopArrivalDateTime: stopArrDateTime,
                        stopOverCity: departure_trip.stopover.stopover_city || '',
                        stopArrivalCity: departure_trip.stopover.arrival_city || '',
                        stopWaitTime: departure_trip.stopover.wait_time || ''
                    }));
                }
            }

            // Set return trip data if exists
            if (return_trip) {
                const retDepDateTime = return_trip.departure_datetime ? new Date(return_trip.departure_datetime).toISOString().slice(0, 16) : '';
                const retArrDateTime = return_trip.arrival_datetime ? new Date(return_trip.arrival_datetime).toISOString().slice(0, 16) : '';

                setTrip(prev => ({
                    ...prev,
                    returnFlightType: return_trip.flight_type || 'Non-Stop',
                    returnAirline: return_trip.airline || '',
                    returnFlightNumber: return_trip.flight_number || '',
                    returnDepartureDateTime: retDepDateTime,
                    returnArrivalDateTime: retArrDateTime,
                    returnDepartureCity: return_trip.departure_city || '',
                    returnArrivalCity: return_trip.arrival_city || '',
                }));

                // Set return stopover data if exists
                if (return_trip.stopover) {
                    const retStopDepDateTime = return_trip.stopover.departure_datetime ? new Date(return_trip.stopover.departure_datetime).toISOString().slice(0, 16) : '';
                    const retStopArrDateTime = return_trip.stopover.arrival_datetime ? new Date(return_trip.stopover.arrival_datetime).toISOString().slice(0, 16) : '';

                    setTrip(prev => ({
                        ...prev,
                        returnStopAirline: return_trip.stopover.airline || '',
                        returnStopFlightNumber: return_trip.stopover.flight_number || '',
                        returnStopDepartureDateTime: retStopDepDateTime,
                        returnStopArrivalDateTime: retStopArrDateTime,
                        returnStopDepartureCity: return_trip.stopover.stopover_city || '',
                        returnStopArrivalCity: return_trip.stopover.arrival_city || '',
                        returnStopWaitTime: return_trip.stopover.wait_time || ''
                    }));
                }
            }
        }
    }, [editingTicket]);

    const handleSave = async () => {
        try {
            // Prepare departure trip data
            const departureTrip = {
                flight_type: trip.flightType,
                airline: trip.airline,
                flight_number: trip.flightNumber,
                departure_datetime: trip.departureDateTime,
                arrival_datetime: trip.arrivalDateTime,
                departure_city: trip.departureCity,
                arrival_city: trip.arrivalCity
            };

            // Add stopover if flight has stops
            if (trip.flightType !== 'Non-Stop') {
                departureTrip.stopover = {
                    airline: trip.stopAirline,
                    flight_number: trip.stopFlightNumber,
                    departure_datetime: trip.stopDepartureDateTime,
                    arrival_datetime: trip.stopArrivalDateTime,
                    stopover_city: trip.stopOverCity,
                    arrival_city: trip.stopArrivalCity,
                    wait_time: trip.stopWaitTime
                };
            }

            // Prepare return trip data if round-trip
            let returnTrip = null;
            if (tripType === 'Round-trip') {
                returnTrip = {
                    flight_type: trip.returnFlightType,
                    airline: trip.returnAirline,
                    flight_number: trip.returnFlightNumber,
                    departure_datetime: trip.returnDepartureDateTime,
                    arrival_datetime: trip.returnArrivalDateTime,
                    departure_city: trip.returnDepartureCity,
                    arrival_city: trip.returnArrivalCity
                };

                // Add return stopover if return flight has stops
                if (trip.returnFlightType !== 'Non-Stop') {
                    returnTrip.stopover = {
                        airline: trip.returnStopAirline,
                        flight_number: trip.returnStopFlightNumber,
                        departure_datetime: trip.returnStopDepartureDateTime,
                        arrival_datetime: trip.returnStopArrivalDateTime,
                        stopover_city: trip.returnStopDepartureCity,
                        arrival_city: trip.returnStopArrivalCity,
                        wait_time: trip.returnStopWaitTime
                    };
                }
            }

            // Prepare full payload
            const payload = {
                trip_type: tripType,
                departure_trip: departureTrip,
                return_trip: returnTrip,
                adult_selling: parseFloat(formData.adultSelling) || 0,
                adult_purchasing: parseFloat(formData.adultPurchasing) || 0,
                child_selling: parseFloat(formData.childSelling) || 0,
                child_purchasing: parseFloat(formData.childPurchasing) || 0,
                infant_selling: parseFloat(formData.infantSelling) || 0,
                infant_purchasing: parseFloat(formData.infantPurchasing) || 0,
                total_seats: parseInt(formData.totalSeats) || 0,
                available_seats: parseInt(formData.totalSeats) || 0, // Auto-set to total seats
                allow_reselling: formData.allowReselling,
                is_active: true
            };

            console.log('📦 Sending Payload:', JSON.stringify(payload, null, 2));

            // Get token from localStorage
            const token = localStorage.getItem('access_token');
            console.log('🔑 Token being sent:', token ? token.substring(0, 20) + '...' : 'No token found');

            if (!token) {
                throw new Error('No authentication token found. Please log in again.');
            }

            // Determine if we're editing or creating
            const isEditing = editingTicket && editingTicket._id;
            const url = isEditing
                ? `http://localhost:8000/api/flights/${editingTicket._id}`
                : 'http://localhost:8000/api/flights/';
            const method = isEditing ? 'PUT' : 'POST';

            console.log(`📡 ${method} request to:`, url);

            // Make API call
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('❌ Validation Errors:', errorData);
                // specific formatted error for Pydantic validation errors
                if (errorData.detail && Array.isArray(errorData.detail)) {
                    const errorMessages = errorData.detail.map(err => `${err.loc.join('.')} - ${err.msg}`).join('\n');
                    throw new Error(`Validation failed:\n${errorMessages}`);
                }
                throw new Error(errorData.detail || 'Failed to save ticket');
            }

            const data = await response.json();
            console.log('✅ Ticket saved successfully:', data);

            // Show success message (you can add a toast notification here)
            alert(isEditing ? 'Ticket updated successfully!' : 'Ticket inventory created successfully!');

            // Navigate back
            onBack();

        } catch (error) {
            console.error('❌ Error saving ticket:', error);
            alert('Error saving ticket: ' + error.message);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 text-left pb-20 -mt-4 lg:-mt-8 -mx-4 lg:-mx-8">
            {/* Header */}
            <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200 z-50 px-8 py-4">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <button
                            onClick={onBack}
                            className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 transition-all border border-slate-100"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[3px] mb-1">
                                <span>Ticket Management</span>
                            </div>
                            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                                {editingTicket ? 'Edit Ticket' : 'Add New Ticket'}
                            </h1>
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        className="px-8 py-3.5 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                    >
                        <Save size={16} /> {editingTicket ? 'Update Ticket' : 'Save Ticket'}
                    </button>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-8 mt-8 space-y-8">

                {/* Ticket Details Section */}
                <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-8 lg:p-12 space-y-8">
                    <div className="flex items-center space-x-3 pb-6 border-b border-slate-100">
                        <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                            <CircleDollarSign size={24} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">Ticket Details</h3>
                    </div>


                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <FormField label="Meal">
                            <Select value={formData.meal} onChange={(e) => handleInputChange('meal', e.target.value)}>
                                <option>Yes</option>
                                <option>No</option>
                            </Select>
                        </FormField>
                        <FormField label="Type">
                            <Select value={formData.type} onChange={(e) => handleInputChange('type', e.target.value)}>
                                <option>Refundable</option>
                                <option>Non-Refundable</option>
                            </Select>
                        </FormField>
                        <FormField label="PNR">
                            <Input placeholder="PND32323" value={formData.pnr} onChange={(e) => handleInputChange('pnr', e.target.value)} />
                        </FormField>
                        <FormField label="Umrah Seat">
                            <Select value={formData.umrahSeat} onChange={(e) => handleInputChange('umrahSeat', e.target.value)}>
                                <option>Yes</option>
                                <option>No</option>
                            </Select>
                        </FormField>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField label="Total Seats">
                            <Input placeholder="30" type="number" value={formData.totalSeats} onChange={(e) => handleInputChange('totalSeats', e.target.value)} />
                        </FormField>
                        <FormField label="Weight">
                            <Input placeholder="30 KG" value={formData.weight} onChange={(e) => handleInputChange('weight', e.target.value)} />
                        </FormField>
                        <FormField label="Piece">
                            <Input placeholder="0" type="number" value={formData.piece} onChange={(e) => handleInputChange('piece', e.target.value)} />
                        </FormField>
                    </div>

                    {/* Allow Reselling Checkbox */}
                    <div className="pt-4">
                        <label className="flex items-center space-x-3 cursor-pointer group">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={formData.allowReselling}
                                    onChange={(e) => handleInputChange('allowReselling', e.target.checked)}
                                    className="w-5 h-5 rounded border-2 border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer transition-all"
                                />
                            </div>
                            <div>
                                <span className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                                    Allow Reselling
                                </span>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Enable this ticket to be resold by agents
                                </p>
                            </div>
                        </label>
                    </div>

                    {/* Pricing Grid */}
                    <div className="space-y-6 pt-6 border-t border-slate-100">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[3px]">Pricing Configuration</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <PriceCard label="Adult Prices">
                                <Input placeholder="Selling - Rs 120,000" value={formData.adultSelling} onChange={(e) => handleInputChange('adultSelling', e.target.value)} />
                                <Input placeholder="Purchasing - Rs 100,000" value={formData.adultPurchasing} onChange={(e) => handleInputChange('adultPurchasing', e.target.value)} />
                            </PriceCard>
                            <PriceCard label="Child Prices">
                                <Input placeholder="Selling - Rs 100,000" value={formData.childSelling} onChange={(e) => handleInputChange('childSelling', e.target.value)} />
                                <Input placeholder="Purchasing - Rs 80,000" value={formData.childPurchasing} onChange={(e) => handleInputChange('childPurchasing', e.target.value)} />
                            </PriceCard>
                            <PriceCard label="Infant Prices">
                                <Input placeholder="Selling - Rs 80,000" value={formData.infantSelling} onChange={(e) => handleInputChange('infantSelling', e.target.value)} />
                                <Input placeholder="Purchasing - Rs 60,000" value={formData.infantPurchasing} onChange={(e) => handleInputChange('infantPurchasing', e.target.value)} />
                            </PriceCard>
                        </div>
                    </div>
                </div>

                {/* Trip Details Section */}
                <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-8 lg:p-10 border-b border-slate-50 bg-slate-50/30">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                            <Plane className="text-blue-600" size={24} /> Trip (Details)
                        </h3>
                    </div>
                    <div className="p-8 lg:p-12 space-y-10">
                        {/* Global Trip Type Selector */}
                        <div className="max-w-xs">
                            <FormField label="Trip Type">
                                <Select value={tripType} onChange={(e) => setTripType(e.target.value)}>
                                    <option>One-way</option>
                                    <option>Round-trip</option>
                                </Select>
                            </FormField>
                        </div>

                        <div className="p-6 lg:p-8 rounded-[32px] border-2 border-slate-50 bg-slate-50/20">
                            <div className="space-y-8">
                                {/* Outbound Flight Fields */}
                                <div className="space-y-6">
                                    {/* Flight Type Row */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField label="Flight Type (Departure)">
                                            <Select value={trip.flightType} onChange={(e) => updateTrip('flightType', e.target.value)}>
                                                <option>Non-Stop</option>
                                                <option>1-Stop</option>
                                                <option>2+ Stops</option>
                                            </Select>
                                        </FormField>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <FormField label="Select Airline">
                                            <Select value={trip.airline} onChange={(e) => handleAirlineSelect('airline', e.target.value, 'departure')}>
                                                <option value="">Select an airline</option>
                                                {airlines.map(airline => (
                                                    <option key={airline.id || airline._id} value={airline.airline_name}>
                                                        {airline.airline_name} ({airline.iata_code})
                                                    </option>
                                                ))}
                                            </Select>
                                        </FormField>
                                        <FormField label="Flight Number">
                                            <Input placeholder="e.g. 202" value={trip.flightNumber} onChange={(e) => updateTrip('flightNumber', e.target.value)} />
                                        </FormField>
                                        <FormField label="Departure Date & Time">
                                            <Input type="datetime-local" value={trip.departureDateTime} onChange={(e) => updateTrip('departureDateTime', e.target.value)} />
                                        </FormField>
                                        <FormField label="Arrival Date & Time">
                                            <Input type="datetime-local" value={trip.arrivalDateTime} onChange={(e) => updateTrip('arrivalDateTime', e.target.value)} />
                                        </FormField>
                                    </div>

                                    {/* Display selected airline logo */}
                                    {selectedAirlineData.departure && (
                                        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-slate-50 rounded-2xl border border-blue-100">
                                            <img
                                                src={`http://localhost:8000${selectedAirlineData.departure.logo_url}`}
                                                alt={selectedAirlineData.departure.airline_name}
                                                className="h-14 w-14 object-contain bg-white rounded-xl p-2 shadow-sm"
                                                onError={(e) => e.target.style.display = 'none'}
                                            />
                                            <div>
                                                <p className="text-sm font-black text-slate-800">{selectedAirlineData.departure.airline_name}</p>
                                                <p className="text-xs text-slate-500 font-bold">{selectedAirlineData.departure.iata_code}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField label="Departure City">
                                            <Select value={trip.departureCity} onChange={(e) => updateTrip('departureCity', e.target.value)}>
                                                <option value="">Select a city</option>
                                                {cities.map(city => (
                                                    <option key={city.id || city._id} value={city.city_name}>
                                                        {city.city_name} ({city.iata_code})
                                                    </option>
                                                ))}
                                            </Select>
                                        </FormField>
                                        <FormField label="Arrival City">
                                            <Select value={trip.arrivalCity} onChange={(e) => updateTrip('arrivalCity', e.target.value)}>
                                                <option value="">Select a city</option>
                                                {cities.map(city => (
                                                    <option key={city.id || city._id} value={city.city_name}>
                                                        {city.city_name} ({city.iata_code})
                                                    </option>
                                                ))}
                                            </Select>
                                        </FormField>
                                    </div>

                                    {/* Departure Stopover Section - Only show when flight has stops */}
                                    {trip.flightType !== 'Non-Stop' && (
                                        <div className="space-y-6 pt-6 border-t-2 border-slate-100">
                                            <p className="text-[11px] font-black text-slate-600 uppercase tracking-[3px]">Departure Stop</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                                <FormField label="Select Airline (Stop)">
                                                    <Select value={trip.stopAirline} onChange={(e) => handleAirlineSelect('stopAirline', e.target.value, 'stop')}>
                                                        <option value="">Select an airline</option>
                                                        {airlines.map(airline => (
                                                            <option key={airline.id || airline._id} value={airline.airline_name}>
                                                                {airline.airline_name} ({airline.iata_code})
                                                            </option>
                                                        ))}
                                                    </Select>
                                                </FormField>
                                                <FormField label="Flight Number (Stop)">
                                                    <Input placeholder="e.g. 205" value={trip.stopFlightNumber} onChange={(e) => updateTrip('stopFlightNumber', e.target.value)} />
                                                </FormField>
                                                <FormField label="Departure Date & Time (Stop)">
                                                    <Input type="datetime-local" value={trip.stopDepartureDateTime} onChange={(e) => updateTrip('stopDepartureDateTime', e.target.value)} />
                                                </FormField>
                                                <FormField label="Arrival Date & Time (Stop)">
                                                    <Input type="datetime-local" value={trip.stopArrivalDateTime} onChange={(e) => updateTrip('stopArrivalDateTime', e.target.value)} />
                                                </FormField>
                                            </div>

                                            {/* Display selected stop airline logo */}
                                            {selectedAirlineData.stop && (
                                                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-50 to-slate-50 rounded-2xl border border-amber-100">
                                                    <img
                                                        src={`http://localhost:8000${selectedAirlineData.stop.logo_url}`}
                                                        alt={selectedAirlineData.stop.airline_name}
                                                        className="h-14 w-14 object-contain bg-white rounded-xl p-2 shadow-sm"
                                                        onError={(e) => e.target.style.display = 'none'}
                                                    />
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800">{selectedAirlineData.stop.airline_name}</p>
                                                        <p className="text-xs text-slate-500 font-bold">{selectedAirlineData.stop.iata_code}</p>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <FormField label="Stop over City (Stop)">
                                                    <Select value={trip.stopOverCity} onChange={(e) => updateTrip('stopOverCity', e.target.value)}>
                                                        <option value="">Select a city</option>
                                                        {cities.map(city => (
                                                            <option key={city.id || city._id} value={city.city_name}>
                                                                {city.city_name} ({city.iata_code})
                                                            </option>
                                                        ))}
                                                    </Select>
                                                </FormField>
                                                <FormField label="Arrival City (Stop)">
                                                    <Select value={trip.stopArrivalCity} onChange={(e) => updateTrip('stopArrivalCity', e.target.value)}>
                                                        <option value="">Select a city</option>
                                                        {cities.map(city => (
                                                            <option key={city.id || city._id} value={city.city_name}>
                                                                {city.city_name} ({city.iata_code})
                                                            </option>
                                                        ))}
                                                    </Select>
                                                </FormField>
                                                <FormField label="Wait Time">
                                                    <Input
                                                        placeholder="Auto-calculated"
                                                        value={trip.stopWaitTime}
                                                        disabled
                                                        className="bg-slate-50 cursor-not-allowed"
                                                    />
                                                </FormField>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Return Flight Fields - Only show when Round-trip is selected */}
                                {tripType === 'Round-trip' && (
                                    <div className="space-y-6 pt-6 border-t-2 border-slate-100">
                                        <p className="text-[11px] font-black text-slate-600 uppercase tracking-[3px]">Return Flight</p>

                                        {/* Flight Type Row */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <FormField label="Flight Type (Return)">
                                                <Select value={trip.returnFlightType} onChange={(e) => updateTrip('returnFlightType', e.target.value)}>
                                                    <option>Non-Stop</option>
                                                    <option>1-Stop</option>
                                                    <option>2+ Stops</option>
                                                </Select>
                                            </FormField>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                            <FormField label="Select Airline (Return)">
                                                <Select value={trip.returnAirline} onChange={(e) => handleAirlineSelect('returnAirline', e.target.value, 'return')}>
                                                    <option value="">Select an airline</option>
                                                    {airlines.map(airline => (
                                                        <option key={airline.id || airline._id} value={airline.airline_name}>
                                                            {airline.airline_name} ({airline.iata_code})
                                                        </option>
                                                    ))}
                                                </Select>
                                            </FormField>
                                            <FormField label="Return Flight Number">
                                                <Input placeholder="e.g. 203" value={trip.returnFlightNumber} onChange={(e) => updateTrip('returnFlightNumber', e.target.value)} />
                                            </FormField>
                                            <FormField label="Return Departure Date & Time">
                                                <Input type="datetime-local" value={trip.returnDepartureDateTime} onChange={(e) => updateTrip('returnDepartureDateTime', e.target.value)} />
                                            </FormField>
                                            <FormField label="Return Arrival Date & Time">
                                                <Input type="datetime-local" value={trip.returnArrivalDateTime} onChange={(e) => updateTrip('returnArrivalDateTime', e.target.value)} />
                                            </FormField>
                                        </div>

                                        {/* Display selected return airline logo */}
                                        {selectedAirlineData.return && (
                                            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-slate-50 rounded-2xl border border-green-100">
                                                <img
                                                    src={`http://localhost:8000${selectedAirlineData.return.logo_url}`}
                                                    alt={selectedAirlineData.return.airline_name}
                                                    className="h-14 w-14 object-contain bg-white rounded-xl p-2 shadow-sm"
                                                    onError={(e) => e.target.style.display = 'none'}
                                                />
                                                <div>
                                                    <p className="text-sm font-black text-slate-800">{selectedAirlineData.return.airline_name}</p>
                                                    <p className="text-xs text-slate-500 font-bold">{selectedAirlineData.return.iata_code}</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <FormField label="Return Departure City">
                                                <Select value={trip.returnDepartureCity} onChange={(e) => updateTrip('returnDepartureCity', e.target.value)}>
                                                    <option value="">Select a city</option>
                                                    {cities.map(city => (
                                                        <option key={city.id || city._id} value={city.city_name}>
                                                            {city.city_name} ({city.iata_code})
                                                        </option>
                                                    ))}
                                                </Select>
                                            </FormField>
                                            <FormField label="Return Arrival City">
                                                <Select value={trip.returnArrivalCity} onChange={(e) => updateTrip('returnArrivalCity', e.target.value)}>
                                                    <option value="">Select a city</option>
                                                    {cities.map(city => (
                                                        <option key={city.id || city._id} value={city.city_name}>
                                                            {city.city_name} ({city.iata_code})
                                                        </option>
                                                    ))}
                                                </Select>
                                            </FormField>
                                        </div>

                                        {/* Return Stopover Section - Only show when return flight has stops */}
                                        {trip.returnFlightType !== 'Non-Stop' && (
                                            <div className="space-y-6 pt-6 border-t-2 border-slate-100">
                                                <p className="text-[11px] font-black text-slate-600 uppercase tracking-[3px]">Return Stop</p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                                    <FormField label="Select Airline (Return Stop)">
                                                        <Select value={trip.returnStopAirline} onChange={(e) => handleAirlineSelect('returnStopAirline', e.target.value, 'returnStop')}>
                                                            <option value="">Select an airline</option>
                                                            {airlines.map(airline => (
                                                                <option key={airline.id || airline._id} value={airline.airline_name}>
                                                                    {airline.airline_name} ({airline.iata_code})
                                                                </option>
                                                            ))}
                                                        </Select>
                                                    </FormField>
                                                    <FormField label="Flight Number (Return Stop)">
                                                        <Input placeholder="e.g. 206" value={trip.returnStopFlightNumber} onChange={(e) => updateTrip('returnStopFlightNumber', e.target.value)} />
                                                    </FormField>
                                                    <FormField label="Departure Date & Time (Return Stop)">
                                                        <Input type="datetime-local" value={trip.returnStopDepartureDateTime} onChange={(e) => updateTrip('returnStopDepartureDateTime', e.target.value)} />
                                                    </FormField>
                                                    <FormField label="Arrival Date & Time (Return Stop)">
                                                        <Input type="datetime-local" value={trip.returnStopArrivalDateTime} onChange={(e) => updateTrip('returnStopArrivalDateTime', e.target.value)} />
                                                    </FormField>
                                                </div>

                                                {/* Display selected return stop airline logo */}
                                                {selectedAirlineData.returnStop && (
                                                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-slate-50 rounded-2xl border border-purple-100">
                                                        <img
                                                            src={`http://localhost:8000${selectedAirlineData.returnStop.logo_url}`}
                                                            alt={selectedAirlineData.returnStop.airline_name}
                                                            className="h-14 w-14 object-contain bg-white rounded-xl p-2 shadow-sm"
                                                            onError={(e) => e.target.style.display = 'none'}
                                                        />
                                                        <div>
                                                            <p className="text-sm font-black text-slate-800">{selectedAirlineData.returnStop.airline_name}</p>
                                                            <p className="text-xs text-slate-500 font-bold">{selectedAirlineData.returnStop.iata_code}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    <FormField label="Departure City (Return Stop)">
                                                        <Select value={trip.returnStopDepartureCity} onChange={(e) => updateTrip('returnStopDepartureCity', e.target.value)}>
                                                            <option value="">Select a city</option>
                                                            {cities.map(city => (
                                                                <option key={city.id || city._id} value={city.city_name}>
                                                                    {city.city_name} ({city.iata_code})
                                                                </option>
                                                            ))}
                                                        </Select>
                                                    </FormField>
                                                    <FormField label="Arrival City (Return Stop)">
                                                        <Select value={trip.returnStopArrivalCity} onChange={(e) => updateTrip('returnStopArrivalCity', e.target.value)}>
                                                            <option value="">Select a city</option>
                                                            {cities.map(city => (
                                                                <option key={city.id || city._id} value={city.city_name}>
                                                                    {city.city_name} ({city.iata_code})
                                                                </option>
                                                            ))}
                                                        </Select>
                                                    </FormField>
                                                    <FormField label="Wait Time">
                                                        <Input
                                                            placeholder="Auto-calculated"
                                                            value={trip.returnStopWaitTime}
                                                            disabled
                                                            className="bg-slate-50 cursor-not-allowed"
                                                        />
                                                    </FormField>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Sub Components ---

const FormField = ({ label, children }) => (
    <div className="space-y-2">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            {label}
        </label>
        {children}
    </div>
);

const Input = ({ placeholder, type = "text", ...props }) => (
    <input
        type={type}
        placeholder={placeholder}
        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 ring-blue-50 focus:border-blue-600 focus:bg-white transition-all font-bold text-sm text-slate-700"
        {...props}
    />
);

const Select = ({ children, ...props }) => (
    <div className="relative">
        <select
            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 ring-blue-50 focus:border-blue-600 focus:bg-white transition-all font-bold text-sm text-slate-700 appearance-none cursor-pointer"
            {...props}
        >
            {children}
        </select>
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
    </div>
);

const PriceCard = ({ label, children }) => (
    <div className="space-y-4 p-6 bg-slate-50/50 rounded-[32px] border border-slate-100">
        <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{label}</span>
        <div className="space-y-3">
            {children}
        </div>
    </div>
);

export default AddTicketView;
