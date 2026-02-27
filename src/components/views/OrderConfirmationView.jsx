import React, { useState, useEffect } from 'react';
import {
    Printer,
    Download,
    ChevronLeft,
    ChevronRight,
    ArrowLeft,
    FileText,
    Check,
    Calendar,
    ChevronDown,
    Search,
    Users,
    Building2,
    Bus,
    Plane,
    Plus,
    Trash2,
    Edit3,
    XCircle,
    AlertCircle,
    Save,
    Trash
} from 'lucide-react';
import TicketPrintView from './TicketPrintView';
import SearchableSelect from '../ui/SearchableSelect';

const API = 'http://localhost:8000';

// --- Custom Components ---
const StatusRow = ({ label, value }) => (
    <div className="flex items-center justify-end gap-3 mb-2.5">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}:</span>
        <span className="text-xs font-bold text-white bg-blue-400 px-4 py-1.5 rounded-lg min-w-[80px] text-center shadow-sm">{value}</span>
    </div>
);

const TopFilterButton = ({ label }) => (
    <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-all">
        {label}
        <ChevronDown size={14} />
    </button>
);

const InnerTab = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`
    px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 border
    ${active
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-500 border-slate-200 hover:border-blue-200 hover:text-blue-600 hover:shadow-sm'}
  `}>
        {label}
    </button>
);

const SectionHeader = ({ title, icon: Icon }) => (
    <div className="flex items-center gap-2 mb-4">
        {Icon && <div className="p-1.5 bg-slate-100 rounded-lg text-slate-600"><Icon size={18} /></div>}
        <h3 className="text-base font-black text-slate-800 tracking-tight">{title}</h3>
    </div>
);

const Label = ({ children }) => <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">{children}</label>;

const VoucherSectionHeader = ({ title, onAdd, onClear, addLabel = "Add Row" }) => (
    <div className="flex items-center justify-between mb-4 mt-10 first:mt-0">
        <h3 className="text-sm font-black text-blue-600 uppercase tracking-widest">{title}</h3>
        <div className="flex items-center gap-3">
            {onClear && (
                <button
                    onClick={onClear}
                    className="px-4 py-1.5 border border-rose-400 text-rose-500 rounded-lg text-[10px] font-black uppercase hover:bg-rose-50 transition-all"
                >
                    Delete All
                </button>
            )}
            {onAdd && (
                <button
                    onClick={onAdd}
                    className="px-4 py-1.5 border border-blue-400 text-blue-600 rounded-lg text-[10px] font-black uppercase hover:bg-blue-50 transition-all flex items-center gap-1.5"
                >
                    <Plus size={12} /> {addLabel}
                </button>
            )}
        </div>
    </div>
);

const VoucherTable = ({ headers, children }) => (
    <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm mb-6">
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                    {headers.map((h, i) => (
                        <th key={i} className={`py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-wider ${i === headers.length - 1 ? 'text-center' : ''}`}>
                            {h}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {children}
            </tbody>
        </table>
    </div>
);

const VoucherInput = ({ value, onChange, placeholder, type = "text", icon: Icon }) => (
    <div className="relative group">
        {Icon && <Icon size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />}
        <input
            type={type}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full ${Icon ? 'pl-7' : 'px-4'} py-2.5 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/5 outline-none rounded-xl transition-all`}
        />
    </div>
);

const VoucherSelect = ({ value, onChange, options }) => (
    <div className="relative">
        <select
            value={value || (options && options[0]) || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/5 outline-none rounded-xl appearance-none cursor-pointer transition-all"
        >
            {options?.map((opt, i) => (
                <option key={i} value={typeof opt === 'string' ? opt : (opt.name || opt.title || opt.vehicle_type || opt.airline_name || opt.city_name)}>
                    {typeof opt === 'string' ? opt : (opt.name || opt.title || opt.vehicle_type || opt.airline_name || opt.city_name)}
                </option>
            ))}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
);

// Form Inputs

const TextInput = ({ placeholder, defaultValue, icon: Icon, readOnly }) => (
    <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />}
        <input
            type="text"
            readOnly={readOnly}
            placeholder={placeholder}
            defaultValue={defaultValue}
            className={`w-full ${Icon ? 'pl-9' : 'pl-4'} pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm ${readOnly ? 'bg-slate-50 cursor-not-allowed' : ''}`}
        />
    </div>
);

const SelectInput = ({ options, defaultValue }) => (
    <div className="relative">
        <select
            defaultValue={defaultValue}
            className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer shadow-sm"
        >
            {options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
    </div>
);

const Checkbox = ({ label, selected, onChange }) => (
    <label className="flex items-center gap-2 cursor-pointer group">
        <div className="w-4 h-4 rounded border-2 border-slate-300 flex items-center justify-center group-hover:border-blue-500 transition-colors relative">
            <input
                type="checkbox"
                className="hidden peer"
                checked={!!selected}
                onChange={(e) => onChange && onChange(e.target.checked)}
            />
            <Check size={12} className={`text-white z-10 ${selected ? 'opacity-100' : 'opacity-0'}`} strokeWidth={4} />
            <div className={`absolute inset-0 rounded bg-blue-600 transition-opacity ${selected ? 'opacity-100' : 'opacity-0'}`}></div>
        </div>
        <span className="text-xs font-bold text-slate-600 group-hover:text-slate-800 transition-colors">{label}</span>
    </label>
);

const Stepper = ({ steps, activeStepIndex }) => (
    <div className="relative flex justify-between items-center w-full max-w-3xl mx-auto my-12">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 rounded-full -z-10"></div>
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-500 rounded-full -z-10 transition-all" style={{ width: `${(activeStepIndex / (steps.length - 1)) * 100}%` }}></div>

        {steps.map((step, index) => {
            const isActive = index === activeStepIndex;
            const isPast = index < activeStepIndex;
            return (
                <div key={index} className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm border-4 transition-all duration-300 ${isActive ? 'bg-blue-600 border-blue-100 ring-4 ring-blue-50' :
                        isPast ? 'bg-blue-500 border-blue-500' : 'bg-slate-100 border-white'
                        }`}>
                        {isPast && <Check size={14} className="text-white" strokeWidth={3} />}
                        {isActive && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <span className={`absolute mt-10 text-[10px] font-black uppercase tracking-wider w-32 text-center ${isActive ? 'text-blue-700' : isPast ? 'text-slate-700' : 'text-slate-400'
                        }`}>{step}</span>
                </div>
            );
        })}
    </div>
);

