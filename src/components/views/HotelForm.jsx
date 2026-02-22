import React, { useState, useEffect } from 'react';
import {
    Save, X, Plus, Trash2, Calendar, MapPin,
    Link as LinkIcon, Phone, User, Image as ImageIcon,
    ArrowRight, ArrowLeft, CheckCircle2, Circle
} from 'lucide-react';

const HotelForm = ({ hotel = null, onSave, onCancel }) => {
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);

    // Track whether user attempted to go to next from a step (used to show validation errors on submit)
    const [attemptedSteps, setAttemptedSteps] = useState({ 1: false, 2: false });

    // Master Data
    const [bedTypes, setBedTypes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [cities, setCities] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        city: '',
        name: '',
        address: '',
        category_id: '',
        distance_meters: '',
        walking_time_minutes: '',
        walking_distance_meters: '',
        contact_number: '',
        google_location_link: '',
        available_from: '',
        available_until: '',
        contact_details: [],
        prices: [],
        photos: [],
        allow_reselling: false,
        is_active: true
    });

    // Helper states
    const [contactInput, setContactInput] = useState({ contact_person: '', contact_number: '' });

    // Price Period Management
    const [currentPricePeriod, setCurrentPricePeriod] = useState({
        date_from: '',
        date_to: '',
        bed_prices: [] // Array of { bed_type_id, purchase_price, selling_price }
    });
    const [showPricePeriodForm, setShowPricePeriodForm] = useState(false);
    const [selectedBedTypeToAdd, setSelectedBedTypeToAdd] = useState('');

    // File uploads
    const [photoFiles, setPhotoFiles] = useState([]);

    // Fetch Master Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('access_token');
                const headers = { 'Authorization': `Bearer ${token}` };

                const [btRes, catRes, cityRes] = await Promise.all([
                    fetch('http://localhost:8000/api/bed-types/', { headers }),
                    fetch('http://localhost:8000/api/hotel-categories/', { headers }),
                    fetch('http://localhost:8000/api/others/city-iata', { headers })
                ]);

                if (btRes.ok) setBedTypes((await btRes.json()).filter(bt => bt.is_active));
                if (catRes.ok) setCategories((await catRes.json()).filter(c => c.is_active));
                if (cityRes.ok) setCities(await cityRes.json()); // Assuming returns list of objects with 'city_name' or similar

            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        fetchData();
    }, []);

    // Initialize Form Data
    useEffect(() => {
        if (hotel) {
            // Normalize backend prices into periods with bed_prices arrays
            let normalizedPrices = [];
            const rawPrices = hotel.prices || [];
            if (rawPrices.length > 0) {
                const first = rawPrices[0];
                // Detect flat structure (each item has bed_type_id) vs grouped (has bed_prices)
                if (first && first.bed_type_id && !first.bed_prices) {
                    const map = {};
                    for (const p of rawPrices) {
                        const key = `${p.date_from}|${p.date_to}`;
                        if (!map[key]) {
                            map[key] = { date_from: p.date_from, date_to: p.date_to, bed_prices: [] };
                        }
                        map[key].bed_prices.push({
                            bed_type_id: p.bed_type_id,
                            purchase_price: p.purchase_price,
                            selling_price: p.selling_price
                        });
                    }
                    normalizedPrices = Object.values(map);
                } else {
                    // Already grouped
                    normalizedPrices = rawPrices;
                }
            }

            setFormData({
                city: hotel.city || '',
                name: hotel.name || '',
                address: hotel.address || '',
                category_id: hotel.category_id || '',
                distance_meters: hotel.distance_meters || '',
                walking_time_minutes: hotel.walking_time_minutes || '',
                walking_distance_meters: hotel.walking_distance_meters || '',
                contact_number: hotel.contact_number || '',
                google_location_link: hotel.google_location_link || '',
                available_from: hotel.available_from ? hotel.available_from.split('T')[0] : '',
                available_until: hotel.available_until ? hotel.available_until.split('T')[0] : '',
                contact_details: hotel.contact_details || [],
                prices: normalizedPrices,
                photos: hotel.photos || [],
                allow_reselling: hotel.allow_reselling || false,
                is_active: hotel.is_active !== false
            });
        }
    }, [hotel]);

    // Auto-add "Room" bed type when price period form opens.
    // If a real 'Room' bed type exists in `bedTypes` use its id, otherwise add a sentinel 'room_default'
    useEffect(() => {
        if (!showPricePeriodForm) return;
        if (currentPricePeriod.bed_prices.length > 0) return;

        const roomBedType = bedTypes.find(bt => bt.name && bt.name.toLowerCase().includes('room'));
        if (roomBedType) {
            setCurrentPricePeriod(prev => ({
                ...prev,
                bed_prices: [{ bed_type_id: roomBedType._id, purchase_price: '', selling_price: '' }]
            }));
        } else {
            // add a UI-only sentinel entry so user always sees the Room price row
            setCurrentPricePeriod(prev => ({
                ...prev,
                bed_prices: [{ bed_type_id: 'room_default', purchase_price: '', selling_price: '' }]
            }));
        }
    }, [showPricePeriodForm, bedTypes]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // --- Price Period Logic ---
    const addPricePeriod = () => {
        if (!currentPricePeriod.date_from || !currentPricePeriod.date_to) {
            alert('Please select date range');
            return;
        }

        // Validate dates are within availability period
        if (formData.available_from && formData.available_until) {
            const periodFrom = new Date(currentPricePeriod.date_from);
            const periodTo = new Date(currentPricePeriod.date_to);
            const availFrom = new Date(formData.available_from);
            const availTo = new Date(formData.available_until);

            if (periodFrom < availFrom || periodTo > availTo) {
                alert(`Price period dates must be within availability period (${formData.available_from} to ${formData.available_until})`);
                return;
            }
        }

        if (currentPricePeriod.bed_prices.length === 0) {
            alert('Please add at least one bed type price');
            return;
        }
        setFormData(prev => ({
            ...prev,
            prices: [...prev.prices, {
                date_from: currentPricePeriod.date_from,
                date_to: currentPricePeriod.date_to,
                bed_prices: currentPricePeriod.bed_prices
            }]
        }));
        setCurrentPricePeriod({ date_from: '', date_to: '', bed_prices: [] });
        setShowPricePeriodForm(false);
    };

    const addBedTypeToPeriod = () => {
        if (!selectedBedTypeToAdd) {
            alert('Please select a bed type');
            return;
        }

        // Check if bed type already added
        if (currentPricePeriod.bed_prices.find(bp => bp.bed_type_id === selectedBedTypeToAdd)) {
            alert('This bed type is already added');
            return;
        }

        setCurrentPricePeriod(prev => ({
            ...prev,
            bed_prices: [...prev.bed_prices, {
                bed_type_id: selectedBedTypeToAdd,
                purchase_price: '',
                selling_price: ''
            }]
        }));
        setSelectedBedTypeToAdd('');
    };

    const removeBedTypeFromPeriod = (bedTypeId) => {
        // Prevent removing Room bed type (required). Also protect sentinel 'room_default'.
        const bedType = bedTypes.find(bt => bt._id === bedTypeId);
        const isRoom = bedType?.name?.toLowerCase().includes('room') || bedTypeId === 'room_default';
        if (isRoom) return; // Don't remove Room bed type

        setCurrentPricePeriod(prev => ({
            ...prev,
            bed_prices: prev.bed_prices.filter(bp => bp.bed_type_id !== bedTypeId)
        }));
    };

    const updateBedPrice = (bedTypeId, field, value) => {
        setCurrentPricePeriod(prev => ({
            ...prev,
            bed_prices: prev.bed_prices.map(bp =>
                bp.bed_type_id === bedTypeId ? { ...bp, [field]: value } : bp
            )
        }));
    };

    const removePricePeriod = (idx) => {
        setFormData(prev => ({
            ...prev,
            prices: prev.prices.filter((_, i) => i !== idx)
        }));
    };

    // --- File Upload Logic ---
    const handlePhotoUpload = (e) => {
        const files = Array.from(e.target.files);
        setPhotoFiles(prev => [...prev, ...files]);
    };

    const removePhoto = (idx) => {
        setPhotoFiles(prev => prev.filter((_, i) => i !== idx));
    };

    // --- Contact Logic ---
    const addContact = () => {
        if (contactInput.contact_person && contactInput.contact_number) {
            setFormData(prev => ({
                ...prev,
                contact_details: [...prev.contact_details, contactInput]
            }));
            setContactInput({ contact_person: '', contact_number: '' });
        }
    };

    // --- Stepper Logic ---
    const steps = [
        { id: 1, title: 'Basic Info' },
        { id: 2, title: 'Location' },
        { id: 3, title: 'Pricing' },
        { id: 4, title: 'Finish' }
    ];

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    // When user clicks Next, mark the current step as attempted and only advance if valid
    const handleNext = () => {
        setAttemptedSteps(prev => ({ ...prev, [currentStep]: true }));
        const step1Valid = formData.city && formData.name && formData.category_id;
        const step2Valid = (
            formData.distance_meters !== '' &&
            formData.walking_time_minutes !== '' &&
            formData.walking_distance_meters !== ''
        );
        const valid = currentStep === 1 ? step1Valid : currentStep === 2 ? step2Valid : true;
        if (valid) nextStep();
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const headers = { 'Authorization': `Bearer ${token}` };

            // 1. Upload Photos if any
            let uploadedPhotoUrls = [];
            if (photoFiles.length > 0) {
                const uploadFormData = new FormData();
                photoFiles.forEach(file => uploadFormData.append('files', file));

                const uploadRes = await fetch(`http://localhost:8000/api/hotels/upload-images?hotel_name=${encodeURIComponent(formData.name)}`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: uploadFormData
                });

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    uploadedPhotoUrls = uploadData.urls;
                } else {
                    const err = await uploadRes.json().catch(() => ({}));
                    throw new Error('Failed to upload photos: ' + (err.detail || uploadRes.statusText));
                }
            }

            // 2. Transfrom period-based prices...
            const sentinelPresent = formData.prices.some(period => (period.bed_prices || []).some(bp => bp.bed_type_id === 'room_default'));
            let realRoom = bedTypes.find(bt => bt.name && bt.name.toLowerCase().includes('room'));
            if (sentinelPresent && !realRoom) {
                try {
                    const res = await fetch('http://localhost:8000/api/bed-types/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ name: 'Room price bed type', is_room_price: true, is_active: true })
                    });

                    if (res.ok) {
                        const created = await res.json();
                        setBedTypes(prev => [created, ...prev]);
                        realRoom = created;
                    } else if (res.status === 400) {
                        const btRes = await fetch('http://localhost:8000/api/bed-types/', { headers });
                        if (btRes.ok) {
                            const all = await btRes.json();
                            setBedTypes(all.filter(bt => bt.is_active));
                            realRoom = all.find(bt => bt.name && bt.name.toLowerCase().includes('room'));
                        }
                    } else {
                        const err = await res.json().catch(() => ({}));
                        alert('Failed to create Room bed type: ' + (err.detail || res.statusText));
                        setLoading(false);
                        return;
                    }
                } catch (err) {
                    alert('Failed to create Room bed type: ' + err.message);
                    setLoading(false);
                    return;
                }
            }

            const flatPrices = [];
            for (const period of formData.prices) {
                if (!period.bed_prices || period.bed_prices.length === 0) continue;
                for (const bp of period.bed_prices) {
                    let bedTypeId = bp.bed_type_id;
                    if (bedTypeId === 'room_default') {
                        if (realRoom) bedTypeId = realRoom._id;
                    }

                    if (!bedTypeId) {
                        alert('A bed type id is missing in one of the price entries.');
                        setLoading(false);
                        return;
                    }
                    if (bp.selling_price === undefined || bp.selling_price === null || bp.selling_price === '') {
                        alert('Please enter a selling price for all bed types.');
                        setLoading(false);
                        return;
                    }

                    flatPrices.push({
                        date_from: period.date_from,
                        date_to: period.date_to,
                        bed_type_id: bedTypeId,
                        selling_price: parseFloat(bp.selling_price),
                        purchase_price: bp.purchase_price ? parseFloat(bp.purchase_price) : 0,
                        room_only_price: 0
                    });
                }
            }

            // 3. Final Payload
            const payload = {
                ...formData,
                distance_meters: parseFloat(formData.distance_meters || 0),
                walking_time_minutes: parseInt(formData.walking_time_minutes || 0),
                walking_distance_meters: parseFloat(formData.walking_distance_meters || 0),
                // Prepend new uploads to existing photos
                photos: [...uploadedPhotoUrls, ...formData.photos],
                prices: flatPrices,
                available_from: formData.available_from || null,
                available_until: formData.available_until || null,
                address: formData.address || null,
                contact_number: formData.contact_number || null,
                google_location_link: formData.google_location_link || null,
                category_id: formData.category_id || null,
            };

            Object.keys(payload).forEach(key => {
                if (payload[key] === null) delete payload[key];
            });

            await onSave(payload);
        } catch (error) {
            console.error(error);
            alert("Failed to save: " + error.message);
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="bg-white rounded-[32px] p-8 shadow-xl border border-slate-100 max-w-4xl mx-auto min-h-[600px] flex flex-col">

            {/* Stepper Header */}
            <div className="flex justify-between items-center mb-10 px-4">
                {steps.map((step, idx) => (
                    <div key={step.id} className="flex items-center">
                        <div className={`flex flex-col items-center gap-2 ${currentStep >= step.id ? 'text-blue-600' : 'text-slate-300'
                            }`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-all ${currentStep > step.id ? 'bg-blue-600 border-blue-600 text-white' :
                                currentStep === step.id ? 'bg-white border-blue-600 text-blue-600 shadow-lg shadow-blue-100' :
                                    'bg-white border-slate-200 text-slate-300'
                                }`}>
                                {currentStep > step.id ? <CheckCircle2 size={20} /> : step.id}
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider">{step.title}</span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className={`h-0.5 w-16 mx-4 ${currentStep > step.id ? 'bg-blue-600' : 'bg-slate-100'
                                }`} />
                        )}
                    </div>
                ))}
            </div>

            {/* Content Container */}
            <div className="flex-1 px-4">

                {/* STEP 1: Basic Info */}
                {currentStep === 1 && (
                    <div className="space-y-6 animate-in hover:fade-in slide-in-from-right-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-2">City <span className="text-red-500">*</span></label>
                                <div className={`flex items-center pl-4 pr-6 py-4 bg-slate-50 rounded-2xl focus-within:bg-white focus-within:border-blue-200 focus-within:ring-4 ring-blue-50 transition-all ${attemptedSteps[1] && !formData.city ? 'border border-red-500' : 'border border-slate-100'}`}>
                                    <MapPin className="text-slate-300 mr-3 shrink-0" size={16} />
                                    <select
                                        value={formData.city}
                                        onChange={(e) => handleChange('city', e.target.value)}
                                        className="bg-transparent w-full font-bold text-slate-700 text-sm outline-none"
                                    >
                                        <option value="">Select City</option>
                                        {cities.map(c => (
                                            <option key={c._id} value={c.city_name}>{c.city_name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-2">Hotel Name <span className="text-red-500">*</span></label>
                                <input
                                    className={`w-full pl-4 pr-6 py-4 bg-slate-50 rounded-2xl text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-blue-200 focus:ring-4 ring-blue-50 transition-all outline-none ${attemptedSteps[1] && !formData.name ? 'border border-red-500' : 'border border-slate-100'}`}
                                    placeholder="Enter hotel name"
                                    value={formData.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                />
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-2">Category</label>
                                <div className={`flex items-center pl-4 pr-6 py-4 bg-slate-50 rounded-2xl focus-within:bg-white focus-within:border-blue-200 focus-within:ring-4 ring-blue-50 transition-all ${attemptedSteps[1] && !formData.category_id ? 'border border-red-500' : 'border border-slate-100'}`}>
                                    <select
                                        value={formData.category_id}
                                        onChange={(e) => handleChange('category_id', e.target.value)}
                                        className="bg-transparent w-full font-bold text-slate-700 text-sm outline-none"
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(c => (
                                            <option key={c._id} value={c._id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2: Location */}
                {currentStep === 2 && (
                    <div className="space-y-6 animate-in hover:fade-in slide-in-from-right-4 duration-300">
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-2">Address <span className="text-red-500">*</span></label>
                            <input
                                className="w-full pl-4 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-blue-200 focus:ring-4 ring-blue-50 transition-all outline-none"
                                placeholder="Enter full address"
                                value={formData.address}
                                onChange={(e) => handleChange('address', e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-2">Distance (m) <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    className={`${attemptedSteps[2] && !formData.distance_meters ? 'border border-red-500' : 'border border-slate-100'} w-full pl-4 pr-6 py-4 bg-slate-50 rounded-2xl text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-blue-200 focus:ring-4 ring-blue-50 transition-all outline-none`}
                                    placeholder="e.g., 500"
                                    value={formData.distance_meters}
                                    onChange={(e) => handleChange('distance_meters', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-2">Walking Time (min) <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    className={`${attemptedSteps[2] && !formData.walking_time_minutes ? 'border border-red-500' : 'border border-slate-100'} w-full pl-4 pr-6 py-4 bg-slate-50 rounded-2xl text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-blue-200 focus:ring-4 ring-blue-50 transition-all outline-none`}
                                    placeholder="e.g., 10"
                                    value={formData.walking_time_minutes}
                                    onChange={(e) => handleChange('walking_time_minutes', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-2">Walking Distance (m) <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    className={`${attemptedSteps[2] && !formData.walking_distance_meters ? 'border border-red-500' : 'border border-slate-100'} w-full pl-4 pr-6 py-4 bg-slate-50 rounded-2xl text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-blue-200 focus:ring-4 ring-blue-50 transition-all outline-none`}
                                    placeholder="e.g., 400"
                                    value={formData.walking_distance_meters}
                                    onChange={(e) => handleChange('walking_distance_meters', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-2">Contact Number</label>
                                <div className="flex items-center pl-4 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus-within:bg-white focus-within:border-blue-200 focus-within:ring-4 ring-blue-50 transition-all">
                                    <Phone className="text-slate-300 mr-3 shrink-0" size={16} />
                                    <input
                                        className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm"
                                        placeholder="+92 XXX XXXXXXX"
                                        value={formData.contact_number}
                                        onChange={(e) => handleChange('contact_number', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-2">Google Location Link</label>
                                <div className="flex items-center pl-4 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus-within:bg-white focus-within:border-blue-200 focus-within:ring-4 ring-blue-50 transition-all">
                                    <LinkIcon className="text-slate-300 mr-3 shrink-0" size={16} />
                                    <input
                                        type="url" className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm"
                                        placeholder="https://maps.google.com/..."
                                        value={formData.google_location_link}
                                        onChange={(e) => handleChange('google_location_link', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 3: Pricing */}
                {currentStep === 3 && (
                    <div className="space-y-6 animate-in hover:fade-in slide-in-from-right-4 duration-300">
                        {/* Hotel Availability */}
                        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 mb-6">
                            <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                                <Calendar size={18} /> Hotel Availability Period
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 pl-2">Available From</label>
                                    <input type="date" className="w-full pl-4 pr-6 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-blue-200 focus:ring-4 ring-blue-50 transition-all outline-none"
                                        value={formData.available_from} onChange={e => handleChange('available_from', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 pl-2">Available Until</label>
                                    <input type="date" className="w-full pl-4 pr-6 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-blue-200 focus:ring-4 ring-blue-50 transition-all outline-none"
                                        value={formData.available_until} onChange={e => handleChange('available_until', e.target.value)} />
                                </div>
                            </div>
                        </div>

                        {/* Add Price Period Button */}
                        {!showPricePeriodForm && (
                            <button
                                onClick={() => setShowPricePeriodForm(true)}
                                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                            >
                                <Plus size={20} /> Add Hotel Price Period
                            </button>
                        )}

                        {/* Price Period Form */}
                        {showPricePeriodForm && (
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-inner space-y-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-bold text-slate-900 text-sm uppercase">New Price Period</h4>
                                    <button
                                        onClick={() => {
                                            setShowPricePeriodForm(false);
                                            setCurrentPricePeriod({ date_from: '', date_to: '', bed_prices: [] });
                                        }}
                                        className="text-slate-400 hover:text-red-500"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Date Range */}
                                <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-xl">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-2">Period Date From</label>
                                        <input
                                            type="date"
                                            className="w-full pl-4 pr-6 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:border-blue-200 focus:ring-4 ring-blue-50 transition-all outline-none"
                                            value={currentPricePeriod.date_from}
                                            onChange={e => setCurrentPricePeriod(p => ({ ...p, date_from: e.target.value }))}
                                            min={formData.available_from}
                                            max={formData.available_until}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-2">Period Date To</label>
                                        <input
                                            type="date"
                                            className="w-full pl-4 pr-6 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:border-blue-200 focus:ring-4 ring-blue-50 transition-all outline-none"
                                            value={currentPricePeriod.date_to}
                                            onChange={e => setCurrentPricePeriod(p => ({ ...p, date_to: e.target.value }))}
                                            min={formData.available_from}
                                            max={formData.available_until}
                                        />
                                    </div>
                                </div>

                                {/* Bed Types Pricing */}
                                <div className="bg-white p-4 rounded-xl space-y-3">
                                    <div className="flex items-center justify-between mb-3">
                                        <h5 className="font-bold text-slate-700 text-xs uppercase">Bed Type Prices</h5>
                                        <div className="flex gap-2 items-center">
                                            <select
                                                value={selectedBedTypeToAdd}
                                                onChange={e => setSelectedBedTypeToAdd(e.target.value)}
                                                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-blue-400"
                                            >
                                                <option value="">Select Bed Type</option>
                                                {bedTypes.filter(bt => !currentPricePeriod.bed_prices.find(bp => bp.bed_type_id === bt._id)).map(bt => (
                                                    <option key={bt._id} value={bt._id}>{bt.name}</option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={addBedTypeToPeriod}
                                                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-all flex items-center gap-1"
                                            >
                                                <Plus size={14} /> Add Bed Type
                                            </button>
                                        </div>
                                    </div>

                                    {currentPricePeriod.bed_prices.length > 0 ? (
                                        <>
                                            <div className="grid grid-cols-4 gap-2 text-[10px] font-black text-slate-400 uppercase mb-2 px-2">
                                                <div>Bed Type</div>
                                                <div>Selling Price (SAR)</div>
                                                <div>Purchase Price (SAR)</div>
                                                <div></div>
                                            </div>
                                            {currentPricePeriod.bed_prices.map((bp, idx) => {
                                                const bedType = bedTypes.find(bt => bt._id === bp.bed_type_id);
                                                const isRoomType = (bedType && bedType.name && bedType.name.toLowerCase().includes('room')) || bp.bed_type_id === 'room_default';
                                                return (
                                                    <div key={idx} className={`grid grid-cols-4 gap-2 items-center ${isRoomType ? 'bg-blue-50 px-2 py-2 rounded-lg' : ''}`}>
                                                        <div className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                            {isRoomType ? (
                                                                <div className="w-full">
                                                                    <select disabled aria-disabled="true" className="w-full px-3 py-2 bg-slate-100 rounded-lg text-slate-700 font-bold text-sm border border-slate-200 cursor-not-allowed">
                                                                        <option>Room price</option>
                                                                    </select>
                                                                    {isRoomType && <div className="text-[9px] mt-1 text-slate-500">Required</div>}
                                                                </div>
                                                            ) : (
                                                                <div>{bedType?.name || 'Unknown'}</div>
                                                            )}
                                                        </div>
                                                        <input
                                                            type="number"
                                                            placeholder="0.00"
                                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold text-green-700 focus:bg-white focus:border-blue-200 focus:ring-2 ring-blue-50 transition-all outline-none"
                                                            value={bp.selling_price || ''}
                                                            onChange={e => updateBedPrice(bp.bed_type_id, 'selling_price', e.target.value)}
                                                        />
                                                        <input
                                                            type="number"
                                                            placeholder="0.00"
                                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold text-blue-700 focus:bg-white focus:border-blue-200 focus:ring-2 ring-blue-50 transition-all outline-none"
                                                            value={bp.purchase_price || ''}
                                                            onChange={e => updateBedPrice(bp.bed_type_id, 'purchase_price', e.target.value)}
                                                        />
                                                        {!isRoomType ? (
                                                            <button
                                                                onClick={() => removeBedTypeFromPeriod(bp.bed_type_id)}
                                                                className="text-slate-300 hover:text-red-500 transition-colors"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        ) : (
                                                            <div className="text-slate-300">
                                                                <Trash2 size={16} className="opacity-20" />
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </>
                                    ) : (
                                        <div className="text-center py-6 text-slate-400 text-sm">
                                            No bed types added yet. Click "Add Bed Type" to start.
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={addPricePeriod}
                                    className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-all shadow-lg hover:shadow-xl"
                                >
                                    Save Price Period
                                </button>
                            </div>
                        )}

                        {/* Existing Price Periods */}
                        <div className="space-y-4">
                            {formData.prices.map((period, idx) => (
                                <div key={idx} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:border-blue-200 transition-all">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Hotel Price {idx + 1}</span>
                                            <div className="text-sm font-bold text-slate-700 mt-1">
                                                {period.date_from} → {period.date_to}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removePricePeriod(idx)}
                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-[10px] font-black text-slate-400 uppercase mb-2">
                                        <div>Bed Type</div>
                                        <div>Selling</div>
                                        <div>Purchase</div>
                                    </div>
                                    {period.bed_prices && period.bed_prices.map((bp, bpIdx) => {
                                        const bedType = bedTypes.find(b => b._id === bp.bed_type_id);
                                        const displayName = bedType?.name || (bp.bed_type_id === 'room_default' ? 'Room' : 'Unknown');
                                        return (
                                            <div key={bpIdx} className="grid grid-cols-3 gap-2 text-xs py-1 border-b border-slate-50 last:border-0">
                                                <div className="font-bold text-slate-700">{displayName}</div>
                                                <div className="text-green-600 font-bold">{bp.selling_price || 0}</div>
                                                <div className="text-blue-600 font-bold">{bp.purchase_price || 0}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 4: Finish */}
                {currentStep === 4 && (
                    <div className="space-y-6 animate-in hover:fade-in slide-in-from-right-4 duration-300">
                        {/* Contact Details */}
                        <div>
                            <h4 className="font-bold text-slate-900 mb-4">Additional Contacts</h4>
                            <div className="flex gap-4 mb-4">
                                <input className="w-full pl-4 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-blue-200 focus:ring-4 ring-blue-50 transition-all outline-none flex-1" placeholder="Name" value={contactInput.contact_person} onChange={e => setContactInput({ ...contactInput, contact_person: e.target.value })} />
                                <input className="w-full pl-4 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-blue-200 focus:ring-4 ring-blue-50 transition-all outline-none flex-1" placeholder="Number" value={contactInput.contact_number} onChange={e => setContactInput({ ...contactInput, contact_number: e.target.value })} />
                                <button onClick={addContact} className="px-4 bg-slate-100 rounded-xl hover:bg-slate-200 font-bold"><Plus /></button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {formData.contact_details.map((c, i) => (
                                    <div key={i} className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-sm flex items-center gap-2">
                                        <span className="font-bold">{c.contact_person}</span>
                                        <span className="text-slate-500">{c.contact_number}</span>
                                        <X size={14} className="cursor-pointer hover:text-red-500" onClick={() => {
                                            setFormData(prev => ({ ...prev, contact_details: prev.contact_details.filter((_, idx) => idx !== i) }))
                                        }} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Photos */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-2">Hotel Photos</label>
                            <label className="block border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer">
                                <ImageIcon className="mx-auto text-slate-300 mb-2" size={32} />
                                <p className="text-sm font-bold text-slate-500">Click to upload photos</p>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handlePhotoUpload}
                                />
                                <p className="text-xs text-slate-400 mt-2">{photoFiles.length} file(s) selected</p>
                            </label>
                            {photoFiles.length > 0 && (
                                <div className="mt-3 grid grid-cols-4 gap-2">
                                    {photoFiles.map((file, idx) => (
                                        <div key={idx} className="relative group">
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt={`Preview ${idx}`}
                                                className="w-full h-20 object-cover rounded-lg border border-slate-200"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removePhoto(idx)}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Settings */}
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                                    checked={formData.allow_reselling} onChange={(e) => handleChange('allow_reselling', e.target.checked)} />
                                <span className="font-bold text-slate-700">Allow Reselling</span>
                            </label>
                            <div className="h-px bg-slate-200" />
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" className="w-5 h-5 rounded text-green-600 focus:ring-green-500"
                                    checked={formData.is_active} onChange={(e) => handleChange('is_active', e.target.checked)} />
                                <div>
                                    <span className="block font-bold text-slate-900">Active Status</span>
                                    <span className="text-xs text-slate-500">Hotel is visible for bookings</span>
                                </div>
                            </label>
                        </div>
                    </div>
                )}

            </div>

            {/* Footer Actions */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between px-4">
                {currentStep > 1 ? (
                    <button onClick={prevStep} className="px-6 py-3 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 flex items-center gap-2">
                        <ArrowLeft size={18} /> Back
                    </button>
                ) : (
                    <button onClick={onCancel} className="px-6 py-3 rounded-2xl font-bold text-slate-400 hover:text-red-500 transition-colors">
                        Cancel
                    </button>
                )}

                {currentStep < steps.length ? (
                    <button onClick={handleNext} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all flex items-center gap-2 shadow-lg shadow-slate-200">
                        Next Step <ArrowRight size={18} />
                    </button>
                ) : (
                    <button onClick={handleSubmit} disabled={loading} className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200">
                        {loading ? 'Saving...' : <><Save size={20} /> Save Hotel</>}
                    </button>
                )}
            </div>
        </div>
    );
};

export default HotelForm;
