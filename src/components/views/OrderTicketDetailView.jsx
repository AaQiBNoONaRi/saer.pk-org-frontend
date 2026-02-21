import React, { useState } from 'react';
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Search,
    Bell,
    Menu,
    Printer,
    Download,
    Calendar
} from 'lucide-react';

// --- Reusable Components (Internal to this view for now, or import if shared) ---

const TopFilterButton = ({ label }) => (
    <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm">
        {label}
        <ChevronDown size={14} />
    </button>
);

const SectionHeader = ({ title, actions }) => (
    <div className="flex items-center justify-between mb-4 mt-8">
        <h3 className="text-lg font-black text-slate-800 tracking-tight">{title}</h3>
        {actions && <div className="flex gap-3">{actions}</div>}
    </div>
);

const ActionButtonSmall = ({ label }) => (
    <button className="px-4 py-2 bg-[#4FA5FE] hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-sm transition-colors">
        {label}
    </button>
);

export default function OrderTicketDetailView({ onBack, order }) {
    // We can use the 'order' prop to populate details dynamically in the future.
    // For now, we will use the static layout as requested, matching frontend.js

    return (
        <div className="bg-[#F8F9FD] min-h-screen">
            <div className="p-4 md:px-8 md:pb-8 space-y-4">

                {/* Top Navigation Tabs - (Visual only for this view as per request, or we can remove if it conflicts with App.jsx tabs)
            In App.jsx, we are already inside a tab, so maybe we don't need this, but keeping it to match the mockup exactly.
        */}
                <div className="flex gap-6 mb-2">
                    <button className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors pb-2">Umrah Package</button>
                    <button className="text-sm font-bold text-blue-600 border-b-[3px] border-blue-600 pb-2">Ticketing</button>
                </div>

                {/* Secondary Search & Date Filter (Right Aligned) */}
                <div className="hidden md:flex justify-end gap-3 mb-2 -mt-10">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input type="text" placeholder="Search name, package, etc" className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all shadow-sm" />
                    </div>
                    <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
                        <Calendar size={14} className="text-slate-400" />
                        Today
                        <ChevronDown size={14} className="text-slate-400" />
                    </button>
                </div>

                {/* Filters Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pt-2">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                        <span>Showing</span>
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 shadow-sm">11 <ChevronDown size={14} /></button>
                        <span>out of 286</span>
                        <TopFilterButton label="LHR-JED" />
                        <TopFilterButton label="JED-LHR" />
                        <TopFilterButton label="Sort by travel date" />
                    </div>

                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50">
                            <ChevronLeft size={14} /> Previous
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center bg-[#4FA5FE] text-white rounded-lg text-xs font-bold shadow-sm">1</button>
                        <button className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50">2</button>
                        <button className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50">3</button>
                        <span className="text-slate-400 px-1">...</span>
                        <button className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50">16</button>
                        <button className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50">
                            Next <ChevronRight size={14} />
                        </button>
                    </div>
                </div>

                {/* Main Content Card */}
                <div className="bg-white rounded-[32px] shadow-sm border border-slate-100/50 p-8">

                    {/* 1. Header Area */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-slate-100 pb-8">
                        <div
                            className="flex items-center gap-3 text-blue-600 hover:text-blue-700 transition-colors cursor-pointer group"
                            onClick={onBack}
                        >
                            <ChevronLeft size={24} strokeWidth={3} />
                            <h2 className="text-xl font-black text-slate-800 group-hover:text-blue-700 transition-colors">
                                Order Delivery system/Tickets/ Detail
                            </h2>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <button className="px-8 py-2.5 bg-[#0066FF] hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-2">
                                <Printer size={16} /> Print
                            </button>
                            <button className="px-8 py-2.5 bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2">
                                <Download size={16} /> Download
                            </button>
                        </div>
                    </div>

                    {/* 2. Order Summary Table */}
                    <div className="mb-8">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                                        <th className="pb-4 pr-4">order no</th>
                                        <th className="pb-4 px-4">Status</th>
                                        <th className="pb-4 px-4">Agency Code</th>
                                        <th className="pb-4 px-4">Agreement Status</th>
                                        <th className="pb-4 px-4">Balance</th>
                                        <th className="pb-4 pl-4 text-right">Creation Timestamps</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="text-sm font-bold text-slate-800">
                                        <td className="py-5 pr-4 underline decoration-slate-300 underline-offset-4 font-black">{order?.id || 'sjdns'}</td>
                                        <td className="py-5 px-4 text-blue-600">{order?.paymentStatus || 'Paid'}</td>
                                        <td className="py-5 px-4 text-blue-600">OUHEFW89</td>
                                        <td className="py-5 px-4 text-blue-600">N/A</td>
                                        <td className="py-5 px-4 text-blue-600">1000</td>
                                        <td className="py-5 pl-4 text-right text-slate-600 font-semibold">Dec 19, 2025 14:00</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 3. Pax Detail */}
                    <div className="mb-8">
                        <SectionHeader
                            title="Pax Detail"
                            actions={<ActionButtonSmall label="Edit Details" />}
                        />
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                                        <th className="pb-4 pr-4">SNO</th>
                                        <th className="pb-4 px-4">Passport No</th>
                                        <th className="pb-4 px-4">Expiry Date</th>
                                        <th className="pb-4 px-4">Pax Name</th>
                                        <th className="pb-4 px-4">Gender</th>
                                        <th className="pb-4 pl-4">Passport Detail</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="text-sm text-slate-600 font-semibold">
                                        <td className="py-5 pr-4 font-black text-slate-800 underline decoration-slate-300 underline-offset-4">1</td>
                                        <td className="py-5 px-4 font-bold text-slate-800">Lkaf2623165</td>
                                        <td className="py-5 px-4 font-bold text-slate-800">December 2025</td>
                                        <td className="py-5 px-4 font-black text-slate-900">Ali Hamza</td>
                                        <td className="py-5 px-4 font-bold text-slate-800">M</td>
                                        <td className="py-5 pl-4">ETC....</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 4. Flight Details */}
                    <div className="mb-8">
                        <SectionHeader
                            title="Flight Details"
                            actions={<ActionButtonSmall label="Send Ticket" />}
                        />
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                                        <th className="pb-4 pr-4">Airline</th>
                                        <th className="pb-4 px-4">PNR</th>
                                        <th className="pb-4 px-4">Route</th>
                                        <th className="pb-4 px-4">Dep Date & Time</th>
                                        <th className="pb-4 px-4">Arv Date & Time</th>
                                        <th className="pb-4 px-4">Dep Date & Time</th>
                                        <th className="pb-4 pl-4">Arv Date & Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="text-sm font-bold text-slate-800">
                                        <td className="py-5 pr-4 underline decoration-slate-300 underline-offset-4">Saudia Airline</td>
                                        <td className="py-5 px-4">2463366</td>
                                        <td className="py-5 px-4">LHR-JED-LHR</td>
                                        <td className="py-5 px-4">28/03/25 14:30</td>
                                        <td className="py-5 px-4">28/03/25 10:30</td>
                                        <td className="py-5 px-4">14/04/25 1:30</td>
                                        <td className="py-5 pl-4">14/04/25 2:00</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 5. Agent Detail */}
                    <div className="mb-8">
                        <SectionHeader title="Agent Detail" />
                        <div className="overflow-x-auto">
                            <table className="w-full text-center">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                                        <th className="pb-4 px-4 text-left">Agency Name</th>
                                        <th className="pb-4 px-4">Agent Name</th>
                                        <th className="pb-4 px-4">Contact</th>
                                        <th className="pb-4 px-4">Adress</th>
                                        <th className="pb-4 pl-4 text-right">Email</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="text-sm font-bold text-slate-800">
                                        <td className="py-5 px-4 text-left">92 World Tour and travel</td>
                                        <td className="py-5 px-4 underline decoration-slate-300 underline-offset-4">Ali Meer</td>
                                        <td className="py-5 px-4">+92361 6565235</td>
                                        <td className="py-5 px-4">+92361 6565235</td>
                                        <td className="py-5 pl-4 text-right uppercase text-slate-600">alimeer@GMAIL.COM</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 6. Order Detail */}
                    <div className="mb-8">
                        <SectionHeader
                            title="Order Detail"
                            actions={
                                <>
                                    <ActionButtonSmall label="Add Discount" />
                                    <ActionButtonSmall label="Refund Payment" />
                                </>
                            }
                        />
                        <div className="overflow-x-auto">
                            <table className="w-full text-center">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                                        <th className="pb-4 px-4 text-left">Order No</th>
                                        <th className="pb-4 px-4">Date</th>
                                        <th className="pb-4 px-4">No. of Pax</th>
                                        <th className="pb-4 px-4">Discount</th>
                                        <th className="pb-4 px-4">Total Amount</th>
                                        <th className="pb-4 pl-4 text-right">Total Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="text-sm font-bold text-slate-800">
                                        <td className="py-5 px-4 text-left">36636298</td>
                                        <td className="py-5 px-4">Dec 19, 2025</td>
                                        <td className="py-5 px-4">10</td>
                                        <td className="py-5 px-4">1000</td>
                                        <td className="py-5 px-4 underline decoration-slate-300 underline-offset-4">Rs. 120,000/-</td>
                                        <td className="py-5 pl-4 text-right">
                                            <button className="px-6 py-2 bg-[#0066FF] hover:bg-blue-700 text-white rounded-md text-xs font-bold uppercase shadow-sm transition-colors">
                                                INVOICE
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 7. Payment Detail */}
                    <div className="mb-12">
                        <SectionHeader title="Payment Detail" />
                        <div className="overflow-x-auto">
                            <table className="w-full text-center">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                                        <th className="pb-4 px-4 text-left">Total Amount</th>
                                        <th className="pb-4 px-4">Received By</th>
                                        <th className="pb-4 px-4">Date</th>
                                        <th className="pb-4 px-4">Paid Amount</th>
                                        <th className="pb-4 px-4">Payment Method</th>
                                        <th className="pb-4 pl-4 text-right">Remaining Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="text-sm font-bold text-slate-800">
                                        <td className="py-5 px-4 text-left underline decoration-slate-300 underline-offset-4">Rs. 120,000/-</td>
                                        <td className="py-5 px-4">Ali meer</td>
                                        <td className="py-5 px-4">Dec 20, 2025</td>
                                        <td className="py-5 px-4 text-[#4FA5FE] underline decoration-blue-200 underline-offset-4">Rs. 120,000/-</td>
                                        <td className="py-5 px-4">Via Alfalah Bank</td>
                                        <td className="py-5 pl-4 text-right">Rs. 0/-</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 8. Footer Info & Primary Actions */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-slate-100 pb-10 mb-8">
                        <div className="flex-1 flex justify-center md:justify-start lg:justify-center">
                            <button className="px-6 py-3 bg-[#0066FF] hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md shadow-blue-600/20 transition-all">
                                Set Infant And Child Fare
                            </button>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-medium text-slate-400">Agent Confirm By: </span>
                            <span className="text-sm font-bold text-slate-800">Ali Meer/code</span>
                        </div>
                    </div>

                    {/* Bottom Buttons Array */}
                    <div className="flex flex-wrap justify-center lg:justify-between items-center gap-4">
                        <div className="flex flex-wrap gap-3">
                            {[
                                'Add payment',
                                'Partail Paid',
                                'Refund Ticket',
                                'Confirm Order',
                                'cancel Order',
                                'Cancel with note'
                            ].map((label, idx) => (
                                <button key={idx} className="px-6 py-2.5 bg-[#0066FF] hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors capitalize">
                                    {label}
                                </button>
                            ))}
                        </div>
                        <button disabled className="px-10 py-2.5 bg-slate-50 border border-slate-200 text-slate-400 rounded-lg text-xs font-bold cursor-not-allowed">
                            Close
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
