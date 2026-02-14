import React, { useState, useEffect } from 'react';
import {
    ArrowLeft, Save, Globe, DollarSign, Building,
    MapPin, ShieldCheck, Truck, Utensils, MapPinned,
    Plane, Clock, ChevronRight, Info, AlertCircle,
    Plus, Trash2, Edit3, Search, Filter, HardDrive,
    Users, TrendingUp, Landmark, GitBranch, CheckCircle2,
    Loader2, ChevronDown
} from 'lucide-react';
import othersAPI from '../../services/othersAPI';

const COLORS = {
    primary: '#3B82F6',
    secondary: '#64748B',
    bg: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#1F2937'
};

const OthersView = ({ onBack }) => {
    const tabs = [
        "Set Riyal Rate",
        "Manage Shirka Name",
        "Small Sectors",
        "Big Sectors",
        "Visa Rates Pex Wise",
        "Only Visa Rates",
        "Transport Prices",
        "Food Prices",
        "Ziarat Prices",
        "Flight Name & IATA",
        "City Name & IATA",
        "Booking Expire Time"
    ];

    const TAB_SLUGS = {
        "Set Riyal Rate": "riyal-rate",
        "Manage Shirka Name": "shirka",
        "Small Sectors": "small-sectors",
        "Big Sectors": "big-sectors",
        "Visa Rates Pex Wise": "visa-rates",
        "Only Visa Rates": "only-visa",
        "Transport Prices": "transport-prices",
        "Food Prices": "food-prices",
        "Ziarat Prices": "ziarat-prices",
        "Flight Name & IATA": "flight-iata",
        "City Name & IATA": "city-iata",
        "Booking Expire Time": "expiry"
    };

    const getInitialTab = () => {
        const path = window.location.pathname;
        if (path.startsWith('/others/')) {
            const slug = path.split('/')[2];
            const entry = Object.entries(TAB_SLUGS).find(([_, s]) => s === slug);
            if (entry) return entry[0];
        }
        return tabs[0];
    };

    const [activeTab, setActiveTab] = useState(getInitialTab);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    // Sync URL with Active Tab
    useEffect(() => {
        const slug = TAB_SLUGS[activeTab];
        if (slug) {
            const newPath = `/others/${slug}`;
            if (window.location.pathname !== newPath) {
                window.history.pushState(null, '', newPath);
            }
        }
    }, [activeTab]);

    // --- STATE VARIABLES ---

    // Section 1: Riyal Rate
    const [riyalSettings, setRiyalSettings] = useState({
        rate: 0,
        is_visa_pkr: false,
        is_hotel_pkr: false,
        is_transport_pkr: false,
        is_ziarat_pkr: false,
        is_food_pkr: false
    });
    const [riyalId, setRiyalId] = useState(null);

    // Section 2: Shirka
    const [shirkaName, setShirkaName] = useState("");
    const [shirkas, setShirkas] = useState([]);

    // Section 3: Small Sectors
    const [sectorForm, setSectorForm] = useState({
        departure_city: '',
        arrival_city: '',
        contact_name: '',
        contact_number: '',
        sector_type: 'AIRPORT PICKUP'
    });
    const [smallSectors, setSmallSectors] = useState([]);
    const [editingSectorId, setEditingSectorId] = useState(null);

    // Section 4: Big Sectors
    // Section 4: Big Sectors
    const [bigSectorForm, setBigSectorForm] = useState({
        name: '',
        small_sector_ids: []
    });
    const [bigSectors, setBigSectors] = useState([]);
    const [editingBigSectorId, setEditingBigSectorId] = useState(null);

    // Section 5: Visa Rates Pex Wise
    const [visaPexForm, setVisaPexForm] = useState({
        title: '',
        person_from: 0,
        person_to: 0,
        with_transport: false,
        adult_selling: 0,
        adult_purchasing: 0,
        child_selling: 0,
        child_purchasing: 0,
        infant_selling: 0,
        infant_purchasing: 0,
        vehicle_ids: []
    });
    const [visaPexRates, setVisaPexRates] = useState([]);
    const [editingVisaPexId, setEditingVisaPexId] = useState(null);
    const [showVehicleModal, setShowVehicleModal] = useState(false);

    // Section 6: Only Visa Rates
    const [onlyVisaRates, setOnlyVisaRates] = useState([]);
    const [visaOption, setVisaOption] = useState('Only');
    const [onlyVisaForm, setOnlyVisaForm] = useState({
        visa_option: 'Only',
        status: 'Active',
        start_days: 0,
        end_days: 0,
        adult_selling: 0,
        adult_purchasing: 0,
        child_selling: 0,
        child_purchasing: 0,
        infant_selling: 0,
        infant_purchasing: 0
    });
    const [onlyVisaRecords, setOnlyVisaRecords] = useState({
        'Only': null,
        'Long Term': null
    });



    // Section 8: Food Prices
    const [foodPriceForm, setFoodPriceForm] = useState({
        title: '',
        city: 'Makkah',
        description: '',
        min_pax: 0,
        per_pax: 0,
        adult_selling: 0,
        adult_purchasing: 0,
        child_selling: 0,
        child_purchasing: 0,
        infant_selling: 0,
        infant_purchasing: 0
    });
    const [foodPrices, setFoodPrices] = useState([]);
    const [editingFoodPriceId, setEditingFoodPriceId] = useState(null);

    // Section 8: Transport Prices
    const [transportPriceForm, setTransportPriceForm] = useState({
        vehicle_name: '',
        vehicle_type: '',
        sector: '',
        sector_id: '',
        is_big_sector: false,
        notes: '',
        status: 'Active',
        adult_selling: 0,
        adult_purchasing: 0,
        child_selling: 0,
        child_purchasing: 0,
        infant_selling: 0,
        infant_purchasing: 0
    });
    const [transportPrices, setTransportPrices] = useState([]);
    const [editingTransportPriceId, setEditingTransportPriceId] = useState(null);
    const [sectorOptions, setSectorOptions] = useState([]);

    // Section 9: Ziarat Prices
    const [ziaratPriceForm, setZiaratPriceForm] = useState({
        city: 'Makkah',
        title: '',
        contact_person: '',
        contact_number: '',
        min_pax: 1,
        max_pax: 50,
        status: 'Active',
        adult_selling: 0,
        adult_purchasing: 0,
        child_selling: 0,
        child_purchasing: 0,
        infant_selling: 0,
        infant_purchasing: 0
    });
    const [ziaratPrices, setZiaratPrices] = useState([]);
    const [editingZiaratPriceId, setEditingZiaratPriceId] = useState(null);

    // Section 10: Flight IATA
    const [flightIATAForm, setFlightIATAForm] = useState({
        airline_name: '',
        iata_code: '',
        logo_url: ''
    });
    const [flightIATAs, setFlightIATAs] = useState([]);
    const [editingFlightIATAId, setEditingFlightIATAId] = useState(null);
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState('');

    // Section 11: City IATA
    const [cityIATAs, setCityIATAs] = useState([]);
    const [cityName, setCityName] = useState('');
    const [cityCode, setCityCode] = useState('');

    // Section 12: Expiry
    const [expiry, setExpiry] = useState({
        group_booking_hours: 24,
        group_booking_minutes: 0,
        umrah_booking_hours: 24,
        umrah_booking_minutes: 0,
        customer_booking_hours: 24,
        customer_booking_minutes: 0,
        custom_umrah_hours: 24,
        custom_umrah_minutes: 0
    });
    const [expiryId, setExpiryId] = useState(null);

    // Fetch data when tab changes
    useEffect(() => {
        fetchDataForTab(activeTab);
    }, [activeTab]);

    const fetchDataForTab = async (tab) => {
        setLoading(true);
        setError(null);
        try {
            switch (tab) {
                case "Set Riyal Rate":
                    const riyalRes = await othersAPI.riyalRate.getActive();
                    if (riyalRes.data) {
                        setRiyalSettings({
                            rate: riyalRes.data.rate || 0,
                            is_visa_pkr: riyalRes.data.is_visa_pkr || false,
                            is_hotel_pkr: riyalRes.data.is_hotel_pkr || false,
                            is_transport_pkr: riyalRes.data.is_transport_pkr || false,
                            is_ziarat_pkr: riyalRes.data.is_ziarat_pkr || false,
                            is_food_pkr: riyalRes.data.is_food_pkr || false,
                        });
                        setRiyalId(riyalRes.data.id);
                    }
                    break;
                case "Manage Shirka Name":
                    const shirkasRes = await othersAPI.shirka.getAll(true);
                    setShirkas(shirkasRes.data || []);
                    break;
                case "Small Sectors":
                    const sectorsRes = await othersAPI.smallSector.getAll(true);
                    setSmallSectors(sectorsRes.data || []);
                    break;
                case "Big Sectors":
                    const [bigRes, smallRes] = await Promise.all([
                        othersAPI.bigSector.getAll(true),
                        othersAPI.smallSector.getAll(true)
                    ]);
                    setBigSectors(bigRes.data || []);
                    setSmallSectors(smallRes.data || []);
                    break;

                case "Visa Rates Pex Wise":
                    const [visaPexRes, transportRes] = await Promise.all([
                        othersAPI.visaRatesPex.getAll(true),
                        othersAPI.transportPrice.getAll()
                    ]);
                    setVisaPexRates(visaPexRes.data || []);
                    setTransportPrices(transportRes.data || []);
                    break;
                case "Only Visa Rates":
                    const onlyVisaRes = await othersAPI.onlyVisaRate.getAll();
                    const rates = onlyVisaRes.data || [];
                    setOnlyVisaRates(rates);

                    // Organize records by visa_option
                    const recordsMap = {
                        'Only': rates.find(r => r.visa_option === 'Only') || null,
                        'Long Term': rates.find(r => r.visa_option === 'Long Term') || null
                    };
                    setOnlyVisaRecords(recordsMap);

                    // Load current visa option's data into form
                    const currentRecord = recordsMap[visaOption];
                    if (currentRecord) {
                        setOnlyVisaForm({
                            visa_option: currentRecord.visa_option,
                            status: currentRecord.status,
                            start_days: currentRecord.start_days,
                            end_days: currentRecord.end_days,
                            adult_selling: currentRecord.adult_selling,
                            adult_purchasing: currentRecord.adult_purchasing,
                            child_selling: currentRecord.child_selling,
                            child_purchasing: currentRecord.child_purchasing,
                            infant_selling: currentRecord.infant_selling,
                            infant_purchasing: currentRecord.infant_purchasing
                        });
                    }
                    break;

                case "Food Prices":
                    const foodRes = await othersAPI.foodPrice.getAll(true);
                    setFoodPrices(foodRes.data || []);
                    break;
                case "Transport Prices":
                    const [tpRes, smallSectorsRes, bigSectorsRes, cityIATARes] = await Promise.all([
                        othersAPI.transportPrice.getAll(),
                        othersAPI.smallSector.getAll(true),
                        othersAPI.bigSector.getAll(true),
                        othersAPI.cityIATA.getAll(true)
                    ]);
                    setTransportPrices(tpRes.data || []);

                    // Create City Helpers
                    const cityMap = {};
                    (cityIATARes.data || []).forEach(c => {
                        cityMap[c.city_name.trim().toLowerCase()] = c.iata_code.toUpperCase();
                    });

                    const getIATA = (city) => {
                        if (!city) return '???';
                        const key = city.trim().toLowerCase();
                        return cityMap[key] || city.substring(0, 3).toUpperCase();
                    };

                    // Format Small Sectors: JED -> MAK
                    const smallOptions = (smallSectorsRes.data || []).map(s => {
                        const dep = getIATA(s.departure_city);
                        const arr = getIATA(s.arrival_city);
                        const label = `${dep} ➝ ${arr}`;
                        // Value format: ID|IS_BIG_SECTOR|LABEL
                        return { label: label, value: `${s.id || s._id}|false|${label}` };
                    }).sort((a, b) => a.label.localeCompare(b.label));

                    // Format Big Sectors: JED -> MAK -> MED
                    const bigOptions = (bigSectorsRes.data || []).map(s => {
                        let label = s.name;
                        if (s.small_sectors_details && s.small_sectors_details.length > 0) {
                            // Extract unique route chain
                            // Strategy: Join dep-arr of all sectors in order
                            const rawRoute = s.small_sectors_details.map(ss => ({
                                dep: getIATA(ss.departure_city),
                                arr: getIATA(ss.arrival_city)
                            }));

                            // Construct simple chain string: "JED -> MAK -> MED"
                            let routeParts = [];
                            if (rawRoute.length > 0) {
                                routeParts.push(rawRoute[0].dep);
                                routeParts.push(rawRoute[0].arr);
                                for (let i = 1; i < rawRoute.length; i++) {
                                    if (rawRoute[i].dep !== routeParts[routeParts.length - 1]) {
                                        routeParts.push(rawRoute[i].dep);
                                    }
                                    routeParts.push(rawRoute[i].arr);
                                }
                            }
                            label = routeParts.join(' ➝ ');
                        }
                        // Value format: ID|IS_BIG_SECTOR|LABEL
                        return { label: label, value: `${s.id || s._id}|true|${label}` };
                    }).sort((a, b) => a.label.localeCompare(b.label));

                    const groupedOptions = [
                        {
                            label: "Small Sectors (Point to Point)",
                            options: smallOptions.map(o => o.value),
                            labels: smallOptions.reduce((acc, curr) => ({ ...acc, [curr.value]: curr.label }), {})
                        },
                        {
                            label: "Big Sectors (Bundled Routes)",
                            // bigOptions might still be strings if not updated yet, so handle both
                            options: bigOptions.map(o => (typeof o === 'object' ? o.value : o)),
                            labels: bigOptions.reduce((acc, curr) => {
                                if (typeof curr === 'object') return { ...acc, [curr.value]: curr.label };
                                return acc; // No label map needed for simple strings
                            }, {})
                        }
                    ];
                    setSectorOptions(groupedOptions);
                    break;
                case "Ziarat Prices":
                    const ziaratRes = await othersAPI.ziaratPrice.getAll();
                    setZiaratPrices(ziaratRes.data || []);
                    break;
                case "Flight Name & IATA":
                    const flightRes = await othersAPI.flightIATA.getAll(true);
                    setFlightIATAs(flightRes.data || []);
                    break;
                case "City Name & IATA":
                    const cityRes = await othersAPI.cityIATA.getAll(true);
                    setCityIATAs(cityRes.data || []);
                    break;
                case "Booking Expire Time":
                    try {
                        const expiryRes = await othersAPI.bookingExpiry.getActive();
                        if (expiryRes.data) {
                            setExpiry({
                                group_booking_hours: expiryRes.data.group_booking_hours ?? 24,
                                group_booking_minutes: expiryRes.data.group_booking_minutes ?? 0,
                                umrah_booking_hours: expiryRes.data.umrah_booking_hours ?? 24,
                                umrah_booking_minutes: expiryRes.data.umrah_booking_minutes ?? 0,
                                customer_booking_hours: expiryRes.data.customer_booking_hours ?? 24,
                                customer_booking_minutes: expiryRes.data.customer_booking_minutes ?? 0,
                                custom_umrah_hours: expiryRes.data.custom_umrah_hours ?? 24,
                                custom_umrah_minutes: expiryRes.data.custom_umrah_minutes ?? 0
                            });
                            setExpiryId(expiryRes.data.id || expiryRes.data._id);
                        }
                    } catch (err) {
                        // Ignore 404, just use defaults
                        if (err.response?.status !== 404) console.error(err);
                    }
                    break;
            }
        } catch (err) {
            // If no data found (404), that's okay - user can create new
            if (err.response?.status !== 404) {
                console.error('Error fetching data:', err);
                setError('Failed to load data. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };



    // Small Sector Specific Handlers
    const handleEditSector = (sector) => {
        setSectorForm({
            departure_city: sector.departure_city,
            arrival_city: sector.arrival_city,
            sector_type: sector.sector_type,
            contact_name: sector.contact_name,
            contact_number: sector.contact_number
        });
        setEditingSectorId(sector.id || sector._id);
        // Scroll to top to see form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteSector = async (id) => {
        if (window.confirm('Are you sure you want to delete this sector?')) {
            try {
                setLoading(true);
                await othersAPI.smallSector.delete(id);
                setSuccessMessage('Sector deleted successfully');
                fetchDataForTab("Small Sectors");
            } catch (err) {
                console.error('Error deleting sector:', err);
                setError('Failed to delete sector');
            } finally {
                setLoading(false);
            }
        }
    };

    // Big Sector Specific Handlers
    const handleEditBigSector = (sector) => {
        setBigSectorForm({
            name: sector.name,
            small_sector_ids: sector.small_sector_ids || []
        });
        setEditingBigSectorId(sector.id || sector._id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteBigSector = async (id) => {
        if (window.confirm('Are you sure you want to delete this big sector?')) {
            try {
                setLoading(true);
                await othersAPI.bigSector.delete(id);
                setSuccessMessage('Big Sector deleted successfully');
                fetchDataForTab("Big Sectors");
            } catch (err) {
                console.error('Error deleting big sector:', err);
                setError('Failed to delete big sector');
            } finally {
                setLoading(false);
            }
        }
    };

    // Food Prices Handlers
    const handleEditFoodPrice = (price) => {
        setFoodPriceForm({
            title: price.title,
            city: price.city,
            description: price.description || '',
            min_pax: price.min_pax || 0,
            per_pax: price.per_pax || 0,
            adult_selling: price.adult_selling || 0,
            adult_purchasing: price.adult_purchasing || 0,
            child_selling: price.child_selling || 0,
            child_purchasing: price.child_purchasing || 0,
            infant_selling: price.infant_selling || 0,
            infant_purchasing: price.infant_purchasing || 0
        });
        setEditingFoodPriceId(price.id || price._id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteFoodPrice = async (id) => {
        if (window.confirm('Are you sure you want to delete this food price?')) {
            try {
                setLoading(true);
                await othersAPI.foodPrice.delete(id);
                setSuccessMessage('Food price deleted successfully');
                fetchDataForTab("Food Prices");
            } catch (err) {
                console.error('Error deleting food price:', err);
                setError('Failed to delete food price');
            } finally {
                setLoading(false);
            }
        }
    };

    // Ziarat Prices Handlers
    const handleEditZiaratPrice = (ziarat) => {
        setZiaratPriceForm({
            city: ziarat.city,
            title: ziarat.title,
            contact_person: ziarat.contact_person || '',
            contact_number: ziarat.contact_number || '',
            min_pax: ziarat.min_pax || 1,
            max_pax: ziarat.max_pax || 50,
            status: ziarat.status || 'Active',
            adult_selling: ziarat.adult_selling || 0,
            adult_purchasing: ziarat.adult_purchasing || 0,
            child_selling: ziarat.child_selling || 0,
            child_purchasing: ziarat.child_purchasing || 0,
            infant_selling: ziarat.infant_selling || 0,
            infant_purchasing: ziarat.infant_purchasing || 0
        });
        setEditingZiaratPriceId(ziarat.id || ziarat._id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteZiaratPrice = async (id) => {
        if (window.confirm('Are you sure you want to delete this Ziarat price?')) {
            try {
                setLoading(true);
                await othersAPI.ziaratPrice.delete(id);
                setSuccessMessage('Ziarat price deleted successfully');
                fetchDataForTab("Ziarat Prices");
            } catch (err) {
                console.error('Error deleting Ziarat price:', err);
                setError('Failed to delete Ziarat price');
            } finally {
                setLoading(false);
            }
        }
    };



    // Transport Prices Handlers
    const handleEditTransportPrice = (price) => {
        // Reconstruct or use sector_id to find value. Since we need to pre-select dropdown, 
        // we ideally need the exact string value from options.
        // We constructed it as: ID|IS_BIG|LABEL.
        const compositeValue = price.sector_id ? `${price.sector_id}|${price.is_big_sector}|${price.sector}` : '';

        setTransportPriceForm({
            vehicle_name: price.vehicle_name,
            vehicle_type: price.vehicle_type,
            sector: price.sector,
            sector_id: price.sector_id,
            is_big_sector: price.is_big_sector,
            _sectorComposite: compositeValue,
            notes: price.notes || '',
            status: price.status || 'Active',
            adult_selling: price.adult_selling || 0,
            adult_purchasing: price.adult_purchasing || 0,
            child_selling: price.child_selling || 0,
            child_purchasing: price.child_purchasing || 0,
            infant_selling: price.infant_selling || 0,
            infant_purchasing: price.infant_purchasing || 0
        });
        setEditingTransportPriceId(price.id || price._id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteTransportPrice = async (id) => {
        if (window.confirm('Are you sure you want to delete this transport price?')) {
            try {
                setLoading(true);
                await othersAPI.transportPrice.delete(id);
                setSuccessMessage('Transport price deleted successfully');
                fetchDataForTab("Transport Prices");
            } catch (err) {
                console.error('Error deleting transport price:', err);
                setError('Failed to delete transport price');
            } finally {
                setLoading(false);
            }
        }
    };

    // Flight IATA Handlers
    const handleEditFlightIATA = (flight) => {
        setFlightIATAForm({
            airline_name: flight.airline_name || flight.name, // Handle both potential cases during migration
            iata_code: flight.iata_code,
            logo_url: flight.logo_url || ''
        });
        setLogoPreview(flight.logo_url ? `http://localhost:8000${flight.logo_url}` : '');
        setLogoFile(null); // Reset file on edit
        setEditingFlightIATAId(flight.id || flight._id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteFlightIATA = async (id) => {
        if (window.confirm('Are you sure you want to delete this airline?')) {
            try {
                setLoading(true);
                await othersAPI.flightIATA.delete(id);
                setSuccessMessage('Airline deleted successfully');
                fetchDataForTab("Flight Name & IATA");
            } catch (err) {
                console.error('Error deleting airline:', err);
                setError('Failed to delete airline');
            } finally {
                setLoading(false);
            }
        }
    };

    // File Selection Handler (Deferred Upload)
    const handleLogoSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLogoFile(file);
        // Create local preview
        const objectUrl = URL.createObjectURL(file);
        setLogoPreview(objectUrl);
    };

    const handleSave = async () => {
        console.log('handleSave called for tab:', activeTab);
        setSaving(true);
        setError(null);
        setSuccessMessage('');

        try {
            switch (activeTab) {
                case "Set Riyal Rate":
                    if (riyalId) {
                        await othersAPI.riyalRate.update(riyalId, riyalSettings);
                        setSuccessMessage('Riyal rate updated successfully!');
                    } else {
                        await othersAPI.riyalRate.create(riyalSettings);
                        setSuccessMessage('Riyal rate set successfully!');
                        await fetchDataForTab(activeTab);
                    }
                    break;
                case "Manage Shirka Name":
                    if (!shirkaName.trim()) {
                        setError('Shirka name is required');
                        setSaving(false);
                        return;
                    }
                    await othersAPI.shirka.create({ name: shirkaName });
                    setSuccessMessage('Shirka added successfully!');
                    setShirkaName('');
                    await fetchDataForTab(activeTab);
                    break;
                case "Small Sectors":
                    // Validation
                    if (!sectorForm.departure_city || !sectorForm.arrival_city) {
                        setError('Departure and Arrival cities are required');
                        setSaving(false);
                        return;
                    }
                    if (sectorForm.departure_city === sectorForm.arrival_city) {
                        setError('Departure and Arrival cities cannot be the same');
                        setSaving(false);
                        return;
                    }

                    if (editingSectorId) {
                        await othersAPI.smallSector.update(editingSectorId, sectorForm);
                        setSuccessMessage('Small Sector updated successfully!');
                    } else {
                        await othersAPI.smallSector.create(sectorForm);
                        setSuccessMessage('Small Sector added successfully!');
                    }
                    // Reset
                    setSectorForm({
                        departure_city: '',
                        arrival_city: '',
                        contact_name: '',
                        contact_number: '',
                        sector_type: 'AIRPORT PICKUP'
                    });
                    setEditingSectorId(null);
                    await fetchDataForTab(activeTab); // Refresh list
                    break;

                case "Big Sectors":
                    console.log('Saving Big Sector:', bigSectorForm);
                    if (!bigSectorForm.name) {
                        console.error('Big Sector validation failed: Name missing');
                        setError('Big Sector Name is required');
                        setSaving(false);
                        return;
                    }

                    if (editingBigSectorId) {
                        console.log('Updating Big Sector:', editingBigSectorId);
                        await othersAPI.bigSector.update(editingBigSectorId, bigSectorForm);
                        setSuccessMessage('Big Sector updated successfully!');
                    } else {
                        console.log('Creating new Big Sector');
                        const res = await othersAPI.bigSector.create(bigSectorForm);
                        console.log('Big Sector created response:', res);
                        setSuccessMessage('Big Sector added successfully!');
                    }
                    setBigSectorForm({ name: '', small_sector_ids: [] });
                    setEditingBigSectorId(null);
                    await fetchDataForTab(activeTab);
                    break;

                case "Visa Rates Pex Wise":
                    if (!visaPexForm.title) {
                        setError('Visa Title is required');
                        setSaving(false);
                        return;
                    }
                    if (editingVisaPexId) {
                        await othersAPI.visaRatesPex.update(editingVisaPexId, visaPexForm);
                        setSuccessMessage('Visa Rate updated successfully!');
                    } else {
                        await othersAPI.visaRatesPex.create(visaPexForm);
                        setSuccessMessage('Visa Rate added successfully!');
                    }
                    setVisaPexForm({
                        title: '',
                        person_from: 0,
                        person_to: 0,
                        with_transport: false,
                        adult_selling: 0,
                        adult_purchasing: 0,
                        child_selling: 0,
                        child_purchasing: 0,
                        infant_selling: 0,
                        infant_purchasing: 0,
                        vehicle_ids: []
                    });
                    setEditingVisaPexId(null);
                    await fetchDataForTab(activeTab);
                    break;

                case "Food Prices":
                    if (!foodPriceForm.title || !foodPriceForm.city) {
                        setError('Title and City are required');
                        setSaving(false);
                        return;
                    }

                    if (editingFoodPriceId) {
                        await othersAPI.foodPrice.update(editingFoodPriceId, foodPriceForm);
                        setSuccessMessage('Food Price updated successfully!');
                    } else {
                        await othersAPI.foodPrice.create(foodPriceForm);
                        setSuccessMessage('Food Price added successfully!');
                    }

                    setFoodPriceForm({
                        title: '',
                        city: 'Makkah',
                        description: '',
                        min_pax: 0,
                        per_pax: 0,
                        adult_selling: 0,
                        adult_purchasing: 0,
                        child_selling: 0,
                        child_purchasing: 0,
                        infant_selling: 0,
                        infant_purchasing: 0
                    });
                    setEditingFoodPriceId(null);
                    await fetchDataForTab(activeTab);

                    break;

                case "Transport Prices":
                    if (!transportPriceForm.vehicle_name || !transportPriceForm.vehicle_type || !transportPriceForm.sector) {
                        setError('Vehicle Name, Type, and Sector are required');
                        setSaving(false);
                        return;
                    }

                    if (editingTransportPriceId) {
                        await othersAPI.transportPrice.update(editingTransportPriceId, transportPriceForm);
                        setSuccessMessage('Transport Price updated successfully!');
                    } else {
                        await othersAPI.transportPrice.create(transportPriceForm);
                        setSuccessMessage('Transport Price added successfully!');
                    }

                    setTransportPriceForm({
                        vehicle_name: '',
                        vehicle_type: '',
                        sector: '',
                        notes: '',
                        status: 'Active',
                        adult_selling: 0,
                        adult_purchasing: 0,
                        child_selling: 0,
                        child_purchasing: 0,
                        infant_selling: 0,
                        infant_purchasing: 0
                    });
                    setEditingTransportPriceId(null);
                    await fetchDataForTab(activeTab);
                    break;



                case "Ziarat Prices":
                    if (!ziaratPriceForm.title || !ziaratPriceForm.city) {
                        setError('Title and City are required');
                        setSaving(false);
                        return;
                    }

                    if (editingZiaratPriceId) {
                        await othersAPI.ziaratPrice.update(editingZiaratPriceId, ziaratPriceForm);
                        setSuccessMessage('Ziarat Price updated successfully!');
                    } else {
                        await othersAPI.ziaratPrice.create(ziaratPriceForm);
                        setSuccessMessage('Ziarat Price added successfully!');
                    }

                    setZiaratPriceForm({
                        city: 'Makkah',
                        title: '',
                        contact_person: '',
                        contact_number: '',
                        min_pax: 1,
                        max_pax: 50,
                        status: 'Active',
                        adult_selling: 0,
                        adult_purchasing: 0,
                        child_selling: 0,
                        child_purchasing: 0,
                        infant_selling: 0,
                        infant_purchasing: 0
                    });
                    setEditingZiaratPriceId(null);
                    await fetchDataForTab(activeTab);
                    break;

                    await fetchDataForTab(activeTab);
                    break;

                case "Transport Prices":
                    if (!transportPriceForm.vehicle_name || !transportPriceForm.vehicle_type || !transportPriceForm.sector) {
                        setError('Vehicle Name, Type, and Sector are required');
                        setSaving(false);
                        return;
                    }

                    if (editingTransportPriceId) {
                        await othersAPI.transportPrice.update(editingTransportPriceId, transportPriceForm);
                        setSuccessMessage('Transport Price updated successfully!');
                    } else {
                        await othersAPI.transportPrice.create(transportPriceForm);
                        setSuccessMessage('Transport Price added successfully!');
                    }

                    setTransportPriceForm({
                        vehicle_name: '',
                        vehicle_type: '',
                        sector: '',
                        sector_id: '',
                        is_big_sector: false,
                        notes: '',
                        status: 'Active',
                        adult_selling: 0,
                        adult_purchasing: 0,
                        child_selling: 0,
                        child_purchasing: 0,
                        infant_selling: 0,
                        infant_purchasing: 0
                    });
                    setEditingTransportPriceId(null);
                    await fetchDataForTab(activeTab);
                    break;

                case "Visa Rates Pex Wise":
                    if (cityName.trim() && cityCode.trim()) {
                        await othersAPI.cityIATA.create({ city_name: cityName, iata_code: cityCode, is_active: true });
                        setCityName('');
                        setCityCode('');
                        await fetchDataForTab(activeTab); // Refresh list
                        setSuccessMessage('City added successfully!');
                    }
                    break;

                case "Booking Expire Time":
                    if (expiryId) {
                        await othersAPI.bookingExpiry.update(expiryId, expiry);
                    } else {
                        const res = await othersAPI.bookingExpiry.create(expiry);
                        setExpiryId(res.data.id);
                    }
                    setSuccessMessage('Booking expiry settings updated successfully!');
                    break;

                case "City Name & IATA":
                    if (cityName.trim() && cityCode.trim()) {
                        await othersAPI.cityIATA.create({ city_name: cityName, iata_code: cityCode, is_active: true });
                        setCityName('');
                        setCityCode('');
                        await fetchDataForTab(activeTab); // Refresh list
                        setSuccessMessage('City added successfully!');
                    }
                    break;

                case "Flight Name & IATA":
                    if (!flightIATAForm.airline_name || !flightIATAForm.iata_code) {
                        setError('Airline Name and IATA Code are required');
                        setSaving(false);
                        return;
                    }

                    let currentLogoUrl = flightIATAForm.logo_url;

                    // If a new file is selected, upload it first
                    if (logoFile) {
                        try {
                            const uploadRes = await othersAPI.flightIATA.upload(logoFile);
                            currentLogoUrl = uploadRes.data.url; // Assuming backend returns { url: ... }
                        } catch (uploadErr) {
                            console.error('Upload failed:', uploadErr);
                            setError('Failed to upload logo image');
                            setSaving(false);
                            return;
                        }
                    }

                    const flightData = {
                        ...flightIATAForm,
                        airline_name: flightIATAForm.airline_name,
                        logo_url: currentLogoUrl
                    };

                    if (editingFlightIATAId) {
                        await othersAPI.flightIATA.update(editingFlightIATAId, flightData);
                        setSuccessMessage('Airline updated successfully!');
                    } else {
                        await othersAPI.flightIATA.create(flightData);
                        setSuccessMessage('Airline added successfully!');
                    }
                    setFlightIATAForm({ airline_name: '', iata_code: '', logo_url: '' });
                    setLogoFile(null);
                    setLogoPreview('');
                    setEditingFlightIATAId(null);
                    await fetchDataForTab(activeTab);
                    break;

                default:
                    setSuccessMessage('Settings saved!');
            }

            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            console.error('Error saving:', err);
            // Extract error message properly from validation errors or general errors
            let errorMsg = 'Failed to save';
            if (err.response?.data?.detail) {
                // Handle FastAPI validation errors (array of error objects)
                if (Array.isArray(err.response.data.detail)) {
                    errorMsg = err.response.data.detail.map(e => e.msg).join(', ');
                } else if (typeof err.response.data.detail === 'string') {
                    errorMsg = err.response.data.detail;
                } else {
                    errorMsg = JSON.stringify(err.response.data.detail);
                }
            } else if (err.message) {
                errorMsg = err.message;
            }
            setError(errorMsg);
            setTimeout(() => setError(''), 5000);
        } finally {
            setSaving(false);
        }
    };

    const handleDiscard = () => {
        fetchDataForTab(activeTab); // Reload data
        setSuccessMessage('');
        setError(null);
    };

    const handleEditVisaPex = (rate) => {
        setVisaPexForm({
            title: rate.title,
            person_from: rate.person_from,
            person_to: rate.person_to,
            with_transport: rate.with_transport || false,
            adult_selling: rate.adult_selling || 0,
            adult_purchasing: rate.adult_purchasing || 0,
            child_selling: rate.child_selling || 0,
            child_purchasing: rate.child_purchasing || 0,
            infant_selling: rate.infant_selling || 0,
            infant_purchasing: rate.infant_purchasing || 0,
            vehicle_ids: rate.vehicle_ids || []
        });
        setEditingVisaPexId(rate.id || rate._id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleVehicleToggle = (id) => {
        setVisaPexForm(prev => {
            const ids = prev.vehicle_ids.includes(id)
                ? prev.vehicle_ids.filter(vid => vid !== id)
                : [...prev.vehicle_ids, id];
            return { ...prev, vehicle_ids: ids };
        });
    };

    const handleDeleteVisaPex = async (id) => {
        if (window.confirm('Are you sure you want to delete this visa rate?')) {
            try {
                setLoading(true);
                await othersAPI.visaRatesPex.delete(id);
                setSuccessMessage('Visa Rate deleted successfully');
                fetchDataForTab("Visa Rates Pex Wise");
            } catch (err) {
                console.error('Error deleting visa rate:', err);
                setError('Failed to delete visa rate');
            } finally {
                setLoading(false);
            }
        }
    };

    // Only Visa Rates Handlers
    const handleVisaOptionChange = (option) => {
        // Save current form data to records before switching
        setOnlyVisaRecords(prev => ({
            ...prev,
            [visaOption]: { ...onlyVisaForm }
        }));

        // Switch to new option
        setVisaOption(option);

        // Load data for new option
        const savedData = onlyVisaRecords[option];
        if (savedData) {
            setOnlyVisaForm(savedData);
        } else {
            // Reset to default for this option
            setOnlyVisaForm({
                visa_option: option,
                status: 'Active',
                start_days: 0,
                end_days: 0,
                adult_selling: 0,
                adult_purchasing: 0,
                child_selling: 0,
                child_purchasing: 0,
                infant_selling: 0,
                infant_purchasing: 0
            });
        }
    };

    const handleUpdateOnlyVisa = async () => {
        try {
            setLoading(true);
            const dataToSave = { ...onlyVisaForm, visa_option: visaOption };

            // Find existing record for this visa_option
            const existingRecord = onlyVisaRates.find(r => r.visa_option === visaOption);

            if (existingRecord) {
                // Update existing
                await othersAPI.onlyVisaRate.update(existingRecord.id || existingRecord._id, dataToSave);
                setSuccessMessage(`${visaOption} Visa Rate updated successfully!`);
            } else {
                // Create new
                await othersAPI.onlyVisaRate.create(dataToSave);
                setSuccessMessage(`${visaOption} Visa Rate created successfully!`);
            }

            // Save to records (don't reset form)
            setOnlyVisaRecords(prev => ({
                ...prev,
                [visaOption]: { ...dataToSave }
            }));

            // Refresh data
            await fetchDataForTab("Only Visa Rates");
        } catch (err) {
            console.error('Error saving Only Visa Rate:', err);
            setError('Failed to save visa rate');
        } finally {
            setLoading(false);
        }
    };

    // UI Handlers
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setEditingSectorId(null);
        setEditingBigSectorId(null);
        setEditingVisaPexId(null);
        setSuccessMessage('');
        setError(null);
        // Reset forms if needed
        if (tab !== "Small Sectors") {
            setSectorForm({
                departure_city: '',
                arrival_city: '',
                contact_name: '',
                contact_number: '',
                sector_type: 'AIRPORT PICKUP'
            });
        }
        if (tab !== "Big Sectors") {
            setBigSectorForm({ name: '', small_sector_ids: [] });
        }
        if (tab !== "Visa Rates Pex Wise") {
            setVisaPexForm({
                title: '',
                person_from: 0,
                person_to: 0,
                with_transport: false,
                adult_selling: 0,
                adult_purchasing: 0,
                child_selling: 0,
                child_purchasing: 0,
                infant_selling: 0,
                infant_purchasing: 0
            });
        }
        if (tab !== "Food Prices") {
            setFoodPriceForm({
                title: '',
                city: 'Makkah',
                description: '',
                min_pax: 0,
                per_pax: 0,
                adult_selling: 0,
                adult_purchasing: 0,
                child_selling: 0,
                child_purchasing: 0,
                infant_selling: 0,
                infant_purchasing: 0
            });
        }
        if (tab !== "Flight Name & IATA") {
            setFlightIATAForm({ airline_name: '', iata_code: '', logo_url: '' });
            setLogoFile(null);
            setLogoPreview('');
            setEditingFlightIATAId(null);
        }
    };

    // Check if currently editing based on active tab
    const isEditing = () => {
        switch (activeTab) {
            case "Small Sectors": return !!editingSectorId;
            case "Big Sectors": return !!editingBigSectorId;
            case "Visa Rates Pex Wise": return !!editingVisaPexId;
            case "Transport Prices": return !!editingTransportPriceId;
            case "Food Prices": return !!editingFoodPriceId;
            case "Ziarat Prices": return !!editingZiaratPriceId;
            case "Flight Name & IATA": return !!editingFlightIATAId;
            case "Booking Expire Time": return !!expiryId;
            default: return false;
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 text-left pb-32 animate-in fade-in duration-500">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-3 hover:bg-white rounded-xl text-slate-400 transition-all border border-transparent hover:border-slate-200">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">Others Management</h1>
                        <p className="text-slate-500 font-medium mt-2">Manage rates, sectors, and service pricing configurations.</p>
                    </div>
                </div>
            </div>

            {/* Success Message */}
            {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top duration-300">
                    <CheckCircle2 size={20} />
                    <span className="font-bold text-sm">{successMessage}</span>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top duration-300">
                    <AlertCircle size={20} />
                    <span className="font-bold text-sm">{error}</span>
                </div>
            )}

            {/* Tab Navigation with Wrapping */}
            <div className="bg-white p-2 rounded-[24px] border border-slate-200 shadow-sm">
                <div className="flex items-center flex-wrap gap-2 px-2 py-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => handleTabChange(tab)}
                            disabled={loading || saving}
                            className={`whitespace-nowrap px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 disabled:opacity-50 ${activeTab === tab
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area - Master Card */}
            <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden min-h-[600px]">
                {/* Loading State */}
                {loading ? (
                    <div className="p-10 lg:p-14 flex flex-col items-center justify-center min-h-[600px] gap-4">
                        <Loader2 size={48} className="animate-spin text-blue-600" />
                        <p className="text-slate-400 font-bold text-sm">Loading data...</p>
                    </div>
                ) : (
                    <>
                        {/* Render Form Based on Active Tab */}
                        <div className="p-10 lg:p-14">
                            {activeTab === "Set Riyal Rate" && <RiyalRateSection settings={riyalSettings} setSettings={setRiyalSettings} />}
                            {activeTab === "Manage Shirka Name" && <ShirkaSection shirkas={shirkas} name={shirkaName} setName={setShirkaName} />}
                            {activeTab === "Small Sectors" && <SmallSectorsSection form={sectorForm} setForm={setSectorForm} sectors={smallSectors} cities={cityIATAs} onEdit={handleEditSector} onDelete={handleDeleteSector} isEditing={!!editingSectorId} />}
                            {activeTab === "Big Sectors" && <BigSectorsSection form={bigSectorForm} setForm={setBigSectorForm} availableSmallSectors={smallSectors} existingBigSectors={bigSectors} onEdit={handleEditBigSector} onDelete={handleDeleteBigSector} isEditing={!!editingBigSectorId} />}
                            {activeTab === "Visa Rates Pex Wise" && <VisaPexSection form={visaPexForm} setForm={setVisaPexForm} rates={visaPexRates} transportPrices={transportPrices} showTransportModal={showVehicleModal} setShowTransportModal={setShowVehicleModal} onToggleTransport={handleVehicleToggle} onEdit={handleEditVisaPex} onDelete={handleDeleteVisaPex} isEditing={!!editingVisaPexId} />}
                            {activeTab === "Only Visa Rates" && <OnlyVisaSection visaOption={visaOption} onVisaOptionChange={handleVisaOptionChange} form={onlyVisaForm} setForm={setOnlyVisaForm} onUpdate={handleUpdateOnlyVisa} />}
                            {activeTab === "Transport Prices" && <TransportPricesSection form={transportPriceForm} setForm={setTransportPriceForm} prices={transportPrices} sectorOptions={sectorOptions} onEdit={handleEditTransportPrice} onDelete={handleDeleteTransportPrice} isEditing={!!editingTransportPriceId} />}
                            {activeTab === "Food Prices" && <FoodPricesSection form={foodPriceForm} setForm={setFoodPriceForm} prices={foodPrices} onEdit={handleEditFoodPrice} onDelete={handleDeleteFoodPrice} isEditing={!!editingFoodPriceId} />}
                            {activeTab === "Ziarat Prices" && <ZiaratPricesSection form={ziaratPriceForm} setForm={setZiaratPriceForm} prices={ziaratPrices} onEdit={handleEditZiaratPrice} onDelete={handleDeleteZiaratPrice} isEditing={!!editingZiaratPriceId} />}
                            {activeTab === "Flight Name & IATA" && <FlightIATASection form={flightIATAForm} setForm={setFlightIATAForm} airlines={flightIATAs} onEdit={handleEditFlightIATA} onDelete={handleDeleteFlightIATA} isEditing={!!editingFlightIATAId} onLogoSelect={handleLogoSelect} logoPreview={logoPreview} />}
                            {activeTab === "City Name & IATA" && <CityIATASection cities={cityIATAs} cityName={cityName} setCityName={setCityName} cityCode={cityCode} setCityCode={setCityCode} />}
                            {activeTab === "Booking Expire Time" && <ExpiryTimeSection expiry={expiry} setExpiry={setExpiry} />}
                        </div>

                        {/* Global Action Footer (Shown inside the card) */}
                        {activeTab !== "Only Visa Rates" && (
                            <div className="px-10 lg:px-14 py-8 border-t border-slate-50 flex items-center justify-end gap-4 bg-slate-50/30">
                                <button
                                    onClick={handleDiscard}
                                    disabled={saving}
                                    className="px-8 py-4 bg-white border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Discard
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-12 py-4 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:scale-[1.02] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={16} />
                                            {isEditing() ? 'Update Changes' : 'Save New Entry'}
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

// --- SECTION COMPONENTS ---

const RiyalRateSection = ({ settings, setSettings }) => (
    <div className="space-y-12">
        <div className="max-w-md space-y-6">
            <SectionHeading title="Currency Configuration" subtitle="Define the daily Riyal exchange rate for all costings." />
            <InputGroup
                label="Riyal Exchange Rate (SAR to PKR)"
                placeholder="e.g., 74.50"
                type="number"
                icon={<DollarSign size={18} />}
                value={settings.rate}
                onChange={(e) => setSettings({ ...settings, rate: e.target.value })}
            />
        </div>

        <div className="space-y-6">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-[3px]">Global Currency Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <CheckboxGroup label="Visa in PKR" checked={settings.is_visa_pkr} onChange={(val) => setSettings({ ...settings, is_visa_pkr: val })} />
                <CheckboxGroup label="Hotel in PKR" checked={settings.is_hotel_pkr} onChange={(val) => setSettings({ ...settings, is_hotel_pkr: val })} />
                <CheckboxGroup label="Transport in PKR" checked={settings.is_transport_pkr} onChange={(val) => setSettings({ ...settings, is_transport_pkr: val })} />
                <CheckboxGroup label="Ziarat in PKR" checked={settings.is_ziarat_pkr} onChange={(val) => setSettings({ ...settings, is_ziarat_pkr: val })} />
                <CheckboxGroup label="Food in PKR" checked={settings.is_food_pkr} onChange={(val) => setSettings({ ...settings, is_food_pkr: val })} />
            </div>
        </div>
    </div>
);

const ShirkaSection = ({ shirkas, name, setName }) => (
    <div className="space-y-12">
        <div className="max-w-md space-y-6">
            <SectionHeading title="Shirka Directory" subtitle="Manage Saudi company registrations." />
            <InputGroup label="Shirka Name" placeholder="Enter Saudi Company Name" value={name} onChange={(e) => setName(e.target.value)} icon={<Building size={18} />} />
        </div>

        <div className="space-y-6">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-[3px]">Existing Shirkas</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {shirkas.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all">
                        <span className="font-bold text-slate-700">{s.name}</span>
                        <div className="flex gap-2">
                            <button className="p-2 bg-white text-slate-400 rounded-lg shadow-sm hover:text-blue-600"><Edit3 size={14} /></button>
                            <button className="p-2 bg-white text-slate-400 rounded-lg shadow-sm hover:text-red-500"><Trash2 size={14} /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const SmallSectorsSection = ({ form, setForm, sectors = [], cities = [], onEdit, onDelete, isEditing }) => {
    // Filter cities for departure (exclude arrival city)
    const departureCities = cities.filter(c => c.city_name !== form.arrival_city);
    // Filter cities for arrival (exclude departure city)
    const arrivalCities = cities.filter(c => c.city_name !== form.departure_city);

    return (
        <div className="space-y-10">
            <SectionHeading title={isEditing ? "Edit Short-Haul Sector" : "Short-Haul Sectors"} subtitle="Define logistics segments for transport mapping." />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <SelectGroup
                    label="Departure City"
                    options={departureCities.map(c => c.city_name)}
                    value={form.departure_city}
                    onChange={(e) => setForm({ ...form, departure_city: e.target.value })}
                    placeholder="Select departure city..."
                />
                <SelectGroup
                    label="Arrival City"
                    options={arrivalCities.map(c => c.city_name)}
                    value={form.arrival_city}
                    onChange={(e) => setForm({ ...form, arrival_city: e.target.value })}
                    placeholder="Select arrival city..."
                />
                <SelectGroup
                    label="Sector Type"
                    options={['AIRPORT PICKUP', 'AIRPORT DROP', 'HOTEL TO HOTEL']}
                    value={form.sector_type}
                    onChange={(e) => setForm({ ...form, sector_type: e.target.value })}
                    placeholder="Select sector type..."
                />
                <InputGroup
                    label="Contact Name"
                    placeholder="Contact person"
                    value={form.contact_name}
                    onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                />
                <InputGroup
                    label="Contact Number"
                    placeholder="+92 XXX XXXXXXX"
                    type="tel"
                    value={form.contact_number}
                    onChange={(e) => setForm({ ...form, contact_number: e.target.value })}
                />
            </div>

            {/* Existing Sectors Display */}
            {sectors.length > 0 && (
                <div className="space-y-6">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[3px]">Existing Small Sectors</h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {sectors.map((sector) => (
                            <div key={sector.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <MapPin size={14} className="text-blue-600" />
                                            <span className="font-black text-xs text-slate-700">
                                                {sector.departure_city} → {sector.arrival_city}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                            {sector.sector_type}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => onEdit(sector)} className="p-2 bg-white text-slate-400 rounded-lg shadow-sm hover:text-blue-600 transition-colors"><Edit3 size={14} /></button>
                                        <button onClick={() => onDelete(sector.id || sector._id)} className="p-2 bg-white text-slate-400 rounded-lg shadow-sm hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                                {sector.contact_name && (
                                    <div className="text-xs text-slate-600 font-medium">
                                        Contact: {sector.contact_name} {sector.contact_number && `• ${sector.contact_number}`}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const BigSectorsSection = ({ form, setForm, availableSmallSectors = [], existingBigSectors = [], onEdit, onDelete, isEditing }) => {

    const handleCheckboxChange = (sectorId, isChecked) => {
        const currentIds = form.small_sector_ids || [];
        if (isChecked) {
            setForm({ ...form, small_sector_ids: [...currentIds, sectorId] });
        } else {
            setForm({ ...form, small_sector_ids: currentIds.filter(id => id !== sectorId) });
        }
    };

    return (
        <div className="space-y-10">
            <SectionHeading title={isEditing ? "Edit Big Sector" : "Big Sectors Configuration"} subtitle="Create groups of short-haul sectors for full trip routes." />

            {/* Form */}
            <div className="space-y-6">
                <InputGroup
                    label="Big Sector Name"
                    placeholder="e.g., Full Umrah Route"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    icon={<MapPinned size={18} />}
                />

                <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 space-y-6">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Select Small Sectors to Bundle</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {availableSmallSectors.map((sector) => (
                            <CheckboxGroup
                                key={sector.id || sector._id}
                                label={`${sector.departure_city} → ${sector.arrival_city} (${sector.sector_type})`}
                                checked={form.small_sector_ids?.includes(sector.id || sector._id)}
                                onChange={(isChecked) => handleCheckboxChange(sector.id || sector._id, isChecked)}
                            />
                        ))}
                        {availableSmallSectors.length === 0 && (
                            <div className="col-span-full text-center text-slate-400 text-sm py-4">No small sectors available. Please create some first.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Existing Big Sectors Display */}
            {existingBigSectors.length > 0 && (
                <div className="space-y-6">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[3px]">Existing Big Sectors</h4>
                    <div className="grid grid-cols-1 gap-4">
                        {existingBigSectors.map((bigSector) => {
                            // Use populated details if available, otherwise filter from available (fallback)
                            const includedSectors = bigSector.small_sectors_details?.length > 0
                                ? bigSector.small_sectors_details
                                : availableSmallSectors.filter(s => bigSector.small_sector_ids?.includes(s.id || s._id));

                            return (
                                <div key={bigSector.id || bigSector._id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <Globe size={18} className="text-blue-600" />
                                            <span className="font-black text-lg text-slate-700">{bigSector.name}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => onEdit(bigSector)} className="p-2 bg-white text-slate-400 rounded-lg shadow-sm hover:text-blue-600 transition-colors"><Edit3 size={14} /></button>
                                            <button onClick={() => onDelete(bigSector.id || bigSector._id)} className="p-2 bg-white text-slate-400 rounded-lg shadow-sm hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Included Route Segments:</div>
                                        <div className="flex flex-wrap gap-2">
                                            {includedSectors.length > 0 ? (
                                                includedSectors.map((s, idx) => (
                                                    <div key={idx} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 flex items-center gap-1.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                                        {s.departure_city} → {s.arrival_city}
                                                        {s.contact_name && <span className="text-[10px] text-slate-400 ml-1">({s.contact_name})</span>}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg w-fit">
                                                    <AlertCircle size={12} />
                                                    <span className="text-xs font-bold">No sectors linked. Click edit to add routes.</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

const VisaPexSection = ({ form, setForm, rates = [], transportPrices = [], showTransportModal, setShowTransportModal, onToggleTransport, onEdit, onDelete, isEditing }) => (
    <div className="space-y-10">
        <SectionHeading title={isEditing ? "Edit Visa Pricing" : "Visa Pricing (Pax Group Wise)"} subtitle="Define scaled pricing for group sizes." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
                <InputGroup
                    label="Visa Title"
                    placeholder="e.g. Group Visa 10-20 pax"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <InputGroup
                    label="Person From"
                    placeholder="10"
                    type="number"
                    value={form.person_from}
                    onChange={(e) => setForm({ ...form, person_from: parseInt(e.target.value) || 0 })}
                />
                <InputGroup
                    label="Person To"
                    placeholder="20"
                    type="number"
                    value={form.person_to}
                    onChange={(e) => setForm({ ...form, person_to: parseInt(e.target.value) || 0 })}
                />
            </div>
            <div className="md:col-span-3 bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                <button
                    onClick={() => form.with_transport && setShowTransportModal(true)}
                    disabled={!form.with_transport}
                    className={`px-6 py-3 border-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${form.with_transport
                        ? 'border-blue-100 text-blue-600 hover:bg-blue-50 cursor-pointer'
                        : 'border-slate-200 text-slate-400 cursor-not-allowed opacity-50'
                        }`}
                >
                    <Truck size={14} /> Select Vehicles
                    {form.vehicle_ids?.length > 0 && <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-[9px]">{form.vehicle_ids.length}</span>}
                </button>
                <CheckboxGroup label="Rate Includes Transport" checked={form.with_transport} onChange={(val) => setForm({ ...form, with_transport: val, vehicle_ids: val ? form.vehicle_ids : [] })} />
            </div>

            {/* Transport Selection Modal */}
            {showTransportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div>
                                <h3 className="text-lg font-black text-slate-800">Select Vehicles</h3>
                                <p className="text-xs text-slate-500 font-medium mt-1">Choose allowed transport options for this visa rate.</p>
                            </div>
                            <button onClick={() => setShowTransportModal(false)} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-600">
                                <Plus className="rotate-45" size={24} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-4">
                            {transportPrices.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {transportPrices.map(tp => (
                                        <div
                                            key={tp.id || tp._id}
                                            onClick={() => onToggleTransport(tp.id || tp._id)}
                                            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${form.vehicle_ids?.includes(tp.id || tp._id)
                                                ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200'
                                                : 'bg-white border-slate-100 hover:border-blue-100 hover:bg-slate-50'
                                                }`}
                                        >
                                            <div className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${form.vehicle_ids?.includes(tp.id || tp._id)
                                                ? 'bg-blue-600 border-blue-600 text-white'
                                                : 'border-slate-300 bg-white'
                                                }`}>
                                                {form.vehicle_ids?.includes(tp.id || tp._id) && <CheckCircle2 size={12} />}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800 text-sm">{tp.vehicle_name}</div>
                                                <div className="text-[10px] uppercase font-black text-slate-400 mt-0.5">{tp.vehicle_type} • {tp.sector}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-slate-400">
                                    <Truck size={48} className="mx-auto mb-4 opacity-20" />
                                    <p className="font-medium">No transport prices available.</p>
                                    <p className="text-xs mt-1">Add vehicles in Transport Prices tab first.</p>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                            <button
                                onClick={() => setShowTransportModal(false)}
                                className="px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 bg-slate-50 p-8 rounded-[32px] border border-slate-100">
            <DoublePriceInput
                label="Adult"
                selling={form.adult_selling}
                purchasing={form.adult_purchasing}
                onSellingChange={(val) => setForm({ ...form, adult_selling: val })}
                onPurchasingChange={(val) => setForm({ ...form, adult_purchasing: val })}
            />
            <DoublePriceInput
                label="Child"
                selling={form.child_selling}
                purchasing={form.child_purchasing}
                onSellingChange={(val) => setForm({ ...form, child_selling: val })}
                onPurchasingChange={(val) => setForm({ ...form, child_purchasing: val })}
            />
            <DoublePriceInput
                label="Infant"
                selling={form.infant_selling}
                purchasing={form.infant_purchasing}
                onSellingChange={(val) => setForm({ ...form, infant_selling: val })}
                onPurchasingChange={(val) => setForm({ ...form, infant_purchasing: val })}
            />
        </div>

        {/* Existing Rates List */}
        {rates.length > 0 && (
            <div className="space-y-6 pt-10 border-t border-slate-100">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[3px]">Existing Visa Rates</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rates.map((rate) => (
                        <div key={rate.id || rate._id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all flex flex-col justify-between">
                            <div>
                                <div className="flex items-start justify-between mb-2">
                                    <h5 className="font-bold text-slate-800">{rate.title}</h5>
                                    <span className="text-[10px] font-black uppercase bg-blue-100 text-blue-600 px-2 py-1 rounded-md">{rate.person_from} - {rate.person_to} PAX</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    <div className="bg-white p-2 rounded-lg border border-slate-100">
                                        <div className="text-[9px] text-slate-400 uppercase font-black">Adult Sell</div>
                                        <div className="text-sm font-bold text-slate-700">{rate.adult_selling}</div>
                                    </div>
                                    <div className="bg-white p-2 rounded-lg border border-slate-100">
                                        <div className="text-[9px] text-slate-400 uppercase font-black">Vehicles</div>
                                        <div className="text-sm font-bold text-slate-700">
                                            {rate.vehicle_ids && rate.vehicle_ids.length > 0 && Array.isArray(transportPrices)
                                                ? rate.vehicle_ids.map(vid => {
                                                    const vehicle = transportPrices.find(tp => (tp.id || tp._id) === vid);
                                                    return vehicle?.vehicle_name;
                                                }).filter(Boolean).join(', ') || 'N/A'
                                                : 'None'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 justify-end pt-2 border-t border-slate-200">
                                <button onClick={() => onEdit(rate)} className="p-2 bg-white text-slate-400 rounded-lg shadow-sm hover:text-blue-600 transition-colors"><Edit3 size={14} /></button>
                                <button onClick={() => onDelete(rate.id || rate._id)} className="p-2 bg-white text-slate-400 rounded-lg shadow-sm hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
);

const OnlyVisaSection = ({ visaOption, onVisaOptionChange, form, setForm, onUpdate }) => (
    <div className="space-y-10">
        <SectionHeading title="Direct Visa Rates" subtitle="Standard rates for visa-only processing." />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-3">Visa Option</label>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => onVisaOptionChange('Only')}
                        className={`flex-1 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all border-2 ${visaOption === 'Only'
                            ? 'border-blue-100 text-blue-600 bg-blue-50'
                            : 'border-slate-200 text-slate-400 hover:border-blue-100 hover:text-blue-600'
                            }`}
                    >
                        Only
                    </button>
                    <button
                        type="button"
                        onClick={() => onVisaOptionChange('Long Term')}
                        className={`flex-1 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all border-2 ${visaOption === 'Long Term'
                            ? 'border-blue-100 text-blue-600 bg-blue-50'
                            : 'border-slate-200 text-slate-400 hover:border-blue-100 hover:text-blue-600'
                            }`}
                    >
                        Long Term
                    </button>
                </div>
            </div>
            <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-3">Status</label>
                <div className="flex gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name={`visa-status-${visaOption}`}
                            value="Active"
                            checked={form.status === 'Active'}
                            onChange={(e) => setForm({ ...form, status: e.target.value })}
                            className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                        />
                        <span className="text-sm font-bold text-slate-700">Active</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name={`visa-status-${visaOption}`}
                            value="Inactive"
                            checked={form.status === 'Inactive'}
                            onChange={(e) => setForm({ ...form, status: e.target.value })}
                            className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                        />
                        <span className="text-sm font-bold text-slate-700">Inactive</span>
                    </label>
                </div>
            </div>
            <InputGroup
                label="Start Days (Validity)"
                placeholder="28"
                type="number"
                value={form.start_days}
                onChange={(e) => setForm({ ...form, start_days: parseInt(e.target.value) || 0 })}
            />
            <InputGroup
                label="End Days (Validity)"
                placeholder="90"
                type="number"
                value={form.end_days}
                onChange={(e) => setForm({ ...form, end_days: parseInt(e.target.value) || 0 })}
            />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 border-t border-slate-100 pt-10">
            <DoublePriceInput
                label="Adult"
                selling={form.adult_selling}
                purchasing={form.adult_purchasing}
                onSellingChange={(val) => setForm({ ...form, adult_selling: val })}
                onPurchasingChange={(val) => setForm({ ...form, adult_purchasing: val })}
            />
            <DoublePriceInput
                label="Child"
                selling={form.child_selling}
                purchasing={form.child_purchasing}
                onSellingChange={(val) => setForm({ ...form, child_selling: val })}
                onPurchasingChange={(val) => setForm({ ...form, child_purchasing: val })}
            />
            <DoublePriceInput
                label="Infant"
                selling={form.infant_selling}
                purchasing={form.infant_purchasing}
                onSellingChange={(val) => setForm({ ...form, infant_selling: val })}
                onPurchasingChange={(val) => setForm({ ...form, infant_purchasing: val })}
            />
        </div>

        {/* Update Button */}
        <div className="flex justify-end pt-6 border-t border-slate-100">
            <button
                onClick={onUpdate}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center gap-2"
            >
                <Save size={18} />
                Update {visaOption} Visa Rate
            </button>
        </div>
    </div>
);

const TransportPricesSection = ({ form, setForm, prices = [], sectorOptions = [], onEdit, onDelete, isEditing }) => (
    <div className="space-y-10">
        <SectionHeading title={isEditing ? "Edit Transport Price" : "Transport Master Rates"} subtitle="Manage vehicle costing and market rates per sector." />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <InputGroup
                label="Vehicle Name"
                placeholder="e.g. Luxury Bus"
                value={form.vehicle_name}
                onChange={(e) => setForm({ ...form, vehicle_name: e.target.value })}
            />
            <InputGroup
                label="Vehicle Type"
                placeholder="Bus/Car/Van"
                value={form.vehicle_type}
                onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })}
            />
            <SelectGroup
                label="Sector"
                options={sectorOptions}
                value={form._sectorComposite || (form.sector_id ? `${form.sector_id}|${form.is_big_sector}|${form.sector}` : '')}
                onChange={(e) => {
                    const val = e.target.value;
                    if (!val) {
                        setForm({ ...form, sector: '', sector_id: '', is_big_sector: false, _sectorComposite: '' });
                    } else {
                        const [id, isBig, label] = val.split('|');
                        setForm({
                            ...form,
                            sector: label,
                            sector_id: id,
                            is_big_sector: isBig === 'true',
                            _sectorComposite: val
                        });
                    }
                }}
            />
            <div className="md:col-span-2">
                <InputGroup
                    label="Notes"
                    placeholder="Additional details..."
                    type="textarea"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
            </div>
            <SelectGroup
                label="Status"
                options={['Active', 'Inactive']}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
            />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 bg-slate-50 p-8 rounded-[32px]">
            <DoublePriceInput
                label="Adult"
                selling={form.adult_selling}
                purchasing={form.adult_purchasing}
                onSellingChange={(val) => setForm({ ...form, adult_selling: val })}
                onPurchasingChange={(val) => setForm({ ...form, adult_purchasing: val })}
            />
            <DoublePriceInput
                label="Child"
                selling={form.child_selling}
                purchasing={form.child_purchasing}
                onSellingChange={(val) => setForm({ ...form, child_selling: val })}
                onPurchasingChange={(val) => setForm({ ...form, child_purchasing: val })}
            />
            <DoublePriceInput
                label="Infant"
                selling={form.infant_selling}
                purchasing={form.infant_purchasing}
                onSellingChange={(val) => setForm({ ...form, infant_selling: val })}
                onPurchasingChange={(val) => setForm({ ...form, infant_purchasing: val })}
            />
        </div>

        {/* Existing Transport Prices List */}
        {prices.length > 0 && (
            <div className="space-y-6 pt-10 border-t border-slate-100">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[3px]">Existing Transport Rates</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {prices.map((price) => (
                        <div key={price.id || price._id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all flex flex-col justify-between">
                            <div>
                                <div className="flex items-start justify-between mb-2">
                                    <h5 className="font-bold text-slate-800">{price.vehicle_name} ({price.vehicle_type})</h5>
                                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${price.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>{price.status}</span>
                                </div>
                                <div className="flex items-center gap-2 mb-4">
                                    <MapPin size={12} className="text-blue-500" />
                                    <span className="text-xs font-bold text-slate-500">{price.sector}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    <div className="bg-white p-2 rounded-lg border border-slate-100">
                                        <div className="text-[9px] text-slate-400 uppercase font-black">Adult Sell</div>
                                        <div className="text-sm font-bold text-slate-700">{price.adult_selling}</div>
                                    </div>
                                    <div className="bg-white p-2 rounded-lg border border-slate-100">
                                        <div className="text-[9px] text-slate-400 uppercase font-black">Adult Buy</div>
                                        <div className="text-sm font-bold text-slate-700">{price.adult_purchasing}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 justify-end pt-2 border-t border-slate-200">
                                <button onClick={() => onEdit(price)} className="p-2 bg-white text-slate-400 rounded-lg shadow-sm hover:text-blue-600 transition-colors"><Edit3 size={14} /></button>
                                <button onClick={() => onDelete(price.id || price._id)} className="p-2 bg-white text-slate-400 rounded-lg shadow-sm hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
);

const FoodPricesSection = ({ form, setForm, prices = [], onEdit, onDelete, isEditing }) => (
    <div className="space-y-10">
        <SectionHeading title={isEditing ? "Edit Catering Package" : "Catering Pricing"} subtitle="Set standard rates for various meal plans." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
                <InputGroup
                    label="Title"
                    placeholder="e.g. Breakfast Package"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
            </div>
            <SelectGroup
                label="City"
                options={['Makkah', 'Madinah']}
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
            <div className="md:col-span-2">
                <InputGroup
                    label="Description"
                    placeholder="..."
                    type="textarea"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })} // Note: InputGroup for textarea also uses onChange
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <InputGroup
                    label="Min Pax"
                    placeholder="0"
                    type="number"
                    value={form.min_pax}
                    onChange={(e) => setForm({ ...form, min_pax: parseInt(e.target.value) || 0 })}
                />
                <InputGroup
                    label="Per Pax"
                    placeholder="0"
                    type="number"
                    value={form.per_pax}
                    onChange={(e) => setForm({ ...form, per_pax: parseInt(e.target.value) || 0 })}
                />
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 border-t border-slate-100 pt-10">
            <DoublePriceInput
                label="Adult"
                color="blue"
                selling={form.adult_selling}
                purchasing={form.adult_purchasing}
                onSellingChange={(val) => setForm({ ...form, adult_selling: val })}
                onPurchasingChange={(val) => setForm({ ...form, adult_purchasing: val })}
            />
            <DoublePriceInput
                label="Child"
                color="blue"
                selling={form.child_selling}
                purchasing={form.child_purchasing}
                onSellingChange={(val) => setForm({ ...form, child_selling: val })}
                onPurchasingChange={(val) => setForm({ ...form, child_purchasing: val })}
            />
            <DoublePriceInput
                label="Infant"
                color="blue"
                selling={form.infant_selling}
                purchasing={form.infant_purchasing}
                onSellingChange={(val) => setForm({ ...form, infant_selling: val })}
                onPurchasingChange={(val) => setForm({ ...form, infant_purchasing: val })}
            />
        </div>

        {/* Existing Food Prices List */}
        {prices.length > 0 && (
            <div className="space-y-6 pt-10 border-t border-slate-100">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[3px]">Existing Packages</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {prices.map((price) => (
                        <div key={price.id || price._id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all flex flex-col justify-between">
                            <div>
                                <div className="flex items-start justify-between mb-2">
                                    <h5 className="font-bold text-slate-800">{price.title}</h5>
                                    <span className="text-[10px] font-black uppercase bg-blue-100 text-blue-600 px-2 py-1 rounded-md">{price.city}</span>
                                </div>
                                <p className="text-xs text-slate-500 mb-4 line-clamp-2">{price.description}</p>
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    <div className="bg-white p-2 rounded-lg border border-slate-100">
                                        <div className="text-[9px] text-slate-400 uppercase font-black">Adult Sell</div>
                                        <div className="text-sm font-bold text-slate-700">{price.adult_selling}</div>
                                    </div>
                                    <div className="bg-white p-2 rounded-lg border border-slate-100">
                                        <div className="text-[9px] text-slate-400 uppercase font-black">Adult Buy</div>
                                        <div className="text-sm font-bold text-slate-700">{price.adult_purchasing}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 justify-end pt-2 border-t border-slate-200">
                                <button onClick={() => onEdit(price)} className="p-2 bg-white text-slate-400 rounded-lg shadow-sm hover:text-blue-600 transition-colors"><Edit3 size={14} /></button>
                                <button onClick={() => onDelete(price.id || price._id)} className="p-2 bg-white text-slate-400 rounded-lg shadow-sm hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
);

const ZiaratPricesSection = ({ form, setForm, prices = [], onEdit, onDelete, isEditing }) => (
    <div className="space-y-10">
        <SectionHeading title={isEditing ? "Edit Ziarat Price" : "Ziarat Management"} subtitle="Configuration for local tours and visit pricing." />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <SelectGroup
                label="City"
                options={['Makkah', 'Madinah']}
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
            <InputGroup
                label="Ziarat Title"
                placeholder="e.g. Masjid Nabawi Visit"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <InputGroup
                label="Contact Person"
                placeholder="..."
                value={form.contact_person}
                onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
            />
            <InputGroup
                label="Contact Number"
                placeholder="..."
                type="tel"
                value={form.contact_number}
                onChange={(e) => setForm({ ...form, contact_number: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
                <InputGroup
                    label="Min Pax"
                    placeholder="1"
                    type="number"
                    value={form.min_pax}
                    onChange={(e) => setForm({ ...form, min_pax: parseInt(e.target.value) || 0 })}
                />
                <InputGroup
                    label="Max Pax"
                    placeholder="50"
                    type="number"
                    value={form.max_pax}
                    onChange={(e) => setForm({ ...form, max_pax: parseInt(e.target.value) || 0 })}
                />
            </div>
            <SelectGroup
                label="Status"
                options={['Active', 'Inactive']}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
            />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 bg-slate-50 p-8 rounded-[32px]">
            <DoublePriceInput
                label="Adult"
                selling={form.adult_selling}
                purchasing={form.adult_purchasing}
                onSellingChange={(val) => setForm({ ...form, adult_selling: val })}
                onPurchasingChange={(val) => setForm({ ...form, adult_purchasing: val })}
            />
            <DoublePriceInput
                label="Child"
                selling={form.child_selling}
                purchasing={form.child_purchasing}
                onSellingChange={(val) => setForm({ ...form, child_selling: val })}
                onPurchasingChange={(val) => setForm({ ...form, child_purchasing: val })}
            />
            <DoublePriceInput
                label="Infant"
                selling={form.infant_selling}
                purchasing={form.infant_purchasing}
                onSellingChange={(val) => setForm({ ...form, infant_selling: val })}
                onPurchasingChange={(val) => setForm({ ...form, infant_purchasing: val })}
            />
        </div>

        {/* Existing Ziarat Prices List */}
        {prices.length > 0 && (
            <div className="space-y-6 pt-10 border-t border-slate-100">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[3px]">Existing Ziarat Packages</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {prices.map((price) => (
                        <div key={price.id || price._id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all flex flex-col justify-between">
                            <div>
                                <div className="flex items-start justify-between mb-2">
                                    <h5 className="font-bold text-slate-800">{price.title}</h5>
                                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${price.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>{price.status}</span>
                                </div>
                                <div className="flex items-center gap-2 mb-4">
                                    <MapPin size={12} className="text-blue-500" />
                                    <span className="text-xs font-bold text-slate-500">{price.city}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    <div className="bg-white p-2 rounded-lg border border-slate-100">
                                        <div className="text-[9px] text-slate-400 uppercase font-black">Adult Sell</div>
                                        <div className="text-sm font-bold text-slate-700">{price.adult_selling}</div>
                                    </div>
                                    <div className="bg-white p-2 rounded-lg border border-slate-100">
                                        <div className="text-[9px] text-slate-400 uppercase font-black">Min Pax</div>
                                        <div className="text-sm font-bold text-slate-700">{price.min_pax}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 justify-end pt-2 border-t border-slate-200">
                                <button onClick={() => onEdit(price)} className="p-2 bg-white text-slate-400 rounded-lg shadow-sm hover:text-blue-600 transition-colors"><Edit3 size={14} /></button>
                                <button onClick={() => onDelete(price.id || price._id)} className="p-2 bg-white text-slate-400 rounded-lg shadow-sm hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
);

const FlightIATASection = ({ form, setForm, airlines = [], onEdit, onDelete, isEditing, onLogoSelect, logoPreview }) => (
    <div className="space-y-10">
        <SectionHeading title={isEditing ? "Edit Carrier Registry" : "Carrier Registry"} subtitle="Manage airline names and international codes." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
            <InputGroup
                label="Airline Name"
                placeholder="Pakistan International Airlines"
                value={form.airline_name}
                onChange={(e) => setForm({ ...form, airline_name: e.target.value })}
            />
            <InputGroup
                label="IATA Code"
                placeholder="PK"
                value={form.iata_code}
                onChange={(e) => setForm({ ...form, iata_code: e.target.value })}
            />
            <div className="md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2 block">Airline Logo</label>
                <div className="relative">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={onLogoSelect}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className={`w-full h-32 border-2 border-dashed ${logoPreview || form.logo_url ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50/50'} rounded-3xl flex flex-col items-center justify-center hover:bg-slate-50 transition-colors group`}>
                        {logoPreview ? (
                            <div className="flex flex-col items-center">
                                <img src={logoPreview} alt="Airline Logo Preview" className="h-16 object-contain mb-2" />
                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Selected (Click Update to Save)</span>
                            </div>
                        ) : form.logo_url ? (
                            <div className="flex flex-col items-center">
                                <img src={`http://localhost:8000${form.logo_url}`} alt="Airline Logo" className="h-16 object-contain mb-2" />
                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Current Logo (Click to Change)</span>
                            </div>
                        ) : (
                            <>
                                <Plus size={24} className="text-slate-300 group-hover:text-blue-600 mb-2 transition-colors" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Click to Select Logo</span>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* Existing Airlines Display */}
        {airlines.length > 0 && (
            <div className="space-y-6">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[3px]">Existing Airlines</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {airlines.map((airline) => (
                        <div key={airline.id || airline._id} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all">
                            <div className="flex items-center gap-4">
                                {airline.logo_url ? (
                                    <img src={`http://localhost:8000${airline.logo_url}`} alt={airline.name} className="w-10 h-10 object-contain" />
                                ) : (
                                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-slate-300 font-bold text-xs border border-slate-100">
                                        LOGO
                                    </div>
                                )}
                                <div>
                                    <div className="font-black text-sm text-slate-700">{airline.airline_name || airline.name}</div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                        IATA: {airline.iata_code}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => onEdit(airline)} className="p-2 bg-white text-slate-400 rounded-lg shadow-sm hover:text-blue-600"><Edit3 size={14} /></button>
                                <button onClick={() => onDelete(airline.id || airline._id)} className="p-2 bg-white text-slate-400 rounded-lg shadow-sm hover:text-red-500"><Trash2 size={14} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
);

const CityIATASection = ({ cities = [], cityName = '', setCityName, cityCode = '', setCityCode }) => (
    <div className="space-y-10">
        <SectionHeading title="City & Airport Registry" subtitle="Define standard destination nodes." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <InputGroup
                label="City Name"
                placeholder="Karachi"
                value={cityName}
                onChange={(e) => setCityName?.(e.target.value)}
            />
            <InputGroup
                label="IATA Code"
                placeholder="KHI"
                value={cityCode}
                onChange={(e) => setCityCode?.(e.target.value)}
            />
        </div>

        {/* Existing Cities Display */}
        {cities.length > 0 && (
            <div className="space-y-6">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[3px]">Existing Cities</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cities.map((city) => (
                        <div key={city.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all">
                            <div className="flex-1">
                                <div className="font-black text-sm text-slate-700">{city.city_name}</div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                    IATA: {city.iata_code}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 bg-white text-slate-400 rounded-lg shadow-sm hover:text-blue-600"><Edit3 size={14} /></button>
                                <button className="p-2 bg-white text-slate-400 rounded-lg shadow-sm hover:text-red-500"><Trash2 size={14} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
);

const ExpiryTimeSection = ({ expiry, setExpiry }) => (
    <div className="space-y-12">
        <SectionHeading title="System Rules: Expiry" subtitle="Configure automatic cancellation timers for bookings." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <ExpiryRow
                label="Group Booking Expiry"
                h={expiry.group_booking_hours}
                m={expiry.group_booking_minutes}
                onChangeH={(val) => setExpiry({ ...expiry, group_booking_hours: val })}
                onChangeM={(val) => setExpiry({ ...expiry, group_booking_minutes: val })}
            />
            <ExpiryRow
                label="Umrah Booking Expiry"
                h={expiry.umrah_booking_hours}
                m={expiry.umrah_booking_minutes}
                onChangeH={(val) => setExpiry({ ...expiry, umrah_booking_hours: val })}
                onChangeM={(val) => setExpiry({ ...expiry, umrah_booking_minutes: val })}
            />
            <ExpiryRow
                label="Customer Booking Expiry"
                h={expiry.customer_booking_hours}
                m={expiry.customer_booking_minutes}
                onChangeH={(val) => setExpiry({ ...expiry, customer_booking_hours: val })}
                onChangeM={(val) => setExpiry({ ...expiry, customer_booking_minutes: val })}
            />
            <ExpiryRow
                label="Custom Umrah Expiry"
                h={expiry.custom_umrah_hours}
                m={expiry.custom_umrah_minutes}
                onChangeH={(val) => setExpiry({ ...expiry, custom_umrah_hours: val })}
                onChangeM={(val) => setExpiry({ ...expiry, custom_umrah_minutes: val })}
            />
        </div>
        <div className="flex items-center gap-4 text-orange-500 bg-orange-50 p-6 rounded-3xl border border-orange-100">
            <AlertCircle size={24} />
            <div>
                <p className="text-xs font-black uppercase tracking-widest leading-none">Security Protocol Active</p>
                <p className="text-[11px] font-bold mt-1 opacity-70">Bookings not confirmed within the selected threshold will be released back to inventory automatically.</p>
            </div>
        </div>
    </div>
);

// --- ATOMIC UI HELPERS ---

const SectionHeading = ({ title, subtitle }) => (
    <div>
        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{title}</h3>
        <p className="text-sm font-medium text-slate-500 mt-1">{subtitle}</p>
    </div>
);

const InputGroup = ({ label, placeholder, icon, type = "text", value, onChange }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block pl-1 tracking-widest leading-none">{label}</label>
        <div className="relative group">
            {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors">{icon}</div>}
            {type === "textarea" ? (
                <textarea rows={4} value={value} onChange={onChange} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:ring-4 ring-blue-50 focus:bg-white transition-all resize-none" placeholder={placeholder} />
            ) : (
                <input type={type} value={value} onChange={onChange} placeholder={placeholder} className={`w-full ${icon ? 'pl-11' : 'px-5'} py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:ring-4 ring-blue-50 focus:bg-white transition-all`} />
            )}
        </div>
    </div>
);

const SelectGroup = ({ label, options, value, onChange, placeholder = "Select an option..." }) => (
    <div className="space-y-2 text-left">
        <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block pl-1 tracking-widest">{label}</label>
        <div className="relative">
            <select
                value={value}
                onChange={onChange}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:ring-4 ring-blue-50 focus:bg-white transition-all appearance-none cursor-pointer pr-10"
            >
                <option value="">{placeholder}</option>
                {options.map((opt, i) => {
                    // Check if option is a group object { label: 'Group Name', options: [], labels: {} }
                    if (typeof opt === 'object' && opt.label && Array.isArray(opt.options)) {
                        return (
                            <optgroup key={i} label={opt.label} className="font-bold text-slate-800 bg-slate-100">
                                {opt.options.map((subOptValue, j) => {
                                    // Parse composite value "ID|ISBIG|LABEL" to display only LABEL
                                    let displayLabel = subOptValue;
                                    if (typeof subOptValue === 'string' && subOptValue.includes('|')) {
                                        const parts = subOptValue.split('|');
                                        // If we have enough parts, use the label part (index 2)
                                        if (parts.length >= 3) {
                                            displayLabel = parts[2];
                                        }
                                    }
                                    // Fallback to labels map if provided
                                    if (opt.labels && opt.labels[subOptValue]) {
                                        displayLabel = opt.labels[subOptValue];
                                    }

                                    return (
                                        <option key={`${i}-${j}`} value={subOptValue} className="pl-4 font-normal text-slate-600 bg-white">
                                            {displayLabel}
                                        </option>
                                    );
                                })}
                            </optgroup>
                        );
                    }
                    // Standard string option
                    let displayLabel = opt;
                    if (typeof opt === 'string' && opt.includes('|')) {
                        const parts = opt.split('|');
                        if (parts.length >= 3) displayLabel = parts[2];
                    }
                    return <option key={i} value={opt}>{displayLabel}</option>;
                })}
            </select>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronDown size={14} />
            </div>
        </div>
    </div>
);

const CheckboxGroup = ({ label, checked, onChange }) => (
    <label className="flex items-center gap-3 cursor-pointer group p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-blue-200 transition-all">
        <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange?.(e.target.checked)}
            className="hidden"
        />
        <div
            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${checked ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-200 group-hover:border-blue-300'}`}
        >
            {checked && <CheckCircle2 size={12} className="text-white" />}
        </div>
        <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider group-hover:text-slate-800 transition-colors">{label}</span>
    </label>
);

const DoublePriceInput = ({ label, color = "slate", selling, purchasing, onSellingChange, onPurchasingChange }) => (
    <div className="space-y-5">
        <span className="text-[11px] font-black text-slate-800 uppercase tracking-[2px] border-b-2 border-blue-600 pb-1">{label} Matrix</span>
        <div className="grid grid-cols-1 gap-4">
            <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400">PKR</div>
                <input
                    type="number"
                    placeholder="Selling Price"
                    value={selling || ''}
                    onChange={(e) => onSellingChange?.(parseFloat(e.target.value) || 0)}
                    className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-100 rounded-xl text-[11px] font-black outline-none focus:border-blue-600 focus:ring-4 ring-blue-50 transition-all"
                />
            </div>
            <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400">PKR</div>
                <input
                    type="text"
                    placeholder="Purchase Cost"
                    value={purchasing || ''}
                    onChange={(e) => onPurchasingChange?.(parseFloat(e.target.value) || 0)}
                    className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-100 rounded-xl text-[11px] font-black outline-none focus:border-slate-400 focus:ring-4 ring-slate-100 transition-all"
                />
            </div>
        </div>
    </div>
);

const ExpiryRow = ({ label, h, m, onChangeH, onChangeM }) => (
    <div className="space-y-3">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{label}</label>
        <div className="grid grid-cols-2 gap-4">
            <div className="relative">
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">HRS</div>
                <input
                    type="number"
                    value={h}
                    onChange={(e) => onChangeH?.(Number(e.target.value))}
                    min="0"
                    max="24"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black outline-none focus:bg-white focus:ring-4 ring-blue-50 transition-all"
                />
            </div>
            <div className="relative">
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">MIN</div>
                <input
                    type="number"
                    value={m}
                    onChange={(e) => onChangeM?.(Number(e.target.value))}
                    min="0"
                    max="59"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black outline-none focus:bg-white focus:ring-4 ring-blue-50 transition-all"
                />
            </div>
        </div>
    </div>
);

export default OthersView;
