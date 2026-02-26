import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, TrendingUp, CheckCircle } from 'lucide-react';
import { getModulePermissions } from '../../utils/permissions';

const CommissionsView = ({ onAddCommission, onEditCommission, permissions = null }) => {
    const [commissions, setCommissions] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // If permissions prop is not provided or empty, fallback to module permissions
    const fallbackPerms = getModulePermissions('pricing.commissions');
    const effectivePerms = permissions && Object.values(permissions).some(Boolean) ? permissions : fallbackPerms;
    const canAdd = effectivePerms.add;
    const canUpdate = effectivePerms.update;
    const canDelete = effectivePerms.delete;
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchCommissions();
    }, []);

    const fetchCommissions = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('http://localhost:8000/api/commissions/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                console.log('Fetched commissions:', data);
                setCommissions(Array.isArray(data) ? data : []);
            } else {
                console.error('Failed to fetch commissions:', response.status);
                setCommissions([]);
            }
        } catch (error) {
            console.error('Error fetching commissions:', error);
            setCommissions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this commission group?')) return;
        
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`http://localhost:8000/api/commissions/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                await fetchCommissions();
                alert('Commission group deleted!');
            }
        } catch (error) {
            console.error('Error deleting commission:', error);
            alert('Error deleting commission');
        }
    };

    const filteredCommissions = commissions.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="text-center text-slate-500">Loading commissions...</div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Commissions</h2>
                    <p className="text-slate-500 font-medium">Manage commission groups for tickets, packages, and hotels</p>
                </div>
                {canAdd && (
                    <button
                        onClick={onAddCommission}
                        className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold transition-all hover:scale-105 shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                    >
                        <Plus size={16} /> Add Commission Group
                    </button>
                )}
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search commission groups..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCommissions.length === 0 ? (
                    <div className="col-span-full text-center p-12 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                        <TrendingUp className="mx-auto text-slate-300 mb-4" size={48} />
                        <p className="text-slate-400 font-medium">No commission groups found</p>
                    </div>
                ) : (
                    filteredCommissions.map(commission => (
                        <div
                            key={commission._id}
                            className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-all"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                                    {commission.name}
                                </h3>
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                    commission.is_active
                                        ? 'bg-emerald-50 text-emerald-600'
                                        : 'bg-red-50 text-red-600'
                                }`}>
                                    {commission.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            <div className="space-y-3 mb-4">
                                <div className="bg-blue-50 p-3 rounded-lg">
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="font-bold text-slate-600">Ticket Commission:</span>
                                        <span className="font-black text-blue-600">
                                            {commission.ticket_commission_type === 'percentage'
                                                ? `${commission.ticket_commission}%`
                                                : `PKR ${Number(commission.ticket_commission || 0).toLocaleString()}`
                                            }
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-bold text-slate-600">Package Commission:</span>
                                        <span className="font-black text-blue-600">
                                            PKR {Number(commission.package_commission || 0).toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-bold text-slate-600">Hotel Periods:</span>
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-black">
                                        <CheckCircle size={14} />
                                        {commission.hotel_commissions?.length || 0} configured
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {canUpdate && (
                                    <button
                                        onClick={() => onEditCommission(commission)}
                                        className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all flex items-center justify-center gap-1"
                                    >
                                        <Edit2 size={14} /> Edit
                                    </button>
                                )}
                                {canDelete && (
                                    <button
                                        onClick={() => handleDelete(commission._id)}
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

export default CommissionsView;