export default function OrderConfirmationView({ onBack, booking: initialBooking, orderId }) {
    const [booking, setBooking] = useState(initialBooking || null);
    const [loading, setLoading] = useState(!initialBooking);
    const [activeTab, setActiveTab] = useState('Visa');
    const [toast, setToast] = useState(null);
    const [shirkas, setShirkas] = useState([]);
    const [selectedShirka, setSelectedShirka] = useState('');

    // Voucher Tab States
    const [voucherPassengers, setVoucherPassengers] = useState([]);
    const [voucherHotels, setVoucherHotels] = useState([]);
    const [voucherFlights, setVoucherFlights] = useState({ departure: [], return: [] });
    const [voucherTransport, setVoucherTransport] = useState([]);
    const [voucherFood, setVoucherFood] = useState([]);
    const [voucherZiarat, setVoucherZiarat] = useState([]);
    const [serviceOptions, setServiceOptions] = useState({ approve: false, draft: true });
    const [notes, setNotes] = useState('');

    // Status helpers
    const getVisaStatus = () => {
        return (booking?.package_details?.visa_pricing || booking?.visa_details) ? 'Included' : 'Not Included';
    };

    const getTicketsStatus = () => {
        return (booking?.package_details?.flight) ? 'Included' : 'Not Included';
    };

    const getHotelVoucherStatus = () => {
        return (booking?.package_details?.hotels?.length > 0) ? 'Included' : 'Not Included';
    };

    const getTransportStatus = () => {
        return (booking?.package_details?.transport) ? 'Included' : 'Not Included';
    };

    const getFoodStatus = () => {
        return (booking?.package_details?.food || booking?.package_details?.fooding) ? 'Included' : 'Not Included';
    };

    const getZiaratStatus = () => {
        return (booking?.package_details?.ziarat || booking?.package_details?.ziyarat) ? 'Included' : 'Not Included';
    };

    // Modal States
    const [editModal, setEditModal] = useState({ isOpen: false, type: '', index: null, data: null });

    // API Options States
    const [hotelOptions, setHotelOptions] = useState([]);
    const [transportOptions, setTransportOptions] = useState([]);
    const [foodOptions, setFoodOptions] = useState([]);
    const [ziaratOptions, setZiaratOptions] = useState([]);
    const [airlineOptions, setAirlineOptions] = useState([]);
    const [cityOptions, setCityOptions] = useState([]);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const [selectedPassengers, setSelectedPassengers] = useState([]);

    useEffect(() => {
        const passengers = booking?.passengers || [];
        setSelectedPassengers([...new Set(passengers.map(p => p.passport_no || p.id || p._id || p.name).filter(Boolean))]);
    }, [booking]);

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                const id = initialBooking?._id || initialBooking?.id || orderId;
                if (!id) return;

                const token = localStorage.getItem('access_token');
                // Try umrah-bookings first, then custom-bookings
                let res = await fetch(`${API}/api/umrah-bookings/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!res.ok) {
                    res = await fetch(`${API}/api/custom-bookings/${id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                }

                if (res.ok) {
                    const data = await res.json();
                    console.log("DEBUG: fetchBooking data:", data);
                    if (data && (data._id || data.id)) {
                        setBooking(data);
                    } else {
                        console.error("DEBUG: fetchBooking returned invalid data:", data);
                    }
                }
            } catch (err) {
                console.error("Error fetching booking:", err);
            } finally {
                setLoading(false);
            }
        };
        if (!initialBooking || Object.keys(initialBooking).length < 5) {
            fetchBooking();
        } else {
            setBooking(initialBooking);
            setLoading(false);
        }
    }, [initialBooking, orderId]);

    // Centralized Voucher State Initialization
    useEffect(() => {
        if (!booking) return;

        // Initialize voucher states from booking data
        const pkgData = booking.package_details || {};

        // Only initialize if states are empty (to prevent overwriting custom edits if booking updates elsewhere)
        setVoucherPassengers(booking.passengers || []);

        // Map rooms: check rooms_selected first, then pkgData.rooms_selected
        const baseRooms = booking.rooms_selected?.length > 0 ? booking.rooms_selected : (pkgData.rooms_selected || []);
        const pkgHotels = pkgData.hotels || [];

        // Expansion logic for Umrah Packages: Map each room type selection to each hotel stay
        // We only expand if they haven't been expanded (checked by hotel_name presence)
        // and if it's an Umrah Package (package_id exists)
        let initialVoucherHotels = [];
        const roomsHaveHotelData = baseRooms.length > 0 && baseRooms.every(r => r.hotel_name);

        // Expand if hotels exist in package but not in rooms_selected
        if (!roomsHaveHotelData && pkgHotels.length > 0 && baseRooms.length > 0) {
            pkgHotels.forEach(hotel => {
                baseRooms.forEach(room => {
                    initialVoucherHotels.push({
                        ...room,
                        hotel_id: hotel.id || hotel._id,
                        hotel_name: hotel.name,
                        city: hotel.city,
                        check_in: hotel.check_in,
                        check_out: hotel.check_out,
                        nights: hotel.nights,
                        hotel_brn: room.hotel_brn || room.brn || 'N/A',
                        hotel_voucher_number: room.hotel_voucher_number || room.hotel_voucher_number || room.voucher_no || 'N/A'
                    });
                });
            });
        } else {
            initialVoucherHotels = baseRooms.map(r => ({
                ...r,
                hotel_brn: r.hotel_brn || r.brn || 'N/A',
                hotel_voucher_number: r.hotel_voucher_number || r.voucher_no || 'N/A'
            }));
        }
        setVoucherHotels(initialVoucherHotels);

        // Shirka initialization
        setSelectedShirka(booking.shirka || '');

        // Normalize flights (Handle both array and object structures)
        let depFlights = [];
        let retFlights = [];
        const flightData = pkgData.flight;

        const normalizeFlight = (f) => {
            if (!f) return null;
            // Handle both Collections.FLIGHTS structure and PackageFlightData structure
            const departureTrip = f.departure_trip || {};
            return {
                ...f,
                airline: f.airline || departureTrip.airline || '—',
                flight_no: f.flight_no || f.flight_number || departureTrip.flight_number || '—',
                departure_trip: {
                    ...departureTrip,
                    from_city: f.departure_city || departureTrip.departure_city || departureTrip.from_city || departureTrip.from_city_name || '—',
                    to_city: f.arrival_city || departureTrip.arrival_city || departureTrip.to_city || departureTrip.to_city_name || '—',
                    departure_time: f.time || departureTrip.departure_time || departureTrip.departure_datetime || '—',
                    arrival_time: f.arrival_time || departureTrip.arrival_time || departureTrip.arrival_datetime || '—'
                }
            };
        };

        if (flightData) {
            const flightArray = Array.isArray(flightData) ? flightData : [flightData];
            const firstFlight = flightArray[0];
            const isRoundTrip = firstFlight?.trip_type === 'Round-trip';

            depFlights = firstFlight ? [normalizeFlight(firstFlight)] : [];

            // Only show return flight if it's a Round-trip
            if (isRoundTrip) {
                // Use explicit second flight if exists, otherwise fallback to first (as a placeholder)
                retFlights = flightArray[1] ? [normalizeFlight(flightArray[1])] : [normalizeFlight(firstFlight)];
            }
        }
        setVoucherFlights({ departure: depFlights, return: retFlights });

        const transportItem = pkgData.transport ? {
            type: pkgData.transport.title || pkgData.transport.name || pkgData.transport.vehicle_type || '—',
            type: pkgData.transport.title || pkgData.transport.name || pkgData.transport.vehicle_type || '—',
            sector: pkgData.transport.sector || pkgData.transport.route || '—',
            brn: booking.transport_brn || pkgData.transport.brn || 'N/A',
            voucher_no: booking.transport_voucher_number || pkgData.transport.voucher_no || 'N/A'
        } : null;
        setVoucherTransport(transportItem ? [transportItem] : []);

        const foodData = pkgData.food || pkgData.fooding;
        const foodItem = foodData ? {
            menu: foodData.title || foodData.menu || 'Standard Meal',
            brn: booking.food_brn || foodData.brn || 'N/A',
            voucher_no: booking.food_voucher_number || foodData.voucher_no || 'N/A'
        } : null;
        setVoucherFood(foodItem ? [foodItem] : []);

        const ziaratData = pkgData.ziarat || pkgData.ziyarat;
        const ziaratItem = ziaratData ? {
            name: ziaratData.title || ziaratData.name || 'Local Ziarat',
            contact_person: ziaratData.contact_person || 'N/A',
            contact_number: ziaratData.contact_number || 'N/A',
            brn: booking.ziyarat_brn || booking.ziarat_brn || ziaratData.brn || 'N/A',
            voucher_no: booking.ziyarat_voucher_number || booking.ziarat_voucher_number || ziaratData.voucher_no || 'N/A'
        } : null;
        setVoucherZiarat(ziaratItem ? [ziaratItem] : []);

        setNotes(booking.notes || '');
    }, [booking]);

    useEffect(() => {
        // Fetch Shirkas
        const fetchShirkas = async () => {
            try {
                const token = localStorage.getItem('access_token');
                const res = await fetch(`${API}/api/others/shirka?is_active=true`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setShirkas(data.map(s => s.name));
                }
            } catch (err) {
                console.error("Error fetching shirkas:", err);
            }
        };
        fetchShirkas();

        // Fetch Section Options for Modals
        const fetchOptions = async () => {
            const token = localStorage.getItem('access_token');
            const headers = { 'Authorization': `Bearer ${token}` };

            try {
                // Fetch Hotels
                const hotelRes = await fetch(`${API}/api/hotels/`, { headers });
                if (hotelRes.ok) setHotelOptions(await hotelRes.json());

                // Fetch Transport (Inventory)
                const transRes = await fetch(`${API}/api/transport/`, { headers });
                if (transRes.ok) setTransportOptions((await transRes.json()).map(t => ({ name: `${t.vehicle_type} (${t.sector})`, ...t })));

                // Fetch Food Prices
                const foodRes = await fetch(`${API}/api/others/food-prices`, { headers });
                if (foodRes.ok) setFoodOptions(await foodRes.json());

                // Fetch Ziarat Prices
                const ziaratRes = await fetch(`${API}/api/others/ziarat-prices`, { headers });
                if (ziaratRes.ok) setZiaratOptions(await ziaratRes.json());

                // Fetch Airlines
                const airlineRes = await fetch(`${API}/api/others/flight-iata?is_active=true`, { headers });
                if (airlineRes.ok) setAirlineOptions(await airlineRes.json());

                // Fetch Cities
                const cityRes = await fetch(`${API}/api/others/city-iata?is_active=true`, { headers });
                if (cityRes.ok) setCityOptions(await cityRes.json());

            } catch (err) {
                console.error("Error fetching modal options:", err);
            }
        };
        fetchOptions();
    }, [initialBooking, orderId]);

    if (loading) return <div className="p-12 text-center font-bold text-slate-400">Loading booking data...</div>;
    if (!booking) return <div className="p-12 text-center font-bold text-slate-400">No booking data found.</div>;

    const pkg = booking.package_details || {};
    const passengers = booking.passengers || [];
    const rooms = booking.rooms_selected || [];
    const agencyDetails = booking.agency_details || {};
    const branchDetails = booking.branch_details || {};
    const agentName = agencyDetails.name || agencyDetails.agency_name || branchDetails.name || booking.agent_name || '—';
    const agentContact = agencyDetails.phone_number || agencyDetails.contact || branchDetails.phone_number || '—';
    const totalPax = passengers.length || booking.total_passengers || 0;


    const togglePassenger = (id) => {
        setSelectedPassengers(prev =>
            prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
        );
    };

    const handleStatusUpdate = async (status) => {
        if (selectedPassengers.length === 0) {
            showToast("Please select passengers first", "error");
            return;
        }

        try {
            const id = booking._id || booking.id;
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API}/api/${booking.package_id ? 'umrah-bookings' : 'custom-bookings'}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    passengers: passengers.map(pax => {
                        const identifier = pax.passport_no || pax.id || pax._id || pax.name;
                        if (selectedPassengers.includes(identifier)) {
                            return {
                                ...pax,
                                visa_status: status,
                                shirka: selectedShirka || pax.shirka
                            };
                        }
                        return pax;
                    })
                })
            });

            if (res.ok) {
                const updated = await res.json();
                setBooking(updated);

                let message = `Status updated to "${status}"`;
                if (selectedPassengers.length === 1) {
                    const pax = (updated.passengers || passengers).find(p => (p.passport_no || p.id || p._id || p.name) === selectedPassengers[0]);
                    const fullName = pax ? `${pax.first_name || pax.name || ''} ${pax.last_name || ''}`.trim() : '';
                    message += ` for ${fullName || '1 passenger'}`;
                } else {
                    message += ` for ${selectedPassengers.length} passengers`;
                }
                showToast(message);
            }
        } catch (err) {
            console.error("Error updating status:", err);
            showToast("Failed to update status", "error");
        }
    };

    const handleApplyShirkaToAll = async () => {
        if (!selectedShirka) {
            showToast("Please select a Shirka first", "error");
            return;
        }

        try {
            const id = booking._id || booking.id;
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API}/api/${booking.package_id ? 'umrah-bookings' : 'custom-bookings'}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    passengers: passengers.map(pax => ({ ...pax, shirka: selectedShirka })),
                    shirka: selectedShirka
                })
            });

            if (res.ok) {
                const updated = await res.json();
                setBooking(updated);
                showToast(`Shirka "${selectedShirka}" applied to all passengers`);
            }
        } catch (err) {
            console.error("Error applying shirka:", err);
            showToast("Failed to apply shirka", "error");
        }
    };

    // --- Voucher State Handlers ---
    const addVoucherPassenger = () => setVoucherPassengers([...voucherPassengers, { type: 'Adult', title: 'Mr.', first_name: '', last_name: '', passport_no: '', dob: '', passport_issue: '', passport_expiry: '' }]);
    const removeVoucherPassenger = (idx) => setVoucherPassengers(voucherPassengers.filter((_, i) => i !== idx));
    const clearVoucherPassengers = () => setVoucherPassengers([]);

    const addVoucherHotel = () => setVoucherHotels([...voucherHotels, { hotel_name: '', check_in: '', check_out: '', room_type: 'Double', quantity: 1, sharing_type: 'Gender or Family', special_request: 'N/A', hotel_brn: 'N/A', hotel_voucher_number: 'N/A' }]);
    const removeVoucherHotel = (idx) => setVoucherHotels(voucherHotels.filter((_, i) => i !== idx));
    const clearVoucherHotels = () => setVoucherHotels([]);

    const addVoucherFlight = (type) => {
        const newFlight = { airline: '', flight_no: '', departure_trip: { from_city: '', to_city: '', departure_time: '', arrival_time: '' } };
        setVoucherFlights(prev => ({
            ...prev,
            [type]: [...prev[type], newFlight]
        }));
    };
    const removeVoucherFlight = (type, idx) => {
        setVoucherFlights(prev => ({
            ...prev,
            [type]: prev[type].filter((_, i) => i !== idx)
        }));
    };

    const addVoucherTransport = () => setVoucherTransport([...voucherTransport, { type: '', sector: '', brn: 'N/A', voucher_no: 'N/A' }]);
    const removeVoucherTransport = (idx) => setVoucherTransport(voucherTransport.filter((_, i) => i !== idx));
    const clearVoucherTransport = () => setVoucherTransport([]);

    const addVoucherFood = () => setVoucherFood([...voucherFood, { menu: '', brn: 'N/A', voucher_no: 'N/A' }]);
    const removeVoucherFood = (idx) => setVoucherFood(voucherFood.filter((_, i) => i !== idx));
    const clearVoucherFood = () => setVoucherFood([]);

    const addVoucherZiarat = () => setVoucherZiarat([...voucherZiarat, { name: '', contact_person: 'N/A', contact_number: 'N/A', brn: 'N/A', voucher_no: 'N/A' }]);
    const removeVoucherZiarat = (idx) => setVoucherZiarat(voucherZiarat.filter((_, i) => i !== idx));
    const clearVoucherZiarat = () => setVoucherZiarat([]);

    const openEditModal = (type, index, data) => {
        setEditModal({ isOpen: true, type, index, data: { ...data } });
    };

    const saveEditModal = () => {
        const { type, index, data } = editModal;
        if (type === 'passenger') {
            const updated = [...voucherPassengers];
            updated[index] = data;
            setVoucherPassengers(updated);
        } else if (type === 'hotel') {
            const updated = [...voucherHotels];
            updated[index] = data;
            setVoucherHotels(updated);
        } else if (type === 'dep_flight' || type === 'ret_flight') {
            const key = type === 'dep_flight' ? 'departure' : 'return';
            const updated = [...voucherFlights[key]];
            updated[index] = data;
            setVoucherFlights(prev => ({ ...prev, [key]: updated }));
        } else if (type === 'transport') {
            const updated = [...voucherTransport];
            updated[index] = data;
            setVoucherTransport(updated);
        } else if (type === 'food') {
            const updated = [...voucherFood];
            updated[index] = data;
            setVoucherFood(updated);
        } else if (type === 'ziarat') {
            const updated = [...voucherZiarat];
            updated[index] = data;
            setVoucherZiarat(updated);
        }
        setEditModal({ isOpen: false, type: '', index: null, data: null });
    };

    const handleSaveAllChanges = async () => {
        try {
            const id = booking._id || booking.id;
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API}/api/${booking.package_id ? 'umrah-bookings' : 'custom-bookings'}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    passengers: voucherPassengers,
                    rooms_selected: voucherHotels,
                    shirka: selectedShirka,
                    package_details: {
                        ...booking.package_details,
                        flight: [...voucherFlights.departure, ...voucherFlights.return].length > 0 ? [...voucherFlights.departure, ...voucherFlights.return] : booking.package_details.flight,
                        transport: voucherTransport[0] ? {
                            ...booking.package_details.transport,
                            vehicle_type: voucherTransport[0].type,
                            sector: voucherTransport[0].sector,
                            brn: voucherTransport[0].brn,
                            voucher_no: voucherTransport[0].voucher_no
                        } : booking.package_details.transport,
                        food: voucherFood[0] ? {
                            ...(typeof (booking.package_details.food || booking.package_details.fooding) === 'object' ? (booking.package_details.food || booking.package_details.fooding) : {}),
                            title: voucherFood[0].menu,
                            brn: voucherFood[0].brn,
                            voucher_no: voucherFood[0].voucher_no
                        } : (booking.package_details.food || booking.package_details.fooding),
                        ziarat: voucherZiarat[0] ? {
                            ...(typeof (booking.package_details.ziarat || booking.package_details.ziyarat) === 'object' ? (booking.package_details.ziarat || booking.package_details.ziyarat) : {}),
                            title: voucherZiarat[0].name,
                            contact_person: voucherZiarat[0].contact_person,
                            contact_number: voucherZiarat[0].contact_number,
                            brn: voucherZiarat[0].brn,
                            voucher_no: voucherZiarat[0].voucher_no
                        } : (booking.package_details.ziarat || booking.package_details.ziyarat)
                    },
                    transport_brn: voucherTransport[0]?.brn,
                    transport_voucher_number: voucherTransport[0]?.voucher_no,
                    food_brn: voucherFood[0]?.brn,
                    food_voucher_number: voucherFood[0]?.voucher_no,
                    ziyarat_brn: voucherZiarat[0]?.brn,
                    ziyarat_voucher_number: voucherZiarat[0]?.voucher_no,
                    notes: notes,
                    booking_status: serviceOptions.approve ? 'approved' : booking.booking_status
                })
            });

            if (res.ok) {
                const updated = await res.json();
                console.log("DEBUG: handleSaveAllChanges updated:", updated);
                if (updated && (updated._id || updated.id)) {
                    setBooking(updated);
                    showToast("All changes saved successfully");
                } else {
                    console.error("DEBUG: handleSaveAllChanges returned invalid data:", updated);
                    showToast("Changes saved, but failed to refresh data locally", "warning");
                }
            }
        } catch (err) {
            console.error("Error saving all changes:", err);
            showToast("Failed to save changes", "error");
        }
    };

    const handleSave = async (closeAfter = false) => {
        try {
            const id = booking._id || booking.id;
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API}/api/${booking.package_id ? 'umrah-bookings' : 'custom-bookings'}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    notes: booking.notes,
                    // Additional fields could be gathered from state or refs
                })
            });

            if (res.ok) {
                if (closeAfter) onBack();
                else showToast("Changes saved successfully");
            }
        } catch (err) {
            console.error("Error saving booking:", err);
        }
    };

    const PKR_FORMAT = (n) => `PKR ${(Number(n) || 0).toLocaleString()}`;
    const SAR_FORMAT = (n) => `SAR ${(Number(n) || 0).toLocaleString()}`;

    // Totals logic (similar to detail view)
    const adults = passengers.filter(p => (p.type || '').toLowerCase() === 'adult').length;
    const children = passengers.filter(p => (p.type || '').toLowerCase() === 'child').length;
    const infants = passengers.filter(p => (p.type || '').toLowerCase() === 'infant').length;

    const flight = Array.isArray(pkg.flight) ? pkg.flight[0] : (pkg.flight || null);
    const flightTotal = (() => {
        if (!flight) return 0;
        const ar = flight.adult_pkr || flight.adult_selling || flight.departure_trip?.adult_selling || 0;
        const cr = flight.child_pkr || flight.child_selling || flight.departure_trip?.child_selling || 0;
        const ir = flight.infant_pkr || flight.infant_selling || flight.departure_trip?.infant_selling || 0;
        return ar * adults + cr * children + ir * infants;
    })();

    const visaPricing = pkg.visa_pricing || {};
    const visaTotal = (visaPricing.adult_selling || 0) * adults +
        (visaPricing.child_selling || 0) * children +
        (visaPricing.infant_selling || 0) * infants;

    const hotelTotal = rooms.reduce((acc, r) => acc + (r.rate_pkr || r.price_per_person || 0) * (r.quantity || 1) * (Number(r.nights) || 1), 0);
    const transportTotal = pkg.transport?.selling || 0;
    const foodTotal = (() => {
        const food = pkg.food;
        if (!food) return 0;
        return (food.adult_selling || food.selling || 0) * adults +
            (food.child_selling || food.selling || 0) * children +
            (food.infant_selling || food.selling || 0) * infants;
    })();
    const ziyaratTotal = pkg.ziyarat?.purchasing || 0;

    return (
        <div className="min-h-screen bg-[#F8F9FD] font-sans text-slate-800 selection:bg-blue-100">
            <div className="p-4 md:px-8 md:pb-8 space-y-4">

                {/* Toast Notification */}
                {toast && (
                    <div className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-bold animate-in slide-in-from-top-4 duration-300
                    ${toast.type === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                        {toast.type === 'error' ? <XCircle size={18} /> : <Check size={18} />}
                        {toast.msg}
                    </div>
                )}

                {/* Secondary Search & Date Filter (Right Aligned) */}
                <div className="hidden md:flex justify-end gap-3 mb-2">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input type="text" placeholder="Search name, package, etc" className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all shadow-sm" />
                    </div>
                    <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
                        <Calendar size={14} className="text-slate-400" />
                        Today
                        <ChevronDown size={14} className="text-slate-400" />
                    </button>
                </div>

                {/* Top Navigation Bar / Filters */}


                {/* Main Content Card */}
                <div className="bg-white rounded-[32px] shadow-sm border border-slate-100/50 overflow-hidden">

                    <div className="p-8">
                        {/* 1. Header Grid */}
                        <div className="flex flex-col xl:flex-row justify-between gap-8 mb-8 border-b border-slate-100 pb-8">

                            {/* Left Side: Order Info & Actions */}
                            <div className="flex-1 space-y-6">

                                {/* Title & Tabs */}
                                <div className="flex flex-col lg:flex-row lg:items-center gap-6 justify-between">
                                    <div
                                        className="flex items-center gap-3 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer w-fit group"
                                        onClick={onBack}
                                    >
                                        <div className="p-2 bg-slate-50 rounded-full group-hover:bg-slate-100 transition-colors">
                                            <ArrowLeft size={18} className="text-slate-600" />
                                        </div>
                                        <h2 className="text-2xl font-black text-slate-800">Order Number <span className="text-slate-400 font-medium text-lg">({orderId || 'sjdns'})</span></h2>
                                    </div>

                                    {/* Inner Tabs */}
                                    <div className="flex flex-wrap items-center gap-3">
                                        <InnerTab label="Visa" active={activeTab === 'Visa'} onClick={() => setActiveTab('Visa')} />
                                        <InnerTab label="Hotel Voucher" active={activeTab === 'Hotel Voucher'} onClick={() => setActiveTab('Hotel Voucher')} />
                                        <InnerTab label="Tickets" active={activeTab === 'Tickets'} onClick={() => setActiveTab('Tickets')} />
                                    </div>
                                </div>

                                {/* Action Buttons & Details */}
                                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 pt-2">
                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap gap-3 w-full lg:w-auto order-2 lg:order-1">
                                        <button className="px-8 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                                            <Printer size={16} /> Print
                                        </button>
                                        <button className="px-6 py-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl text-sm font-bold hover:border-slate-300 hover:text-slate-600 transition-all flex items-center justify-center gap-2">
                                            <Download size={16} /> Download
                                        </button>
                                        <button className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                                            <FileText size={16} /> see invoice
                                        </button>
                                    </div>

                                    {/* Agent Info */}
                                    <div className="flex flex-wrap gap-x-12 gap-y-4 order-1 lg:order-2">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Agent Name:</p>
                                            <p className="text-sm font-bold text-slate-800">{agentName}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Agency Name:</p>
                                            <p className="text-sm font-bold text-slate-800">{agencyDetails.agency_name || 'Saer.pk'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Contact:</p>
                                            <p className="text-sm font-bold text-slate-800">{agentContact}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Status Pills */}
                            <div className="w-full xl:w-64 flex flex-col justify-start bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                <StatusRow label="Visa" value={getVisaStatus()} />
                                <StatusRow label="Hotel Voucher" value={getHotelVoucherStatus()} />
                                <StatusRow label="Transport" value={getTransportStatus()} />
                                <StatusRow label="Tickets" value={getTicketsStatus()} />
                                {getFoodStatus() === 'Included' && <StatusRow label="Food" value="Included" />}
                                {getZiaratStatus() === 'Included' && <StatusRow label="Ziarat" value="Included" />}
                            </div>
                        </div>

                        {/* 2. Summary Table */}
                        <div className="mb-8">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-transparent">
                                            <th className="pb-3 pr-6">Order No</th>
                                            <th className="pb-3 px-6 text-center">Agency Code</th>
                                            <th className="pb-3 px-6 text-center">Agreement Status</th>
                                            <th className="pb-3 px-6 text-center">Package No</th>
                                            <th className="pb-3 px-6 text-center">Total Pax</th>
                                            <th className="pb-3 px-6">Balance</th>
                                            <th className="pb-3 pl-6 text-center bg-slate-50/50 rounded-t-xl">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="text-sm font-bold text-slate-800">
                                            <td className="py-4 pr-6">{booking.booking_reference || booking.id || '—'}</td>
                                            <td className="py-4 px-6 text-center">{agencyDetails.agency_code || 'AGN-0000'}</td>
                                            <td className="py-4 px-6 text-center">Active</td>
                                            <td className="py-4 px-6 text-center">{booking.package_id || 'N/A'}</td>
                                            <td className="py-4 px-6 text-center text-blue-600">{totalPax}</td>
                                            <td className="py-4 px-6 text-rose-600">PKR {booking.balance || 0}</td>
                                            <td className="py-4 pl-6 text-center bg-blue-50/30 rounded-b-xl border border-t-0 border-slate-50">
                                                <span className="text-blue-500 font-bold uppercase">{booking.booking_status}</span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* --- VISA FORM START --- */}
                        {activeTab === 'Visa' && (
                            <>
                                <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-6">
                                    <h3 className="text-lg font-black text-slate-800">Passengers Details For Umrah Package</h3>

                                    <div className="flex flex-col md:flex-row items-end gap-3 w-full md:w-auto">
                                        <div className="space-y-1.5 w-full md:w-80">
                                            <SearchableSelect
                                                label="Select Umrah Visa Shirka"
                                                options={shirkas}
                                                value={selectedShirka}
                                                onChange={setSelectedShirka}
                                                placeholder="Search and select shirka..."
                                            />
                                        </div>
                                        <button
                                            onClick={handleApplyShirkaToAll}
                                            className="px-6 py-3.5 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all active:scale-95 whitespace-nowrap mb-[1px]"
                                        >
                                            Apply to All
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mb-4 px-2">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Select Passengers</h4>
                                    <button
                                        onClick={() => {
                                            const allIds = passengers.map(p => p.passport_no || p.id || p._id || p.name).filter(Boolean);
                                            setSelectedPassengers(selectedPassengers.length === allIds.length ? [] : allIds);
                                        }}
                                        className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700"
                                    >
                                        {selectedPassengers.length === passengers.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                </div>

                                {/* Passenger Cards List */}
                                <div className="space-y-3">
                                    {passengers.map((pax, idx) => {
                                        const identifier = pax.passport_no || pax.id || pax._id || pax.name || (idx + 1);
                                        const isSelected = selectedPassengers.includes(identifier);
                                        const fullName = `${pax.first_name || pax.name || ''} ${pax.last_name || ''}`.trim() || 'No Name';
                                        return (
                                            <div
                                                key={idx}
                                                onClick={() => togglePassenger(identifier)}
                                                className={`
                                   flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl border transition-all cursor-pointer
                                   ${isSelected ? 'bg-blue-50/30 border-blue-300 shadow-sm' : 'bg-white border-slate-200 hover:border-blue-200 hover:bg-slate-50/50'}
                                `}
                                            >
                                                <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide">

                                                    {/* Checkbox */}
                                                    <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-blue-600 text-white' : 'border-2 border-slate-300'}`}>
                                                        {isSelected && <Check size={14} strokeWidth={3} />}
                                                    </div>

                                                    {/* Pex Number */}
                                                    <div className="flex items-baseline gap-1 min-w-[70px]">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pex No.</span>
                                                        <span className="text-xl font-black text-slate-800">{idx + 1}</span>
                                                    </div>

                                                    <div className="w-[1px] h-8 bg-slate-200 shrink-0 hidden sm:block"></div>

                                                    {/* Type & Bed */}
                                                    <div className="grid grid-cols-2 gap-x-8 gap-y-1 min-w-[120px]">
                                                        <div>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Type</p>
                                                            <p className="text-sm font-bold text-slate-800 capitalize">{pax.type || 'Adult'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Bed</p>
                                                            <p className="text-sm font-bold text-slate-800">{pax.bed || 'Yes'}</p>
                                                        </div>
                                                    </div>

                                                    {/* Passenger Info */}
                                                    <div className="min-w-[180px]">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Passenger Name</p>
                                                        <p className="text-sm font-black text-slate-800 uppercase">{fullName}</p>
                                                    </div>

                                                    {/* Passport Details */}
                                                    <div className="grid grid-cols-2 gap-x-8 min-w-[240px]">
                                                        <div>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Passport Number</p>
                                                            <p className="text-sm font-bold font-mono text-slate-800 uppercase">{pax.passport_no || '—'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Passport Expiry</p>
                                                            <p className="text-xs font-bold text-slate-600">{pax.passport_expiry || '—'}</p>
                                                        </div>
                                                    </div>

                                                    {/* Status Badge */}
                                                    <div className="min-w-[100px]">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Status</p>
                                                        <span className={`text-xs font-bold ${pax.visa_status === 'Approved' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                            {pax.visa_status || 'Pending'}
                                                        </span>
                                                    </div>

                                                    {/* Shirka Display */}
                                                    {pax.shirka && (
                                                        <div className="min-w-[120px]">
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Shirka</p>
                                                            <p className="text-xs font-bold text-blue-600">{pax.shirka}</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Action Link */}
                                                <div className="lg:pl-6 lg:border-l border-slate-200 shrink-0 text-right w-full lg:w-auto mt-2 lg:mt-0">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const path = pax.passport_path || pax.passport_image || pax.passport_scan;
                                                            if (path) {
                                                                const url = path.startsWith('http') ? path : `${API}${path.startsWith('/') ? '' : '/'}${path}`;
                                                                window.open(url, '_blank');
                                                            } else {
                                                                showToast("No passport document found for this passenger.", "error");
                                                            }
                                                        }}
                                                        className={`text-xs font-bold transition-colors text-blue-600 hover:text-blue-700`}
                                                    >
                                                        View Passport
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Bottom Actions Row */}
                                <div className="flex flex-wrap gap-4 mt-10">
                                    <button
                                        onClick={() => handleStatusUpdate('Visa Applied')}
                                        className="px-8 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95"
                                    >
                                        Visa Applied
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate('Send to Embassy')}
                                        className="px-8 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95"
                                    >
                                        Send to Embassy
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate('Approved')}
                                        className="px-8 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95"
                                    >
                                        Visa approved
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate('Rejected')}
                                        className="px-8 py-3 bg-white border border-slate-200 text-rose-500 rounded-xl text-sm font-bold hover:bg-rose-50 transition-all active:scale-95"
                                    >
                                        Application Reject
                                    </button>
                                </div>
                            </>
                        )}
                        {/* --- VISA FORM END --- */}


                        {/* --- VOUCHER FORM START --- */}
                        {activeTab === 'Hotel Voucher' && (
                            <div className="p-8 space-y-2">
                                {/* Passenger Detail Section */}
                                <VoucherSectionHeader title="Passenger Detail" onAdd={addVoucherPassenger} onClear={clearVoucherPassengers} addLabel="Add Passengers" />
                                <VoucherTable headers={['Type', 'Title', 'Passenger Name', 'Passport No', 'DOB', 'Passport Issue', 'Passport Expiry', 'Passport Image', 'Action']}>
                                    {voucherPassengers.map((p, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-3 px-4 text-xs font-bold text-slate-700">{p.type || 'Adult'}</td>
                                            <td className="py-3 px-4 text-xs font-bold text-slate-700">{p.title || 'Mr.'}</td>
                                            <td className="py-3 px-4 text-xs font-bold text-slate-700">{p.first_name || p.name || '—'}</td>
                                            <td className="py-3 px-4 text-xs font-bold text-slate-700">{p.passport_no || '—'}</td>
                                            <td className="py-3 px-4 text-xs font-bold text-slate-700">{p.dob || '—'}</td>
                                            <td className="py-3 px-4 text-xs font-bold text-slate-700">{p.passport_issue || '—'}</td>
                                            <td className="py-3 px-4 text-xs font-bold text-slate-700">{p.passport_expiry || '—'}</td>
                                            <td className="py-3 px-4">
                                                <div className="flex justify-center">
                                                    {(p.passport_path || p.passport_image) ? <Check size={14} className="text-emerald-500" /> : <div className="w-12 h-6 bg-slate-100 rounded border border-dashed border-slate-300"></div>}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => openEditModal('passenger', i, p)} className="p-1.5 text-slate-400 hover:text-blue-600 border border-slate-200 rounded-md transition-colors"><Edit3 size={14} /></button>
                                                    <button onClick={() => removeVoucherPassenger(i)} className="p-1.5 text-slate-400 hover:text-rose-600 border border-slate-200 rounded-md transition-colors"><Trash size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </VoucherTable>

                                {/* Hotel Details Section */}
                                <VoucherSectionHeader title="Hotel Details" onAdd={addVoucherHotel} onClear={clearVoucherHotels} addLabel="Add Hotel" />
                                <VoucherTable headers={['Hotel Name', 'Check In', 'Check Out', 'Room Type', 'Qty', 'Sharing', 'Special Request', 'BRN', 'Voucher No', 'Action']}>
                                    {voucherHotels.map((room, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-3 px-4 text-xs font-bold text-slate-700">{room.hotel_name || '—'}</td>
                                            <td className="py-3 px-4 text-xs font-bold text-slate-700">{room.check_in || '—'}</td>
                                            <td className="py-3 px-4 text-xs font-bold text-slate-700">{room.check_out || '—'}</td>
                                            <td className="py-3 px-4 text-xs font-bold text-slate-700">{room.room_type || '—'}</td>
                                            <td className="py-3 px-4 text-xs font-bold text-slate-700">{room.quantity || 0}</td>
                                            <td className="py-3 px-4 text-xs font-bold text-slate-700">{room.sharing_type || '—'}</td>
                                            <td className="py-3 px-4 text-xs font-bold text-slate-700">{room.special_request || '—'}</td>
                                            <td className="py-3 px-4 text-xs font-bold text-slate-700">{room.hotel_brn || '—'}</td>
                                            <td className="py-3 px-4 text-xs font-bold text-slate-700">{room.hotel_voucher_number || '—'}</td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => openEditModal('hotel', i, room)} className="p-1.5 text-slate-400 hover:text-blue-600 border border-slate-200 rounded-md transition-colors"><Edit3 size={14} /></button>
                                                    <button onClick={() => removeVoucherHotel(i)} className="p-1.5 text-slate-400 hover:text-rose-600 border border-slate-200 rounded-md transition-colors"><Trash size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </VoucherTable>

                                {/* Flight Detail Section */}
                                <div className="flex items-center justify-between mb-2 mt-8">
                                    <h3 className="text-sm font-black text-blue-600 uppercase tracking-widest">Flight Detail</h3>
                                    <button onClick={() => addVoucherFlight('departure')} className="px-4 py-1.5 border border-blue-400 text-blue-600 rounded-lg text-[10px] font-black uppercase hover:bg-blue-50 transition-all flex items-center gap-1.5">
                                        <Plus size={12} /> Add Flights
                                    </button>
                                </div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Departure Flight</h4>
                                <VoucherTable headers={['Airline', 'Flight Number', 'From', 'To', 'Departure Date & Time', 'Arrival Date & Time']}>
                                    {voucherFlights.departure.map((f, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-3 px-4 text-xs font-bold text-slate-700">{f.airline || '—'}</td>
                                            <td className="py-3 px-4 text-xs font-bold text-slate-700">{f.flight_no || '—'}</td>
                                            <td className="py-3 px-4 text-xs font-bold text-slate-700">{f.departure_trip?.from_city || f.departure_trip?.from_city_name || '—'}</td>
                                            <td className="py-3 px-4 text-xs font-bold text-slate-700">{f.departure_trip?.to_city || f.departure_trip?.to_city_name || '—'}</td>
                                            <td className="py-3 px-4 text-xs font-bold text-slate-700">{f.departure_trip?.departure_time || '—'}</td>
                                            <td className="py-3 px-4 text-xs font-bold text-slate-700">{f.departure_trip?.arrival_time || '—'}</td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => openEditModal('dep_flight', i, f)} className="p-1.5 text-slate-400 hover:text-blue-600 border border-slate-200 rounded-md transition-colors"><Edit3 size={14} /></button>
                                                    <button onClick={() => removeVoucherFlight('departure', i)} className="p-1.5 text-slate-400 hover:text-rose-600 border border-slate-200 rounded-md transition-colors"><Trash size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </VoucherTable>

                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 mt-6">Return Flight</h4>
                                <VoucherTable headers={['Airline', 'Flight Number', 'From', 'To', 'Departure Date & Time', 'Arrival Date & Time']}>
                                    {voucherFlights.return.map((f, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-3 px-4 text-xs font-bold text-slate-700">{f.airline || '—'}</td>
                                            <td className="py-3 px-4 text-xs font-bold text-slate-700">{f.flight_no || '—'}</td>
                                            <td className="py-3 px-4 text-xs font-bold text-slate-700">{f.departure_trip?.from_city || f.departure_trip?.from_city_name || '—'}</td>
                                            <td className="py-3 px-4 text-xs font-bold text-slate-700">{f.departure_trip?.to_city || f.departure_trip?.to_city_name || '—'}</td>
                                            <td className="py-3 px-4 text-xs font-bold text-slate-700">{f.departure_trip?.departure_time || '—'}</td>
                                            <td className="py-3 px-4 text-xs font-bold text-slate-700">{f.departure_trip?.arrival_time || '—'}</td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => openEditModal('ret_flight', i, f)} className="p-1.5 text-slate-400 hover:text-blue-600 border border-slate-200 rounded-md transition-colors"><Edit3 size={14} /></button>
                                                    <button onClick={() => removeVoucherFlight('return', i)} className="p-1.5 text-slate-400 hover:text-rose-600 border border-slate-200 rounded-md transition-colors"><Trash size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </VoucherTable>

                                {/* Transportation Details Section */}
                                <VoucherSectionHeader title="Transportation Details" onAdd={addVoucherTransport} onClear={clearVoucherTransport} addLabel="Add Transport" />
                                <VoucherTable headers={['Transport Type', 'Transport Sector', 'BRN', 'Voucher Number', 'Action']}>
                                    {voucherTransport.map((t, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-3 px-4 text-xs font-bold text-slate-700">{t.type || '—'}</td>
                                            <td className="py-3 px-4 text-xs font-bold text-slate-700">{t.sector || '—'}</td>
                                            <td className="py-3 px-4 text-xs font-bold text-slate-700">{t.brn || '—'}</td>
                                            <td className="py-3 px-4 text-xs font-bold text-slate-700">{t.voucher_no || '—'}</td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => openEditModal('transport', i, t)} className="p-1.5 text-slate-400 hover:text-blue-600 border border-slate-200 rounded-md transition-colors"><Edit3 size={14} /></button>
                                                    <button onClick={() => removeVoucherTransport(i)} className="p-1.5 text-slate-400 hover:text-rose-600 border border-slate-200 rounded-md transition-colors"><Trash size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </VoucherTable>

                                {/* Food Details Section */}
                                {voucherFood.length > 0 && (
                                    <>
                                        <VoucherSectionHeader title="Food Details" onAdd={addVoucherFood} onClear={clearVoucherFood} addLabel="Add Food" />
                                        <VoucherTable headers={['Food / Menu', 'BRN', 'Voucher No', 'Action']}>
                                            {voucherFood.map((f, i) => (
                                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="py-3 px-4 text-xs font-bold text-slate-700">{f.menu || '—'}</td>
                                                    <td className="py-3 px-4 text-xs font-bold text-slate-700">{f.brn || '—'}</td>
                                                    <td className="py-3 px-4 text-xs font-bold text-slate-700">{f.voucher_no || '—'}</td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button onClick={() => openEditModal('food', i, f)} className="p-1.5 text-slate-400 hover:text-blue-600 border border-slate-200 rounded-md transition-colors"><Edit3 size={14} /></button>
                                                            <button onClick={() => removeVoucherFood(i)} className="p-1.5 text-slate-400 hover:text-rose-600 border border-slate-200 rounded-md transition-colors"><Trash size={14} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </VoucherTable>
                                    </>
                                )}

                                {/* Ziarat Details Section */}
                                {voucherZiarat.length > 0 && (
                                    <>
                                        <VoucherSectionHeader title="Ziarat Details" onAdd={addVoucherZiarat} onClear={clearVoucherZiarat} addLabel="Add Ziarat" />
                                        <VoucherTable headers={['Ziarat Name', 'Contact Person', 'Contact Number', 'BRN', 'Voucher No', 'Action']}>
                                            {voucherZiarat.map((z, i) => (
                                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="py-3 px-4 text-xs font-bold text-slate-700">{z.name || '—'}</td>
                                                    <td className="py-3 px-4 text-xs font-bold text-slate-700">{z.contact_person || '—'}</td>
                                                    <td className="py-3 px-4 text-xs font-bold text-slate-700">{z.contact_number || '—'}</td>
                                                    <td className="py-3 px-4 text-xs font-bold text-slate-700">{z.brn || '—'}</td>
                                                    <td className="py-3 px-4 text-xs font-bold text-slate-700">{z.voucher_no || '—'}</td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button onClick={() => openEditModal('ziarat', i, z)} className="p-1.5 text-slate-400 hover:text-blue-600 border border-slate-200 rounded-md transition-colors"><Edit3 size={14} /></button>
                                                            <button onClick={() => removeVoucherZiarat(i)} className="p-1.5 text-slate-400 hover:text-rose-600 border border-slate-200 rounded-md transition-colors"><Trash size={14} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </VoucherTable>
                                    </>
                                )}

                                {/* Service Options & Notes */}
                                <div className="mt-10 border-t border-slate-100 pt-8">
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Service Options</h3>
                                    <div className="flex gap-10 mb-8">
                                        <Checkbox label="APPROVE" selected={serviceOptions.approve} onChange={v => setServiceOptions({ ...serviceOptions, approve: v })} />
                                        <Checkbox label="DRAFT" selected={serviceOptions.draft} onChange={v => setServiceOptions({ ...serviceOptions, draft: v })} />
                                    </div>

                                    {booking.sar_to_pkr_rate && (
                                        <div className="mb-10 p-6 bg-blue-50/30 border border-blue-100 rounded-[24px]">
                                            <h3 className="text-sm font-black text-blue-600 uppercase tracking-widest mb-4">Dual Pricing (Audit)</h3>
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Exchange Rate:</p>
                                                    <p className="text-sm font-black text-slate-800">1 SAR = {booking.sar_to_pkr_rate} PKR</p>
                                                </div>
                                                {booking.visa_cost_sar && (
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Visa SAR:</p>
                                                        <p className="text-sm font-black text-slate-800">{SAR_FORMAT(booking.visa_cost_sar)}</p>
                                                    </div>
                                                )}
                                                {booking.hotel_cost_sar && (
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Hotel SAR:</p>
                                                        <p className="text-sm font-black text-slate-800">{SAR_FORMAT(booking.hotel_cost_sar)}</p>
                                                    </div>
                                                )}
                                                {booking.transport_cost_sar && (
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Transport SAR:</p>
                                                        <p className="text-sm font-black text-slate-800">{SAR_FORMAT(booking.transport_cost_sar)}</p>
                                                    </div>
                                                )}
                                                {booking.food_cost_sar && (
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Food SAR:</p>
                                                        <p className="text-sm font-black text-slate-800">{SAR_FORMAT(booking.food_cost_sar)}</p>
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total SAR Audit:</p>
                                                    <p className="text-sm font-black text-blue-600">
                                                        {SAR_FORMAT(
                                                            (booking.visa_cost_sar || (booking.visa_cost_pkr / booking.sar_to_pkr_rate)) +
                                                            (booking.hotel_cost_sar || (booking.hotel_cost_pkr / booking.sar_to_pkr_rate)) +
                                                            (booking.transport_cost_sar || (booking.transport_cost_pkr / booking.sar_to_pkr_rate)) +
                                                            (booking.food_cost_sar || (booking.food_cost_pkr / booking.sar_to_pkr_rate)) +
                                                            (booking.ziyarat_cost_sar || (booking.ziyarat_cost_pkr / booking.sar_to_pkr_rate))
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Notes</h3>
                                        <textarea
                                            value={notes}
                                            onChange={e => setNotes(e.target.value)}
                                            placeholder="Enter Notes"
                                            className="w-full h-32 p-4 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="flex justify-end gap-3 mt-10">
                                    <button
                                        onClick={handleSaveAllChanges}
                                        className="px-8 py-3 bg-blue-600 text-white rounded-xl text-sm font-black shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-2"
                                    >
                                        <Save size={16} /> Save All Changes
                                    </button>
                                    <button
                                        onClick={onBack}
                                        className="px-8 py-3 bg-slate-500 text-white rounded-xl text-sm font-black hover:bg-slate-600 transition-all"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}
                        {/* --- VOUCHER FORM END --- */}

                        {/* --- TICKETS CONTENT START --- */}
                        {activeTab === 'Tickets' && (
                            <div className="pt-8 border-t border-slate-100">
                                <TicketPrintView booking={booking} orderId={orderId} />
                            </div>
                        )}
                        {/* --- TICKETS CONTENT END --- */}

                    </div>
                </div>

            </div>

            {/* Edit Modal */}
            {editModal.isOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 capitalize">{editModal.type.replace('_', ' ')} Details</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Editing Row #{editModal.index + 1}</p>
                            </div>
                            <button onClick={() => setEditModal({ ...editModal, isOpen: false })} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                                <XCircle size={24} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-6">
                            {editModal.type === 'passenger' && (
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <Label>Type</Label>
                                        <VoucherSelect value={editModal.data.type} onChange={v => setEditModal({ ...editModal, data: { ...editModal.data, type: v } })} options={['Adult', 'Child', 'Infant']} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Title</Label>
                                        <VoucherSelect value={editModal.data.title} onChange={v => setEditModal({ ...editModal, data: { ...editModal.data, title: v } })} options={['Mr.', 'Mrs.', 'Ms.', 'Mst.']} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>First Name</Label>
                                        <VoucherInput value={editModal.data.first_name} onChange={v => setEditModal({ ...editModal, data: { ...editModal.data, first_name: v } })} placeholder="Enter first name" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Last Name</Label>
                                        <VoucherInput value={editModal.data.last_name} onChange={v => setEditModal({ ...editModal, data: { ...editModal.data, last_name: v } })} placeholder="Enter last name" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Passport No</Label>
                                        <VoucherInput value={editModal.data.passport_no} onChange={v => setEditModal({ ...editModal, data: { ...editModal.data, passport_no: v } })} placeholder="Enter passport number" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Date of Birth</Label>
                                        <VoucherInput type="date" value={editModal.data.dob} onChange={v => setEditModal({ ...editModal, data: { ...editModal.data, dob: v } })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Passport Issue</Label>
                                        <VoucherInput type="date" value={editModal.data.passport_issue} onChange={v => setEditModal({ ...editModal, data: { ...editModal.data, passport_issue: v } })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Passport Expiry</Label>
                                        <VoucherInput type="date" value={editModal.data.passport_expiry} onChange={v => setEditModal({ ...editModal, data: { ...editModal.data, passport_expiry: v } })} />
                                    </div>
                                </div>
                            )}

                            {editModal.type === 'hotel' && (
                                <div className="space-y-6">
                                    <div className="space-y-1.5">
                                        <Label>Select Hotel</Label>
                                        <VoucherSelect
                                            value={hotelOptions.find(o => o.name === editModal.data.hotel_name)?.name || editModal.data.hotel_name}
                                            onChange={v => setEditModal({ ...editModal, data: { ...editModal.data, hotel_name: v } })}
                                            options={['', ...hotelOptions.map(h => h.name)]}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <Label>Check-In</Label>
                                            <VoucherInput type="date" value={editModal.data.check_in} onChange={v => setEditModal({ ...editModal, data: { ...editModal.data, check_in: v } })} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>Check-Out</Label>
                                            <VoucherInput type="date" value={editModal.data.check_out} onChange={v => setEditModal({ ...editModal, data: { ...editModal.data, check_out: v } })} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>Room Type</Label>
                                            <VoucherSelect value={editModal.data.room_type} onChange={v => setEditModal({ ...editModal, data: { ...editModal.data, room_type: v } })} options={['Single', 'Double', 'Triple', 'Quad', 'Quint']} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>Quantity</Label>
                                            <VoucherInput type="number" value={editModal.data.quantity} onChange={v => setEditModal({ ...editModal, data: { ...editModal.data, quantity: v } })} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>Sharing Type</Label>
                                            <VoucherSelect value={editModal.data.sharing_type} onChange={v => setEditModal({ ...editModal, data: { ...editModal.data, sharing_type: v } })} options={['Gender or Family', 'Full Room', 'Sharing']} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>BRN</Label>
                                            <VoucherInput value={editModal.data.hotel_brn || editModal.data.brn} onChange={v => setEditModal({ ...editModal, data: { ...editModal.data, hotel_brn: v, brn: v } })} placeholder="Enter BRN" />
                                        </div>
                                        <div className="space-y-1.5 col-span-2">
                                            <Label>Voucher Number</Label>
                                            <VoucherInput value={editModal.data.hotel_voucher_number} onChange={v => setEditModal({ ...editModal, data: { ...editModal.data, hotel_voucher_number: v } })} placeholder="Enter Voucher Number" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {(editModal.type === 'dep_flight' || editModal.type === 'ret_flight') && (
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <Label>Airline</Label>
                                        <VoucherSelect
                                            value={editModal.data.airline}
                                            onChange={v => setEditModal({ ...editModal, data: { ...editModal.data, airline: v } })}
                                            options={['', ...airlineOptions.map(a => a.airline_name)]}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Flight No</Label>
                                        <VoucherInput value={editModal.data.flight_no} onChange={v => setEditModal({ ...editModal, data: { ...editModal.data, flight_no: v } })} placeholder="Enter flight number" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>From City</Label>
                                        <VoucherSelect
                                            value={editModal.data.departure_trip?.from_city || editModal.data.departure_trip?.from_city_name}
                                            onChange={v => setEditModal({ ...editModal, data: { ...editModal.data, departure_trip: { ...(editModal.data.departure_trip || {}), from_city: v } } })}
                                            options={['', ...cityOptions.map(c => c.city_name)]}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>To City</Label>
                                        <VoucherSelect
                                            value={editModal.data.departure_trip?.to_city || editModal.data.departure_trip?.to_city_name}
                                            onChange={v => setEditModal({ ...editModal, data: { ...editModal.data, departure_trip: { ...(editModal.data.departure_trip || {}), to_city: v } } })}
                                            options={['', ...cityOptions.map(c => c.city_name)]}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Departure Time</Label>
                                        <VoucherInput type="datetime-local" value={editModal.data.departure_trip?.departure_time} onChange={v => setEditModal({ ...editModal, data: { ...editModal.data, departure_trip: { ...(editModal.data.departure_trip || {}), departure_time: v } } })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Arrival Time</Label>
                                        <VoucherInput type="datetime-local" value={editModal.data.departure_trip?.arrival_time} onChange={v => setEditModal({ ...editModal, data: { ...editModal.data, departure_trip: { ...(editModal.data.departure_trip || {}), arrival_time: v } } })} />
                                    </div>
                                </div>
                            )}

                            {editModal.type === 'transport' && (
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="space-y-1.5">
                                        <Label>Select Transport</Label>
                                        <VoucherSelect
                                            value={transportOptions.find(o => o.vehicle_type === editModal.data.type)?.vehicle_type || editModal.data.type}
                                            onChange={v => {
                                                const selected = transportOptions.find(o => o.vehicle_type === v);
                                                setEditModal({ ...editModal, data: { ...editModal.data, type: v, sector: selected?.sector || editModal.data.sector } });
                                            }}
                                            options={['', ...transportOptions.map(t => t.vehicle_type)]}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Sector</Label>
                                        <VoucherInput value={editModal.data.sector} onChange={v => setEditModal({ ...editModal, data: { ...editModal.data, sector: v } })} placeholder="Enter sector" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <Label>BRN</Label>
                                            <VoucherInput value={editModal.data.brn} onChange={v => setEditModal({ ...editModal, data: { ...editModal.data, brn: v } })} placeholder="Enter BRN" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>Voucher No</Label>
                                            <VoucherInput value={editModal.data.voucher_no} onChange={v => setEditModal({ ...editModal, data: { ...editModal.data, voucher_no: v } })} placeholder="Enter Voucher No" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {editModal.type === 'food' && (
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="space-y-1.5">
                                        <Label>Select Food / Menu</Label>
                                        <VoucherSelect
                                            value={foodOptions.find(o => o.title === editModal.data.menu)?.title || editModal.data.menu}
                                            onChange={v => setEditModal({ ...editModal, data: { ...editModal.data, menu: v } })}
                                            options={['', ...foodOptions.map(f => f.title)]}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <Label>BRN</Label>
                                            <VoucherInput value={editModal.data.brn} onChange={v => setEditModal({ ...editModal, data: { ...editModal.data, brn: v } })} placeholder="Enter BRN" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>Voucher No</Label>
                                            <VoucherInput value={editModal.data.voucher_no} onChange={v => setEditModal({ ...editModal, data: { ...editModal.data, voucher_no: v } })} placeholder="Enter Voucher No" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {editModal.type === 'ziarat' && (
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="space-y-1.5">
                                        <Label>Select Ziarat</Label>
                                        <VoucherSelect
                                            value={ziaratOptions.find(o => o.title === editModal.data.name)?.title || editModal.data.name}
                                            onChange={v => {
                                                const selected = ziaratOptions.find(o => o.title === v);
                                                setEditModal({ ...editModal, data: { ...editModal.data, name: v, contact_person: selected?.contact_person || editModal.data.contact_person, contact_number: selected?.contact_number || editModal.data.contact_number } });
                                            }}
                                            options={['', ...ziaratOptions.map(z => z.title)]}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <Label>Contact Person</Label>
                                            <VoucherInput value={editModal.data.contact_person} onChange={v => setEditModal({ ...editModal, data: { ...editModal.data, contact_person: v } })} placeholder="Enter Contact Person" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>Contact Number</Label>
                                            <VoucherInput value={editModal.data.contact_number} onChange={v => setEditModal({ ...editModal, data: { ...editModal.data, contact_number: v } })} placeholder="Enter Contact Number" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>BRN</Label>
                                            <VoucherInput value={editModal.data.brn} onChange={v => setEditModal({ ...editModal, data: { ...editModal.data, brn: v } })} placeholder="Enter BRN" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>Voucher No</Label>
                                            <VoucherInput value={editModal.data.voucher_no} onChange={v => setEditModal({ ...editModal, data: { ...editModal.data, voucher_no: v } })} placeholder="Enter Voucher No" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-8 py-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
                            <button onClick={() => setEditModal({ ...editModal, isOpen: false })} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">
                                Cancel
                            </button>
                            <button onClick={saveEditModal} className="px-8 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-black shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-2">
                                <Check size={16} /> Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
