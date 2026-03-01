import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Tag, Calendar, Hotel, X, Plus } from 'lucide-react';

const AddDiscountView = ({ onBack, initialData }) => {
    const [saving, setSaving] = useState(false);
    const [hotels, setHotels] = useState([]);
    
    // Global: Title (applies to all periods)
    const [title, setTitle] = useState('');
    
    // Discount Periods (Repeatable)
    const [discountPeriods, setDiscountPeriods] = useState([
        {
            id: Date.now(),
            ticketDiscount: 0,
            packageDiscount: 0,
            validFrom: '',
            validUntil: '',
            hotelGroups: [
                {
                    id: Date.now() + 1,
                    selectedHotels: [],
                    roomPrices: { double: 0, triple: 0, quad: 0, quint: 0 }
                }
            ]
        }
    ]);

    // Fetch Hotels from Backend
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
            setTitle(initialData.title || '');
            if (initialData.discount_periods && initialData.discount_periods.length > 0) {
                setDiscountPeriods(initialData.discount_periods);
            }
        }
    }, [initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const token = localStorage.getItem('access_token');
            const payload = {
                title,
                discount_periods: discountPeriods
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
                onBack();
            } else {
                const error = await response.json();
                alert(`Error: ${error.detail || 'Failed to save'}`);
            }
        } catch (error) {
            console.error('Error saving:', error);
            alert('Error saving discount');
        } finally {
            setSaving(false);
        }
    };

    const addHotelToGroup = (periodIndex, groupIndex, hotelId) => {
        const hotel = hotels.find(h => h._id === hotelId);
        if (!hotel) return;

        const updated = [...discountPeriods];
        if (updated[periodIndex].hotelGroups[groupIndex].selectedHotels.some(h => h._id === hotelId)) return;
        
        updated[periodIndex].hotelGroups[groupIndex].selectedHotels.push({
            _id: hotel._id,
            hotel_name: hotel.hotel_name,
            city: hotel.city
        });
        setDiscountPeriods(updated);
    };

    const removeHotelFromGroup = (periodIndex, groupIndex, hotelId) => {
        const updated = [...discountPeriods];
        updated[periodIndex].hotelGroups[groupIndex].selectedHotels = 
            updated[periodIndex].hotelGroups[groupIndex].selectedHotels.filter(h => h._id !== hotelId);
        setDiscountPeriods(updated);
    };

    const updateRoomPrice = (periodIndex, groupIndex, roomType, value) => {
        const updated = [...discountPeriods];
        updated[periodIndex].hotelGroups[groupIndex].roomPrices[roomType] = Number(value) || 0;
        setDiscountPeriods(updated);
    };

    const addHotelGroup = (periodIndex) => {
        const updated = [...discountPeriods];
        updated[periodIndex].hotelGroups.push({
            id: Date.now(),
            selectedHotels: [],
            roomPrices: { double: 0, triple: 0, quad: 0, quint: 0 }
        });
        setDiscountPeriods(updated);
    };

    const removeHotelGroup = (periodIndex, groupIndex) => {
        const updated = [...discountPeriods];
        updated[periodIndex].hotelGroups = updated[periodIndex].hotelGroups.filter((_, i) => i !== groupIndex);
        setDiscountPeriods(updated);
    };

    const updatePeriodField = (periodIndex, field, value) => {
        const updated = [...discountPeriods];
        updated[periodIndex][field] = value;
        setDiscountPeriods(updated);
    };

    const addDiscountPeriod = () => {
        const lastPeriod = discountPeriods[discountPeriods.length - 1];
        const newPeriod = {
            id: Date.now(),
            ticketDiscount: 0,
            packageDiscount: 0,
            validFrom: lastPeriod.validUntil || '', // Auto-fill from last period's end date
            validUntil: '',
            hotelGroups: [
                {
                    id: Date.now() + 1,
                    selectedHotels: [],
                    roomPrices: { double: 0, triple: 0, quad: 0, quint: 0 }
                }
            ]
        };
        setDiscountPeriods([...discountPeriods, newPeriod]);
    };

    const removeDiscountPeriod = (index) => {
        setDiscountPeriods(discountPeriods.filter((_, i) => i !== index));
    };

    return (
        <div className="max-w-6xl mx-auto p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                    <ArrowLeft size={24} className="text-slate-600" />
                </button>
                <div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
                        {initialData ? 'Edit Discount' : 'Add Discount'}
                    </h2>
                    <p className="text-slate-500 font-medium">Configure group details and hotel pricing</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Title Section (Global - applies to all periods) */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                            <Tag size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Group Title</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Applies to all discount periods</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                            Title *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter group title"
                            required
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none font-bold text-sm"
                        />
                    </div>
                </div>

                {/* Discount Periods */}
                {discountPeriods.map((period, periodIndex) => (
                    <div key={period.id} className="space-y-6 relative">
                        {discountPeriods.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeDiscountPeriod(periodIndex)}
                                className="absolute top-0 right-0 p-2 text-red-500 hover:text-red-600 rounded-lg transition-colors"
                                title="Remove this discount period"
                            >
                                <X size={20} />
                            </button>
                        )}

                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-3 rounded-2xl">
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight text-center">
                                Discount Period #{periodIndex + 1}
                            </h2>
                        </div>

                        {/* SECTION 1: Discount Amounts */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                                    <Tag size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Discount Amounts</h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Fixed Discount Values (PKR)</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                                        Ticket Discount (PKR)
                                    </label>
                                    <input
                                        type="number"
                                        value={period.ticketDiscount}
                                        onChange={(e) => updatePeriodField(periodIndex, 'ticketDiscount', Number(e.target.value) || 0)}
                                        placeholder="0"
                                        min="0"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none font-bold text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                                        Package Discount (PKR)
                                    </label>
                                    <input
                                        type="number"
                                        value={period.packageDiscount}
                                        onChange={(e) => updatePeriodField(periodIndex, 'packageDiscount', Number(e.target.value) || 0)}
                                        placeholder="0"
                                        min="0"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none font-bold text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* SECTION 2: Hotel Groups (Repeatable) */}
                        <div className="space-y-6">
                            {period.hotelGroups.map((group, groupIndex) => (
                                <div key={group.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6 relative">
                                    {period.hotelGroups.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeHotelGroup(periodIndex, groupIndex)}
                                            className="absolute top-4 right-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            title="Remove this hotel group"
                                        >
                                            <X size={20} />
                                        </button>
                                    )}

                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                                            <Hotel size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Hotel Group #{groupIndex + 1}</h3>
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Select Hotels & Set Room Prices</p>
                                        </div>
                                    </div>

                                    {/* Hotel Selection Dropdown */}
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                                            Add Hotels
                                        </label>
                                        <select
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    addHotelToGroup(periodIndex, groupIndex, e.target.value);
                                                    e.target.value = ''; // Reset dropdown
                                                }
                                            }}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none font-bold text-sm bg-white"
                                        >
                                            <option value="">Select a hotel to add...</option>
                                            {hotels.map(h => (
                                                <option key={h._id} value={h._id}>
                                                    {h.hotel_name} - {h.city}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Selected Hotels as Chips */}
                                    {group.selectedHotels.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {group.selectedHotels.map(hotel => (
                                                <div
                                                    key={hotel._id}
                                                    className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-sm font-bold text-amber-900"
                                                >
                                                    <span>{hotel.hotel_name} ({hotel.city})</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeHotelFromGroup(periodIndex, groupIndex, hotel._id)}
                                                        className="p-1 hover:bg-amber-200 rounded-full transition-all"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Room Prices */}
                                    <div className="pt-4 border-t border-slate-200">
                                        <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">
                                            Room Prices (PKR per night) - Applies to all selected hotels
                                        </p>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 mb-2">Double</label>
                                                <input
                                                    type="number"
                                                    value={group.roomPrices.double}
                                                    onChange={(e) => updateRoomPrice(periodIndex, groupIndex, 'double', e.target.value)}
                                                    placeholder="0"
                                                    min="0"
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none font-bold text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 mb-2">Triple</label>
                                                <input
                                                    type="number"
                                                    value={group.roomPrices.triple}
                                                    onChange={(e) => updateRoomPrice(periodIndex, groupIndex, 'triple', e.target.value)}
                                                    placeholder="0"
                                                    min="0"
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none font-bold text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 mb-2">Quad</label>
                                                <input
                                                    type="number"
                                                    value={group.roomPrices.quad}
                                                    onChange={(e) => updateRoomPrice(periodIndex, groupIndex, 'quad', e.target.value)}
                                                    placeholder="0"
                                                    min="0"
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none font-bold text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 mb-2">Quint</label>
                                                <input
                                                    type="number"
                                                    value={group.roomPrices.quint}
                                                    onChange={(e) => updateRoomPrice(periodIndex, groupIndex, 'quint', e.target.value)}
                                                    placeholder="0"
                                                    min="0"
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none font-bold text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Add More Hotel Group Button */}
                            <button
                                type="button"
                                onClick={() => addHotelGroup(periodIndex)}
                                className="w-full py-2 border border-slate-300 rounded-lg text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition-all text-sm font-semibold flex items-center justify-center gap-2"
                            >
                                <Plus size={16} /> Add Hotel Group
                            </button>
                        </div>

                        {/* SECTION 3: Validity Period */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                                    <Calendar size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Validity Period</h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Discount Price Valid Dates</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                                        Valid From {periodIndex > 0 && <span className="text-purple-600">(Auto-filled from previous period)</span>}
                                    </label>
                                    <input
                                        type="date"
                                        value={period.validFrom}
                                        onChange={(e) => updatePeriodField(periodIndex, 'validFrom', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none font-bold text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                                        Valid Until
                                    </label>
                                    <input
                                        type="date"
                                        value={period.validUntil}
                                        onChange={(e) => updatePeriodField(periodIndex, 'validUntil', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none font-bold text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Bottom Action Buttons */}
                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={addDiscountPeriod}
                        className="flex-1 py-3 border border-blue-400 rounded-lg text-blue-600 hover:bg-blue-50 transition-all text-sm font-semibold flex items-center justify-center gap-2"
                    >
                        <Plus size={18} /> Add Discount Period
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save size={18} />
                        {saving ? 'Saving...' : 'Save Discount'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddDiscountView;
