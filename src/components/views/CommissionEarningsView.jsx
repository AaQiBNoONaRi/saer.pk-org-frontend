import React, { useState, useEffect } from 'react';
import {
    Search, Filter, CheckCircle, Clock, XCircle,
    DollarSign, CheckSquare, Download, Calendar, RefreshCcw
} from 'lucide-react';

const getAuthHeader = () => {
    const token = localStorage.getItem('access_token');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const StatusBadge = ({ status }) => {
    const styles = {
        pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        earned: 'bg-blue-50 text-blue-700 border-blue-200',
        paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        cancelled: 'bg-red-50 text-red-700 border-red-200'
    };

    const icons = {
        pending: <Clock size={14} className="mr-1.5" />,
        earned: <CheckSquare size={14} className="mr-1.5" />,
        paid: <CheckCircle size={14} className="mr-1.5" />,
        cancelled: <XCircle size={14} className="mr-1.5" />
    };

    const defaultStyle = 'bg-slate-50 text-slate-700 border-slate-200';

    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status?.toLowerCase()] || defaultStyle}`}>
            {icons[status?.toLowerCase()]}
            {status?.charAt(0).toUpperCase() + status?.slice(1)}
        </span>
    );
};

export default function CommissionEarningsView() {
    const [records, setRecords] = useState([]);
    const [totals, setTotals] = useState({ pending: 0, earned: 0, paid: 0, cancelled: 0 });
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({
        status: 'all',
        search: '',
        earner_type: 'all'
    });

    const [processingId, setProcessingId] = useState(null);

    const fetchCommissions = async () => {
        try {
            setLoading(true);

            let query = '?limit=500';
            if (filters.status !== 'all') query += `&status=${filters.status}`;
            if (filters.earner_type !== 'all') query += `&earner_type=${filters.earner_type}`;

            const res = await fetch(`${API_URL}/api/commission-records${query}`, {
                headers: getAuthHeader()
            });
            if (res.ok) {
                const data = await res.json();

                let filteredData = data;
                if (filters.search) {
                    const s = filters.search.toLowerCase();
                    filteredData = data.filter(r =>
                        r.booking_reference?.toLowerCase().includes(s) ||
                        r.earner_name?.toLowerCase().includes(s)
                    );
                }

                setRecords(filteredData);

                // Compute totals from filtered data
                const newTotals = { pending: 0, earned: 0, paid: 0, cancelled: 0 };
                filteredData.forEach(r => {
                    const s = r.status?.toLowerCase() || 'pending';
                    if (newTotals[s] !== undefined) {
                        newTotals[s] += parseFloat(r.commission_amount || 0);
                    }
                });
                setTotals(newTotals);
            }
        } catch (error) {
            console.error('Error fetching commission records:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCommissions();
    }, [filters.status, filters.earner_type]);

    // Client-side search filtering
    useEffect(() => {
        if (filters.search) {
            fetchCommissions(); // In a real app with pagination, debounce this. Here we just re-fetch for simplicity or filter locally.
        }
    }, [filters.search]);

    const handlePay = async (recordId) => {
        if (!window.confirm("Are you sure you want to mark this commission as Paid? This will update the company balances immediately.")) return;

        try {
            setProcessingId(recordId);
            const res = await fetch(`${API_URL}/api/commission-records/${recordId}/payout`, {
                method: 'POST',
                headers: {
                    ...getAuthHeader(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });

            if (res.ok) {
                fetchCommissions();
            } else {
                const err = await res.json();
                alert(`Payment failed: ${err.detail || 'Unknown error'}`);
            }
        } catch (error) {
            alert("An error occurred during payment processing.");
            console.error(error);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8">
            {/* Header element */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Commission Earnings</h1>
                    <p className="text-slate-500 mt-1">Track and pay I.O.U.s for agencies, branches, and employees.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchCommissions}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-sm font-medium"
                    >
                        <RefreshCcw size={16} /> Refresh
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2 text-yellow-600">
                        <Clock size={20} />
                        <span className="font-medium text-sm">Total Pending</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">Rs. {totals.pending.toLocaleString()}</div>
                    <div className="text-xs text-slate-500 mt-1">Bookings confirmed</div>
                </div>

                <div className="bg-white rounded-2xl border border-blue-200 p-5 shadow-sm ring-1 ring-blue-50">
                    <div className="flex items-center gap-3 mb-2 text-blue-600">
                        <CheckSquare size={20} />
                        <span className="font-medium text-sm">Total Earned</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">Rs. {totals.earned.toLocaleString()}</div>
                    <div className="text-xs text-slate-500 mt-1">Ready to be paid</div>
                </div>

                <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2 text-emerald-600">
                        <CheckCircle size={20} />
                        <span className="font-medium text-sm">Total Paid</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">Rs. {totals.paid.toLocaleString()}</div>
                    <div className="text-xs text-slate-500 mt-1">Successfully settled</div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2 text-red-600">
                        <XCircle size={20} />
                        <span className="font-medium text-sm">Total Cancelled</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">Rs. {totals.cancelled.toLocaleString()}</div>
                    <div className="text-xs text-slate-500 mt-1">Invalidated payouts</div>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[600px]">
                {/* Filters Top Bar */}
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative flex-1 max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by reference or earner name..."
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <select
                            value={filters.earner_type}
                            onChange={(e) => setFilters(prev => ({ ...prev, earner_type: e.target.value }))}
                            className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 px-3 py-2 outline-none"
                        >
                            <option value="all">All Earner Types</option>
                            <option value="agency">Agencies</option>
                            <option value="branch">Branches</option>
                            <option value="employee">Employees</option>
                        </select>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                            className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 px-3 py-2 outline-none"
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="earned">Earned</option>
                            <option value="paid">Paid</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>

                {/* Table Area */}
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="text-xs uppercase bg-slate-50/80 text-slate-500 sticky top-0 z-10 backdrop-blur-xl border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Date / Ref</th>
                                <th className="px-6 py-4 font-semibold">Earner Name</th>
                                <th className="px-6 py-4 font-semibold">Booking Type</th>
                                <th className="px-6 py-4 font-semibold">Booking Status</th>
                                <th className="px-6 py-4 font-semibold text-right">Amount</th>
                                <th className="px-6 py-4 font-semibold">Commission Status</th>
                                <th className="px-6 py-4 font-semibold text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin"></div>
                                            <span>Loading commission ledger...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : records.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                        <DollarSign size={32} className="mx-auto text-slate-300 mb-3" />
                                        <p>No commission records found.</p>
                                    </td>
                                </tr>
                            ) : (
                                records.map((record) => (
                                    <tr key={record._id || record.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-slate-900">{record.booking_reference}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                <Calendar size={12} /> {new Date(record.created_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{record.earner_name}</div>
                                            <div className="text-xs text-slate-500 capitalize">{record.earner_type}</div>
                                        </td>
                                        <td className="px-6 py-4 capitalize">
                                            {record.booking_type}
                                        </td>
                                        <td className="px-6 py-4">
                                            {record.booking_status ? (
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize
                                                ${record.booking_status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                                                        record.booking_status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                            'bg-blue-100 text-blue-800'
                                                    }`}>
                                                    {record.booking_status.replace('_', ' ')}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="font-bold text-slate-900">
                                                Rs. {parseFloat(record.commission_amount).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={record.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {(record.status === 'earned' || (record.status === 'pending' && ['approved', 'confirmed'].includes(record.booking_status?.toLowerCase()))) && (
                                                <button
                                                    onClick={() => handlePay(record._id || record.id)}
                                                    disabled={processingId === (record._id || record.id)}
                                                    className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm
                            ${processingId === (record._id || record.id)
                                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                            : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow shadow-emerald-600/20 active:scale-[0.98]'
                                                        }
                          `}
                                                >
                                                    {processingId === (record._id || record.id) ? (
                                                        <>
                                                            <div className="w-4 h-4 border-2 border-slate-300 border-t-white rounded-full animate-spin mr-2"></div>
                                                            Processing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <DollarSign size={16} className="mr-1.5" /> Pay Now
                                                        </>
                                                    )}
                                                </button>
                                            )}

                                            {record.status === 'paid' && (
                                                <span className="text-xs text-slate-400">
                                                    Paid on {new Date(record.paid_at).toLocaleDateString()}
                                                </span>
                                            )}
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
}