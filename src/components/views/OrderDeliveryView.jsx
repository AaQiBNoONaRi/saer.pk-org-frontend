import React, { useState } from 'react';
import {
    Filter,
    Briefcase,
    MapPin,
    User,
    Building2,
    Globe,
    Clock,
    XCircle,
    MoreHorizontal,
    AlertCircle,
    CheckCircle2,
    Search,
} from 'lucide-react';

// --- Reusable UI Components ---

const FilterButton = ({ label, active, onClick, icon: Icon, variant = 'blue' }) => {
    const baseStyles = "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 border";

    const variants = {
        blue: active
            ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20"
            : "bg-white text-slate-600 border-slate-200 hover:border-blue-200 hover:text-blue-600 hover:shadow-sm",
        red: active
            ? "bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20"
            : "bg-white text-rose-600 border-rose-100 hover:border-rose-200 hover:bg-rose-50",
        amber: active
            ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20"
            : "bg-white text-amber-600 border-amber-100 hover:border-amber-200 hover:bg-amber-50",
        emerald: active
            ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20"
            : "bg-white text-emerald-600 border-emerald-100 hover:border-emerald-200 hover:bg-emerald-50",
    };

    return (
        <button
            onClick={onClick}
            className={`${baseStyles} ${variants[variant] || variants.blue}`}
        >
            {Icon && <Icon size={14} strokeWidth={active ? 2.5 : 2} />}
            {label}
        </button>
    );
};

const TabLink = ({ label, active, onClick, count }) => (
    <button
        onClick={onClick}
        className={`
      pb-4 px-2 text-sm font-bold border-b-2 transition-all flex items-center gap-2
      ${active
                ? 'text-blue-600 border-blue-600'
                : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-200'}
    `}
    >
        {label}
        {count !== undefined && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${active ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                {count}
            </span>
        )}
    </button>
);

