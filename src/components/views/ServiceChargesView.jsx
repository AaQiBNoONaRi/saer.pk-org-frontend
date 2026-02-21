import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, CreditCard, Percent, DollarSign } from 'lucide-react';

const ServiceChargesView = ({ onAddServiceCharge, onEditServiceCharge }) => {
    const [serviceCharges, setServiceCharges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchServiceCharges();
    }, []);

    const fetchServiceCharges = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('http://localhost:8000/api/service-charges/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                console.log('Fetched service charges:', data);
                setServiceCharges(Array.isArray(data) ? data : []);
            } else {
                console.error('Failed to fetch service charges:', response.status);
                setServiceCharges([]);
            }
        } catch (error) {
            console.error('Error fetching service charges:', error);
            setServiceCharges([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this service charge?')) return;
        
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`http://localhost:8000/api/service-charges/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                await fetchServiceCharges();
                alert('Service charge deleted!');
            }
        } catch (error) {
            console.error('Error deleting service charge:', error);
            alert('Error deleting service charge');
        }
    };

    const filteredCharges = serviceCharges.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="text-center text-slate-500">Loading service charges...</div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Service Charges</h2>
                    <p className="text-slate-500 font-medium">Manage additional fees for services</p>
                </div>
                <button
                    onClick={onAddServiceCharge}
                    className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold transition-all hover:scale-105 shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                >
                    <Plus size={16} /> Add Service Charge
                </button>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search service charges..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                </div>
            </div>

            {/* Service Charges Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCharges.length === 0 ? (
                    <div className="col-span-full text-center p-12 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                        <CreditCard className="mx-auto text-slate-300 mb-4" size={48} />
                        <p className="text-slate-400 font-medium">No service charges found</p>
                    </div>
                ) : (
                    filteredCharges.map(charge => (
                        <div
                            key={charge._id}
                            className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-all"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-1">
                                        {charge.name}
                                    </h3>
                                    <p className="text-xs text-slate-500">{charge.description}</p>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold text-center ${
                                        charge.is_active
                                            ? 'bg-emerald-50 text-emerald-600'
                                            : 'bg-red-50 text-red-600'
                                    }`}>
                                        {charge.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                    {charge.is_automatic && (
                                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold text-center bg-blue-50 text-blue-600">
                                            Auto
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-bold text-slate-600">Value:</span>
                                    <span className="font-black text-blue-600">
                                        {charge.charge_type === 'percentage' 
                                            ? `${charge.value}%` 
                                            : `PKR ${Number(charge.value || 0).toLocaleString()}`}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-bold text-slate-600">Applies To:</span>
                                    <span className="capitalize text-slate-900 font-bold">{charge.applies_to}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-bold text-slate-600">Type:</span>
                                    <span className="capitalize text-slate-900 font-bold">{charge.charge_type}</span>
                                </div>
                                {charge.room_type && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-bold text-slate-600">Room Type:</span>
                                        <span className="capitalize text-slate-900 font-bold">{charge.room_type}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => onEditServiceCharge(charge)}
                                    className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all flex items-center justify-center gap-1"
                                >
                                    <Edit2 size={14} /> Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(charge._id)}
                                    className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-1"
                                >
                                    <Trash2 size={14} /> Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ServiceChargesView;
