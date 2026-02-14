import React, { useState, useEffect } from 'react';
import {
    Package, MapPin, Building2, Hotel, ShieldCheck,
    Truck, Utensils, Info, ArrowLeft, Save, Plus, Trash2,
    Users, ChevronRight, LayoutGrid, Calculator,
    CheckCircle2, AlertCircle, TrendingUp, DollarSign,
    Plane, Calendar, ChevronLeft, BedDouble, MapPinned
} from 'lucide-react';
import InputGroup from '../ui/InputGroup';

const AddPackageView = ({ onBack, initialData }) => {
    const [step, setStep] = useState(1);
    const [isEditing, setIsEditing] = useState(false);

    // Database Data State
    const [flights, setFlights] = useState([]);
    const [foodOptions, setFoodOptions] = useState([]);
    const [transportOptions, setTransportOptions] = useState([]);
    const [ziyaratOptions, setZiyaratOptions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Selected Items State
    const [selectedFlight, setSelectedFlight] = useState(null);
    const [selectedReturnFlight, setSelectedReturnFlight] = useState(null);
    const [selectedFood, setSelectedFood] = useState(null);
    const [selectedTransport, setSelectedTransport] = useState(null);
    const [selectedZiyarat, setSelectedZiyarat] = useState(null);

    // Package Basic Info
    const [packageTitle, setPackageTitle] = useState('');
    const [paxCapacity, setPaxCapacity] = useState('');
    const [packageDescription, setPackageDescription] = useState('');

    // Modal State
    const [showFlightModal, setShowFlightModal] = useState(false);
    const [flightSelectionType, setFlightSelectionType] = useState('departure'); // 'departure' or 'return'

    // Dynamic Inventory State
    const [hotels, setHotels] = useState([
        { id: Date.now(), city: 'Makkah', name: '', checkIn: '', checkOut: '', nights: 0 }
    ]);

    // Pricing State - BASE PRICE + ROOM PRICE Model
    const [visaPricing, setVisaPricing] = useState({
        adult_purchasing: 0, adult_selling: 0,
        child_purchasing: 0, child_selling: 0,
        infant_purchasing: 0, infant_selling: 0
    });

    const [foodPricing, setFoodPricing] = useState({
        purchasing: 0,
        selling: 0
    });

    const [ziyaratPricing, setZiyaratPricing] = useState({
        purchasing: 0,
        selling: 0
    });

    const [transportPricing, setTransportPricing] = useState({
        purchasing: 0,
        selling: 0
    });

    const [hotelPricing, setHotelPricing] = useState({
        sharing_purchasing: 0, sharing_selling: 0,
        quint_purchasing: 0, quint_selling: 0,
        quad_purchasing: 0, quad_selling: 0,
        triple_purchasing: 0, triple_selling: 0,
        double_purchasing: 0, double_selling: 0
    });

    // Room Type Selection - which room types to include in package
    const [selectedRoomTypes, setSelectedRoomTypes] = useState({
        sharing: false,
        quint: false,
        quad: false,
        triple: false,
        double: false
    });

    // Populate form if editing
    useEffect(() => {
        if (initialData) {
            console.log('Editing Package Data:', initialData);
            setIsEditing(true);
            setPackageTitle(initialData.title || '');
            setPaxCapacity(initialData.pax_capacity || '');
            setPackageDescription(initialData.description || '');

            // Restore Flight
            if (initialData.flight) {
                // Construct flight object compatible with selection logic
                setSelectedFlight({
                    _id: initialData.flight.id,
                    id: initialData.flight.id,
                    airline: initialData.flight.airline,
                    trip_type: initialData.flight.trip_type,
                    departure_trip: {
                        airline: initialData.flight.airline,
                        departure_city: initialData.flight.departure_city,
                        arrival_city: initialData.flight.arrival_city
                    },
                    return_trip: initialData.flight.return_flight ? {
                        airline: initialData.flight.return_flight.airline,
                        departure_city: initialData.flight.return_flight.departure_city,
                        arrival_city: initialData.flight.return_flight.arrival_city
                    } : null,
                    adult_selling: initialData.flight.adult_selling,
                    child_selling: initialData.flight.child_selling,
                    infant_selling: initialData.flight.infant_selling,
                    available_seats: 'N/A' // Not saved in package, strictly speaking
                });
            }

            // Restore Hotels
            if (initialData.hotels && initialData.hotels.length > 0) {
                setHotels(initialData.hotels.map(h => ({
                    id: h.id || Date.now() + Math.random(),
                    city: h.city,
                    name: h.name,
                    checkIn: h.check_in,
                    checkOut: h.check_out,
                    nights: h.nights,
                    hotelId: h.id // preserve ID if needed
                })));

                // Restore pricing and room types (assuming consistent across hotels for UI simplicity)
                if (initialData.hotels[0].hotel_pricing) {
                    setHotelPricing(initialData.hotels[0].hotel_pricing);
                }
                if (initialData.hotels[0].selected_room_types) {
                    setSelectedRoomTypes(initialData.hotels[0].selected_room_types);
                }
            }

            // Restore Services
            if (initialData.food) {
                setSelectedFood({ title: initialData.food.title, id: initialData.food.id, _id: initialData.food.id, purchasing: initialData.food.purchasing, selling: initialData.food.selling });
                setFoodPricing({ purchasing: initialData.food.purchasing, selling: initialData.food.selling });
            }
            if (initialData.transport) {
                setSelectedTransport({ title: initialData.transport.title, sector: initialData.transport.sector, id: initialData.transport.id, _id: initialData.transport.id, purchasing: initialData.transport.purchasing, selling: initialData.transport.selling });
                setTransportPricing({ purchasing: initialData.transport.purchasing, selling: initialData.transport.selling });
            }
            if (initialData.ziyarat) {
                setSelectedZiyarat({ title: initialData.ziyarat.title, id: initialData.ziyarat.id, _id: initialData.ziyarat.id, purchasing: initialData.ziyarat.purchasing, selling: initialData.ziyarat.selling });
                setZiyaratPricing({ purchasing: initialData.ziyarat.purchasing, selling: initialData.ziyarat.selling });
            }

            // Restore Visa Pricing
            if (initialData.visa_pricing) {
                setVisaPricing(initialData.visa_pricing);
            }
        }
    }, [initialData]);

    // Handle date calculation for hotel nights
    const calculateNights = (checkIn, checkOut) => {
        if (!checkIn || !checkOut) return 0;
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        return diff > 0 ? diff : 0;
    };

    const updateHotel = (id, field, value) => {
        setHotels(hotels.map(h => {
            if (h.id === id) {
                const updated = { ...h, [field]: value };
                if (field === 'checkIn' || field === 'checkOut') {
                    updated.nights = calculateNights(updated.checkIn, updated.checkOut);
                }
                return updated;
            }
            return h;
        }));
    };

    const addHotel = () => {
        setHotels([...hotels, { id: Date.now() + 1, city: 'Madinah', name: '', checkIn: '', checkOut: '', nights: 0 }]);
    };

    const removeHotel = (id) => {
        setHotels(hotels.filter(h => h.id !== id));
    };

    // Pricing Calculation Functions - BASE PRICE + ROOM PRICE Model
    const calculateBasePrice = (personType) => {
        let purchasing = 0;
        let selling = 0;

        // Flight (if selected) - per person type
        if (selectedFlight) {
            purchasing += selectedFlight[`${personType}_purchasing`] || 0;
            selling += selectedFlight[`${personType}_selling`] || 0;
        }

        // Visa (always included) - per person type
        purchasing += visaPricing[`${personType}_purchasing`] || 0;
        selling += visaPricing[`${personType}_selling`] || 0;

        // Food (if selected) - total package price
        if (selectedFood) {
            purchasing += foodPricing.purchasing || 0;
            selling += foodPricing.selling || 0;
        }

        // Ziyarat (if selected) - total package price
        if (selectedZiyarat) {
            purchasing += ziyaratPricing.purchasing || 0;
            selling += ziyaratPricing.selling || 0;
        }

        // Transport (if selected) - total package price
        if (selectedTransport) {
            purchasing += transportPricing.purchasing || 0;
            selling += transportPricing.selling || 0;
        }

        return { purchasing, selling };
    };

    // Calculate final package price (BASE + ROOM)
    const calculatePackagePrice = (roomType, personType = 'adult') => {
        const base = calculateBasePrice(personType);

        const roomPurchasing = hotelPricing[`${roomType}_purchasing`] || 0;
        const roomSelling = hotelPricing[`${roomType}_selling`] || 0;

        const totalPurchasing = base.purchasing + roomPurchasing;
        const totalSelling = base.selling + roomSelling;
        const margin = totalSelling - totalPurchasing;
        const marginPercent = totalPurchasing > 0 ? ((margin / totalPurchasing) * 100).toFixed(1) : 0;

        return {
            purchasing: totalPurchasing,
            selling: totalSelling,
            margin,
            marginPercent
        };
    };

    // Save Package Handler
    const handleSavePackage = async () => {
        try {
            const packageData = {
                title: packageTitle,
                pax_capacity: paxCapacity,
                description: packageDescription,

                // Flight data (if selected)
                flight: selectedFlight ? {
                    id: selectedFlight._id || selectedFlight.id,
                    airline: selectedFlight.departure_trip?.airline || '',
                    trip_type: selectedFlight.trip_type,
                    departure_city: selectedFlight.departure_trip?.departure_city || '',
                    arrival_city: selectedFlight.departure_trip?.arrival_city || '',
                    // Return flight details if round trip
                    return_flight: selectedFlight.trip_type === 'Round-trip' ? {
                        airline: selectedFlight.return_trip?.airline || '',
                        departure_city: selectedFlight.return_trip?.departure_city || '',
                        arrival_city: selectedFlight.return_trip?.arrival_city || ''
                    } : null,
                    adult_selling: selectedFlight.adult_selling || 0,
                    child_selling: selectedFlight.child_selling || 0,
                    infant_selling: selectedFlight.infant_selling || 0
                } : null,

                // Hotels with selected room types and pricing
                hotels: hotels.map(hotel => ({
                    id: String(hotel.hotelId || hotel._id || hotel.id),
                    name: hotel.name || hotel.hotelName || '',
                    city: hotel.city,
                    check_in: hotel.checkIn,
                    check_out: hotel.checkOut,
                    nights: hotel.nights,
                    room_types: Object.keys(selectedRoomTypes).filter(type => selectedRoomTypes[type]),
                    hotel_pricing: hotelPricing,
                    selected_room_types: selectedRoomTypes
                })),

                // Food with pricing from Step 3
                food: selectedFood ? {
                    id: selectedFood._id || selectedFood.id,
                    title: selectedFood.title,
                    purchasing: foodPricing.purchasing,
                    selling: foodPricing.selling
                } : null,

                // Ziyarat with pricing from Step 3
                ziyarat: selectedZiyarat ? {
                    id: selectedZiyarat._id || selectedZiyarat.id,
                    title: selectedZiyarat.title,
                    purchasing: ziyaratPricing.purchasing,
                    selling: ziyaratPricing.selling
                } : null,

                // Transport with pricing AND sector from Step 3
                transport: selectedTransport ? {
                    id: selectedTransport._id || selectedTransport.id,
                    title: selectedTransport.title || selectedTransport.name || 'Transport Service',
                    sector: selectedTransport.sector || '',
                    purchasing: transportPricing.purchasing,
                    selling: transportPricing.selling
                } : null,

                // Visa pricing
                visa_pricing: visaPricing,

                // Calculated package prices per room type (for display in cards)
                package_prices: {
                    sharing: selectedRoomTypes.sharing ? {
                        purchasing: calculatePackagePrice('sharing').purchasing,
                        selling: calculatePackagePrice('sharing').selling,
                        margin: calculatePackagePrice('sharing').margin,
                        margin_percent: calculatePackagePrice('sharing').marginPercent
                    } : null,
                    quint: selectedRoomTypes.quint ? {
                        purchasing: calculatePackagePrice('quint').purchasing,
                        selling: calculatePackagePrice('quint').selling,
                        margin: calculatePackagePrice('quint').margin,
                        margin_percent: calculatePackagePrice('quint').marginPercent
                    } : null,
                    quad: selectedRoomTypes.quad ? {
                        purchasing: calculatePackagePrice('quad').purchasing,
                        selling: calculatePackagePrice('quad').selling,
                        margin: calculatePackagePrice('quad').margin,
                        margin_percent: calculatePackagePrice('quad').marginPercent
                    } : null,
                    triple: selectedRoomTypes.triple ? {
                        purchasing: calculatePackagePrice('triple').purchasing,
                        selling: calculatePackagePrice('triple').selling,
                        margin: calculatePackagePrice('triple').margin,
                        margin_percent: calculatePackagePrice('triple').marginPercent
                    } : null,
                    double: selectedRoomTypes.double ? {
                        purchasing: calculatePackagePrice('double').purchasing,
                        selling: calculatePackagePrice('double').selling,
                        margin: calculatePackagePrice('double').margin,
                        margin_percent: calculatePackagePrice('double').marginPercent
                    } : null
                }
            };

            console.log('Saving package:', packageData);

            // Get auth token
            const token = localStorage.getItem('access_token');

            // Send to backend API
            const url = isEditing && initialData
                ? `http://localhost:8000/api/packages/${initialData.id || initialData._id}`
                : 'http://localhost:8000/api/packages/';

            const method = isEditing && initialData ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(packageData)
            });

            if (response.ok) {
                const savedPackage = await response.json();
                console.log('Package saved successfully:', savedPackage);
                alert('Package saved successfully!');
                // Navigate back to packages list
                if (onBack) onBack();
            } else {
                const errorData = await response.json();
                console.error('Failed to save package:', errorData);
                alert('Failed to save package: ' + JSON.stringify(errorData));
            }
        } catch (error) {
            console.error('Error saving package:', error);
            alert('Error saving package: ' + error.message);
        }
    };

    // Fetch all database options on mount
    useEffect(() => {
        fetchFlights();
        fetchFoodOptions();
        fetchTransportOptions();
        fetchZiyaratOptions();
    }, []);

    const fetchFlights = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('http://localhost:8000/api/flights/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                // Filter for active flights with available seats
                const availableFlights = data.filter(f => f.is_active && f.available_seats > 0);
                setFlights(availableFlights);
            }
        } catch (error) {
            console.error('Error fetching flights:', error);
        }
    };

    const fetchFoodOptions = async () => {
        try {
            const token = localStorage.getItem('access_token');
            console.log('🍽️ Fetching food options...');
            const response = await fetch('http://localhost:8000/api/others/food-prices?is_active=true', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('🍽️ Food API response status:', response.status);
            if (response.ok) {
                const data = await response.json();
                console.log('🍽️ Food options data:', data);
                console.log('🍽️ Food options count:', data.length);
                setFoodOptions(data);
            } else {
                console.error('🍽️ Food API error:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('🍽️ Error fetching food options:', error);
        }
    };

    const fetchTransportOptions = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('http://localhost:8000/api/others/transport-prices?is_active=true', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setTransportOptions(data);
            }
        } catch (error) {
            console.error('Error fetching transport options:', error);
        }
    };

    const fetchZiyaratOptions = async () => {
        try {
            const token = localStorage.getItem('access_token');
            console.log('🕌 Fetching ziyarat options...');
            const response = await fetch('http://localhost:8000/api/others/ziarat-prices?is_active=true', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('🕌 Ziyarat API response status:', response.status);
            if (response.ok) {
                const data = await response.json();
                console.log('🕌 Ziyarat options data:', data);
                console.log('🕌 First ziyarat item:', data[0]);
                setZiyaratOptions(data);
                setLoading(false);
            } else {
                console.error('🕌 Ziyarat API error:', response.status, response.statusText);
                setLoading(false);
            }
        } catch (error) {
            console.error('🕌 Error fetching ziyarat options:', error);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 text-left pb-20 -mt-4 lg:-mt-8 -mx-4 lg:-mx-8">
            {/* Header */}
            <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200 z-50 px-8 py-2">
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
                                <span>Step {step} of 3</span>
                                <ChevronRight size={10} />
                                <span className="text-blue-600">{step === 1 ? 'Identity' : step === 2 ? 'Inventory' : 'Pricing'}</span>
                            </div>
                            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                                {step === 1 ? 'General Information' : step === 2 ? 'Inventory Selection' : 'Pricing Matrix'}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 ">
                        {step > 1 && (
                            <button
                                onClick={() => setStep(step - 1)}
                                className="px-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all flex items-center gap-2"
                            >
                                <ChevronLeft size={16} /> Previous
                            </button>
                        )}
                        <button
                            onClick={() => step < 3 ? setStep(step + 1) : handleSavePackage()}
                            className="px-8 py-3.5 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                        >
                            {step === 3 ? <><Save size={16} /> Publish Package</> : <>Next Step <ChevronRight size={16} /></>}
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-8 mt-8">

                {/* STEP 1: GENERAL INFORMATION */}
                {step === 1 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-8 lg:p-12 space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <InputGroup
                                    label="Package Title"
                                    placeholder="e.g., Special Ramadan Umrah 2026"
                                    value={packageTitle}
                                    onChange={(e) => setPackageTitle(e.target.value)}
                                    required
                                />
                                <InputGroup
                                    label="Pax Capacity"
                                    placeholder="100"
                                    icon={<Users size={16} />}
                                    value={paxCapacity}
                                    onChange={(e) => setPaxCapacity(e.target.value)}
                                />
                                <div className="md:col-span-2">
                                    <InputGroup
                                        label="Itinerary & Description"
                                        placeholder="Brief details about the package journey..."
                                        type="textarea"
                                        value={packageDescription}
                                        onChange={(e) => setPackageDescription(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2: FULL INVENTORY MAPPING */}
                {step === 2 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">

                        {/* Flight Selection - Full Width */}
                        <InventoryCard title="Flight Selection" icon={<Plane size={20} />}>
                            {/* Departure Flight */}
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Select Flight</label>
                                <button
                                    onClick={() => {
                                        setFlightSelectionType('departure');
                                        setShowFlightModal(true);
                                    }}
                                    className="w-full px-4 py-3 bg-white border-2 border-dashed border-blue-200 rounded-xl text-xs font-bold outline-none hover:border-blue-500 hover:bg-blue-50 transition-all text-left flex items-center justify-between"
                                >
                                    <span className="text-slate-400">
                                        {selectedFlight ? (
                                            <span className="text-slate-900">
                                                [{selectedFlight.trip_type}] {selectedFlight.departure_trip.airline} | {selectedFlight.departure_trip.departure_city} → {selectedFlight.departure_trip.arrival_city}
                                            </span>
                                        ) : (
                                            'Click to Select Flight'
                                        )}
                                    </span>
                                    <Plane className="text-blue-500" size={16} />
                                </button>
                                {selectedFlight && (
                                    <div className="mt-3 p-3 bg-blue-50 rounded-lg text-xs space-y-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-bold text-blue-900 flex items-center gap-2">
                                                    {selectedFlight.departure_trip.airline}
                                                    <span className="text-blue-500 text-[10px] bg-blue-100 px-2 py-0.5 rounded-full">
                                                        {selectedFlight.trip_type}
                                                    </span>
                                                </p>
                                                <div className="mt-1 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase w-8">Out</span>
                                                        <span className="text-blue-700 font-medium">
                                                            {selectedFlight.departure_trip.departure_city} → {selectedFlight.departure_trip.arrival_city}
                                                        </span>
                                                    </div>
                                                    {selectedFlight.return_trip && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase w-8">Ret</span>
                                                            <span className="text-blue-700 font-medium">
                                                                {selectedFlight.return_trip.departure_city} → {selectedFlight.return_trip.arrival_city}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pt-2 border-t border-blue-100 flex justify-between items-center">
                                            <p className="text-blue-600 font-bold">
                                                Rs. {selectedFlight.adult_selling?.toLocaleString()} <span className="text-[10px] font-normal text-blue-400">/ adult</span>
                                            </p>
                                            <span className="text-[10px] font-bold text-blue-400 bg-white px-2 py-1 rounded-md border border-blue-100">
                                                {selectedFlight.available_seats} seats left
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </InventoryCard>

                        {/* Dynamic Hotel Management */}
                        <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-8 lg:p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                                    <Building2 className="text-blue-600" size={24} /> Hotel Bookings
                                </h3>
                                <button
                                    onClick={addHotel}
                                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-100 hover:scale-105 transition-all"
                                >
                                    <Plus size={14} /> Add Hotel
                                </button>
                            </div>
                            <div className="p-8 lg:p-12 space-y-10">
                                {hotels.map((hotel, index) => (
                                    <div key={hotel.id} className="relative p-6 lg:p-8 rounded-[32px] border-2 border-slate-50 bg-slate-50/20 transition-all hover:border-blue-100">
                                        {index > 0 && (
                                            <button onClick={() => removeHotel(hotel.id)} className="absolute -top-3 -right-3 w-10 h-10 bg-white border-2 border-red-50 text-red-500 rounded-full flex items-center justify-center shadow-lg hover:bg-red-50 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-end">
                                            <div className="lg:col-span-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Location</label>
                                                <select
                                                    value={hotel.city}
                                                    onChange={(e) => updateHotel(hotel.id, 'city', e.target.value)}
                                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                                                >
                                                    <option>Makkah</option>
                                                    <option>Madinah</option>
                                                    <option>Jeddah</option>
                                                </select>
                                            </div>
                                            <div className="lg:col-span-4">
                                                <InputGroup
                                                    label="Hotel Name"
                                                    placeholder="Enter hotel name..."
                                                    icon={<Hotel size={14} />}
                                                    value={hotel.name}
                                                    onChange={(e) => updateHotel(hotel.id, 'name', e.target.value)}
                                                />
                                            </div>
                                            <div className="lg:col-span-2">
                                                <InputGroup label="Check In" type="date" value={hotel.checkIn} onChange={(e) => updateHotel(hotel.id, 'checkIn', e.target.value)} />
                                            </div>
                                            <div className="lg:col-span-2">
                                                <InputGroup label="Check Out" type="date" value={hotel.checkOut} onChange={(e) => updateHotel(hotel.id, 'checkOut', e.target.value)} />
                                            </div>
                                            <div className="lg:col-span-2">
                                                <div className="p-4 bg-blue-600 rounded-2xl text-white text-center shadow-lg shadow-blue-100">
                                                    <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Calculated</p>
                                                    <p className="text-xl font-black leading-none mt-1">{hotel.nights} Nights</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Room Type Selection */}
                                        <div className="mt-6 pt-6 border-t border-slate-100">
                                            <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-widest">Room Types</label>
                                            <div className="flex items-center gap-6 flex-wrap">
                                                <label className="flex items-center gap-2 cursor-pointer group">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedRoomTypes.sharing}
                                                        onChange={(e) => setSelectedRoomTypes({ ...selectedRoomTypes, sharing: e.target.checked })}
                                                        className="w-4 h-4 rounded border-2 border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-100 cursor-pointer"
                                                    />
                                                    <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600 transition-colors">Sharing</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer group">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedRoomTypes.quint}
                                                        onChange={(e) => setSelectedRoomTypes({ ...selectedRoomTypes, quint: e.target.checked })}
                                                        className="w-4 h-4 rounded border-2 border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-100 cursor-pointer"
                                                    />
                                                    <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600 transition-colors">Quint</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer group">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedRoomTypes.quad}
                                                        onChange={(e) => setSelectedRoomTypes({ ...selectedRoomTypes, quad: e.target.checked })}
                                                        className="w-4 h-4 rounded border-2 border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-100 cursor-pointer"
                                                    />
                                                    <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600 transition-colors">Quad</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer group">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedRoomTypes.triple}
                                                        onChange={(e) => setSelectedRoomTypes({ ...selectedRoomTypes, triple: e.target.checked })}
                                                        className="w-4 h-4 rounded border-2 border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-100 cursor-pointer"
                                                    />
                                                    <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600 transition-colors">Triple</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer group">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedRoomTypes.double}
                                                        onChange={(e) => setSelectedRoomTypes({ ...selectedRoomTypes, double: e.target.checked })}
                                                        className="w-4 h-4 rounded border-2 border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-100 cursor-pointer"
                                                    />
                                                    <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600 transition-colors">Double</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Food, Ziyarat & Transport */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Food Selection */}
                            <InventoryCard title="Food/Catering" icon={<Utensils size={20} />}>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Meal Plan</label>
                                    <select
                                        value={selectedFood?._id || ''}
                                        onChange={(e) => {
                                            const food = foodOptions.find(f => f._id === e.target.value);
                                            setSelectedFood(food || null);
                                        }}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    >
                                        <option value="">Select Food Option</option>
                                        {foodOptions.map(food => (
                                            <option key={food._id} value={food._id}>
                                                {food.title}
                                            </option>
                                        ))}
                                    </select>
                                    {selectedFood && (
                                        <div className="mt-3 p-3 bg-orange-50 rounded-lg text-xs">
                                            <p className="font-bold text-orange-900">{selectedFood.title}</p>
                                            <p className="text-orange-700">{selectedFood.description}</p>
                                        </div>
                                    )}
                                </div>
                            </InventoryCard>

                            {/* Ziyarat Selection */}
                            <InventoryCard title="Ziyarats" icon={<MapPinned size={20} />}>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Select Ziyarat</label>
                                    <select
                                        value={selectedZiyarat?._id || ''}
                                        onChange={(e) => {
                                            const ziyarat = ziyaratOptions.find(z => z._id === e.target.value);
                                            setSelectedZiyarat(ziyarat || null);
                                        }}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    >
                                        <option value="">Select Ziyarat</option>
                                        {ziyaratOptions.map(ziyarat => (
                                            <option key={ziyarat._id} value={ziyarat._id}>
                                                {ziyarat.title} ({ziyarat.city})
                                            </option>
                                        ))}
                                    </select>
                                    {selectedZiyarat && (
                                        <div className="mt-3 p-3 bg-purple-50 rounded-lg text-xs">
                                            <p className="font-bold text-purple-900">{selectedZiyarat.title}</p>
                                            <p className="text-purple-700">{selectedZiyarat.city}</p>
                                            <p className="text-purple-600">{selectedZiyarat.description}</p>
                                        </div>
                                    )}
                                </div>
                            </InventoryCard>

                            {/* Transport Selection */}
                            <InventoryCard title="Transport" icon={<Truck size={20} />}>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Transport Type</label>
                                    <select
                                        value={selectedTransport?._id || ''}
                                        onChange={(e) => {
                                            const transport = transportOptions.find(t => t._id === e.target.value);
                                            setSelectedTransport(transport || null);
                                        }}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    >
                                        <option value="">Select Transport</option>
                                        {transportOptions.map(transport => (
                                            <option key={transport._id} value={transport._id}>
                                                {transport.title} ({transport.capacity} seats)
                                            </option>
                                        ))}
                                    </select>
                                    {selectedTransport && (
                                        <div className="mt-3 p-3 bg-green-50 rounded-lg text-xs">
                                            <p className="font-bold text-green-900">{selectedTransport.title}</p>
                                            <p className="text-green-700">Capacity: {selectedTransport.capacity} passengers</p>
                                            <p className="text-green-600">{selectedTransport.description}</p>
                                        </div>
                                    )}
                                </div>
                            </InventoryCard>
                        </div>
                    </div>
                )}

                {/* STEP 3: PRICING MATRIX */}
                {step === 3 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500 pb-32">

                        {/* VISA PRICING - Always shown */}
                        <PricingSection title="1. Visa Pricing" icon={<ShieldCheck size={20} />}>
                            <PricingMatrixRow
                                label="Visa (Procurement vs Sale)"
                                showTriple={true}
                                pricing={visaPricing}
                                onChange={(field, value) => setVisaPricing({ ...visaPricing, [field]: value })}
                            />
                        </PricingSection>

                        {/* HOTEL PRICING - Only if hotels added */}
                        {hotels.length > 0 && (
                            <PricingSection title="2. Accommodation (Room Sharing)" icon={<BedDouble size={20} />}>
                                <div className="space-y-12">
                                    {/* Sharing - Only if selected */}
                                    {selectedRoomTypes.sharing && (
                                        <>
                                            <PricingMatrixRow
                                                label="Sharing Prices"
                                                showTriple={false}
                                                pricing={{
                                                    purchasing: hotelPricing.sharing_purchasing,
                                                    selling: hotelPricing.sharing_selling
                                                }}
                                                onChange={(field, value) => {
                                                    if (field === 'purchasing') setHotelPricing({ ...hotelPricing, sharing_purchasing: value });
                                                    if (field === 'selling') setHotelPricing({ ...hotelPricing, sharing_selling: value });
                                                }}
                                            />
                                            {(selectedRoomTypes.quint || selectedRoomTypes.quad || selectedRoomTypes.triple || selectedRoomTypes.double) && <div className="h-px bg-slate-50" />}
                                        </>
                                    )}

                                    {/* Quint Sharing - Only if selected */}
                                    {selectedRoomTypes.quint && (
                                        <>
                                            <PricingMatrixRow
                                                label="Quint Sharing Prices"
                                                showTriple={false}
                                                pricing={{
                                                    purchasing: hotelPricing.quint_purchasing,
                                                    selling: hotelPricing.quint_selling
                                                }}
                                                onChange={(field, value) => {
                                                    if (field === 'purchasing') setHotelPricing({ ...hotelPricing, quint_purchasing: value });
                                                    if (field === 'selling') setHotelPricing({ ...hotelPricing, quint_selling: value });
                                                }}
                                            />
                                            {(selectedRoomTypes.quad || selectedRoomTypes.triple || selectedRoomTypes.double) && <div className="h-px bg-slate-50" />}
                                        </>
                                    )}

                                    {/* Quad Sharing - Only if selected */}
                                    {selectedRoomTypes.quad && (
                                        <>
                                            <PricingMatrixRow
                                                label="Quad Sharing Prices"
                                                showTriple={false}
                                                pricing={{
                                                    purchasing: hotelPricing.quad_purchasing,
                                                    selling: hotelPricing.quad_selling
                                                }}
                                                onChange={(field, value) => {
                                                    if (field === 'purchasing') setHotelPricing({ ...hotelPricing, quad_purchasing: value });
                                                    if (field === 'selling') setHotelPricing({ ...hotelPricing, quad_selling: value });
                                                }}
                                            />
                                            {(selectedRoomTypes.triple || selectedRoomTypes.double) && <div className="h-px bg-slate-50" />}
                                        </>
                                    )}

                                    {/* Triple Sharing - Only if selected */}
                                    {selectedRoomTypes.triple && (
                                        <>
                                            <PricingMatrixRow
                                                label="Triple Sharing Prices"
                                                showTriple={false}
                                                pricing={{
                                                    purchasing: hotelPricing.triple_purchasing,
                                                    selling: hotelPricing.triple_selling
                                                }}
                                                onChange={(field, value) => {
                                                    if (field === 'purchasing') setHotelPricing({ ...hotelPricing, triple_purchasing: value });
                                                    if (field === 'selling') setHotelPricing({ ...hotelPricing, triple_selling: value });
                                                }}
                                            />
                                            {selectedRoomTypes.double && <div className="h-px bg-slate-50" />}
                                        </>
                                    )}

                                    {/* Double Sharing - Only if selected */}
                                    {selectedRoomTypes.double && (
                                        <PricingMatrixRow
                                            label="Double Sharing Prices"
                                            showTriple={false}
                                            pricing={{
                                                purchasing: hotelPricing.double_purchasing,
                                                selling: hotelPricing.double_selling
                                            }}
                                            onChange={(field, value) => {
                                                if (field === 'purchasing') setHotelPricing({ ...hotelPricing, double_purchasing: value });
                                                if (field === 'selling') setHotelPricing({ ...hotelPricing, double_selling: value });
                                            }}
                                        />
                                    )}
                                </div>
                            </PricingSection>
                        )}

                        {/* FOOD PRICING - Only if food selected */}
                        {selectedFood && (
                            <PricingSection title={`${hotels.length > 0 ? '3' : '2'}. Food & Catering`} icon={<Utensils size={20} />}>
                                <PricingMatrixRow
                                    label={`${selectedFood.title} Pricing`}
                                    showTriple={false}
                                    pricing={foodPricing}
                                    onChange={(field, value) => setFoodPricing({ ...foodPricing, [field]: value })}
                                />
                            </PricingSection>
                        )}

                        {/* ZIYARAT PRICING - Only if ziyarat selected */}
                        {selectedZiyarat && (
                            <PricingSection title={`${(hotels.length > 0 ? 2 : 1) + (selectedFood ? 1 : 0) + 1}. Ziyarat Services`} icon={<MapPinned size={20} />}>
                                <PricingMatrixRow
                                    label={`${selectedZiyarat.title} Pricing`}
                                    showTriple={false}
                                    pricing={ziyaratPricing}
                                    onChange={(field, value) => setZiyaratPricing({ ...ziyaratPricing, [field]: value })}
                                />
                            </PricingSection>
                        )}

                        {/* TRANSPORT PRICING - Only if transport selected */}
                        {selectedTransport && (
                            <PricingSection title={`${(hotels.length > 0 ? 2 : 1) + (selectedFood ? 1 : 0) + (selectedZiyarat ? 1 : 0) + 1}. Transport Logistics`} icon={<Truck size={20} />}>
                                <PricingMatrixRow
                                    label={`${selectedTransport.title} Pricing`}
                                    showTriple={false}
                                    pricing={transportPricing}
                                    onChange={(field, value) => setTransportPricing({ ...transportPricing, [field]: value })}
                                />
                            </PricingSection>
                        )}

                        {/* TOTAL MARGIN FOOTER */}
                        <div className="mt-10 bg-slate-900 text-white p-8 shadow-2xl border-t border-slate-800 rounded-3xl">
                            {/* Package Prices Row - Only show selected room types */}
                            <div className={`grid grid-cols-1 gap-6 mb-8 ${Object.values(selectedRoomTypes).filter(Boolean).length >= 4 ? 'md:grid-cols-4 lg:grid-cols-5' :
                                Object.values(selectedRoomTypes).filter(Boolean).length === 3 ? 'md:grid-cols-3' :
                                    Object.values(selectedRoomTypes).filter(Boolean).length === 2 ? 'md:grid-cols-2' :
                                        'md:grid-cols-1'
                                }`}>
                                {/* Sharing - Only if selected */}
                                {selectedRoomTypes.sharing && (
                                    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Sharing</p>
                                        <h3 className="text-3xl font-black text-white mb-1">
                                            Rs. {calculatePackagePrice('sharing').selling.toLocaleString()}
                                        </h3>
                                        <p className="text-xs text-slate-400">per person</p>
                                    </div>
                                )}

                                {/* Quint Sharing - Only if selected */}
                                {selectedRoomTypes.quint && (
                                    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Quint Sharing</p>
                                        <h3 className="text-3xl font-black text-white mb-1">
                                            Rs. {calculatePackagePrice('quint').selling.toLocaleString()}
                                        </h3>
                                        <p className="text-xs text-slate-400">per person</p>
                                    </div>
                                )}

                                {/* Quad Sharing - Only if selected */}
                                {selectedRoomTypes.quad && (
                                    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Quad Sharing</p>
                                        <h3 className="text-3xl font-black text-white mb-1">
                                            Rs. {calculatePackagePrice('quad').selling.toLocaleString()}
                                        </h3>
                                        <p className="text-xs text-slate-400">per person</p>
                                    </div>
                                )}

                                {/* Triple Sharing - Only if selected */}
                                {selectedRoomTypes.triple && (
                                    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Triple Sharing</p>
                                        <h3 className="text-3xl font-black text-white mb-1">
                                            Rs. {calculatePackagePrice('triple').selling.toLocaleString()}
                                        </h3>
                                        <p className="text-xs text-slate-400">per person</p>
                                    </div>
                                )}

                                {/* Double Sharing - Only if selected */}
                                {selectedRoomTypes.double && (
                                    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Double Sharing</p>
                                        <h3 className="text-3xl font-black text-white mb-1">
                                            Rs. {calculatePackagePrice('double').selling.toLocaleString()}
                                        </h3>
                                        <p className="text-xs text-slate-400">per person</p>
                                    </div>
                                )}
                            </div>

                            {/* Summary Row - Using first selected room type */}
                            {(() => {
                                const firstSelectedRoom = selectedRoomTypes.sharing ? 'sharing' :
                                    selectedRoomTypes.quint ? 'quint' :
                                        selectedRoomTypes.quad ? 'quad' :
                                            selectedRoomTypes.triple ? 'triple' :
                                                'double';
                                const roomLabel = firstSelectedRoom.charAt(0).toUpperCase() + firstSelectedRoom.slice(1);
                                return (
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-slate-800">
                                        <div className="flex items-center gap-6 md:gap-10">
                                            <div>
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total Purchasing ({roomLabel})</p>
                                                <p className="text-lg md:text-xl font-black">
                                                    Rs. {calculatePackagePrice(firstSelectedRoom).purchasing.toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="h-8 w-px bg-slate-800 hidden md:block"></div>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total Selling ({roomLabel})</p>
                                                <p className="text-lg md:text-xl font-black text-blue-400">
                                                    Rs. {calculatePackagePrice(firstSelectedRoom).selling.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-center md:text-right">
                                            <p className="text-[9px] font-black text-green-500 uppercase tracking-[4px] mb-1">Net Package Margin</p>
                                            <h4 className="text-3xl md:text-4xl font-black tracking-tighter">
                                                Rs. {calculatePackagePrice(firstSelectedRoom).margin.toLocaleString()}
                                                <span className="text-sm font-bold text-green-400 ml-2">
                                                    (+{calculatePackagePrice(firstSelectedRoom).marginPercent}%)
                                                </span>
                                            </h4>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                    </div>
                )}

            </div>

            {/* Flight Selection Modal */}
            {showFlightModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowFlightModal(false)}>
                    <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-emerald-50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Select Flight</h3>
                                    <p className="text-xs text-slate-500 mt-1">Choose {flightSelectionType === 'departure' ? 'departure' : 'return'} flight for your package</p>
                                </div>
                                <button
                                    onClick={() => setShowFlightModal(false)}
                                    className="w-10 h-10 rounded-full bg-white hover:bg-slate-100 flex items-center justify-center transition-colors"
                                >
                                    <span className="text-2xl text-slate-400">×</span>
                                </button>
                            </div>
                        </div>

                        {/* Modal Body - Flight List */}
                        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                            <div className="space-y-3">
                                {flights.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Plane className="mx-auto text-slate-300 mb-3" size={48} />
                                        <p className="text-slate-400 font-medium">No flights available</p>
                                    </div>
                                ) : (
                                    flights.map(flight => (
                                        <button
                                            key={flight._id}
                                            onClick={() => {
                                                if (flightSelectionType === 'departure') {
                                                    setSelectedFlight(flight);
                                                } else {
                                                    setSelectedReturnFlight(flight);
                                                }
                                                setShowFlightModal(false);
                                            }}
                                            className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl hover:border-blue-400 hover:shadow-lg transition-all text-left group"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    {/* Trip Type Badge */}
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${flight.trip_type === 'Round-trip'
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : 'bg-slate-100 text-slate-700'
                                                            }`}>
                                                            {flight.trip_type}
                                                        </span>
                                                        <span className="text-xs font-bold text-slate-400">{flight.available_seats} seats available</span>
                                                    </div>

                                                    {/* Departure Trip */}
                                                    <div className="mb-2">
                                                        <p className="text-sm font-black text-slate-900 mb-1">{flight.departure_trip.airline}</p>
                                                        <div className="flex items-center gap-2 text-xs text-slate-600">
                                                            <span className="font-bold">{flight.departure_trip.departure_city}</span>
                                                            <span className="text-blue-500">→</span>
                                                            <span className="font-bold">{flight.departure_trip.arrival_city}</span>
                                                            <span className="text-slate-400">|</span>
                                                            <span>{new Date(flight.departure_trip.departure_datetime).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>

                                                    {/* Return Trip (if exists) */}
                                                    {flight.return_trip && (
                                                        <div className="pl-4 border-l-2 border-emerald-200">
                                                            <div className="flex items-center gap-2 text-xs text-slate-600">
                                                                <span className="font-bold">{flight.return_trip.departure_city}</span>
                                                                <span className="text-emerald-500">→</span>
                                                                <span className="font-bold">{flight.return_trip.arrival_city}</span>
                                                                <span className="text-slate-400">|</span>
                                                                <span>{new Date(flight.return_trip.departure_datetime).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Price */}
                                                <div className="text-right">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Adult Price</p>
                                                    <p className="text-lg font-black text-blue-600">Rs. {flight.adult_selling?.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- SUB COMPONENTS ---

const InventoryCard = ({ title, icon, children }) => (
    <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-8 lg:p-10">
        <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 shadow-inner">{icon}</div> {title}
        </h3>
        {children}
    </div>
);

const PricingSection = ({ title, icon, children }) => (
    <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center gap-4 bg-slate-50/30">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">{icon}</div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">{title}</h3>
        </div>
        <div className="p-8 lg:p-12">{children}</div>
    </div>
);

const PricingMatrixRow = ({ label, showTriple = true, pricing, onChange }) => (
    <div className="space-y-6">
        <div className="flex items-center gap-3">
            <span className="text-xs font-black text-slate-900 uppercase tracking-widest">{label}</span>
            <div className="flex-1 h-px bg-slate-50" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Purchasing Column */}
            <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] flex items-center gap-2">
                    <DollarSign size={14} /> Purchasing (Cost)
                </p>
                <div className={showTriple ? "grid grid-cols-3 gap-3" : ""}>
                    {showTriple ? (
                        <>
                            <PriceInput
                                label="Adult"
                                value={pricing?.adult_purchasing || 0}
                                onChange={(val) => onChange('adult_purchasing', val)}
                            />
                            <PriceInput
                                label="Child"
                                value={pricing?.child_purchasing || 0}
                                onChange={(val) => onChange('child_purchasing', val)}
                            />
                            <PriceInput
                                label="Infant"
                                value={pricing?.infant_purchasing || 0}
                                onChange={(val) => onChange('infant_purchasing', val)}
                            />
                        </>
                    ) : (
                        <PriceInput
                            label="Total Procurement Cost"
                            value={pricing?.purchasing || 0}
                            onChange={(val) => onChange('purchasing', val)}
                        />
                    )}
                </div>
            </div>
            {/* Selling Column */}
            <div className="space-y-4">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-[3px] flex items-center gap-2">
                    <TrendingUp size={14} /> Selling (Price)
                </p>
                <div className={showTriple ? "grid grid-cols-3 gap-3" : ""}>
                    {showTriple ? (
                        <>
                            <PriceInput
                                label="Adult"
                                color="blue"
                                value={pricing?.adult_selling || 0}
                                onChange={(val) => onChange('adult_selling', val)}
                            />
                            <PriceInput
                                label="Child"
                                color="blue"
                                value={pricing?.child_selling || 0}
                                onChange={(val) => onChange('child_selling', val)}
                            />
                            <PriceInput
                                label="Infant"
                                color="blue"
                                value={pricing?.infant_selling || 0}
                                onChange={(val) => onChange('infant_selling', val)}
                            />
                        </>
                    ) : (
                        <PriceInput
                            label="Public Market Price"
                            color="blue"
                            value={pricing?.selling || 0}
                            onChange={(val) => onChange('selling', val)}
                        />
                    )}
                </div>
            </div>
        </div>
    </div>
);

const PriceInput = ({ label, color = "slate", value, onChange }) => (
    <div className="space-y-1">
        <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest pl-1 truncate">{label}</label>
        <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-black text-[9px]">PKR</div>
            <input
                type="number"
                placeholder="0.00"
                value={value || ''}
                onChange={(e) => onChange?.(parseFloat(e.target.value) || 0)}
                className={`w-full pl-10 pr-3 py-3 bg-white border-2 rounded-xl text-[11px] font-black outline-none transition-all
        ${color === 'blue' ? 'border-blue-100 focus:ring-4 ring-blue-100/50 focus:border-blue-600' : 'border-slate-100 focus:ring-4 ring-slate-100/50'}`}
            />
        </div>
    </div>
);

export default AddPackageView;