const AgencyTypeBadge = ({ type }) => {
    const styles = {
        'FULL AGENT': 'bg-blue-100 text-blue-700',
        'AREA AGENT': 'bg-cyan-100 text-cyan-700',
        'UNKNOWN': 'bg-slate-500 text-white',
    };
    return (
        <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wide ${styles[type] || styles['UNKNOWN']}`}>
            {type}
        </span>
    );
};

const CountBadge = ({ count, color }) => {
    const colors = {
        red: 'bg-rose-500',
        green: 'bg-emerald-600',
        amber: 'bg-amber-400'
    };
    return (
        <span className={`inline-flex items-center justify-center w-8 h-6 rounded-md text-[10px] font-bold text-white shadow-sm ${colors[color]}`}>
            {count}
        </span>
    );
};

// --- Main View ---

export default function OrderDeliveryView({ onOrderClick }) {
    const [mainTab, setMainTab] = useState('Un-Confirmed Orders');
    const [sourceFilter, setSourceFilter] = useState('Agent Orders');
    const [packageFilter, setPackageFilter] = useState('Custom Packages');
    const [statusFilter, setStatusFilter] = useState('All');
    const [selectedBranch, setSelectedBranch] = useState('');
    const [showBranchDropdown, setShowBranchDropdown] = useState(false);

    const zeroOrderAgencies = [
        { name: 'Abdul Rafay Qureshi', contact: 'N/A', type: 'FULL AGENT' },
        { name: 'Pro-Fighter', contact: 'N/A', type: 'AREA AGENT' },
        { name: 'Reseller Agency', contact: 'N/A', type: 'UNKNOWN' },
        { name: 'hbl', contact: 'N/A', type: 'UNKNOWN' },
    ];

    const allOrders = [
        { id: 'ORD-2025-881', type: 'Umrah Packages', agent: '92 World Travel', source: 'Agent Orders', branch: '', pax: '06 Pax', orderStatus: 'Confirmed', paymentStatus: 'Paid', deliveryStatus: 'Delivered' },
        { id: 'ORD-2025-882', type: 'Custom Packages', agent: 'Al-Madina Travels', source: 'Agent Orders', branch: '', pax: '04 Pax', orderStatus: 'Pending', paymentStatus: 'Paid', deliveryStatus: 'Processing' },
        { id: 'ORD-2025-883', type: 'Group Tickets', agent: 'Rehan Rafique', source: 'Area Agent Orders', branch: '', pax: '12 Pax', orderStatus: 'Confirmed', paymentStatus: 'Unpaid', deliveryStatus: 'Processing' },
        { id: 'ORD-2025-884', type: 'Umrah Packages', agent: 'Bilal Ahmad', source: 'Customer Orders', branch: '', pax: '03 Pax', orderStatus: 'Pending', paymentStatus: 'Paid', deliveryStatus: 'Pending' },
        { id: 'ORD-2025-885', type: 'Custom Packages', agent: 'Al-Noor Travels', source: 'Branch Orders', branch: 'Lahore Branch', pax: '08 Pax', orderStatus: 'Confirmed', paymentStatus: 'Paid', deliveryStatus: 'Delivered' },
        { id: 'ORD-2025-886', type: 'Group Tickets', agent: 'Pak Tours', source: 'Branch Orders', branch: 'Islamabad Branch', pax: '20 Pax', orderStatus: 'Cancelled', paymentStatus: 'Refunded', deliveryStatus: 'Cancelled' },
        { id: 'ORD-2025-887', type: 'Umrah Packages', agent: 'Safa Travels', source: 'Agent Orders', branch: '', pax: '05 Pax', orderStatus: 'Pending', paymentStatus: 'Unpaid', deliveryStatus: 'Pending' },
        { id: 'ORD-2025-888', type: 'Custom Packages', agent: 'Marwa Tours', source: 'Area Agent Orders', branch: '', pax: '02 Pax', orderStatus: 'Confirmed', paymentStatus: 'Paid', deliveryStatus: 'Processing' },
        { id: 'ORD-2025-889', type: 'Group Tickets', agent: 'Sky Wings', source: 'All Orders', branch: '', pax: '15 Pax', orderStatus: 'Pending', paymentStatus: 'Partial', deliveryStatus: 'Pending' },
        { id: 'ORD-2025-890', type: 'Umrah Packages', agent: 'Zam Zam Travels', source: 'Branch Orders', branch: 'Karachi Branch', pax: '07 Pax', orderStatus: 'Confirmed', paymentStatus: 'Paid', deliveryStatus: 'Delivered' },
    ];

    const statusColors = {
        Confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        Pending: 'bg-amber-50 text-amber-600 border-amber-100',
        Cancelled: 'bg-rose-50 text-rose-600 border-rose-100',
        Paid: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        Unpaid: 'bg-rose-50 text-rose-600 border-rose-100',
        Partial: 'bg-amber-50 text-amber-600 border-amber-100',
        Refunded: 'bg-slate-100 text-slate-500 border-slate-200',
        Delivered: 'bg-blue-50 text-blue-600 border-blue-100',
        Processing: 'bg-violet-50 text-violet-600 border-violet-100',
    };

    const filteredOrders = allOrders.filter(order => {
        const matchSource = sourceFilter === 'All Orders' || order.source === sourceFilter || (sourceFilter === 'Branch Orders' && order.source === 'Branch Orders' && (!selectedBranch || order.branch === selectedBranch));
        const matchType = order.type === packageFilter;
        const matchStatus = statusFilter === 'All' ||
            (statusFilter === 'Under-process' && order.deliveryStatus === 'Processing') ||
            (statusFilter === 'Delivered' && order.deliveryStatus === 'Delivered') ||
            (statusFilter === 'Cancelled' && order.orderStatus === 'Cancelled') ||
            (statusFilter === 'Un-Approved' && order.orderStatus === 'Pending');
        const matchTab = mainTab === 'Confirmed Orders' ? order.orderStatus === 'Confirmed' : order.orderStatus !== 'Confirmed';
        return matchSource && matchType && matchStatus && matchTab;
    });

    return (
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100/50 min-h-[600px] flex flex-col">

            {/* 1. Top Tabs */}
            <div className="px-8 pt-8 border-b border-slate-100 flex gap-8">
                <TabLink
                    label="Confirmed Orders"
                    active={mainTab === 'Confirmed Orders'}
                    onClick={() => setMainTab('Confirmed Orders')}
                />
                <TabLink
                    label="Un-Confirmed Orders"
                    active={mainTab === 'Un-Confirmed Orders'}
                    onClick={() => setMainTab('Un-Confirmed Orders')}
                    count={12}
                />
                <TabLink
                    label="Zero Order Agencies"
                    active={mainTab === 'Zero Order Agencies'}
                    onClick={() => setMainTab('Zero Order Agencies')}
                />
            </div>

            {/* ZERO ORDER AGENCIES TAB */}
            {mainTab === 'Zero Order Agencies' ? (
                <div className="flex-1 flex flex-col">
                    <div className="p-8 pb-4">
                        <h3 className="text-base font-extrabold text-slate-800 mb-4">Agency Order Statistics</h3>
                        <input
                            type="text"
                            placeholder="Search by agency name..."
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                        />
                    </div>

                    <div className="flex-1 px-8 pb-8">
                        <div className="border border-slate-100 rounded-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-slate-50/50 border-b border-slate-100">
                                            {['Agency Name', 'Contact Number', 'Agency Type', 'Total Bookings', 'Paid Bookings', 'Unpaid Bookings', 'Actions'].map((header, i) => (
                                                <th key={i} className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider text-left">
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {zeroOrderAgencies.map((agency, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4 text-sm font-medium text-slate-800">{agency.name}</td>
                                                <td className="px-6 py-4 text-sm font-medium text-slate-500">{agency.contact}</td>
                                                <td className="px-6 py-4">
                                                    <AgencyTypeBadge type={agency.type} />
                                                </td>
                                                <td className="px-6 py-4 pl-10"><CountBadge count={0} color="red" /></td>
                                                <td className="px-6 py-4 pl-10"><CountBadge count={0} color="green" /></td>
                                                <td className="px-6 py-4 pl-10"><CountBadge count={0} color="amber" /></td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2">
                                                        <button className="px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 text-xs font-bold hover:bg-blue-50 transition-colors">
                                                            Remarks
                                                        </button>
                                                        <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 text-xs font-bold hover:bg-slate-50 hover:text-slate-700 transition-colors">
                                                            Follow-up
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* CONFIRMED / UN-CONFIRMED ORDERS */
                <>
                    {/* 2. Filter Controls */}
                    <div className="p-8 pb-4 space-y-6">

                        {/* Row 1: Source */}
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">Source:</span>
                            <FilterButton label="Agent Orders" icon={Briefcase} active={sourceFilter === 'Agent Orders'} onClick={() => setSourceFilter('Agent Orders')} />
                            <FilterButton label="Area Agent Orders" icon={MapPin} active={sourceFilter === 'Area Agent Orders'} onClick={() => setSourceFilter('Area Agent Orders')} />
                            <FilterButton label="Customer Orders" icon={User} active={sourceFilter === 'Customer Orders'} onClick={() => setSourceFilter('Customer Orders')} />

                            <div className="relative">
                                <FilterButton
                                    label="Branch Orders"
                                    icon={Building2}
                                    active={sourceFilter === 'Branch Orders'}
                                    onClick={() => {
                                        setSourceFilter('Branch Orders');
                                        setShowBranchDropdown(!showBranchDropdown);
                                    }}
                                />
                                {sourceFilter === 'Branch Orders' && showBranchDropdown && (
                                    <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-slate-100 shadow-xl rounded-xl p-2 z-20">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase px-2 mb-2">Select Branch</p>
                                        {['Lahore Branch', 'Islamabad Branch', 'Karachi Branch', 'Multan Branch'].map((branch) => (
                                            <button
                                                key={branch}
                                                onClick={() => { setSelectedBranch(branch); setShowBranchDropdown(false); }}
                                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors ${selectedBranch === branch ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
                                            >
                                                {branch}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <FilterButton label="All Orders" icon={Globe} active={sourceFilter === 'All Orders'} onClick={() => setSourceFilter('All Orders')} />
                        </div>

                        {/* Row 2: Package Type */}
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">Type:</span>
                            <FilterButton label="Umrah Packages" active={packageFilter === 'Umrah Packages'} onClick={() => setPackageFilter('Umrah Packages')} />
                            <FilterButton label="Custom Packages" active={packageFilter === 'Custom Packages'} onClick={() => setPackageFilter('Custom Packages')} />
                            <FilterButton label="Group Tickets" active={packageFilter === 'Group Tickets'} onClick={() => setPackageFilter('Group Tickets')} />
                        </div>

                        {/* Row 3: Status & Search */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">Status:</span>
                                <FilterButton label="All" active={statusFilter === 'All'} onClick={() => setStatusFilter('All')} />
                                <FilterButton label="Under-process" icon={Clock} active={statusFilter === 'Under-process'} onClick={() => setStatusFilter('Under-process')} />
                                {mainTab === 'Confirmed Orders' && (
                                    <>
                                        <FilterButton label="Un-Approved" icon={AlertCircle} variant="amber" active={statusFilter === 'Un-Approved'} onClick={() => setStatusFilter('Un-Approved')} />
                                        <FilterButton label="Delivered" icon={CheckCircle2} variant="emerald" active={statusFilter === 'Delivered'} onClick={() => setStatusFilter('Delivered')} />
                                    </>
                                )}
                                <FilterButton label="Cancelled" icon={XCircle} variant="red" active={statusFilter === 'Cancelled'} onClick={() => setStatusFilter('Cancelled')} />
                            </div>

                            <div className="relative w-full md:w-80">
                                <input
                                    type="text"
                                    placeholder="Search Order Number..."
                                    className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                />
                                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors shadow-sm border border-slate-100">
                                    <Search size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 3. Data Table */}
                    <div className="flex-1 px-8 pb-8">
                        <div className="border border-slate-200 rounded-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200">
                                            {['Order ID', 'Order Type', 'Customer/Agent', 'Pax Count', 'Order Status', 'Payment Status', 'Delivery Status', 'Actions'].map((header, i) => (
                                                <th key={i} className={`px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide ${i === 7 ? 'text-right' : 'text-left'}`}>
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredOrders.length > 0 ? (
                                            filteredOrders.map((order) => (
                                                <tr key={order.id} className="group hover:bg-blue-50/30 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-blue-600">
                                                        <button
                                                            onClick={() => onOrderClick && onOrderClick(order)}
                                                            className="hover:underline hover:text-blue-700"
                                                        >
                                                            {order.id}
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-medium text-slate-600">{order.type}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-slate-800">{order.agent}</span>
                                                            {order.branch && <span className="text-[10px] text-slate-400 uppercase font-bold">{order.branch}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-bold text-slate-800">{order.pax}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${statusColors[order.orderStatus]}`}>
                                                            {order.orderStatus}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${statusColors[order.paymentStatus]}`}>
                                                            {order.paymentStatus}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${statusColors[order.deliveryStatus]}`}>
                                                            {order.deliveryStatus}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-colors">
                                                            <MoreHorizontal size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="8" className="px-6 py-20 text-center">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 ring-1 ring-slate-100">
                                                            <Filter className="text-slate-300" size={32} />
                                                        </div>
                                                        <h3 className="text-sm font-bold text-slate-800">No Orders Found</h3>
                                                        <p className="text-xs text-slate-400 mt-1">Try adjusting your filters to find what you're looking for.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination */}
                        <div className="mt-4 flex items-center justify-between text-xs text-slate-400 font-medium">
                            <p>Showing <span className="font-bold text-slate-700">{filteredOrders.length}</span> result{filteredOrders.length !== 1 ? 's' : ''}</p>
                            <div className="flex gap-2">
                                <button disabled className="px-3 py-1.5 border border-slate-200 rounded-lg opacity-50 cursor-not-allowed">Previous</button>
                                <button disabled className="px-3 py-1.5 border border-slate-200 rounded-lg opacity-50 cursor-not-allowed">Next</button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
