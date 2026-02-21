import React, { useState } from 'react';
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronLeft as BackIcon,
    Settings,
    X
} from 'lucide-react';

const StatusRow = ({ label, value }) => (
    <div className="flex items-center justify-end gap-2 mb-2">
        <span className="text-sm font-bold text-slate-700">{label}:</span>
        <span className="text-xs font-bold text-white bg-blue-400 px-6 py-1 rounded-full min-w-[80px] text-center shadow-sm">{value}</span>
    </div>
);

const SectionHeader = ({ title }) => (
    <h3 className="text-sm font-extrabold text-slate-800 mb-4 border-l-4 border-slate-800 pl-3 uppercase tracking-wide">
        {title}
    </h3>
);

const TopFilterButton = ({ label }) => (
    <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-all">
        {label}
        <ChevronDown size={14} />
    </button>
);

const AddNotesModal = ({ isOpen, onClose, onReject }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 pb-4 border-b border-slate-100 flex justify-center relative">
                    <h2 className="text-xl font-extrabold text-slate-800">Add Notes</h2>
                    {/* <button onClick={onClose} className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button> */}
                </div>

                <div className="p-6 space-y-6">
                    {/* Previous Notes / Context Box */}
                    <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 relative">
                        <button className="absolute right-4 top-4 text-blue-400 hover:text-blue-600">
                            <Settings size={16} />
                        </button>

                        <div className="space-y-4">
                            <div>
                                <h4 className="text-xs font-bold text-slate-700 mb-1">Notes</h4>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Call 92 world tour tommorow and he will pay all the money
                                </p>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold text-slate-700 mb-1">Date Reminder</h4>
                                <p className="text-xs text-slate-500">18/01/2025</p>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold text-slate-700 mb-1">Empolyer name</h4>
                                <p className="text-xs text-slate-500">id/name</p>
                            </div>
                        </div>
                    </div>

                    {/* Text Area */}
                    <div>
                        <label className="text-xs font-bold text-slate-700 mb-2 block relative">
                            Notes
                            <span className="absolute top-1/2 -translate-y-1/2 right-0 w-full h-[1px] bg-slate-200 -z-10 bg-gradient-to-r from-transparent via-slate-200 to-transparent"></span>
                        </label>
                        <textarea
                            className="w-full h-32 p-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all resize-none"
                            placeholder="Enter Notes"
                        ></textarea>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onReject}
                            className="flex-1 bg-blue-600 text-white text-sm font-bold py-3 rounded-lg shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95"
                        >
                            Rject Order
                        </button>
                        <button
                            onClick={onClose}
                            className="flex-1 bg-slate-100 text-slate-500 text-sm font-bold py-3 rounded-lg border border-slate-200 hover:bg-slate-200 hover:text-slate-600 transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function OrderDeliveryDetailView({ onBack, orderId, onConfirm }) {
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

    const handleReject = () => {
        // Logic to actually reject the order would go here
        console.log("Order Rejected");
        setIsRejectModalOpen(false);
    };

    return (
        <div className="bg-[#F8F9FD] min-h-screen">
            {/* Modal */}
            <AddNotesModal
                isOpen={isRejectModalOpen}
                onClose={() => setIsRejectModalOpen(false)}
                onReject={handleReject}
            />

            <div className="p-4 md:p-8 space-y-6">

                {/* Main Content Card (Upper Section) */}
                <div className="bg-white rounded-[24px] shadow-sm border border-slate-100/50 pt-8 px-8 pb-4">

                    {/* Header Grid: Back button + Details + Status Pills */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">

                        {/* Left Side: Order Info & Actions (Spans 8 cols) */}
                        <div className="lg:col-span-8 space-y-8">

                            {/* Back Title */}
                            <div
                                onClick={onBack}
                                className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer w-fit"
                            >
                                <BackIcon size={20} />
                                <h2 className="text-xl font-bold text-slate-800">Order Number <span className="text-slate-400 font-medium">({orderId || '812531JHASC'})</span></h2>
                            </div>

                            {/* Agent Details Block */}
                            <div className="space-y-6 pl-1">
                                <div>
                                    <p className="text-sm font-bold text-slate-600 mb-1">Agent Name:</p>
                                    <p className="text-base text-slate-500 font-medium">Reman Rafique</p>
                                </div>

                                <div className="flex flex-wrap items-end gap-x-12 gap-y-6">
                                    <div>
                                        <p className="text-sm font-bold text-slate-600 mb-1">Agency Name:</p>
                                        <p className="text-base text-slate-500 font-medium">92 World travel</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-600 mb-1">Contact:</p>
                                        <p className="text-base text-slate-500 font-medium">+923631569535</p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 pb-1">
                                        <button className="px-8 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all">
                                            Print
                                        </button>
                                        <button className="px-8 py-2.5 bg-white border border-slate-200 text-slate-400 rounded-lg text-sm font-medium hover:border-slate-300 hover:text-slate-600 transition-all">
                                            Download
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Status Pills (Spans 4 cols) */}
                        <div className="lg:col-span-4 flex flex-col justify-start pt-2">
                            <StatusRow label="Visa" value="N/A" />
                            <StatusRow label="Hotel Voucher" value="N/A" />
                            <StatusRow label="Transport" value="N/A" />
                            <StatusRow label="Tickets" value="N/A" />
                        </div>
                    </div>

                    {/* Summary Table */}
                    <div className="border-t border-slate-100 pt-8 pb-4">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-sm font-bold text-slate-600 border-b border-transparent">
                                        <th className="pb-4 pr-6">Order No</th>
                                        <th className="pb-4 px-6 text-center">Agency Code</th>
                                        <th className="pb-4 px-6 text-center">Agreement Status</th>
                                        <th className="pb-4 px-6 text-center">Package No</th>
                                        <th className="pb-4 px-6 text-center">Total Pax</th>
                                        <th className="pb-4 px-6">Balance</th>
                                        <th className="pb-4 pl-6 text-center bg-slate-50/50 rounded-t-lg">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="text-sm font-medium text-slate-800">
                                        <td className="py-4 pr-6">sjdns</td>
                                        <td className="py-4 px-6 text-center">222463</td>
                                        <td className="py-4 px-6 text-center">Active</td>
                                        <td className="py-4 px-6 text-center">23336</td>
                                        <td className="py-4 px-6 text-center">3</td>
                                        <td className="py-4 px-6">PKR 1,000</td>
                                        <td className="py-4 pl-6 text-center bg-cyan-50/30 rounded-b-lg">
                                            <span className="text-cyan-500 font-bold">N/A</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>

                {/* Booking Overview Title */}
                <h2 className="text-xl font-extrabold text-slate-800 pt-4">Booking Overview</h2>
                <div className="border-t border-slate-200"></div>

                {/* Pax Information Section */}
                <div>
                    <SectionHeader title="Pax Information" />
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[800px]">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        {['Passenger Name', 'Passport No', 'PAX', 'DOB', 'PNR', 'Bed', 'Total Pax'].map((h, i) => (
                                            <th key={i} className={`px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wide ${i === 6 ? 'text-right' : ''}`}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                                    <tr>
                                        <td className="px-6 py-4 font-bold text-slate-800">BILAL AHMAD MUHAMMAD YASIR</td>
                                        <td className="px-6 py-4 font-mono">FE758453</td>
                                        <td className="px-6 py-4">Adult</td>
                                        <td className="px-6 py-4">23/07/73</td>
                                        <td className="px-6 py-4">RNIO23</td>
                                        <td className="px-6 py-4">True</td>
                                        <td className="px-6 py-4 font-bold text-slate-900 text-right align-middle" rowSpan={3}>2 Adult & 1 Child</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-4 font-bold text-slate-800">ARSLAN BILAL BILAL AHMAD</td>
                                        <td className="px-6 py-4 font-mono">FE702511</td>
                                        <td className="px-6 py-4">Adult</td>
                                        <td className="px-6 py-4">28/07/83</td>
                                        <td className="px-6 py-4">RNIO23</td>
                                        <td className="px-6 py-4">True</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-4 font-bold text-slate-800">BEENISH BILAL</td>
                                        <td className="px-6 py-4 font-mono">CMG708591</td>
                                        <td className="px-6 py-4">Child</td>
                                        <td className="px-6 py-4">24/11/08</td>
                                        <td className="px-6 py-4">RNIO85</td>
                                        <td className="px-6 py-4">True</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="text-right mt-2 text-xs font-bold text-slate-500 pr-4">12</div>
                </div>

                {/* Accommodation Section */}
                <div>
                    <SectionHeader title="Accommodation" />
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[900px]">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        {['Hotel Name', 'Check-In', 'Check-Out', 'Nights', 'Type', 'QTY', 'Rate', 'Net'].map((h, i) => (
                                            <th key={i} className={`px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wide ${i >= 6 ? 'text-right' : ''}`}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                                    <tr>
                                        <td className="px-6 py-4 font-bold text-slate-800">Hotel SAMA-BAT / SIMILAR</td>
                                        <td className="px-6 py-4">21/01/2024</td>
                                        <td className="px-6 py-4">29/01/2024</td>
                                        <td className="px-6 py-4 text-center">8</td>
                                        <td className="px-6 py-4">Tri Bed</td>
                                        <td className="px-6 py-4 text-center">1</td>
                                        <td className="px-6 py-4 text-right">SAR 12</td>
                                        <td className="px-6 py-4 text-right">SAR 250</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-4 font-bold text-slate-800">Hotel SAMA-BAT / SIMILAR</td>
                                        <td className="px-6 py-4">29/01/2024</td>
                                        <td className="px-6 py-4">05/02/2024</td>
                                        <td className="px-6 py-4 text-center">7</td>
                                        <td className="px-6 py-4">Tri Bed</td>
                                        <td className="px-6 py-4 text-center">1</td>
                                        <td className="px-6 py-4 text-right">0</td>
                                        <td className="px-6 py-4 text-right">0</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-4 font-bold text-slate-800">Hotel SAMA-BAT / SIMILAR</td>
                                        <td className="px-6 py-4">29/01/2024</td>
                                        <td className="px-6 py-4">03/02/2024</td>
                                        <td className="px-6 py-4 text-center">5</td>
                                        <td className="px-6 py-4">Tri Bed</td>
                                        <td className="px-6 py-4 text-center">1</td>
                                        <td className="px-6 py-4 text-right">SAR 12</td>
                                        <td className="px-6 py-4 text-right">SAR 150</td>
                                    </tr>
                                    <tr className="bg-slate-50/50">
                                        <td colSpan={3} className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Total Accommodation</td>
                                        <td className="px-6 py-3 text-center text-xs font-bold text-slate-800">20</td>
                                        <td colSpan={3}></td>
                                        <td className="px-6 py-3 text-right text-xs font-bold text-slate-800">SAR 400</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Transportation Section */}
                <div>
                    <SectionHeader title="Transportation" />
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[600px]">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        {['Vehicle type', 'Route', 'Rate', 'QTY', 'Net'].map((h, i) => (
                                            <th key={i} className={`px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wide ${i >= 4 ? 'text-right' : ''}`}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                                    <tr>
                                        <td className="px-6 py-4 font-bold text-slate-800">Economy By Bus</td>
                                        <td className="px-6 py-4">R/T - Jed(A)-Mak(H)-Mad(H)-Mak(H)-Jed(A)</td>
                                        <td className="px-6 py-4 text-center">0</td>
                                        <td className="px-6 py-4 text-center">1</td>
                                        <td className="px-6 py-4 text-right">0</td>
                                    </tr>
                                    <tr className="bg-slate-50/50">
                                        <td colSpan={4} className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Total Transportation</td>
                                        <td className="px-6 py-3 text-right text-xs font-bold text-slate-800">0</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Umrah Visa & Tickets Rates Detail Section */}
                <div>
                    <SectionHeader title="Umrah Visa & Tickets Rates Detail" />
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white max-w-lg">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    {['Pax', 'Total Pax', 'Visa Rate', 'Ticket Rate'].map((h, i) => (
                                        <th key={i} className={`px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wide ${i >= 2 ? 'text-right' : ''}`}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                                <tr>
                                    <td className="px-6 py-4">Adult</td>
                                    <td className="px-6 py-4 text-center">2</td>
                                    <td className="px-6 py-4 text-right">SAR 510</td>
                                    <td className="px-6 py-4 text-right">PKR 120,000</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4">Child</td>
                                    <td className="px-6 py-4 text-center">1</td>
                                    <td className="px-6 py-4 text-right">SAR 215</td>
                                    <td className="px-6 py-4 text-right">PKR 120,000</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4">Infant</td>
                                    <td className="px-6 py-4 text-center">1</td>
                                    <td className="px-6 py-4 text-right">SAR 215</td>
                                    <td className="px-6 py-4 text-right">PKR 120,000</td>
                                </tr>
                                <tr className="bg-slate-50 font-bold text-slate-800">
                                    <td className="px-6 py-4 uppercase">Total</td>
                                    <td className="px-6 py-4 text-center">4</td>
                                    <td className="px-6 py-4 text-right">SAR 1472</td>
                                    <td className="px-6 py-4 text-right">PKR 480,000</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Invoice Details Section */}
                <div>
                    <SectionHeader title="Invoice Details" />
                    <div className="flex flex-col lg:flex-row justify-between gap-12 pl-2">

                        {/* Left Details */}
                        <div className="space-y-4 text-xs max-w-2xl">
                            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                                <span className="text-slate-500 font-bold">Booking Date: <span className="font-medium text-slate-800 ml-1">18/01/25</span></span>
                                <span className="text-slate-500 font-bold">Family Head: <span className="font-medium text-slate-800 uppercase ml-1">ARSLAN BILAL BILAL AHMAD</span></span>

                                <span className="text-slate-500 font-bold">Booking#: <span className="font-medium text-slate-800 ml-1">UB-161799</span></span>
                                <span className="text-slate-500 font-bold">Travel Date: <span className="font-medium text-slate-800 ml-1">SV.234 LHE JED 19 DEC 2024 23:20 01:20</span></span>

                                <span className="text-slate-500 font-bold">Invoice Date: <span className="font-medium text-slate-800 ml-1">18/01/25</span></span>
                                <span className="text-slate-500 font-bold">Return Date: <span className="font-medium text-slate-800 ml-1">SV.234 LHE JED 19 DEC 2024 23:20 01:20</span></span>
                            </div>
                        </div>

                        {/* Right Totals */}
                        <div className="space-y-3 text-right min-w-[350px]">
                            <div className="text-sm text-slate-500 font-bold mb-4">Total Pax: <span className="text-slate-900">3</span></div>

                            <div className="space-y-2 text-xs font-bold text-slate-600">
                                <div className="flex justify-between">
                                    <span>PKR Rate: Visa Rate @ 75.75 =</span>
                                    <span className="text-slate-900">PKR 117,716</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Tickets :</span>
                                    <span className="text-slate-900">PKR 480,000</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>PKR Rate: Hotel @ 75.75 =</span>
                                    <span className="text-slate-900">PKR 35,451</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>PKR Rate: Transport @ 75.75 =</span>
                                    <span className="text-slate-900">PKR 0</span>
                                </div>
                            </div>

                            <div className="pt-6 flex justify-end">
                                <button className="bg-blue-600 text-white text-sm font-bold py-3 px-8 rounded-xl shadow-lg shadow-blue-600/30 w-full md:w-auto">
                                    Net PKR = PKR 153,167
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Availability Checks */}
                    <div className="mt-8 pt-4 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-xs font-bold">
                            <span className="text-slate-900">Ticket Availability:</span>
                            <span className="text-emerald-500">Available</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold">
                            <span className="text-slate-900">Hotel Availability:</span>
                            <span className="text-emerald-500">Available</span>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex flex-wrap gap-4 mt-8 pt-4">
                    <button
                        onClick={onConfirm}
                        className="px-8 py-3 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95">
                        Confirm Order
                    </button>
                    <button
                        onClick={() => setIsRejectModalOpen(true)}
                        className="px-8 py-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-sm font-bold hover:bg-rose-100 hover:border-rose-200 transition-all active:scale-95">
                        Reject With Note
                    </button>
                    <button
                        onClick={onBack}
                        className="px-8 py-3 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-sm font-bold hover:bg-slate-200 hover:border-slate-300 transition-all active:scale-95">
                        Close
                    </button>
                </div>

            </div>
        </div>
    );
}
