import React from 'react';
import { Plane, Briefcase } from 'lucide-react';

const FlightCard = ({ airline, airlineLogo, flightNo, status, departure, arrival, duration, type, seatsStatus, price, features }) => (
    <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl transition-all group flex flex-col">
        <div className="p-8 lg:p-12">
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
                <div className="w-full lg:w-72 flex flex-row lg:flex-col items-center lg:items-start justify-between lg:justify-start gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white rounded-[20px] flex items-center justify-center p-2 border border-slate-100 shrink-0 shadow-md">
                            {airlineLogo ? <img src={airlineLogo} alt={airline} className="w-full h-full object-contain" /> : <Plane size={32} className="text-blue-600" />}
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{airline}</p>
                            <h3 className="text-2xl font-black text-blue-600 leading-none">{flightNo}</h3>
                        </div>
                    </div>
                    <span className="bg-green-100 text-green-700 text-[10px] font-black uppercase px-3 py-1 rounded-lg tracking-widest">{status}</span>
                </div>

                <div className="flex-1 flex items-center justify-between w-full max-w-3xl mx-auto px-4">
                    <div><p className="text-2xl lg:text-3xl font-black text-slate-900 leading-none">{departure.time}</p><p className="text-xs font-black text-slate-400 mt-2 uppercase tracking-widest">{departure.city}</p></div>
                    <div className="flex-1 flex flex-col items-center px-6 lg:px-12 relative group/line">
                        <span className="text-[10px] font-black text-slate-300 uppercase absolute -top-6 tracking-widest">{duration}</span>
                        <div className="w-full h-px bg-slate-200 relative"><div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 border-t-2 border-r-2 border-slate-200"></div></div>
                        <span className="text-[10px] font-black text-slate-300 uppercase absolute -bottom-6 tracking-widest">{type}</span>
                    </div>
                    <div className="text-right"><p className="text-2xl lg:text-3xl font-black text-slate-900 leading-none">{arrival.time}</p><p className="text-xs font-black text-slate-400 mt-2 uppercase tracking-widest">{arrival.city}</p></div>
                </div>

                <div className="w-full lg:w-48 text-right flex lg:flex-col justify-between items-center lg:items-end">
                    <span className="text-xs font-black text-slate-300 uppercase tracking-[3px] hidden lg:block">{type}</span>
                    <div className={`px-4 py-2 rounded-2xl border-2 font-black uppercase tracking-widest text-[10px] ${seatsStatus.includes('No') ? 'bg-red-50 text-red-500 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                        {seatsStatus}
                    </div>
                </div>
            </div>
        </div>
        <div className="bg-slate-50 px-8 lg:px-12 py-8 border-t border-slate-100 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex flex-wrap justify-center lg:justify-start items-center gap-4">
                <div className="px-4 py-1.5 bg-blue-100 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-[2px]">{features[0]}</div>
                <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest"><Briefcase size={16} /> {features[1]}</div>
            </div>
            <div className="flex items-center justify-between w-full lg:w-auto gap-8 lg:gap-12 border-t lg:border-t-0 pt-6 lg:pt-0">
                <div className="text-left lg:text-right">
                    <p className="text-3xl font-black text-slate-900 tracking-tighter">PKR {price}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px]">/ Per Passenger</p>
                </div>
                <button className={`px-12 py-4 rounded-[20px] font-black uppercase text-xs tracking-[4px] shadow-2xl transition-all ${seatsStatus.includes('No') ? 'bg-slate-300 text-white cursor-not-allowed shadow-slate-100' : 'bg-blue-600 text-white shadow-blue-100 hover:scale-[1.05] hover:rotate-1'}`} disabled={seatsStatus.includes('No')}>
                    {seatsStatus.includes('No') ? 'Sold Out' : 'Issue Ticket'}
                </button>
            </div>
        </div>
    </div>
);

export default FlightCard;
