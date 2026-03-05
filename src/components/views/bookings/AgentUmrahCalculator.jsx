import React, { useState } from 'react';
import {
    Package, Ticket, Hotel, MapPin,
    CheckCircle2, Minus, Plus, Plane,
    Utensils, Landmark, ChevronLeft, ChevronRight,
    Printer, Save, Send, Clock, Users, X
} from 'lucide-react';
import othersAPI from '../../../services/othersAPI';

// Room Type Constants
const ROOM_TYPES = ['Double', 'Triple', 'Quad', 'Quint', 'Sharing'];
const SHARING_TYPES = ['Family Sharing', 'Male Sharing', 'Female Sharing'];

// Room Capacity Mapping
const ROOM_CAPACITIES = {
    'Double': 2,
    'Triple': 3,
    'Quad': 4,
    'Quint': 5,
    'Sharing': 999 // Sharing has unlimited capacity
};

const AgentUmrahCalculator = ({ onBookCustomPackage }) => {
    const [currentStep, setCurrentStep] = useState(1);

    // State Management
    // selectedOptions is an array of IDs: e.g. ['visa_transport_hotel', 'tickets']
    const [selectedOptions, setSelectedOptions] = useState(['visa_transport_ticket_hotel']);
    const [passengers, setPassengers] = useState({ adults: 1, children: 0, infants: 0 });
    const [includeFood, setIncludeFood] = useState(false);
    const [includeZiarat, setIncludeZiarat] = useState(false);

    // Flight Inventory State
    const [flights, setFlights] = useState([]);
    const [showFlightModal, setShowFlightModal] = useState(false);
    const [selectedFlight, setSelectedFlight] = useState(null);
    const [loadingFlights, setLoadingFlights] = useState(false);
    const [riyalRate, setRiyalRate] = useState(null);
    const [visaRatesPex, setVisaRatesPex] = useState([]);
    const [onlyVisaRates, setOnlyVisaRates] = useState([]);
    const [agentMargin, setAgentMargin] = useState(55000);

    // Hotel Management State
    const [hotels, setHotels] = useState([]);
    const [bedTypes, setBedTypes] = useState([]);

    // Hotel Management State - Array of hotel rows
    const [hotelRows, setHotelRows] = useState([{
        id: Date.now(),
        hotel_id: '',
        hotel_name: '',
        city: '',
        check_in: '',
        check_out: '',
        total_nights: 0
    }]);

    // Family Management State
    const [families, setFamilies] = useState([]);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // Visa Rates State
    const [visaRates, setVisaRates] = useState([]);
    const [riyalSettings, setRiyalSettings] = useState(null);
    const [selectedVisaRate, setSelectedVisaRate] = useState(null);
    const [visaPriceBreakdown, setVisaPriceBreakdown] = useState(null);

    // Transport State
    const [transportPrices, setTransportPrices] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState(null);

    // Food State
    const [foodPrices, setFoodPrices] = useState([]);
    const [foodRows, setFoodRows] = useState([]);

    // Ziarat State
    const [ziaratPrices, setZiaratPrices] = useState([]);
    const [ziaratRows, setZiaratRows] = useState([]);

    // Fetch flights on mount
    React.useEffect(() => {
        const fetchFlights = async () => {
            setLoadingFlights(true);
            try {
                const token = localStorage.getItem('access_token');
                console.log('✈️ Fetching flights with token:', token ? 'Present' : 'Missing');

                // Try flights endpoint first
                let response = await fetch('http://localhost:8000/api/flights/', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                let data = [];
                if (response.ok) {
                    data = await response.json();
                    console.log('✅ Flights data received:', data.length, 'records');
                } else {
                    console.error('❌ Flights API Error:', response.status);
                }

                // Filtering logic with robust number parsing
                let available = data.filter(f => f.is_active && Number(f.available_seats) > 0);

                // If no flights found, try ticket-inventory as a fallback
                if (available.length === 0) {
                    console.log('🔍 No flights found in /api/flights/, checking /api/ticket-inventory/...');
                    const ticketResponse = await fetch('http://localhost:8000/api/ticket-inventory/', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (ticketResponse.ok) {
                        const ticketData = await ticketResponse.json();
                        console.log('✅ Ticket Inventory data received:', ticketData.length, 'records');

                        // Transform ticket inventory to flight format for the UI
                        const transformed = ticketData
                            .filter(t => t.is_active && Number(t.available_seats) > 0)
                            .map(t => ({
                                ...t,
                                adult_selling: t.agent_price || t.selling_price,
                                is_inventory_ticket: true
                            }));
                        available = [...available, ...transformed];
                    }
                }

                setFlights(available);
                console.log('✨ Total available flights for display:', available.length);

            } catch (error) {
                console.error('🔥 Error fetching flights:', error);
            } finally {
                setLoadingFlights(false);
            }
        };
        fetchFlights();
    }, []);

    // Fetch Rates & Settings on mount
    React.useEffect(() => {
        const fetchRates = async () => {
            const token = localStorage.getItem('access_token');
            const headers = { 'Authorization': `Bearer ${token}` };

            // Fetch Riyal Rate
            try {
                const riyalRes = await fetch('http://localhost:8000/api/others/riyal-rate/active', { headers });
                if (riyalRes.ok) {
                    const data = await riyalRes.json();
                    setRiyalSettings(data); // Updated variable name
                    setRiyalRate(data); // Keep for backward compatibility
                    console.log('💰 Active Riyal Rate:', data.rate);
                } else {
                    console.warn('⚠️ Riyal rate API returned:', riyalRes.status);
                }
            } catch (error) {
                console.error('🔥 Error fetching riyal rate:', error.message);
            }

            // Fetch Visa Rates (Pax-wise)
            try {
                const pexRes = await fetch('http://localhost:8000/api/others/visa-rates-pex?is_active=true', { headers });
                if (pexRes.ok) {
                    const data = await pexRes.json();
                    setVisaRates(data); // Updated variable name
                    setVisaRatesPex(data); // Keep for backward compatibility
                    console.log('📋 Pax-wise Visa Rates:', data.length);
                } else {
                    console.warn('⚠️ Visa rates pex API returned:', pexRes.status);
                }
            } catch (error) {
                console.error('🔥 Error fetching visa rates pex:', error.message);
            }

            // Fetch Only Visa Rates
            try {
                const onlyRes = await fetch('http://localhost:8000/api/others/only-visa-rates?status_filter=Active', { headers });
                if (onlyRes.ok) {
                    const data = await onlyRes.json();
                    setOnlyVisaRates(data);
                    console.log('🎫 Only Visa Rates:', data.length);
                } else {
                    console.warn('⚠️ Only visa rates API returned:', onlyRes.status);
                }
            } catch (error) {
                console.error('🔥 Error fetching only visa rates:', error.message);
            }

            // Fetch Transport Prices
            try {
                const transportRes = await fetch('http://localhost:8000/api/others/transport-prices?status_filter=Active', { headers });
                if (transportRes.ok) {
                    const data = await transportRes.json();
                    setTransportPrices(data);
                    console.log('🚗 Transport Prices:', data.length);
                } else {
                    console.warn('⚠️ Transport prices API returned:', transportRes.status);
                }
            } catch (error) {
                console.error('🔥 Error fetching transport prices:', error.message);
            }

            // Fetch Food Prices
            try {
                const foodRes = await fetch('http://localhost:8000/api/others/food-prices?status_filter=Active', { headers });
                if (foodRes.ok) {
                    const data = await foodRes.json();
                    setFoodPrices(data);
                    console.log('🍽️ Food Prices:', data.length);
                } else {
                    console.warn('⚠️ Food prices API returned:', foodRes.status);
                }
            } catch (error) {
                console.error('🔥 Error fetching food prices:', error.message);
            }

            // Fetch Ziarat Prices
            try {
                const ziaratRes = await fetch('http://localhost:8000/api/others/ziarat-prices?status_filter=Active', { headers });
                if (ziaratRes.ok) {
                    const data = await ziaratRes.json();
                    setZiaratPrices(data);
                    console.log('🕌 Ziarat Prices:', data.length);
                } else {
                    console.warn('⚠️ Ziarat prices API returned:', ziaratRes.status);
                }
            } catch (error) {
                console.error('🔥 Error fetching ziarat prices:', error.message);
            }



            // Fetch Hotels
            try {
                const hotelRes = await fetch('http://localhost:8000/api/hotels/', { headers });
                if (hotelRes.ok) {
                    const data = await hotelRes.json();
                    // Map backend 'name' to 'hotel_name' used in frontend
                    const mappedHotels = data.map(h => ({
                        ...h,
                        id: h.id || h._id,
                        hotel_name: h.name
                    }));
                    setHotels(mappedHotels);
                    console.log('🏨 Hotels fetched:', mappedHotels.length);
                } else {
                    console.warn('⚠️ Hotels API returned:', hotelRes.status);
                }
            } catch (error) {
                console.error('🔥 Error fetching hotels:', error.message);
            }

            // Fetch Bed Types (needed for hotel price auto-fill)
            try {
                const bedTypeRes = await fetch('http://localhost:8000/api/bed-types/', { headers });
                if (bedTypeRes.ok) {
                    const data = await bedTypeRes.json();
                    setBedTypes(data);
                    console.log('🛏️ Bed Types fetched:', data.length);
                }
            } catch (error) {
                console.error('🔥 Error fetching bed types:', error.message);
            }
        };
        fetchRates();
    }, []);

    // Update visa calculation when passengers or options change
    React.useEffect(() => {
        if (visaRates.length > 0 && riyalSettings) {
            updateVisaCalculation();
        }
    }, [passengers, selectedOptions, visaRates, riyalSettings]);

    // Clear selected vehicle when visa rate changes
    React.useEffect(() => {
        setSelectedVehicle(null);
    }, [selectedVisaRate]);

    // Auto-populate hotel rows from transport sector when vehicle is selected
    React.useEffect(() => {
        if (!selectedVehicle || !hasService('hotels')) return;
        if (!selectedVehicle.sector_id) return; // No structured sector - can't auto-derive hotels

        const autoPopulateHotels = async () => {
            try {
                const token = localStorage.getItem('access_token');
                const headers = { Authorization: `Bearer ${token}` };
                let smallSectors = [];

                // Always try big-sector first (covers cases where is_big_sector flag is wrong)
                const bigRes = await fetch(
                    `http://localhost:8000/api/others/big-sectors/${selectedVehicle.sector_id}`,
                    { headers }
                );
                if (bigRes.ok) {
                    const bigData = await bigRes.json();
                    const details = bigData.small_sectors_details || [];
                    if (details.length > 0) {
                        smallSectors = details;
                        console.log('📦 Resolved as big sector, small sectors:', details.length);
                    }
                }

                // If big-sector returned no sub-sectors, fall back to single small sector
                if (smallSectors.length === 0) {
                    const res = await fetch(
                        `http://localhost:8000/api/others/small-sectors/${selectedVehicle.sector_id}`,
                        { headers }
                    );
                    if (!res.ok) return;
                    const data = await res.json();
                    smallSectors = [data];
                    console.log('📦 Resolved as small sector:', data.sector_type);
                }

                // Derive hotels: AIRPORT PICKUP and HOTEL TO HOTEL legs need a hotel at arrival_city
                // AIRPORT DROP legs are ignored (no hotel needed)
                const hotelLegs = smallSectors.filter(s => s.sector_type !== 'AIRPORT DROP');

                if (hotelLegs.length === 0) return;

                const newRows = hotelLegs.map((leg, i) => ({
                    id: Date.now() + i,
                    hotel_id: '',
                    hotel_name: '',
                    city: leg.arrival_city || '',
                    check_in: '',
                    check_out: '',
                    total_nights: 0,
                    _sectorType: leg.sector_type, // keep for display hint
                }));

                setHotelRows(newRows);
                showToastMessage(`✓ ${newRows.length} hotel slot${newRows.length > 1 ? 's' : ''} added from transport sector`);
                console.log('🏨 Auto-populated hotel rows from sector:', newRows);
            } catch (err) {
                console.error('🔥 Error auto-populating hotels from sector:', err);
            }
        };

        autoPopulateHotels();
    }, [selectedVehicle]);

    const bookingOptions = [
        { id: 'visa_transport_ticket_hotel', label: 'Visa + Transport + Tickets + Hotel', icon: Landmark, type: 'package', contains: ['visa', 'transport', 'tickets', 'hotels'] },
        { id: 'visa_transport_hotel', label: 'Visa + Transport + Hotel', icon: Landmark, type: 'package', contains: ['visa', 'transport', 'hotels'] },
        { id: 'visa_transport', label: 'Visa + Transport', icon: Landmark, type: 'package', contains: ['visa', 'transport'] },
        { id: 'hotels', label: 'Hotels', icon: Hotel, type: 'component', contains: ['hotels'] },
        { id: 'transport', label: 'Transport', icon: MapPin, type: 'component', contains: ['transport'] },
        { id: 'tickets', label: 'Tickets', icon: Plane, type: 'component', contains: ['tickets'] },
        { id: 'only_visa', label: 'Only Visa', icon: Ticket, type: 'visa', contains: ['visa'] },
        { id: 'long_term_visa', label: 'Long term visa', icon: Clock, type: 'visa', contains: ['visa'] },
    ];

    // --- LOGIC HELPERS ---

    // Check if a service (visa, hotels, etc.) is covered by ANY selected option
    const hasService = (service) => {
        return selectedOptions.some(optId => {
            const opt = bookingOptions.find(o => o.id === optId);
            return opt?.contains.includes(service);
        });
    };

    // Update room assignment for a family-hotel combination
    const updateRoomAssignment = (familyId, hotelId, field, value) => {
        setFamilies(prev => prev.map(family => {
            if (family.id === familyId) {
                const currentAssignment = family.assignments?.[hotelId] || {};
                const updatedAssignments = {
                    ...family.assignments,
                    [hotelId]: {
                        ...currentAssignment,
                        [field]: value
                    }
                };

                // If room type changed FROM "Sharing" to something else, clear sharingType
                if (field === 'roomType' && value !== 'Sharing' && currentAssignment.roomType === 'Sharing') {
                    updatedAssignments[hotelId].sharingType = '';
                }

                // Auto-fill rate_sar from hotel pricing when room type is selected
                if (field === 'roomType' && value) {
                    const hotelRow = hotelRows.find(h => String(h.id) === String(hotelId));
                    if (hotelRow?.hotel_id) {
                        const hotelData = hotels.find(h => String(h.id) === String(hotelRow.hotel_id));
                        if (hotelData?.prices?.length > 0) {
                            // Try to match bed type by name (e.g. "Double" matches bed type named "Double")
                            const matchedBedType = bedTypes.find(bt =>
                                bt.name.toLowerCase().includes(value.toLowerCase()) ||
                                value.toLowerCase().includes(bt.name.toLowerCase())
                            );
                            let matchedPrice = null;
                            if (matchedBedType) {
                                matchedPrice = hotelData.prices.find(
                                    p => String(p.bed_type_id) === String(matchedBedType.id || matchedBedType._id)
                                );
                            }
                            // Fallback: use first available price
                            if (!matchedPrice) matchedPrice = hotelData.prices[0];
                            if (matchedPrice?.selling_price != null) {
                                updatedAssignments[hotelId].rate_sar = matchedPrice.selling_price;
                            }
                        }
                    }
                }

                return { ...family, assignments: updatedAssignments };
            }
            return family;
        }));
    };

    // --- HOTEL & FAMILY HELPER FUNCTIONS ---

    // Calculate nights between two dates
    const calculateNights = (checkIn, checkOut) => {
        if (!checkIn || !checkOut) return 0;
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    // Handle changes to hotel row fields
    const handleHotelRowChange = (rowId, field, value) => {
        setHotelRows(prevRows => {
            const updatedRows = prevRows.map(row => {
                if (row.id === rowId) {
                    const updatedRow = { ...row, [field]: value };

                    // If hotel selected, update name and city
                    if (field === 'hotel_id') {
                        const selectedHotel = hotels.find(h => h.id === value);
                        if (selectedHotel) {
                            updatedRow.hotel_name = selectedHotel.hotel_name;
                            updatedRow.city = selectedHotel.city;
                        }
                    }

                    // Auto-calculate nights when dates change
                    if (field === 'check_in' || field === 'check_out') {
                        const nights = calculateNights(
                            field === 'check_in' ? value : row.check_in,
                            field === 'check_out' ? value : row.check_out
                        );
                        updatedRow.total_nights = nights;
                    }

                    return updatedRow;
                }
                return row;
            });

            // CASCADE DATES: If check-out changed, update next row's check-in
            if (field === 'check_out' && value) {
                const currentIndex = updatedRows.findIndex(r => r.id === rowId);
                if (currentIndex !== -1 && currentIndex < updatedRows.length - 1) {
                    const nextRow = updatedRows[currentIndex + 1];
                    updatedRows[currentIndex + 1] = {
                        ...nextRow,
                        check_in: value,
                        total_nights: calculateNights(value, nextRow.check_out)
                    };
                }
            }

            return updatedRows;
        });
    };

    // Handle search query change
    const handleHotelSearchChange = (rowId, query) => {
        setHotelRows(prevRows => prevRows.map(row =>
            row.id === rowId ? { ...row, searchQuery: query } : row
        ));
    };

    // Select hotel from search results
    const selectHotelFromSearch = (rowId, hotel) => {
        handleHotelRowChange(rowId, 'hotel_id', hotel.id);
        handleHotelSearchChange(rowId, ''); // Clear search after selection
    };

    // Add new hotel row
    const addHotelRow = () => {
        const lastRow = hotelRows[hotelRows.length - 1];
        const newRow = {
            id: Date.now(),
            hotel_id: '',
            hotel_name: '',
            city: '',
            check_in: lastRow.check_out || '', // Auto-fill from previous check-out
            check_out: '',
            total_nights: 0
        };
        setHotelRows([...hotelRows, newRow]);
        showToastMessage('New hotel row added');
    };

    // Remove hotel row
    const removeHotelRow = (rowId) => {
        if (hotelRows.length === 1) {
            showToastMessage('Cannot remove the last hotel row');
            return;
        }
        setHotelRows(hotelRows.filter(row => row.id !== rowId));
        showToastMessage('Hotel row removed');
    };

    // Get completed hotels (with all required fields)
    const getCompletedHotels = () => {
        return hotelRows.filter(row =>
            row.hotel_id && row.check_in && row.check_out
        );
    };

    // Get available room types for a family based on member count
    const getAvailableRoomTypes = (family) => {
        const totalMembers = (family.adults || 0) + (family.children || 0) + (family.infants || 0);
        return ROOM_TYPES.filter(roomType => ROOM_CAPACITIES[roomType] >= totalMembers);
    };

    // Get total passenger count
    const getTotalPax = () => passengers.adults + passengers.children + passengers.infants;


    // === VISA CALCULATION HELPERS ===

    // Calculate pax range for visa rates (adults + children only, infants NOT counted)
    const calculatePaxRange = () => {
        return passengers.adults + passengers.children;
    };

    // Helper: Find matching visa rate based on pax range and transport requirement
    const findMatchingVisaRate = (paxRange) => {
        if (!visaRates || visaRates.length === 0) {
            console.warn('⚠️ No visa rates loaded');
            return null;
        }

        const needsTransport = hasService('transport');
        console.log(`🔍 Finding rate for: ${paxRange} pax, Transport needed: ${needsTransport}`);

        // Debug: Log all rates and why they match/don't match
        visaRates.forEach(rate => {
            const transportMatches = rate.with_transport === needsTransport;
            const rangeMatches = rate.person_from <= paxRange && rate.person_to >= paxRange;
            console.log(`Rate "${rate.title}": Range [${rate.person_from}-${rate.person_to}] (${rangeMatches ? '✅' : '❌'}), Transport ${rate.with_transport} (${transportMatches ? '✅' : '❌'})`);
        });

        return visaRates.find(rate =>
            rate.with_transport === needsTransport &&
            rate.person_from <= paxRange &&
            rate.person_to >= paxRange
        );
    };

    // Calculate visa price breakdown
    const calculateVisaPrice = (visaRate) => {
        if (!visaRate) return null;

        const adultPrice = passengers.adults * (visaRate.adult_selling || 0);
        const childPrice = passengers.children * (visaRate.child_selling || 0);
        const infantPrice = passengers.infants * (visaRate.infant_selling || 0);

        return {
            adultPrice,
            childPrice,
            infantPrice,
            total: adultPrice + childPrice + infantPrice,
            currency: riyalSettings?.is_visa_pkr ? 'PKR' : 'SAR',
            rateTitle: visaRate.title,
            perAdult: visaRate.adult_selling || 0,
            perChild: visaRate.child_selling || 0,
            perInfant: visaRate.infant_selling || 0
        };
    };

    // Finalize visa price (handle currency and PKR total)
    const finalizeVisaPrice = (breakdown) => {
        if (!breakdown || !riyalSettings) return breakdown;

        // If visa rates are already in PKR (is_visa_pkr=true)
        if (riyalSettings.is_visa_pkr) {
            return {
                ...breakdown,
                currency: 'PKR',
                symbol: '₨', // Rupee symbol
                originalCurrency: 'PKR',
                exchangeRate: 1,
                pkrTotal: breakdown.total
            };
        }

        // If visa rates are in SAR (is_visa_pkr=false)
        const rate = riyalSettings.rate || 1;
        return {
            ...breakdown,
            currency: 'SAR',
            symbol: 'SAR', // SAR symbol
            originalCurrency: 'SAR',
            exchangeRate: rate,
            pkrTotal: breakdown.total * rate
        };
    };

    // Update visa calculation when passengers change
    const updateVisaCalculation = () => {
        const paxRange = calculatePaxRange();

        // Only calculate if we have visa service
        if (!hasService('visa')) {
            setSelectedVisaRate(null);
            setVisaPriceBreakdown(null);
            return;
        }

        // Find matching rate
        const matchedRate = findMatchingVisaRate(paxRange);
        setSelectedVisaRate(matchedRate);

        if (!matchedRate) {
            setVisaPriceBreakdown(null);
            if (paxRange > 0) {
                // Toast handled by effect or manual check if needed
            }
            return;
        }

        const initialBreakdown = calculateVisaPrice(matchedRate);
        const finalBreakdown = finalizeVisaPrice(initialBreakdown);
        setVisaPriceBreakdown(finalBreakdown);
        console.log('💳 Visa Price Breakdown:', finalBreakdown);
    };

    // === TRANSPORT SELECTION HELPERS ===

    // Get available vehicles from selected visa rate's vehicle_ids
    const getAvailableVehicles = () => {
        console.log('🚗 getAvailableVehicles called');
        console.log('   selectedOptions:', selectedOptions);
        console.log('   selectedVisaRate:', selectedVisaRate);
        console.log('   transportPrices length:', transportPrices?.length);

        // Check if transport data is loaded
        if (!transportPrices || transportPrices.length === 0) {
            console.log('   ❌ No transport prices loaded');
            return [];
        }

        // CASE 1: ONLY Transport selected (standalone) - show ALL vehicles
        if (selectedOptions.includes('transport') && selectedOptions.length === 1) {
            console.log('   ✅ Standalone transport - showing all vehicles:', transportPrices.length);
            return transportPrices;
        }

        // CASE 2: Visa + Transport - filter by visa's vehicle_ids
        if (selectedVisaRate && selectedVisaRate.with_transport) {
            const vehicleIds = selectedVisaRate.vehicle_ids || [];
            console.log('   visa vehicle_ids:', vehicleIds);

            const available = transportPrices.filter(tp => {
                const matches = vehicleIds.includes(tp._id);
                console.log(`   Vehicle ${tp._id} (${tp.vehicle_name}): ${matches ? '✅' : '❌'}`);
                return matches;
            });

            console.log('   ✅ Visa-filtered vehicles:', available.length);
            return available;
        }

        // CASE 3: Transport is part of selected options (but not standalone and no visa rate)
        if (hasService('transport')) {
            console.log('   ✅ Transport service active - showing all vehicles:', transportPrices.length);
            return transportPrices;
        }

        console.log('   ❌ No matching case - returning empty');
        return [];
    };

    // Format vehicle option for dropdown display
    const formatVehicleOption = (vehicle) => {
        return `${vehicle.vehicle_type} - ${vehicle.vehicle_name}`;
    };

    // === FOOD SELECTION HELPERS ===

    // Get unique cities from food prices
    const getFoodCities = () => {
        const cities = [...new Set(foodPrices.map(f => f.city))];
        console.log('🍽️ getFoodCities - All food items:', foodPrices);
        console.log('🍽️ getFoodCities - Extracted cities:', cities);
        return cities.filter(Boolean).sort();
    };

    // Get food options for a specific city
    const getFoodForCity = (city) => {
        if (!city) return [];
        const filtered = foodPrices.filter(f => f.city === city);
        console.log(`🍽️ getFoodForCity("${city}") - Found ${filtered.length} items:`, filtered);
        return filtered;
    };

    // Add new food row
    const addFoodRow = () => {
        const newRow = {
            id: Date.now(),
            city: '',
            food_id: '',
            selfPickup: false,
            startDate: '',
            endDate: ''
        };
        setFoodRows([...foodRows, newRow]);
    };

    // Remove food row
    const removeFoodRow = (rowId) => {
        setFoodRows(foodRows.filter(row => row.id !== rowId));
    };

    // Update food row
    const updateFoodRow = (rowId, field, value) => {
        setFoodRows(prevRows => prevRows.map(row =>
            row.id === rowId ? { ...row, [field]: value } : row
        ));
    };

    // === ZIARAT SELECTION HELPERS ===

    // Get unique cities from ziarat prices
    const getZiaratCities = () => {
        const cities = [...new Set(ziaratPrices.map(z => z.city))];
        console.log('🕌 getZiaratCities - All ziarat items:', ziaratPrices);
        console.log('🕌 getZiaratCities - Extracted cities:', cities);
        return cities.filter(Boolean).sort();
    };

    // Get ziarat options for a specific city
    const getZiaratForCity = (city) => {
        if (!city) return [];
        const filtered = ziaratPrices.filter(z => z.city === city);
        console.log(`🕌 getZiaratForCity("${city}") - Found ${filtered.length} items:`, filtered);
        return filtered;
    };

    // Add new ziarat row
    const addZiaratRow = () => {
        const newRow = {
            id: Date.now(),
            city: '',
            ziarat_id: '',
            visitDate: '',
            self: false
        };
        setZiaratRows([...ziaratRows, newRow]);
    };

    // Remove ziarat row
    const removeZiaratRow = (rowId) => {
        setZiaratRows(ziaratRows.filter(row => row.id !== rowId));
    };

    // Update ziarat row
    const updateZiaratRow = (rowId, field, value) => {
        setZiaratRows(prevRows => prevRows.map(row =>
            row.id === rowId ? { ...row, [field]: value } : row
        ));
    };

    // Auto-assign families based on passenger count
    const handleAutoAssignFamilies = () => {
        const totalPax = getTotalPax();
        if (totalPax === 0) {
            showToastMessage('Please add passengers first');
            return;
        }

        // If only 1 adult, create only 1 family (can't split families without adults)
        if (passengers.adults === 1) {
            setFamilies([{
                id: 1,
                adults: passengers.adults,
                children: passengers.children,
                infants: passengers.infants,
                assignments: {}
            }]);
            showToastMessage(`1 family created (only 1 adult available)`);
            return;
        }

        if (totalPax <= 4) {
            setFamilies([{
                id: 1,
                adults: passengers.adults,
                children: passengers.children,
                infants: passengers.infants,
                assignments: {}
            }]);
            showToastMessage(`1 family created with ${totalPax} members`);
        } else {
            // Split: Family 1 gets up to 4, Family 2 gets rest
            const family1Adults = Math.min(passengers.adults, 4);
            const family2Adults = passengers.adults - family1Adults;
            const family1Children = family1Adults < 4 ? Math.min(passengers.children, 4 - family1Adults) : 0;
            const family2Children = passengers.children - family1Children;
            const family1Infants = (family1Adults + family1Children) < 4 ? Math.min(passengers.infants, 4 - family1Adults - family1Children) : 0;
            const family2Infants = passengers.infants - family1Infants;

            setFamilies([
                { id: 1, adults: family1Adults, children: family1Children, infants: family1Infants, assignments: {} },
                { id: 2, adults: family2Adults, children: family2Children, infants: family2Infants, assignments: {} }
            ]);
            showToastMessage(`2 families created`);
        }
    };

    // Add new family manually
    const addNewFamily = () => {
        const newId = families.length > 0 ? Math.max(...families.map(f => f.id)) + 1 : 1;
        setFamilies([...families, { id: newId, adults: 0, children: 0, infants: 0, assignments: {} }]);
        showToastMessage(`Family ${newId} added`);
    };

    // Remove family and redistribute members to Family 1
    const removeFamily = (familyId) => {
        if (families.length === 1) {
            showToastMessage('Cannot remove the last family');
            return;
        }
        const familyToRemove = families.find(f => f.id === familyId);
        const updatedFamilies = families.filter(f => f.id !== familyId);
        if (updatedFamilies.length > 0 && familyToRemove) {
            updatedFamilies[0].adults += familyToRemove.adults || 0;
            updatedFamilies[0].children += familyToRemove.children || 0;
            updatedFamilies[0].infants += familyToRemove.infants || 0;
        }
        setFamilies(updatedFamilies);
        showToastMessage(`Family ${familyId} removed. Members redistributed to Family 1.`);
    };

    // Update family pax count (adults/children/infants)
    const updateFamilyPax = (familyId, field, newCount) => {
        const count = parseInt(newCount) || 0;

        // Validate adults >= 1
        if (field === 'adults' && count < 1) {
            showToastMessage('Every family must have at least 1 adult');
            return;
        }

        setFamilies(families.map(f =>
            f.id === familyId ? { ...f, [field]: count } : f
        ));
    };

    // Validate total family members equals total passengers
    const validateFamilyMembers = () => {
        const totalPax = getTotalPax();
        const totalFamilyAdults = families.reduce((sum, family) => sum + (family.adults || 0), 0);
        const totalFamilyChildren = families.reduce((sum, family) => sum + (family.children || 0), 0);
        const totalFamilyInfants = families.reduce((sum, family) => sum + (family.infants || 0), 0);
        const totalFamilyMembers = totalFamilyAdults + totalFamilyChildren + totalFamilyInfants;

        if (totalFamilyMembers > totalPax) {
            showToastMessage(`Error: Total family members (${totalFamilyMembers}) exceeds total passengers (${totalPax})`);
            return false;
        }

        // Check every family has at least 1 adult
        const familyWithoutAdult = families.find(f => (f.adults || 0) < 1);
        if (familyWithoutAdult) {
            showToastMessage(`Error: Family ${familyWithoutAdult.id} must have at least 1 adult`);
            return false;
        }

        return true;
    };

    // Show toast notification
    const showToastMessage = (message) => {
        setToastMessage(message);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 5000);
    };

    // --- PRICING LOGIC ---

    const calculatePrices = () => {
        const totalPax = passengers.adults + passengers.children + passengers.infants;
        const exchangeRate = riyalRate?.rate || 1;
        const isVisaPKR = riyalRate?.is_visa_pkr;

        let visaPrice = 0;
        let flightPrice = 0;
        let invoiceItems = [];

        // 1. Calculate Visa
        if (hasService('visa')) {
            let adultV = 0, childV = 0, infantV = 0;

            // Check if "Only Visa" or "Long Term" is selected
            const onlyVisaState = selectedOptions.find(id => id === 'only_visa' || id === 'long_term_visa');
            if (onlyVisaState) {
                const optName = onlyVisaState === 'only_visa' ? 'Only' : 'Long Term';
                const rate = onlyVisaRates.find(r => r.visa_option === optName);
                if (rate) {
                    adultV = rate.adult_selling;
                    childV = rate.child_selling;
                    infantV = rate.infant_selling;
                }
            } else {
                // Use Pax-wise rate for packages
                const rate = visaRatesPex.find(r => totalPax >= r.person_from && totalPax <= r.person_to);
                if (rate) {
                    adultV = rate.adult_selling;
                    childV = rate.child_selling;
                    infantV = rate.infant_selling;
                }
            }

            // Convert to PKR if needed
            if (!isVisaPKR) {
                adultV *= exchangeRate;
                childV *= exchangeRate;
                infantV *= exchangeRate;
            }

            const totalVisa = (adultV * passengers.adults) + (childV * passengers.children) + (infantV * passengers.infants);
            visaPrice = totalVisa;
            invoiceItems.push({
                desc: `Visa Processing (${passengers.adults}A, ${passengers.children}C, ${passengers.infants}I)`,
                subtotal: totalVisa
            });
        }

        // 2. Calculate Flight
        if (selectedFlight) {
            const adultF = selectedFlight.adult_selling || 0;
            const childF = selectedFlight.child_selling || 0;
            const infantF = selectedFlight.infant_selling || 0;

            const totalFlight = (adultF * passengers.adults) + (childF * passengers.children) + (infantF * passengers.infants);
            flightPrice = totalFlight;
            invoiceItems.push({
                desc: `Flight: ${selectedFlight.departure_trip.airline} (${selectedFlight.departure_trip.departure_city}-${selectedFlight.departure_trip.arrival_city})`,
                subtotal: totalFlight
            });
        }

        // 3. Calculate Hotels (disabled - no hotel state currently)
        const completedHotels = []; // TODO: Re-implement when hotel management is added
        if (completedHotels.length > 0) {
            completedHotels.forEach(hotel => {
                const nightlyRate = Number(hotel.price_per_night || 0);
                const nights = hotel.total_nights || 5;
                const hotelTotal = nightlyRate * nights * passengers.adults;

                invoiceItems.push({
                    desc: `Hotel: ${hotel.hotel_name} (${hotel.city} - ${nights} Nights)`,
                    subtotal: hotelTotal
                });
            });
        }

        // 4. Optional Add-ons (Mock for now, but following the pattern)
        if (includeFood) {
            const foodTotal = totalPax * 1500 * 10; // Mock: 1500 per day for 10 days
            invoiceItems.push({ desc: 'Food Services (Full Board - 10 Days)', subtotal: foodTotal });
        }

        if (includeZiarat) {
            const ziaratTotal = totalPax * 5000; // Mock: 5000 per person
            invoiceItems.push({ desc: 'Ziarat Tours (Makkah & Madinah)', subtotal: ziaratTotal });
        }

        const subtotal = invoiceItems.reduce((acc, item) => acc + item.subtotal, 0);

        return {
            items: invoiceItems,
            subtotal,
            visaPrice,
            flightPrice
        };
    };

    const pricing = calculatePrices();

    // Build per-family invoice data
    const buildFamilyInvoice = (family) => {
        const exchangeRate = riyalRate?.rate || 1;

        // Currency flags from riyal-rate settings
        const isVisaPKR = riyalRate?.is_visa_pkr ?? false; // false = rates are SAR
        const isHotelPKR = riyalRate?.is_hotel_pkr ?? false; // false = rates are SAR
        const isTransPKR = riyalRate?.is_transport_pkr ?? true;  // true  = rates are PKR
        const isFoodPKR = riyalRate?.is_food_pkr ?? true;  // true  = rates are PKR
        const isZiaratPKR = riyalRate?.is_ziarat_pkr ?? true;  // true  = rates are PKR

        // Helper: convert a native-currency amount to PKR
        const toPKR = (amount, isPKR) =>
            isPKR ? Math.round(amount) : Math.round(amount * exchangeRate);

        const familyPax = (family.adults || 0) + (family.children || 0) + (family.infants || 0);
        const totalPax = passengers.adults + passengers.children + passengers.infants || 1;
        const paxRatio = familyPax / totalPax;

        // --- Accommodation ---
        const accommodationRows = [];
        let accomNative = 0; // sum in the hotel's native currency
        if (family.assignments) {
            Object.entries(family.assignments).forEach(([hotelId, assignment]) => {
                const hotelRow = hotelRows.find(h => String(h.id) === String(hotelId));
                if (!hotelRow) return;
                const nights = hotelRow.total_nights || 0;
                const roomType = assignment.roomType || '-';
                const rate = Number(assignment.rate_sar) || 0;
                const qty = assignment.qty || 1;
                const netNative = rate * qty * nights;
                accomNative += netNative;
                accommodationRows.push({
                    hotel_name: hotelRow.hotel_name || '-',
                    type: roomType,
                    check_in: hotelRow.check_in || '-',
                    nights,
                    check_out: hotelRow.check_out || '-',
                    rate_native: rate,
                    qty,
                    net_native: netNative,
                    pkr_net: toPKR(netNative, isHotelPKR)
                });
            });
        }
        const accomPKR = toPKR(accomNative, isHotelPKR);

        // --- Transport ---
        const transportRate = selectedVehicle ? (selectedVehicle.adult_selling || 0) : 0;
        const transportNative = transportRate * familyPax;
        const transportNetPKR = toPKR(transportNative, isTransPKR);

        // --- Visa ---
        let adultVisaRate = 0, childVisaRate = 0, infantVisaRate = 0;
        if (selectedVisaRate) {
            adultVisaRate = Number(selectedVisaRate.adult_selling || 0);
            childVisaRate = Number(selectedVisaRate.child_selling || 0);
            infantVisaRate = Number(selectedVisaRate.infant_selling || 0);
        }
        const totalVisaNative = (adultVisaRate * (family.adults || 0)) +
            (childVisaRate * (family.children || 0)) +
            (infantVisaRate * (family.infants || 0));
        const totalVisaPKR = toPKR(totalVisaNative, isVisaPKR);

        // --- Tickets (always PKR) ---
        const adultTicket = selectedFlight ? (selectedFlight.adult_selling || 0) : 0;
        const childTicket = selectedFlight ? (selectedFlight.child_selling || 0) : 0;
        const infantTicket = selectedFlight ? (selectedFlight.infant_selling || 0) : 0;
        const totalTicketPKR = (adultTicket * (family.adults || 0)) +
            (childTicket * (family.children || 0)) +
            (infantTicket * (family.infants || 0));

        // --- Food ---
        let foodNative = 0;
        foodRows.forEach(foodRow => {
            if (!foodRow.food_id) return;
            const item = foodPrices.find(f => String(f.id || f._id) === String(foodRow.food_id));
            if (!item) return;
            const days = calculateNights(foodRow.startDate, foodRow.endDate) || 1;
            foodNative += ((item.adult_selling || 0) * (family.adults || 0) +
                (item.child_selling || 0) * (family.children || 0) +
                (item.infant_selling || 0) * (family.infants || 0)) * days;
        });
        const foodPKR = toPKR(foodNative, isFoodPKR);

        // --- Ziarat ---
        let ziaratNative = 0;
        ziaratRows.forEach(zRow => {
            if (!zRow.ziarat_id) return;
            const item = ziaratPrices.find(z => String(z.id || z._id) === String(zRow.ziarat_id));
            if (!item) return;
            ziaratNative += (item.adult_selling || 0) * (family.adults || 0) +
                (item.child_selling || 0) * (family.children || 0) +
                (item.infant_selling || 0) * (family.infants || 0);
        });
        const ziaratPKR = toPKR(ziaratNative, isZiaratPKR);

        // --- Net PKR ---
        const netPKR = totalVisaPKR + totalTicketPKR + transportNetPKR + accomPKR + foodPKR + ziaratPKR;

        return {
            familyPax,
            // flags (for display)
            isVisaPKR, isHotelPKR, isTransPKR, isFoodPKR, isZiaratPKR,
            exchangeRate,
            // accommodation
            accommodationRows,
            accomNative,
            accomPKR,
            // transport
            transportRate,
            transportNative,
            transportNetPKR,
            // visa
            adultVisaRate, childVisaRate, infantVisaRate,
            totalVisaNative,
            totalVisaPKR,
            // tickets
            adultTicket, childTicket, infantTicket,
            totalTicketPKR,
            // food & ziarat
            foodNative, foodPKR,
            ziaratNative, ziaratPKR,
            netPKR
        };
    };

    // Check if an option is visually selected
    const isSelected = (id) => selectedOptions.includes(id);

    // Check if an option should be disabled
    const isDisabled = (option) => {
        // 1. If a Full Package (VTTH) is selected, everything else is disabled
        if (selectedOptions.includes('visa_transport_ticket_hotel') && option.id !== 'visa_transport_ticket_hotel') return true;

        // 2. If a user tries to select a "component" (e.g. Hotels) but it's already included in a selected package (e.g. VTH), disable it
        //    (Because VTH already has hotels, you don't select 'hotels' separately)
        if (option.type === 'component') {
            // Find any selected package
            const selectedPackageId = selectedOptions.find(id => {
                const opt = bookingOptions.find(o => o.id === id);
                return opt?.type === 'package';
            });
            if (selectedPackageId) {
                const selectedPackage = bookingOptions.find(o => o.id === selectedPackageId);
                // If the package already contains this component, disable the component button
                if (selectedPackage.contains.some(c => option.contains.includes(c))) return true;
            }
        }

        // 3. Mutual Exclusivity for Packages and Visas (Group A vs Group B vs Each Other)
        if (option.type === 'package' || option.type === 'visa') {
            // If ANY other package or visa is selected, disable this one (unless it's the one currently selected)
            const hasOtherBaseSelected = selectedOptions.some(id => {
                const opt = bookingOptions.find(o => o.id === id);
                return (opt?.type === 'package' || opt?.type === 'visa') && id !== option.id;
            });
            if (hasOtherBaseSelected && !isSelected(option.id)) return true;
        }

        return false;
    };

    const toggleSelection = (optionId) => {
        const option = bookingOptions.find(o => o.id === optionId);
        if (!option) return;

        // If clicking the currently selected Base (Package/Visa), do usually nothing? OR allow unselect?
        // User implied "at least one option must be selected", so maybe don't allow unselecting the last base?
        // For now, standard toggle.
        if (isSelected(optionId)) {
            // Allow unselecting? Let's say yes for flexibility, unless it leaves empty?
            // But if I unselect VTTH, I should probably just clear it.
            setSelectedOptions(prev => prev.filter(id => id !== optionId));
            return;
        }

        // If Selecting a Base (Package or Visa):
        if (option.type === 'package' || option.type === 'visa') {
            // Clear any EXISTING Base (Package/Visa)
            // Also, logic: "Select VTTH -> Disable Everything". 
            // So if picking VTTH, clear EVERYTHING.
            if (optionId === 'visa_transport_ticket_hotel') {
                setSelectedOptions(['visa_transport_ticket_hotel']);
                return;
            }

            // If picking VTH, VT, OnlyVisa, LongTerm: 
            // 1. Remove any other Base.
            // 2. Remove any Components that are now included in the new Base?
            const newSelection = selectedOptions.filter(id => {
                const opt = bookingOptions.find(o => o.id === id);
                return opt.type === 'component'; // Keep components for now, filter conflicts next
            });

            // Filter out components that conflict/are redundant with new base
            const finalSelection = newSelection.filter(compId => {
                const comp = bookingOptions.find(o => o.id === compId);
                // If new base (option) contains the component's service, remove component
                return !option.contains.some(c => comp.contains.includes(c));
            });

            setSelectedOptions([...finalSelection, optionId]);
        }
        // If Selecting a Component (Hotels, Transport, Tickets)
        else {
            setSelectedOptions(prev => [...prev, optionId]);
        }
    };


    // Helper Components
    const StepIndicator = () => (
        <div className="flex items-center justify-center mb-10">
            {[1, 2, 3].map((step) => (
                <React.Fragment key={step}>
                    <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black transition-all ${currentStep === step ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' :
                            currentStep > step ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                            }`}>
                            {currentStep > step ? <CheckCircle2 size={20} /> : step}
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest mt-2 ${currentStep === step ? 'text-blue-600' : 'text-slate-400'}`}>
                            {step === 1 ? 'Config' : step === 2 ? 'Builder' : 'Invoice'}
                        </span>
                    </div>
                    {step < 3 && <div className={`w-20 h-0.5 mx-4 mb-4 ${currentStep > step ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
                </React.Fragment>
            ))}
        </div>
    );

    const Counter = ({ label, value, onInc, onDec }) => (
        <div className="flex-1 flex items-center justify-between p-6 bg-white border border-slate-200 rounded-[2rem] shadow-sm">
            <div className="flex flex-col">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">{label}</span>
            </div>
            <div className="flex items-center gap-4">
                <button onClick={onDec} className="w-10 h-10 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 transition-all"><Minus size={18} /></button>
                <span className="text-lg font-black text-slate-900 w-6 text-center">{value}</span>
                <button onClick={onInc} className="w-10 h-10 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 transition-all"><Plus size={18} /></button>
            </div>
        </div>
    );

    const FormField = ({ label, placeholder, type = "text", icon: Icon, options = null }) => (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] ml-1">{label}</label>
            <div className="relative">
                {Icon && <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />}
                {options ? (
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 appearance-none">
                        {options.map(opt => <option key={opt}>{opt}</option>)}
                    </select>
                ) : (
                    <input
                        type={type}
                        placeholder={placeholder}
                        className={`w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 ${Icon ? 'pl-11' : 'px-4'} pr-4 text-sm font-bold text-slate-700 focus:border-blue-500 outline-none transition-all`}
                    />
                )}
            </div>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 pb-32">

            <StepIndicator />

            {/* STEP 1: CONFIGURATION */}
            {currentStep === 1 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="text-center">
                        <h3 className="text-2xl font-black text-slate-900">Define Your Package</h3>
                        <p className="text-slate-400 text-sm mt-1">Select the services and group size to begin</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {bookingOptions.map((opt) => {
                            const active = isSelected(opt.id);
                            const disabled = isDisabled(opt);

                            return (
                                <button
                                    key={opt.id}
                                    onClick={() => !disabled && toggleSelection(opt.id)}
                                    disabled={disabled}
                                    className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center gap-3 relative h-32 group 
                                    ${active
                                            ? 'border-blue-600 bg-white shadow-lg shadow-blue-600/10 scale-105 ring-2 ring-blue-100 cursor-pointer'
                                            : disabled
                                                ? 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed grayscale'
                                                : 'border-slate-100 bg-white text-slate-400 hover:border-blue-200 hover:shadow-md cursor-pointer'
                                        }`}
                                >
                                    <div className={`p-2.5 rounded-xl transition-colors 
                                    ${active
                                            ? 'bg-blue-600 text-white'
                                            : disabled
                                                ? 'bg-slate-100 text-slate-300'
                                                : 'bg-slate-50 text-slate-300 group-hover:text-blue-600 group-hover:bg-blue-50'
                                        }`}>
                                        <opt.icon size={24} />
                                    </div>
                                    <span className={`text-[10px] font-black text-center leading-tight uppercase tracking-wider px-2 transition-colors
                                     ${active
                                            ? 'text-black'
                                            : disabled
                                                ? 'text-slate-300'
                                                : 'text-black group-hover:text-blue-600'
                                        }`}>
                                        {opt.label}
                                    </span>
                                </button>
                            )
                        })}
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                        <Counter label="Adults" value={passengers.adults} onInc={() => setPassengers({ ...passengers, adults: passengers.adults + 1 })} onDec={() => setPassengers({ ...passengers, adults: Math.max(1, passengers.adults - 1) })} />
                        <Counter label="Children" value={passengers.children} onInc={() => setPassengers({ ...passengers, children: passengers.children + 1 })} onDec={() => setPassengers({ ...passengers, children: Math.max(0, passengers.children - 1) })} />
                        <Counter label="Infants" value={passengers.infants} onInc={() => setPassengers({ ...passengers, infants: passengers.infants + 1 })} onDec={() => setPassengers({ ...passengers, infants: Math.max(0, passengers.infants - 1) })} />
                    </div>

                    <div className="flex justify-center pt-8">
                        {/* Only allow Next if at least one thing is selected? */}
                        <button
                            onClick={() => selectedOptions.length > 0 && setCurrentStep(2)}
                            disabled={selectedOptions.length === 0}
                            className={`px-12 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center gap-3
                                ${selectedOptions.length > 0
                                    ? 'bg-blue-600 text-white shadow-blue-600/30 hover:scale-105 cursor-pointer'
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                        >
                            Next: Build Package <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 2: BUILDER (DYNAMIC) */}
            {currentStep === 2 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">

                    {/* ─── 1. VISA ─── */}
                    {hasService('visa') && (
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center">
                                    <Ticket size={22} />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-slate-900 tracking-tight">Visa Charges</h4>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                                        Pax-wise pricing breakdown
                                    </p>
                                </div>
                            </div>

                            {visaPriceBreakdown ? (
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                                    {/* Rate Title */}
                                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-blue-200">
                                        <span className="text-xs font-black text-blue-900 uppercase tracking-wider">
                                            {visaPriceBreakdown.rateTitle}
                                        </span>
                                        <span className="text-xs font-bold text-blue-600">
                                            Pax Range: {calculatePaxRange()} (Adults + Children)
                                        </span>
                                    </div>

                                    {/* Price Breakdown */}
                                    <div className="space-y-3">
                                        {/* Adults */}
                                        {passengers.adults > 0 && (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Users size={16} className="text-blue-600" />
                                                    <span className="text-sm font-bold text-slate-700">
                                                        Adults: {passengers.adults} × {visaPriceBreakdown.symbol}{visaPriceBreakdown.perAdult.toLocaleString()}
                                                    </span>
                                                </div>
                                                <span className="text-sm font-black text-slate-900">
                                                    {visaPriceBreakdown.symbol}{visaPriceBreakdown.adultPrice.toLocaleString()}
                                                </span>
                                            </div>
                                        )}

                                        {/* Children */}
                                        {passengers.children > 0 && (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Users size={16} className="text-blue-600" />
                                                    <span className="text-sm font-bold text-slate-700">
                                                        Children: {passengers.children} × {visaPriceBreakdown.symbol}{visaPriceBreakdown.perChild.toLocaleString()}
                                                    </span>
                                                </div>
                                                <span className="text-sm font-black text-slate-900">
                                                    {visaPriceBreakdown.symbol}{visaPriceBreakdown.childPrice.toLocaleString()}
                                                </span>
                                            </div>
                                        )}

                                        {/* Infants */}
                                        {passengers.infants > 0 && (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Users size={16} className="text-blue-600" />
                                                    <span className="text-sm font-bold text-slate-700">
                                                        Infants: {passengers.infants} × {visaPriceBreakdown.symbol}{visaPriceBreakdown.perInfant.toLocaleString()}
                                                    </span>
                                                </div>
                                                <span className="text-sm font-black text-slate-900">
                                                    {visaPriceBreakdown.symbol}{visaPriceBreakdown.infantPrice.toLocaleString()}
                                                </span>
                                            </div>
                                        )}

                                        {/* Total */}
                                        <div className="border-t-2 border-blue-200 pt-3 mt-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-base font-black text-blue-900 uppercase tracking-wider">
                                                    Total Visa Charges:
                                                </span>
                                                <span className="text-xl font-black text-blue-900">
                                                    {visaPriceBreakdown.symbol}{visaPriceBreakdown.total.toLocaleString()}
                                                </span>
                                            </div>

                                            {/* Currency Conversion Note */}
                                            {visaPriceBreakdown.currency === 'SAR' && (
                                                <p className="text-[10px] text-blue-600 mt-2 font-bold bg-blue-50 p-2 rounded-lg border border-blue-100 inline-block">
                                                    💱 Payable in PKR: ₨{visaPriceBreakdown.pkrTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                    <span className="text-blue-400 ml-1 font-normal">(Rate: {visaPriceBreakdown.exchangeRate})</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-red-50 rounded-2xl p-6 border border-red-200">
                                    <div className="flex items-center gap-3">
                                        <X size={20} className="text-red-600" />
                                        <div>
                                            <p className="text-sm font-black text-red-900">No Visa Rate Available</p>
                                            <p className="text-xs text-red-600 mt-1">
                                                No visa rate found for {calculatePaxRange()} passengers (adults + children).
                                                Please adjust passenger count or contact support.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ─── 2. FLIGHT ─── */}
                    {/* Flight Section Logic:
                        1. Inventory Mode: If 'tickets' service is selected (full package, tickets only) -> Show Search/Select
                        2. Manual Mode: If 'visa' is selected BUT 'tickets' is NOT (VTH, VT, Only Visa) -> Show Manual Input for Visa processing
                    */}
                    {hasService('tickets') ? (
                        /* INVENTORY MODE */
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><Plane size={22} /></div>
                                <div>
                                    <h4 className="text-lg font-black text-slate-900 tracking-tight">Select Flights</h4>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Search Live Inventory</p>
                                </div>
                            </div>
                            {/* Inventory Search Interface */}
                            {!selectedFlight ? (
                                <button
                                    onClick={() => setShowFlightModal(true)}
                                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                                >
                                    Search Flights
                                </button>
                            ) : null}
                            {selectedFlight && (
                                <div className="mt-4 p-6 bg-blue-50/50 rounded-3xl border border-blue-100 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm"><Plane size={16} /></div>
                                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Selected Flight Portfolio</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setShowFlightModal(true)} className="text-blue-600 hover:text-blue-700 font-bold text-[10px] uppercase tracking-widest px-3 py-1 bg-white rounded-lg shadow-sm border border-blue-50 transition-all">Change</button>
                                            <button onClick={() => setSelectedFlight(null)} className="text-red-500 hover:text-red-600 font-bold text-[10px] uppercase tracking-widest px-3 py-1 bg-white rounded-lg shadow-sm border border-red-50 transition-all">Remove</button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Outbound */}
                                        <div className="bg-white p-4 rounded-2xl border border-blue-50">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Outbound • {selectedFlight.departure_trip.airline}</span>
                                                <span className="text-[10px] font-black text-slate-900">{selectedFlight.departure_trip.flight_number}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="text-center">
                                                    <p className="text-xs font-black text-slate-900 leading-none">{new Date(selectedFlight.departure_trip.departure_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{selectedFlight.departure_trip.departure_city}</p>
                                                </div>
                                                <div className="h-px bg-slate-100 flex-1 mx-3 relative">
                                                    <Plane size={8} className="text-slate-200 absolute left-1/2 -top-1 -translate-x-1/2" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-xs font-black text-slate-900 leading-none">{new Date(selectedFlight.departure_trip.arrival_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{selectedFlight.departure_trip.arrival_city}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Inbound (If exists) */}
                                        {selectedFlight.return_trip && (
                                            <div className="bg-white p-4 rounded-2xl border border-blue-50">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Inbound • {selectedFlight.return_trip.airline}</span>
                                                    <span className="text-[10px] font-black text-slate-900">{selectedFlight.return_trip.flight_number}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="text-center">
                                                        <p className="text-xs font-black text-slate-900 leading-none">{new Date(selectedFlight.return_trip.departure_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{selectedFlight.return_trip.departure_city}</p>
                                                    </div>
                                                    <div className="h-px bg-slate-100 flex-1 mx-3 relative">
                                                        <Plane size={8} className="text-slate-200 absolute left-1/2 -top-1 -translate-x-1/2 rotate-180" />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-xs font-black text-slate-900 leading-none">{new Date(selectedFlight.return_trip.arrival_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{selectedFlight.return_trip.arrival_city}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {selectedFlight.pnr && (
                                        <div className="pt-3 border-t border-blue-100 flex items-center justify-between">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Global PNR Reference</span>
                                            <span className="text-xs font-black text-slate-900 px-2 py-0.5 bg-white rounded-lg shadow-sm border border-blue-50">{selectedFlight.pnr}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : hasService('visa') ? (
                        /* MANUAL MODE (For Visa) */
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center"><Plane size={22} /></div>
                                <div>
                                    <h4 className="text-lg font-black text-slate-900 tracking-tight">Flight Details</h4>
                                    <p className="text-xs text-red-400 font-bold uppercase tracking-wider">Required for Visa Processing</p>
                                </div>
                            </div>
                            {/* Manual Entry Interface */}
                            {!selectedFlight && (
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <FormField label="Airline" placeholder="e.g. Saudia, PIA" />
                                    <FormField label="Flight No" placeholder="e.g. SV-786" />
                                    <FormField label="Route" placeholder="e.g. KHI -> JED" />
                                    <FormField label="Arrival Date" type="date" />
                                </div>
                            )}
                        </div>
                    ) : null}

                    {/* ─── 3. TRANSPORT ─── */}
                    {hasService('transport') && (
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                                    <MapPin size={22} />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-slate-900 tracking-tight">Transport Selection</h4>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Vehicle & sector selection</p>
                                </div>
                            </div>

                            {/* Vehicle + Sector row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-black text-slate-600 uppercase tracking-wider mb-2 block">Select Vehicle</label>
                                    <select
                                        value={selectedVehicle?._id || ''}
                                        onChange={(e) => {
                                            const vehicle = getAvailableVehicles().find(v => v._id === e.target.value);
                                            setSelectedVehicle(vehicle || null);
                                        }}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                                    >
                                        <option value="">Select vehicle...</option>
                                        {getAvailableVehicles().map(vehicle => (
                                            <option key={vehicle._id} value={vehicle._id}>
                                                {formatVehicleOption(vehicle)}
                                            </option>
                                        ))}
                                    </select>
                                    {getAvailableVehicles().length === 0 && (
                                        <p className="text-xs text-red-500 mt-2 font-bold">No vehicles available for this visa package</p>
                                    )}
                                </div>

                                <div>
                                    <label className="text-xs font-black text-slate-600 uppercase tracking-wider mb-2 block">Sector Route</label>
                                    <input
                                        type="text"
                                        value={selectedVehicle?.sector || ''}
                                        readOnly
                                        className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 cursor-not-allowed"
                                        placeholder="Select vehicle first..."
                                    />
                                </div>
                            </div>

                            {/* Selected vehicle price badge */}
                            {selectedVehicle && (
                                <div className="mt-4 bg-amber-50 rounded-2xl p-4 border border-amber-200 flex flex-wrap items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <MapPin size={14} className="text-amber-600" />
                                        <span className="text-xs font-black text-amber-900 uppercase tracking-wider">{selectedVehicle.vehicle_type}</span>
                                    </div>
                                    <div className="text-xs font-bold text-amber-700">{selectedVehicle.vehicle_name}</div>
                                    {selectedVehicle.adult_selling > 0 && (
                                        <div className="ml-auto text-right">
                                            <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Per Person</p>
                                            <p className="text-base font-black text-amber-900">PKR {(selectedVehicle.adult_selling || 0).toLocaleString()}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ─── 4. HOTELS ─── */}
                    {/* Hotel & Family Management Section: Show when 'hotels' service is selected */}
                    {hasService('hotels') && (
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                            {/* Hotel Selection Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                                        <Hotel size={22} />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-slate-900 tracking-tight">Hotel Selection</h4>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Add hotels for accommodation</p>
                                    </div>
                                </div>
                                <button
                                    onClick={addHotelRow}
                                    className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                                >
                                    <Plus size={14} /> Add Hotel
                                </button>
                            </div>

                            {/* Transport sector info banner */}
                            {selectedVehicle?.sector_id && (
                                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3">
                                    <MapPin size={16} className="text-amber-600 shrink-0" />
                                    <p className="text-xs font-black text-amber-900">
                                        Transport sector requires at least <span className="underline">{hotelRows.length} hotel{hotelRows.length !== 1 ? 's' : ''}</span> — one per stop. Select a hotel for each row below.
                                    </p>
                                </div>
                            )}

                            {/* Hotel Rows */}
                            <div className="space-y-4">
                                {hotelRows.map((row, index) => (
                                    <div key={row.id} className="bg-slate-50/50 rounded-2xl p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <h5 className="text-xs font-black text-slate-600 uppercase tracking-wider">
                                                    Hotel {index + 1}
                                                </h5>
                                                {row._sectorType && (
                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${row._sectorType === 'AIRPORT PICKUP'
                                                        ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                                        : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                        }`}>
                                                        {row._sectorType}
                                                    </span>
                                                )}
                                            </div>
                                            {hotelRows.length > 1 && (
                                                <button
                                                    onClick={() => removeHotelRow(row.id)}
                                                    className="text-red-500 hover:text-red-600 font-bold text-xs uppercase tracking-wider px-3 py-1 bg-white rounded-lg transition-all flex items-center gap-1"
                                                >
                                                    <X size={14} /> Remove
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div className="relative">
                                                <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 block">
                                                    Hotel Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={row.searchQuery || row.hotel_name || ''}
                                                    onChange={(e) => handleHotelSearchChange(row.id, e.target.value)}
                                                    onFocus={() => { if (!row.hotel_id) handleHotelSearchChange(row.id, '') }}
                                                    placeholder="Search hotel..."
                                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:border-emerald-500 outline-none transition-all"
                                                />

                                                {/* Search Results Dropdown */}
                                                {(row.searchQuery !== undefined && row.searchQuery !== '') && (
                                                    <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                                                        {hotels.filter(h =>
                                                            h.hotel_name.toLowerCase().includes(row.searchQuery.toLowerCase()) ||
                                                            h.city.toLowerCase().includes(row.searchQuery.toLowerCase())
                                                        ).map(hotel => (
                                                            <button
                                                                key={hotel.id}
                                                                onClick={() => selectHotelFromSearch(row.id, hotel)}
                                                                className="w-full text-left px-5 py-4 hover:bg-emerald-50 border-b border-slate-50 last:border-0 transition-colors group"
                                                            >
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-black text-slate-900 group-hover:text-emerald-700">{hotel.hotel_name}</span>
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{hotel.city}</span>
                                                                </div>
                                                            </button>
                                                        ))}
                                                        {hotels.filter(h =>
                                                            h.hotel_name.toLowerCase().includes(row.searchQuery.toLowerCase()) ||
                                                            h.city.toLowerCase().includes(row.searchQuery.toLowerCase())
                                                        ).length === 0 && (
                                                                <div className="p-6 text-center text-slate-400">
                                                                    <p className="text-xs font-bold">No hotels found</p>
                                                                </div>
                                                            )}
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 block">
                                                    Check-in Date
                                                </label>
                                                <input
                                                    type="date"
                                                    value={row.check_in}
                                                    onChange={(e) => handleHotelRowChange(row.id, 'check_in', e.target.value)}
                                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:border-emerald-500 outline-none transition-all"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 block">
                                                    Check-out Date
                                                </label>
                                                <input
                                                    type="date"
                                                    value={row.check_out}
                                                    onChange={(e) => handleHotelRowChange(row.id, 'check_out', e.target.value)}
                                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:border-emerald-500 outline-none transition-all"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 block">
                                                    Total Nights
                                                </label>
                                                <input
                                                    type="number"
                                                    value={row.total_nights}
                                                    disabled
                                                    className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-bold text-slate-500 cursor-not-allowed"
                                                    title="Auto-calculated from check-in and check-out dates"
                                                />
                                            </div>
                                        </div>

                                        {/* Show hotel info when selected */}
                                        {row.hotel_id && (
                                            <div className="mt-3 flex items-center gap-2 text-xs text-emerald-600 font-bold">
                                                <CheckCircle2 size={14} />
                                                <span>{row.hotel_name} selected</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Family Management Section */}
                            <div className="bg-blue-50/50 rounded-2xl p-6 border-2 border-blue-100 mt-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center">
                                            <Users size={18} />
                                        </div>
                                        <div>
                                            <h5 className="text-sm font-black text-slate-900 uppercase tracking-wider">Family Management</h5>
                                            <p className="text-xs text-slate-500 font-bold">Total Passengers: {getTotalPax()} | Families: {families.length}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleAutoAssignFamilies}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                                        >
                                            <Users size={14} /> Auto Assign
                                        </button>
                                        <button
                                            onClick={addNewFamily}
                                            className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 border-2 border-blue-600 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-blue-50 transition-all"
                                        >
                                            <Plus size={14} /> Add Family
                                        </button>
                                    </div>
                                </div>

                                {/* Show message if no families */}
                                {families.length === 0 && (
                                    <div className="text-center py-8 text-slate-400">
                                        <Users size={48} className="mx-auto mb-3 opacity-30" />
                                        <p className="font-bold text-sm">No families assigned yet</p>
                                        <p className="text-xs mt-1">Click "Auto Assign" to automatically divide passengers</p>
                                    </div>
                                )}

                                {/* Family Cards */}
                                {families.length > 0 && (
                                    <div className="space-y-4">
                                        {families.map((family) => (
                                            <div key={family.id} className="bg-white rounded-2xl p-5 border-2 border-blue-200">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-sm">
                                                            {family.id}
                                                        </div>
                                                        <div>
                                                            <h6 className="text-sm font-black text-slate-900">Family {family.id}</h6>
                                                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                                                                {/* Adults Input */}
                                                                <div className="flex items-center gap-1">
                                                                    <label className="text-xs font-bold text-slate-500">Adults:</label>
                                                                    <input
                                                                        type="number"
                                                                        min="1"
                                                                        value={family.adults || 0}
                                                                        onChange={(e) => updateFamilyPax(family.id, 'adults', e.target.value)}
                                                                        className={`w-14 px-2 py-1 bg-slate-50 border ${(family.adults || 0) < 1 ? 'border-red-500' : 'border-slate-200'} rounded-lg text-xs font-bold text-slate-700 focus:border-blue-500 outline-none`}
                                                                    />
                                                                </div>

                                                                {/* Children Input */}
                                                                <div className="flex items-center gap-1">
                                                                    <label className="text-xs font-bold text-slate-500">Children:</label>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        value={family.children || 0}
                                                                        onChange={(e) => updateFamilyPax(family.id, 'children', e.target.value)}
                                                                        className="w-14 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:border-blue-500 outline-none"
                                                                    />
                                                                </div>

                                                                {/* Infants Input */}
                                                                <div className="flex items-center gap-1">
                                                                    <label className="text-xs font-bold text-slate-500">Infants:</label>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        value={family.infants || 0}
                                                                        onChange={(e) => updateFamilyPax(family.id, 'infants', e.target.value)}
                                                                        className="w-14 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:border-blue-500 outline-none"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => removeFamily(family.id)}
                                                        className="text-red-500 hover:text-red-600 font-bold text-xs uppercase tracking-wider px-3 py-1 bg-red-50 rounded-lg transition-all flex items-center gap-1"
                                                    >
                                                        <X size={14} /> Remove
                                                    </button>
                                                </div>

                                                {/* Room Type Selection per Hotel */}
                                                {getCompletedHotels().length > 0 && (
                                                    <div className="mt-4 space-y-3">
                                                        <h6 className="text-xs font-black text-slate-600 uppercase tracking-wider">Room Assignments</h6>
                                                        {getCompletedHotels().map((hotel, hotelIndex) => {
                                                            const assignment = family.assignments?.[hotel.id] || {};
                                                            return (
                                                                <div key={hotel.id} className="bg-slate-50 rounded-xl p-3">
                                                                    <p className="text-xs font-bold text-slate-500 mb-2">
                                                                        {hotel.hotel_name} ({hotel.city})
                                                                    </p>
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        {/* Room Type Dropdown */}
                                                                        <div className="flex-1 min-w-[140px]">
                                                                            <select
                                                                                value={assignment.roomType || ''}
                                                                                onChange={(e) => updateRoomAssignment(family.id, hotel.id, 'roomType', e.target.value)}
                                                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:border-blue-500 outline-none"
                                                                            >
                                                                                <option value="">Select room type...</option>
                                                                                {getAvailableRoomTypes(family, hotel.id).map(type => (
                                                                                    <option key={type} value={type}>{type}</option>
                                                                                ))}
                                                                            </select>
                                                                        </div>

                                                                        {/* Rate Input */}
                                                                        <div className="min-w-[100px]">
                                                                            <div className="relative">
                                                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400">
                                                                                    {riyalRate?.is_hotel_pkr ? 'PKR' : 'SAR'}
                                                                                </span>
                                                                                <input
                                                                                    type="number"
                                                                                    min="0"
                                                                                    placeholder="Rate"
                                                                                    value={assignment.rate_sar || ''}
                                                                                    onChange={(e) => updateRoomAssignment(family.id, hotel.id, 'rate_sar', parseFloat(e.target.value) || 0)}
                                                                                    className="w-full pl-9 pr-2 py-2 bg-white border border-amber-200 rounded-lg text-xs font-bold text-slate-700 focus:border-amber-500 outline-none"
                                                                                />
                                                                            </div>
                                                                        </div>

                                                                        {/* QTY Input */}
                                                                        <div className="min-w-[70px]">
                                                                            <div className="relative">
                                                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400">QTY</span>
                                                                                <input
                                                                                    type="number"
                                                                                    min="1"
                                                                                    placeholder="1"
                                                                                    value={assignment.qty || 1}
                                                                                    onChange={(e) => updateRoomAssignment(family.id, hotel.id, 'qty', parseInt(e.target.value) || 1)}
                                                                                    className="w-full pl-9 pr-2 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:border-blue-500 outline-none"
                                                                                />
                                                                            </div>
                                                                        </div>

                                                                        {/* Sharing Type Dropdown (only if Sharing selected) */}
                                                                        {assignment.roomType === 'Sharing' && (
                                                                            <div className="flex-1 min-w-[140px]">
                                                                                <select
                                                                                    value={assignment.sharingType || ''}
                                                                                    onChange={(e) => updateRoomAssignment(family.id, hotel.id, 'sharingType', e.target.value)}
                                                                                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-xs font-bold text-blue-700 focus:border-blue-500 outline-none"
                                                                                >
                                                                                    <option value="">Select sharing type...</option>
                                                                                    {SHARING_TYPES.map(type => (
                                                                                        <option key={type} value={type}>{type}</option>
                                                                                    ))}
                                                                                </select>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}


                    {/* Food Section */}
                    {foodRows.length > 0 && (
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                                    <Utensils size={22} />
                                </div>
                                <h4 className="text-lg font-black text-slate-900 tracking-tight">
                                    Food Services
                                </h4>
                            </div>

                            {foodRows.map((row, index) => (
                                <div key={row.id} className="bg-slate-50 p-6 rounded-2xl mb-4 border border-slate-200">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
                                            Food #{index + 1}
                                        </span>
                                        <button
                                            onClick={() => removeFoodRow(row.id)}
                                            className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {/* City - Searchable */}
                                        <div>
                                            <label className="text-xs font-black text-slate-600 uppercase tracking-wider mb-2 block">
                                                City
                                            </label>
                                            <select
                                                value={row.city}
                                                onChange={(e) => {
                                                    const selectedCity = e.target.value;
                                                    console.log('🍽️ Food city changed to:', selectedCity);
                                                    updateFoodRow(row.id, 'city', selectedCity);
                                                    updateFoodRow(row.id, 'food_id', '');
                                                }}
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                                            >
                                                <option value="">Select city...</option>
                                                {getFoodCities().map(city => (
                                                    <option key={city} value={city}>{city}</option>
                                                ))}
                                            </select>
                                            {getFoodCities().length === 0 && (
                                                <p className="text-xs text-red-500 mt-1 font-semibold">⚠️ No food data loaded. Check API connection.</p>
                                            )}
                                        </div>

                                        {/* Food - Dynamically Enabled */}
                                        <div>
                                            <label className="text-xs font-black text-slate-600 uppercase tracking-wider mb-2 block">
                                                Food {row.city && `(${getFoodForCity(row.city).length} options)`}
                                            </label>
                                            <select
                                                value={row.food_id}
                                                onChange={(e) => {
                                                    const selectedFood = e.target.value;
                                                    console.log('🍽️ Food selected:', selectedFood);
                                                    updateFoodRow(row.id, 'food_id', selectedFood);
                                                }}
                                                disabled={!row.city || getFoodForCity(row.city).length === 0}
                                                className={`w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 outline-none transition-all ${!row.city || getFoodForCity(row.city).length === 0
                                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                    : 'bg-white text-slate-700 focus:border-amber-500 focus:ring-amber-200'
                                                    }`}
                                            >
                                                <option value="">
                                                    {!row.city ? 'Select city first...' : 'Select food...'}
                                                </option>
                                                {row.city && getFoodForCity(row.city).map(food => {
                                                    console.log('🍽️ Rendering food option:', food.title, 'ID:', food._id);
                                                    return (
                                                        <option key={food._id} value={food._id}>
                                                            {food.title}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                            {row.city && getFoodForCity(row.city).length === 0 && (
                                                <p className="text-xs text-amber-600 mt-1 font-semibold">⚠️ No food available for {row.city}</p>
                                            )}
                                        </div>

                                        {/* Self Pickup */}
                                        <div className="flex items-center pt-8">
                                            <input
                                                type="checkbox"
                                                checked={row.selfPickup}
                                                onChange={(e) => updateFoodRow(row.id, 'selfPickup', e.target.checked)}
                                                className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                                            />
                                            <label className="ml-3 text-sm font-bold text-slate-700">
                                                Self Pickup
                                            </label>
                                        </div>

                                        {/* Start Date */}
                                        <div>
                                            <label className="text-xs font-black text-slate-600 uppercase tracking-wider mb-2 block">
                                                Start Date
                                            </label>
                                            <input
                                                type="date"
                                                value={row.startDate}
                                                onChange={(e) => updateFoodRow(row.id, 'startDate', e.target.value)}
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                                            />
                                        </div>

                                        {/* End Date */}
                                        <div>
                                            <label className="text-xs font-black text-slate-600 uppercase tracking-wider mb-2 block">
                                                End Date
                                            </label>
                                            <input
                                                type="date"
                                                value={row.endDate}
                                                onChange={(e) => updateFoodRow(row.id, 'endDate', e.target.value)}
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={addFoodRow}
                                className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-black text-xs uppercase tracking-[0.2em] hover:bg-amber-50 hover:border-amber-300 hover:text-amber-600 transition-all"
                            >
                                <Plus size={16} /> Add Another Food
                            </button>
                        </div>
                    )}

                    {/* Ziarat Section */}
                    {ziaratRows.length > 0 && (
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center">
                                    <Landmark size={22} />
                                </div>
                                <h4 className="text-lg font-black text-slate-900 tracking-tight">
                                    Ziarat Tours
                                </h4>
                            </div>

                            {ziaratRows.map((row, index) => (
                                <div key={row.id} className="bg-slate-50 p-6 rounded-2xl mb-4 border border-slate-200">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
                                            Ziarat #{index + 1}
                                        </span>
                                        <button
                                            onClick={() => removeZiaratRow(row.id)}
                                            className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {/* City */}
                                        <div>
                                            <label className="text-xs font-black text-slate-600 uppercase tracking-wider mb-2 block">
                                                City
                                            </label>
                                            <select
                                                value={row.city}
                                                onChange={(e) => {
                                                    console.log('🕌 Ziarat city changed to:', e.target.value);
                                                    updateZiaratRow(row.id, 'city', e.target.value);
                                                    updateZiaratRow(row.id, 'ziarat_id', ''); // Reset ziarat when city changes
                                                }}
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none"
                                            >
                                                <option value="">Select city...</option>
                                                {getZiaratCities().map(city => (
                                                    <option key={city} value={city}>{city}</option>
                                                ))}
                                            </select>
                                            {getZiaratCities().length === 0 && (
                                                <p className="text-xs text-red-500 mt-1">No ziarat cities available. Check if ziarat data loaded.</p>
                                            )}
                                        </div>

                                        {/* Ziarat */}
                                        <div>
                                            <label className="text-xs font-black text-slate-600 uppercase tracking-wider mb-2 block">
                                                Ziarat
                                            </label>
                                            <select
                                                value={row.ziarat_id}
                                                onChange={(e) => {
                                                    console.log('🕌 Ziarat selected:', e.target.value);
                                                    updateZiaratRow(row.id, 'ziarat_id', e.target.value);
                                                }}
                                                disabled={!row.city}
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                                            >
                                                <option value="">Select ziarat...</option>
                                                {getZiaratForCity(row.city).map(ziarat => {
                                                    // Try multiple possible field names
                                                    const name = ziarat.title || ziarat.ziarat_name || ziarat.name || "Unknown Name";
                                                    console.log('🕌 Ziarat option:', name, 'ID:', ziarat._id, 'Full Object:', ziarat);
                                                    return <option key={ziarat._id} value={ziarat._id}>{name}</option>;
                                                })}
                                            </select>
                                            {row.city && getZiaratForCity(row.city).length === 0 && (
                                                <p className="text-xs text-violet-600 mt-1">No ziarat available for {row.city}</p>
                                            )}
                                        </div>

                                        {/* Visit Date */}
                                        <div>
                                            <label className="text-xs font-black text-slate-600 uppercase tracking-wider mb-2 block">
                                                Visit Date
                                            </label>
                                            <input
                                                type="date"
                                                value={row.visitDate}
                                                onChange={(e) => updateZiaratRow(row.id, 'visitDate', e.target.value)}
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none"
                                            />
                                        </div>

                                        {/* Self */}
                                        <div className="flex items-center pt-8">
                                            <input
                                                type="checkbox"
                                                checked={row.self}
                                                onChange={(e) => updateZiaratRow(row.id, 'self', e.target.checked)}
                                                className="w-5 h-5 text-violet-600 rounded focus:ring-violet-500"
                                            />
                                            <label className="ml-3 text-sm font-bold text-slate-700">
                                                Self
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={addZiaratRow}
                                className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-black text-xs uppercase tracking-[0.2em] hover:bg-violet-50 hover:border-violet-300 hover:text-violet-600 transition-all"
                            >
                                <Plus size={16} /> Add Another Ziarat
                            </button>
                        </div>
                    )}

                    {/* Add-ons Buttons - Only show if no rows exist yet */}
                    {(foodRows.length === 0 || ziaratRows.length === 0) && (
                        <div className="flex flex-wrap gap-4">
                            {foodRows.length === 0 && (
                                <button
                                    onClick={addFoodRow}
                                    className="flex-1 min-w-[200px] flex items-center justify-center gap-3 p-6 rounded-[2rem] border-2 bg-white border-slate-100 text-slate-400 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-600 transition-all"
                                >
                                    <Utensils size={20} />
                                    <span className="text-[11px] font-black uppercase tracking-widest">Add Food Services</span>
                                </button>
                            )}
                            {ziaratRows.length === 0 && (
                                <button
                                    onClick={addZiaratRow}
                                    className="flex-1 min-w-[200px] flex items-center justify-center gap-3 p-6 rounded-[2rem] border-2 bg-white border-slate-100 text-slate-400 hover:bg-violet-50 hover:border-violet-300 hover:text-violet-600 transition-all"
                                >
                                    <Landmark size={20} />
                                    <span className="text-[11px] font-black uppercase tracking-widest">Add Ziarat Tours</span>
                                </button>
                            )}
                        </div>
                    )}

                    <div className="flex justify-between pt-8 border-t border-slate-100">
                        <button onClick={() => setCurrentStep(1)} className="px-10 py-5 rounded-[2rem] text-slate-400 font-black uppercase tracking-[0.2em] hover:bg-slate-100 transition-all flex items-center gap-2">
                            <ChevronLeft size={20} /> Back
                        </button>
                        <button onClick={() => setCurrentStep(3)} className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all flex items-center gap-3">
                            Generate Invoice <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 3: INVOICE */}
            {currentStep === 3 && (
                <div className="animate-in fade-in zoom-in duration-500 space-y-10">

                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Proforma Invoices</h2>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{families.length} Family Invoice{families.length !== 1 ? 's' : ''} Generated</p>
                        </div>
                        <div className="flex gap-3">
                            <button className="flex items-center gap-2 px-5 py-3 rounded-2xl border-2 border-slate-200 font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all text-xs">
                                <Printer size={15} /> Print All
                            </button>
                            <button
                                onClick={() => onBookCustomPackage && onBookCustomPackage({ families, hotelRows, selectedFlight, selectedVehicle, selectedVisaRate, riyalRate, selectedOptions, includeFood, includeZiarat, foodRows, ziaratRows, passengers })}
                                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 text-white font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:scale-105 transition-all text-xs">
                                <Send size={15} /> Book Package
                            </button>
                        </div>
                    </div>

                    {/* Per-Family Invoice Cards */}
                    {(families.length > 0 ? families : [{ id: 1, adults: passengers.adults, children: passengers.children, infants: passengers.infants, assignments: {} }]).map((family, familyIndex) => {
                        const inv = buildFamilyInvoice(family);
                        const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
                        const travelDate = selectedFlight
                            ? `${selectedFlight.departure_trip?.airline || ''} ${selectedFlight.departure_trip?.departure_city || ''}-${selectedFlight.departure_trip?.arrival_city || ''}`
                            : 'N/A';

                        return (
                            <div key={family.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">

                                {/* Invoice Header */}
                                <div className="bg-slate-900 px-8 py-5 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-black text-white uppercase tracking-tight">Family {familyIndex + 1} — Invoice</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                            Ref: #INV-{new Date().getFullYear()}-{String(familyIndex + 1).padStart(3, '0')}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Pax</p>
                                        <p className="text-xl font-black text-white">{inv.familyPax}</p>
                                    </div>
                                </div>

                                <div className="p-8 space-y-8">

                                    {/* 1. PAX INFORMATION */}
                                    <div>
                                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-3 pb-2 border-b border-slate-100">Pax Information</h4>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-xs">
                                                <thead>
                                                    <tr className="border-b border-slate-100">
                                                        {['Passenger Name', 'PAX', 'Count', 'Total Pax'].map(h => (
                                                            <th key={h} className="py-2 pr-4 font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="font-bold text-slate-700">
                                                    {(family.adults || 0) > 0 && (
                                                        <tr className="border-b border-slate-50">
                                                            <td className="py-2 pr-4">Adult Passengers</td>
                                                            <td className="py-2 pr-4">Adult</td>
                                                            <td className="py-2 pr-4">{family.adults}</td>
                                                            <td className="py-2 pr-4">{family.adults} Adult{family.adults > 1 ? 's' : ''}</td>
                                                        </tr>
                                                    )}
                                                    {(family.children || 0) > 0 && (
                                                        <tr className="border-b border-slate-50">
                                                            <td className="py-2 pr-4">Child Passengers</td>
                                                            <td className="py-2 pr-4">Child</td>
                                                            <td className="py-2 pr-4">{family.children}</td>
                                                            <td className="py-2 pr-4">{family.children} Child{family.children > 1 ? 'ren' : ''}</td>
                                                        </tr>
                                                    )}
                                                    {(family.infants || 0) > 0 && (
                                                        <tr className="border-b border-slate-50">
                                                            <td className="py-2 pr-4">Infant Passengers</td>
                                                            <td className="py-2 pr-4">Infant</td>
                                                            <td className="py-2 pr-4">{family.infants}</td>
                                                            <td className="py-2 pr-4">{family.infants} Infant{family.infants > 1 ? 's' : ''}</td>
                                                        </tr>
                                                    )}
                                                    <tr className="border-t border-slate-200 bg-slate-50">
                                                        <td className="py-2 pr-4 font-black text-slate-900" colSpan={2}>Total</td>
                                                        <td className="py-2 pr-4 font-black text-slate-900">{inv.familyPax}</td>
                                                        <td className="py-2 pr-4 font-black text-slate-900">
                                                            {[family.adults > 0 && `${family.adults} Adult${family.adults > 1 ? 's' : ''}`, family.children > 0 && `${family.children} Child${family.children > 1 ? 'ren' : ''}`, family.infants > 0 && `${family.infants} Infant${family.infants > 1 ? 's' : ''}`].filter(Boolean).join(', ')}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* 2. ACCOMMODATION */}
                                    {hasService('hotels') && (
                                        <div>
                                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-3 pb-2 border-b border-slate-100">Accommodation</h4>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-xs">
                                                    <thead>
                                                        <tr className="border-b border-slate-100">
                                                            {['Hotel Name', 'Type', 'Check-In', 'Nights', 'Check-Out', `Rate (${inv.isHotelPKR ? 'PKR' : 'SAR'})`, 'QTY', `Net (${inv.isHotelPKR ? 'PKR' : 'SAR'})`, 'PKR Net'].map(h => (
                                                                <th key={h} className="py-2 pr-4 font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="font-bold text-slate-700">
                                                        {inv.accommodationRows.length > 0 ? inv.accommodationRows.map((row, i) => (
                                                            <tr key={i} className="border-b border-slate-50">
                                                                <td className="py-2 pr-4 whitespace-nowrap">{row.hotel_name}</td>
                                                                <td className="py-2 pr-4">{row.type}</td>
                                                                <td className="py-2 pr-4 whitespace-nowrap">{row.check_in}</td>
                                                                <td className="py-2 pr-4">{row.nights}</td>
                                                                <td className="py-2 pr-4 whitespace-nowrap">{row.check_out}</td>
                                                                <td className="py-2 pr-4">{inv.isHotelPKR ? 'PKR' : 'SAR'} {row.rate_native?.toLocaleString()}</td>
                                                                <td className="py-2 pr-4">{row.qty}</td>
                                                                <td className="py-2 pr-4">{inv.isHotelPKR ? 'PKR' : 'SAR'} {row.net_native?.toLocaleString()}</td>
                                                                <td className="py-2 pr-4">PKR {row.pkr_net?.toLocaleString()}</td>
                                                            </tr>
                                                        )) : (
                                                            <tr><td colSpan={9} className="py-3 text-slate-400 italic">No hotel assigned to this family</td></tr>
                                                        )}
                                                        <tr className="border-t border-slate-200 bg-slate-50">
                                                            <td className="py-2 pr-4 font-black text-slate-900" colSpan={7}>Total Accommodation</td>
                                                            <td className="py-2 pr-4 font-black text-slate-900">{inv.isHotelPKR ? 'PKR' : 'SAR'} {inv.accomNative?.toLocaleString()}</td>
                                                            <td className="py-2 pr-4 font-black text-slate-900">PKR {inv.accomPKR?.toLocaleString()}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* 3. TRANSPORTATION */}
                                    {hasService('transport') && selectedVehicle && (
                                        <div>
                                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-3 pb-2 border-b border-slate-100">Transportation</h4>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-xs">
                                                    <thead>
                                                        <tr className="border-b border-slate-100">
                                                            {['Vehicle Type', 'Route', `Rate (${inv.isTransPKR ? 'PKR' : 'SAR'})`, 'QTY', `Net (${inv.isTransPKR ? 'PKR' : 'SAR'})`].map(h => (
                                                                <th key={h} className="py-2 pr-4 font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="font-bold text-slate-700">
                                                        <tr className="border-b border-slate-50">
                                                            <td className="py-2 pr-4">{selectedVehicle.vehicle_type} — {selectedVehicle.vehicle_name}</td>
                                                            <td className="py-2 pr-4">{selectedVehicle.sector}</td>
                                                            <td className="py-2 pr-4">{inv.isTransPKR ? 'PKR' : 'SAR'} {inv.transportRate?.toLocaleString()}</td>
                                                            <td className="py-2 pr-4">{inv.familyPax}</td>
                                                            <td className="py-2 pr-4">{inv.isTransPKR ? 'PKR' : 'SAR'} {inv.transportNative?.toLocaleString()}</td>
                                                        </tr>
                                                        <tr className="border-t border-slate-200 bg-slate-50">
                                                            <td className="py-2 pr-4 font-black text-slate-900" colSpan={4}>Total Transportation</td>
                                                            <td className="py-2 pr-4 font-black text-slate-900">PKR {inv.transportNetPKR?.toLocaleString()}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* 4. PILGRIMS & TICKETS DETAIL */}
                                    {(hasService('visa') || hasService('tickets')) && (
                                        <div>
                                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-3 pb-2 border-b border-slate-100">Pilgrims &amp; Tickets Detail</h4>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-xs">
                                                    <thead>
                                                        <tr className="border-b border-slate-100">
                                                            {['Pax', 'Total Pax', `Visa Rate (${inv.isVisaPKR ? 'PKR' : 'SAR'})`, 'Ticket Rate (PKR)'].map(h => (
                                                                <th key={h} className="py-2 pr-4 font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="font-bold text-slate-700">
                                                        {(family.adults || 0) > 0 && (
                                                            <tr className="border-b border-slate-50">
                                                                <td className="py-2 pr-4">Adult</td>
                                                                <td className="py-2 pr-4">{family.adults}</td>
                                                                <td className="py-2 pr-4">{hasService('visa') ? `${inv.isVisaPKR ? 'PKR' : 'SAR'} ${inv.adultVisaRate?.toLocaleString()}` : '—'}</td>
                                                                <td className="py-2 pr-4">{hasService('tickets') ? `PKR ${inv.adultTicket?.toLocaleString()}` : '—'}</td>
                                                            </tr>
                                                        )}
                                                        {(family.children || 0) > 0 && (
                                                            <tr className="border-b border-slate-50">
                                                                <td className="py-2 pr-4">Child</td>
                                                                <td className="py-2 pr-4">{family.children}</td>
                                                                <td className="py-2 pr-4">{hasService('visa') ? `${inv.isVisaPKR ? 'PKR' : 'SAR'} ${inv.childVisaRate?.toLocaleString()}` : '—'}</td>
                                                                <td className="py-2 pr-4">{hasService('tickets') ? `PKR ${inv.childTicket?.toLocaleString()}` : '—'}</td>
                                                            </tr>
                                                        )}
                                                        {(family.infants || 0) > 0 && (
                                                            <tr className="border-b border-slate-50">
                                                                <td className="py-2 pr-4">Infant</td>
                                                                <td className="py-2 pr-4">{family.infants}</td>
                                                                <td className="py-2 pr-4">{hasService('visa') ? `${inv.isVisaPKR ? 'PKR' : 'SAR'} ${inv.infantVisaRate?.toLocaleString()}` : '—'}</td>
                                                                <td className="py-2 pr-4">{hasService('tickets') ? `PKR ${inv.infantTicket?.toLocaleString()}` : '—'}</td>
                                                            </tr>
                                                        )}
                                                        <tr className="border-t border-slate-200 bg-slate-50">
                                                            <td className="py-2 pr-4 font-black text-slate-900">Total</td>
                                                            <td className="py-2 pr-4 font-black text-slate-900">{inv.familyPax}</td>
                                                            <td className="py-2 pr-4 font-black text-slate-900">{hasService('visa') ? `${inv.isVisaPKR ? 'PKR' : 'SAR'} ${inv.totalVisaNative?.toLocaleString()}` : '—'}</td>
                                                            <td className="py-2 pr-4 font-black text-slate-900">{hasService('tickets') ? `PKR ${inv.totalTicketPKR?.toLocaleString()}` : '—'}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* 5. INVOICE DETAILS */}
                                    <div className="border-t border-slate-100 pt-6">
                                        <div className="flex flex-col md:flex-row justify-between gap-6">
                                            {/* Left: Booking Info */}
                                            <div className="space-y-1 text-xs font-bold text-slate-600">
                                                <p><span className="text-slate-400 uppercase tracking-wider">Invoice Details</span></p>
                                                <p>Booking Date: <span className="text-slate-900">{today}</span></p>
                                                <p>Family Head: <span className="text-slate-900">Family {familyIndex + 1}</span></p>
                                                <p>Booking #: <span className="text-slate-900">UB-{Date.now().toString().slice(-6)}</span></p>
                                                <p>Invoice Date: <span className="text-slate-900">{today}</span></p>
                                                {selectedFlight && (
                                                    <p>Travel Date: <span className="text-slate-900">{travelDate}</span></p>
                                                )}
                                            </div>

                                            {/* Right: Totals */}
                                            <div className="text-right space-y-1 text-xs font-bold">
                                                <p className="text-slate-400 uppercase tracking-wider">Total Pax: {inv.familyPax}</p>
                                                {hasService('visa') && (
                                                    <p className="text-slate-600">
                                                        Visa{!inv.isVisaPKR && ` @ ${inv.exchangeRate}`} = <span className="text-slate-900">PKR {inv.totalVisaPKR?.toLocaleString()}</span>
                                                    </p>
                                                )}
                                                {hasService('tickets') && (
                                                    <p className="text-slate-600">Tickets = <span className="text-slate-900">PKR {inv.totalTicketPKR?.toLocaleString()}</span></p>
                                                )}
                                                {hasService('hotels') && (
                                                    <p className="text-slate-600">
                                                        Hotel{!inv.isHotelPKR && ` @ ${inv.exchangeRate}`} = <span className="text-slate-900">PKR {inv.accomPKR?.toLocaleString()}</span>
                                                    </p>
                                                )}
                                                {hasService('transport') && selectedVehicle && (
                                                    <p className="text-slate-600">Transport{!inv.isTransPKR && ` @ ${inv.exchangeRate}`} = <span className="text-slate-900">PKR {inv.transportNetPKR?.toLocaleString()}</span></p>
                                                )}
                                                {foodRows.some(r => r.food_id) && (
                                                    <p className="text-slate-600">Food{!inv.isFoodPKR && ` @ ${inv.exchangeRate}`} = <span className="text-slate-900">PKR {inv.foodPKR?.toLocaleString()}</span></p>
                                                )}
                                                {ziaratRows.some(r => r.ziarat_id) && (
                                                    <p className="text-slate-600">Ziarat{!inv.isZiaratPKR && ` @ ${inv.exchangeRate}`} = <span className="text-slate-900">PKR {inv.ziaratPKR?.toLocaleString()}</span></p>
                                                )}
                                                <div className="mt-3 pt-3 border-t-2 border-slate-900">
                                                    <p className="text-base font-black text-slate-900 bg-slate-900 text-white px-4 py-2 rounded-xl inline-block">
                                                        Net PKR = PKR {inv.netPKR?.toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        );
                    })}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button className="flex-1 flex items-center justify-center gap-3 py-5 rounded-[2rem] border-2 border-slate-200 font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">
                            <Printer size={18} /> Print PDF
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-3 py-5 rounded-[2rem] border-2 border-slate-200 font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">
                            <Save size={18} /> Save Draft
                        </button>
                        <button
                            onClick={() => onBookCustomPackage && onBookCustomPackage({ families, hotelRows, selectedFlight, selectedVehicle, selectedVisaRate, riyalRate, selectedOptions, includeFood, includeZiarat, foodRows, ziaratRows, passengers })}
                            className="flex-1 flex items-center justify-center gap-3 py-5 rounded-[2rem] bg-emerald-600 text-white font-black uppercase tracking-widest shadow-2xl shadow-emerald-600/30 hover:scale-105 transition-all">
                            <Send size={18} /> Book Package
                        </button>
                    </div>

                    <button onClick={() => setCurrentStep(2)} className="mt-8 w-full text-center text-xs font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-all">
                        ← Edit Selection &amp; Builder
                    </button>
                </div>
            )}

            {/* Flight Selection Modal */}
            {showFlightModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div
                        className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Select Available Flight</h3>
                                <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-widest">Live Inventory Selection</p>
                            </div>
                            <button
                                onClick={() => setShowFlightModal(false)}
                                className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all font-black text-xl"
                            >
                                ×
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/30">
                            <div className="space-y-4">
                                {loadingFlights ? (
                                    <div className="py-20 text-center">
                                        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading Inventory...</p>
                                    </div>
                                ) : flights.length === 0 ? (
                                    <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                                        <Plane className="mx-auto text-slate-300 mb-4 opacity-50" size={48} />
                                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No Active Flights Available</p>
                                    </div>
                                ) : (
                                    flights.map(flight => (
                                        <button
                                            key={flight._id}
                                            onClick={() => {
                                                setSelectedFlight(flight);
                                                setShowFlightModal(false);
                                            }}
                                            className="w-full bg-white p-6 rounded-3xl border border-slate-200 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-600/5 transition-all text-left group relative overflow-hidden"
                                        >
                                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                                <div className="flex-1 space-y-4">
                                                    {/* Outbound Leg */}
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                                                            <Plane size={18} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="text-xs font-black text-slate-900 uppercase">{flight.departure_trip.airline} • {flight.departure_trip.flight_number}</span>
                                                                <span className="text-[10px] font-bold text-slate-400">{new Date(flight.departure_trip.departure_datetime).toLocaleDateString()}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-black text-slate-900">{new Date(flight.departure_trip.departure_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                    <span className="text-[10px] font-bold text-slate-500 uppercase">{flight.departure_trip.departure_city}</span>
                                                                </div>
                                                                <div className="h-px bg-slate-100 flex-1 mx-4 relative">
                                                                    <div className="absolute right-0 -top-1">
                                                                        <Plane size={8} className="text-slate-200" />
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] font-bold text-slate-500 uppercase">{flight.departure_trip.arrival_city}</span>
                                                                    <span className="text-sm font-black text-slate-900">{new Date(flight.departure_trip.arrival_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Inbound Leg (If Round-trip) */}
                                                    {flight.return_trip && (
                                                        <div className="flex items-center gap-4 pt-4 border-t border-slate-50">
                                                            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                                                                <Plane size={18} className="rotate-180" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <span className="text-xs font-black text-slate-900 uppercase">{flight.return_trip.airline} • {flight.return_trip.flight_number}</span>
                                                                    <span className="text-[10px] font-bold text-slate-400">{new Date(flight.return_trip.departure_datetime).toLocaleDateString()}</span>
                                                                </div>
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-sm font-black text-slate-900">{new Date(flight.return_trip.departure_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                        <span className="text-[10px] font-bold text-slate-500 uppercase">{flight.return_trip.departure_city}</span>
                                                                    </div>
                                                                    <div className="h-px bg-slate-100 flex-1 mx-4 relative">
                                                                        <div className="absolute right-0 -top-1">
                                                                            <Plane size={8} className="text-slate-200 rotate-180" />
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[10px] font-bold text-slate-500 uppercase">{flight.return_trip.arrival_city}</span>
                                                                        <span className="text-sm font-black text-slate-900">{new Date(flight.return_trip.arrival_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="w-px bg-slate-100 hidden md:block" />

                                                <div className="md:w-48 flex flex-col justify-between text-right">
                                                    <div>
                                                        <div className="flex items-center justify-end gap-2 mb-2">
                                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-[9px] font-black uppercase tracking-widest">{flight.trip_type}</span>
                                                            {flight.pnr && (
                                                                <span className="px-2 py-0.5 bg-slate-900 text-white rounded text-[9px] font-black uppercase tracking-widest">PNR: {flight.pnr}</span>
                                                            )}
                                                        </div>
                                                        <p className="text-lg font-black text-blue-600 leading-none">Rs. {flight.adult_selling?.toLocaleString()}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Adult Selling</p>
                                                    </div>
                                                    <div className="mt-4 pt-4 border-t border-slate-50">
                                                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{flight.available_seats} Seats Available</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-8 border-t border-slate-100 bg-white">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] text-center">
                                Prices are subject to availability at the time of booking
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {showToast && (
                <div className="fixed top-4 right-4 z-50 animate-slide-in">
                    <div className={`px-6 py-4 rounded-2xl shadow-2xl border-2 ${toastMessage.includes('Error')
                        ? 'bg-red-50 border-red-200 text-red-900'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        }`}>
                        <div className="flex items-center gap-3">
                            {toastMessage.includes('Error') ? (
                                <X size={20} className="text-red-600" />
                            ) : (
                                <CheckCircle2 size={20} className="text-emerald-600" />
                            )}
                            <p className="font-black text-sm">{toastMessage}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgentUmrahCalculator;
