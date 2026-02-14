import React from 'react';
import { HardDrive } from 'lucide-react';

const OrderStatusTracker = ({ label, total, done, booked, cancelled }) => (
    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm transition-all hover:shadow-lg">
        <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner"><HardDrive size={20} /></div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Total {label} Portfolio</p>
                <h4 className="text-2xl font-black text-slate-900 leading-none mt-1">{total}</h4>
            </div>
        </div>
        <div className="h-3 bg-slate-50 rounded-full overflow-hidden flex mb-6 shadow-inner">
            <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${(done / total) * 100}%` }}></div>
            <div className="h-full bg-blue-300 transition-all duration-1000" style={{ width: `${(booked / total) * 100}%` }}></div>
            <div className="h-full bg-slate-900 transition-all duration-1000" style={{ width: `${(cancelled / total) * 100}%` }}></div>
        </div>
        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-blue-600 rounded-full shadow-lg"></div> Done</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-blue-300 rounded-full"></div> Booked</div>
        </div>
    </div>
);

export default OrderStatusTracker;
