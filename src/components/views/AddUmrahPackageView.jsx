import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Hotel, Plus, X, Users, Package } from 'lucide-react';

const AddUmrahPackageView = ({ onBack, initialData }) => {
    const [saving, setSaving] = useState(false);
    const [hotels, setHotels] = useState([]);

    // Group & Discount State - FIXED AMOUNTS ONLY
    const [groupName, setGroupName] = useState('');
    const [ticketDiscount, setTicketDiscount] = useState(0);
    const [umrahPackageDiscount, setUmrahPackageDiscount] = useState(0);

    // Hotels with Room Pricing State - Multiple Entries
    const [hotelEntries, setHotelEntries] = useState([
        {
            id: Date.now(),
            hotel_id: '',
            hotel_name: '',
            check_in: '',
            check_out: '',
            rooms: {
                double: 0,
                triple: 0,
                quad: 0,
                quint: 0
            }
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

    // Load initial data if editing
    useEffect(() => {
        if (initialData) {
            setGroupName(initialData.group_name || '');
            setTicketDiscount(initialData.ticket_discount || 0);
            setUmrahPackageDiscount(initialData.umrah_package_discount || 0);
            if (initialData.hotels && initialData.hotels.length > 0) {
                setHotelEntries(initialData.hotels);
            }
        }
    }, [initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const token = localStorage.getItem('access_token');
            const payload = {
                group_name: groupName,
                ticket_discount: ticketDiscount,
                umrah_package_discount: umrahPackageDiscount,
                hotels: hotelEntries
            };

            const url = initialData
                ? `http://localhost:8000/api/umrah-packages/${initialData._id}`
                : 'http://localhost:8000/api/umrah-packages/';

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
                onBack(); // Auto-return to list
            } else {
                const error = await response.json();
                alert(`Error: ${error.detail || 'Failed to save'}`);
            }
        } catch (error) {
            console.error('Error saving:', error);
            alert('Error saving package');
        } finally {
            setSaving(false);
        }
    };

    const addMoreHotel = () => {
        setHotelEntries([...hotelEntries, {
            id: Date.now(),
            hotel_id: '',
            hotel_name: '',
            check_in: '',
            check_out: '',
            rooms: {
                double: 0,
                triple: 0,
                quad: 0,
                quint: 0
            }
        }]);
    };

    const removeHotel = (index) => {
        setHotelEntries(hotelEntries.filter((_, i) => i !== index));
    };

    const updateHotelEntry = (index, field, value) => {
        const updated = [...hotelEntries];
        if (field === 'hotel_id') {
            const selectedHotel = hotels.find(h => h._id === value);
            updated[index] = {
                ...updated[index],
                hotel_id: value,
                hotel_name: selectedHotel?.name || ''
            };
        } else if (field.startsWith('rooms.')) {
            const roomType = field.split('.')[1];
            updated[index].rooms[roomType] = Number(value) || 0;
        } else {
            updated[index][field] = value;
        }
        setHotelEntries(updated);
    };

    return (
        <div className="max-w-6xl mx-auto p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-all"
                    >
                        <ArrowLeft size={24} className="text-slate-600" />
                    </button>
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
                            {initialData ? 'Edit Umrah Package' : 'Add Umrah Package'}
                        </h2>
                        <p className="text-slate-500 font-medium">Configure group details and hotel pricing</p>
                    </div>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-sm uppercase tracking-wider hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20 flex items-center gap-2"
                >
                    <Save size={18} />
                    {saving ? 'Saving...' : 'Save Package'}
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Group Information & Discounts */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                            <Users size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Group Information</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Name & Fixed Amount Discounts</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                                Group Name *
                            </label>
                            <input
                                type="text"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                placeholder="Enter group name"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none font-bold text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                                Ticket Discount (PKR)
                            </label>
                            <input
                                type="number"
                                value={ticketDiscount}
                                onChange={(e) => setTicketDiscount(Number(e.target.value) || 0)}
                                placeholder="0"
                                min="0"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none font-bold text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                                Umrah Package Discount (PKR)
                            </label>
                            <input
                                type="number"
                                value={umrahPackageDiscount}
                                onChange={(e) => setUmrahPackageDiscount(Number(e.target.value) || 0)}
                                placeholder="0"
                                min="0"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none font-bold text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Hotels Configuration */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                                <Hotel size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Hotels Configuration</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Select Hotels & Set Room Prices (PKR per night)</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={addMoreHotel}
                            className="px-5 py-2.5 bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-amber-700 transition-all shadow-lg shadow-amber-600/20 flex items-center gap-2"
                        >
                            <Plus size={18} /> Add More
                        </button>
                    </div>

                    <div className="space-y-6">
                        {hotelEntries.map((entry, index) => (
                            <div key={entry.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 relative">
                                {hotelEntries.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeHotel(index)}
                                        className="absolute top-4 right-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                        title="Remove this hotel"
                                    >
                                        <X size={18} />
                                    </button>
                                )}

                                {/* Hotel Selection & Dates */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                                            Select Hotel *
                                        </label>
                                        <select
                                            value={entry.hotel_id}
                                            onChange={(e) => updateHotelEntry(index, 'hotel_id', e.target.value)}
                                            required
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none font-bold text-sm bg-white"
                                        >
                                            <option value="">Choose hotel...</option>
                                            {hotels.length === 0 && (
                                                <option disabled value="">Loading hotels...</option>
                                            )}
                                            {hotels.map(h => (
                                                <option key={h._id} value={h._id}>
                                                    {h.name} — {h.city}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                                            Check-In Date *
                                        </label>
                                        <input
                                            type="date"
                                            value={entry.check_in}
                                            onChange={(e) => updateHotelEntry(index, 'check_in', e.target.value)}
                                            required
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none font-bold text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                                            Check-Out Date *
                                        </label>
                                        <input
                                            type="date"
                                            value={entry.check_out}
                                            onChange={(e) => updateHotelEntry(index, 'check_out', e.target.value)}
                                            required
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none font-bold text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Room Type Prices */}
                                <div className="pt-4 border-t border-slate-300">
                                    <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">
                                        Room Type Prices (PKR per night)
                                    </p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-2">Double</label>
                                            <input
                                                type="number"
                                                value={entry.rooms.double}
                                                onChange={(e) => updateHotelEntry(index, 'rooms.double', e.target.value)}
                                                placeholder="0"
                                                min="0"
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none font-bold text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-2">Triple</label>
                                            <input
                                                type="number"
                                                value={entry.rooms.triple}
                                                onChange={(e) => updateHotelEntry(index, 'rooms.triple', e.target.value)}
                                                placeholder="0"
                                                min="0"
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none font-bold text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-2">Quad</label>
                                            <input
                                                type="number"
                                                value={entry.rooms.quad}
                                                onChange={(e) => updateHotelEntry(index, 'rooms.quad', e.target.value)}
                                                placeholder="0"
                                                min="0"
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none font-bold text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-2">Quint</label>
                                            <input
                                                type="number"
                                                value={entry.rooms.quint}
                                                onChange={(e) => updateHotelEntry(index, 'rooms.quint', e.target.value)}
                                                placeholder="0"
                                                min="0"
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none font-bold text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Summary Card */}
                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200">
                    <div className="flex items-center gap-3 mb-4">
                        <Package className="text-blue-600" size={24} />
                        <h4 className="text-lg font-black text-slate-900">Package Summary</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                            <span className="text-slate-500 font-bold">Group:</span>
                            <span className="ml-2 font-black text-slate-900">{groupName || 'Not set'}</span>
                        </div>
                        <div>
                            <span className="text-slate-500 font-bold">Ticket Discount:</span>
                            <span className="ml-2 font-black text-slate-900">PKR {ticketDiscount.toLocaleString()}</span>
                        </div>
                        <div>
                            <span className="text-slate-500 font-bold">Package Discount:</span>
                            <span className="ml-2 font-black text-slate-900">PKR {umrahPackageDiscount.toLocaleString()}</span>
                        </div>
                        <div className="md:col-span-3">
                            <span className="text-slate-500 font-bold">Hotels Configured:</span>
                            <span className="ml-2 font-black text-slate-900">{hotelEntries.length}</span>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default AddUmrahPackageView;
