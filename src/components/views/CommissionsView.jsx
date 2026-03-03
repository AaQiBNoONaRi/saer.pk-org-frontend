import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, TrendingUp, CheckCircle, Clock, DollarSign } from 'lucide-react';

const CommissionsView = ({ onAddCommission, onEditCommission }) => {
    const [commissions, setCommissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, pending, earned, paid

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
        if (!window.confirm('Are you sure you want to delete this commission?')) return;

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`http://localhost:8000/api/commissions/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                await fetchCommissions();
                alert('Commission deleted!');
            }
        } catch (error) {
            console.error('Error deleting commission:', error);
            alert('Error deleting commission');
        }
    };

    const updateStatus = async (id, newStatus) => {
        try {
            const token = localStorage.getItem('access_token');
            const updateData = { status: newStatus };

            if (newStatus === 'earned') {
                updateData.earned_date = new Date().toISOString().split('T')[0];
            } else if (newStatus === 'paid') {
                updateData.paid_date = new Date().toISOString().split('T')[0];
            }

            const response = await fetch(`http://localhost:8000/api/commissions/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            if (response.ok) {
                await fetchCommissions();
                alert('Status updated!');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Error updating status');
        }
    };

    const filteredCommissions = commissions.filter(c => {
        const matchesSearch = c.partner_name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-50 text-yellow-600';
            case 'earned': return 'bg-blue-50 text-blue-600';
            case 'paid': return 'bg-emerald-50 text-emerald-600';
            default: return 'bg-slate-50 text-slate-600';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending': return <Clock size={16} />;
            case 'earned': return <TrendingUp size={16} />;
            case 'paid': return <CheckCircle size={16} />;
            default: return null;
        }
    };

    const totalCommissions = {
        pending: commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.value, 0),
        earned: commissions.filter(c => c.status === 'earned').reduce((sum, c) => sum + c.value, 0),
        paid: commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.value, 0)
    };

    if (loading) {
        return <div className="text-center text-slate-500">Loading commissions...</div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Commissions</h2>
                    <p className="text-slate-500 font-medium">Track partner earnings and payments</p>
                </div>
                <button
                    onClick={onAddCommission}
                    className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold transition-all hover:scale-105 shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                >
                    <Plus size={16} /> Add Commission
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-linear-to-br from-yellow-50 to-yellow-100 p-6 rounded-2xl border border-yellow-200">
                    <div className="flex items-center gap-3 mb-2">
                        <Clock className="text-yellow-600" size={24} />
                        <span className="text-xs font-bold text-yellow-600 uppercase">Pending</span>
                    </div>
                    <p className="text-2xl font-black text-yellow-900">PKR {totalCommissions.pending.toLocaleString()}</p>
                </div>
                <div className="bg-linear-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200">
                    <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="text-blue-600" size={24} />
                        <span className="text-xs font-bold text-blue-600 uppercase">Earned</span>
                    </div>
                    <p className="text-2xl font-black text-blue-900">PKR {totalCommissions.earned.toLocaleString()}</p>
                </div>
                <div className="bg-linear-to-br from-emerald-50 to-emerald-100 p-6 rounded-2xl border border-emerald-200">
                    <div className="flex items-center gap-3 mb-2">
                        <CheckCircle className="text-emerald-600" size={24} />
                        <span className="text-xs font-bold text-emerald-600 uppercase">Paid</span>
                    </div>
                    <p className="text-2xl font-black text-emerald-900">PKR {totalCommissions.paid.toLocaleString()}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by partner name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none font-bold"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="earned">Earned</option>
                        <option value="paid">Paid</option>
                    </select>
                </div>
            </div>

            {/* Commissions Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-wider">Partner</th>
                                <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-wider">Dates</th>
                                <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredCommissions.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center">
                                        <DollarSign className="mx-auto text-slate-300 mb-4" size={48} />
                                        <p className="text-slate-400 font-medium">No commissions found</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredCommissions.map(commission => (
                                    <tr key={commission._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-black text-slate-900">{commission.partner_name}</p>
                                                <p className="text-xs text-slate-500">{commission.description}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="capitalize text-slate-700 font-bold text-sm">
                                                {commission.partner_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-black text-blue-600">
                                                PKR {Number(commission.value || 0).toLocaleString()}
                                            </p>
                                            <p className="text-xs text-slate-500 capitalize">{commission.commission_type}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${getStatusColor(commission.status)}`}>
                                                {getStatusIcon(commission.status)}
                                                <span className="capitalize">{commission.status}</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs space-y-1">
                                                {commission.earned_date && (
                                                    <p className="text-slate-600">
                                                        <span className="font-bold">Earned:</span> {commission.earned_date}
                                                    </p>
                                                )}
                                                {commission.paid_date && (
                                                    <p className="text-emerald-600 font-bold">
                                                        <span className="font-bold">Paid:</span> {commission.paid_date}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                {commission.status === 'pending' && (
                                                    <button
                                                        onClick={() => updateStatus(commission._id, 'earned')}
                                                        className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all"
                                                    >
                                                        Mark Earned
                                                    </button>
                                                )}
                                                {commission.status === 'earned' && (
                                                    <button
                                                        onClick={() => updateStatus(commission._id, 'paid')}
                                                        className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-all"
                                                    >
                                                        Mark Paid
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => onEditCommission(commission)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(commission._id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CommissionsView;