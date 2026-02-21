import React from 'react';
import { ChevronLeft, Circle, Plane } from 'lucide-react';

export default function TicketPrintView() {
    return (
        <div className="min-h-screen bg-[#E5E7EB] py-8 px-4 font-sans text-slate-800 flex justify-center overflow-y-auto">

            {/* Main Print Card */}
            <div className="w-full max-w-4xl bg-white rounded-[32px] shadow-sm p-8 md:p-12 h-fit">

                {/* Top Actions Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
                    <button className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                        <ChevronLeft size={24} strokeWidth={2.5} />
                    </button>

                    <div className="flex flex-wrap gap-3">
                        <button className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md shadow-blue-600/20 transition-all active:scale-95">
                            Email
                        </button>
                        <button className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md shadow-blue-600/20 transition-all active:scale-95">
                            Print
                        </button>
                        <button className="px-6 py-2.5 bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95">
                            Download
                        </button>
                    </div>
                </div>

                {/* Header Information */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-12">
                    {/* Logo */}
                    <div className="flex items-center gap-1">
                        <h1 className="text-4xl font-black text-blue-600 tracking-tight">Saer</h1>
                        <span className="text-2xl font-black text-slate-400 mt-1">.pk</span>
                    </div>

                    {/* Agency Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4">
                        <div>
                            <p className="text-[10px] font-black text-slate-800 mb-0.5">Name:</p>
                            <p className="text-[10px] font-medium text-slate-500">92 World travel</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-800 mb-0.5">Agent Name:</p>
                            <p className="text-[10px] font-medium text-slate-500 leading-tight">Reman Rafique<br />+923631569595</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-800 mb-0.5">Address:</p>
                            <p className="text-[10px] font-medium text-slate-500 leading-tight">Hilltop town, Street<br />78, Gujranwala</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-800 mb-0.5">Code:</p>
                            <p className="text-[10px] font-medium text-slate-500">9236 626262</p>
                        </div>
                    </div>
                </div>

                {/* Tickets Detail Section */}
                <div className="mb-10">
                    <h2 className="text-xl font-black text-slate-800 mb-4">Tickets Detail</h2>

                    <div className="bg-[#EBF5FF] rounded-2xl flex flex-col md:flex-row relative">
                        {/* Left: Flight Route */}
                        <div className="flex-1 p-8 flex flex-col sm:flex-row justify-between items-center relative gap-6">

                            {/* Depart */}
                            <div className="text-center sm:text-left min-w-[120px]">
                                <p className="text-sm font-bold text-slate-500 mb-1">Depart</p>
                                <h3 className="text-4xl font-black text-slate-800 tracking-tight mb-1">20:15</h3>
                                <p className="text-sm font-semibold text-slate-400 mb-1">October 4, 225</p>
                                <p className="text-lg font-black text-slate-800">Sialkot(SKT)</p>
                            </div>

                            {/* Connector */}
                            <div className="flex flex-col items-center justify-center w-full px-4 relative mt-4 sm:mt-0">
                                <div className="flex items-center w-full gap-1 absolute top-1/2 -translate-y-1/2">
                                    <div className="h-px bg-slate-300 flex-1 border-t border-dashed border-slate-400"></div>
                                </div>
                                <div className="bg-[#EBF5FF] px-3 z-10 flex flex-col items-center">
                                    <Circle size={8} className="text-slate-800 fill-slate-800 mb-1" />
                                    <p className="text-[10px] font-black text-slate-800 whitespace-nowrap">1st Stop at Dubai</p>
                                    <p className="text-[9px] font-bold text-slate-400">4h 10m</p>
                                </div>
                            </div>

                            {/* Arrival */}
                            <div className="text-center sm:text-right min-w-[120px]">
                                <p className="text-sm font-bold text-slate-500 mb-1">Arrival</p>
                                <h3 className="text-4xl font-black text-slate-800 tracking-tight mb-1">2:15</h3>
                                <p className="text-sm font-semibold text-slate-400 mb-1">October 5, 225</p>
                                <p className="text-lg font-black text-slate-800">Muscat(MCT)</p>
                            </div>
                        </div>

                        {/* Dashed Divider */}
                        <div className="hidden md:block w-px border-l border-dashed border-blue-200 relative my-6"></div>
                        <div className="block md:hidden h-px border-t border-dashed border-blue-200 mx-6"></div>

                        {/* Right: Flight Meta */}
                        <div className="w-full md:w-64 p-8 flex flex-col justify-center">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                                <div className="text-center">
                                    <p className="text-sm font-black text-slate-800 mb-0.5">Confirm</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-black text-slate-800 mb-0.5">Economy (o)</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Class</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-black text-slate-800 mb-0.5">95LAHD</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PNR</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-black text-slate-800 mb-0.5">30.0 KG</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Baggage</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Passenger Details Section */}
                <div className="mb-10">
                    <h2 className="text-xl font-black text-slate-800 mb-4">Passenger Details</h2>

                    <div className="space-y-3">
                        {[1, 2, 3].map((num) => (
                            <div key={num} className="border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-sm transition-shadow">

                                <div className="flex items-center gap-8 w-full sm:w-auto">
                                    <div className="min-w-[50px]">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pex NO</p>
                                        <p className="text-xl font-black text-slate-800">0{num}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Traveler Name</p>
                                        <p className="text-sm font-black text-slate-800 underline decoration-slate-300 underline-offset-4">BILAL AHMAD MUHAMMAD NASIR</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-12 w-full sm:w-auto mt-2 sm:mt-0">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Agency PNR</p>
                                        <p className="text-sm font-black text-slate-800 underline decoration-slate-300 underline-offset-4">95LAHD</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fare</p>
                                        <p className="text-base font-black text-slate-800">Rs 120,000/</p>
                                    </div>
                                </div>

                            </div>
                        ))}
                    </div>
                </div>

                {/* Total Balance Section */}
                <div className="bg-[#EBF5FF] rounded-2xl p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
                    <h3 className="text-lg font-black text-slate-800">Total Balance</h3>

                    <div className="w-full md:w-80 space-y-4">
                        <div className="flex justify-between items-center border-b border-blue-100 pb-3">
                            <span className="text-sm font-black text-slate-700">Sub Total</span>
                            <span className="text-base font-black text-slate-800 underline decoration-slate-300 underline-offset-4">Rs 360,000/</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-blue-100 pb-3">
                            <span className="text-sm font-black text-slate-700">Paid</span>
                            <span className="text-base font-black text-blue-600 underline decoration-blue-200 underline-offset-4">Rs 360,000/</span>
                        </div>
                        <div className="flex justify-between items-center pt-1">
                            <span className="text-sm font-black text-slate-700">Pending</span>
                            <span className="text-lg font-black text-slate-800">Rs 0/</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Booking Date: <span className="font-black text-slate-800">18/01/25</span>
                    </p>
                </div>

            </div>
        </div>
    );
}
