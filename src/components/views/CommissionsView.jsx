import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, TrendingUp, Users, DollarSign } from 'lucide-react';

const CommissionsView = ({ onAddCommission, onEditCommission }) => {
    const [commissions, setCommissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAppliedTo, setFilterAppliedTo] = useState('all');

    useEffect(() => { fetchCommissions(); }, []);

    const fetchCommissions = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('http://localhost:8000/api/commissions/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setCommissions(Array.isArray(data) ? data : []);
            } else {
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
            }
        } catch (error) {
            console.error('Error deleting commission:', error);
        }
    };

    const filteredCommissions = commissions.filter(c => {
        const name = (c.name || '').toLowerCase();
        const matchesSearch = !searchTerm || name.includes(searchTerm.toLowerCase());
        const matchesFilter = filterAppliedTo === 'all' || c.applied_to === filterAppliedTo;
        return matchesSearch && matchesFilter;
    });

    const appliedToColor = (val) => {
        if (val === 'agency') return 'bg-blue-50 text-blue-700';
        if (val === 'branch') return 'bg-violet-50 text-violet-700';
        if (val === 'employee') return 'bg-emerald-50 text-emerald-700';
        return 'bg-slate-50 text-slate-600';
    };

    if (loading) {
        return <div className="text-center text-slate-500">Loading commission groups...</div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Commissions</h2>
                    <p className="text-slate-500 font-medium">Manage commission groups for agencies, branches &amp; employees</p>
                </div>
                <button
                    onClick={onAddCommission}
                    className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold transition-all hover:scale-105 shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                >
                    <Plus size={16} /> Add Commission
                </button>
            </div>

            {/* Search + Filter */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search commission groups..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        />
                    </div>
                    <select
                        value={filterAppliedTo}
                        onChange={(e) => setFilterAppliedTo(e.target.value)}
                        className="px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none font-bold text-sm"
                    >
                        <option value="all">All Types</option>
                        <option value="agency">Agency</option>
                        <option value="branch">Branch</option>
                        <option value="employee">Employee</option>
                    </select>
                </div>
            </div>

            {/* Summary strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Total Groups', value: commissions.length, color: 'text-slate-900' },
                    { label: 'Agency', value: commissions.filter(c => c.applied_to === 'agency').length, color: 'text-blue-600' },
                    { label: 'Branch', value: commissions.filter(c => c.applied_to === 'branch').length, color: 'text-violet-600' },
                    { label: 'Employee', value: commissions.filter(c => c.applied_to === 'employee').length, color: 'text-emerald-600' },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
                        <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Commission Group Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCommissions.length === 0 ? (
                    <div className="col-span-full text-center p-12 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                        <DollarSign className="mx-auto text-slate-300 mb-4" size={48} />
                        <p className="text-slate-400 font-medium">No commission groups found</p>
                    </div>
                ) : (
                    filteredCommissions.map(commission => (
                        <div
                            key={commission._id}
                            className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-all"
                        >
                            {/* Card Header */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-1">
                                        {commission.name || '—'}
                                    </h3>
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold capitalize ${appliedToColor(commission.applied_to)}`}>
                                        <Users size={11} />
                                        {commission.applied_to || 'general'}
                                    </span>
                                </div>
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold text-center ${commission.is_active !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                    {commission.is_active !== false ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            {/* Commission Details */}
                            <div className="space-y-2 mb-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-bold text-slate-500 flex items-center gap-1">
                                        <TrendingUp size={13} /> Ticket
                                    </span>
                                    <span className="font-black text-blue-600">
                                        PKR {Number(commission.ticket_commission || 0).toLocaleString()}
                                        <span className="text-xs text-slate-400 font-medium ml-1 capitalize">
                                            ({commission.ticket_commission_type || 'fixed'})
                                        </span>
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-bold text-slate-500 flex items-center gap-1">
                                        <DollarSign size={13} /> Package
                                    </span>
                                    <span className="font-black text-violet-600">
                                        PKR {Number(commission.package_commission || 0).toLocaleString()}
                                        <span className="text-xs text-slate-400 font-medium ml-1 capitalize">
                                            ({commission.package_commission_type || 'fixed'})
                                        </span>
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-bold text-slate-500">Hotel Tiers</span>
                                    <span className="font-bold text-slate-700">
                                        {(commission.hotel_commissions || []).length} tier{(commission.hotel_commissions || []).length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-3 border-t border-slate-100">
                                <button
                                    onClick={() => onEditCommission && onEditCommission(commission)}
                                    className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all flex items-center justify-center gap-1"
                                >
                                    <Edit2 size={13} /> Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(commission._id)}
                                    className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-1"
                                >
                                    <Trash2 size={13} /> Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CommissionsView;