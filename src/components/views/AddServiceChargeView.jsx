import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, DollarSign, Hotel, X, Plus } from 'lucide-react';

const AddServiceChargeView = ({ onBack, initialData }) => {
    const [saving, setSaving] = useState(false);
    const [hotels, setHotels] = useState([]);
    
    const [name, setName] = useState('');
    const [ticketCharge, setTicketCharge] = useState('');
    const [ticketChargeType, setTicketChargeType] = useState('fixed');
    const [packageCharge, setPackageCharge] = useState('');
    const [hotelCharges, setHotelCharges] = useState([{
        id: Date.now(),
        quint_charge: '',
        quad_charge: '',
        triple_charge: '',
        double_charge: '',
        sharing_charge: '',
        other_charge: '',
        hotels: [],
        valid_from: '',
        valid_until: ''
    }]);
    const [isActive, setIsActive] = useState(true);

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
            setTicketCharge(initialData.ticket_charge?.toString() || '');
            setTicketChargeType(initialData.ticket_charge_type || 'fixed');
            setPackageCharge(initialData.package_charge?.toString() || '');
            setIsActive(initialData.is_active ?? true);
            if (initialData.hotel_charges && initialData.hotel_charges.length > 0) {
                setHotelCharges(initialData.hotel_charges.map((hc, idx) => ({
                    id: Date.now() + idx,
                    quint_charge: hc.quint_charge?.toString() || '',
                    quad_charge: hc.quad_charge?.toString() || '',
                    triple_charge: hc.triple_charge?.toString() || '',
                    double_charge: hc.double_charge?.toString() || '',
                    sharing_charge: hc.sharing_charge?.toString() || '',
                    other_charge: hc.other_charge?.toString() || '',
                    hotels: hc.hotels || [],
                    valid_from: hc.valid_from || '',
                    valid_until: hc.valid_until || ''
                })));
            }
        }
    }, [initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const token = localStorage.getItem('access_token');
            const payload = {
                name,
                ticket_charge: parseFloat(ticketCharge) || 0,
                ticket_charge_type: ticketChargeType,
                package_charge: parseFloat(packageCharge) || 0,
                package_charge_type: 'fixed',
                hotel_charges: hotelCharges.map(hc => ({
                    quint_charge: parseFloat(hc.quint_charge) || 0,
                    quad_charge: parseFloat(hc.quad_charge) || 0,
                    triple_charge: parseFloat(hc.triple_charge) || 0,
                    double_charge: parseFloat(hc.double_charge) || 0,
                    sharing_charge: parseFloat(hc.sharing_charge) || 0,
                    other_charge: parseFloat(hc.other_charge) || 0,
                    hotels: hc.hotels,
                    valid_from: hc.valid_from || undefined,
                    valid_until: hc.valid_until || undefined
                })),
                is_active: isActive
            };

            const url = initialData
                ? `http://localhost:8000/api/service-charges/${initialData._id}`
                : 'http://localhost:8000/api/service-charges/';
            
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
                alert('Service Charge saved successfully!');
                onBack();
            } else {
                const error = await response.json();
                alert(`Error: ${JSON.stringify(error.detail || 'Failed to save')}`);
            }
        } catch (error) {
            console.error('Error saving:', error);
            alert('Error saving service charge');
        } finally {
            setSaving(false);
        }
    };

    const updateHotelCharge = (index, field, value) => {
        const updated = [...hotelCharges];
        updated[index][field] = value;
        setHotelCharges(updated);
    };

    const addHotelChargePeriod = () => {
        setHotelCharges([...hotelCharges, {
            id: Date.now(),
            quint_charge: '',
            quad_charge: '',
            triple_charge: '',
            double_charge: '',
            sharing_charge: '',
            other_charge: '',
            hotels: [],
            valid_from: '',
            valid_until: ''
        }]);
    };

    const removeHotelChargePeriod = (index) => {
        if (hotelCharges.length > 1) {
            setHotelCharges(hotelCharges.filter((_, i) => i !== index));
        }
    };

    const handleReset = () => {
        setName('');
        setTicketCharge('');
        setTicketChargeType('fixed');
        setPackageCharge('');
        setHotelCharges([{
            id: Date.now(),
            quint_charge: '',
            quad_charge: '',
            triple_charge: '',
            double_charge: '',
            sharing_charge: '',
            other_charge: '',
            hotels: [],
            valid_from: '',
            valid_until: ''
        }]);
        setIsActive(true);
    };

    return (
        <div className="max-w-7xl mx-auto p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                        <ArrowLeft size={24} className="text-slate-600" />
                    </button>
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
                            {initialData ? 'Edit Service Charge Group' : 'Add Service Charge Group'}
                        </h2>
                        <p className="text-slate-500 font-medium">Configure service charges for tickets, packages, and hotels</p>
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
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-700 mb-4">Select Service Charge Group</h3>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter service charge group name"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none font-medium text-sm"
                    />
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-slate-700 mb-4">Service Charges</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="block text-sm font-bold text-slate-700">
                                Group Ticket Service Charge
                            </label>
                            <select
                                value={ticketChargeType}
                                onChange={(e) => setTicketChargeType(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none font-medium text-sm bg-white"
                            >
                                <option value="fixed">Fixed Amount</option>
                                <option value="percentage">Percentage (%)</option>
                            </select>
                            <input
                                type="number"
                                value={ticketCharge}
                                onChange={(e) => setTicketCharge(e.target.value)}
                                placeholder={ticketChargeType === 'percentage' ? 'e.g. 10 (for 10%)' : 'e.g. 100'}
                                min="0"
                                max={ticketChargeType === 'percentage' ? '100' : undefined}
                                step="0.01"
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none font-medium text-sm"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="block text-sm font-bold text-slate-700">
                                Umrah Package Service Charge Amount
                            </label>
                            <input
                                type="number"
                                value={packageCharge}
                                onChange={(e) => setPackageCharge(e.target.value)}
                                placeholder="e.g. 200"
                                min="0"
                                step="0.01"
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none font-medium text-sm"
                            />
                        </div>
                    </div>
                </div>

                {hotelCharges.map((charge, index) => (
                    <div key={charge.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 relative">
                        {hotelCharges.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeHotelChargePeriod(index)}
                                className="absolute top-4 right-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            >
                                <X size={20} />
                            </button>
                        )}

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                                <Hotel size={20} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-700">
                                Hotel Night Service Charges {hotelCharges.length > 1 && `- Period ${index + 1}`}
                            </h3>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {['quint', 'quad', 'triple', 'double', 'sharing', 'other'].map(type => (
                                <div key={type}>
                                    <label className="block text-sm font-medium text-slate-600 mb-2 capitalize">
                                        {type} Per Night Charge
                                    </label>
                                    <input
                                        type="number"
                                        value={charge[`${type}_charge`]}
                                        onChange={(e) => updateHotelCharge(index, `${type}_charge`, e.target.value)}
                                        placeholder="0"
                                        min="0"
                                        step="0.01"
                                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none font-medium text-sm"
                                    />
                                </div>
                            ))}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">Hotels</label>
                            <select
                                multiple
                                value={charge.hotels}
                                onChange={(e) => {
                                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                                    updateHotelCharge(index, 'hotels', selected);
                                }}
                                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none font-medium text-sm"
                                size="5"
                            >
                                {hotels.map(hotel => (
                                    <option key={hotel._id} value={hotel._id}>
                                        {hotel.hotel_name} - {hotel.city}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-slate-500 mt-1">Hold Ctrl/Cmd to select multiple hotels</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-2">Valid From</label>
                                <input
                                    type="date"
                                    value={charge.valid_from}
                                    onChange={(e) => updateHotelCharge(index, 'valid_from', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none font-medium text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-2">Valid Until</label>
                                <input
                                    type="date"
                                    value={charge.valid_until}
                                    onChange={(e) => updateHotelCharge(index, 'valid_until', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none font-medium text-sm"
                                />
                            </div>
                        </div>
                    </div>
                ))}

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={addHotelChargePeriod}
                        className="px-6 py-2.5 bg-white border-2 border-blue-500 text-blue-600 rounded-xl text-sm font-bold transition-all hover:bg-blue-50 flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Add Night Charge
                    </button>
                    {hotelCharges.length > 1 && (
                        <button
                            type="button"
                            onClick={() => removeHotelChargePeriod(hotelCharges.length - 1)}
                            className="px-6 py-2.5 bg-white border-2 border-red-500 text-red-600 rounded-xl text-sm font-bold transition-all hover:bg-red-50"
                        >
                            Remove Last
                        </button>
                    )}
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-bold text-slate-700 mb-1">Status</h4>
                            <p className="text-xs text-slate-500">Enable or disable this service charge group</p>
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

export default AddServiceChargeView;
