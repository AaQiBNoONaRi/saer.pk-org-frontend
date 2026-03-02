import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Percent } from 'lucide-react';
import { getModulePermissions } from '../../utils/permissions';

const DiscountsView = ({ onAddDiscount, onEditDiscount, permissions = null }) => {
    const [discounts, setDiscounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // If permissions prop is not provided or empty, fallback to module permissions
    const fallbackPerms = getModulePermissions('pricing.discounts');
    const effectivePerms = permissions && Object.values(permissions).some(Boolean) ? permissions : fallbackPerms;
    const canAdd = effectivePerms.add;
    const canUpdate = effectivePerms.update;
    const canDelete = effectivePerms.delete;

    useEffect(() => {
        fetchDiscounts();
    }, []);

    const fetchDiscounts = async () => {
        try {
            const token = localStorage.getItem('access_token');
            console.log('Fetching discounts with token:', token ? 'Present' : 'Missing');
            
            const response = await fetch('http://localhost:8000/api/discounts/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);
            
            if (response.ok) {
                const data = await response.json();
                console.log('Fetched discounts:', data);
                console.log('Number of discounts:', data.length);
                setDiscounts(Array.isArray(data) ? data : []);
            } else {
                const errorText = await response.text();
                console.error('Failed to fetch discounts:', response.status, errorText);
                setDiscounts([]);
            }
        } catch (error) {
            console.error('Error fetching discounts:', error);
            setDiscounts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this discount?')) return;
        
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`http://localhost:8000/api/discounts/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                await fetchDiscounts();
                alert('Discount deleted!');
            }
        } catch (error) {
            console.error('Error deleting discount:', error);
            alert('Error deleting discount');
        }
    };

    const filteredDiscounts = discounts.filter(d =>
        d.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="text-center text-slate-500">Loading discounts...</div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Discounts</h2>
                    <p className="text-slate-500 font-medium">Manage discount groups for tickets, packages and hotels</p>
                </div>
                {canAdd && (
                    <button
                        onClick={onAddDiscount}
                        className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold transition-all hover:scale-105 shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                    >
                        <Plus size={16} /> Add Discount
                    </button>
                )}
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search discounts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                </div>
            </div>

            {/* Discounts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDiscounts.length === 0 ? (
                    <div className="col-span-full text-center p-12 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                        <Percent className="mx-auto text-slate-300 mb-4" size={48} />
                        <p className="text-slate-400 font-medium">No discounts found</p>
                    </div>
                ) : (
                    filteredDiscounts.map(discount => (
                        <div
                            key={discount._id}
                            className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-all"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-1">
                                        {discount.name}
                                    </h3>
                                </div>
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                    discount.is_active
                                        ? 'bg-emerald-50 text-emerald-600'
                                        : 'bg-red-50 text-red-600'
                                }`}>
                                    {discount.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-bold text-slate-600">Ticket Discount:</span>
                                    <span className="font-black text-blue-600">
                                        {discount.ticket_discount_type === 'percentage'
                                            ? `${discount.ticket_discount}%`
                                            : `PKR ${Number(discount.ticket_discount || 0).toLocaleString()}`
                                        }
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-bold text-slate-600">Package Discount:</span>
                                    <span className="font-black text-blue-600">
                                        PKR {Number(discount.package_discount || 0).toLocaleString()}
                                    </span>
                                </div>
                                {discount.hotel_discounts && discount.hotel_discounts.length > 0 && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-bold text-slate-600">Hotel Periods:</span>
                                        <span className="capitalize text-slate-900 font-bold">{discount.hotel_discounts.length}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2">
                                {canUpdate && (
                                    <button
                                        onClick={() => onEditDiscount(discount)}
                                        className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all flex items-center justify-center gap-1"
                                    >
                                        <Edit2 size={14} /> Edit
                                    </button>
                                )}
                                {canDelete && (
                                    <button
                                        onClick={() => handleDelete(discount._id)}
                                        className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-1"
                                    >
                                        <Trash2 size={14} /> Delete
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DiscountsView;
