import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Tag, Calendar, Hotel, X, Plus } from 'lucide-react';

const AddDiscountView = ({ onBack, initialData }) => {
    const [saving, setSaving] = useState(false);
    const [hotels, setHotels] = useState([]);
    
    // Form fields
    const [name, setName] = useState('');
    const [ticketDiscount, setTicketDiscount] = useState('');
    const [ticketDiscountType, setTicketDiscountType] = useState('fixed');
    const [packageDiscount, setPackageDiscount] = useState('');
    const [hotelDiscounts, setHotelDiscounts] = useState([
        {
            id: Date.now(),
            quint_discount: '',
            quad_discount: '',
            triple_discount: '',
            double_discount: '',
            sharing_discount: '',
            other_discount: '',
            hotels: [],
            valid_from: '',
            valid_until: ''
        }
    ]);
    const [isActive, setIsActive] = useState(true);
    const [hotelSearches, setHotelSearches] = useState(hotelDiscounts.map(() => ''));

    // Fetch Hotels
    useEffect(() => {
        const fetchHotels = async () => {
            try {
                const token = localStorage.getItem('access_token');
                const response = await fetch('http://localhost:8000/api/hotels/', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setHotels(data);
                }
            } catch (error) {
                console.error('Error fetching hotels:', error);
            }
        };
        fetchHotels();
    }, []);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name || '');
            setTicketDiscount(initialData.ticket_discount?.toString() || '');
            setTicketDiscountType(initialData.ticket_discount_type || 'fixed');
            setPackageDiscount(initialData.package_discount?.toString() || '');
            setIsActive(initialData.is_active ?? true);
            if (initialData.hotel_discounts && initialData.hotel_discounts.length > 0) {
                setHotelDiscounts(initialData.hotel_discounts.map((hd, idx) => ({
                    id: Date.now() + idx,
                    quint_discount: hd.quint_discount?.toString() || '',
                    quad_discount: hd.quad_discount?.toString() || '',
                    triple_discount: hd.triple_discount?.toString() || '',
                    double_discount: hd.double_discount?.toString() || '',
                    sharing_discount: hd.sharing_discount?.toString() || '',
                    other_discount: hd.other_discount?.toString() || '',
                    hotels: hd.hotels || [],
                    valid_from: hd.valid_from || '',
                    valid_until: hd.valid_until || ''
                })));
                setHotelSearches(initialData.hotel_discounts.map(() => ''));
            }
        }
    }, [initialData]);

    // Keep hotelSearches in sync with hotelDiscounts length
    useEffect(() => {
        setHotelSearches(prev => {
            const next = [...prev];
            while (next.length < hotelDiscounts.length) next.push('');
            while (next.length > hotelDiscounts.length) next.pop();
            return next;
        });
    }, [hotelDiscounts.length]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const token = localStorage.getItem('access_token');
            const payload = {
                name,
                ticket_discount: parseFloat(ticketDiscount) || 0,
                ticket_discount_type: ticketDiscountType,
                package_discount: parseFloat(packageDiscount) || 0,
                package_discount_type: 'fixed',
                hotel_discounts: hotelDiscounts.map(hd => ({
                    quint_discount: parseFloat(hd.quint_discount) || 0,
                    quad_discount: parseFloat(hd.quad_discount) || 0,
                    triple_discount: parseFloat(hd.triple_discount) || 0,
                    double_discount: parseFloat(hd.double_discount) || 0,
                    sharing_discount: parseFloat(hd.sharing_discount) || 0,
                    other_discount: parseFloat(hd.other_discount) || 0,
                    hotels: hd.hotels,
                    valid_from: hd.valid_from || undefined,
                    valid_until: hd.valid_until || undefined
                })),
                is_active: isActive
            };

            const url = initialData
                ? `http://localhost:8000/api/discounts/${initialData._id}`
                : 'http://localhost:8000/api/discounts/';
            
            const method = initialData ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert('Discount saved successfully!');
                onBack();
            } else {
                const error = await response.json();
                alert(`Error: ${JSON.stringify(error.detail || 'Failed to save')}`);
            }
        } catch (error) {
            console.error('Error saving:', error);
            alert('Error saving discount');
        } finally {
            setSaving(false);
        }
    };

    const updateHotelDiscount = (index, field, value) => {
        const updated = [...hotelDiscounts];
        updated[index][field] = value;
        setHotelDiscounts(updated);
    };

    const addHotelDiscountPeriod = () => {
        setHotelDiscounts([...hotelDiscounts, {
            id: Date.now(),
            quint_discount: '',
            quad_discount: '',
            triple_discount: '',
            double_discount: '',
            sharing_discount: '',
            other_discount: '',
            hotels: [],
            valid_from: '',
            valid_until: ''
        }]);
        setHotelSearches(prev => [...prev, '']);
    };

    const removeHotelDiscountPeriod = (index) => {
        if (hotelDiscounts.length > 1) {
            setHotelDiscounts(hotelDiscounts.filter((_, i) => i !== index));
            setHotelSearches(prev => prev.filter((_, i) => i !== index));
        }
    };

    const toggleHotelSelection = (periodIndex, hotelId) => {
        const current = hotelDiscounts[periodIndex].hotels || [];
        const exists = current.includes(hotelId);
        const updated = exists ? current.filter(h => h !== hotelId) : [...current, hotelId];
        updateHotelDiscount(periodIndex, 'hotels', updated);
    };

    const handleReset = () => {
        setName('');
        setTicketDiscount('');
        setTicketDiscountType('fixed');
        setPackageDiscount('');
        setHotelDiscounts([{
            id: Date.now(),
            quint_discount: '',
            quad_discount: '',
            triple_discount: '',
            double_discount: '',
            sharing_discount: '',
            other_discount: '',
            hotels: [],
            valid_from: '',
            valid_until: ''
        }]);
        setIsActive(true);
    };


    return (
        <div className="max-w-7xl mx-auto p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                        <ArrowLeft size={24} className="text-slate-600" />
                    </button>
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
                            {initialData ? 'Edit Discount Group' : 'Add Discount Group'}
                        </h2>
                        <p className="text-slate-500 font-medium">Configure discount amounts for tickets, packages, and hotels</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={handleReset}
                        className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold transition-all hover:bg-slate-200"
                    >
                        Reset
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold transition-all hover:bg-blue-700 shadow-lg shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Save size={18} />
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Discount Group Selection */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-700 mb-4">Select Discount Group</h3>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter discount group name"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none font-medium text-sm"
                    />
                </div>

                {/* Basic Discounts */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-slate-700 mb-4">Discounts</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="block text-sm font-bold text-slate-700">
                                Group Ticket Discount
                            </label>
                            <select
                                value={ticketDiscountType}
                                onChange={(e) => setTicketDiscountType(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none font-medium text-sm bg-white"
                            >
                                <option value="fixed">Fixed Amount</option>
                                <option value="percentage">Percentage (%)</option>
                            </select>
                            <input
                                type="number"
                                value={ticketDiscount}
                                onChange={(e) => setTicketDiscount(e.target.value)}
                                placeholder={ticketDiscountType === 'percentage' ? 'e.g. 10 (for 10%)' : 'e.g. 922'}
                                min="0"
                                max={ticketDiscountType === 'percentage' ? '100' : undefined}
                                step="0.01"
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none font-medium text-sm"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="block text-sm font-bold text-slate-700">
                                Umrah Package Discount Amount
                            </label>
                            <input
                                type="number"
                                value={packageDiscount}
                                onChange={(e) => setPackageDiscount(e.target.value)}
                                placeholder="e.g. 150"
                                min="0"
                                step="0.01"
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none font-medium text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Hotel Night Discounts - Repeatable Sections */}
                {hotelDiscounts.map((discount, index) => (
                    <div key={discount.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 relative">
                        {hotelDiscounts.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeHotelDiscountPeriod(index)}
                                className="absolute top-4 right-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                title="Remove this period"
                            >
                                <X size={20} />
                            </button>
                        )}

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                                <Hotel size={20} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-700">
                                Hotel Night Discounts {hotelDiscounts.length > 1 && `- Period ${index + 1}`}
                            </h3>
                        </div>

                        {/* Room Type Discounts */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-2">
                                    Quint Per Night Discount
                                </label>
                                <input
                                    type="number"
                                    value={discount.quint_discount}
                                    onChange={(e) => updateHotelDiscount(index, 'quint_discount', e.target.value)}
                                    placeholder="0"
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none font-medium text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-2">
                                    Quad Per Night Discount
                                </label>
                                <input
                                    type="number"
                                    value={discount.quad_discount}
                                    onChange={(e) => updateHotelDiscount(index, 'quad_discount', e.target.value)}
                                    placeholder="0"
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none font-medium text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-2">
                                    Triple Per Night Discount
                                </label>
                                <input
                                    type="number"
                                    value={discount.triple_discount}
                                    onChange={(e) => updateHotelDiscount(index, 'triple_discount', e.target.value)}
                                    placeholder="0"
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none font-medium text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-2">
                                    Double Per Night Discount
                                </label>
                                <input
                                    type="number"
                                    value={discount.double_discount}
                                    onChange={(e) => updateHotelDiscount(index, 'double_discount', e.target.value)}
                                    placeholder="0"
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none font-medium text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-2">
                                    Sharing Per Night Discount
                                </label>
                                <input
                                    type="number"
                                    value={discount.sharing_discount}
                                    onChange={(e) => updateHotelDiscount(index, 'sharing_discount', e.target.value)}
                                    placeholder="0"
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none font-medium text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-2">
                                    Other Per Night Discount
                                </label>
                                <input
                                    type="number"
                                    value={discount.other_discount}
                                    onChange={(e) => updateHotelDiscount(index, 'other_discount', e.target.value)}
                                    placeholder="0"
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none font-medium text-sm"
                                />
                            </div>
                        </div>

                        {/* Hotel Selection */}
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">
                                Discounted Hotels (search by name or city)
                            </label>
                            <input
                                type="text"
                                value={hotelSearches[index]}
                                onChange={(e) => setHotelSearches(prev => { const n = [...prev]; n[index] = e.target.value; return n; })}
                                placeholder="Search hotels by city or name"
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none font-medium text-sm mb-2"
                            />
                            <div className="max-h-40 overflow-auto border border-slate-100 rounded-lg p-2">
                                {(hotels || []).filter(h => {
                                    const q = (hotelSearches[index] || '').toLowerCase().trim();
                                    if (!q) return true;
                                    const name = (h.name || h.hotel_name || '').toLowerCase();
                                    const city = (h.city || '').toLowerCase();
                                    return name.includes(q) || city.includes(q);
                                }).slice(0, 50).map(h => (
                                    <label key={h._id} className="flex items-center gap-2 py-1 px-2 hover:bg-slate-50 rounded">
                                        <input type="checkbox" checked={(discount.hotels || []).includes(h._id)} onChange={() => toggleHotelSelection(index, h._id)} />
                                        <span className="text-sm">{(h.name || h.hotel_name)} — <span className="text-xs text-slate-400">{h.city}</span></span>
                                    </label>
                                ))}
                                {hotels.length === 0 && <div className="text-xs text-slate-400">No hotels available</div>}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {(discount.hotels || []).map(hid => {
                                    const h = hotels.find(x => x._id === hid) || {};
                                    return (<div key={hid} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium flex items-center gap-2">
                                        <span>{(h.name || h.hotel_name) || hid}</span>
                                        <button type="button" onClick={() => toggleHotelSelection(index, hid)} className="text-purple-600">×</button>
                                    </div>)
                                })}
                            </div>
                        </div>

                        {/* Validity Period */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-2">
                                    Valid From
                                </label>
                                <input
                                    type="date"
                                    value={discount.valid_from}
                                    onChange={(e) => updateHotelDiscount(index, 'valid_from', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none font-medium text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-2">
                                    Valid Until
                                </label>
                                <input
                                    type="date"
                                    value={discount.valid_until}
                                    onChange={(e) => updateHotelDiscount(index, 'valid_until', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none font-medium text-sm"
                                />
                            </div>
                        </div>
                    </div>
                ))}

                {/* Action Buttons for Hotel Discount Periods */}
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={addHotelDiscountPeriod}
                        className="px-6 py-2.5 bg-white border-2 border-blue-500 text-blue-600 rounded-xl text-sm font-bold transition-all hover:bg-blue-50 flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Add Night Discount
                    </button>
                    {hotelDiscounts.length > 1 && (
                        <button
                            type="button"
                            onClick={() => removeHotelDiscountPeriod(hotelDiscounts.length - 1)}
                            className="px-6 py-2.5 bg-white border-2 border-red-500 text-red-600 rounded-xl text-sm font-bold transition-all hover:bg-red-50"
                        >
                            Remove Last
                        </button>
                    )}
                </div>

                {/* Status Toggle */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-bold text-slate-700 mb-1">Status</h4>
                            <p className="text-xs text-slate-500">Enable or disable this discount group</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default AddDiscountView;
